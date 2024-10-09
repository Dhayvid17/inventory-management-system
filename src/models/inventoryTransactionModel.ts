import mongoose, { Schema, Document, ObjectId } from "mongoose";
import { IProduct } from "./productModel";

//Interface representing Document in MongoDB
export interface IInventoryTransaction extends Document {
  action?: string; //(Optional)
  transactionType: string;
  fromWarehouseId?: mongoose.Types.ObjectId; //(optional)
  toWarehouseId?: mongoose.Types.ObjectId; //(optional)
  warehouseId?: mongoose.Types.ObjectId; //(optional)
  products: IProduct[];
  quantity?: number; //(optional)
  totalValue: number; //(optional)
  transactionDate: Date;
  adminId?: mongoose.Types.ObjectId; //(optional)
  customerId?: mongoose.Types.ObjectId; //(optional)
  staffId: mongoose.Types.ObjectId;
  supplierId?: mongoose.Types.ObjectId; //(optional)
  interWarehouseTransferStatus?: string; //(optional)
  note?: string; //(Optional)
}

//Create a new Schema that relates with the Interface
const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    action: {
      type: String,
      enum: [
        "Add Product To Warehouse",
        "Remove Product From Warehouse",
        "Product Transferred In",
        "Product Transferred Out",
      ],
    },
    transactionType: {
      type: String,
      required: true,
      enum: [
        "Restock Transaction",
        "Sales Transaction",
        "Damaged Product",
        "Supplier Return",
        "Customer Return",
        "Online Order",
        "Inter-Warehouse Transfer",
        "Addition/Removal of Product From Warehouse",
        "Failed Transfer Request",
      ],
    },
    fromWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
    },
    toWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: {
          type: String,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
        },
        _id: false, // <-- Disable automatic _id generation for subdocuments
      },
    ],
    quantity: {
      type: Number,
    },
    totalValue: {
      type: Number,
      required: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },
    interWarehouseTransferStatus: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Declined",
        "In Transit",
        "Completed",
        "Cancelled",
        "Failed Transfer Request",
      ],
      default: "Pending",
      required: function () {
        return this.transactionType === "Inter-Warehouse Transfer";
      },
    },
    note: {
      type: String,
    },
  },
  { timestamps: true }
);

const InventoryTransaction = mongoose.model<IInventoryTransaction>(
  "InventoryTransaction",
  InventoryTransactionSchema
);
export default InventoryTransaction;
