import express, { Router } from "express";
import getWarehouseStockSummaryController from "../controllers/warehouseInventoryController";

const router: Router = express.Router();

//ROUTE TO GET ALL WAREHOUSE INVENTORIES
router.post(
  "/warehouses/:warehouseId/inventory",
  getWarehouseStockSummaryController
);

export default router;
