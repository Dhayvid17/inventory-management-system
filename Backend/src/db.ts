import mongoose from "mongoose";
import { config } from "dotenv";

config();

const dbUri = process.env.DB_URI;

if (!dbUri) {
  throw new Error("DB_URI environment variable is not set");
}

const connectDB = async () => {
  try {
    await mongoose.connect(dbUri);
    console.log("Connected to database");

    //Setup event listeners for runtime errors
    mongoose.connection.on("disconnected", handleDisconnect);
    mongoose.connection.on("error", handleConnectionError);
  } catch (error: any) {
    console.error("Failed to connect to database:", error);
    console.log("Could not connect to the database");
    setTimeout(connectDB, 5000); //Retry connection after 5 seconds
  }
};

const handleDisconnect = () => {
  console.warn("Lost MongoDB connection. Attempting to reconnect...");
  setTimeout(connectDB, 5000); //Retry connection after 5 seconds
};

const handleConnectionError = (error: any) => {
  console.error("Error with MongoDB connection:", error);
  if (error.message.includes("ESERVFAIL")) {
    //If it's a DNS resolution issue, retry connection
    setTimeout(connectDB, 5000);
  } else {
    console.error("Non-DNS related error occurred.");
  }
};

export { connectDB };
