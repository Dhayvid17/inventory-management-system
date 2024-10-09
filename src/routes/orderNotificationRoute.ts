import express, { Router } from "express";
import {
  getUserNotifications,
  markNotificationAsRead,
} from "../controllers/orderNotificationController";
import { authenticateToken } from "../middlewares/authentication";

//Initialize Router
const router: Router = express.Router();

//ROUTE TO GET ALL NOTIFICATIONS FOR USERS
router.get("/order-notification", authenticateToken, getUserNotifications);

//ROUTE TO MARK NOTIFICATION AS READ
router.put(
  "/order-notification/:notificationId/read",
  authenticateToken,
  markNotificationAsRead
);

export default router;
