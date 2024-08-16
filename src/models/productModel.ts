import mongoose, { Schema, model, Document } from "mongoose";
import { IWarehouse } from "./warehouseModel";

//Interface representing Document in MongoDB
export interface IProduct extends Document {
  name: string;
  category: Schema.Types.ObjectId;
  price: number;
  quantity: number;
  warehouse: IWarehouse[];
}

// Create a new Schema that relates with the Interface
const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: Schema.Types.ObjectId,
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
  warehouse: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Warehouse",
    },
  ],
});

const Product = mongoose.model<IProduct>("Product", productSchema);
export default Product;
