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
import { authenticateToken } from "../middlewares/authentication";

//Initialize Router
const router: Router = express.Router();

//ROUTE TO GET ALL TRANSFER REQUESTS
router.get("/transfer-request", authenticateToken, getAllTransferRequest);

//ROUTE TO GET A SINGLE TRANSFER REQUEST
router.get("/transfer-request/:id", authenticateToken, getTransferRequest);

//ROUTE TO CREATE TRANSFER REQUEST
router.post("/create/transfer-request", authenticateToken, transferRequest);

//ROUTE TO APPROVE TRANSFER REQUEST
router.put(
  "/transfer-request/:id/approval",
  authenticateToken,
  transferApproval
);

//ROUTE TO DECLINE TRANSFER REQUEST
router.put(
  "/transfer-request/:id/decline",
  authenticateToken,
  transferDeclined
);

//ROUTE TO MARK TRANSFER REQUEST PRODUCTS TO IN TRANSIT
router.put(
  "/transfer-request/:id/in-transit",
  authenticateToken,
  transferInTransit
);

//ROUTE TO CANCEL TRANSFER REQUEST
router.put(
  "/transfer-request/:id/cancel",
  authenticateToken,
  transferCancelled
);

//ROUTE TO UPDATE PRODUCT STATUS
router.put(
  "/transfer-request/:id/product-status",
  authenticateToken,
  handleProductStatus
);

//ROUTE TO REPORT FAILED TRANSFER
router.put(
  "/transfer-request/:id/failed-transfer",
  authenticateToken,
  transferfailed
);
//ROUTE TO MARK TRANSACTION REQUEST AS COMPLETE
router.put(
  "/transfer-request/:id/complete",
  authenticateToken,
  transferCompleted
);

//ROUTE TO TRANSFER PRODUCT TO DESTINATION WAREHOUSE
router.put(
  "/transfer-request/:id/transfer-products",
  authenticateToken,
  handleTransferProduct
);

//ROUTE TO DELETE TRANSFER REQUEST
router.delete(
  "/transfer-request/:id",
  authenticateToken,
  deleteTransferRequest
);
export default router;
