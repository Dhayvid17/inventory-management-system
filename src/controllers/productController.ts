import express, { Request, Response } from "express";
import Product, { IProduct } from "../models/productModel";
import mongoose from "mongoose";

//GET ALL PRODUCTS
const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products: IProduct[] = await Product.find().populate("warehouse");
    console.log("Fetched products");
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch products" });
  }
};

//GET A SINGLE PRODUCT
const getProduct = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid product" });
  }

  try {
    const product: IProduct | null = await Product.findById(
      req.params.id
    ).populate("warehouse");
    if (!product) {
      return res.status(400).json({ error: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch product" });
  }
};

//CREATE NEW PRODUCT
const createProduct = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { name, category, price, quantity, warehouse } = req.body;

  if (!name || !category || !price || !quantity || !warehouse) {
    return res.status(404).json({ error: "Please fill all fields" });
  }

  try {
    const newProduct: IProduct = new Product({
      name,
      category,
      price,
      quantity,
      warehouse,
    });
    await newProduct.save();
    console.log("Product created...");
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: "Could not add new product" });
  }
};

//UPDATE A PRODUCT
const updateProduct = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { name, category, price, quantity, warehouse } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const updatedProduct: IProduct | null = await Product.findByIdAndUpdate(
      req.params.id,
      { name, category, price, quantity, warehouse },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(400).json({ error: "Could not update Product" });
    }
    res.status(201).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: "Failed to update product" });
  }
};

//DELETE A USER
const deleteProduct = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const deletedProduct: IProduct | null = await Product.findByIdAndDelete(
      req.params.id
    );

    if (!deletedProduct) {
      return res.status(400).json({ error: "Could not delete Product" });
    }
    res.status(201).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete Product" });
  }
};

export { getProducts, getProduct, createProduct, updateProduct, deleteProduct };
