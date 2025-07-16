const express = require("express");
const { check } = require("express-validator");

const farmController = require("../controllers/farms-controllers");

const router = express.Router();
// 특수객체가 express 객체에 있음
// 함수처럼 호출

// 0. farms 전체 정보 조회(추가 수정 필요)
router.get("/", farmController.getFarms);

// 1. farm id 별 상세 정보
router.get("/:fid", farmController.getFarmById);

// 2. user 별 farm 상세 정보 - 라우팅의 순서가 중요할 수 있음 (순서대로 가로챔)
router.get("/user/:uid", farmController.getFarmsByUserId);

// 3.farm 등록
// 컨트롤러가 실행되기 전에 수행됨
router.post(
  "/",
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  farmController.createFarm
);

// 4. farm 수정 (get과 url 이 동일하더라도 문제X)
router.patch(
  "/:fid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  farmController.updateFarm
);

// 5. 삭제
router.delete("/:fid", farmController.deleteFarm);

// app 으로 보내기
module.exports = router;
