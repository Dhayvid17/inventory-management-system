import mongoose, { ObjectId } from "mongoose";
import Product, { IProduct } from "../models/productModel";
import Warehouse from "../models/warehouseModel";
import InventoryTransaction from "../models/inventoryTransactionModel";

//FUNCTIONS TO LOG INVENTORY EVENTS FOR ADD PRODUCTS, REMOVE AND TRANSFER
const logInventoryEvent = async (
  action: string,
  transactionType: string,
  warehouseId: mongoose.Types.ObjectId,
  products: { productId: mongoose.Types.ObjectId; quantity: number }[],
  totalValue: number,
  staffId?: mongoose.Types.ObjectId,
  note?: string
) => {
  try {
    //Create an array of products to log
    const productsToLog = await Promise.all(
      products.map(async ({ productId, quantity }) => {
        //Find product details to log it in the transaction
        const product = await Product.findById(productId).lean();
        if (!product) {
          throw new Error("Product not found for logging transaction.");
        }
        return {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity,
        };
      })
    );
    const transaction = new InventoryTransaction({
      action,
      transactionType,
      warehouseId,
      products: productsToLog,
      totalValue,
      staffId: staffId || null,
      transactionDate: new Date(),
      note: `${action} of product`,
    });
    await transaction.save();
  } catch (error: any) {
    console.error("Error logging inventory event", error.message);
    throw new Error(error.message || "Could not log inventory event.");
  }
};

//ADD A PRODUCT TO WAREHOUSE AND UPDATE
const addProductToWarehouse = async (
  warehouseId: mongoose.Types.ObjectId,
  productId: mongoose.Types.ObjectId,
  staffId?: mongoose.Types.ObjectId
) => {
  //Initialize Session Transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const warehouseObjectId = new mongoose.Types.ObjectId(warehouseId);
    const productObjectId = new mongoose.Types.ObjectId(productId);

    if (
      !mongoose.Types.ObjectId.isValid(warehouseObjectId) ||
      !mongoose.Types.ObjectId.isValid(productObjectId) ||
      (staffId && !mongoose.Types.ObjectId.isValid(staffId))
    ) {
      throw new Error("Invalid warehouse, product, or Staff Id.");
    }

    //Find warehouse by Id
    const warehouse = await Warehouse.findById(warehouseObjectId)
      .session(session)
      .lean();
    if (!warehouse) {
      throw new Error("Warehouse not found.");
    }

    //Check if Product exists
    const product = await Product.findById(productObjectId)
      .session(session)
      .lean();
    if (!product) {
      throw new Error("Product not found.");
    }

    //Check if the product is already in the warehouse
    if (product.warehouse && product.warehouse.equals(warehouseObjectId)) {
      throw new Error("Product is already added to this warehouse");
    }

    let currentTotalQuantity = 0;
    //Check current total quantity in the warehouse
    if (warehouse.products) {
      currentTotalQuantity = warehouse.products.reduce(
        (acc: number, product: any) => acc + product.quantity,
        0
      );
    }

    //Check if adding this product would exceed warehouse capacity
    if (currentTotalQuantity + product.quantity > warehouse.capacity) {
      throw new Error("Adding this product would exceed warehouse capacity.");
    }

    //Check if product's warehouse is null
    if (product.warehouse === null) {
      // Proceed to assign the product to the new warehouse
      await Product.findByIdAndUpdate(productObjectId, {
        warehouse: warehouseObjectId,
      }).session(session);
      //Check if the product's warehouse field matches the warehouseId
    } else if (product.warehouse.equals(warehouseObjectId)) {
      throw new Error("Product is already added to this warehouse");
    }

    //Add product to warehouse
    await Warehouse.findByIdAndUpdate(warehouseObjectId, {
      $addToSet: {
        products: {
          productId: product._id,
          name: product.name,
          quantity: product.quantity,
          price: product.price,
        },
      },
      $inc: {
        totalQuantity: product.quantity,
        totalValue: product.price * product.quantity,
      },
    }).session(session);

    //Log to inventory
    await logInventoryEvent(
      "Add Product To Warehouse",
      "Addition/Removal of Product From Warehouse",
      warehouseObjectId,
      [{ productId: productObjectId, quantity: product.quantity }],
      product.price * product.quantity,
      staffId
    );
    await session.commitTransaction();
    console.log("Product added to warehouse successfully");
  } catch (error: any) {
    await session.abortTransaction();
    console.log("Error adding product to warehouse", error.message);
    throw new Error(error.message || "Could not add product to warehouse...");
  } finally {
    session.endSession();
  }
};

//REMOVE A PRODUCT FROM THE WAREHOUSE
const removeProductFromWarehouse = async (
  warehouseId: mongoose.Types.ObjectId,
  productId: mongoose.Types.ObjectId,
  staffId?: mongoose.Types.ObjectId
) => {
  //Initialize Session Transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const warehouseObjectId = new mongoose.Types.ObjectId(warehouseId);
    const productObjectId = new mongoose.Types.ObjectId(productId);
    if (
      !mongoose.Types.ObjectId.isValid(warehouseObjectId) ||
      !mongoose.Types.ObjectId.isValid(productObjectId)
    ) {
      throw new Error("Invalid warehouse or product ID.");
    }
    //Find the warehouse
    const warehouse = await Warehouse.findById(warehouseObjectId)
      .session(session)
      .lean();
    if (!warehouse) {
      throw new Error("Warehouse not found.");
    }

    //Check if Product exists
    const product = await Product.findById(productObjectId)
      .session(session)
      .lean();
    if (!product) {
      throw new Error("Product not found.");
    }

    //Check if product is assign to warehouse
    if (!product.warehouse) {
      throw new Error("Product is not assigned to any warehouse.");
    }

    //Check if the product's warehouse field matches the warehouseId
    if (!product.warehouse.equals(warehouseObjectId)) {
      throw new Error("Product is not in this warehouse");
    }

    //Remove the product reference from the warehouse's products array
    await Warehouse.findByIdAndUpdate(
      warehouseObjectId,
      {
        $pull: { products: { productId: productObjectId } }, //Remove the product from the array
        $inc: {
          totalQuantity: -product.quantity,
          totalValue: -product.price * product.quantity,
        },
      },
      { new: true }
    )
      .session(session)
      .lean();

    //Remove the warehouse reference from the product
    await Product.findByIdAndUpdate(productObjectId, {
      warehouse: null,
    }).session(session);

    //Log to inventory
    await logInventoryEvent(
      "Remove Product From Warehouse",
      "Addition/Removal of Product From Warehouse",
      warehouseObjectId,
      [{ productId: productObjectId, quantity: product.quantity }],
      product.price * product.quantity,
      staffId
    );
    await session.commitTransaction();
  } catch (error: any) {
    await session.abortTransaction();
    console.log("Error removing product from warehouse", error.message);
    throw new Error(
      error.message || "Could not remove product from warehouse..."
    );
  } finally {
    session.endSession();
  }
};

//  //TRANSFER PRODUCTS FROM SOURCE WAREHOUSE TO DESTINATION WAREHOUSE
// const transferProductsBetweenWarehouses = async (
//   productId: mongoose.Types.ObjectId,
//   sourceWarehouseId: mongoose.Types.ObjectId,
//   destinationWarehouseId: mongoose.Types.ObjectId,
//   quantity: number,
//   staffId: mongoose.Types.ObjectId
// ) => {
//   try {
//     //Find both warehouses if available
//     const sourceWarehouse = await Warehouse.findById(
//       sourceWarehouseId
//     ).populate("products");

//     if (!sourceWarehouse) {
//       throw new Error("Source warehouse not found.");
//     }

//     const destinationWarehouse = await Warehouse.findById(
//       destinationWarehouseId
//     ).populate("products");

//     if (!destinationWarehouse) {
//       throw new Error("Destination warehouse not found.");
//     }

//     //Check if Product is actually in the warehouse
//     const product = await Product.findById(productId);
//     if (!product) {
//       throw new Error("Product not found.");
//     }

//     //Check if the product's warehouse field matches the superwarehouseId
//     if (product.warehouse !== sourceWarehouseId) {
//       throw new Error("Product is not in this sourceWarehouse");
//     }

//     //Check if the sourceWarehouse has enough of the product
//     const sourceWarehouseProduct = sourceWarehouse.products.find(
//       (p: any) => p._id.toString() === productId
//     );
//     if (
//       !sourceWarehouseProduct ||
//       sourceWarehouseProduct.quantity < product.quantity
//     ) {
//       throw new Error("Not enough products in sourceWarehouse.");
//     }

//     //Check if the destination warehouse can accommodate the product
//     const currentTotalQuantityInDestination =
//       destinationWarehouse.products.reduce(
//         (acc: number, product: any) => acc + product.quantity,
//         0
//       );

//     if (
//       currentTotalQuantityInDestination + product.quantity >
//       destinationWarehouse.capacity
//     ) {
//       throw new Error(
//         "Adding this product would exceed destination warehouse capacity."
//       );
//     }

//     //Update both warehouses
//     await Warehouse.findByIdAndUpdate(sourceWarehouseId, {
//       $pull: { products: productId },
//       $inc: {
//         totalQuantity: -quantity,
//         totalValue: -product.price * quantity,
//       },
//     });
//     await Warehouse.findByIdAndUpdate(destinationWarehouseId, {
//       $addToSet: { products: productId },
//       $inc: {
//         totalQuantity: quantity,
//         totalValue: product.price * quantity,
//       },
//     });
//     //Log to inventory
//     await logInventoryEvent(
//       "Product Transferred Out",
//       "nsnsnsnsnsn",
//       sourceWarehouseId,
//       [{ productId: productId, quantity: product.quantity }],
//       product.price,
//       staffId
//     );
//     await logInventoryEvent(
//       "Product Transferred In",
//       "ddjmdjdkdkd",
//       destinationWarehouseId,
//       [{ productId: productId, quantity: product.quantity }],
//       product.price,
//       staffId
//     );
//   } catch (error: any) {
//     console.log(
//       "Error transferring product from superwarehouse",
//       error.message
//     );
//     throw new Error(
//       error.message || "Could not transfer product from superwarehouse..."
//     );
//   }
// };

export { addProductToWarehouse, removeProductFromWarehouse };
