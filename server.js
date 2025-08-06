// server.js (일부)
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const applyRouter = require('./routes/apply');
const path = require('path');

require('dotenv').config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGO_URI)
  .then(()=>console.log('✅ DB 연결 성공'))
  .catch(err=>console.error('❌ DB 연결 실패', err));

app.use('/api/apply', applyRouter);

// (서버 실행 등 이하 생략)
// health check API
app.get('/api/apply/status', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.json({status: 'OK'});
  } catch(e) {
    res.status(500).json({status:'FAIL', message:e.message});
  }
});
