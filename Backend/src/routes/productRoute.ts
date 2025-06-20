import express, { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
  getDashboardStats,
} from "../controllers/productController";
import {
  authenticateToken,
  authorizeAdmin,
  authorizeStaff,
} from "../middlewares/authentication";

//Initialize Router
const router: Router = express.Router();

//ROUTES FOR PRODUCTS

//GET ALL PRODUCTS
router.get("/products", authenticateToken, authorizeStaff, getProducts);

//GET A SINGLE PRODUCT
router.get("/products/:id", authenticateToken, authorizeStaff, getProduct);

//CREATE A NEW PRODUCT
router.post("/products", authenticateToken, authorizeAdmin, createProduct);

//UPDATE A PRODUCT
router.put("/products/:id", authenticateToken, authorizeAdmin, updateProduct);

//DELETE A PRODUCT
router.delete(
  "/products/:id",
  authenticateToken,
  authorizeAdmin,
  deleteProduct
);

//GET DASHBOARD STATISTICS
router.get(
  "/dashboard/stats",
  authenticateToken,
  authorizeStaff,
  getDashboardStats
);

export default router;
