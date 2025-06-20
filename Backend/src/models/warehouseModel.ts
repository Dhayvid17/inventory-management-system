import mongoose, {
  Document,
  Schema,
  Types,
  ObjectId,
  HydratedDocument,
} from "mongoose";
import { IProduct } from "./productModel";

//Interface representing Document in MongoDB
export interface IWarehouseProduct {
  productId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
}

//Interface representing Document in MongoDB
export interface IWarehouse extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  type: string;
  managedBy: mongoose.Types.ObjectId[]; //(optional)
  location: string;
  capacity: number;
  products: IWarehouseProduct[];
  totalQuantity: number;
  totalValue: number;
}

//Create a new Schema that relates with the Interface
const warehouseSchema: Schema = new Schema<IWarehouse>({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["superWarehouse", "regularWarehouse"],
    default: "regularWarehouse",
    index: true, //Add an index to this field
    required: true,
  },
  managedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true, //Add an index to this field
    },
  ],
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
        default: 0,
      },
      price: {
        type: Number,
      },
      lastMovementDate: {
        type: Date,
        default: Date.now
      },
      _id: false,
    },
  ],
  totalQuantity: {
    type: Number,
    default: 0, //set dafault value
    required: true,
    validate: {
      validator: function (this: IWarehouse, value: number) {
        return value <= this.capacity;
      },
      message: "Total quantity exceeds warehouse capacity.",
    },
  },
  totalValue: {
    type: Number,
    default: 0, //set default value
    required: true,
  },
});

warehouseSchema.pre("save", function (next) {
  const warehouse = mongoose.model<IWarehouse, HydratedDocument<IWarehouse>>(
    "Warehouse",
    warehouseSchema
  );

  //Ensure products array exists before using forEach
  if (warehouse.products && warehouse.products.length > 0) {
    let totalQuantity = 0;
    let totalValue = 0;

    warehouse.products.forEach((product) => {
      totalQuantity += product.quantity;
      totalValue += product.quantity * product.price;
    });

    warehouse.totalQuantity = totalQuantity;
    warehouse.totalValue = totalValue;
  }

  next();
});

//Leaving this here incase I need to Add compound index for combined queries
warehouseSchema.index({ managedBy: 1, type: 1 });

const Warehouse = mongoose.model<IWarehouse>("Warehouse", warehouseSchema);
export default Warehouse;
