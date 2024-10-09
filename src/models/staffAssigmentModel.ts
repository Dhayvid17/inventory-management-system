import mongoose, { Document, Schema, Types } from "mongoose";

//Interface representing Document in MongoDB
export interface IStaffAssignment extends Document {
  staffId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  employmentDate: Date;
  terminationDate: Date;
}

//Create a new Schema that relates with the Interface
const staffAssignmentSchema: Schema = new Schema<IStaffAssignment>({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: true,
  },
  employmentDate: {
    type: Date,
    default: Date.now,
  },
  terminationDate: {
    type: Date,
  },
});

const StaffAssignment = mongoose.model<IStaffAssignment>(
  "StaffAssignment",
  staffAssignmentSchema
);
export default StaffAssignment;
