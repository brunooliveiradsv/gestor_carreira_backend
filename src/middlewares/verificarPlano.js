// src/middlewares/verificarPlano.js

const HIERARQUIA_PLANOS = {
  free: 0,
  padrao: 1,
  premium: 2,
};

/**
 * Middleware para verificar se o plano do utilizador
 * atende a um nível mínimo exigido.
 * @param {('free'|'padrao'|'premium')} planoMinimo - O plano mínimo necessário.
 */
module.exports = (planoMinimo) => {
  return (req, res, next) => {
    const usuario = req.usuario;
    const nivelUtilizador = HIERARQUIA_PLANOS[usuario.plano];
    const nivelExigido = HIERARQUIA_PLANOS[planoMinimo];

    if (usuario.status_assinatura === 'ativa' && nivelUtilizador >= nivelExigido) {
      return next(); // Tem permissão, continua
    }

    // Se não tiver permissão, bloqueia o acesso.
    return res.status(403).json({ 
      mensagem: `Acesso negado. Esta funcionalidade requer, no mínimo, o Plano ${planoMinimo}.`,
      upgradeNecessario: true
    });
  };
};