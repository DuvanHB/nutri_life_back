import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// OpenRouter client
const api = axios.create({
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  },
});

// 📌 Call OpenRouter for text questions
async function callOpenRouter(userMessage) {
  try {
    const response = await api.post("/chat/completions", {
      model: "nvidia/nemotron-nano-9b-v2:free", // change if you want
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: userMessage },
      ],
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("OpenRouter Error:", error.response?.data || error.message);
    return "Error getting AI response";
  }
}

// 📌 Route for text Q&A
app.post("/ask-ai", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  const reply = await callOpenRouter(message);
  res.json({ reply });
});

// 📌 Call OpenRouter to check food in image and return nutrition info + health check
async function checkFoodInImage(base64Image) {
  try {
    const response = await api.post("/chat/completions", {
      model: "openrouter/sonoma-dusk-alpha", // vision model
      messages: [
        {
          role: "system",
          content: `You are an AI nutritionist.
          If the image contains food, analyze it and respond ONLY in JSON format like this:
          {
            "Calories": "XXX kcal",
            "Protein": "XX g",
            "Fat": "XX g",
            "Carbohydrates": "XX g",
            "Healthiness": "Healthy" or "Unhealthy"
          }
          If the image does not contain food, reply exactly with: "Imagen no contiene comida".`,
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


// 📌 Route for image analysis
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

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
