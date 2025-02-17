import express, { Router } from "express";
import {
  getStaffAssignments,
  getStaffAssignment,
  createStaffAssignment,
  reassignStaffToNewWarehouse,
  removeStaffFromWarehouse,
  terminateStaff,
  deleteStaffAssignment,
} from "../controllers/staffAssignmentController";
import {
  authenticateToken,
  authorizeAdmin,
  authorizeStaff,
} from "../middlewares/authentication";

//Initialize Router
const router: Router = express.Router();

//ROUTE TO GET ALL STAFF ASSIGNMENTS
router.get(
  "/staff-assignments",
  authenticateToken,
  authorizeAdmin,
  getStaffAssignments
);

//ROUTE TO GET A SINGLE STAFF ASSIGNMENT
router.get(
  "/staff-assignments/:id",
  authenticateToken,
  authorizeAdmin,
  getStaffAssignment
);

//ROUTE TO CREATE A STAFF ASSIGNMENT
router.post(
  "/staff-assignments",
  authenticateToken,
  authorizeAdmin,
  createStaffAssignment
);

//ROUTE TO RE-ASSIGN A STAFF TO NEW WAREHOUSE
router.put(
  "/staff-assignments/:id",
  authenticateToken,
  authorizeAdmin,
  reassignStaffToNewWarehouse
);

//ROUTE TO REMOVE STAFF ASSIGNED
router.delete(
  "/staff-assignment/remove-staff",
  authenticateToken,
  authorizeAdmin,
  removeStaffFromWarehouse
);

//ROUTE TO TERMINATE STAFF ASSIGNED
router.delete(
  "/staff-assignment/terminate-staff",
  authenticateToken,
  authorizeAdmin,
  terminateStaff
);

//ROUTE TO DELETE A STAFF ASSIGNMENT
router.delete(
  "/staff-assignments/:id",
  authenticateToken,
  authorizeAdmin,
  deleteStaffAssignment
);

export default router;
