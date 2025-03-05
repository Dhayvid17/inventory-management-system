import { Request, Response } from "express";
import Notification, { INotification } from "../models/notificationModel";
import mongoose from "mongoose";
import User from "../models/userModel";

//GET ALL TRANSFER NOTIFICATIONS
const getAllNotifications = async (
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

    //If the user is an admin, return all notifications
    const filter =
      userRole === "admin" ? {} : { $or: [{ userId }, { staffId: userId }] };
    const notifications: INotification[] = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .populate("staffId", "username")
      .populate("userId", "username")
      .populate("transferId");
    if (!notifications) {
      return res
        .status(404)
        .json({ error: "Could not find User Notification" });
    }
    return res.json(notifications);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Error fetching notifications", details: error.message });
  }
};

//GET A SINGLE NOTIFICATION
const getSingleNotification = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid notification ID" });
  }

  try {
    const notification: INotification | null = await Notification.findById(id)
      .populate("userId", "username")
      .populate("staffId", "username")
      .populate("transferId");

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
    return res
      .status(500)
      .json({ error: "Failed to get Notification", details: error.message });
  }
};

//DELETE A NOTIFICATION
const deleteNotification = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid notification ID" });
  }

  //Check if Notification exists
  const notificationExists = await Notification.findById(id);
  if (!notificationExists) {
    return res.status(400).json({ error: "Notification does not exists." });
  }

  try {
    const deletedNotification: INotification | null =
      await Notification.findByIdAndDelete(id);

    if (!deletedNotification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    return res
      .status(200)
      .json({ message: "Notification deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export { getAllNotifications, getSingleNotification, deleteNotification };
