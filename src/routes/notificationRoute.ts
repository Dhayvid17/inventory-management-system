import express, { Router } from "express";
import {
  deleteNotification,
  getAllNotifications,
  getSingleNotification,
} from "../controllers/notificationController";

const router: Router = express.Router();

//ROUTE TO GET ALL NOTIFICATIONS
router.get("/notifications", getAllNotifications);

//ROUTE TO GET A SINGLE NOTIFICATION
router.get("/notifications/:id", getSingleNotification);

//ROUTE TO DELETE NOTIFICATION
router.delete("/notifications/:id", deleteNotification);

export default router;
