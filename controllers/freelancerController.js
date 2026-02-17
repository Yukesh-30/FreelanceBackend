import sql from "../db/dbConfig.js"

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
    let { bio, hourly_rate, total_earnings } = req.body

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


export {getFreelancerDetails,updateFreelancerProfile}