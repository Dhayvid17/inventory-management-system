import mongoose from "mongoose";
import InventoryTransaction, {
  IInventoryTransaction,
} from "../models/inventoryTransactionModel";
import { Request, Response } from "express";
import Product, { IProduct } from "../models/productModel";
import User from "../models/userModel";
import Supplier from "../models/supplierModel";
import Order from "../models/orderModel";
import Warehouse, { IWarehouse } from "../models/warehouseModel";

//GET ALL INVENTORY TRANSACTIONS
const getInventoryTransactions = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  try {
    const transactions: IInventoryTransaction[] =
      await InventoryTransaction.find({})
        .populate("staffId", "username")
        .populate("adminId", "username")
        .populate("products.productId", "name category price")
        .populate("warehouseId", "name location capacity")
        .populate("toWarehouseId", "name location capacity")
        .populate("fromWarehouseId", "name location capacity")
        .populate("supplierId", "name contactInfo")
        .populate("customerId", "username");
    console.log("Fetched transactions...");
    return res.status(200).json(transactions);
  } catch (error: any) {
    return res.status(500).json({
      error: "Could not fetched transactions",
      details: error.message,
    });
  }
};

//GET A SINGLE INVENTORY TRANSACTION
const getInventoryTransaction = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid Document" });
  }

  //Ensure that the Inventory exists
  const inventoryExists = await InventoryTransaction.findById(req.params.id);
  if (!inventoryExists) {
    return res.status(404).json({ error: "Inventory not found" });
  }

  try {
    const transaction: IInventoryTransaction | null =
      await InventoryTransaction.findById(req.params.id)
        .populate("staffId", "username")
        .populate("adminId", "username")
        .populate("products.productId", "name category price")
        .populate("warehouseId", "name location capacity")
        .populate("toWarehouseId", "name location capacity")
        .populate("fromWarehouseId", "name location capacity")
        .populate("supplierId", "name contactInfo")
        .populate("customerId", "username");
    console.log("Fetched transactions...");
    if (!transaction) {
      return res.status(400).json({ error: "Document not found" });
    }
    return res.status(200).json(transaction);
  } catch (error) {
    return res.status(500).json({ error: "Could not fetch transaction" });
  }
};

//CREATE A NEW INVENTORY TRANSACTION
const createInventoryTransaction = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const {
    action,
    transactionType,
    fromWarehouseId,
    toWarehouseId,
    warehouseId,
    products,
    quantity,
    customerId,
    supplierId,
    interWarehouseTransferStatus,
    totalValue,
  } = req.body;

  const staffId = (req as any).user.id;
  const adminId = (req as any).user.id;

  //Initialize Session Transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  //Check Input fields
  if (
    !transactionType ||
    (["Inter-Warehouse Transfer", "Failed Transfer Request"].includes(
      transactionType
    ) &&
      !fromWarehouseId) ||
    (["Inter-Warehouse Transfer", "Failed Transfer Request"].includes(
      transactionType
    ) &&
      !toWarehouseId) ||
    !products ||
    products.length === 0 ||
    (["Inter-Warehouse Transfer", "Failed Transfer Request"].includes(
      transactionType
    ) &&
      !staffId) ||
    (["Online Order", "Customer Return"].includes(transactionType) &&
      !customerId) ||
    (["Restock Transaction", "Supplier Return"].includes(transactionType) &&
      !supplierId) ||
    !transactionType ||
    (["Addition/Removal of Product From Warehouse"].includes(transactionType) &&
      !action) ||
    ([
      "Addition/Removal of Product From Warehouse",
      "Restock Transaction",
      "Supplier Return",
      "Sales Transaction",
      "Online Order",
      "Customer Return",
    ].includes(transactionType) &&
      !warehouseId)
  ) {
    return res.status(400).json({ error: "Please fill all fields" });
  }

  try {
    //Validate the transaction type
    const validTypes = [
      "Restock Transaction",
      "Sales Transaction",
      "Online Order",
      "Damaged Product",
      "Supplier Return",
      "Customer Return",
      "Inter-Warehouse Transfer",
      "Addition/Removal of Product From Warehouse",
      "Failed Transfer Request",
    ];
    if (!validTypes.includes(transactionType)) {
      return res.status(400).json({ error: "Invalid transaction type" });
    }

    //Verify if Warehouse exists in database
    const warehouse = await Warehouse.findById(warehouseId).session(session);
    if (!warehouse) {
      return res.status(404).json({ error: "Warehouse not found" });
    }

    //Check if the staff Id is the same as the warehouse managedBy
    const isUserAuthorized = warehouse.managedBy.includes(staffId);
    if (!isUserAuthorized) {
      return res.status(403).json({
        error: "User is not authorized to record this transaction",
      });
    }

    //Check if all product IDs are valid
    const validProducts = await Product.find({
      _id: {
        $in: products.map(
          (p: { productId: mongoose.Types.ObjectId }) => p.productId
        ),
      },
    }).session(session);
    if (validProducts.length !== products.length) {
      return res.status(404).json({ error: "One or more products not found" });
    }

    //Validate the product-supplier association
    for (let product of validProducts) {
      if (
        ["Restock Transaction", "Supplier Return"].includes(transactionType) &&
        product.supplier.toString() !== supplierId
      ) {
        return res.status(400).json({
          error: `Product ${product.name} does not belong to the specified supplier.`,
        });
      }
    }

    //Validate user existence
    const user = await User.findById(staffId).session(session);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    //Save new InventoryTransaction with product references
    const productsArray = products.map(
      (product: { productId: mongoose.Types.ObjectId; quantity: number }) => ({
        productId: product.productId,
        quantity: product.quantity,
      })
    );

    //Check if the products are found in the warehouseId
    const productsInWarehouse = await Product.find({
      _id: {
        $in: productsArray.map((product: any) => product.productId),
      },
      warehouse: warehouseId,
    }).session(session);
    if (productsInWarehouse.length !== productsArray.length) {
      return res.status(400).json({
        error: `One or more products do not belong to the specified warehouse.`,
      });
    }

    //Validation for online order and customer returns
    if (["Online Order", "Customer Return"].includes(transactionType)) {
      //Check if the Order has been recorded in Inventory
      const existingTransaction = await InventoryTransaction.findOne({
        transactionType,
        products,
        customerId,
      }).session(session);
      if (existingTransaction) {
        return res
          .status(400)
          .json({ error: "Order is already recorded in inventory" });
      }

      //Validate customer ID for Online Order and customer returns
      const customerOrder = await Order.findOne({
        //Check if each product matches both productId and quantity
        $and: productsArray.map(
          (product: {
            productId: mongoose.Types.ObjectId;
            quantity: number;
          }) => ({
            products: {
              $elemMatch: {
                productId: product.productId,
                quantity: product.quantity,
              },
            },
          })
        ),
        //Ensure the customer ID matches the order
        user: customerId,
      }).session(session);
      if (!customerOrder) {
        return res
          .status(404)
          .json({ error: "No matching order found for the customer" });
      }
    }

    //Calculate totalValue and update product quantities based on transaction type
    let totalValue = 0;
    const productQuantities = [];
    const warehouseUpdates = [];
    //Now update totalValue and totalQuantity for each warehouse after updating product quantities
    const warehouseProductUpdates: Record<
      string,
      { totalQuantity: number; totalValue: number }
    > = {};

    //Update product quantities based on transaction type
    for (let { productId, quantity } of productsArray) {
      const product = validProducts.find((p) => p._id.equals(productId));
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      let updatedQuantity = product.quantity;
      let productPrice = product.price;
      //Get the warehouse for this product
      const warehouseId = product.warehouse.toString();

      //Initialize warehouse update record if not already present
      if (!warehouseProductUpdates[warehouseId]) {
        warehouseProductUpdates[warehouseId] = {
          totalQuantity: 0,
          totalValue: 0,
        };
      }
      //HANDLE DIFFERENT TRANSACTION TYPES
      switch (transactionType) {
        case "Restock Transaction":
          const restockSupplier = await Supplier.findById(supplierId);
          if (!restockSupplier) {
            return res.status(404).json({ error: "Supplier not found" });
          }
          updatedQuantity += quantity;
          totalValue += productPrice * quantity;
          //Add to warehouse totalQuantity and totalValue
          warehouseProductUpdates[warehouseId].totalQuantity += quantity;
          warehouseProductUpdates[warehouseId].totalValue +=
            productPrice * quantity;
          break;

        case "Sales Transaction":
        case "Online Order":
        case "Damaged Product":
          if (product.quantity < quantity) {
            return res.status(400).json({ error: "Insufficient stock" });
          }
          updatedQuantity -= quantity;
          totalValue += productPrice * quantity;
          //Subtract from warehouse totalQuantity and totalValue
          warehouseProductUpdates[warehouseId].totalQuantity -= quantity;
          warehouseProductUpdates[warehouseId].totalValue -=
            productPrice * quantity;
          break;

        case "Supplier Return":
          const returnSupplier = await Supplier.findById(supplierId);
          if (!returnSupplier) {
            return res.status(404).json({ error: "Supplier not found" });
          }
          if (product.quantity < quantity) {
            return res.status(400).json({ error: "Insufficient stock" });
          }
          updatedQuantity -= quantity;
          totalValue += productPrice * quantity;
          //Subtract from warehouse totalQuantity and totalValue
          warehouseProductUpdates[warehouseId].totalQuantity -= quantity;
          warehouseProductUpdates[warehouseId].totalValue -=
            productPrice * quantity;
          break;

        case "Customer Return":
          updatedQuantity += quantity;
          totalValue += productPrice * quantity;
          //Add to warehouse totalQuantity and totalValue
          warehouseProductUpdates[warehouseId].totalQuantity += quantity;
          warehouseProductUpdates[warehouseId].totalValue +=
            productPrice * quantity;
          break;

        // case "Inter-Warehouse Transfer":
        //   if (product.quantity < quantity) {
        //     return res.status(400).json({ error: "Insufficient stock" });
        //   }
        //   updatedQuantity -= quantity;
        //   break;

        default:
          return res.status(400).json({ error: "Invalid transaction type" });
      }
      //Prepare product quantity update
      productQuantities.push({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(product._id) },
          update: { $set: { quantity: updatedQuantity } },
        },
      });

      //Update product quantity in the Warehouse collection
      warehouseUpdates.push({
        updateOne: {
          filter: { _id: warehouseId, "products.productId": productId },
          update: {
            $set: { "products.$.quantity": updatedQuantity },
          },
        },
      });
    }

    //Save new Inventory transaction
    const newInventory: IInventoryTransaction = new InventoryTransaction({
      transactionType,
      products: productsArray,
      quantity,
      customerId: ["Online Order", "Customer Return"].includes(transactionType)
        ? customerId
        : undefined, //Optional based on transaction type
      staffId,
      supplierId: ["Restock Transaction", "Supplier Return"].includes(
        transactionType
      )
        ? supplierId
        : undefined, //Optional based on transaction type
      toWarehouseId: [
        "Inter-Warehouse Transfer",
        "Failed Transfer Request",
      ].includes(transactionType)
        ? toWarehouseId
        : undefined, //Optional based on transaction type
      fromWarehouseId: [
        "Inter-Warehouse Transfer",
        "Failed Transfer Request",
      ].includes(transactionType)
        ? fromWarehouseId
        : undefined, //Optional based on transaction type
      action: ["Addition/Removal of Product From Warehouse"].includes(
        transactionType
      )
        ? action
        : undefined, //Optional based on transaction type
      warehouseId: [
        "Addition/Removal of Product From Warehouse",
        "Online Order",
        "Customer Return",
        "Restock Transaction",
        "Supplier Return",
        "Sales Transaction",
      ].includes(transactionType)
        ? warehouseId
        : undefined, //Optional based on transaction type
      interWarehouseTransferStatus: ["Inter-Warehouse Transfer"].includes(
        transactionType
      )
        ? interWarehouseTransferStatus
        : undefined, //Optional based on transaction type
      totalValue,
    });

    // Save the new Inventory Update product quantities and Update Warehouse
    await newInventory.save({ session });
    await Product.bulkWrite(productQuantities, { session });
    await Warehouse.bulkWrite(warehouseUpdates, { session });

    //Update the warehouse totalQuantity and totalValue after processing all products
    for (const [warehouseId, { totalQuantity, totalValue }] of Object.entries(
      warehouseProductUpdates
    )) {
      await Warehouse.findByIdAndUpdate(
        warehouseId,
        {
          $inc: {
            totalQuantity,
            totalValue,
          },
        },
        { session }
      );
    }
    //Commit the transaction
    await session.commitTransaction();

    return res.status(201).json(newInventory);
  } catch (error: any) {
    //If an error occurs, abort the transaction
    await session.abortTransaction();
    return res.status(500).json({
      error: "Failed to create new inventory transaction",
      details: error.message,
    });
  } finally {
    //End transaction
    session.endSession();
  }
};

// UPDATE AN INVENTORY TRANSACTION
const updateInventoryTransaction = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const {
    action,
    transactionType,
    fromWarehouseId,
    toWarehouseId,
    warehouseId,
    products,
    quantity,
    customerId,
    supplierId,
    interWarehouseTransferStatus,
    totalValue,
  } = req.body;

  const staffId = (req as any).user.id;

  //Initialize Session Transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  //Check Input fields
  if (
    !transactionType ||
    (["Inter-Warehouse Transfer", "Failed Transfer Request"].includes(
      transactionType
    ) &&
      !fromWarehouseId) ||
    (["Inter-Warehouse Transfer", "Failed Transfer Request"].includes(
      transactionType
    ) &&
      !toWarehouseId) ||
    !products ||
    products.length === 0 ||
    (["Inter-Warehouse Transfer", "Failed Transfer Request"].includes(
      transactionType
    ) &&
      !staffId) ||
    (["Online Order", "Customer Return"].includes(transactionType) &&
      !customerId) ||
    (["Restock Transaction", "Supplier Return"].includes(transactionType) &&
      !supplierId) ||
    !transactionType ||
    (["Addition/Removal of Product From Warehouse"].includes(transactionType) &&
      !action) ||
    ([
      "Addition/Removal of Product From Warehouse",
      "Restock Transaction",
      "Supplier Return",
      "Sales Transaction",
      "Online Order",
      "Customer Return",
    ].includes(transactionType) &&
      !warehouseId)
  ) {
    return res.status(400).json({ error: "Please fill all fields" });
  }

  try {
    //Validate the transaction type
    const validTypes = [
      "Restock Transaction",
      "Sales Transaction",
      "Online Order",
      "Damaged Product",
      "Supplier Return",
      "Customer Return",
      "Inter-Warehouse Transfer",
      "Addition/Removal of Product From Warehouse",
      "Failed Transfer Request",
    ];
    if (!validTypes.includes(transactionType)) {
      return res.status(400).json({ error: "Invalid transaction type" });
    }

    //Verify if Warehouse exists in database
    const warehouse = await Warehouse.findById(warehouseId).session(session);
    if (!warehouse) {
      return res.status(404).json({ error: "Warehouse not found" });
    }

    //Check if the staff Id is the same as the warehouse managedBy
    const isUserAuthorized = warehouse.managedBy.includes(staffId);
    if (!isUserAuthorized) {
      return res.status(403).json({
        error: "User is not authorized to record this transaction",
      });
    }

    //Check if all product IDs are valid
    const validProducts = await Product.find({
      _id: {
        $in: products.map(
          (p: { productId: mongoose.Types.ObjectId }) => p.productId
        ),
      },
    }).session(session);
    if (validProducts.length !== products.length) {
      return res.status(404).json({ error: "One or more products not found" });
    }

    //Validate the product-supplier association
    for (let product of validProducts) {
      if (
        ["Restock Transaction", "Supplier Return"].includes(transactionType) &&
        product.supplier.toString() !== supplierId
      ) {
        return res.status(400).json({
          error: `Product ${product.name} does not belong to the specified supplier.`,
        });
      }
    }

    //Validate user existence
    const user = await User.findById(staffId).session(session);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    //Save new InventoryTransaction with product references
    const productsArray = products.map(
      (product: { productId: mongoose.Types.ObjectId; quantity: number }) => ({
        productId: product.productId,
        quantity: product.quantity,
      })
    );

    //Check if the products are found in the warehouseId
    const productsInWarehouse = await Product.find({
      _id: {
        $in: productsArray.map((product: any) => product.productId),
      },
      warehouse: warehouseId,
    }).session(session);
    if (productsInWarehouse.length !== productsArray.length) {
      return res.status(400).json({
        error: `One or more products do not belong to the specified warehouse.`,
      });
    }

    //Validation for online order and customer returns
    if (["Online Order", "Customer Return"].includes(transactionType)) {
      //Check if the Order has been recorded in Inventory
      const existingTransaction = await InventoryTransaction.findOne({
        transactionType,
        products,
        customerId,
      }).session(session);
      if (existingTransaction) {
        return res
          .status(400)
          .json({ error: "Order is already recorded in inventory" });
      }

      //Validate customer ID for Online Order and customer returns
      const customerOrder = await Order.findOne({
        //Check if each product matches both productId and quantity
        $and: productsArray.map(
          (product: {
            productId: mongoose.Types.ObjectId;
            quantity: number;
          }) => ({
            products: {
              $elemMatch: {
                productId: product.productId,
                quantity: product.quantity,
              },
            },
          })
        ),
        //Ensure the customer ID matches the order
        user: customerId,
      }).session(session);
      if (!customerOrder) {
        return res
          .status(404)
          .json({ error: "No matching order found for the customer" });
      }
    }

    //Calculate totalValue and update product quantities based on transaction type
    let totalValue = 0;
    const productQuantities = [];
    const warehouseUpdates = [];
    //Now update totalValue and totalQuantity for each warehouse after updating product quantities
    const warehouseProductUpdates: Record<
      string,
      { totalQuantity: number; totalValue: number }
    > = {};

    //Update product quantities based on transaction type
    for (let { productId, quantity } of productsArray) {
      const product = validProducts.find((p) => p._id.equals(productId));
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      let updatedQuantity = product.quantity;
      let productPrice = product.price;
      //Get the warehouse for this product
      const warehouseId = product.warehouse.toString();

      //Initialize warehouse update record if not already present
      if (!warehouseProductUpdates[warehouseId]) {
        warehouseProductUpdates[warehouseId] = {
          totalQuantity: 0,
          totalValue: 0,
        };
      }
      //HANDLE DIFFERENT TRANSACTION TYPES
      switch (transactionType) {
        case "Restock Transaction":
          const restockSupplier = await Supplier.findById(supplierId);
          if (!restockSupplier) {
            return res.status(404).json({ error: "Supplier not found" });
          }
          updatedQuantity += quantity;
          totalValue += productPrice * quantity;
          //Add to warehouse totalQuantity and totalValue
          warehouseProductUpdates[warehouseId].totalQuantity += quantity;
          warehouseProductUpdates[warehouseId].totalValue +=
            productPrice * quantity;
          break;

        case "Sales Transaction":
        case "Online Order":
        case "Damaged Product":
          if (product.quantity < quantity) {
            return res.status(400).json({ error: "Insufficient stock" });
          }
          updatedQuantity -= quantity;
          totalValue += productPrice * quantity;
          //Subtract from warehouse totalQuantity and totalValue
          warehouseProductUpdates[warehouseId].totalQuantity -= quantity;
          warehouseProductUpdates[warehouseId].totalValue -=
            productPrice * quantity;
          break;

        case "Supplier Return":
          const returnSupplier = await Supplier.findById(supplierId);
          if (!returnSupplier) {
            return res.status(404).json({ error: "Supplier not found" });
          }
          if (product.quantity < quantity) {
            return res.status(400).json({ error: "Insufficient stock" });
          }
          updatedQuantity -= quantity;
          totalValue += productPrice * quantity;
          //Subtract from warehouse totalQuantity and totalValue
          warehouseProductUpdates[warehouseId].totalQuantity -= quantity;
          warehouseProductUpdates[warehouseId].totalValue -=
            productPrice * quantity;
          break;

        case "Customer Return":
          updatedQuantity += quantity;
          totalValue += productPrice * quantity;
          //Add to warehouse totalQuantity and totalValue
          warehouseProductUpdates[warehouseId].totalQuantity += quantity;
          warehouseProductUpdates[warehouseId].totalValue +=
            productPrice * quantity;
          break;

        // case "Inter-Warehouse Transfer":
        //   if (product.quantity < quantity) {
        //     return res.status(400).json({ error: "Insufficient stock" });
        //   }
        //   updatedQuantity -= quantity;
        //   break;

        default:
          return res.status(400).json({ error: "Invalid transaction type" });
      }
      //Prepare product quantity update
      productQuantities.push({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(product._id) },
          update: { $set: { quantity: updatedQuantity } },
        },
      });

      //Update product quantity in the Warehouse collection
      warehouseUpdates.push({
        updateOne: {
          filter: { _id: warehouseId, "products.productId": productId },
          update: {
            $set: { "products.$.quantity": updatedQuantity },
          },
        },
      });
    }

    //Save updated Inventory transaction
    const updatedInventory: IInventoryTransaction | null =
      await InventoryTransaction.findByIdAndUpdate(
        req.params.id,
        {
          transactionType,
          products: productsArray,
          quantity,
          customerId: ["Online Order", "Customer Return"].includes(
            transactionType
          )
            ? customerId
            : undefined, //Optional based on transaction type
          staffId,
          supplierId: ["Restock Transaction", "Supplier Return"].includes(
            transactionType
          )
            ? supplierId
            : undefined, //Optional based on transaction type
          toWarehouseId: [
            "Inter-Warehouse Transfer",
            "Failed Transfer Request",
          ].includes(transactionType)
            ? toWarehouseId
            : undefined, //Optional based on transaction type
          fromWarehouseId: [
            "Inter-Warehouse Transfer",
            "Failed Transfer Request",
          ].includes(transactionType)
            ? fromWarehouseId
            : undefined, //Optional based on transaction type
          action: ["Addition/Removal of Product From Warehouse"].includes(
            transactionType
          )
            ? action
            : undefined, //Optional based on transaction type
          warehouseId: [
            "Addition/Removal of Product From Warehouse",
            "Online Order",
            "Customer Return",
            "Restock Transaction",
            "Supplier Return",
            "Sales Transaction",
          ].includes(transactionType)
            ? warehouseId
            : undefined, //Optional based on transaction type
          interWarehouseTransferStatus: ["Inter-Warehouse Transfer"].includes(
            transactionType
          )
            ? interWarehouseTransferStatus
            : undefined, //Optional based on transaction type
          totalValue,
        },
        { new: true, session }
      );

    if (!updatedInventory) {
      return res.status(400).json({ error: "Could not update Inventory" });
    }

    // Save the new Inventory Update product quantities and Update Warehouse
    await updatedInventory.save({ session });
    await Product.bulkWrite(productQuantities, { session });
    await Warehouse.bulkWrite(warehouseUpdates, { session });

    //Update the warehouse totalQuantity and totalValue after processing all products
    for (const [warehouseId, { totalQuantity, totalValue }] of Object.entries(
      warehouseProductUpdates
    )) {
      await Warehouse.findByIdAndUpdate(
        warehouseId,
        {
          $inc: {
            totalQuantity,
            totalValue,
          },
        },
        { session }
      );
    }
    //Commit the transaction
    await session.commitTransaction();

    return res.status(201).json(updatedInventory);
  } catch (error: any) {
    //If an error occurs, abort the transaction
    await session.abortTransaction();
    return res.status(500).json({
      error: "Failed to update inventory transaction",
      details: error.message,
    });
  } finally {
    //End transaction
    session.endSession();
  }
};

//DELETE AN INVENTORY TRANSACTION
const deleteInventoryTransaction = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  //Check if Inventory Transaction exists
  const inventoryTransactionExists = await InventoryTransaction.findById(
    req.params.id
  );
  if (!inventoryTransactionExists) {
    return res.status(404).json({ error: "Inventory transaction not found" });
  }

  try {
    const deletedInventoryTransaction: IInventoryTransaction | null =
      await InventoryTransaction.findByIdAndDelete(req.params.id);
    if (!deletedInventoryTransaction) {
      return res.status(400).json({ error: "Inventory transaction not found" });
    }
    res
      .status(201)
      .json({ message: "Inventory transaction deleted successfully" });
  } catch (error: any) {
    res.status(500).json({
      error: "Could not delete Inventory transaction",
      details: error.message,
    });
  }
};

export {
  getInventoryTransactions,
  getInventoryTransaction,
  createInventoryTransaction,
  updateInventoryTransaction,
  deleteInventoryTransaction,
};
