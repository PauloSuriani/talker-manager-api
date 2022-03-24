const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const HTTP_OK_STATUS = 200;
const HTTP_ERROR_STATUS = 404;

// Garante que o acesso será fixo na porta: 3000
const APP_TRUST_PORT = '3000';

const fs = require('fs').promises;

app.get('/talker', (req, res) => {
  try { 
    const talkerList = fs.readFile('./talker.json', 'utf8');
    return res.status(HTTP_OK_STATUS).json(JSON.parse(talkerList));
  } catch (error) {
    return res.status(HTTP_ERROR_STATUS).json([]);
  }
});

app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

app.listen(APP_TRUST_PORT, () => {
  console.log('Online');
});
