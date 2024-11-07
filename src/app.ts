import express, { Application } from "express";
import { connectDB } from "./db";
import * as dotenv from "dotenv";

import categoryRoute from "./routes/categoryRoute";
import inventoryTransactionRoute from "./routes/inventoryTransactionRoute";
import orderRoute from "./routes/orderRoute";
import productRoute from "./routes/productRoute";
import supplierRoute from "./routes/supplierRoute";
import userRoute from "./routes/userRoute";
import warehouseRoute from "./routes/warehouseRoute";
import regularWarehouseRoute from "./routes/regularWarehouseRoute";
import superWarehouseRoute from "./routes/superWarehouseRoutes";
import staffAssignmentRoute from "./routes/staffAssignmentRoute";
import transferRequestRoute from "./routes/transferRequestRoute";
import warehouseInventoryRoute from "./routes/warehouseInventoryRoute";
import orderNotificationRoute from "./routes/orderNotificationRoute";
import notificationRoute from "./routes/notificationRoute";
import reviewRoute from "./routes/reviewRoute";
import supportTicketRoute from "./routes/supportTicketRoute";

import { errorHandler } from "./middlewares/errorMiddleware";
import cors from "cors";

dotenv.config();

//Initialize Express and Middleware
const app: Application = express();
app.use(express.json());

//Enable CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

const PORT = process.env.PORT || 8000;

//Database connection
const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    console.log("Database Connected");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error: any) {
    console.error("Could not connect to database on startServer", error);
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

//Middleware Route for Regular Warehouses
app.use("/api", regularWarehouseRoute);

//Middleware Route for Super Warehouses
app.use("/api", superWarehouseRoute);

//Middleware Route for Staff Assignment
app.use("/api", staffAssignmentRoute);

//Middleware Route for Transfer Request
app.use("/api", transferRequestRoute);

//Middleware Route for Warehouse Inventory
app.use("/api", warehouseInventoryRoute);

//Middleware Route for Order Notification
app.use("/api", orderNotificationRoute);

//Middleware Route for All Notification
app.use("/api", notificationRoute);

//Middleware Route for Review
app.use("/api", reviewRoute);

//Middleware Route for Support Ticket
app.use("api", supportTicketRoute);

//Middleware to handle errors
app.use(errorHandler);

export default app;
