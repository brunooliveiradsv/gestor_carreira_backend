// src/middlewares/autenticacao.js
const jwt = require('jsonwebtoken');

// AGORA EXPORTAMOS UMA FUNÇÃO QUE RECEBE A CONEXÃO
module.exports = (conexao) => {
  // E ELA RETORNA A LÓGICA DO MIDDLEWARE QUE JÁ TÍNHAMOS
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ mensagem: 'Token não fornecido.' });
    }

    const [, token] = authHeader.split(' ');

    try {
      const decodificado = jwt.verify(token, process.env.JWT_SECRET,);
      const idDoUsuario = decodificado.id;

      // Agora o middleware tem acesso à conexão para buscar o usuário
      const { Usuario } = conexao.models;
      const usuario = await Usuario.findByPk(idDoUsuario);

      if (!usuario) {
        return res.status(401).json({ mensagem: 'Token inválido (usuário não existe).' });
      }

      req.usuario = usuario;
      return next();
    } catch (erro) {
      return res.status(401).json({ mensagem: 'Token inválido.' });
    }
  };
};