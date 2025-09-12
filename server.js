const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple test route
app.get("/", (req, res) => {
  res.send("Hello from Node.js backend 🚀");
});

// Example route to process an image (later you’ll handle uploads here)
app.post("/process-image", (req, res) => {
  console.log("Image data received:", req.body);
  res.json({ message: "Image processed successfully!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
