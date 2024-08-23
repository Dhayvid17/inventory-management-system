import express, { Request, Response } from "express";
import Order, { IOrder } from "../models/orderModel";
import mongoose from "mongoose";
import validateUser from "../validator/validator";
import Product from "../models/productModel";

//GET ALL ORDERS
const getOrders = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  try {
    const orders: IOrder[] = await Order.find().populate("products.productId");
    console.log("Fetched orders");
    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ error: "Could not fetch orders" });
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
    const order: IOrder | null = await Order.findById(req.params.id).populate(
      "products.productId"
    );
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
  const user = (req as any).user.id; // Automatically populate the user field.

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

    // Calculate totalPrice and total quantity
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

      // Ensure the ordered quantity does not exceed available quantity
      if (orderProduct.quantity > dbProduct.quantity) {
        return res.status(400).json({
          error: `Ordered quantity for product ${dbProduct.name} exceeds available stock.`,
        });
      }
      totalPrice += dbProduct.price * orderProduct.quantity;
      totalQuantity += orderProduct.quantity;
    }

    const newOrder: IOrder = new Order({
      totalPrice,
      totalQuantity,
      orderNumber: nextOrderNumber,
      products: normalizedProducts,
      status,
      user,
    });
    await newOrder.save();
    console.log("Order created...");
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
  const { products, status, user } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    //Find the existing order
    const existingOrder: IOrder | null = await Order.findById(req.params.id);
    if (!existingOrder) {
      return res.status(400).json({ error: "Order not found" });
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

      totalPrice += dbProduct.price * orderProduct.quantity;
      totalQuantity += orderProduct.quantity;
    }

    //Update the Order in the Database
    const updatedOrder: IOrder | null = await Order.findByIdAndUpdate(
      req.params.id,
      {
        products: normalizedProducts,
        status,
        user,
        totalPrice,
        totalQuantity,
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(400).json({ error: "Could not update Order" });
    }

    return res.status(201).json(updatedOrder);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to update Order", details: error.message });
  }
};

//DELETE AN ORDER
const deleteOrder = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const deletedOrder: IOrder | null = await Order.findByIdAndDelete(
      req.params.id
    );

    if (!deletedOrder) {
      return res.status(400).json({ error: "Could not delete Order" });
    }
    return res.status(201).json({ message: "Order deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete Order" });
  }
};

//UPDATE ORDER STATUS
const updateOrderStatus = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  // Validate the new status (optional)
  const validStatuses = [
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const updatedOrder: IOrder | null = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
    return res.status(200).json(updatedOrder);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update Order status" });
  }
};

export {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
};
