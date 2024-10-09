import mongoose, { Schema, model, ObjectId, Document } from "mongoose";
import { IProduct } from "./productModel";
import { IUser } from "./userModel";

//Interface representing Document in MongoDB
export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  totalPrice: number;
  totalQuantity: number;
  orderNumber: number;
  products: IProduct[];
  status: string;
  user: mongoose.Types.ObjectId | IUser;
}

// Create a new Schema that relates with the Interface
const orderSchema = new Schema<IOrder>(
  {
    totalPrice: {
      type: Number,
      required: true,
    },
    totalQuantity: {
      type: Number,
      required: true,
    },
    orderNumber: {
      type: Number,
      required: true,
      unique: true,
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
        _id: false, // <-- Disable automatic _id generation for subdocuments
      },
    ],
    status: {
      type: String,
      required: true,
      enum: [
        "Order Received",
        "Processing",
        "Out For Delivery",
        "Delivered",
        "Cancelled Order",
        "Updated Order",
        "Deleted Order",
      ],
      default: "Order Received",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model<IOrder>("Order", orderSchema);
export default Order;
