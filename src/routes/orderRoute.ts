import express, { Router } from "express";
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  getOrderHistory,
  cancelOrder,
} from "../controllers/orderController";
import {
  authenticateToken,
  authorizeAdmin,
  authorizeStaff,
} from "../middlewares/authentication";

//Initialize Router
const router: Router = express.Router();

//ROUTES FOR ORDERS

//GET ALL ORDERS
router.get("/orders", getOrders);

//GET A SPECIFIC ORDER
router.get("/orders/:id", getOrder);

//CREATE A NEW ORDER
router.post("/orders", createOrder);

//UPDATE AN ORDER
router.put("/orders/:id", updateOrder);

//CANCEL AN ORDER
router.put("/orders/cancel-order/:id", cancelOrder);

//DELETE AN ORDER
router.delete("/orders/:id", deleteOrder);

//UPDATE ORDER STATUS
router.patch("/orders/status/:id", updateOrderStatus);

//ROUTE TO GET ORDER HISTORY
router.get("/orders/user/history", authenticateToken, getOrderHistory);

export default router;
