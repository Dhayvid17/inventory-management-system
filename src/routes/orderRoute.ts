import express, { Router } from "express";
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
} from "../controllers/orderController";

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

//DELETE AN ORDER
router.delete("/orders/:id", deleteOrder);

export default router;
