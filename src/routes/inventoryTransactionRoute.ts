import express, { Router } from "express";
import {
  getInventoryTransactions,
  getInventoryTransaction,
  createInventoryTransaction,
  updateInventoryTransaction,
  deleteInventoryTransaction,
} from "../controllers/inventoryTransactionController";

//Initialize Router
const router: Router = express.Router();

//ROUTES FOR INVENTORY TRANSACTIONS

//GET ALL INVENTORY TRANSACTIONS
router.get("/inventory-transactions", getInventoryTransactions);

//GET A SINGLE INVENTORY TRANSACTION
router.get("/inventory-transactions/:id", getInventoryTransaction);

//CREATE A NEW INVENTORY TRANSACTION
router.post("/inventory-transactions", createInventoryTransaction);

//UPDATE AN INVENTORY TRANSACTION
router.put("/inventory-transactions/:id", updateInventoryTransaction);

//DELETE INVENTORY TRANSACTION
router.delete("/inventory-transactions/:id", deleteInventoryTransaction);

export default router;
