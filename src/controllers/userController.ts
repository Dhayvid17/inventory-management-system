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
const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users: IUser[] = await User.find();
    console.log("Fetched users");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch users" });
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
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch user" });
  }
};

//CREATE NEW USER
const createUser = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(404).json({ error: "Please fill all fields" });
  }

  try {
    const newUser: IUser = new User({
      username,
      password,
      role,
    });
    await newUser.save();
    console.log("User created...");
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: "Could not add new transaction" });
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
      { username, password, role },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ error: "Could not update User" });
    }
    res.status(201).json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to update User" });
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
    res.status(201).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update User" });
  }
};

//REGISTER A USER
const registerUser = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  const { username, password, role } = req.body;
  console.log("Request body:", req.body);

  //Validate username and password
  if (!username || !password || !role) {
    return res.status(404).json({ error: "All fields must be filled" });
  }

  //Validate the role
  if (!["user", "staff", "admin"].includes(role)) {
    return res.status(400).json({ error: "Invalid role specified" });
  }

  if (!validator.isStrongPassword(password)) {
    return res.status(404).json({ error: "Password is not strong enough" });
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
    const newUser = new User({ username, password: hashedPassword, role });
    await newUser.save();

    console.log({ message: "User registered successfully" });
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Failed to register User:", error);
    res.status(500).json({ error: "Could not registered User" });
  }
};

//LOGIN A USER
const loginUser = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  const { username, password, role } = req.body;

  // Validate username and password
  if (!username || !password || !role) {
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
      { id: user._id, username: user.username },
      jwtSecret,
      { expiresIn: "1hr" }
    );
    console.log({ message: "User logged in successfully" });
    res.status(200).json({ token });
  } catch (error) {
    console.error("Internal server error", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  registerUser,
  loginUser,
};
