// 에러
const HttpError = require("../models/http-error");

// 검증 연결
const { validationResult } = require("express-validator");

// api 지도 연결
const getCoordsForAddress = require("../util/location");

// db 스키마 사용
const Farm = require("../models/farm");
const User = require("../models/user");
const mongoose = require("mongoose");

/// 1-1. 전체 보기
const getFarms = async (req, res, next) => {
  let farms;
  try {
    // find() 는 Promise 객체를 반환함
    // 모든 farm을 가져옴
    farms = await Farm.find({});
  } catch (err) {
    const error = new HttpError("Fetching farms failed, please try again", 500);
    return next(error); // get에서 생긴 오류
  }
  res.json({
    farms: farms.map((farm) => farm.toObject({ getters: true })),
  });
};

// 1-2. 상세보기
const getFarmById = async (req, res, next) => {
  const farmId = req.params.fid;
  let farm;

  try {
    farm = await Farm.findById(farmId); // 완벽한 Promise 객체 아님
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a farm",
      500
    );
    return next(error); // get에서 생긴 오류
  }

  if (!farm) {
    // next() 비동기 코드가 있으면
    // throw 동기
    const error = new HttpError(
      "Could not find a place for the provided id",
      404
    );
    return next(error);
    // throw error; // return 안써도 됨
  }

  res.json({ farm: farm.toObject({ getters: true }) });
};

// 2. 조회 - 아이디별
const getFarmsByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let userWithFarms;
  try {
    // Promise 를 반환하지 않지만, 비동기 작업 가능함
    // id 값이 아닌 것으로 찾고 싶을 때
    // * populate 로 모든 farms을 뽑아낼 수 있음
    userWithFarms = await User.findById(userId).populate("farms");
    //farms = await Farm.find({ creator: userId });
  } catch (err) {
    return next(new HttpError("Fetching farms failed, please try again", 500));
  }

  // 배열이 반환됨
  if (!userWithFarms || userWithFarms.farms.length === 0) {
    return next(
      new HttpError("Could not find a place for the provided user id", 404)
    ); // next는 중단이 없기 때문에 throw
  }
  // Object를 사용할 수 없음
  // Array를 반환함 , id에 _제거하기 위해 getters true
  res.json({
    farms: userWithFarms.farms.map((farm) => farm.toObject({ getters: true })),
  });
};

// 3. 등록
// body에 값을 들어가야함
const createFarm = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { title, description, address, creator } = req.body;
  // 클라이언트에서 넘어온 값

  let coordinates;

  // 비동기 모듈의 에러 잡기
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    next(error); // error 던짐
  }

  // DB 스키마 구조로 변경
  const createdFarm = new Farm({
    title,
    description,
    address,
    location: coordinates,
    image:
      "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.seattletimes.com%2Flife%2Ffood-drink%2Fa-guide-to-sweet-potato-varieties-how-to-choose-prep-and-store-them%2F&psig=AOvVaw0YzoeCRhCz4StWDB6fTt0t&ust=1744237893854000&source=images&cd=vfe&opi=89978449&ved=0CBAQjRxqFwoTCMiu1NK-yYwDFQAAAAAdAAAAABAE",
    // mongo에 저장된 id가 저장됨
    creator,
  });

  // 농장 1개당 1개의 user
  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError("Creating farm failed, please try again", 500);

    // 오류 시작시 중단을 위해 next - app 미들웨어로 넘김
    return next(error);
  }

  // 매칭되는 user가 없다며 등록하지 못함
  if (!user) {
    const error = new HttpError("Could not find user for provided id", 400);
    return next(error);
  }

  console.log(user);

  // Promise 객체
  try {
    // 여러개의 연산이 함께
    // 다른 연산과 무관한 것에 실패 -> 다른 곳도 바꾸지 못하게
    // 트랜잭션과 세션 (세션 위에서 트랜잭션이 이뤄짐)
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdFarm.save({ session: sess }); // 자동으로 id 생성
    user.farms.push(createdFarm);
    await user.save({ session: sess });
    await sess.commitTransaction();
    // 실패하면 모든 트랜잭션을 롤백하게 됨
    // 트랜잭션은 컬렉션 직점
  } catch (err) {
    const error = new HttpError("Creating farm failed, please try again", 500);

    // 오류 시작시 중단을 위해 next - app 미들웨어로 넘김
    return next(error);
  }

  res.status(201).json({ farm: createdFarm });
  // 성공적으로 새로운 것 반환
};

// 4. 수정 - body
const updateFarm = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { title, description } = req.body; // 구조분해 할당
  const farmId = req.params.fid; // url 파라미터

  let farm;

  try {
    farm = await Farm.findById(farmId); // 완벽한 Promise 객체 아님
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a farm",
      500
    );
    return next(error); // get에서 생긴 오류
  }

  farm.title = title;
  farm.description = description;

  try {
    await farm.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update farm",
      500
    );

    // 오류 시작시 중단을 위해 next - app 미들웨어로 넘김
    return next(error);
  }

  res.status(200).json({ farm: farm.toObject({ getters: true }) });
};

// 5. 삭제
const deleteFarm = async (req, res, next) => {
  const farmId = req.params.fid;

  let farm;

  try {
    // 해당 농장을 등록한 user를 찾아야함
    // ref 로 연결된 것에 한해서 다른 컬렉션에 저장된 문서 참조
    // 그 컬렉션에 있는 다른 기존 문서의 데이터를 가지고 작업이 가능
    farm = await Farm.findById(farmId).populate("creator"); // 완벽한 Promise 객체 아님
  } catch (err) {
    const error = new HttpError(
      "Something went wrong to find a deleted farm",
      500
    );
    return next(error); // get에서 생긴 오류
  }
  // farm 이 존재하는지

  if (!farm) {
    const error = new HttpError("Could not find farm for this id", 400);
    return next(error); // get에서 생긴 오류
  }

  // 다 -> 1 삭제 가능
  try {
    const sess = await mongoose.startSession(); // 세션 시작
    sess.startTransaction();

    await farm.deleteOne({ session: sess }); // 1. 농장 제거
    // 2. 사용자에 따른 농장 제거
    farm.creator.farms.pull(farm); // 자동으로 id를 제거

    await farm.creator.save({ session: sess });

    await sess.commitTransaction(); // 커밋
  } catch (err) {
    const error = new HttpError("Something went wrong to delete the farm", 500);
    return next(error);
  }

  res.status(200).json({ message: "Deleted Farm" });
};
exports.getFarms = getFarms; // 포인터
exports.getFarmById = getFarmById; // 포인터
exports.getFarmsByUserId = getFarmsByUserId;
exports.createFarm = createFarm;
exports.updateFarm = updateFarm;
exports.deleteFarm = deleteFarm;
