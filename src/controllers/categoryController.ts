import express, { Request, Response } from "express";
import mongoose from "mongoose";
import Category, { ICategory } from "../models/categoryModel";

//GET ALL CATEGORIES
const getCategories = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  try {
    const categories: ICategory[] = await Category.find();

    if (!categories) {
      return res.status(404).json({ error: "Categories not found" });
    }
    console.log("Fetched categories");
    return res.status(200).json(categories);
  } catch (error) {
    return res.status(500).json({ error: "Error fetching categories" });
  }
};

//GET A SINGLE CATEGORY
const getCategory = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Invalid category id" });
  }

  try {
    const category: ICategory | null = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    console.log("Fetched category");
    return res.status(200).json(category);
  } catch (error) {
    return res.status(500).json({ error: "Could not fetch category by ID" });
  }
};

//CREATE A NEW CATEGORY
const createCategory = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(404).json({ error: "Please fill all fields" });
  }

  //Check If category name exists
  const categoryExists = await Category.findOne({ name: name });
  if (categoryExists) {
    return res.status(400).json({ error: "Category already exists." });
  }

  try {
    const newCategory: ICategory = new Category({
      name,
      description,
    });
    await newCategory.save();
    console.log("Category created...");
    return res.status(201).json(newCategory);
  } catch (error) {
    return res.status(500).json({ error: "Error creating category" });
  }
};

//UPDATE A CATEGORY
const updateCategory = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { name, description } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const updatedCategory: ICategory | null = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );
    if (!updatedCategory) {
      return res.status(400).json({ error: "Could not update Category" });
    }
    return res.status(200).json(updatedCategory);
  } catch (error) {
    return res.status(500).json({ error: "Error updating Category" });
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
    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Error deleting Category" });
  }
};

export {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
