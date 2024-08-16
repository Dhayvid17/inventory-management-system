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
router.get("/suppliers", authenticateToken, authorizeStaff, getSuppliers);

//GET A SINGLE SUPPLIER
router.get("/suppliers/:id", authenticateToken, authorizeStaff, getSupplier);

//CREATE A NEW SUPPLIER
router.post("/suppliers", authenticateToken, authorizeStaff, createSupplier);

//UPDATE A SUPPLIER
router.put("/suppliers/:id", authenticateToken, authorizeStaff, updateSupplier);

//DELETE SUPPLIER
router.delete(
  "/suppliers/:id",
  authenticateToken,
  authorizeAdmin,
  deleteSupplier
);

export default router;
