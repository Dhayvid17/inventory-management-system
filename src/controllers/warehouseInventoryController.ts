import express, { NextFunction, Request, Response } from "express";
import getWarehouseStockSummary from "../services/warehouseInventoryDetails";
import mongoose, { Schema } from "mongoose";
import Warehouse from "../models/warehouseModel";

//LOGIC TO GET STOCK SUMMARY OF A WAREHOUSE INCLUDING INTER-WAREHOUSE TRANSFERS
const getWarehouseStockSummaryController = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  try {
    const { warehouseId } = req.params;
    const { startDate, endDate } = req.body;

    //Ensure that the warehouseId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(warehouseId)) {
      return res.status(400).json({ error: "Invalid warehouse ID" });
    }

    //Ensure that the warehouseId exists
    const warehouseExists = await Warehouse.findById(warehouseId);
    if (!warehouseExists) {
      return res.status(404).json({ error: "Warehouse not found" });
    }

    //Ensure that the startDate and endDate are valid dates
    const parsedStartDate = new Date(startDate as string);
    const parsedEndDate = new Date(endDate as string);

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    //Fetch stock summary
    const stockSummary = await getWarehouseStockSummary(
      new mongoose.Types.ObjectId(warehouseId),
      parsedStartDate,
      parsedEndDate
    );
    if (!stockSummary) {
      return res.status(404).json({ error: "No stock summary found" });
    }

    return res.status(200).json(stockSummary);
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to get Warehouse stock summary",
      details: error.message,
    });
  }
};

export default getWarehouseStockSummaryController;
