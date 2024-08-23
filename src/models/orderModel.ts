import mongoose, { Schema, model, ObjectId, Document } from "mongoose";

//Interface for product
interface IOrderProduct {
  productId: ObjectId;
  quantity: number;
}

//Interface representing Document in MongoDB
export interface IOrder extends Document {
  _id: ObjectId;
  totalPrice: number;
  totalQuantity: number;
  orderNumber: number;
  products: IOrderProduct[];
  status: string;
  user: ObjectId;
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
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
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
