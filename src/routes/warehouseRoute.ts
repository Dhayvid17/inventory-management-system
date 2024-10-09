import express, { Router } from "express";
import {
  createWarehouse,
  deleteWarehouse,
  getWarehouses,
  getWarehouse,
  updateWarehouse,
  addProductToWarehouseHandler,
  removeProductFromWarehouseHandler,
} from "../controllers/warehouseController";
import {
  authenticateToken,
  authorizeAdmin,
  authorizeStaff,
} from "../middlewares/authentication";

//Initialize Router
const router: Router = express.Router();

//GET ALL WAREHOUSES
router.get("/warehouses", authenticateToken, authorizeStaff, getWarehouses);

//GET A SINGLE WAREHOUSE
router.get("/warehouses/:id", authenticateToken, authorizeStaff, getWarehouse);

//CREATE A WAREHOUSE
router.post("/warehouses", authenticateToken, authorizeAdmin, createWarehouse);

//UPDATE A WAREHOUSE
router.put(
  "/warehouses/:id",
  authenticateToken,
  authorizeStaff,
  updateWarehouse
);

//DELETE A WAREHOUSE
router.delete(
  "/warehouses/:id",
  authenticateToken,
  authorizeAdmin,
  deleteWarehouse
);
// "/warehouses/:warehouseId/products/add/:productId",
//ADD PRODUCT TO WAREHOUSE
router.post(
  "/warehouses/add/product",
  authenticateToken,
  authorizeStaff,
  addProductToWarehouseHandler
);
// "/warehouses/:warehouseId/products/remove/:productId"
//REMOVE PRODUCT FROM WAREHOUSE
router.delete(
  "/warehouses/remove/product",
  authenticateToken,
  authorizeStaff,
  removeProductFromWarehouseHandler
);

export default router;
