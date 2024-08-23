import mongoose, { Schema, model, Document } from "mongoose";
import { IWarehouse } from "./warehouseModel";

//Interface representing Document in MongoDB
export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId; // Ensure _id is of type ObjectId
  name: string;
  category: Schema.Types.ObjectId;
  price: number;
  quantity: number;
  warehouse: Schema.Types.ObjectId;
  supplier: Schema.Types.ObjectId;
}

// Create a new Schema that relates with the Interface
const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
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
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: true,
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    required: true,
  },
});

const Product = mongoose.model<IProduct>("Product", productSchema);
export default Product;
