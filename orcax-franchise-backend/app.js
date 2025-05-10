const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3030;

// Mongo 연결
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Mongo 연결 성공"))
.catch((err) => console.error("❌ Mongo 연결 실패:", err));

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({ storage: multer.memoryStorage() });

const Application = require("./models/Application");

app.get("/api/applications", (req, res) => {
  res.send("applications 라우터 연결됨");
});

app.post("/api/applications", upload.single("file"), async (req, res) => {
  try {
    const newApp = new Application({
      ...req.body,
      uploadedFileName: req.file?.originalname || null,
    });

    await newApp.save();
    res.status(201).json({ message: "저장 완료!" });
  } catch (err) {
    console.error("❌ 저장 실패:", err);
    res.status(500).json({ error: "서버 에러" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});


