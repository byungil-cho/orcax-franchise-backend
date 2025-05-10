const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ✅ 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ MongoDB 연결
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB 연결 성공'))
.catch(err => console.error('❌ MongoDB 연결 실패:', err.message));

// ✅ 신청서 라우터 연결
const applicationsRouter = require('./routes/applications');
app.use('/api/applications', applicationsRouter);

// ✅ 기본 라우트 (테스트용)
app.get('/', (req, res) => {
  res.send('🐳 OrcaX 프랜차이즈 백엔드 작동 중입니다!');
});

// ✅ 포트 설정 및 서버 실행
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});

