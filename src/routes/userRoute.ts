import express, { Router } from "express";
import {
  createUser,
  deleteUser,
  getUsers,
  getUser,
  updateUser,
  registerUser,
  loginUser,
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
router.get("/users", authenticateToken, authorizeAdmin, getUsers);

//GET A SINGLE USER
router.get("/users/:id", authenticateToken, authorizeAdmin, getUser);

//CREATE A NEW USER
router.post(
  "/users/register/user-staff-admin",
  validateUser,
  authenticateToken,
  authorizeAdmin,
  createUser
);

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
router.post("/users/register/user", validateUser, registerUser);

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
