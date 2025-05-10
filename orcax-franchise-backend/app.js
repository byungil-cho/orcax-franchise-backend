const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3030;

// 미들웨어
app.use(cors());

// mongoose 연결
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB 연결 성공');
}).catch(err => {
  console.error('❌ MongoDB 연결 실패:', err.message);
});

// 라우터
const applicationsRouter = require('./routes/applications');
app.use('/api/applications', applicationsRouter);

// 기본 라우트
app.get('/', (req, res) => {
  res.send('OrcaX Franchise Backend 서버 실행 중');
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});

