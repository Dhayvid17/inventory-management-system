import express, { Request, Response } from "express";
import User, { IUser } from "../models/userModel";
import mongoose from "mongoose";

//GET ALL USERS
const getUsers = async (
  req: ReadableStreamBYOBRequest,
  res: Response
): Promise<void> => {
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
  const { username, email, password, role, createdAt, updatedAt } = req.body;

  if (!username || !email || !password || !role || !createdAt || !updatedAt) {
    return res.status(404).json({ error: "Please fill all fields" });
  }

  try {
    const newUser: IUser = new User({
      username,
      email,
      password,
      role,
      createdAt,
      updatedAt,
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
  const { username, email, password, role, createdAt, updatedAt } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const updatedUser: IUser | null = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, password, role, createdAt, updatedAt },
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

export { getUsers, getUser, createUser, updateUser, deleteUser };
