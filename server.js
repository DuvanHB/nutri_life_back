const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());

// Multer setup: store files in memory
const upload = multer({ storage: multer.memoryStorage() });

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple test route
app.get("/", (req, res) => {
  res.send("Hello from Node.js backend 🚀");
});

// Test route for haiku
app.get("/haiku", async (req, res) => {
  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: "Write a haiku about AI",
    });

    res.json({ haiku: response.output[0].content[0].text });
  } catch (err) {
    console.error("❌ Error generating haiku:", err);
    res.status(500).json({ error: "Failed to generate haiku" });
  }
});

// Route to process image and estimate calories
app.post("/process-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    console.log("📸 Received file:", req.file.originalname);

    // Convert buffer to base64
    const base64Image = req.file.buffer.toString("base64");
    const imageData = `data:${req.file.mimetype};base64,${base64Image}`;

    // Call GPT-4 Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Estimate the number of calories in this food. Respond with only the number." },
            { type: "image_url", image_url: { url: imageData } },
          ],
        },
      ],
    });

    const result = response.choices[0].message.content.trim();
    res.json({ calories: result });
  } catch (err) {
    console.error("❌ Error processing image:", err);
    res.status(500).json({ error: "Failed to process image" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
