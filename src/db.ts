import mongoose, { ConnectOptions } from "mongoose";
import { config } from "dotenv";
// {} as ConnectOptions
config();

const dbUri = process.env.DB_URI;

if (!dbUri) {
  throw new Error("DB_URI environment variable is not set");
}

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(dbUri);
    console.log("Connected to database");
  } catch (error) {
    console.error("Failed to connect to database:", error);
    console.log("Could not connect to the database");
  }
};

export { connectDB };
