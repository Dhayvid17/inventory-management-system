import express, { Router } from "express";
import getWarehouseStockSummaryController from "../controllers/warehouseInventoryController";
import {
  authenticateToken,
  authorizeStaff,
} from "../middlewares/authentication";

const router: Router = express.Router();

//ROUTE TO GET ALL WAREHOUSE INVENTORIES
router.post(
  "/warehouses/:warehouseId/inventory",
  authenticateToken,
  authorizeStaff,
  getWarehouseStockSummaryController
);

export default router;
