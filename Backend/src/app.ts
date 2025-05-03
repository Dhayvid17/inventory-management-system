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
import staffAssignmentRoute from "./routes/staffAssignmentRoute";
import transferRequestRoute from "./routes/transferRequestRoute";
import warehouseInventoryRoute from "./routes/warehouseInventoryRoute";
import orderNotificationRoute from "./routes/orderNotificationRoute";
import notificationRoute from "./routes/notificationRoute";
import reviewRoute from "./routes/reviewRoute";
import supportTicketRoute from "./routes/supportTicketRoute";
import reportingAnalyticsRoute from "./routes/reportingRoute";
import balanceSheetRoute from "./routes/balanceSheetRoute";

import { errorHandler } from "./middlewares/errorMiddleware";
import cors from "cors";

dotenv.config();

//Initialize Express and Middleware
const app: Application = express();
app.use(express.json());

//Enable CORS with app
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://inventory-client-tps0.onrender.com",
      "https://inventory-management-system-ten-lake.vercel.app",
      "https://inventory-management-system-otvq4ja5v-davids-projects-93244fec.vercel.app",
    ],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

//MIDDLEWARE SETUP FOR ALL ROUTES

//Middleware Route for Categories
app.use("/api", categoryRoute);

//Middleware Route for Inventory Transactions
app.use("/api", inventoryTransactionRoute);

//Middleware Route for Orders
app.use("/api", orderRoute);

//Middleware Route for Products
app.use("/api", productRoute);

//Middleware Route for Suppliers
app.use("/api", supplierRoute);

//Middleware Route for Users
app.use("/api", userRoute);

//Middleware Route for Warehouses
app.use("/api", warehouseRoute);

//Middleware Route for Staff Assignment
app.use("/api", staffAssignmentRoute);

//Middleware Route for Transfer Requests
app.use("/api", transferRequestRoute);

//Middleware Route for Warehouse Inventory
app.use("/api", warehouseInventoryRoute);

//Middleware Route for Order Notification
app.use("/api", orderNotificationRoute);

//Middleware Route for All Notifications
app.use("/api", notificationRoute);

//Middleware Route for Review
app.use("/api", reviewRoute);

//Middleware Route for Support Ticket
app.use("/api", supportTicketRoute);

//Middleware Route for Reporting Analytics
app.use("/api", reportingAnalyticsRoute);

//Middleware Route for Balance Sheet
app.use("/api", balanceSheetRoute);

//Middleware to handle errors
app.use(errorHandler);

//Database connection & Server start
const PORT = process.env.PORT || 8000;
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

export default app;
