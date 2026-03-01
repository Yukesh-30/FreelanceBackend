import sql from '../config/dbConfig.js'
import { z } from 'zod'
import { internelServerError } from '../helper/response.js'

const applyJobSchema = z.object({
    freelancer_id: z.uuid(),
    cover_letter: z.string().min(10).max(500),
    proposed_budget: z.number(),
    estimated_days: z.number()
})

const statusSchema = z.object({
    status: z.enum(['APPLIED', 'SHORTLISTED', 'REJECTED', 'HIRED'])
}
)
//Flow A
//freelacer can apply for particular job
const applyForJobById = async (req, res) => {
    const jobId = req.params.id;
    const validation = applyJobSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            message: "Bad Request",
            errors: validation.error.errors
        });
    }

    const { freelancer_id, cover_letter, proposed_budget, estimated_days } = validation.data;
    const status = "APPLIED";

    try {
        await sql`INSERT INTO job_applications (
            job_id, 
            freelancer_id, 
            cover_letter, 
            proposed_rate, 
            estimated_days, 
            status
        ) VALUES (
            ${jobId},
            ${freelancer_id},
            ${cover_letter},
            ${proposed_budget},
            ${estimated_days},
            ${status}
        )`;

        return res.status(201).json({
            message: "Applied successfully"
        });
    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ message: internelServerError() });
    }
}

const getAllApplicationByJobId = async (req, res) => {
    const id = req.params.id

    try {
        const job_applications = await sql`SELECT * FROM job_applications where job_id=${id}`
        if (job_applications.length === 0) {
            return res.status(404).json({
                message: "There is no application found"
            })
        }
        return res.status(200).json({
            job_applications
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: internelServerError() });
    }
}

const statusUpdate = async (req, res) => {
    const applicationId = req.params.id;
    const validation = statusSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            message: "Bad request format",
            errors: validation.error.errors
        });
    }

    const { status: newStatus } = validation.data;

    try {
        await sql`BEGIN`;

        const apps = await sql`
            UPDATE job_applications 
            SET status = ${newStatus}
            WHERE id = ${applicationId} 
            RETURNING job_id, freelancer_id, proposed_rate, estimated_days
        `;

        if (apps.length === 0) {
            await sql`ROLLBACK`;
            return res.status(404).json({ message: "Application not found" });
        }

        const application = apps[0];

        if (newStatus === 'HIRED') {
            const jobs = await sql`
                SELECT client_id FROM jobs WHERE id = ${application.job_id}
            `;

            if (jobs.length > 0) {
                const job = jobs[0];
                await sql`
                    INSERT INTO contracts (
                        client_id, 
                        freelancer_id, 
                        job_id, 
                        total_amount, 
                        status, 
                        start_date,
                        end_date
                    ) VALUES (
                        ${job.client_id}, 
                        ${application.freelancer_id}, 
                        ${application.job_id}, 
                        ${application.proposed_rate}, 
                        'ACTIVE', 
                        NOW(),
                        NOW() + (${application.estimated_days} || 0) * INTERVAL '1 day'
                    )
                `;
            }

            await sql`
                UPDATE job_applications 
                SET status = 'REJECTED'
                WHERE job_id = ${application.job_id} 
                AND id != ${applicationId}
            `;
        }

        await sql`COMMIT`;

        return res.status(200).json({
            message: newStatus === 'HIRED'
                ? "Hired successfully! Contract created and other applicants rejected."
                : "Status updated successfully."
        });

    } catch (error) {
        await sql`ROLLBACK`;
        console.error("Transaction Error:", error);
        return res.status(500).json({ message: internelServerError() });
    }
};

//Flow B

const orderGigSchema = z.object({
    client_id: z.string().uuid(),
    message: z.string().min(5).max(1000),
    package_id: z.string().uuid().optional(), // optional depending on if frontend sends it
    package_type: z.enum(['BASIC', 'STANDARD', 'PREMIUM']).optional()
});

const acceptOrderSchema = z.object({
    freelancer_id: z.string().uuid(),
    status: z.enum(['ACCEPTED', 'REJECTED'])
});

const createGigOrder = async (req, res) => {
    const gig_id = req.params.id;


    const validation = orderGigSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({
            message: "Bad request format",
            errors: validation.error.errors
        });
    }

    const { client_id, message, package_id, package_type } = validation.data;

    try {
        // Fetch gig
        const gigs = await sql`SELECT * FROM gigs WHERE id = ${gig_id}`;
        if (gigs.length === 0) {
            return res.status(404).json({ message: "Gig not found" });
        }
        const gig = gigs[0];

        if (gig.freelancer_id === client_id) {
            return res.status(403).json({ message: "Client cannot order their own gig" });
        }
        let pkg;
        if (package_id) {
            const pkgs = await sql`SELECT * FROM gigpackage WHERE id = ${package_id} AND gig_id = ${gig_id}`;
            pkg = pkgs[0];
        } else if (package_type) {
            const pkgs = await sql`SELECT * FROM gigpackage WHERE package_type = ${package_type} AND gig_id = ${gig_id}`;
            pkg = pkgs[0];
        } else {
            // Default to 'BASIC' or the first available package
            const pkgs = await sql`SELECT * FROM gigpackage WHERE gig_id = ${gig_id} ORDER BY price ASC LIMIT 1`;
            pkg = pkgs[0];
        }

        if (!pkg) {
            return res.status(400).json({ message: "No valid package found for this gig" });
        }

        const price_snapshot = pkg.price;
        const delivery_days_snapshot = pkg.delivery_days;
        const status = 'PENDING';

        await sql`
            INSERT INTO gig_orders (
                gig_id,
                client_id,
                freelancer_id,
                message,
                price_snapshot,
                delivery_days_snapshot,
                status
            ) VALUES (
                ${gig_id},
                ${client_id},
                ${gig.freelancer_id},
                ${message},
                ${price_snapshot},
                ${delivery_days_snapshot},
                ${status}
            )
        `;

        return res.status(201).json({ message: "Gig order placed successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: internelServerError() });
    }
};

const getFreelancerOrders = async (req, res) => {
    const freelancer_id = req.body.freelancer_id;

    try {
        const orders = await sql`SELECT * FROM gig_orders WHERE freelancer_id = ${freelancer_id}`;
        if (orders.length === 0) {
            return res.status(404).json({ message: "No orders found" });
        }

        return res.status(200).json({ orders });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: internelServerError() });
    }
};

const updateGigOrderStatus = async (req, res) => {
    const order_id = req.params.id;


    const validation = acceptOrderSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: "Invalid status", errors: validation.error.errors });
    }

    const { freelancer_id, status: newStatus } = validation.data;

    try {
        await sql`BEGIN`;

        const orders = await sql`SELECT * FROM gig_orders WHERE id = ${order_id}`;
        if (orders.length === 0) {
            await sql`ROLLBACK`;
            return res.status(404).json({ message: "Order not found" });
        }

        const order = orders[0];

        if (order.freelancer_id !== freelancer_id) {
            await sql`ROLLBACK`;
            return res.status(403).json({ message: "Forbidden: Only the gig owner can update order status" });
        }
        if (order.status !== 'PENDING') {
            await sql`ROLLBACK`;
            return res.status(400).json({ message: "Order status is already resolved" });
        }

        if (newStatus === 'REJECTED') {
            await sql`UPDATE gig_orders SET status = 'REJECTED' WHERE id = ${order_id}`;
            await sql`COMMIT`;
            return res.status(200).json({ message: "Order rejected" });
        }

        // newStatus === 'ACCEPTED'

        // Ensure no ACTIVE contract already exists for (client_id, freelancer_id, gig_id)
        const existingContracts = await sql`
            SELECT id FROM contracts 
            WHERE client_id = ${order.client_id} 
              AND freelancer_id = ${order.freelancer_id} 
              AND gig_id = ${order.gig_id} 
              AND status = 'ACTIVE'
        `;

        if (existingContracts.length > 0) {
            await sql`ROLLBACK`;
            return res.status(400).json({ message: "An active contract already exists for this gig and client" });
        }

        // Update gig_orders.status = ACCEPTED
        await sql`UPDATE gig_orders SET status = 'ACCEPTED' WHERE id = ${order_id}`;

        // Insert new row in contracts
        await sql`
            INSERT INTO contracts (
                client_id,
                freelancer_id,
                gig_id,
                total_amount,
                status,
                start_date,
                end_date
            ) VALUES (
                ${order.client_id},
                ${order.freelancer_id},
                ${order.gig_id},
                ${order.price_snapshot},
                'ACTIVE',
                NOW(),
                NOW() + (${order.delivery_days_snapshot} || 0) * INTERVAL '1 day'
            )
        `;

        await sql`COMMIT`;
        return res.status(200).json({ message: "Order accepted and contract created" });
    } catch (error) {
        await sql`ROLLBACK`;
        console.error(error);
        return res.status(500).json({ message: internelServerError() });
    }
};

const getFreelancerApplications = async (req, res) => {
    const freelancer_id = req.params.id;
    try {
        const applications = await sql`
            SELECT ja.*, j.title as job_title 
            FROM job_applications ja
            JOIN jobs j ON ja.job_id = j.id
            WHERE ja.freelancer_id = ${freelancer_id}
            ORDER BY ja.created_at DESC
        `;
        return res.status(200).json({ applications });
    } catch (error) {
        console.error("Error fetching freelancer applications:", error);
        return res.status(500).json({ message: internelServerError() });
    }
};

const getFreelancerContracts = async (req, res) => {
    const freelancer_id = req.params.id;
    try {
        const contracts = await sql`
            SELECT c.*, j.title as job_title, g.title as gig_title 
            FROM contracts c
            LEFT JOIN jobs j ON c.job_id = j.id
            LEFT JOIN gigs g ON c.gig_id = g.id
            WHERE c.freelancer_id = ${freelancer_id} 
              AND c.status = 'ACTIVE'
            ORDER BY c.start_date ASC
        `;
        return res.status(200).json({ contracts });
    } catch (error) {
        console.error("Error fetching freelancer contracts:", error);
        return res.status(500).json({ message: internelServerError() });
    }
};

export {
    applyForJobById,
    getAllApplicationByJobId,
    statusUpdate,
    createGigOrder,
    getFreelancerOrders,
    updateGigOrderStatus,
    getFreelancerApplications,
    getFreelancerContracts
}