import express, { Request, Response } from "express";
import Order, { IOrder } from "../models/orderModel";
import mongoose from "mongoose";

//GET ALL ORDERS
const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders: IOrder[] = await Order.find().populate("products.productId");
    console.log("Fetched orders");
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch orders" });
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
    res.status(500).json({ error: "Could not fetch order" });
  }
};

//CREATE NEW ORDER
const createOrder = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { name, totalPrice, products, status, createdAt, updatedAt } = req.body;

  if (
    !name ||
    !totalPrice ||
    !products ||
    !status ||
    !createdAt ||
    !updatedAt
  ) {
    return res.status(404).json({ error: "Please fill all fields" });
  }

  try {
    const newOrder: IOrder = new Order({
      name,
      totalPrice,
      products,
      status,
      createdAt,
      updatedAt,
    });
    await newOrder.save();
    console.log("Order created...");
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ error: "Could not add new Order" });
  }
};

//UPDATE AN ORDER
const updateOrder = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { name, totalPrice, products, status, createdAt, updatedAt } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const updatedOrder: IOrder | null = await Order.findByIdAndUpdate(
      req.params.id,
      { name, totalPrice, products, status, createdAt, updatedAt },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(400).json({ error: "Could not update Order" });
    }
    res.status(201).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: "Failed to update Order" });
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
    res.status(201).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete Order" });
  }
};

export { getOrders, getOrder, createOrder, updateOrder, deleteOrder };
