import express, { Request, Response } from "express";
import mongoose from "mongoose";
import Supplier, { ISupplier } from "../models/supplierModel";

//GET ALL SUPPLIERS
const getSuppliers = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  try {
    const suppliers: ISupplier[] = await Supplier.find();
    console.log("Fetched suppliers");
    return res.status(200).json(suppliers);
  } catch (error) {
    return res.status(500).json({ error: "Error fetching suppliers" });
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
    const supplier: ISupplier | null = await Supplier.findById(req.params.id);
    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
    }
    console.log("Fetched supplier");
    return res.status(200).json(supplier);
  } catch (error) {
    return res.status(500).json({ error: "Could not fetch supplier by ID" });
  }
};

//CREATE A NEW SUPPLIER
const createSupplier = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { name, contact, email, address } = req.body;

  if (!name || !contact || !email || !address) {
    return res.status(404).json({ error: "Please fill all fields" });
  }

  //Check if supplier name exists
  const supplierExists = await Supplier.findOne({ name: name });
  if (supplierExists) {
    return res.status(400).json({ error: "Supplier already exists." });
  }

  try {
    const newSupplier: ISupplier = new Supplier({
      name,
      contact,
      email,
      address,
    });
    await newSupplier.save();
    console.log("Supplier created...");
    return res.status(201).json(newSupplier);
  } catch (error) {
    return res.status(500).json({ error: "Error creating supplier" });
  }
};

//UPDATE A SUPPLIER
const updateSupplier = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { name, contact, email, address } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const updatedSupplier: ISupplier | null = await Supplier.findByIdAndUpdate(
      req.params.id,
      { name, contact, email, address },
      { new: true }
    );
    if (!updatedSupplier) {
      return res.status(400).json({ error: "Could not update Supplier" });
    }
    return res.status(200).json(updatedSupplier);
  } catch (error) {
    return res.status(500).json({ error: "Error updating supplier" });
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
    return res.status(200).json({ message: "Supplier deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Error deleting supplier" });
  }
};

export {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
