import { Request, Response } from "express";
import Notification, { INotification } from "../models/notificationModel";
import mongoose from "mongoose";

//GET ALL TRANSFER NOTIFICATIONS
const getAllNotifications = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  try {
    const notifications: INotification[] = await Notification.find().sort({
      createdAt: -1,
    });
    if (!notifications) {
      return res.status(404).json({ error: "Notifications not found" });
    }

    return res.status(200).json(notifications);
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to get all notifications",
      details: error.message,
    });
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

  //Check if Notification exists
  const notificationExists = await Notification.findById(id);
  if (!notificationExists) {
    return res.status(400).json({ error: "Notification does not exists." });
  }

  try {
    const notification: INotification | null = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
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
