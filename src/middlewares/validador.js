// src/middlewares/validador.js
const { validationResult } = require('express-validator');

const validar = (req, res, next) => {
  // Executa a validação e obtém os erros
  const erros = validationResult(req);

  // Se não houver erros, avança para o próximo middleware (ou o controlador)
  if (erros.isEmpty()) {
    return next();
  }

  // Se houver erros, extrai as mensagens e envia uma resposta 400 (Bad Request)
  const errosExtraidos = [];
  erros.array().map(err => errosExtraidos.push({ [err.path]: err.msg }));

  return res.status(400).json({
    erros: errosExtraidos,
  });
};

module.exports = validar;