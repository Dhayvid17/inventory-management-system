import express, { Request, Response } from "express";
import mongoose from "mongoose";
import Category, { ICategory } from "../models/categoryModel";
import Product from "../models/productModel";

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

  //Check if Category exists
  const categoryExists = await Category.findById(req.params.id);
  if (!categoryExists) {
    return res.status(400).json({ error: "Category does not exists." });
  }

  try {
    const deletedCategory: ICategory | null = await Category.findByIdAndDelete(
      req.params.id
    );

    if (deletedCategory) {
      //Find the product that contains the category
      const products = await Product.find({ category: req.params.id });
      for (const product of products) {
        //Remove the category reference from the product
        await Product.updateOne(
          { _id: product._id },
          { $pull: { category: { _id: req.params.id } } }
        );
        //Save the updated product
        await product.save();
      }
      return res.status(200).json({ message: "Category deleted successfully" });
    } else {
      return res.status(404).json({ error: "Category not found" });
    }
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Error deleting Category", details: error.message });
  }
};

export {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
