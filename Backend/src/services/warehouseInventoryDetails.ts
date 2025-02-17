import mongoose from "mongoose";
import InventoryTransaction from "../models/inventoryTransactionModel";
import Warehouse from "../models/warehouseModel";

// //LOGIC TO GET WAREHOUSE INVENTORY SUMMARY
// const getWarehouseStockSummary = async (
//   warehouseId: mongoose.Types.ObjectId,
//   startDate: Date,
//   endDate: Date
// ) => {
//   try {
//     //GET THE OPENING STOCK BEFORE THE START DATE
//     const openingStock = await InventoryTransaction.aggregate([
//       {
//         $match: {
//           $or: [
//             { warehouseId: warehouseId }, //Regular transactions affecting this warehouse
//             { fromWarehouseId: warehouseId }, //Transfers out from this warehouse
//             { toWarehouseId: warehouseId }, //Transfers into this warehouse
//           ],
//           transactionDate: { $lt: startDate }, //Transactions before the start date
//           transactionType: {
//             $in: [
//               "Restock Transaction",
//               "Sales Transaction",
//               "Supplier Return",
//               "Customer Return",
//               "Online Order",
//               "Inter-Warehouse Transfer",
//             ],
//           },
//           action: {
//             $in: ["Add Product To Warehouse", "Remove Product From Warehouse"],
//           }, //Products added or removed from warehouse
//           interWarehouseTransferStatus: { $in: ["Approved", "Completed"] }, // Only completed transfers affect stock
//         },
//       },
//       { $unwind: "$products" },
//       {
//         $group: {
//           _id: null,
//           totalInflow: {
//             $sum: {
//               $cond: {
//                 if: {
//                   $or: [
//                     { $eq: ["$transactionType", "Restock Transaction"] },
//                     { $eq: ["$transactionType", "Customer Return"] },
//                     { $eq: ["$action", "Add Product To Warehouse"] },
//                     {
//                       $and: [
//                         {
//                           $eq: ["$transactionType", "Inter-Warehouse Transfer"],
//                         },
//                         { $eq: ["$toWarehouseId", warehouseId] },
//                       ],
//                     }, //Transfers into this warehouse
//                   ],
//                 },
//                 then: "$products.quantity",
//                 else: 0,
//               },
//             },
//           },
//           totalOutflow: {
//             $sum: {
//               $cond: {
//                 if: {
//                   $or: [
//                     { $eq: ["$transactionType", "Sales Transaction"] },
//                     { $eq: ["$transactionType", "Supplier Return"] },
//                     { $eq: ["$action", "Remove Product From Warehouse"] },
//                     {
//                       $and: [
//                         {
//                           $eq: ["$transactionType", "Inter-Warehouse Transfer"],
//                         },
//                         { $eq: ["$fromWarehouseId", warehouseId] },
//                       ],
//                     }, //Transfers out of this warehouse
//                   ],
//                 },
//                 then: "$products.quantity",
//                 else: 0,
//               },
//             },
//           },
//         },
//       },
//     ]);

//     const openingStockQuantity =
//       openingStock.length > 0
//         ? openingStock[0].totalInflow - openingStock[0].totalOutflow
//         : 0;

//     //GET INFLOW AND OUTFLOW WITHIN THE DATE RANGE
//     const inflowAndOutflow = await InventoryTransaction.aggregate([
//       {
//         $match: {
//           $or: [
//             { warehouseId: warehouseId }, //Regular transactions affecting this warehouse
//             { fromWarehouseId: warehouseId }, //Transfers out from this warehouse
//             { toWarehouseId: warehouseId }, //Transfers into this warehouse
//           ],
//           transactionDate: { $gte: startDate, $lte: endDate }, // Transactions within the date range
//           transactionType: {
//             $in: [
//               "Restock Transaction",
//               "Sales Transaction",
//               "Supplier Return",
//               "Customer Return",
//               "Online Order",
//               "Inter-Warehouse Transfer",
//             ],
//           },
//           action: {
//             $in: ["Add Product To Warehouse", "Remove Product From Warehouse"],
//           }, //Products added or removed from warehouse
//           interWarehouseTransferStatus: { $in: ["Approved", "Completed"] }, //Only completed transfers affect stock
//         },
//       },
//       { $unwind: "$products" },
//       {
//         $group: {
//           _id: null,
//           totalInflow: {
//             $sum: {
//               $cond: {
//                 if: {
//                   $or: [
//                     { $eq: ["$transactionType", "Restock Transaction"] },
//                     { $eq: ["$transactionType", "Customer Return"] },
//                     { $eq: ["$action", "Add Product To Warehouse"] },
//                     {
//                       $and: [
//                         {
//                           $eq: ["$transactionType", "Inter-Warehouse Transfer"],
//                         },
//                         { $eq: ["$toWarehouseId", warehouseId] },
//                       ],
//                     }, //Transfers into this warehouse
//                   ],
//                 },
//                 then: "$products.quantity",
//                 else: 0,
//               },
//             },
//           },
//           totalOutflow: {
//             $sum: {
//               $cond: {
//                 if: {
//                   $or: [
//                     { $eq: ["$transactionType", "Sales Transaction"] },
//                     { $eq: ["$transactionType", "Supplier Return"] },
//                     { $eq: ["$action", "Remove Product From Warehouse"] },
//                     {
//                       $and: [
//                         {
//                           $eq: ["$transactionType", "Inter-Warehouse Transfer"],
//                         },
//                         { $eq: ["$fromWarehouseId", warehouseId] },
//                       ],
//                     }, //Transfers out of this warehouse
//                   ],
//                 },
//                 then: "$products.quantity",
//                 else: 0,
//               },
//             },
//           },
//         },
//       },
//     ]);

//     //CALCULATE THE TOTAL INFLOW
//     const inflowQuantity =
//       inflowAndOutflow.length > 0 ? inflowAndOutflow[0].totalInflow : 0;

//     //CALCULATE THE TOTAL OUTFLOW
//     const outflowQuantity =
//       inflowAndOutflow.length > 0 ? inflowAndOutflow[0].totalOutflow : 0;

//     //CALCULATE THE CLOSING STOCK
//     const closingStock =
//       openingStockQuantity + inflowQuantity - outflowQuantity;

//     //RETURN SUMMARY
//     return {
//       openingStock: openingStockQuantity,
//       inflow: inflowQuantity,
//       outflow: outflowQuantity,
//       closingStock: closingStock,
//     };
//   } catch (error: any) {
//     throw new Error(`Error calculating stock summary: ${error.message}`);
//   }
// };

//SERVICE FUNCTION TO CALCULATE INFLOW, OUTFLOW, OPENING AND CLOSING STOCK OF A WAREHOUSE
const getWarehouseStockSummary = async (
  warehouseId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) => {
  try {
    //Fetch opening stock before the start date
    const warehouse = await Warehouse.findById(warehouseId).populate(
      "products.productId"
    );
    if (!warehouse) {
      throw new Error(`Warehouse with id ${warehouseId} not found`);
    }
    const openingStock = warehouse.products.reduce(
      (acc, item) => {
        acc.quantity += item.quantity;
        acc.value += item.quantity * item.price;
        return acc;
      },
      { quantity: 0, value: 0 }
    );

    //Fetch inflow transactions within the date range
    const inflowTransactions = await InventoryTransaction.find({
      $or: [
        {
          $and: [
            { warehouseId: warehouseId },
            { transactionDate: { $gte: startDate, $lte: endDate } },
            {
              transactionType: {
                $in: ["Restock Transaction", "Customer Return"],
              },
            },
            { action: { $in: ["Add Product To Warehouse"] } },
          ],
        },
        {
          $and: [
            { toWarehouseId: warehouseId },
            { transactionDate: { $gte: startDate, $lte: endDate } },
            { transactionType: "Inter-Warehouse Transfer" },
            { interWarehouseTransferStatus: "Completed" },
          ],
        },
      ],
    }).populate("products.productId");

    const inflow = inflowTransactions.reduce(
      (acc, transaction) => {
        transaction.products.forEach((item) => {
          acc.quantity += item.quantity;
          acc.value += item.quantity * item.price;
        });
        return acc;
      },
      { quantity: 0, value: 0 }
    );

    //Fetch outflow transactions within the date range
    const outflowTransactions = await InventoryTransaction.find({
      $or: [
        {
          $and: [
            { warehouseId: warehouseId },
            { transactionDate: { $gte: startDate, $lte: endDate } },
            {
              transactionType: {
                $in: [
                  "Sales Transaction",
                  "Damaged Product",
                  "Supplier Return",
                  "Online Order",
                ],
              },
            },
            { action: { $in: ["Remove Product From Warehouse"] } },
          ],
        },
        {
          $and: [
            { fromWarehouseId: warehouseId },
            { transactionDate: { $gte: startDate, $lte: endDate } },
            { transactionType: "Inter-Warehouse Transfer" },
            { interWarehouseTransferStatus: "In Transit" },
          ],
        },
      ],
    }).populate("products.productId");

    const outflow = outflowTransactions.reduce(
      (acc, transaction) => {
        transaction.products.forEach((item) => {
          acc.quantity += item.quantity;
          acc.value += item.quantity * item.price;
        });
        return acc;
      },
      { quantity: 0, value: 0 }
    );

    // Calculate closing stock
    const closingStock = {
      quantity: openingStock.quantity + inflow.quantity - outflow.quantity,
      value: openingStock.value + inflow.value - outflow.value,
    };

    return {
      openingStock,
      inflow,
      outflow,
      closingStock,
    };
  } catch (error) {
    console.error("Error calculating inventory summary:", error);
  }
};

// Example usage
const warehouseId = new mongoose.Types.ObjectId("66ec1f99c1bd4bb71890a262");
const startDate = new Date("2024-09-29");
const endDate = new Date("2024-09-30");

getWarehouseStockSummary(warehouseId, startDate, endDate)
  .then((result) => {
    console.log("Warehouse Stock:", result);
  })
  .catch((error) => {
    console.error("Error:", error);
  });

export default getWarehouseStockSummary;
