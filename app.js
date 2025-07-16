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

// router를 미들웨어로
app.use("/api/farms", farmRoutes); // 받아온 라우팅
app.use("/api/users", userRoutes);

// 지원되지 않는 라우트 처리
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
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

// promise 객체
mongoose
  .connect(
    "mongodb+srv://jeeho:wlghhoho32@farmcluster.g8mwkke.mongodb.net/mern?retryWrites=true&w=majority&appName=farmCluster"
  )
  .then(() => {
    app.listen(5000); // 성공시에 백엔드 연결
  })
  .catch((err) => {
    console.log(err);
  });
