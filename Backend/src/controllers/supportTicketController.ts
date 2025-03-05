import express, { Request, Response } from "express";
import SupportTicket, { ISupportTicket } from "../models/supportTicketModel";
import mongoose from "mongoose";
import { IUser } from "../models/userModel";

//GET ALL SUPPORT TICKETS
const getAllSupportTickets = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  try {
    //Check if tickets are valid
    const tickets: ISupportTicket[] = await SupportTicket.find().populate(
      "createdBy",
      "username"
    );
    if (!tickets) {
      return res.status(404).json("Tickets not found");
    }

    return res.status(200).json(tickets);
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to fetch support tickets",
      details: error.message,
    });
  }
};

//GET A SINGLE SUPPORT TICKET
const getSingleSupportTicket = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }
  try {
    //Check if ticket is valid
    const ticket: ISupportTicket | null = await SupportTicket.findById(
      req.params.id
    ).populate("createdBy", "username");

    if (!ticket) {
      return res.status(404).json({ error: "Support ticket not found" });
    }

    return res.status(200).json(ticket);
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to fetch support ticket",
      details: error.message,
    });
  }
};

//CREATE A SUPPORT TICKET
const createSupportTicket = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { title, description, priority } = req.body;
  const userId = (req as any).user.id; // Automatically populate the user field.

  try {
    const newTicket: ISupportTicket = new SupportTicket({
      createdBy: userId,
      title,
      description,
      priority,
    });
    if (!newTicket) {
      return res.status(400).json({ error: "Failed to create support ticket" });
    }

    await newTicket.save();
    return res.status(201).json(newTicket);
  } catch (error: any) {
    return res.status(500).json({
      error: "Could not create new support ticket",
      details: error.message,
    });
  }
};

//UPDATE A SUPPORT TICKET
const updateSupportTicket = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const updatedTicket: ISupportTicket | null =
      await SupportTicket.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

    if (!updatedTicket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    return res
      .status(200)
      .json({ message: "Ticket updated successfully", ticket: updatedTicket });
  } catch (error: any) {
    console.error("Error updating support ticket", error);
    return res.status(500).json({
      error: "Failed to update support ticket",
      details: error.message,
    });
  }
};

//DELETE A SUPPORT TICKET
const deleteSupportTicket = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  //Check if Support Ticket exists
  const supportTicketExists = await SupportTicket.findById(req.params.id);
  if (!supportTicketExists) {
    return res.status(400).json({ error: "Support Ticket does not exists." });
  }
  try {
    //Check if support ticket is valid
    const deletedTicket: ISupportTicket | null =
      await SupportTicket.findByIdAndDelete(req.params.id);
    if (!deletedTicket) {
      return res.status(404).json({ error: "Support ticket not found" });
    }

    return res.status(200).json({ message: "Support ticket deleted" });
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to delete Support Ticket",
      details: error.message,
    });
  }
};

export {
  getAllSupportTickets,
  getSingleSupportTicket,
  createSupportTicket,
  updateSupportTicket,
  deleteSupportTicket,
};
