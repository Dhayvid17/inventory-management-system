import Notification, { INotification } from "../models/notificationModel";
import User, { IUser } from "../models/userModel";
import Order, { IOrder } from "../models/orderModel";
import mongoose, { ObjectId } from "mongoose";
import { IReview } from "../models/reviewModel";

const transferRequestNotification = async (
  staffId: mongoose.Types.ObjectId,
  message: string,
  type: string
): Promise<INotification> => {
  try {
    const newNotification = new Notification({
      staffId,
      message,
      type,
    });

    await newNotification.save();
    //Here, you can add real-time update logic using WebSockets or similar technology
    return newNotification;
  } catch (error: any) {
    console.error("Error sending notification", error.message);
    throw new Error(error.message || "Could not send notification...");
  }
};

const createOrderNotification = async (
  userId: mongoose.Types.ObjectId,
  message: string,
  type: string
): Promise<INotification> => {
  const notification = new Notification({
    userId,
    message,
    type,
  });
  return await notification.save();
};

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

const sendUpdatedOrderNotification = async (
  user: IUser,
  order: IOrder
): Promise<void> => {
  const statusMessages: { [key: string]: string } = {
    "Updated Order": "Your order has been updated and is being processed.",
  };

  const message =
    statusMessages[order.status] || "Your order has been updated successfully";

  await createOrderNotification(
    user._id,
    `Order #${order.orderNumber}: ${message}`,
    "Updated Order"
  );
};

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

const sendCancelledOrderNotification = async (
  user: IUser,
  order: IOrder
): Promise<void> => {
  const statusMessages: { [key: string]: string } = {
    "Cancelled Order": "Your order has been Cancelled.",
  };

  const message =
    statusMessages[order.status] ||
    "Your order has been cancelled successfully";

  await createOrderNotification(
    user._id,
    `Order #${order.orderNumber}: ${message}`,
    "Cancelled Order"
  );
};

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

const sendDeletedOrderNotification = async (
  user: IUser,
  order: IOrder
): Promise<void> => {
  const statusMessages: { [key: string]: string } = {
    "Deleted Order": "Your order has been deleted.",
  };

  const message =
    statusMessages[order.status] || "Your order has been deleted successfully";

  await createOrderNotification(
    user._id,
    `Order #${order.orderNumber}: ${message}`,
    "Deleted Order"
  );
};

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
    console.error("Error sending review to admin:", error.mesage);
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
