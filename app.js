console.log("🚀 DEBUG VERSION - NODE-APP CONTAINER SCRIPT STARTED 🚀");

// 환경 변수 확인
console.log(`[${new Date()}] NODE_ENV:`, process.env.NODE_ENV);
console.log(`[${new Date()}] PORT:`, process.env.PORT);
console.log(`[${new Date()}] MONGO_URI exists:`, !!process.env.MONGO_URI);
console.log(
  `[${new Date()}] MONGO_URI length:`,
  process.env.MONGO_URI?.length || 0
);

const express = require("express");
const app = express();

// 🔥 전역 에러 핸들러 (최우선 설정)
process.on("unhandledRejection", (reason, promise) => {
  console.error(`[${new Date()}] 🚨 UNHANDLED PROMISE REJECTION:`, reason);
  console.error("Promise object:", promise);
  console.error("Stack trace:", reason?.stack || "No stack trace");
  // 프로세스 종료하지 말고 일단 로그만 남기기
  // process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error(`[${new Date()}] 🚨 UNCAUGHT EXCEPTION:`, error);
  console.error("Stack trace:", error.stack);
  // 프로세스 종료하지 말고 일단 로그만 남기기
  // process.exit(1);
});

// Express 미들웨어 설정
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

// 헬스 체크 엔드포인트
app.get("/api/health", (req, res) => {
  console.log(`[${new Date()}] 💚 Health check requested`);
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 간단한 테스트 엔드포인트
app.get("/api/test", (req, res) => {
  console.log(`[${new Date()}] 🧪 Test endpoint requested`);
  res.status(200).json({
    message: "Backend is working without MongoDB",
    timestamp: new Date().toISOString(),
  });
});

// 🔥 MongoDB 연결 없이 일단 서버부터 시작
console.log(`[${new Date()}] 🎯 SKIPPING MongoDB connection for debugging...`);

const port = process.env.PORT || 5000;
console.log(`[${new Date()}] 📡 Starting Express server on port ${port}...`);

try {
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`[${new Date()}] ✅ EXPRESS SERVER IS RUNNING ON PORT ${port}`);
    console.log(`[${new Date()}] 🔗 Server is bound to 0.0.0.0:${port}`);
    console.log(`[${new Date()}] 🌐 Ready to accept connections`);

    // 서버 주소 정보 출력
    const address = server.address();
    console.log(`[${new Date()}] 📋 Server address info:`, address);
  });

  server.on("listening", () => {
    console.log(`[${new Date()}] 🎉 SERVER IS NOW LISTENING!`);
  });

  server.on("error", (error) => {
    console.error(`[${new Date()}] 🚨 EXPRESS SERVER ERROR:`, error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    process.exit(1);
  });

  server.on("connection", (socket) => {
    console.log(`[${new Date()}] 🔌 New connection established`);
  });
} catch (error) {
  console.error(`[${new Date()}] 🚨 FAILED TO START SERVER:`, error);
  process.exit(1);
}

// 10초마다 서버 상태 로그
setInterval(() => {
  console.log(
    `[${new Date()}] ❤️ Server heartbeat - uptime: ${process.uptime()}s`
  );
}, 10000);
