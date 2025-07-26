// src/middlewares/authFa.js
const jwt = require('jsonwebtoken');

module.exports = (conexao) => {
  return async (req, res, next) => {
    // Usamos um cabeçalho diferente para o token do fã para não conflitar com o do artista
    const authHeader = req.headers['authorization-fan'];

    if (!authHeader) {
      return res.status(401).json({ mensagem: 'Acesso negado. Faça login como fã para interagir.' });
    }

    const [, token] = authHeader.split(' ');

    try {
      const decodificado = jwt.verify(token, process.env.JWT_SECRET);
      
      // Adiciona os dados do fã (do payload do token) ao request
      req.fa = { id: decodificado.id, nome: decodificado.nome, email: decodificado.email };
      
      return next();
    } catch (erro) {
      return res.status(401).json({ mensagem: 'Token de fã inválido ou expirado.' });
    }
  };
};