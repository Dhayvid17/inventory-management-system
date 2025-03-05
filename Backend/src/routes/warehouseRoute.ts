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
  authorizeAdmin,
  updateWarehouse
);

//DELETE A WAREHOUSE
router.delete(
  "/warehouses/:id",
  authenticateToken,
  authorizeAdmin,
  deleteWarehouse
);

//ADD PRODUCT TO WAREHOUSE
router.post(
  "/warehouses/add/product",
  authenticateToken,
  authorizeStaff,
  addProductToWarehouseHandler
);

//REMOVE PRODUCT FROM WAREHOUSE
router.delete(
  "/warehouses/remove/product",
  authenticateToken,
  authorizeStaff,
  removeProductFromWarehouseHandler
);

export default router;
