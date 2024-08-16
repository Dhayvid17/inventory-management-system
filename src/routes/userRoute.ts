import express, { Router } from "express";
import {
  createUser,
  deleteUser,
  getUsers,
  getUser,
  updateUser,
} from "../controllers/userController";

//Initialize Router
const router: Router = express.Router();

//ROUTES FOR USERS

//GET ALL USERS
router.get("/users", getUsers);

//GET A SINGLE USER
router.get("/users/:id", getUser);

//CREATE A NEW USER
router.post("/users", createUser);

//UPDATE A USER
router.put("/users/:id", updateUser);

//DELETE A USER
router.delete("/users/:id", deleteUser);

export default router;
