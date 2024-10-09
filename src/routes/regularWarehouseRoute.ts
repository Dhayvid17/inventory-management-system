import express, { Router } from "express";
import {
  getRegularWarehouses,
  getRegularWarehouse,
  // createRegularWarehouse,
  // updateRegularWarehouse,
  // deleteRegularWarehouse,
} from "../controllers/regularWarehouseController";

//Initialize Router
const router: Router = express.Router();

//ROUTE TO GET ALL REGULAR WAREHOUSES
router.get("/regularWarehouses", getRegularWarehouses);

//ROUTE TO GET A SINGLE WAREHOUSE
router.get("/regularWarehouses/:id", getRegularWarehouse);

// //ROUTE TO CREATE A NEW REGULAR WAREHOUSE
// router.post("/regularWarehouses", createRegularWarehouse);

// //ROUTE TO UPDATE REGULAR WAREHOUSE
// router.put("/regularWarehouses/:id", updateRegularWarehouse);

// //ROUTE TO DELETE A REGULAR WAREHOUSE
// router.delete("/regularWarehouses/:id", deleteRegularWarehouse);

export default router;
