// src/middlewares/limiteRecurso.js

const LIMITES_PLANOS = {
  free: { setlists: 1, contatos: 1, equipamentos: 1 },
  padrao: { setlists: 5, contatos: 5, equipamentos: 5 },
};

/**
 * Middleware para verificar se o utilizador atingiu o limite de criação
 * de um determinado recurso com base no seu plano.
 * @param {('setlists'|'contatos'|'equipamentos')} recurso - O nome da tabela do recurso.
 * @param {Object} modelo - O modelo do Sequelize a ser contado (ex: conexao.models.Setlist).
 */
module.exports = (recurso, modelo) => {
  return async (req, res, next) => {
    const { plano } = req.usuario;
    const usuarioId = req.usuario.id;

    // Planos premium ou que não estão nos limites não são verificados
    if (plano === 'premium' || !LIMITES_PLANOS[plano]) {
      return next();
    }

    try {
      const limite = LIMITES_PLANOS[plano][recurso];
      const contagemAtual = await modelo.count({ where: { usuario_id: usuarioId } });

      if (contagemAtual >= limite) {
        return res.status(403).json({
          mensagem: `Você atingiu o limite de ${limite} ${recurso} para o seu plano. Faça um upgrade para adicionar mais.`,
          upgradeNecessario: true,
        });
      }

      return next();
    } catch (error) {
      console.error(`Erro ao verificar limite para o recurso ${recurso}:`, error);
      return res.status(500).json({ mensagem: 'Ocorreu um erro no servidor ao verificar os limites do seu plano.' });
    }
  };
};