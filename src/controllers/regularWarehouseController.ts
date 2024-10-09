import express, { Request, Response } from "express";
import mongoose from "mongoose";
import Warehouse, { IWarehouse } from "../models/warehouseModel";
import Product from "../models/productModel";

//GET ALL SUPERWAREHOUSES
const getRegularWarehouses = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  try {
    //Fetch all regularWarehouse with their products
    const regularWarehouses: IWarehouse[] = await Warehouse.find({
      type: "regularWarehouse",
    })
      .populate("managedBy", "username")
      .populate("products");

    if (!regularWarehouses) {
      return res.status(404).json({ error: "No regularWarehouses found" });
    }
    console.log("Fetched regularWarehouses with products");
    return res.status(200).json(regularWarehouses);
  } catch (error) {
    return res.status(500).json({ error: "Could not fetch regularWarehouses" });
  }
};

//GET A SINGLE SUPERWAREHOUSE
const getRegularWarehouse = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Invalid regularWarehouse id" });
  }

  try {
    const regularWarehouse: IWarehouse | null = await Warehouse.findById(
      req.params.id
    )
      .populate("managedBy", "username")
      .populate("products");
    if (!regularWarehouse) {
      return res.status(404).json({ error: "RegularWarehouse not found" });
    }

    return res.status(200).json(regularWarehouse);
  } catch (error) {
    return res.status(500).json({ error: "Could not fetch regularWarehouse" });
  }
};

// //CREATE A NEW SUPERWAREHOUSE
// const createRegularWarehouse = async (
//   req: Request,
//   res: Response
// ): Promise<Response | undefined> => {
//   const { name, location, capacity, managedBy } = req.body;

//   if (!name || !location || !capacity) {
//     return res.status(404).json({ error: "Please fill all fields" });
//   }

//   //Check if regularWarehouse name exists
//   const regularWarehouseExists = await Warehouse.findOne({
//     type: "regularWarehouse",
//     name: name,
//   });
//   if (regularWarehouseExists) {
//     return res.status(400).json({ error: "RegularWarehouse already exists." });
//   }

//   try {
//     const newRegularWarehouse: IWarehouse = new Warehouse({
//       name,
//       location,
//       capacity,
//       managedBy,
//       type: "regularWarehouse",
//     });

//     await newRegularWarehouse.save();
//     console.log("regularWarehouse created...");
//     return res.status(201).json(newRegularWarehouse);
//   } catch (error) {
//     return res
//       .status(500)
//       .json({ error: "Could not add new regularWarehouse" });
//   }
// };

// //UPDATE SUPERWAREHOUSE
// const updateRegularWarehouse = async (
//   req: Request,
//   res: Response
// ): Promise<Response | undefined> => {
//   const { name, type, managedBy, location, capacity } = req.body;
//   if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//     return res.status(404).json({ error: "Not a valid document" });
//   }

//   if (!name || !type || !location || !capacity) {
//     return res.status(400).json({ error: "Please fill all fields" });
//   }

//   try {
//     const updatedRegularWarehouse: IWarehouse | null =
//       await Warehouse.findByIdAndUpdate(
//         req.params.id,
//         {
//           name,
//           type,
//           managedBy,
//           location,
//           capacity,
//         },
//         { new: true }
//       );

//     if (!updatedRegularWarehouse) {
//       return res
//         .status(400)
//         .json({ error: "Could not update RegularWarehouse" });
//     }
//     return res.status(200).json(updatedRegularWarehouse);
//   } catch (error) {
//     return res.status(500).json({ error: "Failed to update RegularWarehouse" });
//   }
// };

// //DELETE A SUPERWAREHOUSE
// const deleteRegularWarehouse = async (
//   req: Request,
//   res: Response
// ): Promise<Response | undefined> => {
//   if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//     return res.status(404).json({ error: "Not a valid document" });
//   }

//   try {
//     const deletedRegularWarehouse: IWarehouse | null =
//       await Warehouse.findByIdAndDelete(req.params.id);

//     if (!deletedRegularWarehouse) {
//       return res
//         .status(400)
//         .json({ error: "Could not delete RegularWarehouse" });
//     }
//     return res.status(200).json({ message: "RegularWarehouse deleted" });
//   } catch (error) {
//     return res.status(500).json({ error: "Failed to delete RegularWarehouse" });
//   }
// };

export {
  getRegularWarehouses,
  getRegularWarehouse,
  // createRegularWarehouse,
  // updateRegularWarehouse,
  // deleteRegularWarehouse,
};
