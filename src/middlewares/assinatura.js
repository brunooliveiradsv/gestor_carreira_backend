// src/middlewares/assinatura.js

/**
 * Middleware para verificar se o usuário possui uma assinatura ativa ou em teste.
 * Deve ser usado APÓS o middleware de autenticação.
 */
module.exports = () => {
  return (req, res, next) => {
    const usuario = req.usuario;

    if (!usuario) {
      return res.status(401).json({ mensagem: "Acesso negado. Usuário não autenticado." });
    }

    // Verifica se a assinatura está 'ativa'
    if (usuario.status_assinatura === 'ativa') {
      return next(); // Permite o acesso
    }

    // Verifica se está em 'teste' E se a data do teste ainda é válida
    if (usuario.status_assinatura === 'teste') {
      const hoje = new Date();
      const dataTerminoTeste = new Date(usuario.teste_termina_em);

      if (dataTerminoTeste > hoje) {
        return next(); // Permite o acesso, pois o teste ainda não acabou
      }
    }

    // Se nenhuma das condições acima for atendida, o acesso é bloqueado.
    return res.status(403).json({ 
      mensagem: "Acesso negado. Esta funcionalidade requer uma assinatura ativa.",
      assinaturaExpirada: true // Enviamos uma flag para o frontend saber o motivo
    });
  };
};