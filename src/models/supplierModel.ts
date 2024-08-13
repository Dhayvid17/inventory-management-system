import mongoose, { Document, Schema } from "mongoose";
import { IProduct } from "./productModel";

//Interface representing Document in MongoDB
export interface ISupplier extends Document {
  name: string;
  contactInfo: string;
  products: IProduct[];
  address: string;
}

//Create a new Schema that relates with the Interface
const supplierSchema = new Schema<ISupplier>({
  name: {
    type: String,
    required: true,
  },
  contactInfo: {
    type: String,
    required: true,
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  address: {
    type: String,
    required: true,
  },
});

const Supplier = mongoose.model<ISupplier>("Supplier", supplierSchema);
export default Supplier;
