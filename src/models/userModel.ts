import mongoose, { Schema, model, Document } from "mongoose";

//Interface representing Document in MongoDB
export interface IUser extends Document {
  username: string;
  email: string;
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
    email: {
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
      default: "user",
      enum: ["user", "staff", "admin"],
      required: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", UserSchema);
export default User;
