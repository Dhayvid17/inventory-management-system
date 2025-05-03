import express, { Router } from "express";
import {
  getAllTransferRequest,
  getTransferRequest,
  transferRequest,
  transferApproval,
  transferDeclined,
  transferInTransit,
  transferCancelled,
  handleProductStatus,
  transferCompleted,
  handleTransferProduct,
  deleteTransferRequest,
  transferfailed,
} from "../controllers/transferRequestController";
import {
  authenticateToken,
  authorizeAdmin,
  authorizeStaff,
} from "../middlewares/authentication";

//Initialize Router
const router: Router = express.Router();

//ROUTE TO GET ALL TRANSFER REQUESTS
router.get(
  "/transfer-request",
  authenticateToken,
  authorizeStaff,
  getAllTransferRequest
);

//ROUTE TO GET A SINGLE TRANSFER REQUEST
router.get(
  "/transfer-request/:id",
  authenticateToken,
  authorizeStaff,
  getTransferRequest
);

//ROUTE TO CREATE TRANSFER REQUEST
router.post(
  "/create/transfer-request",
  authenticateToken,
  authorizeStaff,
  transferRequest
);

//ROUTE TO APPROVE TRANSFER REQUEST
router.put(
  "/transfer-request/:id/approval",
  authenticateToken,
  authorizeAdmin,
  transferApproval
);

//ROUTE TO DECLINE TRANSFER REQUEST
router.put(
  "/transfer-request/:id/decline",
  authenticateToken,
  authorizeStaff,
  transferDeclined
);

//ROUTE TO MARK TRANSFER REQUEST PRODUCTS TO IN TRANSIT
router.put(
  "/transfer-request/:id/in-transit",
  authenticateToken,
  authorizeStaff,
  transferInTransit
);

//ROUTE TO CANCEL TRANSFER REQUEST
router.put(
  "/transfer-request/:id/cancel",
  authenticateToken,
  authorizeStaff,
  transferCancelled
);

//ROUTE TO UPDATE PRODUCT STATUS
router.put(
  "/transfer-request/:id/product-status",
  authenticateToken,
  authorizeStaff,
  handleProductStatus
);

//ROUTE TO REPORT FAILED TRANSFER
router.put(
  "/transfer-request/:id/failed-transfer",
  authenticateToken,
  authorizeStaff,
  transferfailed
);

//ROUTE TO MARK TRANSACTION REQUEST AS COMPLETE
router.put(
  "/transfer-request/:id/complete",
  authenticateToken,
  authorizeStaff,
  transferCompleted
);

//ROUTE TO TRANSFER PRODUCT TO DESTINATION WAREHOUSE
router.put(
  "/transfer-request/:id/transfer-products",
  authenticateToken,
  authorizeStaff,
  handleTransferProduct
);

//ROUTE TO DELETE TRANSFER REQUEST
router.delete(
  "/transfer-request/:id",
  authenticateToken,
  authorizeAdmin,
  deleteTransferRequest
);
export default router;
