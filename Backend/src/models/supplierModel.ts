import mongoose, { Document, Schema } from "mongoose";

//Interface representing Document in MongoDB
export interface ISupplier extends Document {
  name: string;
  contact: string;
  email: string;
  address: string;
}

//Create a new Schema that relates with the Interface
const supplierSchema = new Schema<ISupplier>({
  name: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
});

const Supplier = mongoose.model<ISupplier>("Supplier", supplierSchema);
export default Supplier;
