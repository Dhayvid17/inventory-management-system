import express, { Router } from "express";
import {
  deleteUser,
  getUsers,
  getUser,
  updateUser,
  registerUser,
  loginUser,
  fetchAdminStaffRole,
} from "../controllers/userController";
import validateUser from "../validator/validator";
import {
  authenticateToken,
  authorizeAdmin,
  authorizeStaff,
} from "../middlewares/authentication";

//Initialize Router
const router: Router = express.Router();

//ROUTES FOR USERS

//GET ALL USERS
router.get("/users", getUsers);

//GET ALL STAFF/ADMIN USERS
router.get("/users/staff-admin", fetchAdminStaffRole);

//GET A SINGLE USER
router.get("/users/:id", authenticateToken, authorizeAdmin, getUser);

//UPDATE A USER
router.put(
  "/users/:id",
  validateUser,
  authenticateToken,
  authorizeAdmin,
  updateUser
);

//DELETE A USER
router.delete("/users/:id", authenticateToken, authorizeAdmin, deleteUser);

//ROUTE TO REGISTER USER
router.post(
  "/users/register/user",
  validateUser,
  authenticateToken,
  registerUser
);

//ROUTE TO REGISTER ADMIN
router.post(
  "/users/register/admin",
  validateUser,
  authorizeAdmin,
  registerUser
);

//ROUTE TO LOGIN USER
router.post("/users/login", loginUser);
export default router;
