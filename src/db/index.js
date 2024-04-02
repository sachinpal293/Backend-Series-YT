import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
import chalk from "chalk";

const connectDB = async () =>{

    try {
        const   connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(chalk.bgMagenta(`\n MongoDB connected  !! DB HOST : ${connectionInstance.connection.host}`))
    } catch (error) {
        console.log("MongoDb Error : ", error)
        process.exit(1)
    }
}

export default connectDB