import express, { Request, Response } from "express";
import mongoose from "mongoose";
import Warehouse, { IWarehouse } from "../models/warehouseModel";
import {
  addProductToWarehouse,
  removeProductFromWarehouse,
} from "../services/warehouseService";
import Product from "../models/productModel";

//GET ALL WAREHOUSES
const getWarehouses = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  try {
    //Fetch all warehouses with their products
    const warehouses = await Warehouse.aggregate([
      {
        $lookup: {
          from: "products", // Collection to join with
          localField: "_id", // Field from Warehouse
          foreignField: "warehouse", // Field from Product
          as: "products", // Alias for the result
        },
      },
      {
        $project: {
          name: 1,
          location: 1,
          capacity: 1,
          products: {
            name: 1,
            quantity: 1,
          },
        },
      },
    ]);

    console.log("Fetched warehouses with products");
    return res.status(200).json(warehouses);
  } catch (error) {
    return res.status(500).json({ error: "Could not fetch warehouses" });
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
    //Get the id
    const { id } = req.params;

    //Fetch the warehouse by ID with its products
    const warehouse = await Warehouse.findById(id).lean();

    if (!warehouse) {
      return res.status(404).json({ error: "Warehouse not found" });
    }

    //Fetch products related to the warehouse
    const products = await Product.find({ warehouse: warehouse._id }).select(
      "name quantity"
    );

    //Add the products to the warehouse object using type assertion
    const warehouseWithProducts = {
      ...warehouse,
      products,
    } as IWarehouse & { products: typeof products };

    console.log(`Fetched warehouse with ID: ${id}`);
    return res.status(200).json(warehouseWithProducts);
  } catch (error) {
    return res.status(500).json({ error: "Could not fetch warehouse" });
  }
};

//CREATE A NEW WAREHOUSE
const createWarehouse = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { name, location, capacity } = req.body;

  if (!name || !location || !capacity) {
    return res.status(404).json({ error: "Please fill all fields" });
  }

  //Check if warehouse name exists
  const warehouseExists = await Warehouse.findOne({ name: name });
  if (warehouseExists) {
    return res.status(400).json({ error: "Warehouse already exists." });
  }

  try {
    const newWarehouse: IWarehouse = new Warehouse({
      name,
      location,
      capacity,
    });
    await newWarehouse.save();
    console.log("Warehouse created...");
    return res.status(201).json(newWarehouse);
  } catch (error) {
    return res.status(500).json({ error: "Could not add new warehouse" });
  }
};

//UPDATE WAREHOUSE
const updateWarehouse = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { name, location, capacity } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const updatedWarehouse: IWarehouse | null =
      await Warehouse.findByIdAndUpdate(
        req.params.id,
        { name, location, capacity },
        { new: true }
      );

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
  const { warehouseId, productId } = req.params;

  if (!warehouseId || !productId) {
    return res
      .status(404)
      .json({ error: "Please provide both warehouseId and productId" });
  }

  try {
    await addProductToWarehouse(productId, warehouseId);
    res
      .status(200)
      .json({ message: "Product added to warehouse successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

//REMOVE PRODUCT FROM WAREHOUSE
const removeProductFromWarehouseHandler = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { warehouseId, productId } = req.params;

  if (!warehouseId || !productId) {
    return res
      .status(404)
      .json({ error: "Please provide both warehouseId and productId" });
  }

  try {
    await removeProductFromWarehouse(productId, warehouseId);
    res
      .status(200)
      .json({ message: "Product removed from warehouse successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
