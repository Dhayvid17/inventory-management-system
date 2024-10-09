import express, { Router } from "express";
import {
  getSuperWarehouses,
  getSuperWarehouse,
  // createSuperWarehouse,
  // updateSuperWarehouse,
  // deleteSuperWarehouse,
} from "../controllers/superWarehouseController";

//Initialize Router
const router: Router = express.Router();

//ROUTE TO GET ALL SUPERWAREHOUSES
router.get("/superWarehouses", getSuperWarehouses);

//ROUTE TO GET A SINGLE WAREHOUSE
router.get("/superWarehouses/:id", getSuperWarehouse);

// //ROUTE TO CREATE A SUPER WAREHOUSE
// router.post("/superWarehouses", createSuperWarehouse);

// //ROUTE TO UPDATE SUPER WAREHOUSE
// router.put("/superWarehouses/:id", updateSuperWarehouse);

// //ROUTE TO DELETE SUPER WAREHOUSE
// router.delete("/superWarehouses/:id", deleteSuperWarehouse);

export default router;
