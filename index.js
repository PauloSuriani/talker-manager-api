const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
const HTTP_OK_STATUS = 200;
const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_ERROR_STATUS = 404;
const talkerJsonPath = './talker.json';

// Garante que o acesso será fixo na porta: 3000
const APP_TRUST_PORT = '3000';
const fs = require('fs').promises;
const newToken = require('./generateToken');

const getTalkers = async () => {
  try {
      return await fs.readFile(talkerJsonPath, 'utf-8');
  } catch (error) {
    return error;
  }
};

const formEmailValidation = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(HTTP_BAD_REQUEST).json({ message: 'O campo "email" é obrigatório' });
  }

  if (!(email.includes('@') && email.includes('.com'))) {
    return res.status(HTTP_BAD_REQUEST).json({ 
      message: 'O "email" deve ter o formato "email@email.com"' });
  }

  next();
};

const formPasswordValidation = (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return res.status(HTTP_BAD_REQUEST).json({ message: 'O campo "password" é obrigatório' });
  }
  if (password.length < 6) {
    return res.status(HTTP_BAD_REQUEST).json({ 
      message: 'O "password" deve ter pelo menos 6 caracteres' });
  }

  next();
};

const userTokenCheckUp = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(HTTP_UNAUTHORIZED).json({ message: 'Token não encontrado' });
  }
  if (authorization.length !== 16) {
    return res.status(HTTP_UNAUTHORIZED).json({ message: 'Token inválido' });
  }
  next();
};

const formNewTalkerNameValidation = (req, res, next) => {
  const { name } = req.body;

  if (!name) {
    return res.status(HTTP_BAD_REQUEST).json({ message: 'O campo "name" é obrigatório' });
  }
  if (name.length < 3) {
    return res.status(HTTP_BAD_REQUEST).json(
      { message: 'O "name" deve ter pelo menos 3 caracteres' },
    );
  }
  next();
};

const formNewTalkerWatchedAtValidation = (req, res, next) => {
  const { talk: { watchedAt } } = req.body;

  if (!watchedAt) {
    return res.status(HTTP_BAD_REQUEST)
    .json({ message: 'O campo "talk" é obrigatório e "watchedAt" e "rate" não podem ser vazios' });
  }
  const arrayFormatWatchDate = watchedAt.split('/');
  if (arrayFormatWatchDate[0].length !== 2 
    || arrayFormatWatchDate[1].length !== 2 || arrayFormatWatchDate[2].length !== 4) {
    return res.status(HTTP_BAD_REQUEST).json(
      { message: 'O campo "watchedAt" deve ter o formato "dd/mm/aaaa"' },
      );
  }
  next();
};

const formNewTalkerRateValidation = (req, res, next) => {
  const { talk: { rate } } = req.body;

  if (rate === undefined) {
    return res.status(HTTP_BAD_REQUEST)
    .json({ message: 'O campo "talk" é obrigatório e "watchedAt" e "rate" não podem ser vazios' });
  }

  const rateNumberParse = Number(rate);
  if (!(rateNumberParse > 0 && rateNumberParse < 6)) {
    return res.status(HTTP_BAD_REQUEST).json(
      { message: 'O campo "rate" deve ser um inteiro de 1 à 5' },
      );
  }
  next();
};

const ageValidation = (req, res, next) => {
  const { age } = req.body;

  if (!age) {
    return res.status(HTTP_BAD_REQUEST).json({ message: 'O campo "age" é obrigatório' });
  }
  if (age < 18) {
    return res.status(HTTP_BAD_REQUEST).json(
      { message: 'A pessoa palestrante deve ser maior de idade' },
      );
  }

  next();
};

const talkValidation = (req, res, next) => {
  const { talk } = req.body;

  if (!talk) {
    return res.status(HTTP_BAD_REQUEST)
    .json({ message: 'O campo "talk" é obrigatório e "watchedAt" e "rate" não podem ser vazios' });
  }

  next();
};

const formNewTalkerValidation = async (req, res) => {
  const { name, age, talk, watchedAt, rate } = req.body;

  const dataTalkers = await getTalkers().then((data) => JSON.parse(data));
  const obj = { name, age, id: dataTalkers.length + 1, talk, watchedAt, rate };
  dataTalkers.push(obj);
  await fs.writeFile(talkerJsonPath, JSON.stringify(dataTalkers));
  return res.status(HTTP_CREATED).json(obj);
};

const formTalkerIdValidation = async (req, res) => {
  const { id } = req.params;
  const { name, age, talk: { watchedAt, rate } } = req.body;

  const talkersSearch = await getTalkers().then((data) => JSON.parse(data));
  const talkersIndexAux = talkersSearch.findIndex((data) => data.id === Number(id));

  talkersSearch[talkersIndexAux] = { ...talkersSearch[talkersIndexAux], 
    name, 
    age, 
    talk: { watchedAt, rate } };

  await fs.writeFile(talkerJsonPath, JSON.stringify(talkersSearch));

  return res.status(HTTP_OK_STATUS).json(talkersSearch[talkersIndexAux]);
};

const talkerDeleteCall = async (req, res) => {
  const { id } = req.params;

  const talkersSearch = await getTalkers().then((data) => JSON.parse(data));

  const talkersIndexAux = talkersSearch.findIndex((data) => data.id === Number(id));

  talkersSearch.splice(talkersIndexAux, 1);

  await fs.writeFile(talkerJsonPath, JSON.stringify(talkersSearch));

  res.status(HTTP_NO_CONTENT).json(talkersSearch[talkersIndexAux]);
};

app.get('/talker', async (req, res) => {
  const talkerList = await getTalkers();
  if (!talkerList) {
    return res.status(HTTP_OK_STATUS).json([]);
  }
  res.status(HTTP_OK_STATUS).json(JSON.parse(talkerList));
});

app.get('/talker/search', userTokenCheckUp, async (req, res) => {
  const { q } = req.query;
  const talkers = await getTalkers();
  if (!talkers) {
    return res.status(HTTP_UNAUTHORIZED).json({ message: 'talker not found' });
  }
  const talkersList = JSON.parse(talkers);
  return res.status(HTTP_OK_STATUS).json(talkersList
    .filter(((talker) => talker.name.includes(q))));
});

app.get('/talker/:id', async (req, res) => {
  const talkerList = await getTalkers();
  const { id } = req.params;
  const talkerById = JSON.parse(talkerList);
  const foundTalker = talkerById.find((talkerSearch) => talkerSearch.id === +id);
  if (!foundTalker) {
    return res.status(HTTP_ERROR_STATUS).json({ message: 'Pessoa palestrante não encontrada' });
  }
  res.status(HTTP_OK_STATUS).json(foundTalker);
});

app.post('/login', formEmailValidation, formPasswordValidation, newToken);

app.post('/talker', 
  userTokenCheckUp,
  talkValidation, 
  formNewTalkerWatchedAtValidation, 
  formNewTalkerNameValidation,
  ageValidation,
  formNewTalkerRateValidation,
  formNewTalkerValidation);

app.put('/talker/:id', 
  userTokenCheckUp, 
  formNewTalkerNameValidation, 
  ageValidation, 
  talkValidation, 
  formNewTalkerWatchedAtValidation,
  formNewTalkerRateValidation, 
  formTalkerIdValidation);
  
app.delete('/talker/:id', userTokenCheckUp, talkerDeleteCall);

app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

app.listen(APP_TRUST_PORT, () => {
  console.log('Online');
});
