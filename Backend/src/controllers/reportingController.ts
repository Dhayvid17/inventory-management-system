import mongoose from "mongoose";
import { Request, Response } from "express";
import InventoryTransaction from "../models/inventoryTransactionModel";
import Product from "../models/productModel";
import Warehouse from "../models/warehouseModel";

interface AuthRequest extends Request {
  user?: any;
}

//Helper function to get staff's managed warehouses
const getStaffWarehouses = async (userId: string) => {
  const warehouses = await Warehouse.find({
    managedBy: userId,
  }).select("_id");
  return warehouses.map((w) => w._id);
};

//GET INVENTORY STATUS ACROSS ALL WAREHOUSES
const getInventoryStatus = async (
  req: AuthRequest,
  res: Response
): Promise<Response | undefined> => {
  try {
    //Get query parameters for filtering 
    const { warehouseId, categoryId, startDate, endDate, page, limit } =
      req.query;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    //Parse pagination parameters
    const pageNumber = parseInt(page as string, 15) || 1; //Default to page 1
    const pageSize = parseInt(limit as string, 15) || 15; //Default to 15 items per page

    //Build match conditions
    const matchConditions: any = {};

    //Role-based warehouse filtering
    if (userRole === "staff") {
      const managedWarehouses = await getStaffWarehouses(userId);
      if (warehouseId) {
        //Check if staff manages this warehouse
        if (
          !managedWarehouses
            .map((id) => id.toString())
            .includes(warehouseId as string)
        ) {
          return res.status(403).json({
            success: false,
            message: "You don't have access to this warehouse",
          });
        }
        matchConditions.warehouse = new mongoose.Types.ObjectId(
          warehouseId as string
        );
      } else {
        //If no specific warehouse, limit to all managed warehouses
        matchConditions.warehouse = { $in: managedWarehouses };
      }
    } else if (warehouseId) {
      //Admin can access any warehouse
      matchConditions.warehouse = new mongoose.Types.ObjectId(
        warehouseId as string
      );
    }

    if (categoryId) {
      matchConditions.category = new mongoose.Types.ObjectId(
        categoryId as string
      );
    }

    //Fetch products with warehouse information
    const products = await Product.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "warehouses",
          localField: "warehouse",
          foreignField: "_id",
          as: "warehouseInfo",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $lookup: {
          from: "suppliers",
          localField: "supplier",
          foreignField: "_id",
          as: "supplierInfo",
        },
      },
      {
        $project: {
          name: 1,
          price: 1,
          quantity: 1,
          warehouseName: { $arrayElemAt: ["$warehouseInfo.name", 0] },
          categoryName: { $arrayElemAt: ["$categoryInfo.name", 0] },
          supplierName: { $arrayElemAt: ["$supplierInfo.name", 0] },
          totalValue: { $multiply: ["$price", "$quantity"] },
        },
      },
      { $sort: { quantity: 1 } }, // Sort by quantity in ascending order
      { $skip: (pageNumber - 1) * pageSize }, // Skip documents for previous pages
      { $limit: pageSize }, // Limit the number of documents returned
    ]);

    res.status(200).json({
      success: true,
      count: products.length, // Count of products returned
      page: pageNumber, // Add current page to the response
      limit: pageSize, // Add page size to the response
      data: products,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: "Could not fetched products with warehouse Informations",
      details: error.message,
    });
  }
};

//GET INVENTORY MOVEMENT DATA
const getInventoryMovement = async (
  req: AuthRequest,
  res: Response
): Promise<Response | undefined> => {
  try {
    //Get query parameters for filtering
    const {
      startDate,
      endDate,
      warehouseId,
      productId,
      transactionType,
      page,
      limit,
    } = req.query;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    //Parse pagination parameters
    const pageNumber = parseInt(page as string, 15) || 1; //Default to page 1
    const pageSize = parseInt(limit as string, 15) || 15; //Default to 15 items per page

    //Build match conditions
    const matchConditions: any = {};

    if (startDate && endDate) {
      matchConditions.transactionDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    //Role-based warehouse filtering
    if (userRole === "staff") {
      const managedWarehouses = await getStaffWarehouses(userId);
      if (warehouseId) {
        if (
          !managedWarehouses
            .map((id) => id.toString())
            .includes(warehouseId as string)
        ) {
          return res.status(403).json({
            success: false,
            message: "You don't have access to this warehouse",
          });
        }
      }
      matchConditions.$or = [
        { warehouseId: { $in: managedWarehouses } },
        { fromWarehouseId: { $in: managedWarehouses } },
        { toWarehouseId: { $in: managedWarehouses } },
      ];
    }

    if (transactionType) {
      matchConditions.transactionType = transactionType;
    }

    if (productId) {
      matchConditions["products.productId"] = new mongoose.Types.ObjectId(
        productId as string
      );
    }

    //Fetch Transactions with Warehouse information
    const transactions = await InventoryTransaction.aggregate([
      { $match: matchConditions },
      { $sort: { transactionDate: -1 } },
      {
        $lookup: {
          from: "warehouses",
          localField: "warehouseId",
          foreignField: "_id",
          as: "warehouseInfo",
        },
      },
      {
        $lookup: {
          from: "warehouses",
          localField: "fromWarehouseId",
          foreignField: "_id",
          as: "fromWarehouseInfo",
        },
      },
      {
        $lookup: {
          from: "warehouses",
          localField: "toWarehouseId",
          foreignField: "_id",
          as: "toWarehouseInfo",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "staffId",
          foreignField: "_id",
          as: "staffInfo",
        },
      },
      {
        $project: {
          transactionType: 1,
          action: 1,
          products: 1,
          totalValue: 1,
          transactionDate: 1,
          interWarehouseTransferStatus: 1,
          warehouseName: { $arrayElemAt: ["$warehouseInfo.name", 0] },
          fromWarehouseName: { $arrayElemAt: ["$fromWarehouseInfo.name", 0] },
          toWarehouseName: { $arrayElemAt: ["$toWarehouseInfo.name", 0] },
          staffName: { $arrayElemAt: ["$staffInfo.username", 0] },
        },
      },
      { $sort: { transactionDate: -1 } }, // Sort by transaction date in descending order
      { $skip: (pageNumber - 1) * pageSize }, // Skip documents for previous pages
      { $limit: pageSize }, // Limit the number of documents returned
    ]);

    res.status(200).json({
      success: true,
      count: transactions.length,
      page: pageNumber, // Add current page to the response
      limit: pageSize, // Add page size to the response
      data: transactions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: "Could not fetched transactions with warehouse Informations",
      details: error.message,
    });
  }
};

//GET INVENTORY AGING REPORT
const getInventoryAging = async (
  req: AuthRequest,
  res: Response
): Promise<Response | undefined> => {
  try {
    //Get the info from Request Query
    const { warehouseId } = req.query;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    //Build match conditions for warehouse filtering
    const matchConditions: any = {};
    if (userRole === "staff") {
      const managedWarehouses = await getStaffWarehouses(userId);
      if (warehouseId) {
        if (
          !managedWarehouses
            .map((id) => id.toString())
            .includes(warehouseId as string)
        ) {
          return res.status(403).json({
            success: false,
            message: "You don't have access to this warehouse",
          });
        }
        matchConditions.warehouseId = new mongoose.Types.ObjectId(
          warehouseId as string
        );
      } else {
        matchConditions.warehouseId = { $in: managedWarehouses };
      }
    } else if (warehouseId) {
      matchConditions.warehouseId = new mongoose.Types.ObjectId(
        warehouseId as string
      );
    }

    //First, get the latest transaction date for each product
    const latestTransactions = await InventoryTransaction.aggregate([
      { $match: matchConditions },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          latestTransaction: { $max: "$transactionDate" },
          productName: { $first: "$products.name" },
        },
      },
      {
        $lookup: {
          from: "products", // The name of the products collection
          localField: "_id", // Match the productId with the _id in the products collection
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $unwind: {
          path: "$productInfo",
          preserveNullAndEmptyArrays: true, // Handle cases where product is not found
        },
      },
      {
        $project: {
          _id: 1,
          latestTransaction: 1,
          productName: "$productInfo.name", // Get the product name from the lookup
        },
      },
    ]);

    //Calculate the age of each product in days
    const currentDate = new Date();
    const agingReport = latestTransactions.map((item) => {
      const ageInMilliseconds =
        currentDate.getTime() - new Date(item.latestTransaction).getTime();
      const ageInDays = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24));

      return {
        productId: item._id,
        productName: item.productName,
        lastMovementDate: item.latestTransaction,
        ageInDays: ageInDays,
        ageCategory:
          ageInDays < 30
            ? "Fresh (< 30 days)"
            : ageInDays < 60
            ? "Normal (30-60 days)"
            : ageInDays < 90
            ? "Aging (60-90 days)"
            : "Old (> 90 days)",
      };
    });

    res.status(200).json({
      success: true,
      count: agingReport.length,
      data: agingReport,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: "Error calculating inventory aging report",
      details: error.message,
    });
  }
};

//GET TRANSFER EFFICIENCY METRICS
const getTransferEfficiency = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    //Get parameters from request query
    const { startDate, endDate } = req.query;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    //Build match conditions for warehouse filtering
    const matchConditions: any = {
      transactionType: "Inter-Warehouse Transfer",
    };

    if (userRole === "staff") {
      const managedWarehouses = await getStaffWarehouses(userId);
      matchConditions.$or = [
        { fromWarehouseId: { $in: managedWarehouses } },
        { toWarehouseId: { $in: managedWarehouses } },
      ];
    }

    if (startDate && endDate) {
      matchConditions.transactionDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    //Fetch transfer transactions with warehouse information
    const transfers = await InventoryTransaction.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "warehouses",
          localField: "fromWarehouseId",
          foreignField: "_id",
          as: "fromWarehouse",
        },
      },
      {
        $lookup: {
          from: "warehouses",
          localField: "toWarehouseId",
          foreignField: "_id",
          as: "toWarehouse",
        },
      },
      {
        $project: {
          fromWarehouseName: { $arrayElemAt: ["$fromWarehouse.name", 0] },
          toWarehouseName: { $arrayElemAt: ["$toWarehouse.name", 0] },
          status: "$interWarehouseTransferStatus",
          transactionDate: 1,
          products: 1,
          totalValue: 1,
        },
      },
    ]);

    //Calculate aggregate metrics
    const totalTransfers = transfers.length;
    const completedTransfers = transfers.filter(
      (t) => t.status === "Completed"
    ).length;
    const failedTransfers = transfers.filter((t) =>
      ["Declined", "Failed Transfer Request", "Cancelled"].includes(t.status)
    ).length;
    const pendingTransfers = transfers.filter((t) =>
      ["Pending", "In Transit", "Approved"].includes(t.status)
    ).length;

    const warehousePairMetrics: Record<string, any> = {};

    transfers.forEach((transfer) => {
      const pairKey = `${transfer.fromWarehouseName} → ${transfer.toWarehouseName}`;

      if (!warehousePairMetrics[pairKey]) {
        warehousePairMetrics[pairKey] = {
          fromWarehouse: transfer.fromWarehouseName,
          toWarehouse: transfer.toWarehouseName,
          totalTransfers: 0,
          completedTransfers: 0,
          failedTransfers: 0,
          pendingTransfers: 0,
          totalValue: 0,
        };
      }

      warehousePairMetrics[pairKey].totalTransfers++;

      if (transfer.status === "Completed") {
        warehousePairMetrics[pairKey].completedTransfers++;
      } else if (
        ["Declined", "Failed Transfer Request", "Cancelled"].includes(
          transfer.status
        )
      ) {
        warehousePairMetrics[pairKey].failedTransfers++;
      } else {
        warehousePairMetrics[pairKey].pendingTransfers++;
      }

      warehousePairMetrics[pairKey].totalValue += transfer.totalValue;
    });

    //Convert the object to an array
    const warehousePairs = Object.values(warehousePairMetrics).map((pair) => ({
      ...pair,
      successRate:
        pair.totalTransfers > 0
          ? ((pair.completedTransfers / pair.totalTransfers) * 100).toFixed(2) +
            "%"
          : "0%",
    }));

    res.status(200).json({
      success: true,
      summary: {
        totalTransfers,
        completedTransfers,
        failedTransfers,
        pendingTransfers,
        successRate:
          totalTransfers > 0
            ? ((completedTransfers / totalTransfers) * 100).toFixed(2) + "%"
            : "0%",
      },
      warehousePairs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: "Error calculating transfer efficiency metrics",
      details: error.message,
    });
  }
};

//GET LOW STOCK ALERTS
const getLowStockAlerts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    //Get query parameters for filtering
    const userRole = req.user?.role;
    const userId = req.user?.id;

    //For this example, we'll consider anything under 10 units as "low stock"
    const lowStockThreshold = 10;

    //Build match conditions for warehouse filtering
    let matchConditions: any = {
      quantity: { $lt: lowStockThreshold },
    };
    if (userRole === "staff") {
      const managedWarehouses = await getStaffWarehouses(userId);
      matchConditions.warehouse = { $in: managedWarehouses };
    }

    //Fetch products with warehouse information to get low stock items
    const products = await Product.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "warehouses",
          localField: "warehouse",
          foreignField: "_id",
          as: "warehouseInfo",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $lookup: {
          from: "suppliers",
          localField: "supplier",
          foreignField: "_id",
          as: "supplierInfo",
        },
      },
      {
        $project: {
          name: 1,
          price: 1,
          quantity: 1,
          warehouseName: { $arrayElemAt: ["$warehouseInfo.name", 0] },
          categoryName: { $arrayElemAt: ["$categoryInfo.name", 0] },
          supplierName: { $arrayElemAt: ["$supplierInfo.name", 0] },
          stockStatus: {
            $cond: {
              if: { $eq: ["$quantity", 0] },
              then: "Out of Stock",
              else: "Low Stock",
            },
          },
        },
      },
      { $sort: { quantity: 1 } },
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: "Error fetching low stock alerts",
      details: error.message,
    });
  }
};

//GET DASHBOARD SUMMARY
const getDashboardSummary = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;

    let warehouseFilter = {};
    if (userRole === "staff") {
      const managedWarehouses = await getStaffWarehouses(userId);
      warehouseFilter = { _id: { $in: managedWarehouses } };
    }

    //Count of warehouses
    const warehouseCount = await Warehouse.countDocuments(warehouseFilter);

    //Total inventory value across all warehouses
    const warehouseTotals = await Warehouse.aggregate([
      { $match: warehouseFilter },
      {
        $group: {
          _id: null,
          totalValue: { $sum: "$totalValue" },
          totalQuantity: { $sum: "$totalQuantity" },
        },
      },
    ]);

    //Recent transactions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTransactions = await InventoryTransaction.countDocuments({
      transactionDate: { $gte: sevenDaysAgo },
    });

    //Modify transactions query
    let transactionFilter: any = {
      transactionDate: { $gte: sevenDaysAgo },
    };
    if (userRole === "staff") {
      const managedWarehouses = await getStaffWarehouses(userId);
      transactionFilter = {
        ...transactionFilter,
        $or: [
          { warehouseId: { $in: managedWarehouses } },
          { fromWarehouseId: { $in: managedWarehouses } },
          { toWarehouseId: { $in: managedWarehouses } },
        ],
      };
    }

    //Count of products with low stock
    const lowStockProducts = await Product.aggregate([
      {
        $match: {
          quantity: { $lt: 10 },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          quantity: 1,
        },
      },
    ]);

    //Transaction metrics by type
    const transactionsByType = await InventoryTransaction.aggregate([
      {
        $group: {
          _id: "$transactionType",
          count: { $sum: 1 },
        },
      },
    ]);

    //Product distribution by category
    const productsByCategory = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $group: {
          _id: { $arrayElemAt: ["$categoryInfo.name", 0] },
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ["$price", "$quantity"] } },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        warehouseCount,
        inventoryValue: warehouseTotals[0]?.totalValue || 0,
        inventoryQuantity: warehouseTotals[0]?.totalQuantity || 0,
        recentTransactions,
        lowStockProducts,
        transactionsByType,
        productsByCategory,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: "Error fetching dashboard summary",
      details: error.message,
    });
  }
};

export {
  getInventoryStatus,
  getInventoryMovement,
  getInventoryAging,
  getTransferEfficiency,
  getLowStockAlerts,
  getDashboardSummary,
};
