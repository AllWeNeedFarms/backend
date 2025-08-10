console.log("--- NODE-APP CONTAINER SCRIPT STARTED ---");
console.log(
  `[${new Date()}] MONGO_URI is:`,
  process.env.MONGO_URI ? "SET" : "NOT SET or UNDEFINED"
);

const express = require("express");
const app = express();

// BACK
const bodyParser = require("body-parser");
const farmRoutes = require("./routes/farms-routes");
const userRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

// DATA
const mongoose = require("mongoose");

app.use(bodyParser.json());

// 🔥 개선된 CORS 미들웨어
app.use((req, res, next) => {
  const origin = req.headers.origin;

  console.log(
    `[${new Date()}] CORS Request: ${req.method} ${req.url} from origin: ${
      origin || "no-origin"
    }`
  );

  // 모든 출처 허용 (개발 단계)
  // 프로덕션에서는 특정 도메인만 허용하는 것이 좋습니다
  res.setHeader("Access-Control-Allow-Origin", "*");

  // 허용할 헤더들
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  // 허용할 HTTP 메서드들
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );

  // Preflight 요청 캐시 시간 (초 단위)
  res.setHeader("Access-Control-Max-Age", "86400"); // 24시간

  // OPTIONS 요청(Preflight) 처리
  if (req.method === "OPTIONS") {
    console.log(`[${new Date()}] Handling OPTIONS preflight request`);
    return res.status(200).end();
  }

  next();
});

// 🩺 상세한 헬스 체크 엔드포인트
app.get("/api/health", (req, res) => {
  const healthInfo = {
    status: "OK",
    timestamp: new Date().toISOString(),
    mongoConnection:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    environment: process.env.NODE_ENV || "development",
    corsEnabled: true,
  };

  console.log(`[${new Date()}] Health check requested:`, healthInfo);
  res.status(200).json(healthInfo);
});

// router를 미들웨어로
app.use("/api/farms", farmRoutes);
app.use("/api/users", userRoutes);

// 지원되지 않는 라우트 처리
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  next(error);
});

// 에러 처리 미들웨어
app.use((error, req, res, next) => {
  if (res.headerSent) return next(error);

  console.error(`[${new Date()}] Error occurred:`, error.message);

  res.status(error.code || 500);
  res.json({
    message: error.message || "An unknown error occurred!",
    timestamp: new Date().toISOString(),
  });
});

// 서버 시작
const server = app.listen(process.env.PORT || 5000, () => {
  console.log(
    `[${new Date()}] Express server started and listening on port ${
      process.env.PORT || 5000
    }.`
  );
});

// MongoDB 연결
console.log(`[${new Date()}] Attempting to connect to MongoDB...`);
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log(`[${new Date()}] MongoDB connected successfully.`);
  })
  .catch((err) => {
    console.error(`[${new Date()}] MongoDB connection FAILED:`, err);
  });

// 그레이스풀 셧다운 처리
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});
