import mongoose, { ObjectId } from "mongoose";
import Product, { IProduct } from "../models/productModel";
import TransferRequest, {
  ITransferRequest,
} from "../models/transferRequestModel";
import Warehouse from "../models/warehouseModel";
import { transferRequestNotification } from "./notificationService";
import InventoryTransaction from "../models/inventoryTransactionModel";
import User from "../models/userModel";

//CREATE A NEW TRANSFER REQUEST
const createTransferRequest = async (
  fromWarehouseId: mongoose.Types.ObjectId,
  toWarehouseId: mongoose.Types.ObjectId,
  products: { productId: mongoose.Types.ObjectId; quantity: number }[],
  status: string,
  requestedBy: mongoose.Types.ObjectId,
  transferType: string,
  note: string = ""
): Promise<ITransferRequest | null> => {
  //Initialize Session Transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  // Check if the warehouses exist
  const fromWarehouse = await Warehouse.findById(fromWarehouseId)
    .populate("products.productId")
    .session(session);
  const toWarehouse = await Warehouse.findById(toWarehouseId)
    .populate("products.productId")
    .session(session);

  if (!fromWarehouse || !toWarehouse) {
    throw new Error(
      `One or both warehouses not found. From Warehouse ID: ${fromWarehouseId}, To Warehouse ID: ${toWarehouseId}`
    );
  }

  //Check if there is a staff assigned to warehouse before creating transfer
  if (!fromWarehouse.managedBy || fromWarehouse.managedBy.length === 0) {
    throw new Error(
      `No staff assigned to the warehouse with ID: ${fromWarehouseId}`
    );
  }
  if (!toWarehouse.managedBy || toWarehouse.managedBy.length === 0) {
    throw new Error(
      `No staff assigned to the warehouse with ID: ${toWarehouseId}`
    );
  }

  //Check and validate product stock in the 'from' warehouse
  for (const { productId, quantity } of products) {
    const productInFromWarehouse = fromWarehouse.products.find(
      (p: { productId: mongoose.Types.ObjectId }) =>
        p.productId.equals(productId)
    );
    if (!productInFromWarehouse || productInFromWarehouse.quantity < quantity) {
      throw new Error(
        `Product ${productId} not found in the source warehouse.`
      );
    }
  }
  try {
    //Fetch product details for the transfer
    const productsWithDetails = await Promise.all(
      products.map(async (product) => {
        const productData = await Product.findById(product.productId).session(
          session
        );
        if (!productData) {
          throw new Error(`Product with ID ${product.productId} not found.`);
        }
        return {
          productId: product.productId,
          name: productData.name, // Include name
          price: productData.price, // Include price
          quantity: product.quantity,
          status: "Pending",
        };
      })
    );
    //Calculate total quantity and price
    const totalQuantity = productsWithDetails.reduce(
      (acc, product) => acc + product.quantity,
      0
    );
    const totalPrice = productsWithDetails.reduce(
      (acc, product) => acc + product.price * product.quantity,
      0
    );

    //Create and Save transfer request
    const transferRequest = new TransferRequest({
      fromWarehouseId,
      toWarehouseId,
      products: productsWithDetails,
      status: "Pending",
      totalQuantity,
      totalPrice,
      requestedBy,
      transferType,
      requestDate: new Date(),
      note,
    });
    await transferRequest.save({ session });
    //Update the Inventory for Transfer Request
    await Promise.all(
      productsWithDetails.map(async ({ productId, quantity, price }) => {
        const totalValue = price * quantity;
        // products.map(async ({ productId, quantity }) => {
        //   const productData = await Product.findById(productId);
        //   const totalValue = (productData?.price || 0) * quantity;
        const inventoryTransaction = new InventoryTransaction({
          transactionType: "Inter-Warehouse Transfer",
          fromWarehouseId,
          toWarehouseId,
          products: [{ productId, quantity }],
          totalValue,
          transactionDate: new Date(),
          staffId: requestedBy,
          interWarehouseTransferStatus: "Pending",
          note: `Transfer request to warehouse ${toWarehouseId}`,
        });

        await inventoryTransaction.save({ session });
      })
    );
    //Notify the involved warehouses' staff
    const notifyStaff = async (
      warehouseId: mongoose.Types.ObjectId,
      message: string,
      type: string,
      transferId: mongoose.Types.ObjectId
    ) => {
      const warehouseStaffs = await User.find({
        _id: {
          $in:
            warehouseId === fromWarehouseId
              ? fromWarehouse.managedBy
              : toWarehouse.managedBy,
        },
      });
      const warehouseStaff: mongoose.Types.ObjectId[] = warehouseStaffs.map(
        (user) => user._id as mongoose.Types.ObjectId
      );
      if (warehouseStaff.length === 0) {
        console.log(
          `No staff assigned to the warehouse with ID: ${warehouseId}`
        );
        return;
      }
      for (const staff of warehouseStaff) {
        await transferRequestNotification(
          staff,
          message,
          "Transfer Request",
          transferId
        );
      }
    };

    await notifyStaff(
      fromWarehouseId,
      `You have a new transfer request from warehouse ${fromWarehouse.name}.`,
      "Tranfer Request",
      transferRequest._id as mongoose.Types.ObjectId
    );
    await notifyStaff(
      toWarehouseId,
      `You have sent a transfer request to warehouse ${toWarehouse.name}.`,
      "Tranfer Request",
      transferRequest._id as mongoose.Types.ObjectId
    );
    await transferRequestNotification(
      requestedBy,
      `Your transfer request has been created.`,
      "Tranfer Request",
      transferRequest._id as mongoose.Types.ObjectId
    );
    //Commit the transaction
    await session.commitTransaction();
    return transferRequest;
  } catch (error: any) {
    //If an error occurs, abort the transaction
    await session.abortTransaction();
    console.error("Error creating transfer request:", error.message);
    throw new Error(error.message || "Could not create transfer request.");
  } finally {
    //End transaction
    session.endSession();
  }
};

//HANDLE APPROVE, DECLINE, CANCEL, IN-TRANSIT LOGIC
const handleTransferRequestStatus = async (
  transferRequestId: mongoose.Types.ObjectId,
  status: string,
  approvedBy: mongoose.Types.ObjectId,
  note?: string
): Promise<any> => {
  //Initialize Session Transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const transferRequest = await TransferRequest.findById(transferRequestId)
      .populate("fromWarehouseId")
      .populate("toWarehouseId")
      .populate("products.productId")
      .session(session);
    if (!transferRequest) {
      throw new Error("Transfer request not found.");
    }

    //Check if the warehouses can accommodate the transfer
    const fromWarehouse = await Warehouse.findById(
      transferRequest.fromWarehouseId
    )
      .populate("products")
      .session(session);
    const toWarehouse = await Warehouse.findById(transferRequest.toWarehouseId)
      .populate("products")
      .session(session);

    if (!fromWarehouse || !toWarehouse) {
      throw new Error("Invalid warehouse.");
    }

    //Retrieve the managedBy fields for both warehouses
    const fromWarehouseManagedBy = fromWarehouse.managedBy; // Assuming fromWarehouse has a managedBy field
    const toWarehouseManagedBy = toWarehouse.managedBy;

    //Calculate and validate product quantities
    const productQuantities = transferRequest.products.reduce(
      (acc, product) => {
        const productIdStr = product.productId._id.toString();

        const fromProduct = fromWarehouse.products.find(
          (p) => p.productId.toString() === productIdStr
        );

        if (!fromProduct || fromProduct.quantity < product.quantity) {
          throw new Error(
            `Insufficient quantity of product ${productIdStr} in the originating warehouse.`
          );
        }
        const toProduct = toWarehouse.products.find(
          (p) => p.productId.toString() === productIdStr
        );
        const currentToQuantity = toProduct ? toProduct.quantity : 0;

        if (currentToQuantity + product.quantity > toWarehouse.capacity) {
          throw new Error(
            `Adding product ${productIdStr} exceeds the target warehouse's capacity.`
          );
        }

        acc.from[productIdStr] =
          (acc.from[productIdStr] || 0) - product.quantity;
        acc.to[productIdStr] = (acc.to[productIdStr] || 0) + product.quantity;
        return acc;
      },
      {
        from: {} as { [key: string]: number },
        to: {} as { [key: string]: number },
      }
    );

    //Notify the involved warehouses' staff
    const notifyStaff = async (
      warehouseId: mongoose.Types.ObjectId,
      message: string,
      type: string,
      transferId: mongoose.Types.ObjectId
    ) => {
      const warehouseStaffs = await User.find({
        _id: { $in: warehouseId },
      }).session(session);
      const warehouseStaff: mongoose.Types.ObjectId[] = warehouseStaffs.map(
        (user) => user._id as mongoose.Types.ObjectId
      );
      if (warehouseStaff.length === 0) {
        console.log(
          `No staff assigned to the warehouse with ID: ${warehouseId}`
        );
        return;
      }
      for (const staff of warehouseStaff) {
        await transferRequestNotification(
          staff._id,
          `You have ${status.toLowerCase()} the transfer request from ${
            transferRequest.requestedBy
          }.`,
          "Tranfer Request",
          transferRequest._id as mongoose.Types.ObjectId
        );
      }
    };

    //Handle different statuses (Declined, Cancelled, Approved, In Transit)
    switch (status) {
      //If transfer request is Declined
      case "Declined":
        //Check if the transfer request is already processed
        if (transferRequest.status !== "Pending") {
          throw new Error(
            "Transfer request must be created before it can be declined."
          );
        }
        transferRequest.status = "Declined";
        transferRequest.declineDate = new Date();
        if (note) {
          transferRequest.note = note;
        }
        //Check if the user making the request is authorized for approve, decline, and in-transit actions
        if (
          status === "Declined" &&
          !fromWarehouseManagedBy.includes(approvedBy)
        ) {
          throw new Error(
            "Only the manager of the originating warehouse can approve, decline, or process in-transit actions."
          );
        }

        //Notify the staff of the fromWarehouse that the transfer request has been declined
        await notifyStaff(
          transferRequest.fromWarehouseId,
          `The transfer request ${transferRequestId} has been declined. Note: ${transferRequest.note}`,
          "Transfer Request",
          transferRequest._id as mongoose.Types.ObjectId
        );

        //Notify the user who requested the transfer
        await transferRequestNotification(
          transferRequest.requestedBy,
          `Your transfer request ${transferRequestId} has been declined. Note: ${transferRequest.note}`,
          "Transfer Request",
          transferRequest._id as mongoose.Types.ObjectId
        );
        break;

      //If transfer request is approved
      case "Approved":
        //Check if the transfer request is already processed
        if (transferRequest.status !== "Pending") {
          throw new Error(
            "Transfer request must be created before it can be approved."
          );
        }
        transferRequest.status = "Approved";
        transferRequest.approvedBy = approvedBy;
        transferRequest.approvalDate = new Date();
        break;

      //If transfer request is in transit
      case "In Transit":
        //Check if the transfer request is already processed
        if (transferRequest.status !== "Approved") {
          throw new Error(
            "Transfer request must be approved before it can be marked as in transit."
          );
        }
        const acceptedProducts = transferRequest.products.filter(
          (product) => product.status === "Accepted"
        );

        if (acceptedProducts.length === 0) {
          throw new Error("No products have been accepted for this transfer.");
        }
        transferRequest.status = "In Transit";
        //Create inventory transaction
        const totalValue = await Promise.all(
          acceptedProducts.map(async ({ productId, quantity }) => {
            const product = await Product.findById(productId);
            if (!product)
              throw new Error(`Product with ID ${productId} not found.`);
            return product.price * quantity;
          })
        ).then((values) => values.reduce((acc, val) => acc + val, 0));

        const inventoryTransaction = new InventoryTransaction({
          transactionType: "Inter-Warehouse Transfer",
          fromWarehouseId: fromWarehouse._id,
          toWarehouseId: toWarehouse._id,
          products: acceptedProducts,
          totalValue,
          transactionDate: new Date(),
          staffId: transferRequest.approvedBy,
          interWarehouseTransferStatus: "In Transit",
          note: `Transfer request from warehouse ${transferRequest.fromWarehouseId._id}`,
        });

        await inventoryTransaction.save({ session });

        //If in transit, immediately deduct products from  the sending warehouse
        await Promise.all(
          acceptedProducts.map(async ({ productId, quantity }) => {
            //Convert productId to ObjectId
            const productObjectId = new mongoose.Types.ObjectId(productId);
            //Deduct products from source warehouse
            const result = await Warehouse.findOneAndUpdate(
              {
                _id: transferRequest.fromWarehouseId,
                "products.productId": productObjectId,
              },
              { $inc: { "products.$.quantity": -quantity } }
            ).session(session);
          })
        );

        //Update totalValue and totalQuantity for the sending warehouse
        const updatedFromWarehouse = await Warehouse.findById(
          transferRequest.fromWarehouseId
        ).session(session);
        if (updatedFromWarehouse) {
          let totalQuantity = 0;
          let totalValue = 0;

          for (const product of updatedFromWarehouse.products) {
            totalQuantity += product.quantity;
            totalValue += product.quantity * product.price;
          }

          updatedFromWarehouse.totalQuantity = totalQuantity;
          updatedFromWarehouse.totalValue = totalValue;
          await updatedFromWarehouse.save({ session });
        }
        break;

      default:
        throw new Error("Invalid Transfer Request Status");
    }
    await transferRequest.save({ session });

    await notifyStaff(
      transferRequest.fromWarehouseId,
      `The transfer request ${
        transferRequest._id
      } status has been updated to ${status.toLowerCase()}.`,
      "Transfer Request",
      transferRequest._id as mongoose.Types.ObjectId
    );
    await notifyStaff(
      transferRequest.toWarehouseId,
      `The transfer request ${
        transferRequest._id
      } status has been updated to ${status.toLowerCase()}.`,
      "Transfer Request",
      transferRequest._id as mongoose.Types.ObjectId
    );

    await transferRequestNotification(
      transferRequest.requestedBy,
      `Your transfer request ${
        transferRequest._id
      } has been updated to ${status.toLowerCase()} by ${approvedBy}.`,
      "Tranfer Request",
      transferRequest._id as mongoose.Types.ObjectId
    );
    //Commit the transaction
    await session.commitTransaction();
    return transferRequest;
  } catch (error: any) {
    //If an error occurs, abort the transaction
    await session.abortTransaction();
    throw new Error(
      error.message || "Could not process transfer request status..."
    );
  } finally {
    //End transaction
    session.endSession();
  }
};

//LOGIC TO CANCEL TRANSFER REQUEST BY BOTH REQUESTING STAFF AND APPROVING STAFF
const cancelTransferRequest = async (
  transferRequestId: mongoose.Types.ObjectId,
  status: string,
  userId: mongoose.Types.ObjectId, //Can represent either approvedBy or requestedBy
  note?: string
) => {
  //Start a new transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  const transferRequest = await TransferRequest.findById(transferRequestId)
    .populate("fromWarehouseId")
    .populate("toWarehouseId")
    .populate("products.productId")
    .session(session);
  if (!transferRequest) {
    throw new Error("Transfer request not found");
  }

  try {
    //Check if the transfer request is already processed
    if (
      transferRequest.status === "In Transit" ||
      transferRequest.status === "Completed" ||
      transferRequest.status === "Transferred"
    ) {
      throw new Error(
        "Transfer request cannot be cancelled once it is in transit, completed or transferred."
      );
    }

    transferRequest.status = "Cancelled";
    transferRequest.cancellationDate = new Date();
    if (note) {
      transferRequest.note = note;
    }
    await transferRequest.save({ session });

    //Notify the both Users Involved In the Transfer Request
    if (String(transferRequest.requestedBy) === String(userId)) {
      await transferRequestNotification(
        transferRequest.approvedBy,
        `The transfer request ${transferRequestId} has been cancelled by the requesting user. Note: ${transferRequest.note}`,
        "Transfer Request",
        transferRequest._id as mongoose.Types.ObjectId
      );
    } else {
      await transferRequestNotification(
        transferRequest.requestedBy,
        `Your transfer request ${transferRequestId} has been cancelled by the approving user. Note: ${transferRequest.note}`,
        "Transfer Request",
        transferRequest._id as mongoose.Types.ObjectId
      );
    }
    //Commit the transaction
    await session.commitTransaction();
    //Save the updated transfer request
    return transferRequest;
  } catch (error: any) {
    //If an error occurs, abort the transaction
    await session.abortTransaction();
    throw new Error(error.message || "Failed to cancel transfer request");
  } finally {
    //End the transaction
    session.endSession();
  }
};

//LOGIC TO UPDATE ACCEPTED INDIVIDUAL PRODUCTS IN TRANSFER REQUEST
const handleAcceptedProducts = async (
  transferRequestId: mongoose.Types.ObjectId,
  products: {
    productId: mongoose.Types.ObjectId;
    status: "Accepted";
  }[]
): Promise<void> => {
  //Start transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  const transferRequest = await TransferRequest.findById(transferRequestId)
    .populate("fromWarehouseId")
    .populate("toWarehouseId")
    .populate("products.productId")
    .session(session);
  if (!transferRequest) {
    throw new Error("Transfer request not found");
  }
  try {
    //Update the status of each product
    for (const { productId, status } of products) {
      //Find the product in the transfer request
      const acceptedProduct = transferRequest.products.find(
        (p) => p.productId._id.toString() === productId.toString()
      );
      if (!acceptedProduct) {
        throw new Error("Product not found in transfer request");
      }
      //Update the status of the product (Accepted or Rejected)
      acceptedProduct.status = status;
    }

    //Save the updated transfer request
    await transferRequest.save({ session });
    //Commit the transaction
    await session.commitTransaction();
  } catch (error: any) {
    //If an error occurs, abort the transaction
    await session.abortTransaction();
    throw new Error(error.message || "Could not update product status");
  } finally {
    //End the session
    session.endSession();
  }
};

//LOGIC TO UPDATE REJECTED INDIVIDUAL PRODUCTS IN TRANSFER REQUEST
const handleRejectedProducts = async (
  transferRequestId: mongoose.Types.ObjectId,
  products: {
    productId: mongoose.Types.ObjectId;
    status: "Rejected";
  }[]
): Promise<void> => {
  //Start transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  const transferRequest = await TransferRequest.findById(transferRequestId)
    .populate("fromWarehouseId")
    .populate("toWarehouseId")
    .populate("products.productId")
    .session(session);
  if (!transferRequest) {
    throw new Error("Transfer request not found");
  }

  try {
    //Update the status of each product
    for (const { productId, status } of products) {
      //Find the product in the transfer request
      const rejectedProduct = transferRequest.products.find(
        (p) => p.productId._id.toString() === productId.toString()
      );
      if (!rejectedProduct) {
        throw new Error("Product not found in transfer request");
      }

      //Update the status of the product (Accepted or Rejected)
      rejectedProduct.status = status;
    }
    //Notify staff about the rejected products
    const notifyStaff = async (
      warehouseId: mongoose.Types.ObjectId,
      message: string,
      type: string,
      transferId: mongoose.Types.ObjectId
    ) => {
      const warehouseStaffs = await User.find({
        _id: { $in: warehouseId },
      });
      for (const staff of warehouseStaffs) {
        await transferRequestNotification(
          staff._id,
          `Some products in transfer request ${transferRequestId} were rejected.`,
          "Transfer Request",
          transferRequest._id as mongoose.Types.ObjectId
        );
      }
    };

    await notifyStaff(
      transferRequest.fromWarehouseId,
      "The transfer request has been rejected",
      "Transfer Request",
      transferRequest._id as mongoose.Types.ObjectId
    );
    await transferRequestNotification(
      transferRequest.requestedBy,
      `Your transfer request has been rejected by ${transferRequest.approvedBy}`,
      "Tranfer Request",
      transferRequest._id as mongoose.Types.ObjectId
    );

    await transferRequest.save({ session });
    //Commit the transaction
    await session.commitTransaction();
  } catch (error: any) {
    //If an error occurs, Abort the transaction
    await session.abortTransaction();
    throw new Error(error.message || "Could not handle rejected Products...");
  } finally {
    //End the transaction
    await session.endSession();
  }
};

//FAILED TRANSFER REQUEST
const failedTransferRequest = async (
  transferRequestId: mongoose.Types.ObjectId,
  status: string,
  approvedBy: mongoose.Types.ObjectId,
  note?: string
): Promise<ITransferRequest> => {
  try {
    const transferRequest = await TransferRequest.findById(transferRequestId)
      .populate("fromWarehouseId")
      .populate("toWarehouseId")
      .populate("products.productId");
    if (!transferRequest) {
      throw new Error("Transfer request not found.");
    }

    if (transferRequest.status !== "In Transit") {
      throw new Error("Transfer request is not In Transit.");
    }
    //Update the transfer request status to Failed
    transferRequest.status = "Failed Transfer Request";
    transferRequest.approvedBy = approvedBy;
    transferRequest.note = note || "";
    transferRequest.failedRequestDate = new Date();
    await transferRequest.save();

    //Create an Inventory transaction for failed transfer
    const acceptedProducts = transferRequest.products.filter(
      (product) => product.status === "Accepted"
    );
    const totalValue = await Promise.all(
      acceptedProducts.map(async ({ productId, quantity }) => {
        const product = await Product.findById(productId);
        if (!product)
          throw new Error(`Product with ID ${productId} not found.`);
        return product.price * quantity;
      })
    ).then((values) => values.reduce((acc, val) => acc + val, 0));

    const inventoryTransaction = new InventoryTransaction({
      transactionType: "Inter-Warehouse Transfer",
      fromWarehouseId: transferRequest.fromWarehouseId,
      toWarehouse: transferRequest.toWarehouseId,
      products: acceptedProducts,
      totalValue,
      transactionDate: new Date(),
      staffId: transferRequest.approvedBy,
      interWarehouseTransferStatus: "Failed Transfer Request",
      note: `Failed Transfer request from warehouse ${transferRequest.fromWarehouseId}`,
    });

    //Save Inventory
    await inventoryTransaction.save();

    //Notify the requestedBy user that the transfer is completed
    await transferRequestNotification(
      transferRequest.requestedBy,
      `Your transfer request has Failed and could not be completed. Note: ${transferRequest.note}`,
      "Transfer Request",
      transferRequest._id as mongoose.Types.ObjectId
    );

    //Notify staff of both warehouses that the transfer is completed
    await transferRequestNotification(
      transferRequest.approvedBy,
      `The transfer request you approved has Failed and could not be completed. Note: ${transferRequest.note}`,
      "Transfer Request",
      transferRequest._id as mongoose.Types.ObjectId
    );

    return transferRequest;
  } catch (error: any) {
    console.error("Error completing failed transfer request", error.message);
    throw new Error(error.message || "Could not fail transfer request.");
  }
};

//COMPLETE A TRANSFER REQUEST
const completeTransferRequest = async (
  transferRequestId: mongoose.Types.ObjectId,
  status: string,
  requestedBy: mongoose.Types.ObjectId,
  note?: string
): Promise<ITransferRequest> => {
  //Start the transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const transferRequest = await TransferRequest.findById(transferRequestId)
      .populate("fromWarehouseId")
      .populate("toWarehouseId")
      .populate("products.productId")
      .session(session);
    if (!transferRequest) {
      throw new Error("Transfer request not found.");
    }

    const fromWarehouse = await Warehouse.findById(
      transferRequest.fromWarehouseId
    ).populate("products.productId");
    const toWarehouse = await Warehouse.findById(
      transferRequest.toWarehouseId
    ).populate("products.productId");

    if (!fromWarehouse || !toWarehouse) {
      throw new Error("Invalid warehouse.");
    }

    if (transferRequest.status !== "In Transit") {
      throw new Error("Transfer request is not In Transit.");
    }
    transferRequest.status = "Completed";
    transferRequest.requestedBy = requestedBy;
    transferRequest.note = note || "";
    transferRequest.completionDate = new Date();
    await transferRequest.save({ session });

    //Create an inventory transaction for each product
    const totalValue = await Promise.all(
      transferRequest.products.map(async ({ productId, quantity }) => {
        const product = await Product.findById(productId);
        if (!product)
          throw new Error(`Product with ID ${productId} not found.`);
        return product.price * quantity;
      })
    ).then((values) => values.reduce((acc, val) => acc + val, 0));

    const inventoryTransaction = new InventoryTransaction({
      transactionType: "Inter-Warehouse Transfer",
      fromWarehouseId: transferRequest.fromWarehouseId,
      toWarehouseId: transferRequest.toWarehouseId,
      products: transferRequest.products,
      totalValue,
      transactionDate: new Date(),
      staffId: transferRequest.approvedBy,
      interWarehouseTransferStatus: "Completed",
      note: `Transfer request from warehouse ${transferRequest.fromWarehouseId._id}`,
    });

    //Save Inventory
    await inventoryTransaction.save({ session });

    //Notify the fromWarehouse that the transfer is completed
    const notifyStaff = async (
      warehouseId: mongoose.Types.ObjectId,
      message: string,
      type: string,
      transferId: mongoose.Types.ObjectId
    ) => {
      const warehouseStaffs = await User.find({
        _id: { $in: warehouseId },
      });
      const warehouseStaff: mongoose.Types.ObjectId[] = warehouseStaffs.map(
        (user) => user._id as mongoose.Types.ObjectId
      );
      if (warehouseStaff.length === 0) {
        console.log(
          `No staff assigned to the warehouse with ID: ${warehouseId}`
        );
        return;
      }
      for (const staff of warehouseStaff) {
        await transferRequestNotification(staff, message, type, transferId);
      }
    };

    //Notify the requestedBy user that the transfer is completed
    await transferRequestNotification(
      transferRequest.requestedBy,
      `Your transfer request has been completed. Note: ${transferRequest.note}`,
      "Transfer Request",
      transferRequest._id as mongoose.Types.ObjectId
    );

    //Notify staff of both warehouses that the transfer is completed
    await notifyStaff(
      transferRequest.fromWarehouseId,
      `The transfer request you approved has been completed. Note: ${transferRequest.note}`,
      "Transfer Request",
      transferRequest._id as mongoose.Types.ObjectId
    );

    await notifyStaff(
      transferRequest.toWarehouseId,
      `The transfer request to your warehouse has been completed. Note: ${transferRequest.note}`,
      "Transfer Request",
      transferRequest._id as mongoose.Types.ObjectId
    );
    //Commit the transaction
    await session.commitTransaction();
    return transferRequest;
  } catch (error: any) {
    //If an error occurs, abort the transaction
    await session.abortTransaction();
    console.error("Error completing transfer request", error.message);
    throw new Error(error.message || "Could not complete transfer request.");
  } finally {
    //End transaction
    session.endSession();
  }
};

//TRANSFER PRODUCTS TO DESTINATION WAREHOUSE
const transferProducts = async (
  transferRequestId: mongoose.Types.ObjectId,
  requestedBy: mongoose.Types.ObjectId,
  note?: string
) => {
  //Start transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  const transferRequest = await TransferRequest.findById(transferRequestId)
    .populate("fromWarehouseId")
    .populate("toWarehouseId")
    .populate("products.productId")
    .session(session);
  if (!transferRequest) {
    throw new Error("Transfer request not found.");
  }

  if (transferRequest.status !== "Completed") {
    throw new Error("Transfer request is not Completed.");
  }
  try {
    //Update inventory and transfer the products
    const acceptedProducts = transferRequest.products.filter(
      (product) => product.status === "Accepted"
    );

    //Increment quantity in the toWarehouse
    for (const product of acceptedProducts) {
      //Access product details (name, price)
      const { productId, quantity } = product;
      const { name, price } = productId as any;
      //Check if Destination Warehouse already has the product
      const existingProductInToWarehouse = await Warehouse.findOne({
        _id: transferRequest.toWarehouseId,
        "products.productId": product.productId,
      }).session(session);
      if (existingProductInToWarehouse) {
        //If product exists in Warehouse, Increment the quantity in the recieving warehouse for accepted products
        await Warehouse.findOneAndUpdate(
          {
            _id: transferRequest.toWarehouseId,
            "products.productId": product.productId,
          },
          { $inc: { "products.$.quantity": product.quantity } }
        ).session(session);
      } else {
        //If product does not exist in Warehouse, Add the product to the receiving warehouse for accepted products
        await Warehouse.findOneAndUpdate(
          {
            _id: transferRequest.toWarehouseId,
          },
          {
            $push: {
              products: {
                productId: product.productId,
                name: name,
                quantity: quantity,
                price: price,
                // status: "accepted",
              },
            },
          }
        ).session(session);
      }
    }
    //Update totalValue and totalQuantity for the receiving warehouse
    const updatedWarehouse = await Warehouse.findById(
      transferRequest.toWarehouseId
    ).session(session);
    if (updatedWarehouse) {
      let totalQuantity = 0;
      let totalValue = 0;
      for (const product of updatedWarehouse.products) {
        totalQuantity += product.quantity;
        totalValue += product.quantity * product.price;
      }
      updatedWarehouse.totalQuantity = totalQuantity;
      updatedWarehouse.totalValue = totalValue;
      await updatedWarehouse.save({ session });
    }

    transferRequest.status = "Transferred";
    transferRequest.requestedBy = requestedBy;
    await transferRequest.save({ session });
    //Commit the transaction
    await session.commitTransaction();
  } catch (error: any) {
    //If an error occurs, abort the transaction
    await session.abortTransaction();
    console.error("Error transferring products", error.message);
    throw new Error(error.message || "Could not transfer products.");
  } finally {
    //End transaction
    session.endSession();
  }
};

//My mentol told me not to touch the product database so the product quantity wont rhyme with the warehouse
//He told me i am only dealing with warehouse
///products cannot be deleted

export {
  createTransferRequest,
  handleTransferRequestStatus,
  cancelTransferRequest,
  handleAcceptedProducts,
  handleRejectedProducts,
  failedTransferRequest,
  completeTransferRequest,
  transferProducts,
};

// //Update product quantities in the product database
// for (const product of acceptedProducts) {
//   const { productId, quantity } = product;
//   const productObjectId = new mongoose.Types.ObjectId(productId);
//   console.log(8);
//   //Update the originating warehouse (decrement quantity)
//   await Product.findOneAndUpdate(
//     {
//       _id: productObjectId,
//       warehouse: transferRequest.fromWarehouseId,
//     },
//     { $inc: { quantity: -quantity } }
//   );
//   console.log(9);
//   //Check if the product exists in the destination warehouse
//   const productInDestinationWarehouse = await Product.findOne({
//     _id: productObjectId,
//     warehouse: transferRequest.toWarehouseId,
//   });
//   console.log(10);
//   if (productInDestinationWarehouse) {
//     //If the product exists, increment the quantity
//     await Product.findOneAndUpdate(
//       {
//         _id: productObjectId,
//         warehouse: transferRequest.toWarehouseId,
//       },
//       { $inc: { quantity: quantity } }
//     );
//     console.log(11);
//   } else {
//     //If the product does not exist, create a new product entry in the destination warehouse
//     const productDetails = await Product.findById(productObjectId);
//     if (productDetails) {
//       const newProduct = new Product({
//         _id: productObjectId, // Use the same product ID
//         name: productDetails.name,
//         category: productDetails.category,
//         price: productDetails.price,
//         quantity: quantity,
//         warehouse: transferRequest.toWarehouseId,
//         supplier: productDetails.supplier,
//       });
//       await newProduct.save();
//     }
//   }
// }
