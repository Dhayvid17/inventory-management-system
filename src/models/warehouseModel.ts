import mongoose, { Document, Schema, Types } from "mongoose";
import { IProduct } from "./productModel";

//Interface representing Document in MongoDB
export interface IWarehouse extends Document {
  _id: string;
  name: string;
  location: string;
  capacity: number;
  products: Types.ObjectId[];
}

//Create a new Schema that relates with the Interface
const warehouseSchema: Schema = new Schema<IWarehouse>({
  name: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
});

const Warehouse = mongoose.model<IWarehouse>("Warehouse", warehouseSchema);
export default Warehouse;
