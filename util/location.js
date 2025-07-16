// 백엔드 끼리 연결
const axios = require("axios");

// 지도 api key
const API_KEY = "";

const HttpError = require("../models/http-error");

// 더미
async function getCoordsForAddress(address) {
  return { lat: 34.4928221, lng: 126.494087 };

  // const response = await axios.get(``); // api 주소

  // const data = response.data;
  // if (!data || data.stauts === "ZERO_RESULTS") {
  //   // 구글에서 받음
  //   const error = new HttpError(
  //     "Could not find location for the specified address",
  //     422
  //   );
  //   throw error;
  // }

  // const coordinates = data.result[0].geometry.location;
  // return coordinates;
}

module.exports = getCoordsForAddress;
