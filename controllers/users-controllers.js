const { v4: uuidv4 } = require("uuid");
const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");

// DB
const User = require("../models/user");

// 1. 조회
const getUsers = async (req, res, next) => {
  let users;

  try {
    users = await User.find({}, "-password"); // email name만
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed. Please try again later",
      500
    );
    return next(error);
  }

  res.json({
    users: users.map((user) => user.toObject({ getters: true })),
  });
};

// 2. 회원가입
const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    //throw new HttpError("Invalid inputs passed, please check your data", 422);
    // 비동기 작업이라 작동하지 않음
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { name, email, password } = req.body;

  // 스키마에서 반환하는 validation 이 존재함
  // 비동기
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try agian later",
      500
    );
    return next(error);
  }

  // 이미 user email 존재하는 경우
  if (existingUser) {
    const error = new HttpError(
      "User exists already, please login instead",
      422
    );
    return next(error);
  }

  // 스키마 형태로 면경
  const createdUser = new User({
    name,
    email,
    image:
      "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.eatright.org%2Ffood%2Fplanning%2Ffood-security-and-sustainability%2Fknow-your-farmer-know-their-farm&psig=AOvVaw2kO_omOCf91OoZ-HVQExGx&ust=1744411217821000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCNC17arEzowDFQAAAAAdAAAAABAE",
    password,
    farms: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      "Signing up failed2, please try agian later",
      500
    );
    // 오류 시작시 중단을 위해 next - app 미들웨어로 넘김
    return next(error);
  }
  // mongo 객체를 js 로 변환
  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

// 3. 로그인
const login = async (req, res, next) => {
  const { email, password } = req.body;

  // 이메일 검증
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Login in failed, please try agian later", 500);
    return next(error);
  }

  // 아이디 != 비번
  if (!existingUser || existingUser.password !== password)
    throw new HttpError("Invalid credentials, could not log you in", 401);

  res.json({
    message: "Logged in",
    user: existingUser.toObject({ getters: true }),
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
