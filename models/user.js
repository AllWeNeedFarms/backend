const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  image: { type: String, required: true },

  // farm 과의 관계
  // 한 사용자는 여러개의 농장 등록 가능 배열
  farms: [{ type: mongoose.Types.ObjectId, required: true, ref: "Farm" }],
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
