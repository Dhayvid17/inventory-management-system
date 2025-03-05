import express, { Router } from "express";
import {
  getAllSupportTickets,
  getSingleSupportTicket,
  createSupportTicket,
  deleteSupportTicket,
  updateSupportTicket,
} from "../controllers/supportTicketController";
import { authenticateToken } from "../middlewares/authentication";

//Initialize Router
const router: Router = express.Router();

//ROUTE TO GET ALL SUPPORT TICKETS
router.get("/support-tickets", authenticateToken, getAllSupportTickets);

//ROUTES TO GET A SINGLE SUPPORT TICKET
router.get("/support-ticket/:id", authenticateToken, getSingleSupportTicket);

//ROUTE TO CREATE SUPPORT TICKET
router.post("/create-ticket", authenticateToken, createSupportTicket);

//ROUTE TO UPDATE A SUPPORT TICKET
router.put("/support-ticket/:id", authenticateToken, updateSupportTicket);

//ROUTE TO DELETE A SUPPORT TICKET
router.delete("/support-ticket/:id", authenticateToken, deleteSupportTicket);

export default router;
