import express, { Request, Response } from "express";
import mongoose from "mongoose";
import Warehouse, { IWarehouse } from "../models/warehouseModel";
import {
  addProductToWarehouse,
  removeProductFromWarehouse,
} from "../services/warehouseService";
import Product from "../models/productModel";
import StaffAssignment from "../models/staffAssigmentModel";

//GET ALL WAREHOUSES
const getWarehouses = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  try {
    //Fetch all warehouses with their products
    const warehouses: IWarehouse[] = await Warehouse.find()
      .populate("managedBy", "username")
      .populate("type")
      .populate("products");

    if (!warehouses) {
      return res.status(404).json({ error: "Warehouses not found" });
    }
    return res.status(200).json(warehouses);
  } catch (error: any) {
    return res.status(500).json({
      error: "Could not fetch all warehouses",
      details: error.message,
    });
  }
};

// GET A SINGLE WAREHOUSE
const getWarehouse = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Invalid warehouse id" });
  }

  try {
    //Fetch the warehouse by ID with its products
    const warehouse: IWarehouse | null = await Warehouse.findById(req.params.id)
      .populate("managedBy", "username")
      .populate("type")
      .populate("products");
    if (!warehouse) {
      return res.status(404).json({ error: "Warehouse not found" });
    }

    return res.status(200).json(warehouse);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Could not fetch warehouse", details: error.message });
  }
};

//CREATE A NEW WAREHOUSE
const createWarehouse = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { name, type, location, capacity, managedBy } = req.body;

  if (!name || !type || !location || !capacity) {
    return res.status(404).json({ error: "Please fill all fields" });
  }

  //Check if warehouse name exists
  const warehouseExists = await Warehouse.findOne({ name: name });
  if (warehouseExists) {
    return res.status(400).json({ error: "Warehouse already exists." });
  }

  //Validate the warehouse type
  const validTypes = ["regularWarehouse", "superWarehouse"];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: "Invalid transaction type" });
  }

  try {
    const newWarehouse: IWarehouse = new Warehouse({
      name,
      type,
      location,
      capacity,
      managedBy: managedBy || [],
      totalQuantity: 0,
      totalValue: 0,
    });

    if (!newWarehouse) {
      return res.status(400).json({ error: "Warehouse creation failed" });
    }

    await newWarehouse.save();
    console.log("Warehouse created...");
    return res.status(201).json(newWarehouse);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to add new warehouse", details: error.message });
  }
};

//UPDATE WAREHOUSE
const updateWarehouse = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { name, type, location, capacity } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  if (!name || !type || !location || !capacity) {
    return res.status(400).json({ error: "Please fill all fields" });
  }

  //Check if warehouse name exists
  const warehouseExists = await Warehouse.findById(req.params.id);
  if (!warehouseExists) {
    return res.status(400).json({ error: "Warehouse does not exists." });
  }

  //Validate the warehouse type
  const validTypes = ["regularWarehouse", "superWarehouse"];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: "Invalid transaction type" });
  }

  try {
    const updatedWarehouse: IWarehouse | null =
      await Warehouse.findByIdAndUpdate(
        req.params.id,
        { name, type, location, capacity },
        { new: true }
      );

    if (!updatedWarehouse) {
      return res.status(400).json({ error: "Could not update Warehouse" });
    }
    return res.status(200).json(updatedWarehouse);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to update Warehouse", details: error.message });
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

  //Check if warehouse exists
  const warehouseExists = await Warehouse.findById(req.params.id);
  if (!warehouseExists) {
    return res.status(400).json({ error: "Warehouse does not exists." });
  }

  try {
    const deletedWarehouse: IWarehouse | null =
      await Warehouse.findByIdAndDelete(req.params.id);

    //Update products to remove reference to deleted warehouse
    await Product.updateMany(
      { warehouse: req.params.id },
      { $set: { warehouse: null } }
    );

    // Remove all staff assignments related to the deleted warehouse
    await StaffAssignment.deleteMany({ warehouseId: warehouseExists });

    if (!deletedWarehouse) {
      return res.status(400).json({ error: "Warehouse not Found" });
    }
    return res.status(200).json({ message: "Warehouse deleted" });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to delete Warehouse", details: error.message });
  }
};

//ADD PRODUCT TO WAREHOUSE
const addProductToWarehouseHandler = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { warehouseId, productId } = req.body;
  const staffId = (req as any).user.id;

  if (!warehouseId || !productId) {
    return res
      .status(404)
      .json({ error: "Please provide both warehouseId and productId" });
  }

  try {
    await addProductToWarehouse(warehouseId, productId, staffId);
    return res
      .status(200)
      .json({ message: "Product added to warehouse successfully" });
  } catch (error: any) {
    return res.status(500).json({
      error: "Could not add Product to Warehouse",
      details: error.message,
    });
  }
};

//REMOVE PRODUCT FROM WAREHOUSE
const removeProductFromWarehouseHandler = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { warehouseId, productId } = req.body;
  const staffId = (req as any).user.id;

  if (!warehouseId || !productId) {
    return res
      .status(404)
      .json({ error: "Please provide both warehouseId and productId" });
  }

  try {
    await removeProductFromWarehouse(warehouseId, productId, staffId);
    return res
      .status(200)
      .json({ message: "Product removed from warehouse successfully" });
  } catch (error: any) {
    return res.status(500).json({
      error: "Could not remove Product from Warehouse",
      details: error.message,
    });
  }
};

export {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  addProductToWarehouseHandler,
  removeProductFromWarehouseHandler,
};
