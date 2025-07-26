// src/rotas/auth.rotas.js
const express = require('express');
const passport = require('passport');
// ... authControlador a ser criado

module.exports = (conexao) => {
  const roteador = express.Router();

  // Inicia o fluxo de autenticação do Google
  roteador.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  // Callback do Google: para onde o utilizador é redirecionado após o login
  roteador.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    // aqui chamaria uma função do seu controlador para gerar e enviar o JWT do fã
    // ex: (req, res) => authControlador.gerarTokenFa(req, res) 
  );

  return roteador;
};