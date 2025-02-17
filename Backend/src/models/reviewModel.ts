import mongoose, { Schema, Document, ObjectId } from "mongoose";
import { IProduct } from "./productModel";

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  comment: string;
  rating: number;
  category?: string;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    category: {
      type: String,
      enum: ["Customer Service", "Platform", "Product Experience"], // Optional field
    },
  },
  { timestamps: true }
);

const Review = mongoose.model<IReview>("Review", ReviewSchema);
export default Review;
