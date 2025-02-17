import mongoose, { Schema, Document, ObjectId, Types } from "mongoose";
import { IProduct } from "./productModel";

//Interface representing Document in MongoDB
export interface ITransferRequestProduct {
  productId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  status: "Pending" | "Accepted" | "Rejected"; // Add status field
}

//Interface representing Document in MongoDB
export interface ITransferRequest extends Document {
  fromWarehouseId: mongoose.Types.ObjectId;
  toWarehouseId: mongoose.Types.ObjectId;
  products: ITransferRequestProduct[];
  status: string;
  totalQuantity: number;
  totalPrice: number;
  transferType: string;
  requestedBy: mongoose.Types.ObjectId;
  approvedBy: mongoose.Types.ObjectId;
  requestDate: Date;
  approvalDate?: Date;
  completionDate?: Date;
  cancellationDate?: Date;
  declineDate?: Date;
  failedRequestDate?: Date;
  note?: string;
}

const TransferRequestSchema = new mongoose.Schema(
  {
    fromWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    toWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: {
          type: String,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
        },
        status: {
          type: String,
          enum: ["Pending", "Accepted", "Rejected"],
          default: "Pending",
        },
        _id: false,
      },
    ],
    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Declined",
        "In Transit",
        "Completed",
        "Cancelled",
        "Transferred",
        "Failed Transfer Request",
      ],
      default: "Pending",
    },
    totalQuantity: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    transferType: {
      type: String,
      enum: ["SuperToRegular", "RegularToRegular", "RegularToSuper"],
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }, //optional, for when the request is approved
    requestDate: {
      type: Date,
      default: Date.now,
    },
    approvalDate: {
      type: Date,
    },
    failedRequestDate: {
      type: Date,
    },
    note: {
      type: String,
    }, //optional, for when the request is rejected
  },
  { timestamps: true }
);

const TransferRequest = mongoose.model<ITransferRequest>(
  "TransferRequest",
  TransferRequestSchema
);
export default TransferRequest;
