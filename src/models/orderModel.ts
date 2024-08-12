import mongoose, { Schema, model, Document } from "mongoose";

//Interface for product
interface IOrderProduct {
  productId: Schema.Types.ObjectId;
  quantity: number;
}

//Interface representing Document in MongoDB
interface Iorder extends Document {
  name: string;
  totalPrice: number;
  products: IOrderProduct[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create a new Schema that relates with the Interface
const orderSchema = new Schema<Iorder>({
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model<Iorder>("Order", orderSchema);
export default Order;
