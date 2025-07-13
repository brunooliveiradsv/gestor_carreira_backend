// src/controladores/conquista.controlador.js
const conquistaServico = require('../servicos/conquista.servico');

exports.listarConquistasComProgresso = async (req, res, conexao) => {
  const { Usuario, Conquista } = conexao.models;
  const usuarioId = req.usuario.id;

  console.log(`Buscando todas as conquistas com progresso para o usuário com ID: ${usuarioId}`);

  try {
    const catalogoConquistas = await Conquista.findAll({ order: [['nome', 'ASC']] });

    const usuarioComConquistas = await Usuario.findByPk(usuarioId, {
      attributes: [],
      include: [{
        model: Conquista,
        as: 'conquistas',
        through: { attributes: ['data_desbloqueio'] } 
      }]
    });

    const minhasConquistasMap = new Map();
    if (usuarioComConquistas && usuarioComConquistas.conquistas) {
      usuarioComConquistas.conquistas.forEach(conquistaDesbloqueada => {
        minhasConquistasMap.set(conquistaDesbloqueada.id, {
          desbloqueada: true,
          data_desbloqueio: conquistaDesbloqueada.UsuarioConquista.data_desbloqueio
        });
      });
    }

    const listaConquistasProcessada = [];
    for (const conquistaCatalogo of catalogoConquistas) {
      const statusUsuario = minhasConquistasMap.get(conquistaCatalogo.id);
      const desbloqueada = statusUsuario ? true : false;
      
      const tipoProgresso = conquistaServico.getTipoProgresso(conquistaCatalogo);

      let progressoAtual = 0;
      let progressoTotal = conquistaCatalogo.valor_condicao || 1;

      if (!desbloqueada && tipoProgresso !== 'binario') {
        progressoAtual = await conquistaServico.calcularProgressoAtual(usuarioId, conquistaCatalogo.tipo_condicao, conexao);
        progressoAtual = Math.min(progressoAtual, progressoTotal);
      } else if (desbloqueada) {
        progressoAtual = progressoTotal;
      } else if (tipoProgresso === 'binario' && !desbloqueada) {
        progressoAtual = 0;
        progressoTotal = 1;
      }

      const porcentagemProgresso = progressoTotal > 0 ? (progressoAtual / progressoTotal) * 100 : 0;

      listaConquistasProcessada.push({
        ...conquistaCatalogo.toJSON(),
        desbloqueada: desbloqueada,
        data_desbloqueio: statusUsuario?.data_desbloqueio,
        progresso_atual: progressoAtual,
        progresso_total: progressoTotal,
        porcentagem_progresso: porcentagemProgresso,
        tipo_progresso: tipoProgresso
      });
    }

    listaConquistasProcessada.sort((a, b) => {
        if (a.desbloqueada !== b.desbloqueada) {
            return a.desbloqueada ? -1 : 1;
        }
        if (!a.desbloqueada && !b.desbloqueada) {
            if (a.tipo_progresso === 'binario' && b.tipo_progresso !== 'binario') return 1;
            if (a.tipo_progresso !== 'binario' && b.tipo_progresso === 'binario') return -1;
            return b.porcentagem_progresso - a.porcentagem_progresso;
        }
        return a.nome.localeCompare(b.nome);
    });

    return res.status(200).json(listaConquistasProcessada);

  } catch (erro) {
    console.error("Erro ao listar conquistas com progresso:", erro);
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};

// --- NOVA FUNÇÃO PARA O DASHBOARD ---
exports.recentes = async (req, res, conexao) => {
    const { Conquista, UsuarioConquista } = conexao.models;
    const usuarioId = req.usuario.id;

    try {
        const conquistasRecentes = await UsuarioConquista.findAll({
            where: { usuario_id: usuarioId },
            limit: 3,
            order: [['data_desbloqueio', 'DESC']],
            include: [{
                model: Conquista,
                as: 'conquista',
                attributes: ['nome', 'descricao'] // Apenas os campos que precisamos
            }]
        });

        // Mapeia o resultado para um formato mais limpo para o frontend
        const resultadoFormatado = conquistasRecentes.map(uc => ({
            id: uc.conquista.id,
            nome: uc.conquista.nome,
            descricao: uc.conquista.descricao,
            data_desbloqueio: uc.data_desbloqueio,
        }));

        return res.status(200).json(resultadoFormatado);

    } catch (erro) {
        console.error("Erro ao buscar conquistas recentes:", erro);
        return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
    }
};