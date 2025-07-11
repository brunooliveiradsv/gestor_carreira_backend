// src/controladores/conquista.controlador.js
const conquistaServico = require('../servicos/conquista.servico'); // Importar o serviço de conquistas

exports.listarConquistasComProgresso = async (req, res, conexao) => {
  const { Usuario, Conquista, UsuarioConquista } = conexao.models;
  // O ID do usuário vem do middleware de autenticação
  const usuarioId = req.usuario.id;

  console.log(`Buscando todas as conquistas com progresso para o usuário com ID: ${usuarioId}`);

  try {
    // 1. Buscar todas as conquistas do catálogo (definições gerais)
    const catalogoConquistas = await Conquista.findAll({ order: [['nome', 'ASC']] });

    // 2. Buscar as conquistas que o usuário já desbloqueou, incluindo a data de desbloqueio
    // Usamos um findByPk no Usuario para carregar as associações de forma eficiente
    const usuarioComConquistas = await Usuario.findByPk(usuarioId, {
      attributes: [], // Não precisamos dos atributos do usuário aqui, apenas das conquistas associadas
      include: [{
        model: Conquista,
        as: 'conquistas',
        // 'through: { attributes: [...] }' garante que os dados da tabela ponte (UsuarioConquista)
        // como a data_desbloqueio, sejam incluídos na resposta.
        through: { attributes: ['data_desbloqueio'] } 
      }]
    });

    // Cria um mapa para acesso rápido às conquistas já desbloqueadas pelo usuário
    const minhasConquistasMap = new Map();
    if (usuarioComConquistas && usuarioComConquistas.conquistas) {
      usuarioComConquistas.conquistas.forEach(conquistaDesbloqueada => {
        minhasConquistasMap.set(conquistaDesbloqueada.id, {
          desbloqueada: true,
          data_desbloqueio: conquistaDesbloqueada.UsuarioConquista.data_desbloqueio // Acessa o atributo da tabela pivô
        });
      });
    }

    // 3. Processar cada conquista do catálogo para adicionar status, progresso e tipo de progresso
    const listaConquistasProcessada = [];
    for (const conquistaCatalogo of catalogoConquistas) {
      const statusUsuario = minhasConquistasMap.get(conquistaCatalogo.id);
      const desbloqueada = statusUsuario ? true : false;
      
      const tipoProgresso = conquistaServico.getTipoProgresso(conquistaCatalogo); // Obtém o tipo do serviço

      let progressoAtual = 0;
      let progressoTotal = conquistaCatalogo.valor_condicao || 1; // Usa valor_condicao como total

      // Se a conquista não estiver desbloqueada E não for de tipo binário, calcula o progresso atual
      if (!desbloqueada && tipoProgresso !== 'binario') {
        progressoAtual = await conquistaServico.calcularProgressoAtual(usuarioId, conquistaCatalogo.tipo_condicao, conexao);
        progressoAtual = Math.min(progressoAtual, progressoTotal); // Garante que o progresso não ultrapasse a meta
      } else if (desbloqueada) {
        progressoAtual = progressoTotal; // Se a conquista já foi desbloqueada, o progresso é 100%
      } else if (tipoProgresso === 'binario' && !desbloqueada) {
        // Para conquistas binárias não desbloqueadas, o progresso é 0 (esperando o evento)
        progressoAtual = 0;
        progressoTotal = 1; // Para binárias, a meta é 1 (ou fez ou não fez)
      }

      const porcentagemProgresso = progressoTotal > 0 ? (progressoAtual / progressoTotal) * 100 : 0;

      listaConquistasProcessada.push({
        ...conquistaCatalogo.toJSON(), // Converte o modelo Sequelize para um objeto JSON puro
        desbloqueada: desbloqueada,
        data_desbloqueio: statusUsuario?.data_desbloqueio,
        progresso_atual: progressoAtual,
        progresso_total: progressoTotal,
        porcentagem_progresso: porcentagemProgresso,
        tipo_progresso: tipoProgresso // Adiciona o tipo de progresso para o frontend
      });
    }

    // Opcional: Reordenar a lista final no backend antes de enviar para o frontend
    // Isso garante que a ordem já venha correta para o cliente
    listaConquistasProcessada.sort((a, b) => {
        // Desbloqueadas vêm primeiro
        if (a.desbloqueada !== b.desbloqueada) {
            return a.desbloqueada ? -1 : 1;
        }
        // Para conquistas não desbloqueadas:
        if (!a.desbloqueada && !b.desbloqueada) {
            // Coloca as conquistas binárias não desbloqueadas por último dentro do grupo de não desbloqueadas
            if (a.tipo_progresso === 'binario' && b.tipo_progresso !== 'binario') return 1;
            if (a.tipo_progresso !== 'binario' && b.tipo_progresso === 'binario') return -1;
            // Para as demais (monetárias, quantidade), ordena pela maior porcentagem de progresso
            return b.porcentagem_progresso - a.porcentagem_progresso;
        }
        // Fallback: ordena por nome alfabeticamente
        return a.nome.localeCompare(b.nome);
    });

    return res.status(200).json(listaConquistasProcessada);

  } catch (erro) {
    console.error("Erro ao listar conquistas com progresso:", erro);
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};