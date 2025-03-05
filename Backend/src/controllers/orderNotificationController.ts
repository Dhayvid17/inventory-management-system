import { Request, Response } from "express";
import Notification, { INotification } from "../models/notificationModel";
import mongoose from "mongoose";
import User from "../models/userModel";

//GET ALL USER NOTIFICATIONS
const getUserNotifications = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const userId = (req as any).user?.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid userId" });
  }

  //Check If user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const userRole = (req as any).user.role;

    if (userRole === "admin" || userRole === "staff") {
      //If the user is an admin or staff, return all notifications
      const notifications: INotification[] = await Notification.find().sort({
        createdAt: -1,
      });
      if (!notifications) {
        return res
          .status(404)
          .json({ error: "Could not find User Notification" });
      }
      return res.json(notifications);
    } else {
      //If the user is a regular user, return only their own notifications
      const notifications: INotification[] = await Notification.find({
        userId: userId,
      }).sort({ createdAt: -1 });
      if (!notifications) {
        return res
          .status(404)
          .json({ error: "Could not find User Notification" });
      }
      return res.json(notifications);
    }
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Error fetching notifications", details: error.message });
  }
};

//GET A SINGLE ORDER NOTIFICATION
const getOrderNotificationById = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid notificationId" });
  }

  try {
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    //Mark as read
    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }

    return res.status(200).json(notification);
  } catch (error: any) {
    console.error("Error fetching notification:", error);
    return res
      .status(500)
      .json({ error: "Could not fetch notification", details: error.message });
  }
};

//MARK NOTIFICATION AS READ
const markNotificationAsRead = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const userId = (req as any).user?.id;
  const { notificationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return res.status(400).json({ error: "Invalid notificationId" });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid userId" });
  }

  //Find the existing order
  const existingOrderNotification: INotification | null =
    await Notification.findById(notificationId);
  if (!existingOrderNotification) {
    return res.status(400).json({ error: "Order notification not found" });
  }

  //Check If user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  //Ensure the user updating the notification is the same user that created it
  if (existingOrderNotification.userId?.toString() !== userId) {
    return res
      .status(403)
      .json({ error: "Unauthorized: You cannot update this order" });
  }

  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(notificationId),
        userId: new mongoose.Types.ObjectId(userId as mongoose.Types.ObjectId),
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Could not update Notification" });
    }
    return res.status(200).json(notification);
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return res
      .status(500)
      .json({ error: "Could not update notification", details: error.message });
  }
};

//DELETE ORDER NOTIFICATION
const deleteOrderNotification = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid notificationId" });
  }

  try {
    const notification = await Notification.findByIdAndDelete(id);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    return res
      .status(200)
      .json({ message: "Notification deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting notification:", error);
    return res
      .status(500)
      .json({ error: "Could not delete notification", details: error.message });
  }
};

export {
  getUserNotifications,
  getOrderNotificationById,
  markNotificationAsRead,
  deleteOrderNotification,
};
