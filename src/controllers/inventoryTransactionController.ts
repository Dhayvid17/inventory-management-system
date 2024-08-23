import mongoose from "mongoose";
import InventoryTransaction, {
  IInventoryTransaction,
} from "../models/inventoryTransactionModel";
import { Request, Response } from "express";
import Product from "../models/productModel";
import User from "../models/userModel";
import Supplier from "../models/supplierModel";
import Order from "../models/orderModel";

//GET ALL INVENTORY TRANSACTIONS
const getInventoryTransactions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const transactions: IInventoryTransaction[] =
      await InventoryTransaction.find()
        .populate("products", "name")
        .populate("staffId", "username")
        .populate("supplierId", "name");
    console.log("Fetched transactions...");
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ error: "Could not fetched transactions" });
  }
};

//GET A SINGLE INVENTORY TRANSACTION
const getInventoryTransaction = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid Document" });
  }

  try {
    const transaction: IInventoryTransaction | null =
      await InventoryTransaction.findById(req.params.id)
        .populate("products", "name")
        .populate("staffId", "username")
        .populate("supplierId", "name");
    if (!transaction) {
      return res.status(400).json({ error: "Document not found" });
    }
    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch transaction" });
  }
};

//CREATE A NEW INVENTORY TRANSACTION
const createInventoryTransaction = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { transactionType, products, quantity, customerId, supplierId } =
    req.body;
  console.log(req.body);
  const staffId = (req as any).user.id;
  if (
    !transactionType ||
    !products ||
    products.length === 0 ||
    !quantity ||
    (["Sales Transaction", "Customer Return"].includes(transactionType) &&
      !customerId) ||
    (["Restock Transaction", "Supplier Return"].includes(transactionType) &&
      !supplierId)
  ) {
    return res.status(400).json({ error: "Please fill all fields" });
  }

  try {
    //Validate the transaction type
    const validTypes = [
      "Restock Transaction",
      "Sales Transaction",
      "Damaged Product",
      "Supplier Return",
      "Customer Return",
    ];
    if (!validTypes.includes(transactionType)) {
      return res.status(400).json({ error: "Invalid transaction type" });
    }

    //Check if all product IDs are valid
    const validProducts = await Product.find({ _id: { $in: products } });
    if (validProducts.length !== products.length) {
      return res.status(404).json({ error: "One or more products not found" });
    }

    // Validate the product-supplier association
    for (let product of validProducts) {
      if (
        ["Restock Transaction", "Supplier Return"].includes(transactionType) &&
        product.supplier.toString() !== supplierId
      ) {
        return res.status(400).json({
          error: `Product ${product.name} does not belong to the specified supplier.`,
        });
      }
    }

    //Validate user existence
    const user = await User.findById(staffId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    //Validate customer ID for sales and customer returns
    if (["Sales Transaction", "Customer Return"].includes(transactionType)) {
      const customerOrder = await Order.findOne({
        "products.productId": { $in: products },
        user: customerId, // Ensure the customer ID matches the order
      });

      if (!customerOrder) {
        return res
          .status(404)
          .json({ error: "No matching order found for the customer" });
      }
    }

    for (let product of validProducts) {
      let updatedQuantity = product.quantity;

      // HANDLE DIFFERENT TRANSACTION TYPES
      switch (transactionType) {
        case "Restock Transaction":
          const restockSupplier = await Supplier.findById(supplierId);
          if (!restockSupplier) {
            return res.status(404).json({ error: "Supplier not found" });
          }
          updatedQuantity += quantity;
          break;

        case "Sales Transaction":
        case "Damaged Product":
          if (product.quantity < quantity) {
            return res.status(400).json({ error: "Insufficient stock" });
          }
          updatedQuantity -= quantity;
          break;

        case "Supplier Return":
          const returnSupplier = await Supplier.findById(supplierId);
          if (!returnSupplier) {
            return res.status(404).json({ error: "Supplier not found" });
          }
          if (product.quantity < quantity) {
            return res.status(400).json({ error: "Insufficient stock" });
          }
          updatedQuantity -= quantity;
          break;

        case "Customer Return":
          updatedQuantity += quantity;
          break;

        default:
          return res.status(400).json({ error: "Invalid transaction type" });
      }

      //Update product quantity
      product.quantity = updatedQuantity;
      await product.save();
    }

    //Save new Inventory transaction
    const newInventory: IInventoryTransaction = new InventoryTransaction({
      transactionType,
      products,
      quantity,
      customerId: ["Sales Transaction", "Customer Return"].includes(
        transactionType
      )
        ? customerId
        : undefined, //Optional based on transaction type
      staffId,
      supplierId: ["Restock Transaction", "Supplier Return"].includes(
        transactionType
      )
        ? supplierId
        : undefined, //Optional based on transaction type
    });
    await newInventory.save();
    console.log("Transaction created...");
    res.status(201).json(newInventory);
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to create new inventory transaction",
      details: error.message,
    });
  }
};

// UPDATE AN INVENTORY TRANSACTION
const updateInventoryTransaction = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { transactionType, productId, quantity, customerId, supplierId } =
    req.body;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const updatedInventory: IInventoryTransaction | null =
      await InventoryTransaction.findByIdAndUpdate(
        req.params.id,
        { transactionType, productId, quantity, customerId, supplierId },
        { new: true }
      );

    if (!updatedInventory) {
      return res.status(404).json({ error: "Inventory transaction not found" });
    }
    res.status(200).json(updatedInventory);
  } catch (error) {
    res.status(500).json({ error: "Failed to update Inventory" });
  }
};

//DELETE AN INVENTORY TRANSACTION
const deleteInventoryTransaction = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const deletedInventoryTransaction: IInventoryTransaction | null =
      await InventoryTransaction.findByIdAndDelete(req.params.id);
    if (!deletedInventoryTransaction) {
      return res.status(400).json({ error: "Inventory transaction not found" });
    }
    res
      .status(201)
      .json({ message: "Inventory transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Could not delete Inventory transaction" });
  }
};

export {
  getInventoryTransactions,
  getInventoryTransaction,
  createInventoryTransaction,
  updateInventoryTransaction,
  deleteInventoryTransaction,
};

// const product = await Product.findById(productId);
// if (!product) {
//   return res.status(404).json({ error: "Product not found" });
// }
