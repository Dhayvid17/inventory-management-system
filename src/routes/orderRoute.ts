import express, { Router } from "express";
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
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

export default router;
