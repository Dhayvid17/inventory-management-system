import { Request, Response } from "express";
import mongoose, { ObjectId } from "mongoose";
import StaffAssignment, {
  IStaffAssignment,
} from "../models/staffAssigmentModel";
import Warehouse from "../models/warehouseModel";
import User from "../models/userModel";

//ET AL STAFF ASSIGNMENT
const getStaffAssignments = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  try {
    const allStaffAssignments: IStaffAssignment[] = await StaffAssignment.find()
      .populate("staffId", "username")
      .populate("warehouseId");

    if (!allStaffAssignments) {
      return res.status(404).json({ error: "No staff assignments found" });
    }

    return res.status(200).json(allStaffAssignments);
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to get all Staff assignments",
      details: error.message,
    });
  }
};

//GET A SINGLE STAFF ASSIGNMENT
const getStaffAssignment = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Invalid Staff Assigned id" });
  }

  //Check if Staff Assigned exists
  const staffAssignedExists = await StaffAssignment.findById(req.params.id);
  if (!staffAssignedExists) {
    return res.status(400).json({ error: "Staff Assigned does not exists." });
  }

  try {
    const singleStaffAssignment: IStaffAssignment | null =
      await StaffAssignment.findById(req.params.id)
        .populate("staffId", "username")
        .populate("warehouseId");

    if (!singleStaffAssignment) {
      return res.status(404).json({ error: "Staff Assigned not found" });
    }

    return res.status(200).json(singleStaffAssignment);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to get Staff Assigned", details: error.message });
  }
};

//CREATE NEW STAFF ASSIGNMENT
const createStaffAssignment = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { staffId, warehouseId } = req.body;

  //Initialize Session Transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  //Check input fields
  if (!staffId || !warehouseId) {
    return res.status(404).json({ error: "Please fill all fields" });
  }

  try {
    const warehouseObjectId =
      mongoose.Types.ObjectId.createFromHexString(warehouseId);
    const staffObjectId = mongoose.Types.ObjectId.createFromHexString(staffId);

    //Validate Warehouse Id and Staff Id
    if (
      !mongoose.Types.ObjectId.isValid(staffObjectId) ||
      !mongoose.Types.ObjectId.isValid(warehouseObjectId)
    ) {
      return res.status(400).json({ error: "Invalid warehouse or staff ID." });
    }

    //Check if the user exists and has the correct role
    const user = await User.findById(staffObjectId).session(session);
    if (!user) {
      return res.status(400).json({ error: "User not found." });
    }
    if (!["admin", "staff"].includes(user.role)) {
      return res.status(400).json({
        error:
          "Only users with the role of admin or staff can be assigned to a warehouse.",
      });
    }

    //Check If Staff assigned exists
    const staffExists = await StaffAssignment.findOne({
      staffId: staffId,
    }).session(session);
    if (staffExists) {
      return res.status(400).json({ error: "Staff already exists." });
    }

    //Check if warehouse exists
    const warehouse = await Warehouse.findById(warehouseObjectId).session(
      session
    );
    if (!warehouse) {
      return res.status(400).json({ error: "Warehouse not found." });
    }

    //Check if staff is already assigned to this warehouse
    if (warehouse.managedBy && warehouse.managedBy.includes(staffObjectId)) {
      return res
        .status(400)
        .json({ error: "Staff is already assigned to this warehouse." });
    }

    //Update the warehouse's managedBy field
    await Warehouse.updateOne(
      { _id: warehouseObjectId },
      { $addToSet: { managedBy: staffObjectId } }
    ).session(session);

    const newAssignment: IStaffAssignment = new StaffAssignment({
      staffId: staffObjectId,
      warehouseId: warehouseObjectId,
      employmentDate: new Date(),
    });

    await newAssignment.save({ session });

    await session.commitTransaction();
    return res.status(201).json(newAssignment);
  } catch (error: any) {
    await session.abortTransaction();
    return res.status(500).json({
      error: "Error assigning staff to warehouse",
      details: error.message,
    });
  } finally {
    await session.endSession();
  }
};

//RE-ASSIGN STAFF TO NEW WAREHOUSE
const reassignStaffToNewWarehouse = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { staffId, warehouseId, employmentDate, terminationDate } = req.body;

  if (!staffId || !warehouseId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  //Initialize Session Transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  //Check if it's a valid Id
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  try {
    const warehouseObjectId =
      mongoose.Types.ObjectId.createFromHexString(warehouseId);
    const staffObjectId = mongoose.Types.ObjectId.createFromHexString(staffId);

    //Check if the user exists and has the correct role
    const user = await User.findById(staffObjectId).session(session);
    if (!user) {
      return res.status(400).json({ error: "Staff not found." });
    }
    if (!["admin", "staff"].includes(user.role)) {
      return res.status(400).json({
        error:
          "Only users with the role of admin or staff can be assigned to a warehouse.",
      });
    }

    //Check if warehouse exists
    const warehouse = await Warehouse.findById(warehouseObjectId).session(
      session
    );
    if (!warehouse) {
      return res.status(400).json({ error: "Warehouse not found." });
    }

    //Find current staff assignment
    const currentAssignment = await StaffAssignment.findOne({
      staffId: staffObjectId,
    }).session(session);
    if (!currentAssignment) {
      return res.status(400).json({ error: "Staff assignment not found." });
    }

    //Check if staff is already assigned to the new warehouse
    if (currentAssignment.warehouseId?.toString() === warehouseId.toString()) {
      return res
        .status(400)
        .json({ message: "Staff is already assigned to this warehouse." });
    }

    //Remove staff from the current warehouse's managedBy field if the warehouse is different
    if (
      currentAssignment.warehouseId &&
      currentAssignment.warehouseId.toString() !== warehouseId.toString()
    ) {
      await Warehouse.updateOne(
        { _id: currentAssignment.warehouseId },
        { $pull: { managedBy: staffObjectId } }
      ).session(session);
    }

    //Update staff assignment details
    currentAssignment.warehouseId = warehouseObjectId;
    currentAssignment.employmentDate =
      employmentDate || currentAssignment.employmentDate;
    currentAssignment.terminationDate = terminationDate || null;
    await currentAssignment.save({ session });

    //Add staff to the new warehouse's managedBy field
    await Warehouse.updateOne(
      { _id: warehouseObjectId },
      { $addToSet: { managedBy: staffObjectId } }
    ).session(session);

    await session.commitTransaction();
    console.log("Staff assignment updated successfully.");

    return res
      .status(200)
      .json({ message: "Staff assignment updated successfully." });
  } catch (error: any) {
    await session.abortTransaction();
    return res.status(500).json({
      error: "Error updating staff assignment",
      details: error.message,
    });
  } finally {
    session.endSession();
  }
};

//REMOVE STAFF FROM WAREHOUSE
const removeStaffFromWarehouse = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { staffId, warehouseId } = req.body;
  if (!staffId || !warehouseId) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  //Initialize Session Transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const warehouseObjectId =
      mongoose.Types.ObjectId.createFromHexString(warehouseId);
    const staffObjectId = mongoose.Types.ObjectId.createFromHexString(staffId);

    //Check if the staff exists
    const user = await User.findById(staffObjectId).session(session);
    if (!user) {
      return res.status(400).json({ error: "Staff not found." });
    }

    //Check if warehouse exists
    const warehouse = await Warehouse.findById(warehouseObjectId).session(
      session
    );
    if (!warehouse) {
      return res.status(400).json({ error: "Warehouse not found." });
    }
    //Check if the staff is assigned to the warehouse
    if (warehouse.managedBy && !warehouse.managedBy.includes(staffObjectId)) {
      return res
        .status(404)
        .json({ error: "Staff is not assigned to this warehouse." });
    }

    //Remove the staff from the current warehouse's managedBy field
    await Warehouse.updateOne(
      { _id: warehouseObjectId },
      { $pull: { managedBy: staffObjectId } }
    ).session(session);

    //Update the staff assignment record to set warehouseId to null and add a termination date
    const staffAssignment = await StaffAssignment.findOne({
      staffId: staffObjectId,
      warehouseId: warehouseObjectId,
    }).session(session);

    //Update staff assignment details
    if (staffAssignment) {
      staffAssignment.warehouseId = null;
      staffAssignment.terminationDate = new Date(); // Set termination date
      await staffAssignment.save({ session });
    }
    await session.commitTransaction();
    console.log("Staff removed from warehouse successfully.");
    return res
      .status(200)
      .json({ message: "Staff removed from warehouse successfully." });
  } catch (error: any) {
    await session.abortTransaction();
    return res.status(500).json({
      error: "Error removing staff from warehouse",
      details: error.message,
    });
  } finally {
    session.endSession();
  }
};

//TERMINATE STAFF FROM WAREHOUSE
const terminateStaff = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  const { staffId, warehouseId } = req.body;

  if (!staffId || !warehouseId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  //Initialize Session Transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const staffObjectId = mongoose.Types.ObjectId.createFromHexString(staffId);
    const warehouseObjectId =
      mongoose.Types.ObjectId.createFromHexString(warehouseId);

    //Check If Staff Id and Warehouse Id are Valid
    if (
      !mongoose.Types.ObjectId.isValid(staffObjectId) ||
      !mongoose.Types.ObjectId.isValid(warehouseObjectId)
    ) {
      return res
        .status(404)
        .json({ message: "Invalid warehouse or staff ID." });
    }

    //Check if the staff exists
    const user = await User.findById(staffObjectId).session(session);
    if (!user) {
      return res.status(400).json({ error: "Staff not found." });
    }

    //Check if warehouse exists
    const warehouse = await Warehouse.findById(warehouseObjectId).session(
      session
    );
    if (!warehouse) {
      return res.status(404).json({ error: "Warehouse not found" });
    }

    //Check if the staff is assigned to the warehouse
    if (warehouse.managedBy && !warehouse.managedBy.includes(staffObjectId)) {
      return res
        .status(404)
        .json({ error: "Staff is not assigned to this warehouse." });
    }

    //Update the warehouse's managedBy field to remove the staff
    await Warehouse.updateOne(
      { _id: warehouseObjectId },
      { $pull: { managedBy: staffObjectId } }
    ).session(session);

    //Update the staff assignment collection
    const staffAssignment = await StaffAssignment.findOne({
      staffId: staffObjectId,
      warehouseId: warehouseObjectId,
    }).session(session);
    if (staffAssignment) {
      staffAssignment.warehouseId = null;
      staffAssignment.terminationDate = new Date(); // Set termination date
      await staffAssignment.save({ session });
    }

    await session.commitTransaction();
    console.log("Staff terminated successfully.");
    return res
      .status(200)
      .json({ message: "Staff removed from warehouse successfully." });
  } catch (error: any) {
    await session.abortTransaction();
    console.log("Error terminating staff from warehouse:", error.message);
    return res.status(500).json({
      error: "Could not terminate staff from warehouse.",
      details: error.message,
    });
  } finally {
    session.endSession();
  }
};

//DELETE A STAFF ASSIGNMENT
const deleteStaffAssignment = async (
  req: Request,
  res: Response
): Promise<Response | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Not a valid document" });
  }

  //Check the Staff assignment by the Id
  const staffId = req.params.id;
  const staffAssignment = await StaffAssignment.findById(staffId);
  if (!staffAssignment) {
    return res.status(404).json({ error: "Staff assignment not found" });
  }

  //Remove the staff from the managedBy field of the warehouse
  await Warehouse.updateOne(
    { _id: staffAssignment.warehouseId },
    { $pull: { managedBy: staffAssignment.staffId } }
  );

  try {
    const deletedAssignment: IStaffAssignment | null =
      await StaffAssignment.findByIdAndDelete(staffId);

    if (!deletedAssignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    return res
      .status(200)
      .json({ message: "Staff Assignment deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to delete Staff Assignment",
      details: error.message,
    });
  }
};

export {
  getStaffAssignments,
  getStaffAssignment,
  createStaffAssignment,
  reassignStaffToNewWarehouse,
  removeStaffFromWarehouse,
  terminateStaff,
  deleteStaffAssignment,
};
