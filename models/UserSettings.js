import mongoose from "mongoose";

const userSettingsSchema = new mongoose.Schema({
  gender: { type: String, required: true },
  age: { type: Number, required: true },
  height: { type: Number, required: true },
  weight: { type: Number, required: true },
  trainsPerWeek: { type: Number, required: true },
  activity: { type: String, required: true },
  goal: { type: String, required: true },
  // results
  calories: Number,
  protein: Number,
  fat: Number,
  carbs: Number,
}, { timestamps: true });

export default mongoose.model("UserSettings", userSettingsSchema);
