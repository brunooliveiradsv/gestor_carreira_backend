// src/middlewares/assinatura.js

/**
 * Middleware para verificar se o usuário possui uma assinatura ativa ou em teste.
 * Deve ser usado APÓS o middleware de autenticação.
 */
module.exports = () => {
  return (req, res, next) => {
    // Pega o usuário que foi adicionado à requisição pelo middleware de autenticação
    const usuario = req.usuario;

    // Se por algum motivo o usuário não existir, bloqueia o acesso
    if (!usuario) {
      return res.status(401).json({ mensagem: "Acesso negado. Usuário não autenticado." });
    }

    const statusValido = usuario.status_assinatura === 'ativa' || usuario.status_assinatura === 'teste';

    // Se o status da assinatura for válido, permite que a requisição continue
    if (statusValido) {
      return next();
    }

    // Se não for válido, retorna um erro 403 (Forbidden)
    return res.status(403).json({ 
      mensagem: "Acesso negado. Esta funcionalidade requer uma assinatura ativa." 
    });
  };
};