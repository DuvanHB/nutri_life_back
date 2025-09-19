// models/Nutrition.js
import mongoose from "mongoose";

const NutritionSchema = new mongoose.Schema({
  gender: { type: String, enum: ["Male", "Female"], default: "Male" },
  age: { type: Number, required: true },
  height: { type: Number, required: true }, // cm
  weight: { type: Number, required: true }, // kg
  trainsPerWeek: { type: Number, default: 0 },
  activity: { type: String, default: "Normal" },
  goal: { type: String, default: "Maintain" },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  fat: { type: Number, required: true },
  carbs: { type: Number, required: true },
  note: { type: String, default: "" },
  date: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // future
}, { timestamps: true });

export default mongoose.model("Nutrition", NutritionSchema);
