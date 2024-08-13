import mongoose, { Document, Schema } from "mongoose";
import { IProduct } from "./productModel";

//Interface representing Document in MongoDB
export interface IWarehouse extends Document {
  name: string;
  location: string;
  capacity: number;
  products: IProduct[];
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
