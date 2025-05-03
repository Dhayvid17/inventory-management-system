import { Request, Response } from "express";
import mongoose from "mongoose";
import Warehouse from "../models/warehouseModel";
import InventoryTransaction from "../models/inventoryTransactionModel";
import Product from "../models/productModel";

//AuthRequest interface
interface AuthRequest extends Request {
  user?: {
    role?: string;
    id?: string;
  };
}

interface BalanceSheetFilters {
  warehouseId?: mongoose.Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
}

//GENERATE BALANCE SHEET LOGIC
const generateBalanceSheet = async (
  req: AuthRequest,
  res: Response
): Promise<Response | undefined> => {
  try {
    //Check If its Admin at the start
    const userRole = req.user?.role;

    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can access balance sheet information",
      });
    }

    //Get Query Parameters for Filtering
    const { warehouseId, timeRange, customStartDate, customEndDate } =
      req.query;

    //Build date range filter
    const dateFilter: BalanceSheetFilters = {};
    const now = new Date();
    let startDate: Date | undefined;
    let endDate = now;

    //Calculate date range based on timeRange
    switch (timeRange) {
      case "day":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "custom":
        if (customStartDate) {
          startDate = new Date(customStartDate as string);
        }
        if (customEndDate) {
          endDate = new Date(customEndDate as string);
        }
        break;
      case "all":
      default:
        //For 'all time', don't set startDate filter
        break;
    }

    if (startDate) {
      dateFilter.startDate = startDate;
    }
    dateFilter.endDate = endDate;

    // Validate date parameters if provided
    if (customStartDate || customEndDate) {
      try {
        if (customStartDate) {
          const testStartDate = new Date(customStartDate as string);
          if (isNaN(testStartDate.getTime())) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid start date format. Please use YYYY-MM-DD format.",
            });
          }
        }

        if (customEndDate) {
          const testEndDate = new Date(customEndDate as string);
          if (isNaN(testEndDate.getTime())) {
            return res.status(400).json({
              success: false,
              message: "Invalid end date format. Please use YYYY-MM-DD format.",
            });
          }
        }

        // Additional validation: ensure start date is before end date
        if (customStartDate && customEndDate) {
          const startDate = new Date(customStartDate as string);
          const endDate = new Date(customEndDate as string);
          if (startDate > endDate) {
            return res.status(400).json({
              success: false,
              message: "Start date must be before end date.",
            });
          }
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Please use YYYY-MM-DD format.",
        });
      }
    }

    //Build warehouse filter
    if (warehouseId) {
      dateFilter.warehouseId = new mongoose.Types.ObjectId(
        warehouseId as string
      );
    }

    //Get warehouse data
    let warehouseData;
    if (warehouseId) {
      warehouseData = await Warehouse.findById(warehouseId).lean();
      if (!warehouseData) {
        return res.status(404).json({ error: "Warehouse not found" });
      }
    } else {
      warehouseData = await Warehouse.find().lean();
    }

    //Get transactions based on filters
    const transactionFilter: any = {};

    if (dateFilter.startDate && dateFilter.endDate) {
      transactionFilter.transactionDate = {
        $gte: dateFilter.startDate,
        $lte: dateFilter.endDate,
      };
    } else if (dateFilter.startDate) {
      transactionFilter.transactionDate = { $gte: dateFilter.startDate };
    } else if (dateFilter.endDate) {
      transactionFilter.transactionDate = { $lte: dateFilter.endDate };
    }

    if (warehouseId) {
      transactionFilter.$or = [
        { warehouseId: warehouseId },
        { fromWarehouseId: warehouseId },
        { toWarehouseId: warehouseId },
      ];
    }

    const transactions = await InventoryTransaction.find(transactionFilter)
      .sort({ transactionDate: -1 })
      .populate("products.productId", "name price")
      .lean();

    //Calculate summary metrics
    const summary = calculateBalanceSheetSummary(
      transactions,
      warehouseData,
      dateFilter
    );

    //Return balance sheet data
    return res.status(200).json({
      timeRange,
      dateRange: {
        start: dateFilter.startDate,
        end: dateFilter.endDate,
      },
      warehouseInfo: warehouseId ? warehouseData : { name: "All Warehouses" },
      summary,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to generate balance sheet",
      details: error.message,
    });
  }
};

//Helper function to calculate balance sheet summary
function calculateBalanceSheetSummary(
  transactions: any[],
  warehouseData: any,
  dateFilter: BalanceSheetFilters
) {
  //Initialize summary object
  const summary = {
    startingInventoryValue: 0,
    endingInventoryValue: 0,
    totalInflow: 0,
    totalOutflow: 0,
    productMovement: {} as Record<
      string,
      {
        productId: string;
        name: string;
        startQty: number;
        endQty: number;
        totalInflow: number;
        totalOutflow: number;
        currentValue: number;
      }
    >,
  };

  //For single warehouse, use its current value as ending value
  if (!Array.isArray(warehouseData)) {
    summary.endingInventoryValue = warehouseData.totalValue || 0;

    // Track each product in the warehouse
    if (warehouseData.products && warehouseData.products.length > 0) {
      warehouseData.products.forEach((product: any) => {
        summary.productMovement[product.productId.toString()] = {
          productId: product.productId.toString(),
          name: product.name,
          startQty: 0, // We'll calculate this
          endQty: product.quantity,
          totalInflow: 0,
          totalOutflow: 0,
          currentValue: product.quantity * product.price,
        };
      });
    }
  } else {
    //For multiple warehouses, sum up all values
    warehouseData.forEach((warehouse: any) => {
      summary.endingInventoryValue += warehouse.totalValue || 0;

      //Track each product across all warehouses
      if (warehouse.products && warehouse.products.length > 0) {
        warehouse.products.forEach((product: any) => {
          const productId = product.productId.toString();

          if (!summary.productMovement[productId]) {
            summary.productMovement[productId] = {
              productId,
              name: product.name,
              startQty: 0,
              endQty: product.quantity,
              totalInflow: 0,
              totalOutflow: 0,
              currentValue: product.quantity * product.price,
            };
          } else {
            summary.productMovement[productId].endQty += product.quantity;
            summary.productMovement[productId].currentValue +=
              product.quantity * product.price;
          }
        });
      }
    });
  }

  //Process each transaction to calculate movement
  transactions.forEach((transaction) => {
    //Skip transactions without products
    if (!transaction.products || !transaction.products.length) return;

    //Process each product in the transaction
    transaction.products.forEach((productEntry: any) => {
      const productId = productEntry.productId._id || productEntry.productId;
      const productIdStr = productId.toString();
      const productName =
        productEntry.name ||
        (productEntry.productId.name
          ? productEntry.productId.name
          : "Unknown Product");
      const quantity = productEntry.quantity || 0;
      const price =
        productEntry.price ||
        (productEntry.productId.price ? productEntry.productId.price : 0);

      //Initialize product tracking if not exists
      if (!summary.productMovement[productIdStr]) {
        summary.productMovement[productIdStr] = {
          productId: productIdStr,
          name: productName,
          startQty: 0,
          endQty: 0,
          totalInflow: 0,
          totalOutflow: 0,
          currentValue: 0,
        };
      }

      //Update product movement based on transaction type
      switch (transaction.transactionType) {
        case "Restock Transaction":
        case "Customer Return":
          summary.totalInflow += quantity * price;
          summary.productMovement[productIdStr].totalInflow += quantity;
          break;

        case "Sales Transaction":
        case "Online Order":
        case "Damaged Product":
        case "Supplier Return":
          summary.totalOutflow += quantity * price;
          summary.productMovement[productIdStr].totalOutflow += quantity;
          break;

        case "Inter-Warehouse Transfer":
          //For the source warehouse it's an outflow only if 'In Transit'
          //For the target warehouse it's an inflow only if 'Completed'
          const warehouseIdStr = dateFilter.warehouseId?.toString();
          const transferStatus = transaction.interWarehouseTransferStatus;

          if (warehouseIdStr) {
            //Only count as outflow from source warehouse if status is 'In Transit'
            if (
              transaction.fromWarehouseId?.toString() === warehouseIdStr &&
              transferStatus === "In Transit"
            ) {
              summary.totalOutflow += quantity * price;
              summary.productMovement[productIdStr].totalOutflow += quantity;
            }

            //Only count as inflow to target warehouse if status is 'Completed'
            if (
              transaction.toWarehouseId?.toString() === warehouseIdStr &&
              transferStatus === "Completed"
            ) {
              summary.totalInflow += quantity * price;
              summary.productMovement[productIdStr].totalInflow += quantity;
            }
          } else {
            //For "all warehouses" view, we don't count inter-warehouse transfers
            //as they're just internal movements (no net change in total inventory)
          }
          break;

        case "Addition/Removal of Product From Warehouse":
          if (transaction.action === "Add Product To Warehouse") {
            summary.totalInflow += quantity * price;
            summary.productMovement[productIdStr].totalInflow += quantity;
          } else {
            summary.totalOutflow += quantity * price;
            summary.productMovement[productIdStr].totalOutflow += quantity;
          }
          break;
      }
    });
  });

  //Calculate starting inventory values based on ending - inflow + outflow
  summary.startingInventoryValue =
    summary.endingInventoryValue - summary.totalInflow + summary.totalOutflow;

  //Calculate starting quantities for each product
  Object.keys(summary.productMovement).forEach((productId) => {
    const product = summary.productMovement[productId];
    product.startQty =
      product.endQty - product.totalInflow + product.totalOutflow;
  });

  return summary;
}

export default generateBalanceSheet;
