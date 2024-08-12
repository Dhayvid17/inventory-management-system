import mongoose, { ConnectOptions } from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

const dbUri = process.env.DB_URI;

if (!dbUri) {
  throw new Error("DB_URI environment variable is not set");
}

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(dbUri, {} as ConnectOptions);
    console.log("Connected to database");
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
};

export { connectDB };
