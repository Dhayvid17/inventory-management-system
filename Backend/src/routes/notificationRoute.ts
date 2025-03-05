import express, { Router } from "express";
import {
  deleteNotification,
  getAllNotifications,
  getSingleNotification,
} from "../controllers/notificationController";
import { authenticateToken } from "../middlewares/authentication";

const router: Router = express.Router();

//ROUTE TO GET ALL NOTIFICATIONS
router.get("/notifications", authenticateToken, getAllNotifications);

//ROUTE TO GET A SINGLE NOTIFICATION
router.get("/notifications/:id", authenticateToken, getSingleNotification);

//ROUTE TO DELETE NOTIFICATION
router.delete("/notifications/:id", authenticateToken, deleteNotification);

export default router;
