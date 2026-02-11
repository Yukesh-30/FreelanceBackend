import express from "express";
import dotenv from "dotenv"
import authRoute from "./routes/auth/authroute.js";
import cors from "cors"
const app = express();
const port = process.env.PORT || 3000
app.use(cors())
app.use(express.json())

dotenv.config()

app.use('/api/auth',authRoute)

app.listen(port,(err)=>{
    if(!err){
        console.log(`Server is running in port ${port}`)
    }
    else{
        console.log("Error in running the server");
    }
})