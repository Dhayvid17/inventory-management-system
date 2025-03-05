import express, { Request, Response } from "express";
import Order, { IOrder } from "../models/orderModel";
import mongoose, { ObjectId } from "mongoose";
import Product from "../models/productModel";
import User from "../models/userModel";
import {
  sendCancelledOrderNotification,
  sendCancelledOrderNotificationToAdmin,
  sendDeletedOrderNotification,
  sendDeletedOrderNotificationToAdmin,
  sendOrderNotificationToAdmin,
  sendOrderStatusNotification,
  sendUpdatedOrderNotification,
  sendUpdatedOrderNotificationToAdmin,
} from "../services/notificationService";

//GET ALL ORDERS
const getOrders = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  try {
    const orders: IOrder[] = await Order.find()
      .populate("products")
      .populate("user", "username");
    //Check if the order is valid
    if (!orders) {
      return res.status(404).json({ error: "Order not found" });
    }

    console.log("Fetched orders");
    return res.status(200).json(orders);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Could not fetch orders", details: error.message });
  }
};

//GET A SINGLE ORDER
const getOrder = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const order: IOrder | null = await Order.findById(req.params.id)
      .populate("products")
      .populate("user", "username");
    //Check if the order is valid
    if (!order) {
      return res.status(400).json({ error: "Order not found" });
    }
    res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({ error: "Could not fetch order" });
  }
};

//CREATE NEW ORDER
const createOrder = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { products, status } = req.body;
  const userId = (req as any).user.id; // Automatically populate the user field.

  //Check if User is valid
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!products) {
    return res.status(404).json({ error: "Please provide products" });
  }

  //Normalize products to be an array
  const normalizedProducts = Array.isArray(products) ? products : [products];

  try {
    //Extract product IDs from the request body
    const productIds = normalizedProducts.map(
      (p: { productId: string }) => p.productId
    );
    //Check if all product IDs are valid
    const productsInDb = await Product.find({
      _id: { $in: productIds },
    }).exec();
    //If not all products are found, return an error
    if (productsInDb.length !== productIds.length) {
      return res
        .status(400)
        .json({ error: "One or more product IDs are invalid" });
    }

    //Find the highest existing orderNumber
    const lastOrder = await Order.findOne().sort({ orderNumber: -1 }).exec();
    const nextOrderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1;

    //Calculate totalPrice and total quantity
    let totalPrice = 0;
    let totalQuantity = 0;

    const orderProducts = normalizedProducts.map((orderProduct) => {
      const dbProduct = productsInDb.find(
        (p) => p._id.toString() === orderProduct.productId
      );
      if (!dbProduct) {
        return res.status(400).json({
          error: `Product with ID ${orderProduct.productId} not found.`,
        });
      }
      //Ensure the ordered quantity does not exceed available quantity
      if (orderProduct.quantity > dbProduct.quantity) {
        return res.status(400).json({
          error: `Ordered quantity for product ${dbProduct.name} exceeds available stock.`,
        });
      }
      //Set the price for the product in the normalizedProducts array
      orderProduct.price = dbProduct.price;
      totalPrice += dbProduct.price * orderProduct.quantity;
      totalQuantity += orderProduct.quantity;

      //Return product details including ID and quantity
      return {
        productId: dbProduct._id,
        name: dbProduct.name,
        quantity: orderProduct.quantity,
        price: dbProduct.price,
      };
    });

    const newOrder: IOrder = new Order({
      totalPrice,
      totalQuantity,
      orderNumber: nextOrderNumber,
      products: orderProducts,
      status: "Order Received",
      user: userId,
    });
    await newOrder.save();

    //Send notification to user
    const user = await User.findById(userId);
    if (user) {
      await sendOrderStatusNotification(user, newOrder);
    }

    //Send notification to admin
    await sendOrderNotificationToAdmin(newOrder);

    console.log("Order created and notifications sent");
    return res.status(201).json(newOrder);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Could not add new Order", details: error.message });
  }
};

//UPDATE AN ORDER
const updateOrder = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { products } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  if (!products) {
    return res.status(400).json({ error: "No products provided" });
  }

  try {
    //Find the existing order
    const existingOrder: IOrder | null = await Order.findById(req.params.id);
    if (!existingOrder) {
      return res.status(400).json({ error: "Order not found" });
    }

    //Ensure the user updating the order is the same user that created it
    const userId = (req as any).user.id; //Authenticated user
    if (existingOrder.user.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized: You cannot update this order" });
    }

    //Normalize products to be an array
    const normalizedProducts = Array.isArray(products) ? products : [products];

    //Extract product IDs from the request body
    const productIds = normalizedProducts.map(
      (p: { productId: string }) => p.productId
    );

    //Check if all product IDs are valid and fetch product details
    const productsInDb = await Product.find({
      _id: { $in: productIds },
    }).exec();

    //If not all products are found, return an error
    if (productsInDb.length !== productIds.length) {
      return res
        .status(400)
        .json({ error: "One or more product IDs are invalid" });
    }

    //Validate the quantities, update totalPrice and total quantity
    let totalPrice = 0;
    let totalQuantity = 0;

    for (const orderProduct of normalizedProducts) {
      const dbProduct = productsInDb.find(
        (p) => p._id.toString() === orderProduct.productId
      );
      if (!dbProduct) {
        return res.status(400).json({
          error: `Product with ID ${orderProduct.productId} not found.`,
        });
      }

      //Ensure the ordered quantity does not exceed available quantity
      if (orderProduct.quantity > dbProduct.quantity) {
        return res.status(400).json({
          error: `Ordered quantity for product ${dbProduct.name} exceeds available stock.`,
        });
      }
      //Set the price for the product in the normalizedProducts array
      orderProduct.price = dbProduct.price;
      totalPrice += dbProduct.price * orderProduct.quantity;
      totalQuantity += orderProduct.quantity;
    }

    //Update the Order in the Database
    const updatedOrder: IOrder | null = await Order.findByIdAndUpdate(
      req.params.id,
      {
        products: normalizedProducts,
        totalPrice,
        totalQuantity,
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(400).json({ error: "Could not update Order" });
    }

    //Send notification to user
    const user = await User.findById(userId);
    if (user) {
      await sendUpdatedOrderNotification(user, updatedOrder);
    }

    //Send notification to admin
    await sendUpdatedOrderNotificationToAdmin(updatedOrder);

    return res.status(200).json(updatedOrder);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to update Order", details: error.message });
  }
};

//CANCEL AN ORDER
const cancelOrder = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  //Check if Order exists
  const orderExists = await Order.findById(req.params.id);
  if (!orderExists) {
    return res.status(400).json({ error: "Order does not exists." });
  }

  //Ensure the user updating the order is the same user that created it
  const userId = (req as any).user.id; //Authenticated user
  if (orderExists.user.toString() !== userId) {
    return res
      .status(403)
      .json({ error: "Unauthorized: You cannot update this order" });
  }

  //Check the current order status
  if (
    orderExists.status === "Out For Delivery" ||
    orderExists.status === "Delivered"
  ) {
    return res.status(400).json({
      error: "Order cannot be cancelled as it's already out for delivery.",
    });
  }

  //Update the order status to "cancelled"
  if (
    orderExists.status === "Order Received" ||
    orderExists.status === "Processing"
  ) {
    try {
      const cancelOrder = await Order.findByIdAndUpdate(
        req.params.id,
        { status: "Cancelled" },
        { new: true }
      );

      if (!cancelOrder) {
        return res.status(400).json({ error: "Could not cancel Order" });
      }

      //Send notification to user
      const user = await User.findById(userId);
      if (user) {
        await sendCancelledOrderNotification(user, cancelOrder);
      }

      //Send notification to admin
      await sendCancelledOrderNotificationToAdmin(cancelOrder);

      return res.status(200).json({ message: "Order successfully canceled" });
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: "Failed to cancel Order", details: error.message });
    }
  }
  return res.status(400).json({ error: "Order cannot be canceled." });
};

//DELETE AN ORDER
const deleteOrder = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  //Check if Order exists
  const orderExists = await Order.findById(req.params.id);
  if (!orderExists) {
    return res.status(400).json({ error: "Order does not exists." });
  }

  //Ensure the user deleting the order is the same user that created it
  const userId = (req as any).user.id; //Authenticated user
  if (orderExists.user.toString() !== userId) {
    return res
      .status(403)
      .json({ error: "Unauthorized: You cannot update this order" });
  }

  try {
    const deletedOrder: IOrder | null = await Order.findByIdAndDelete(
      req.params.id
    );

    if (!deletedOrder) {
      return res.status(400).json({ error: "Could not delete Order" });
    }

    //Send notification to user
    const user = await User.findById(userId);
    if (user) {
      await sendDeletedOrderNotification(user, deletedOrder);
    }

    //Send notification to admin
    await sendDeletedOrderNotificationToAdmin(deletedOrder);
    return res.status(200).json({ message: "Order deleted successfully" });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to delete Order", details: error.message });
  }
};

//UPDATE ORDER STATUS
const updateOrderStatus = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { status } = req.body;
  const userId = (req as any).user.id;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  //Check if Order exists
  const orderExists = await Order.findById(req.params.id);
  if (!orderExists) {
    return res.status(400).json({ error: "Order does not exists." });
  }

  //Validate the new status (optional)
  const validStatuses = [
    "Order Received",
    "Processing",
    "Out For Delivery",
    "Delivered",
    "Cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    //Check If user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedOrder: IOrder | null = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
    //Send notification to user
    await sendOrderStatusNotification(user, updatedOrder);
    console.log(
      `Order ${updatedOrder.orderNumber} status updated to ${status} and notification sent`
    );
    return res.status(200).json(updatedOrder);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to update Order status", details: error.message });
  }
};

//GET USER ORDER HISTORY
const getOrderHistory = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  // const { userId } = req.params;
  const userId = (req as any).user.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(404).json({ error: "Not a valid document" });
  }
  //Check If user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const orders = await Order.find({ user: userId })
      .populate("products")
      .populate("user", "username");
    if (!orders) {
      return res.status(404).json({ error: "No orders found" });
    }

    return res.status(200).json(orders);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Could not get User history", details: error.message });
  }
};

export {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  cancelOrder,
  deleteOrder,
  updateOrderStatus,
  getOrderHistory,
};
