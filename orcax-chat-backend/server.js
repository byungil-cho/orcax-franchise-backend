require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const messageRoutes = require('./경로/messages');

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public'))); // HTML 파일들 위치

app.use('/api/messages', messageRoutes);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB Atlas 연결 성공!');
}).catch(err => {
  console.error('❌ MongoDB 연결 오류:', err);
});

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
