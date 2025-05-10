const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3030;

// Mongo 연결
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true, useUnifiedTopology: true
}).then(() => console.log('✅ Mongo 연결')).catch(console.error);

const Application = require('./models/Application');
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/applications', upload.single('file'), async (req, res) => {
  try {
    const newApp = new Application({ ...req.body, uploadedFileName: req.file?.originalname });
    await newApp.save();
    res.status(201).json({ message: '저장 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '저장 실패' });
  }
});

