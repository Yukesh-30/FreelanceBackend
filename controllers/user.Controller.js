import sql from "../db/dbConfig.js"
import {z} from "zod"


const userDetailSchema = z.object({
    full_name: z.string().trim().max(20).optional(),
    profile_pic_url: z.string().url().optional()
});

const userProfileDetails = async (req,res) =>{
    const userId = req.params.id
    
    try {
        const userDetail = await sql`SELECT * FROM users where id=${userId}`


        if(userDetail.length===0){
            return res.status(404).json({
                message : "User not found"
            })
        }

        const infomations = {
            email : userDetail[0].email,
            full_name:userDetail[0].full_name,
            role : userDetail[0].role,
            profile_url : userDetail[0].profile_url,
            is_verified : userDetail[0].is_verified
        }

        res.status(200).json({
            message: `Information found for ${infomations.full_name}`,
            infomations
        })

    } catch (error) {
        res.status(500).json({
            message:"Internal server error"
        })
    }
}

const userDetailUpdate = async (req, res) => {
    const validation = userDetailSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            message : "Bad request. Check the format"
        })
    }

    const id = req.params.id;
    

    try {
        const user = await sql`SELECT * FROM users WHERE id = ${id}`;

        if (user.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const full_name = validation.data.full_name ?? user[0].full_name;
        const profile_pic_url = validation.data.profile_pic_url ?? user[0].profile_pic_url;

        await sql`
            UPDATE users 
            SET 
                full_name = ${full_name},
                profile_pic_url = ${profile_pic_url},
                updated_at = NOW()
            WHERE id = ${id}
        `;

        return res.status(200).json({
            message: "User details updated"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export {userProfileDetails,userDetailUpdate}