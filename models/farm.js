const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const farmSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

// 모델의 이름 - 대문자 단수 / 참조할 스키마 이름
// 컬렉션 - 소문자 복수
module.exports = mongoose.model("Farm", farmSchema);
