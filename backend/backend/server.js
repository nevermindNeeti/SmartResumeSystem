const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const parseResume = require("./resumeParser");

const app = express();

// Enable CORS
app.use(cors());

const upload = multer({ dest: "uploads/" });

// ... rest of your code

app.post("/analyze_resume", upload.single("file"), async (req, res) => {
  try {
    console.log("FILE:", req.file);   // 🔥 DEBUG
    console.log("BODY:", req.body);   // 🔥 DEBUG

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;

    const result = await parseResume(filePath);

    fs.unlinkSync(filePath);
    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Analysis failed" });
  }
});

app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});