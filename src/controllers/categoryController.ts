import express, { Request, Response } from "express";
import mongoose from "mongoose";
import Category, { ICategory } from "../models/categoryModel";

//GET ALL CATEGORIES
const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories: ICategory[] = await Category.find().populate("products");
    console.log("Fetched categories");
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Error fetching categories" });
  }
};

//GET A SINGLE CATEGORY
const getCategory = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Invalid supplier id" });
  }

  try {
    const category: ICategory | null = await Category.findById(
      req.params.id
    ).populate("products");
    if (!category) {
      res.status(404).json({ error: "Category not found" });
    }
    console.log("Fetched category");
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch category by ID" });
  }
};

//CREATE A NEW CATEGORY
const createCategory = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { name, description, products } = req.body;

  if (!name || !description || !products) {
    return res.status(404).json({ error: "Please fill all fields" });
  }

  try {
    const newCategory: ICategory = new Category({
      name,
      description,
      products,
    });
    await newCategory.save();
    console.log("Category created...");
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: "Error creating category" });
  }
};

//UPDATE A CATEGORY
const updateCategory = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { name, description, products } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const updatedCategory: ICategory | null = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, products },
      { new: true }
    );
    if (!updatedCategory) {
      return res.status(400).json({ error: "Could not update Category" });
    }
    res.status(201).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ error: "Error updating Category" });
  }
};

//DELETE A CATEGORY
const deleteCategory = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const deletedCategory: ICategory | null = await Category.findByIdAndDelete(
      req.params.id
    );
    if (!deletedCategory) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.status(201).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting Category" });
  }
};

export {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
