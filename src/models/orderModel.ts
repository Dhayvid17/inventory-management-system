import mongoose, { Schema, model, Document } from "mongoose";

//Interface for product
interface IOrderProduct {
  productId: Schema.Types.ObjectId;
  quantity: number;
}

//Interface representing Document in MongoDB
export interface IOrder extends Document {
  name: string;
  totalPrice: number;
  products: IOrderProduct[];
  status: string;
}

// Create a new Schema that relates with the Interface
const orderSchema = new Schema<IOrder>(
  {
    name: {
      type: String,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    products: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model<IOrder>("Order", orderSchema);
export default Order;
