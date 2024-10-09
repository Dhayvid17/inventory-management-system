import express, { Request, Response } from "express";
import mongoose from "mongoose";
import Warehouse, { IWarehouse } from "../models/warehouseModel";
import Product from "../models/productModel";

//GET ALL SUPERWAREHOUSES
const getSuperWarehouses = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  try {
    //Fetch all superWarehouses with their products
    const superWarehouses: IWarehouse[] = await Warehouse.find({
      type: "superWarehouse",
    })
      .populate("managedBy", "username")
      .populate("products");

    if (!superWarehouses) {
      return res.status(404).json({ error: "No superWarehouses found" });
    }
    console.log("Fetched superWarehouses with products");
    return res.status(200).json(superWarehouses);
  } catch (error) {
    return res.status(500).json({ error: "Could not fetch superWarehouses" });
  }
};

//GET A SINGLE SUPERWAREHOUSE
const getSuperWarehouse = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Invalid superWarehouse id" });
  }

  try {
    const superWarehouse: IWarehouse | null = await Warehouse.findById(
      req.params.id
    )
      .populate("managedBy", "username")
      .populate("products");
    if (!superWarehouse) {
      return res.status(404).json({ error: "SuperWarehouse not found" });
    }

    return res.status(200).json(superWarehouse);
  } catch (error) {
    return res.status(500).json({ error: "Could not fetch superWarehouse" });
  }
};

// //CREATE A NEW SUPERWAREHOUSE
// const createSuperWarehouse = async (
//   req: Request,
//   res: Response
// ): Promise<Response | undefined> => {
//   const { name, location, capacity, managedBy } = req.body;

//   if (!name || !location || !capacity) {
//     return res.status(404).json({ error: "Please fill all fields" });
//   }

//   //Check if superWarehouse name exists
//   const superWarehouseExists = await Warehouse.findOne({
//     type: "superWarehouse",
//     name: name,
//   });
//   if (superWarehouseExists) {
//     return res.status(400).json({ error: "superWarehouse already exists." });
//   }

//   try {
//     const newSuperWarehouse: IWarehouse = new Warehouse({
//       name,
//       location,
//       capacity,
//       managedBy,
//       type: "superWarehouse",
//     });

//     await newSuperWarehouse.save();
//     console.log("superWarehouse created...");
//     return res.status(201).json(newSuperWarehouse);
//   } catch (error) {
//     return res.status(500).json({ error: "Could not add new superWarehouse" });
//   }
// };

// //UPDATE SUPERWAREHOUSE
// const updateSuperWarehouse = async (
//   req: Request,
//   res: Response
// ): Promise<Response | undefined> => {
//   const {
//     name,
//     type,
//     managedBy,
//     location,
//     capacity,
//     totalQuantity,
//     totalPrice,
//   } = req.body;
//   if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//     return res.status(404).json({ error: "Not a valid document" });
//   }

//   if (!name || !type || !location || !capacity) {
//     return res.status(400).json({ error: "Please fill all fields" });
//   }

//   try {
//     const updatedSuperWarehouse: IWarehouse | null =
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

//     if (!updatedSuperWarehouse) {
//       return res.status(400).json({ error: "Could not update superWarehouse" });
//     }
//     return res.status(200).json(updatedSuperWarehouse);
//   } catch (error) {
//     return res.status(500).json({ error: "Failed to update superWarehouse" });
//   }
// };

// //DELETE A SUPERWAREHOUSE
// const deleteSuperWarehouse = async (
//   req: Request,
//   res: Response
// ): Promise<Response | undefined> => {
//   if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//     return res.status(404).json({ error: "Not a valid document" });
//   }

//   try {
//     const deletedSuperWarehouse: IWarehouse | null =
//       await Warehouse.findByIdAndDelete(req.params.id);

//     if (!deletedSuperWarehouse) {
//       return res.status(400).json({ error: "Could not delete SuperWarehouse" });
//     }
//     return res.status(200).json({ message: "SuperWarehouse deleted" });
//   } catch (error) {
//     return res.status(500).json({ error: "Failed to delete SuperWarehouse" });
//   }
// };

export {
  getSuperWarehouses,
  getSuperWarehouse,
  // createSuperWarehouse,
  // updateSuperWarehouse,
  // deleteSuperWarehouse,
};
