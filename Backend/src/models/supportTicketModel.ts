import mongoose, { Schema, Document, ObjectId } from "mongoose";
import { IOrder } from "./orderModel";

export interface ISupportTicket extends Document {
  createdBy: mongoose.Types.ObjectId;
  title: string;
  description: string;
  priority: string;
  status: string;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Open", "Close"],
      default: "Open",
    },
  },
  { timestamps: true }
);

const SupportTicket = mongoose.model<ISupportTicket>(
  "SupportTicket",
  SupportTicketSchema
);
export default SupportTicket;
