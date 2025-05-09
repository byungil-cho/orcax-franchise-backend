const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const path = require("path");

// Mongo 모델 (apply.js에서 정의한 것과 동일해야 함)
const Application = mongoose.model("Application");

// GET /manage - 신청 목록 보기
router.get("/manage", async (req, res) => {
  try {
    const applications = await Application.find().sort({ submittedAt: -1 });

    let tableRows = applications
      .map(app => {
        return `
          <tr>
            <td>${app.name}</td>
            <td>${app.phone}</td>
            <td>${app.submittedAt.toLocaleDateString()}</td>
            <td>
              <a href="/uploads/${app.file}" target="_blank">다운로드</a>
            </td>
          </tr>
        `;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <title>접수된 신청 목록</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { padding: 10px; border: 1px solid #ccc; }
          th { background: #eee; }
        </style>
      </head>
      <body>
        <h2>📋 가맹점 신청 목록</h2>
        <table>
          <thead>
            <tr>
              <th>상호</th>
              <th>연락처</th>
              <th>신청일</th>
              <th>등록증</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    console.error("❌ /manage 조회 실패:", err);
    res.status(500).send("서버 오류");
  }
});

module.exports = router;
