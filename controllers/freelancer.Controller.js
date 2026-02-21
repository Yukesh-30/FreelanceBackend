import sql from "../db/dbConfig.js"
import {z} from "zod"

const freelancerDetailSchema = z.object({
    bio: z.string().trim().optional(),
    hourly_rate: z.number().positive().optional(),
    total_earnings: z.number().nonnegative().optional()
});
const skillsSchema = z.object({
    skills : z.array(z.string())
});
const getFreelancerDetails = async (req,res) => {
    const id = req.params.id
    
    try {
        const users = await sql`SELECT * FROM freelancer_profiles where user_id=${id}`

        if(users.length===0){
            return res.status(404).json({
                message : "User not found"
            })
        }

        const information = {
            bio : users[0].bio,
            skills : users[0].skills,
            hourly_rate : users[0].hourly_rate,
            total_earnings : users[0].total_earnings,
            rating : users[0].rating,
            review_count : users[0].review_count

        }

        return res.status(200).json({
            information
        })


    } catch (error) {
        return res.status(500).json({
            message : "Internal server error"
        })
    }
}

const updateFreelancerProfile = async (req, res) => {
    const id = req.params.id
    const validation = freelancerDetailSchema.safeParse(req.body)

    if(!validation.success){
        return res.status(400).json({
            message : "Bad request. Check the format"
        })
    }
    let { bio, hourly_rate, total_earnings } = validation.data

    try {
        const users = await sql`
            SELECT * FROM freelancer_profiles WHERE user_id = ${id}
        `

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        const existingUser = users[0]

        bio = bio ?? existingUser.bio
        hourly_rate = hourly_rate ?? existingUser.hourly_rate
        total_earnings = total_earnings ?? existingUser.total_earnings

        await sql`
            UPDATE freelancer_profiles 
            SET bio=${bio}, 
                hourly_rate=${hourly_rate}, 
                total_earnings=${total_earnings} 
            WHERE user_id=${id}
        `

        return res.status(200).json({
            message: "Updated successfully"
        })

    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}

const updateFreelancerSkills = async (req,res) =>{
    const id = req.params.id
    const validation = skillsSchema.safeParse(req.body)
    console.log(id)
    if(!validation.success){
        return res.status(400).json({
            message : "Bad request. Check the format"
        })
    }

    try {
        const  {skills}  = validation.data
        console.log(skills)

        await sql`UPDATE freelancer_profiles SET skills=${skills} where user_id=${id}`

        res.status(200).json({
            message : "Skills updated successfully"
        })
        
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}


export {getFreelancerDetails,updateFreelancerProfile,updateFreelancerSkills}