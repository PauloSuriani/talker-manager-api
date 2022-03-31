const crypto = require('crypto');

const HTTP_OK_STATUS = 200;

function newToken(req, res) {
  const token = crypto.randomBytes(8).toString('hex');

  res.status(HTTP_OK_STATUS).json({ token });
}

module.exports = newToken;