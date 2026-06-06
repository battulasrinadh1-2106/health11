import mongoose, { Schema, Document } from "mongoose";

export interface IStepHistory extends Document {
  userId: string;
  date: string; // "YYYY-MM-DD"
  steps: number;
  calories: number;
  caloriesBurned: number;
  distance: number;
  duration?: number; // active walk duration in seconds
  createdAt?: Date;
  updatedAt?: Date;
  recordedAt: Date;
}

const StepHistorySchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  date: {
    type: String,
    required: true,
    index: true,
  },
  steps: {
    type: Number,
    required: true,
    default: 0,
  },
  calories: {
    type: Number,
    required: true,
    default: 0,
  },
  caloriesBurned: {
    type: Number,
    required: true,
    default: 0,
  },
  distance: {
    type: Number,
    required: true,
    default: 0,
  },
  duration: {
    type: Number,
    default: 0,
  },
  recordedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true // Automatically generates and manages createdAt and updatedAt fields
});

// Prevent duplicate entries for the same user on the same date
StepHistorySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.StepHistory || mongoose.model<IStepHistory>("StepHistory", StepHistorySchema);

