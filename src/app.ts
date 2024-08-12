import express, { Request, Response } from "express";
import { connectDB } from "./db";

const app: express.Application = express();
const PORT = process.env.PORT;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    console.log("Database Connected");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error: any) {
    console.log("Could not connect to database");
    process.exit(1);
  }
};

startServer();

// Routes
app.get("/api", (req: Request, res: Response) => {
  try {
    res.status(200).send("MEN MOUNT");
    console.log("API endpoint connected");
  } catch (error: any) {
    res.status(400).send("No go area");
  }
});
