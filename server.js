import express from "express";
import dotenv from "dotenv"
import authRoute from "./routes/auth/authroute.js";
import userRoute from "./routes/users/userProfile.Route.js";
import cors from "cors"
import freelancerRoute from "./routes/freelancer/freelancer.route.js";
import gigsRoute from "./routes/gigs/gigs.route.js";
import clientRoute from "./routes/client/client.route.js";
import jobsRoute from "./routes/jobs/jobs.route.js";
const app = express();
const port = process.env.PORT || 3000
app.use(cors())
app.use(express.json())

dotenv.config()

app.use('/api/auth', authRoute)
app.use('/api/users', userRoute)
app.use('/api/freelancer', freelancerRoute)
app.use('/api/gigs', gigsRoute)
app.use('/api/client', clientRoute)
app.use('/api/jobs', jobsRoute)

app.listen(port,(err)=>{
    if(!err){
        console.log(`Server is running in port ${port}`)
    }
    else{
        console.log("Error in running the server");
    }
})