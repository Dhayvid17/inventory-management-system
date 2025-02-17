import express, { Router } from "express";
import {
  getInventoryTransactions,
  getInventoryTransaction,
  createInventoryTransaction,
  updateInventoryTransaction,
  deleteInventoryTransaction,
} from "../controllers/inventoryTransactionController";
import {
  authenticateToken,
  authorizeAdmin,
  authorizeStaff,
} from "../middlewares/authentication";

//Initialize Router
const router: Router = express.Router();

//ROUTES FOR INVENTORY TRANSACTIONS

//GET ALL INVENTORY TRANSACTIONS
router.get(
  "/inventory-transactions",
  authenticateToken,
  authorizeStaff,
  getInventoryTransactions
);

//GET A SINGLE INVENTORY TRANSACTION
router.get(
  "/inventory-transactions/:id",
  authenticateToken,
  authorizeStaff,
  getInventoryTransaction
);

//CREATE A NEW INVENTORY TRANSACTION
router.post(
  "/inventory-transactions",
  authenticateToken,
  authorizeStaff,
  createInventoryTransaction
);

//UPDATE AN INVENTORY TRANSACTION
router.put(
  "/inventory-transactions/:id",
  authenticateToken,
  authorizeStaff,
  updateInventoryTransaction
);

//DELETE INVENTORY TRANSACTION
router.delete(
  "/inventory-transactions/:id",
  authenticateToken,
  authorizeAdmin,
  deleteInventoryTransaction
);

export default router;
