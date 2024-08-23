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
  "/users",
  validateUser,
  authenticateToken,
  authorizeAdmin,
  createUser
);

//UPDATE A USER
router.put("/users/:id", authenticateToken, authorizeAdmin, updateUser);

//DELETE A USER
router.delete("/users/:id", authenticateToken, authorizeAdmin, deleteUser);

//ROUTE TO REGISTER USER
router.post("/users/register", registerUser);

//ROUTE TO LOGIN USER
router.post("/users/login", loginUser);
export default router;
