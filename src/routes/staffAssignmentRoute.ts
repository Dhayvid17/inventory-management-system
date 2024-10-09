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

//Initialize Router
const router: Router = express.Router();

//ROUTE TO GET ALL STAFF ASSIGNMENTS
router.get("/staff-assignments", getStaffAssignments);

//ROUTE TO GET A SINGLE STAFF ASSIGNMENT
router.get("/staff-assignments/:id", getStaffAssignment);

//ROUTE TO CREATE A STAFF ASSIGNMENT
router.post("/staff-assignments", createStaffAssignment);

//ROUTE TO RE-ASSIGN A STAFF TO NEW WAREHOUSE
router.put("/staff-assignments/:id", reassignStaffToNewWarehouse);

//ROUTE TO REMOVE STAFF ASSIGNED
router.delete("/staff-assignment/remove-staff", removeStaffFromWarehouse);

//ROUTE TO TERMINATE STAFF ASSIGNED
router.delete("/staff-assignment/terminate-staff", terminateStaff);

//ROUTE TO DELETE A STAFF ASSIGNMENT
router.delete("/staff-assignments/:id", deleteStaffAssignment);

export default router;
