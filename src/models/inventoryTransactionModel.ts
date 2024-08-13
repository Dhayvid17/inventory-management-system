import mongoose, { Schema, model, Document } from "mongoose";

//Interface representing Document in MongoDB
export interface IInventoryTransaction extends Document {
  productId: Schema.Types.ObjectId;
  quantity: number;
  transactionType: string;
  date: Date;
  userId: Schema.Types.ObjectId;
}

//Create a new Schema that relates with the Interface
const InventoryTransactionSchema = new Schema<IInventoryTransaction>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  transactionType: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const InventoryTransaction = mongoose.model<IInventoryTransaction>(
  "InventoryTransaction",
  InventoryTransactionSchema
);
export default InventoryTransaction;
