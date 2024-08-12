import mongoose, { Schema, model, Document } from "mongoose";

//Interface representing Document in MongoDB
interface Iproduct extends Document {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

// Create a new Schema that relates with the Interface
const productSchema = new Schema<Iproduct>({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
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

const Product = mongoose.model<Iproduct>("Product", productSchema);
export default Product;
