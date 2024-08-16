import express, { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
} from "../controllers/productController";

//Initialize Router
const router: Router = express.Router();

//ROUTES FOR PRODUCTS

//GET ALL PRODUCTS
router.get("/products", getProducts);

//GET A SINGLE PRODUCT
router.get("/products/:id", getProduct);

//CREATE A NEW PRODUCT
router.post("/products", createProduct);

//UPDATE A PRODUCT
router.put("/products/:id", updateProduct);

//DELETE A PRODUCT
router.delete("/products/:id", deleteProduct);

export default router;
