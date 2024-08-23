import express, { Router } from "express";
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
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
router.get("/orders", authenticateToken, authorizeStaff, getOrders);

//GET A SPECIFIC ORDER
router.get("/orders/:id", authenticateToken, authorizeStaff, getOrder);

//CREATE A NEW ORDER
router.post("/orders", authenticateToken, createOrder);

//UPDATE AN ORDER
router.put("/orders/:id", authenticateToken, updateOrder);

//DELETE AN ORDER
router.delete("/orders/:id", authenticateToken, authorizeAdmin, deleteOrder);

//UPDATE ORDER STATUS
router.patch(
  "/orders/status/:id",
  authenticateToken,
  authorizeStaff,
  updateOrderStatus
);

export default router;
