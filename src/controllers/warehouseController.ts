import express, { Request, Response } from "express";
import mongoose from "mongoose";
import Warehouse, { IWarehouse } from "../models/warehouseModel";
import {
  addProductToWarehouse,
  removeProductFromWarehouse,
} from "../services/warehouseService";

//GET ALL WAREHOUSES
const getWarehouses = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouses: IWarehouse[] = await Warehouse.find().populate(
      "products"
    );
    console.log("Fetched warehouses");
    res.status(200).json(warehouses);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch warehouses" });
  }
};

//GET A SINGLE WAREHOUSE
const getWarehouse = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Invalid warehouse id" });
  }

  try {
    const warehouse: IWarehouse | null = await Warehouse.findById(
      req.params.id
    ).populate("products");
    if (!warehouse) {
      return res.status(404).json({ error: "Warehouse not found" });
    }
    console.log("Fetched warehouse");
    res.status(200).json(warehouse);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch warehouse" });
  }
};

//CREATE A NEW WAREHOUSE
const createWarehouse = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { name, location, capacity, products } = req.body;

  if (!name || !location || !capacity || !products) {
    return res.status(404).json({ error: "Please fill all fields" });
  }

  try {
    const newWarehouse: IWarehouse = new Warehouse({
      name,
      location,
      capacity,
      products,
    });
    await newWarehouse.save();
    console.log("Warehouse created...");
    res.status(201).json(newWarehouse);
  } catch (error) {
    res.status(500).json({ error: "Could not add new warehouse" });
  }
};

//UPDATE WAREHOUSE
const updateWarehouse = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { name, location, capacity, products } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const updatedWarehouse: IWarehouse | null =
      await Warehouse.findByIdAndUpdate(
        req.params.id,
        { name, location, capacity, products },
        { new: true }
      ).populate("products");

    if (!updatedWarehouse) {
      return res.status(400).json({ error: "Could not update Warehouse" });
    }
    res.status(201).json(updatedWarehouse);
  } catch (error) {
    res.status(500).json({ error: "Failed to update Warehouse" });
  }
};

//DELETE A WAREHOUSE
const deleteWarehouse = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const deletedWarehouse: IWarehouse | null =
      await Warehouse.findByIdAndDelete(req.params.id);

    if (!deletedWarehouse) {
      return res.status(400).json({ error: "Could not delete Warehouse" });
    }
    res.status(201).json({ message: "Warehouse deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete Warehouse" });
  }
};

//ADD PRODUCT TO WAREHOUSE
const addProductToWarehouseHandler = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { warehouseId, productId } = req.body;

  if (!warehouseId || productId) {
    return res.status(404).json({ error: "Please fill all fields" });
  }

  try {
    await addProductToWarehouse(warehouseId, productId);
    res
      .status(200)
      .json({ message: "Product added to warehouse successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error adding product to warehouse" });
  }
};

//REMOVE PRODUCT FROM WAREHOUSE
const removeProductFromWarehouseHandler = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { warehouseId, productId } = req.body;

  if (!warehouseId || productId) {
    return res.status(404).json({ error: "Please fill all fields" });
  }

  try {
    await removeProductFromWarehouse(warehouseId, productId);
    res
      .status(200)
      .json({ message: "Product removed from warehouse successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error removing product from warehouse" });
  }
};

export default {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  addProductToWarehouseHandler,
  removeProductFromWarehouseHandler,
};
