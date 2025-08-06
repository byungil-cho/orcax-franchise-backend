const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3070;

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// 몽고DB 연결
mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ MongoDB 연결 성공'))
    .catch((err) => console.error('❌ MongoDB 연결 실패', err));

// 상태 체크 API
app.get('/api/apply/status', async (req, res) => {
    try {
        await mongoose.connection.db.admin().ping();
        res.json({ status: 'OK', db: true });
    } catch (e) {
        res.status(500).json({ status: 'FAIL', db: false, message: e.message });
    }
});

// 라우터
const applyRouter = require('./routes/apply');
app.use('/api/apply', applyRouter);

// 서버 실행
app.listen(PORT, () => {
    console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
