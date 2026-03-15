import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose"
const MONGO_URI = process.env.MONGO_URI
export const connectDb = async () => {
    try {
        const conn = mongoose.connect(MONGO_URI)
        console.log(`Mongoose connected ${MONGO_URI}`)
    } catch (error) {
        console.log("mongoose not connected")
    }
}