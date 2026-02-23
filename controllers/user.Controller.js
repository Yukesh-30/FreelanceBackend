import sql from "../config/dbConfig.js"
import {z} from "zod"
import cloudinary from "../config/cloudnary.config.js";


const userDetailSchema = z.object({
    full_name: z.string().trim().max(20).optional(),
    profile_pic_url: z.string().url().optional()
});

const userProfileDetails = async (req, res) => {
    const userId = req.params.id;
    
    try {
        const userDetail = await sql`SELECT * FROM users where id=${userId}`;

        if (userDetail.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Extracting and formatting the date
        const dateObj = new Date(userDetail[0].created_at);
        const memberSince = dateObj.toLocaleString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        }); // Result: "September 2025"

        const infomations = {
            email: userDetail[0].email,
            full_name: userDetail[0].full_name,
            role: userDetail[0].role,
            profile_url: userDetail[0].profile_url,
            is_verified: userDetail[0].is_verified,
            member_since: memberSince // Adding the new field here
        };

        res.status(200).json({
            message: `Information found for ${infomations.full_name}`,
            infomations
        });

    } catch (error) {
        console.error(error); 
        res.status(500).json({
            message: "Internal server error"
        });
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
const updateProfilePicture = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Profile image is required" });
    }
    const user = await sql`
      SELECT * FROM users WHERE id = ${userId}
    `;

    if (user.length === 0) {
      return res.status(404).json({ message: "Freelancer not found" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      public_id: `freelancers/profile_images/user_${userId}`,
      overwrite: true,
      resource_type: "image"
    });

    const updatedUser = await sql`
      UPDATE users
      SET profile_pic_url = ${result.secure_url}
      WHERE id = ${userId}
    `;

    return res.status(200).json({
      message: "Profile picture updated successfully",
      
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};


export {userProfileDetails,userDetailUpdate,updateProfilePicture}