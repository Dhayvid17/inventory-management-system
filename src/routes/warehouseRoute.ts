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
router.get("/warehouses", getWarehouses);

//GET A SINGLE WAREHOUSE
router.get("/warehouses/:id", getWarehouse);

//CREATE A WAREHOUSE
router.post("/warehouses", createWarehouse);

//UPDATE A WAREHOUSE
router.put("/warehouses/:id", updateWarehouse);

//DELETE A WAREHOUSE
router.delete("/warehouses/:id", deleteWarehouse);
// "/warehouses/:warehouseId/products/add/:productId",
//ADD PRODUCT TO WAREHOUSE
router.post("/warehouses/add/product", addProductToWarehouseHandler);
// "/warehouses/:warehouseId/products/remove/:productId"
//REMOVE PRODUCT FROM WAREHOUSE
router.delete("/warehouses/remove/product", removeProductFromWarehouseHandler);

export default router;
