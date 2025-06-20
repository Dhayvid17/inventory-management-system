import express, { Router } from "express";
import generateBalanceSheet from "../controllers/balanceSheetController";
import {
  authenticateToken,
  authorizeAdmin,
} from "../middlewares/authentication";

//Initialize Router
const router: Router = express.Router();

//ROUTES FOR BALANCE SHEET
router.get(
  "/analytics/balance-sheet",
  authenticateToken,
  authorizeAdmin,
  generateBalanceSheet
);

export default router;
