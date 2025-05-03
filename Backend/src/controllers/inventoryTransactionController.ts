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
import { sendLowStockNotification } from "../services/notificationService";

//Properly type the products in IInventoryTransaction
interface IInventoryTransactionProduct {
  productId: mongoose.Types.ObjectId;
  quantity: number;
}

//Then modify the IInventoryTransactionPopulated interface
interface IInventoryTransactionPopulated
  extends Omit<IInventoryTransaction, "products"> {
  products: Array<{
    productId: IProduct; // Now this will be the populated product
    quantity: number;
  }>;
}

//GET ALL INVENTORY TRANSACTIONS
const getInventoryTransactions = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  try {
    const user = (req as any).user; //Get the authenticated user

    //Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = (page - 1) * limit;

    //Build the filter based on user role
    let filter = {};

    if (user.role !== "admin") {
      //For staff, only show transactions related to their warehouse
      const staffWarehouses = await Warehouse.find({
        managedBy: user.id,
      }).select("_id");

      const warehouseIds = staffWarehouses.map((w) => w._id);
      filter = {
        $or: [
          { warehouseId: { $in: warehouseIds } },
          { fromWarehouseId: { $in: warehouseIds } },
          { toWarehouseId: { $in: warehouseIds } },
        ],
      };
    }

    //Get total count for pagination
    const totalCount = await InventoryTransaction.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    //Get paginated transactions
    const transactions: IInventoryTransaction[] =
      await InventoryTransaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("staffId", "username")
        .populate("adminId", "username")
        .populate("products.productId", "name category price")
        .populate("warehouseId", "name location capacity")
        .populate("toWarehouseId", "name location capacity")
        .populate("fromWarehouseId", "name location capacity")
        .populate("supplierId", "name contactInfo");

    console.log(`Fetched transactions for ${user.role}...`);
    return res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      userRole: user.role,
    });
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
    supplierId,
    interWarehouseTransferStatus,
    totalValue,
  } = req.body;

  //Extract user role from the request
  const userRole = (req as any).user.role;
  //Extract user ID from the request
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

    //Check If the Staff is from either of the source or destination warehouse
    if (transactionType === "Failed Transfer Request" && userRole === "staff") {
      const fromWarehouse = await Warehouse.findById(fromWarehouseId).session(
        session
      );
      const toWarehouse = await Warehouse.findById(toWarehouseId).session(
        session
      );

      if (!fromWarehouse || !toWarehouse) {
        return res
          .status(404)
          .json({ error: "One or more warehouses not found" });
      }

      //Check if staff belongs to either warehouse
      const isFromWarehouseStaff = fromWarehouse.managedBy.includes(staffId);
      const isToWarehouseStaff = toWarehouse.managedBy.includes(staffId);

      if (!isFromWarehouseStaff && !isToWarehouseStaff) {
        return res.status(403).json({
          error:
            "Only staff from source or destination warehouse can report failed transfers",
        });
      }
    }

    //For warehouse staff, verify they manage this specific warehouse
    if (userRole === "staff") {
      //Staff can only create transactions for warehouses they manage
      const isUserAuthorized = warehouse.managedBy.includes(staffId);
      if (!isUserAuthorized) {
        return res.status(403).json({
          error:
            "User is not authorized to record this transaction for this warehouse",
        });
      }

      //Staff can only work with their assigned warehouse
      if (warehouseId && warehouseId !== warehouse._id.toString()) {
        return res.status(403).json({
          error:
            "Staff can only create transactions for their assigned warehouse",
        });
      }
    }
    // For admins, allow all operations
    else if (userRole === "admin") {
      //Admin can create transactions for any warehouse
      //No additional restrictions
    }
    //For any other role, deny access
    else {
      return res.status(403).json({
        error: "User role is not authorized to create inventory transactions",
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

    //Validation for Customer Return
    if (transactionType === "Customer Return") {
      //Track all returns in 24hrs regardless of quantity
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

      //Check warehouse capacity for returned items
      const warehouse = await Warehouse.findById(warehouseId).session(session);
      if (!warehouse) {
        return res.status(404).json({ error: "Warehouse not found" });
      }

      //Calculate total incoming quantity
      const totalIncomingQuantity = productsArray.reduce(
        (
          total: number,
          product: { productId: mongoose.Types.ObjectId; quantity: number }
        ) => total + product.quantity,
        0
      );

      //Check if warehouse has capacity for returns
      if (
        warehouse.totalQuantity + totalIncomingQuantity >
        warehouse.capacity
      ) {
        return res.status(400).json({
          error:
            "Warehouse does not have sufficient capacity for returned products",
        });
      }

      const existingReturn: IInventoryTransaction | null =
        await InventoryTransaction.findOne({
          transactionType: "Customer Return",
          "products.productId": {
            $all: productsArray.map(
              (p: { productId: mongoose.Types.ObjectId }) => p.productId
            ),
          },
          "products.quantity": {
            $all: productsArray.map((p: { quantity: number }) => p.quantity),
          },
          createdAt: { $gte: last24Hours },
        }).session(session);

      if (existingReturn) {
        return res.status(400).json({
          error: "This return transaction has already been processed",
        });
      }

      //Check if each product exists and has valid quantity
      for (const product of productsArray) {
        const existingProduct = await Product.findById(
          product.productId
        ).session(session);
        if (!existingProduct) {
          return res.status(404).json({
            error: `Product with ID ${product.productId} not found`,
          });
        }

        const allReturnsIn24Hrs = await InventoryTransaction.find({
          transactionType: "Customer Return",
          warehouseId: warehouseId,
          "products.productId": product.productId,
          createdAt: { $gte: last24Hours },
        }).session(session);

        //Calculate total returned quantity
        const totalReturnedQuantity = allReturnsIn24Hrs.reduce(
          (sum, transaction) => {
            const productReturn = transaction.products.find(
              (p) => p._id.toString() === product.productId.toString()
            );
            return sum + (productReturn?.quantity || 0);
          },
          0
        );

        //Track patterns but don't block legitimate returns
        if (allReturnsIn24Hrs.length > 0) {
          console.log(`Return Pattern Detected:`, {
            productId: product.productId,
            newReturnQuantity: product.quantity,
            previousReturns: {
              count: allReturnsIn24Hrs.length,
              totalQuantity: totalReturnedQuantity,
            },
            timeframe: "24 hours",
          });

          console.log("SUSPICIOUS RETURN PATTERN DETECTED");

          //Optional: Only block if total returns exceed a threshold
          const TOTAL_RETURN_THRESHOLD = 10; // Adjust as needed
          if (
            totalReturnedQuantity + product.quantity >
            TOTAL_RETURN_THRESHOLD
          ) {
            return res.status(400).json({
              error:
                "Total returns for this product exceed allowable limit in 24 hours",
              details: {
                product: product.productId,
                currentReturn: product.quantity,
                totalReturned: totalReturnedQuantity,
                threshold: TOTAL_RETURN_THRESHOLD,
              },
            });
          }
        }
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

    //Save the new Inventory Update product quantities and Update Warehouse
    await newInventory.save({ session });
    await Product.bulkWrite(productQuantities, { session });
    await Warehouse.bulkWrite(warehouseUpdates, { session });

    //Check for low stock and send notifications
    for (let { productId, quantity } of productsArray) {
      const product = await Product.findById(productId).session(session);
      if (!product) continue;

      // Define your threshold - you can make this a configurable setting
      const LOW_STOCK_THRESHOLD = 10;

      if (product.quantity <= LOW_STOCK_THRESHOLD) {
        const warehouse = await Warehouse.findById(product.warehouse).session(
          session
        );
        if (warehouse) {
          await sendLowStockNotification(
            product,
            warehouse,
            LOW_STOCK_THRESHOLD
          );
        }
      }
    }

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

//UPDATE AN INVENTORY TRANSACTION
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
    supplierId,
    interWarehouseTransferStatus,
    totalValue,
  } = req.body;

  //Extract user role from the request
  const userRole = (req as any).user.role;
  //Extract user ID from the request
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

    //First find the original transaction
    const originalTransaction = (await InventoryTransaction.findById(
      req.params.id
    )
      .populate("products.productId")
      .session(session)) as IInventoryTransactionPopulated | null;

    if (!originalTransaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    //Add revert logic here - before any new changes
    for (const originalProduct of originalTransaction.products) {
      //Type assertion to handle the populated product
      const productId = originalProduct.productId._id;
      const product = await Product.findById(productId).session(session);
      if (!product) continue;

      //Get the warehouse
      const warehouseId = product.warehouse.toString();

      //Revert the quantity changes based on original transaction type
      switch (originalTransaction.transactionType) {
        case "Restock Transaction":
        case "Customer Return":
          //These added quantity, so subtract
          product.quantity -= originalProduct.quantity;
          await Warehouse.findByIdAndUpdate(
            warehouseId,
            {
              $inc: {
                totalQuantity: -originalProduct.quantity,
                totalValue: -(product.price * originalProduct.quantity),
              },
            },
            { session }
          );
          break;

        case "Sales Transaction":
        case "Damaged Product":
        case "Supplier Return":
          //These subtracted quantity, so add back
          product.quantity += originalProduct.quantity;
          await Warehouse.findByIdAndUpdate(
            warehouseId,
            {
              $inc: {
                totalQuantity: originalProduct.quantity,
                totalValue: product.price * originalProduct.quantity,
              },
            },
            { session }
          );
          break;
      }

      await product.save({ session });
    }

    //Verify if Warehouse exists in database
    const warehouse = await Warehouse.findById(warehouseId).session(session);
    if (!warehouse) {
      return res.status(404).json({ error: "Warehouse not found" });
    }

    //Check If the Staff is from either of the source or destination warehouse
    if (transactionType === "Failed Transfer Request" && userRole === "staff") {
      const fromWarehouse = await Warehouse.findById(fromWarehouseId).session(
        session
      );
      const toWarehouse = await Warehouse.findById(toWarehouseId).session(
        session
      );

      if (!fromWarehouse || !toWarehouse) {
        return res
          .status(404)
          .json({ error: "One or more warehouses not found" });
      }

      //Check if staff belongs to either warehouse
      const isFromWarehouseStaff = fromWarehouse.managedBy.includes(staffId);
      const isToWarehouseStaff = toWarehouse.managedBy.includes(staffId);

      if (!isFromWarehouseStaff && !isToWarehouseStaff) {
        return res.status(403).json({
          error:
            "Only staff from source or destination warehouse can report failed transfers",
        });
      }
    }

    //For warehouse staff, verify they manage this specific warehouse
    if (userRole === "staff") {
      //Staff can only create transactions for warehouses they manage
      const isUserAuthorized = warehouse.managedBy.includes(staffId);
      if (!isUserAuthorized) {
        return res.status(403).json({
          error:
            "User is not authorized to record this transaction for this warehouse",
        });
      }

      //Staff can only work with their assigned warehouse
      if (warehouseId && warehouseId !== warehouse._id.toString()) {
        return res.status(403).json({
          error:
            "Staff can only create transactions for their assigned warehouse",
        });
      }
    }
    // For admins, allow all operations
    else if (userRole === "admin") {
      //Admin can create transactions for any warehouse
      //No additional restrictions
    }
    //For any other role, deny access
    else {
      return res.status(403).json({
        error: "User role is not authorized to create inventory transactions",
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

    //Validation for Customer Return
    if (transactionType === "Customer Return") {
      //Track all returns in 24hrs regardless of quantity
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

      //Check warehouse capacity for returned items
      const warehouse = await Warehouse.findById(warehouseId).session(session);
      if (!warehouse) {
        return res.status(404).json({ error: "Warehouse not found" });
      }

      //Calculate total incoming quantity
      const totalIncomingQuantity = productsArray.reduce(
        (
          total: number,
          product: { productId: mongoose.Types.ObjectId; quantity: number }
        ) => total + product.quantity,
        0
      );

      //Check if warehouse has capacity for returns
      if (
        warehouse.totalQuantity + totalIncomingQuantity >
        warehouse.capacity
      ) {
        return res.status(400).json({
          error:
            "Warehouse does not have sufficient capacity for returned products",
        });
      }

      const existingReturn: IInventoryTransaction | null =
        await InventoryTransaction.findOne({
          transactionType: "Customer Return",
          "products.productId": {
            $all: productsArray.map(
              (p: { productId: mongoose.Types.ObjectId }) => p.productId
            ),
          },
          "products.quantity": {
            $all: productsArray.map((p: { quantity: number }) => p.quantity),
          },
          createdAt: { $gte: last24Hours },
        }).session(session);

      if (existingReturn) {
        return res.status(400).json({
          error: "This return transaction has already been processed",
        });
      }

      //Check if each product exists and has valid quantity
      for (const product of productsArray) {
        const existingProduct = await Product.findById(
          product.productId
        ).session(session);
        if (!existingProduct) {
          return res.status(404).json({
            error: `Product with ID ${product.productId} not found`,
          });
        }

        const allReturnsIn24Hrs = await InventoryTransaction.find({
          transactionType: "Customer Return",
          warehouseId: warehouseId,
          "products.productId": product.productId,
          createdAt: { $gte: last24Hours },
        }).session(session);

        //Calculate total returned quantity
        const totalReturnedQuantity = allReturnsIn24Hrs.reduce(
          (sum, transaction) => {
            const productReturn = transaction.products.find(
              (p) => p._id.toString() === product.productId.toString()
            );
            return sum + (productReturn?.quantity || 0);
          },
          0
        );

        //Track patterns but don't block legitimate returns
        if (allReturnsIn24Hrs.length > 0) {
          console.log(`Return Pattern Detected:`, {
            productId: product.productId,
            newReturnQuantity: product.quantity,
            previousReturns: {
              count: allReturnsIn24Hrs.length,
              totalQuantity: totalReturnedQuantity,
            },
            timeframe: "24 hours",
          });

          console.log("SUSPICIOUS RETURN PATTERN DETECTED");

          //Optional: Only block if total returns exceed a threshold
          const TOTAL_RETURN_THRESHOLD = 10; // Adjust as needed
          if (
            totalReturnedQuantity + product.quantity >
            TOTAL_RETURN_THRESHOLD
          ) {
            return res.status(400).json({
              error:
                "Total returns for this product exceed allowable limit in 24 hours",
              details: {
                product: product.productId,
                currentReturn: product.quantity,
                totalReturned: totalReturnedQuantity,
                threshold: TOTAL_RETURN_THRESHOLD,
              },
            });
          }
        }
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

    //Check for low stock and send notifications
    for (let { productId, quantity } of productsArray) {
      const product = await Product.findById(productId).session(session);
      if (!product) continue;

      //Define your threshold - you can make this a configurable setting
      const LOW_STOCK_THRESHOLD = 10;

      if (product.quantity <= LOW_STOCK_THRESHOLD) {
        const warehouse = await Warehouse.findById(product.warehouse).session(
          session
        );
        if (warehouse) {
          await sendLowStockNotification(
            product,
            warehouse,
            LOW_STOCK_THRESHOLD
          );
        }
      }
    }

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
