import express, { Request, Response } from "express";
import mongoose from "mongoose";
import Supplier, { ISupplier } from "../models/supplierModel";

//GET ALL SUPPLIERS
const getSuppliers = async (req: Request, res: Response): Promise<void> => {
  try {
    const suppliers: ISupplier[] = await Supplier.find().populate("products");
    console.log("Fetched suppliers");
    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ error: "Error fetching suppliers" });
  }
};

//GET A SINGLE SUPPLIER
const getSupplier = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Invalid supplier id" });
  }

  try {
    const supplier: ISupplier | null = await Supplier.findById(
      req.params.id
    ).populate("products");
    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
    }
    console.log("Fetched supplier");
    res.status(200).json(supplier);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch supplier by ID" });
  }
};

//CREATE A NEW SUPPLIER
const createSupplier = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { name, contactInfo, products, address } = req.body;

  if (!name || !contactInfo || !products || !address) {
    return res.status(404).json({ error: "Please fill all fields" });
  }

  try {
    const newSupplier: ISupplier = new Supplier({
      name,
      contactInfo,
      products,
      address,
    });
    await newSupplier.save();
    console.log("Supplier created...");
    res.status(201).json(newSupplier);
  } catch (error) {
    res.status(500).json({ error: "Error creating supplier" });
  }
};

//UPDATE A SUPPLIER
const updateSupplier = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { name, contactInfo, products, address } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const updatedSupplier: ISupplier | null = await Supplier.findByIdAndUpdate(
      req.params.id,
      { name, contactInfo, products, address },
      { new: true }
    );
    if (!updatedSupplier) {
      return res.status(400).json({ error: "Could not update Supplier" });
    }
    res.status(201).json(updatedSupplier);
  } catch (error) {
    res.status(500).json({ error: "Error updating supplier" });
  }
};

//DELETE A SUPPLIER
const deleteSupplier = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const deletedSupplier: ISupplier | null = await Supplier.findByIdAndDelete(
      req.params.id
    );
    if (!deletedSupplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    res.status(201).json({ message: "Supplier deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting supplier" });
  }
};

export {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
