require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB connect
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("✅ MongoDB connected"));

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Mongoose model
const ApplicationSchema = new mongoose.Schema({
  name: String,
  phone: String,
  biznum: String,
  region: String,
  address: String,
  type: String,
  message: String,
  filename: String,
});
const Application = mongoose.model("Application", ApplicationSchema);

// POST route
app.post("/api/applications", upload.single("file"), async (req, res) => {
  try {
    const { name, phone, biznum, region, address, type, message } = req.body;
    const file = req.file;

    const application = new Application({
      name,
      phone,
      biznum,
      region,
      address,
      type,
      message,
      filename: file ? file.filename : null,
    });

    await application.save();
    res.status(201).json({ message: "신청서 등록 성공" });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 기본 라우터 연결 확인
app.get("/api/applications", (req, res) => {
  res.send("applications 라우터 연결됨");
});

// 포트 설정 (Render 호환)
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});


