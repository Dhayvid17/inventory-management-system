import Notification, { INotification } from "../models/notificationModel";
import User, { IUser } from "../models/userModel";
import Order, { IOrder } from "../models/orderModel";
import mongoose, { ObjectId } from "mongoose";
import { IReview } from "../models/reviewModel";

//TRANSFER REQUEST NOTIFICATION LOGIC
const transferRequestNotification = async (
  staffId: mongoose.Types.ObjectId,
  message: string,
  type: string,
  transferId: mongoose.Types.ObjectId
): Promise<INotification> => {
  try {
    const newNotification = new Notification({
      staffId,
      message,
      type,
      transferId,
    });

    return await newNotification.save();
  } catch (error: any) {
    console.error("Error sending notification", error.message);
    throw new Error(error.message || "Could not send notification...");
  }
};

//CREATE ORDER NOTIFICATION LOGIC
const createOrderNotification = async (
  userId: mongoose.Types.ObjectId,
  message: string,
  type: string
): Promise<INotification> => {
  try {
    const notification = new Notification({
      userId,
      message,
      type,
    });

    return await notification.save();
  } catch (error: any) {
    console.error("Error sending notification", error.message);
    throw new Error(error.message || "Could not send notification...");
  }
};

//ORDER STATUS NOTIFICATION LOGIC
const sendOrderStatusNotification = async (
  user: IUser,
  order: IOrder
): Promise<void> => {
  const statusMessages: { [key: string]: string } = {
    "Order Received": "Your order has been received and is being processed.",
    Processing: "Your order is currently being processed.",
    "Out For Delivery": "Your order has been shipped and is on its way!",
    Delivered: "Your order has been delivered. Enjoy!",
    Cancelled:
      "Your order has been cancelled. Please contact support if you have any questions.",
  };

  const message =
    statusMessages[order.status] ||
    `Your order status has been updated to: ${order.status}`;

  await createOrderNotification(
    user._id,
    `Order #${order.orderNumber}: ${message}`,
    "Order Status"
  );
};

//ORDER NOTIFICATION TO ADMIN LOGIC
const sendOrderNotificationToAdmin = async (order: IOrder): Promise<void> => {
  const admins = await User.find({ role: "admin" });
  const user = await User.findById(order.user);
  for (const admin of admins) {
    await createOrderNotification(
      admin._id,
      `New order #${order.orderNumber} created by ${user?.username} for ${order.products}`,
      "New Order"
    );
  }
};

//UPDATED ORDER NOTIFICATION LOGIC
const sendUpdatedOrderNotification = async (
  user: IUser,
  order: IOrder
): Promise<void> => {
  const message = `Order #${order.orderNumber} has been updated.`;
  await createOrderNotification(user._id, message, "Updated Order");
};

//UPDATED ORDER NOTIFICATION TO ADMIN LOGIC
const sendUpdatedOrderNotificationToAdmin = async (
  order: IOrder
): Promise<void> => {
  const admins = await User.find({ role: "admin" });
  const user = await User.findById(order.user);
  for (const admin of admins) {
    await createOrderNotification(
      admin._id,
      `Order #${order.orderNumber} has been updated by ${user?.username} for ${order.products}`,
      "Updated Order"
    );
  }
};

//CANCEL ORDER NOTIFICATION LOGIC
const sendCancelledOrderNotification = async (
  user: IUser,
  order: IOrder
): Promise<void> => {
  const message = `Order #${order.orderNumber} has been cancelled.`;
  await createOrderNotification(user._id, message, "Cancelled Order");
};

//CANCEL ORDER NOTIFICATION TO ADMIN LOGIC
const sendCancelledOrderNotificationToAdmin = async (
  order: IOrder
): Promise<void> => {
  const admins = await User.find({ role: "admin" });
  const user = await User.findById(order.user);
  for (const admin of admins) {
    await createOrderNotification(
      admin._id,
      `Order #${order.orderNumber} has been cancelled by ${user?.username} for ${order.products}`,
      "Cancelled Order"
    );
  }
};

//DELETE ORDER NOTIFICATION LOGIC
const sendDeletedOrderNotification = async (
  user: IUser,
  order: IOrder
): Promise<void> => {
  const message = `Order #${order.orderNumber} has been deleted.`;
  await createOrderNotification(user._id, message, "Deleted Order");
};

//DELETE ORDER NOTIFICATION TO ADMIN LOGIC
const sendDeletedOrderNotificationToAdmin = async (
  order: IOrder
): Promise<void> => {
  const admins = await User.find({ role: "admin" });
  const user = await User.findById(order.user);
  for (const admin of admins) {
    await createOrderNotification(
      admin._id,
      `Order #${order.orderNumber} has been deleted by ${user?.username} for ${order.products}`,
      "Deleted Order"
    );
  }
};

//ORDER REVIEW NOTIFICATION LOGIC
const createReviewNotification = async (
  userId: mongoose.Types.ObjectId,
  message: string,
  type: string
): Promise<INotification> => {
  try {
    const notification = new Notification({
      user: userId,
      message,
      type,
    });

    return await notification.save();
  } catch (error) {
    console.error("Error creating review notification:", error);
    throw new Error("Could not create notification");
  }
};

//REVIEW TO ADMIN LOGIC
const sendReviewToAdmin = async (review: IReview): Promise<void> => {
  try {
    const admins = await User.find({ role: "admin" }).exec();
    const user = await User.findById(review.userId).exec();

    if (!user) {
      console.warn("User not found for review:", review);
      return;
    }

    for (const admin of admins) {
      await createReviewNotification(
        admin._id,
        `New review from ${user?.username}`,
        "New Review"
      );
    }
  } catch (error: any) {
    console.error("Error sending review to admin:", error.message);
  }
};

export {
  transferRequestNotification,
  createOrderNotification,
  sendOrderStatusNotification,
  sendOrderNotificationToAdmin,
  sendUpdatedOrderNotification,
  sendUpdatedOrderNotificationToAdmin,
  sendCancelledOrderNotification,
  sendCancelledOrderNotificationToAdmin,
  sendDeletedOrderNotification,
  sendDeletedOrderNotificationToAdmin,
  createReviewNotification,
  sendReviewToAdmin,
};
