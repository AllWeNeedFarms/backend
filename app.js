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

// 🔥 중요: Unhandled Promise Rejection 글로벌 핸들러
process.on("unhandledRejection", (reason, promise) => {
  console.error(`[${new Date()}] 🚨 Unhandled Promise Rejection:`, reason);
  console.error("Promise:", promise);
  // 프로세스 종료 (컨테이너 재시작을 위해)
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error(`[${new Date()}] 🚨 Uncaught Exception:`, error);
  process.exit(1);
});

app.use(bodyParser.json());

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

app.get("/api/health", (req, res) => {
  res.status(200).send("OK");
});

// router를 미들웨어로
app.use("/api/farms", farmRoutes);
app.use("/api/users", userRoutes);

// 지원되지 않는 라우트 처리
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  next(error);
});

// 에러 미들웨어
app.use((error, req, res, next) => {
  if (res.headerSent) return next(error);
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occured!" });
});

console.log(`[${new Date()}] Attempting to connect to MongoDB...`);

// 🔥 개선된 MongoDB 연결 로직
async function connectToDatabase() {
  try {
    console.log(`[${new Date()}] Starting MongoDB connection process...`);

    // Mongoose 연결 옵션 명시적 설정
    const options = {
      serverSelectionTimeoutMS: 30000, // 30초 타임아웃
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,
    };

    console.log(
      `[${new Date()}] Connecting with options:`,
      JSON.stringify(options, null, 2)
    );

    await mongoose.connect(process.env.MONGO_URI, options);

    console.log(`[${new Date()}] ✅ MongoDB connected successfully!`);
    console.log(
      `[${new Date()}] Connection state:`,
      mongoose.connection.readyState
    );

    // MongoDB 연결 이벤트 리스너
    mongoose.connection.on("error", (err) => {
      console.error(`[${new Date()}] 🚨 MongoDB connection error:`, err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn(`[${new Date()}] ⚠️ MongoDB disconnected`);
    });

    mongoose.connection.on("reconnected", () => {
      console.log(`[${new Date()}] ✅ MongoDB reconnected`);
    });

    // 서버 시작
    const port = process.env.PORT || 5000;
    console.log(`[${new Date()}] Starting Express server on port ${port}...`);

    const server = app.listen(port, "0.0.0.0", () => {
      console.log(
        `[${new Date()}] ✅ Express server is running on port ${port}`
      );
      console.log(`[${new Date()}] Server ready to accept connections`);
    });

    // 서버 에러 핸들링
    server.on("error", (error) => {
      console.error(`[${new Date()}] 🚨 Express server error:`, error);
      process.exit(1);
    });
  } catch (error) {
    console.error(`[${new Date()}] 🚨 Failed to connect to MongoDB:`, error);
    console.error(`[${new Date()}] Error details:`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    // 연결 실패시 프로세스 종료 (컨테이너 재시작을 위해)
    console.log(
      `[${new Date()}] Exiting process due to MongoDB connection failure...`
    );
    process.exit(1);
  }
}

// MongoDB 연결 시작
connectToDatabase();
