import express, { Request, Response } from "express";
import Product, { IProduct } from "../models/productModel";
import mongoose from "mongoose";
import { addProductToWarehouse } from "../services/warehouseService";
import Category from "../models/categoryModel";
import Warehouse from "../models/warehouseModel";
import Supplier from "../models/supplierModel";

//GET ALL PRODUCTS
const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products: IProduct[] = await Product.find()
      .populate("category")
      .populate("warehouse")
      .populate("supplier");
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
    const product: IProduct | null = await Product.findById(req.params.id)
      .populate("category")
      .populate("warehouse")
      .populate("supplier");
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
  const { name, category, price, quantity, warehouse, supplier } = req.body;

  if (!name || !category || !price || !quantity || !warehouse || !supplier) {
    return res.status(404).json({ error: "Please fill all fields" });
  }

  try {
    //Validate category existence
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        error: "Category not found. Please create the category first.",
      });
    }

    //Validate warehouse existence
    const warehouseExists = await Warehouse.findById(warehouse);
    if (!warehouseExists) {
      return res.status(400).json({
        error: "Warehouse not found. Please create the warehouse first.",
      });
    }

    //Validate supplier existence
    const supplierExists = await Supplier.findById(supplier);
    if (!supplierExists) {
      return res.status(400).json({
        error: "Supplier not found. Please create the supplier first.",
      });
    }

    //Calculate the current total quantity in the warehouse
    const currentProducts = await Product.find({ warehouse: warehouse });
    const currentTotalQuantity = currentProducts.reduce(
      (acc, product) => acc + product.quantity,
      0
    );

    //Check if adding the new product would exceed the warehouse capacity
    if (currentTotalQuantity + quantity > warehouseExists.capacity) {
      return res.status(400).json({
        error: `Cannot add product. Total quantity exceeds warehouse capacity of ${warehouseExists.capacity}.`,
      });
    }

    //Create a new product
    const newProduct: IProduct = new Product({
      name,
      category: new mongoose.Types.ObjectId(category as string),
      price,
      quantity,
      warehouse: new mongoose.Types.ObjectId(warehouse as string),
      supplier: new mongoose.Types.ObjectId(supplier as string),
    });
    console.log({ name, category, price, quantity, warehouse, supplier });
    await newProduct.save();

    //Explicitly cast _id and convert to string
    const productId = newProduct._id.toString();
    //Add product to warehouse
    await addProductToWarehouse(warehouse, productId);
    console.log("Product created...");
    return res.status(201).json(newProduct);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Could not add new product", details: error.message });
  }
};

//UPDATE A PRODUCT
const updateProduct = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { name, category, price, quantity, warehouse, supplier } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const updatedProduct: IProduct | null = await Product.findByIdAndUpdate(
      req.params.id,
      { name, category, price, quantity, warehouse, supplier },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(400).json({ error: "Could not update Product" });
    }
    return res.status(200).json(updatedProduct);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update product" });
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
