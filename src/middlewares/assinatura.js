// src/middlewares/assinatura.js

// Define a hierarquia dos planos. Quanto maior o número, maior o nível.
const HIERARQUIA_PLANOS = {
  free: 0,
  padrao: 1,
  premium: 2,
};

/**
 * Middleware para verificar o nível de assinatura do utilizador.
 * @param {('free'|'padrao'|'premium')} planoMinimo - O nível mínimo de plano necessário para aceder à rota.
 */
module.exports = (planoMinimo = 'padrao') => {
  return (req, res, next) => {
    const usuario = req.usuario;

    if (!usuario) {
      return res.status(401).json({ mensagem: "Acesso negado. Utilizador não autenticado." });
    }

    const nivelUtilizador = HIERARQUIA_PLANOS[usuario.plano] ?? -1;
    const nivelExigido = HIERARQUIA_PLANOS[planoMinimo];

    // Permite o acesso se o utilizador tiver um plano ativo com nível suficiente
    if (usuario.status_assinatura === 'ativa' && nivelUtilizador >= nivelExigido) {
      return next();
    }
    
    // Permite o acesso se o utilizador estiver em período de teste (que geralmente é do plano premium)
    if (usuario.status_assinatura === 'teste') {
      const hoje = new Date();
      const dataTerminoTeste = new Date(usuario.teste_termina_em);

      if (dataTerminoTeste > hoje) {
        return next();
      }
    }

    // Bloqueia o acesso se não cumprir os requisitos
    return res.status(403).json({
      mensagem: `Acesso negado. Esta funcionalidade requer, no mínimo, o Plano ${planoMinimo}.`,
      upgradeNecessario: true
    });
  };
};