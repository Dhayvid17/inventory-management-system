import express, { Request, Response } from "express";
import User, { IUser } from "../models/userModel";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";
import { config } from "dotenv";
import { Secret } from "jsonwebtoken";

config();
const jwtSecret = process.env.JWT_SECRET as Secret;

//GET ALL USERS
const getUsers = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  try {
    const users: IUser[] = await User.find();
    console.log("Fetched users");
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ error: "Could not fetch users" });
  }
};

//GET ALL USERS WITH STAFF ROLE OR ADMIN ROLE
const fetchAdminStaffRole = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  try {
    const users: IUser[] = await User.find({
      role: { $in: ["admin", "staff"] },
    });
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ error: "Could not fetch users" });
  }
};

//GET A SINGLE USER
const getUser = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid user" });
  }

  try {
    const user: IUser | null = await User.findById(req.params.id);
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: "Could not fetch user" });
  }
};

//UPDATE A USER
const updateUser = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { username, password, role } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const updatedUser: IUser | null = await User.findByIdAndUpdate(
      req.params.id,
      { username, password: await bcrypt.hash(password, 10), role },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "Could not update User" });
    }
    return res.status(200).json(updatedUser);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update User" });
  }
};

//DELETE A USER
const deleteUser = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const deletedUser: IUser | null = await User.findByIdAndDelete(
      req.params.id
    );

    if (!deletedUser) {
      return res.status(400).json({ error: "Could not delete User" });
    }
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update User" });
  }
};

//REGISTER A USER
const registerUser = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  const { username, password, role } = req.body;

  //Validate fields
  if (!username || !password) {
    return res.status(400).json({ error: "All fields must be filled" });
  }

  //Default role to 'user' for unauthenticated users
  let userRole = "user";

  //Check if the user is logged in and has a role
  if ((req as any).user && (req as any).user.role === "admin") {
    if (role && ["staff", "admin"].includes(role)) {
      userRole = role; // Allow admins to set higher roles
    }
  } else if (role) {
    //If a non-admin attempts to assign a role, return an error
    return res
      .status(403)
      .json({ error: "Only admins can assign staff or admin roles" });
  }

  if (!validator.isStrongPassword(password)) {
    return res.status(404).json({
      error:
        "Oops! Password must include at least one uppercase letter, one lowercase letter, and one special character. Try again!",
    });
  }

  try {
    //Check if the username already exist
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(404).json({ error: "Username already exist" });
    }
    //Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    //Create a new user
    const newUser = new User({
      username,
      password: hashedPassword,
      role: userRole,
    });
    await newUser.save();

    console.log({ message: "User registered successfully" });
    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Failed to register User:", error);
    return res.status(500).json({ error: "Could not registered User" });
  }
};

//LOGIN A USER
const loginUser = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  const { username, password } = req.body;

  //Validate username and password
  if (!username || !password) {
    return res.status(404).json({ error: "All fields must be filled" });
  }

  try {
    //Find the User by Username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    //Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(404).json({ error: "Invalid password" });
    }

    //Create a token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: "24hr" }
    );
    console.log({ message: "User logged in successfully" });
    return res.status(200).json({ username, token });
  } catch (error) {
    console.error("Internal server error", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export {
  getUsers,
  fetchAdminStaffRole,
  getUser,
  updateUser,
  deleteUser,
  registerUser,
  loginUser,
};
