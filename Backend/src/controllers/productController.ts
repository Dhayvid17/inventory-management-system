import express, { Request, Response } from "express";
import Product, { IProduct } from "../models/productModel";
import mongoose, { ObjectId } from "mongoose";
import Category from "../models/categoryModel";
import Warehouse from "../models/warehouseModel";
import Supplier from "../models/supplierModel";
import InventoryTransaction from "../models/inventoryTransactionModel";

//GET ALL PRODUCTS
const getProducts = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  try {
    //Get pagination parameters from query
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 1000;
    const search = (req.query.search as string) || "";

    //Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    //Build the query with search functionality
    const searchQuery = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { "category.name": { $regex: search, $options: "i" } },
            { "supplier.name": { $regex: search, $options: "i" } },
          ],
        }
      : {};

    //Fetch products with pagination and search
    const totalCount = await Product.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalCount / limit);

    const products: IProduct[] = await Product.find(searchQuery)
      .populate("category")
      .populate("warehouse")
      .populate("supplier")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    if (!products) {
      return res.status(404).json({ error: "Products not found" });
    }
    console.log("Fetched products");
    return res.status(200).json({
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Could not fetch products", details: error.message });
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
    return res.status(200).json(product);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Could not fetch product", details: error.message });
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

    //Check if Product exists
    const productExists = await Product.findOne({ name: name });
    if (productExists) {
      return res.status(400).json({ error: "Product already exists." });
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
      category: mongoose.Types.ObjectId.createFromHexString(category),
      price,
      quantity,
      warehouse: mongoose.Types.ObjectId.createFromHexString(warehouse),
      supplier: mongoose.Types.ObjectId.createFromHexString(supplier),
    });
    //Save the new product
    await newProduct.save();

    //Step 3: Add the new product to the warehouse's products list
    warehouseExists.products.push({
      productId: newProduct._id,
      name: newProduct.name,
      quantity: newProduct.quantity,
      price: newProduct.price,
    });

    //Step 4: Update totalQuantity and totalValue
    warehouseExists.totalQuantity += newProduct.quantity;
    warehouseExists.totalValue += newProduct.quantity * newProduct.price;

    //Step 5: Save the updated warehouse
    await warehouseExists.save();

    return res.status(201).json({
      message: "Product created and assigned to warehouse",
      product: newProduct,
      warehouseExists,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Error adding new product", details: error.message });
  }
};

//UPDATE A PRODUCT
const updateProduct = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { name, category, price, quantity, supplier } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  if (!name || !category || !price || !quantity || !supplier) {
    return res.status(400).json({ error: "Please fill all fields" });
  }

  //Validate category existence
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    return res.status(400).json({
      error: "Category not found. Please create the category first.",
    });
  }

  //Validate supplier existence
  const supplierExists = await Supplier.findById(supplier);
  if (!supplierExists) {
    return res.status(400).json({
      error: "Supplier not found. Please create the supplier first.",
    });
  }

  //Check if product exists
  const productExists = await Product.findById(req.params.id);
  if (!productExists) {
    return res.status(400).json({ error: "Product does not exists." });
  }

  try {
    const updatedProduct: IProduct | null = await Product.findByIdAndUpdate(
      req.params.id,
      { name, category, price, quantity, supplier },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(400).json({ error: "Could not update Product" });
    }
    //Find the warehouses that contain this product
    const warehouses = await Warehouse.find({
      "products.productId": req.params.id,
    });

    //Update the product information in each warehouse
    for (const warehouse of warehouses) {
      const productInWarehouse = warehouse.products.find(
        (p) => p.productId.toString() === req.params.id
      );

      if (productInWarehouse) {
        //Update the product information in the warehouse
        productInWarehouse.name = updatedProduct.name;
        productInWarehouse.price = updatedProduct.price;
        productInWarehouse.quantity = updatedProduct.quantity;

        //If the quantity is changed, update totalQuantity in the warehouse
        const quantityDifference =
          updatedProduct.quantity - productExists.quantity;
        warehouse.totalQuantity += quantityDifference;

        //Update totalValue in the warehouse
        warehouse.totalValue +=
          (updatedProduct.price - productExists.price) *
          updatedProduct.quantity;

        //Save the updated warehouse
        await warehouse.save();
      }
    }

    return res.status(200).json(updatedProduct);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to update product", details: error.message });
  }
};

//DELETE A PRODUCT
const deleteProduct = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  //Check if product exists
  const productExists = await Product.findById(req.params.id);
  if (!productExists) {
    return res.status(400).json({ error: "Product does not exists." });
  }

  try {
    const deletedProduct: IProduct | null = await Product.findByIdAndDelete(
      req.params.id
    );

    if (deletedProduct) {
      //Find the warehouse that contains the product
      const warehouses = await Warehouse.find(
        { "products.productId": req.params.id } //Find warehouses with the product
      );
      for (const warehouse of warehouses) {
        //Remove the product reference from the warehouse
        await Warehouse.updateOne(
          { _id: warehouse._id },
          { $pull: { products: { productId: req.params.id } } } //Remove product reference
        );
        //Update the total quantity and total value in the warehouse
        warehouse.totalQuantity -= deletedProduct.quantity;
        warehouse.totalValue -= deletedProduct.price * deletedProduct.quantity;

        //Save the updated warehouse
        await warehouse.save();
      }
      return res.status(200).json({
        message: "Product deleted and references updated successfully",
      });
    } else {
      return res.status(400).json({ error: "Product not found" });
    }
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Failed to delete Product", details: error.message });
  }
};

//GET DASHBOARD STATISTICS
const getDashboardStats = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  try {
    //Total number of products
    const totalProducts = await Product.countDocuments();

    //Products with stock less than 10
    const lowStockItems = await Product.countDocuments({
      quantity: { $lt: 10 },
    });

    //Recent transactions (last 5 days)
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const recentTransactions = await InventoryTransaction.countDocuments({
      createdAt: { $gte: fiveDaysAgo },
    });

    return res.status(200).json({
      totalProducts,
      lowStockItems,
      recentTransactions,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Could not fetch dashboard stats",
      details: error.message,
    });
  }
};

export {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getDashboardStats,
};
