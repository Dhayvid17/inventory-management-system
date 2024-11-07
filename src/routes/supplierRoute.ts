import express, { Router } from "express";
import {
  createSupplier,
  deleteSupplier,
  getSupplier,
  getSuppliers,
  updateSupplier,
} from "../controllers/supplierController";
import {
  authenticateToken,
  authorizeAdmin,
  authorizeStaff,
} from "../middlewares/authentication";

//Initialize Router
const router: Router = express.Router();

//ROUTES FOR SUPPLIERS

//GET ALL SUPPLIERS
router.get("/suppliers", getSuppliers);

//GET A SINGLE SUPPLIER
router.get("/suppliers/:id", getSupplier);

//CREATE A NEW SUPPLIER
router.post("/suppliers", createSupplier);

//UPDATE A SUPPLIER
router.put("/suppliers/:id", updateSupplier);

//DELETE SUPPLIER
router.delete("/suppliers/:id", deleteSupplier);

export default router;
