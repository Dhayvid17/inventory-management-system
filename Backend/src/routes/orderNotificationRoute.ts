import express, { Router } from "express";
import {
  deleteOrderNotification,
  getOrderNotificationById,
  getUserNotifications,
  markNotificationAsRead,
} from "../controllers/orderNotificationController";
import { authenticateToken } from "../middlewares/authentication";

//Initialize Router
const router: Router = express.Router();

//ROUTE TO GET ALL NOTIFICATIONS FOR USERS
router.get("/order-notification", authenticateToken, getUserNotifications);

//ROUTE TO GET A SINGLE NOTIFICATION
router.get(
  "/order-notification/:id",
  authenticateToken,
  getOrderNotificationById
);

//ROUTE TO MARK NOTIFICATION AS READ
router.put(
  "/order-notification/:notificationId/read",
  authenticateToken,
  markNotificationAsRead
);

//ROUTE TO DELETE A NOTIFICATION
router.delete(
  "/order-notification/:id",
  authenticateToken,
  deleteOrderNotification
);

export default router;
