import express, { Router } from "express";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";
import {
  authenticateToken,
  authorizeAdmin,
  authorizeStaff,
} from "../middlewares/authentication";

//Initialize Router
const router: Router = express.Router();

//ROUTE FOR CATEGORIES

//ROUTE TO GET CATEGORIES
router.get("/categories", authenticateToken, authorizeStaff, getCategories);

//ROUTE TO GET A CATEGORY
router.get("/categories/:id", authenticateToken, authorizeStaff, getCategory);

//ROUTE TO CREATE A CATEGORY
router.post("/categories", authenticateToken, authorizeAdmin, createCategory);

//ROUTE TO UPDATE A CATEGORY
router.put(
  "/categories/:id",
  authenticateToken,
  authorizeAdmin,
  updateCategory
);

//ROUTE TO DELETE A CATEGORY
router.delete(
  "/categories/:id",
  authenticateToken,
  authorizeAdmin,
  deleteCategory
);

export default router;
