import mongoose, { Schema, Document, ObjectId, Date } from "mongoose";

export interface INotification extends Document {
  staffId?: mongoose.Types.ObjectId; //(Optional)
  userId?: mongoose.Types.ObjectId; //(Optional)
  type: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema<INotification> = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  type: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
export default Notification;
