import mongoose, { Schema, model, Document, ObjectId } from "mongoose";

//Interface representing Document in MongoDB
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  password: string;
  role: string;
}

// Create a new Schema that relates with the Interface
const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "staff", "admin"],
      required: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", UserSchema);
export default User;
