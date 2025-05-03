import express, { Router } from "express";
import {
  getInventoryStatus,
  getInventoryMovement,
  getInventoryAging,
  getTransferEfficiency,
  getLowStockAlerts,
  getDashboardSummary,
} from "../controllers/reportingController";
import {
  authenticateToken,
  authorizeStaff,
  authorizeAdmin,
} from "../middlewares/authentication";

// Initialize Router
const router: Router = express.Router();

//ROUTES FOR ANALYTICS/REPORTING

//GET ALL INVENTORY STATUS
router.get(
  "/analytics/inventory-status",
  authenticateToken,
  authorizeStaff,
  getInventoryStatus
);

//GET INVENTORY MOVEMENT
router.get(
  "/analytics/inventory-movement",
  authenticateToken,
  authorizeStaff,
  getInventoryMovement
);

//GET INVENTORY AGING
router.get(
  "/analytics/inventory-aging",
  authenticateToken,
  authorizeStaff,
  getInventoryAging
);

//GET TRANSFER EFFICIENCY
router.get(
  "/analytics/transfer-efficiency",
  authenticateToken,
  authorizeStaff,
  getTransferEfficiency
);

//GET LOW STOCK ALERTS
router.get(
  "/analytics/low-stock-alerts",
  authenticateToken,
  authorizeStaff,
  getLowStockAlerts
);

router.get(
  "/dashboard-summary",
  authenticateToken,
  authorizeStaff,
  getDashboardSummary
);

export default router;
