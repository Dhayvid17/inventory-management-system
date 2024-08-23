import mongoose, { Schema, Document, ObjectId } from "mongoose";

//Interface representing Document in MongoDB
export interface IInventoryTransaction extends Document {
  transactionType: string;
  products: ObjectId[];
  quantity: number;
  transactionDate: Date;
  customerId?: ObjectId; //(optional)
  staffId: ObjectId;
  supplierId?: ObjectId; //(optional)
}

//Create a new Schema that relates with the Interface
const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    transactionType: {
      type: String,
      required: true,
      enum: [
        "Restock Transaction",
        "Sales Transaction",
        "Damaged Product",
        "Supplier Return",
        "Customer Return",
      ],
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
    ],
    quantity: {
      type: Number,
      required: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
    },
  },
  { timestamps: true }
);

const InventoryTransaction = mongoose.model<IInventoryTransaction>(
  "InventoryTransaction",
  InventoryTransactionSchema
);
export default InventoryTransaction;
