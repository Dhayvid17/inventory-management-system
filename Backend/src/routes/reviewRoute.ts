import express, { Router } from "express";
import {
  getAllReviews,
  getSingleReview,
  createReview,
  deleteReview,
} from "../controllers/reviewController";

//Initialize Router
const router: Router = express.Router();

//ROUTE TO ADD REVIEW
router.post("/add-review", createReview);

export default router;
