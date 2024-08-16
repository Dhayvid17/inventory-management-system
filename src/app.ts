import express from "express";
import { connectDB } from "./db";
import * as dotenv from "dotenv";

import categoryRoute from "./routes/categoryRoute";
import inventoryTransactionRoute from "./routes/inventoryTransactionRoute";
import orderRoute from "./routes/orderRoute";
import productRoute from "./routes/productRoute";
import supplierRoute from "./routes/supplierRoute";
import userRoute from "./routes/userRoute";
import warehouseRoute from "./routes/warehouseRoute";

import { errorHandler } from "./middlewares/errorMiddleware";

dotenv.config();

//Initialize Express and Middleware
const app: express.Application = express();
app.use(express.json());

const PORT = process.env.PORT;

//Database connection
const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    console.log("Database Connected");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error: any) {
    console.error("Could not connect to database");
    setTimeout(startServer, 5000);
  }
};

startServer();

//Middleware Route for Categories
app.use("/api", categoryRoute);

//Middleware Route for Inventory Transactions
app.use("/api", inventoryTransactionRoute);

//Middleware Route for Orders
app.use("/api", orderRoute);

//Middleware Route for Product
app.use("/api", productRoute);

//Middleware Route for Suppliers
app.use("/api", supplierRoute);

//Middleware Route for Users
app.use("/api", userRoute);

//Middleware Route for Warehouses
app.use("/api", warehouseRoute);

//Middleware to handle errors
app.use(errorHandler);

export default app;
