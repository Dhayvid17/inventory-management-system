import express, { Request, Response } from "express";
import Review, { IReview } from "../models/reviewModel";
import { sendReviewToAdmin } from "../services/notificationService";
import mongoose from "mongoose";

//GET ALL REVIEWS
const getAllReviews = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  try {
    //Check if reviews are valid
    const reviews: IReview[] = await Review.find().populate(
      "userId",
      "username"
    );
    if (!reviews) {
      return res.status(400).json("Reviews not found");
    }

    return res.status(200).json(reviews);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to fetch reviews", details: error.message });
  }
};

//GET A SPECIFIC REVIEW
const getSingleReview = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    //Check if review is valid
    const review: IReview | null = await Review.findById(
      req.params.id
    ).populate("userId", "username");

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    return res.status(200).json(review);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to fetch review", details: error.message });
  }
};

//CREATE A NEW REVIEW
const createReview = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { comment, rating, category } = req.body;
  const userId = (req as any).user.id; // Automatically populate the user field.

  try {
    const newReview: IReview = new Review({
      userId,
      comment,
      rating,
      category,
    });
    if (!newReview) {
      return res.status(400).json({ error: "Failed to create Review" });
    }

    await newReview.save();
    //Send notification to admin
    await sendReviewToAdmin(newReview);
    return res.status(201).json(newReview);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to add review", details: error.message });
  }
};

//DELETE REVIEW
const deleteReview = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  //Check if Review exists
  const reviewExists = await Review.findById(req.params.id);
  if (!reviewExists) {
    return res.status(400).json({ error: "Review does not exists." });
  }
  try {
    //Check if review is valid
    const review: IReview | null = await Review.findByIdAndDelete(
      req.params.id
    );
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to delete Review", detail: error.message });
  }
};

export { getAllReviews, getSingleReview, createReview, deleteReview };
