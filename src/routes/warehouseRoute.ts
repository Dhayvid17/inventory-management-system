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

//Initialize Router
const router: Router = express.Router();

//ROUTES FOR WAREHOUSES

//GET ALL WAREHOUSES
router.get("/warehouses", getWarehouses);

//GET A SINGLE WAREHOUSE
router.get("/warehouses/:id", getWarehouse);

//CREATE A WAREHOUSE
router.post("/warehouses", createWarehouse);

//UPDATE A WAREHOUSE
router.put("/warehouses/:id", updateWarehouse);

//DELETE WAREHOUSE
router.delete("/warehouses/:id", deleteWarehouse);

//ADD PRODUCT TO WAREHOUSE
router.post(
  "/warehouses/:warehouseId/products/:productId",
  addProductToWarehouseHandler
);

//REMOVE PRODUCT FROM WAREHOUSE
router.delete(
  "/warehouses/:warehouseId/products/remove/:productId",
  removeProductFromWarehouseHandler
);

export default router;
