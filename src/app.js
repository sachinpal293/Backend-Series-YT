import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();

app.use(cors(
    {
        origin: process.env.CORS_ORIGINE,
        credentials:true
    }
))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true, limit : "16kb"}))
app.use(express.static("public"))

app.use(cookieParser())


// routes import
import userRoute from "./routes/user.routes.js"
import videoRoute from "./routes/video.routes.js"

// route declration
app.use("/api/v1/user",userRoute)
app.use("/api/v1/user",videoRoute)


export {app};