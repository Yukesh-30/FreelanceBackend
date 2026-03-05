import express from "express";
import dotenv from "dotenv"
import authRoute from "./routes/auth/authroute.js";
import userRoute from "./routes/users/userProfile.Route.js";
import cors from "cors"
import freelancerRoute from "./routes/freelancer/freelancer.route.js";
import gigsRoute from "./routes/gigs/gigs.route.js";
import clientRoute from "./routes/client/client.route.js";
import jobsRoute from "./routes/jobs/jobs.route.js";
import contractRoute from "./routes/contract/contract.Route.js";
import ordersRoute from "./routes/orders/orders.route.js";
import SubmissionRouter from "./routes/submission/submission.route.js";
import chatRoute from "./routes/chat/chat.route.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { initChatSocket } from "./socket/chatSocket.js";
import connectDB from "./config/mongo.connect.js";

const app = express();
const port = process.env.PORT || 3000

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
initChatSocket(io);

app.use(cors())
app.use(express.json())

dotenv.config()

connectDB()

app.use('/api/auth', authRoute)
app.use('/api/users', userRoute)
app.use('/api/freelancer', freelancerRoute)
app.use('/api/gigs', gigsRoute)
app.use('/api/client', clientRoute)
app.use('/api/jobs', jobsRoute)
app.use('/api/contract', contractRoute)
app.use('/api/orders', ordersRoute)
app.use('/api/submission', SubmissionRouter)
app.use('/api/chat', chatRoute)

httpServer.listen(port, (err) => {
    if (!err) {
        console.log(`Server is running in port ${port}`)
    }
    else {
        console.log("Error in running the server");
    }
})