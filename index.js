const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const HTTP_OK_STATUS = 200;
const HTTP_ERROR_STATUS = 404;

// Garante que o acesso será fixo na porta: 3000
const APP_TRUST_PORT = '3000';

const fs = require('fs').promises;

const getTalkers = async () => {
  try {
      return await fs.readFile('./talker.json', 'utf-8');
  } catch (error) {
    return error;
  }
};

app.get('/talker', async (req, res) => {
  const talkerList = await getTalkers();
  if (!talkerList) {
    return res.status(HTTP_OK_STATUS).json([]);
  }
  res.status(HTTP_OK_STATUS).json(JSON.parse(talkerList));
});

app.get('/talker/:id', async (req, res) => {
  const { id } = req.params;

  const talkerList = await getTalkers();

  if (!talkerList) {
    return res.status(HTTP_OK_STATUS).json([]);
  }

  const talkerById = JSON.parse(talkerList).find((talkerSearch) => talkerSearch.id === +id);
  if (!talkerById) {
    return res.status(HTTP_ERROR_STATUS).json({ message: 'Pessoa palestrante não encontrada' });
  }
  res.status(HTTP_OK_STATUS).json(JSON.parse(talkerById));
});

app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

app.listen(APP_TRUST_PORT, () => {
  console.log('Online');
});
