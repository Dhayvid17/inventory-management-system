import express, { Request, Response } from "express";
import {
  createTransferRequest,
  handleTransferRequestStatus,
  handleAcceptedProducts,
  handleRejectedProducts,
  completeTransferRequest,
  transferProducts,
  cancelTransferRequest,
  failedTransferRequest,
} from "../services/transferService";
import mongoose, { isValidObjectId, Schema } from "mongoose";
import Warehouse from "../models/warehouseModel";
import User from "../models/userModel";
import Product from "../models/productModel";
import TransferRequest, {
  ITransferRequest,
} from "../models/transferRequestModel";

//GET ALL TRANSFER REQUEST TRANSACTIONS
const getAllTransferRequest = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  try {
    //Fetch all transfer requests
    const transferRequests: ITransferRequest[] = await TransferRequest.find()
      .populate("fromWarehouseId")
      .populate("toWarehouseId")
      .populate("products.productId")
      .populate("requestedBy")
      .populate("approvedBy");

    if (!transferRequests) {
      return res.status(404).json({ error: "transfer requests not found" });
    }
    return res.status(200).json(transferRequests);
  } catch (error: any) {
    return res.status(500).json({
      error: "Could not fetch all transfer requests",
      details: error.message,
    });
  }
};

//GET A TRANSFER REQUEST TRANSACTION
const getTransferRequest = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Invalid warehouse id" });
  }

  try {
    //Fetch a transfer request
    const transferRequest: ITransferRequest | null =
      await TransferRequest.findById(req.params.id)
        .populate("fromWarehouseId")
        .populate("toWarehouseId")
        .populate("products.productId")
        .populate("requestedBy")
        .populate("approvedBy");

    if (!transferRequest) {
      return res.status(404).json({ error: "transfer request not found" });
    }
    return res.status(200).json(transferRequest);
  } catch (error: any) {
    return res.status(500).json({
      error: "Could not fetch transfer request",
      details: error.message,
    });
  }
};

//CREATE TRANSFER REQUEST
const transferRequest = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { fromWarehouseId, toWarehouseId, products, transferType, note } =
    req.body;
  const requestedBy = (req as any).user?.id; // Automatically populate the user field.
  if (!fromWarehouseId || !toWarehouseId || !products || !transferType) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  //Verify if fromWarehouse and toWarehouse is a valid mongoose.Types.ObjectId
  if (
    !mongoose.Types.ObjectId.isValid(fromWarehouseId) ||
    !mongoose.Types.ObjectId.isValid(toWarehouseId)
  ) {
    return res.status(400).json({ error: "Invalid requestedBy ID" });
  }

  //Verify if requestedBy user is managed by toWarehouseId
  const toWarehouse = await Warehouse.findById(toWarehouseId);
  const fromWarehouse = await Warehouse.findById(fromWarehouseId);
  if (!toWarehouse || !fromWarehouse) {
    return res
      .status(400)
      .json({ error: "Invalid toWarehouse Id | Invalid fromWarehouse Id." });
  }

  //Verify if requestedBy is a valid mongoose.Types.ObjectId
  if (!mongoose.Types.ObjectId.isValid(requestedBy)) {
    return res.status(400).json({ error: "Invalid requestedBy ID" });
  }

  //Check if User is valid
  const user = await User.findById(requestedBy);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const isUserAuthorized = toWarehouse.managedBy.includes(requestedBy);
  if (!isUserAuthorized) {
    return res.status(403).json({
      error: "User is not authorized to request transfer for this warehouse",
    });
  }

  //Verify if each productId is in the database and is a mongoose.Types.ObjectId
  for (const product of products) {
    if (!mongoose.Types.ObjectId.isValid(product.productId)) {
      return res
        .status(400)
        .json({ error: `Invalid productId: ${product.productId}` });
    }
    const productExists = await Product.findById(product.productId);
    if (!productExists) {
      return res
        .status(400)
        .json({ error: `Product with ID ${product.productId} does not exist` });
    }
  }

  //Verify transferType
  const validTransferTypes = [
    "SuperToRegular",
    "RegularToRegular",
    "RegularToSuper",
  ];
  if (!validTransferTypes.includes(transferType)) {
    return res.status(400).json({ error: "Invalid transfer type." });
  }

  try {
    const newRequest = await createTransferRequest(
      mongoose.Types.ObjectId.createFromHexString(fromWarehouseId),
      mongoose.Types.ObjectId.createFromHexString(toWarehouseId),
      products,
      "Pending",
      mongoose.Types.ObjectId.createFromHexString(requestedBy),
      transferType,
      note
    );
    if (!newRequest) {
      return res
        .status(400)
        .json({ error: "Failed to create transfer request." });
    }

    return res.status(201).json(newRequest);
  } catch (error: any) {
    return res.status(500).json({
      error: "Error creating Transfer Request",
      details: error.message,
    });
  }
};

//TRANSFER APPPROVAL LOGIC
const transferApproval = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { note } = req.body;
  const approvedBy = (req as any).user?.id; // Automatically populate the user field.
  const transferRequestId = req.params.id;

  //Verify if approvedBy is a valid mongoose.Types.ObjectId
  if (!mongoose.Types.ObjectId.isValid(approvedBy)) {
    return res.status(400).json({ error: "Invalid approvedBy ID" });
  }

  //Retrieve the managedBy fields for  source warehouse
  const transferRequest = await TransferRequest.findById(transferRequestId);
  //Check if transfer request exists
  if (!transferRequest) {
    return res.status(404).json({ error: "Transfer request not found." });
  }

  const fromWarehouseId = transferRequest?.fromWarehouseId;
  const fromWarehouse = await Warehouse.findById(fromWarehouseId);

  //Check if User is valid
  const user = await User.findById(approvedBy);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const isUserAuthorized = fromWarehouse?.managedBy.includes(approvedBy);
  if (!isUserAuthorized) {
    return res.status(403).json({
      error: "User is not authorized to approve transfer for this warehouse",
    });
  }

  try {
    const updatedRequest = await handleTransferRequestStatus(
      new mongoose.Types.ObjectId(transferRequestId),
      "Approved",
      mongoose.Types.ObjectId.createFromHexString(approvedBy),
      note
    );
    return res.status(200).json(updatedRequest);
  } catch (error: any) {
    return res.status(500).json({
      error: "Error approving transfer request",
      details: error.message,
    });
  }
};

//TRANSFER DECLINED LOGIC
const transferDeclined = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { note } = req.body;
  const approvedBy = (req as any).user?.id; // Automatically populate the user field.
  const transferRequestId = req.params.id;

  //Verify if approvedBy is a valid mongoose.Types.ObjectId
  if (!mongoose.Types.ObjectId.isValid(approvedBy)) {
    return res.status(400).json({ error: "Invalid approvedBy ID" });
  }

  //Retrieve the managedBy fields for  source warehouse
  const transferRequest = await TransferRequest.findById(transferRequestId);
  //Check if transfer request exists
  if (!transferRequest) {
    return res.status(404).json({ error: "Transfer request not found." });
  }

  const fromWarehouseId = transferRequest?.fromWarehouseId;
  const fromWarehouse = await Warehouse.findById(fromWarehouseId);
  //Check if User is valid
  const user = await User.findById(approvedBy);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const isUserAuthorized = fromWarehouse?.managedBy.includes(approvedBy);
  if (!isUserAuthorized) {
    return res.status(403).json({
      error: "User is not authorized to decline transfer for this warehouse",
    });
  }
  try {
    const updatedRequest = await handleTransferRequestStatus(
      new mongoose.Types.ObjectId(transferRequestId),
      "Declined",
      mongoose.Types.ObjectId.createFromHexString(approvedBy),
      note
    );
    return res.status(200).json(updatedRequest);
  } catch (error: any) {
    return res.status(500).json({
      error: "Error declining transfer request",
      details: error.message,
    });
  }
};

//UPDATE PRODUCT STATUS IF ACCEPTED OR REJECTED
const handleProductStatus = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { products } = req.body;
  const transferRequestId = req.params.id;
  const managedBy = (req as any).user?.id; // Automatically populate the user field.
  if (!products || !Array.isArray(products)) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  //Check for duplicate product IDs
  const productIds = new Set();

  //Validate the products array
  for (const product of products) {
    if (!product.productId || !product.newStatus) {
      return res.status(400).json({ error: "Invalid product data." });
    }

    if (!["Accepted", "Rejected"].includes(product.newStatus)) {
      return res.status(400).json({
        error: "Invalid status. Only 'accepted' or 'rejected' are allowed.",
      });
    }

    // Check if the productId has already been added to the set (duplicate check)
    if (productIds.has(product.productId.toString())) {
      return res.status(400).json({
        error: `Duplicate product ID found: ${product.productId}`,
      });
    }

    // Add productId to the set
    productIds.add(product.productId.toString());
  }

  //Retrieve the managedBy fields for  source warehouse
  const transferRequest = await TransferRequest.findById(transferRequestId);
  //Check if transfer request exists
  if (!transferRequest) {
    return res.status(404).json({ error: "Transfer request not found." });
  }

  const fromWarehouseId = transferRequest?.fromWarehouseId;
  const fromWarehouse = await Warehouse.findById(fromWarehouseId);
  const fromWarehouseManagedBy = fromWarehouse?.managedBy;
  //Check if managedBy exists in the fromWarehouseManagedBy array
  const isManager = fromWarehouseManagedBy?.some(
    (manager: mongoose.Types.ObjectId) =>
      manager.equals(new mongoose.Types.ObjectId(managedBy))
  );
  if (!isManager) {
    return res.status(400).json({
      error:
        "Only the manager of the originating warehouse can accept or reject products.",
    });
  }
  try {
    //Find the accepted products and the rejected products
    const acceptedProducts = products.filter(
      (product) => product.newStatus === "Accepted"
    );
    const rejectedProducts = products.filter(
      (product) => product.newStatus === "Rejected"
    );

    //Handle accepted products
    if (acceptedProducts.length > 0) {
      await handleAcceptedProducts(
        new mongoose.Types.ObjectId(transferRequestId),
        acceptedProducts.map(
          (product: {
            productId: mongoose.Types.ObjectId;
            newStatus: string;
          }) => ({
            productId: new mongoose.Types.ObjectId(product.productId),
            status: "Accepted",
          })
        )
      );
    }

    //Handle rejected products
    if (rejectedProducts.length > 0) {
      await handleRejectedProducts(
        new mongoose.Types.ObjectId(transferRequestId),
        rejectedProducts.map(
          (product: {
            productId: mongoose.Types.ObjectId;
            newStatus: string;
          }) => ({
            productId: new mongoose.Types.ObjectId(product.productId),
            status: "Rejected",
          })
        )
      );
    }
    return res.status(200).json({ message: "Product status updated" });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Error updating product status", details: error.message });
  }
};

//TRANSFER IN TRANSIT LOGIC
const transferInTransit = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { note } = req.body;
  const approvedBy = (req as any).user?.id; // Automatically populate the user field.
  const transferRequestId = req.params.id;

  //Retrieve the managedBy fields for  source warehouse
  const transferRequest = await TransferRequest.findById(transferRequestId);
  //Check if transfer request exists
  if (!transferRequest) {
    return res.status(404).json({ error: "Transfer request not found." });
  }
  const fromWarehouseId = transferRequest?.fromWarehouseId;
  const fromWarehouse = await Warehouse.findById(fromWarehouseId);
  const fromWarehouseManagedBy = fromWarehouse?.managedBy;

  //Check if managedBy exists in the fromWarehouseManagedBy array
  const isManager = fromWarehouseManagedBy?.some(
    (manager: mongoose.Types.ObjectId) =>
      manager.equals(new mongoose.Types.ObjectId(approvedBy))
  );

  if (!isManager) {
    return res.status(400).json({
      error:
        "Only the manager of the originating warehouse can accept or reject products.",
    });
  }
  try {
    const updatedRequest = await handleTransferRequestStatus(
      new mongoose.Types.ObjectId(transferRequestId),
      "In Transit",
      mongoose.Types.ObjectId.createFromHexString(approvedBy),
      note
    );
    return res.status(200).json(updatedRequest);
  } catch (error: any) {
    return res.status(500).json({
      error: "Error updating products in transit",
      details: error.message,
    });
  }
};

//TRANSFER CANCELLED LOGIC
const transferCancelled = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { note } = req.body;
  const transferRequestId = req.params.id;
  const userId = (req as any).user?.id; // Automatically populate the user field.

  //Verify if requestedBy is a valid mongoose.Types.ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid requestedBy ID" });
  }

  //Check if User is valid
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  //Retrieve the managedBy fields for  source warehouse
  const transferRequest = await TransferRequest.findById(transferRequestId);
  //Check if transfer request exists
  if (!transferRequest) {
    return res.status(404).json({ error: "Transfer request not found." });
  }

  //Ensure only the requesting user or approvedBy user can cancel
  if (
    String(transferRequest.requestedBy) !== String(userId) &&
    String(transferRequest.approvedBy) !== String(userId)
  ) {
    throw new Error(
      "Only the user who requested or approved the transfer can cancel this request."
    );
  }

  try {
    const updatedRequest = await cancelTransferRequest(
      new mongoose.Types.ObjectId(transferRequestId),
      "Cancelled",
      mongoose.Types.ObjectId.createFromHexString(userId),
      note
    );
    return res.status(200).json(updatedRequest);
  } catch (error: any) {
    return res.status(500).json({
      error: "Error cancelling transfer request",
      details: error.message,
    });
  }
};

//FAILED TRANSFER REQUEST LOGIC
const transferfailed = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const transferRequestId = req.params.id;
  const approvedBy = (req as any).user?.id; //Automatically populate the user field.
  const { note } = req.body;

  //Verify if approvedBy is a valid mongoose.Types.ObjectId
  if (!mongoose.Types.ObjectId.isValid(approvedBy)) {
    return res.status(400).json({ error: "Invalid approvedBy ID" });
  }

  //Retrieve the managedBy fields for source warehouse
  const transferRequest = await TransferRequest.findById(transferRequestId);
  if (!transferRequest) {
    return res.status(400).json({ error: "Transfer Request not found" });
  }
  const fromWarehouseId = transferRequest.fromWarehouseId;
  const fromWarehouse = await Warehouse.findById(fromWarehouseId);

  //Check if User is valid
  const user = await User.findById(approvedBy);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const isUserAuthorized = fromWarehouse?.managedBy.includes(approvedBy);
  if (!isUserAuthorized) {
    return res.status(403).json({
      error:
        "User is not authorized to report failed transfer for this warehouse",
    });
  }

  try {
    const transferRequest = await failedTransferRequest(
      new mongoose.Types.ObjectId(transferRequestId),
      "Failed Transfer Request",
      mongoose.Types.ObjectId.createFromHexString(approvedBy),
      note
    );
    return res.status(200).json(transferRequest);
  } catch (error: any) {
    return res.status(500).json({
      error: "Error completing failed transfer",
      details: error.message,
    });
  }
};

//TRANSFER COMPLETED LOGIC
const transferCompleted = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const transferRequestId = req.params.id;
  const requestedBy = (req as any).user?.id; //Automatically populate the user field.
  const { note } = req.body;

  //Verify if requestedBy is a valid mongoose.Types.ObjectId
  if (!mongoose.Types.ObjectId.isValid(requestedBy)) {
    return res.status(400).json({ error: "Invalid requestedBy ID" });
  }

  //Retrieve the managedBy fields for destination warehouse
  const transferRequest = await TransferRequest.findById(transferRequestId);
  const toWarehouseId = transferRequest?.toWarehouseId;
  const toWarehouse = await Warehouse.findById(toWarehouseId);

  //Check if User is valid
  const user = await User.findById(requestedBy);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const isUserAuthorized = toWarehouse?.managedBy.includes(requestedBy);
  if (!isUserAuthorized) {
    return res.status(403).json({
      error: "User is not authorized to complete transfer for this warehouse",
    });
  }

  try {
    const transferRequest = await completeTransferRequest(
      new mongoose.Types.ObjectId(transferRequestId),
      "Completed",
      mongoose.Types.ObjectId.createFromHexString(requestedBy),
      note
    );
    return res.status(200).json(transferRequest);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Error completing transfer", details: error.message });
  }
};

//UPDATE DESTINATION WAREHOUSE
const handleTransferProduct = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const transferRequestId = req.params.id;
  const requestedBy = (req as any).user?.id; // Automatically populate the user field.
  const { note } = req.body;

  //Verify if requestedBy is a valid mongoose.Types.ObjectId
  if (!mongoose.Types.ObjectId.isValid(requestedBy)) {
    return res.status(400).json({ error: "Invalid requestedBy ID" });
  }

  //Retrieve the managedBy fields for Destination warehouse
  const transferRequest = await TransferRequest.findById(transferRequestId);
  const toWarehouseId = transferRequest?.toWarehouseId;
  const toWarehouse = await Warehouse.findById(toWarehouseId);

  //Check if User is valid
  const user = await User.findById(requestedBy);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const isUserAuthorized = toWarehouse?.managedBy.includes(requestedBy);
  if (!isUserAuthorized) {
    return res.status(403).json({
      error: "User is not authorized to transfer to this warehouse",
    });
  }

  try {
    const result = await transferProducts(
      mongoose.Types.ObjectId.createFromHexString(transferRequestId),
      mongoose.Types.ObjectId.createFromHexString(requestedBy),
      note
    );
    return res
      .status(200)
      .json({ message: "Products transferred successfully", result });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Error transferring products", details: error.message });
  }
};

//DELETE TRANSFER REQUEST
const deleteTransferRequest = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  //Check if Transfer Request exists
  const transferRequestExists = await TransferRequest.findById(req.params.id);
  if (!transferRequestExists) {
    return res.status(400).json({ error: "Transfer Request does not exists." });
  }

  try {
    const deleteRequest: ITransferRequest | null =
      await TransferRequest.findByIdAndDelete(req.params.id);
    if (!deleteRequest) {
      return res
        .status(404)
        .json({ error: "Could not delete Transfer Request" });
    }

    return res
      .status(200)
      .json({ message: "Transfer Request deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({
      error: "Error deleting Transfer Request",
      details: error.message,
    });
  }
};

export {
  getAllTransferRequest,
  getTransferRequest,
  transferRequest,
  transferApproval,
  transferDeclined,
  transferInTransit,
  transferCancelled,
  // rejectedProducts,
  handleProductStatus,
  transferfailed,
  transferCompleted,
  handleTransferProduct,
  deleteTransferRequest,
};
