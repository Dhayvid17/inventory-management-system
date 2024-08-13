import mongoose, { Document, Schema } from "mongoose";
import { IProduct } from "./productModel";

//Interface representing Document in MongoDB
export interface ICategory extends Document {
  name: string;
  description?: string;
  products: IProduct[];
}

//Create a new Schema that relates with Interface
const categorySchema: Schema = new Schema<ICategory>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: false,
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
});

const Category = mongoose.model<ICategory>("Category", categorySchema);
export default Category;
