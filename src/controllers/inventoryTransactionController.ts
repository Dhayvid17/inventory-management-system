import mongoose from "mongoose";
import InventoryTransaction, {
  IInventoryTransaction,
} from "../models/inventoryTransactionModel";
import { Request, Response } from "express";

//GET ALL INVENTORY TRANSACTIONS
const getInventoryTransactions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const transactions: IInventoryTransaction[] =
      await InventoryTransaction.find().populate("productId userId");
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
      await InventoryTransaction.findById(req.params.id).populate(
        "productId userId"
      );
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
  const { productId, quantity, transactionType, date, userId } = req.body;

  if (!productId || !quantity || transactionType || !date || !userId) {
    return res.status(400).json({ error: "Please fill all fields" });
  }

  try {
    const newTransaction: IInventoryTransaction = new InventoryTransaction({
      productId,
      quantity,
      transactionType,
      date,
      userId,
    });
    await newTransaction.save();
    console.log("Transaction created...");
    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(500).json({ error: "Could not add new transaction" });
  }
};

// UPDATE AN INVENTORY TRANSACTION
const updateInventoryTransaction = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { productId, quantity, transactionType, date, userId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const updatedInventory: IInventoryTransaction | null =
      await InventoryTransaction.findByIdAndUpdate(
        req.params.id,
        { productId, quantity, transactionType, date, userId },
        { new: true }
      );

    if (!updatedInventory) {
      return res.status(400).json({ error: "Could not update Inventory" });
    }
    res.status(201).json(updatedInventory);
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
