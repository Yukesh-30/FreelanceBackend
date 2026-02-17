import sql from "../db/dbConfig.js"

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

const userDetailUpdate = async (req,res) =>{
    let {full_name,profile_pic_url} = req.body
    const id = req.params.id
    
    try {
        const user = await sql`SELECT * FROM users WHERE id = ${id}`
        if(user.length===0){
            return res.status(400).json({
                message : "User not found"
            })
        }

        if(full_name===undefined){
            full_name = user[0].full_name
        }
        if(profile_pic_url===undefined){
            profile_pic_url = user[0].profile_pic_url
        }
        
        await sql`
            UPDATE users 
            SET 
                full_name = ${full_name},
                profile_pic_url = ${profile_pic_url},
                updated_at = NOW() 
            WHERE id = ${id}
            `;

        res.status(200).json({
            message:"user details updated"
        })
    } catch (error) {
        res.status(500).json({
            message : "Internal sever error"
        })
    }


}

export {userProfileDetails,userDetailUpdate}