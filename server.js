// server.js
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Nutrition from "./models/Nutrition.js"; // new model file

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// Connect to MongoDB (Mongoose)
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.warn("⚠️  MONGO_URI not set in .env — save endpoint will fail until you set it.");
} else {
  mongoose
    .connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err.message);
    });
}

// OpenRouter client
const api = axios.create({
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  },
});

//  Image analysis route
async function checkFoodInImage(base64Image) {
  try {
    const response = await api.post("/chat/completions", {
      model: process.env.MODEL_NAME, // vision model
      messages: [
        {
          role: "system",
          content: `You are an AI nutritionist.
          If the image contains food, analyze it and respond ONLY in JSON format like this:
          {
            "Calories": 0,
            "Protein": 0,
            "Fat": 0,
            "Carbohydrates": 0,
            "Healthiness": "Healthy" or "Unhealthy"
          }
          Return only exact numbers. Do NOT use ranges. Do NOT add units (g, kg, kcal, etc.).`

        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this image and tell me if it contains food. If yes, give nutrition facts and if it looks healthy or unhealthy." },
            { type: "image_url", image_url: `data:image/jpeg;base64,${base64Image}` },
          ],
        },
      ],
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("OpenRouter Error:", error.response?.data || error.message);
    return "Error analyzing image";
  }
}

app.post("/check-food", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });

  try {
    const fileData = fs.readFileSync(req.file.path, { encoding: "base64" });
    const result = await checkFoodInImage(fileData);

    fs.unlinkSync(req.file.path); // clean temp file
    res.json({ result });
  } catch (err) {
    console.error("Image Processing Error:", err.message);
    res.status(500).json({ error: "Error processing image" });
  }
});

// Nutrition 
// 📌 Route to get all nutrition records
app.get("/get-nutrition", async (req, res) => {
  try {
    const nutritions = await Nutrition.find(); // get all docs
    res.json(nutritions);
  } catch (err) {
    console.error("❌ Error fetching nutrition:", err);
    res.status(500).json({ error: "Failed to fetch nutrition data" });
  }
});

app.post("/save-nutrition", async (req, res) => {
  try {
    // accept all fields sent by frontend
    const {
      gender,
      age,
      height,
      weight,
      trainsPerWeek,
      activity,
      goal,
      calories,
      protein,
      fat,
      carbs,
      note,
      date,
      userId,
    } = req.body;

    // Basic validation
    if (!age || !height || !weight || !calories) {
      return res.status(400).json({ error: "Missing required fields (age/height/weight/calories)" });
    }

    const doc = new Nutrition({
      gender,
      age,
      height,
      weight,
      trainsPerWeek,
      activity,
      goal,
      calories,
      protein,
      fat,
      carbs,
      note: note || "",
      date: date ? new Date(date) : new Date(),
      userId: userId || null, // keep null for now; in future associate with users
    });

    const saved = await doc.save();

    res.json({
      message: "Nutrition plan saved successfully",
      data: saved,
    });
  } catch (err) {
    console.error("Error saving nutrition:", err);
    res.status(500).json({ error: "Error saving nutrition plan" });
  }
});

app.post("/calculate-nutrition", (req, res) => {
  const { age, height, weight, trainsPerWeek, activity, goal, gender } = req.body;

  // Harris-Benedict BMR formula
  let bmr;
  if (gender === "Male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5; // for men
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161; // for women
  }

  // Activity multipliers
  let activityMultiplier = 1.2;
  if (activity === "Poco activo") activityMultiplier = 1.375;
  if (activity === "Normal") activityMultiplier = 1.55;
  if (activity === "Activo") activityMultiplier = 1.725;
  if (activity === "Muy activo") activityMultiplier = 1.9;

  let calories = bmr * activityMultiplier;

  // Adjust based on goal
  if (goal === "Gain") calories += 300;
  if (goal === "Lose") calories -= 300;

  // Macronutrient split
  const protein = Math.round((0.3 * calories) / 4);
  const fat = Math.round((0.3 * calories) / 9);
  const carbs = Math.round((0.4 * calories) / 4);

  res.json({
    calories: Math.round(calories),
    protein,
    fat,
    carbs,
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
