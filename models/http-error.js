class HttpError extends Error {
  constructor(message, errorCdoe) {
    super(message);
    this.code = errorCdoe;
  }
}

module.exports = HttpError;
