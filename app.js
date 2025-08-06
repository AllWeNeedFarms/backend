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
/* 요청이 들어오면 본문을 파싱(json으로) 하고
  본문에 있는 JSON 데이터를 추출하여
  js에서 사용할 수 있는 객체로 변환 
*/

// CORS
app.use((req, res, next) => {
  // 응답을 보내지 않고 header를 추가함
  // 브라우저 용
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next(); // 다른 미들웨어로 전달
});

app.get("/api/health", (req, res) => {
  res.status(200).send("OK");
});

// router를 미들웨어로
app.use("/api/farms", farmRoutes); // 받아온 라우팅
app.use("/api/users", userRoutes);

// 지원되지 않는 라우트 처리
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  next(error); // ← 반드시 호출!
});

// middle ware function
// 앞 미들웨어 함수에서 에러가 있는 경우만 express가 함수로 인식함
app.use((error, req, res, next) => {
  if (res.headerSent) return next(error);

  res.status(error.code || 500);
  /* 코드가 정의되었다면 코드로, 그렇지 않으면 500 */

  res.json({ message: error.message || "An unknown error occured!" });
  /* 클라이언트에게 보내줄 오류 */
});

// 1. 서버부터 즉시 실행하여 포트를 연다.
const server = app.listen(process.env.PORT || 5000, () => {
  console.log(
    `[${new Date()}] Express server started and listening on port ${
      process.env.PORT || 5000
    }.`
  );
});

// 2. 그 다음, 데이터베이스 연결을 비동기적으로 시도한다.
console.log(`[${new Date()}] Attempting to connect to MongoDB...`);
mongoose
  .connect(process.env.MONGO_URI, {
    // Mongoose 6.x 이상에서는 아래 옵션들이 기본값이지만, 명시적으로 추가하면 좋습니다.
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    // 연결 타임아웃을 적절히 설정 (예: 10초)
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log(`[${new Date()}] MongoDB connected successfully.`);
  })
  .catch((err) => {
    console.error(`[${new Date()}] MongoDB connection FAILED:`, err);
    // 중요: DB 연결에 실패해도 서버는 죽이지 않는다.
    // 대신, 프로덕션에서는 이 상태를 모니터링하여 조치해야 합니다.
  });

// 그레이스풀 셧다운(Graceful Shutdown) 처리 (선택사항이지만 권장)
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
