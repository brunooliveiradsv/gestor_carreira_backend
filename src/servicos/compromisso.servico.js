// src/servicos/compromisso.servico.js
const conquistaServico = require('./conquista.servico.js');

exports.processarCompromissoRealizado = async (compromisso, conexao) => {
  const { Transacao } = conexao.models;
  const usuarioId = compromisso.usuario_id;
  const idDoCompromisso = compromisso.id;

  try {
    console.log(`Processando automações para o compromisso ID: ${idDoCompromisso}`);
    
    // Gatilho para conquistas de shows
    if (compromisso.tipo === 'Show') {
      conquistaServico.verificarEConcederConquistas(usuarioId, 'CONTAGEM_SHOWS_REALIZADOS', conexao);
    }
    
    // --- Automação financeira ---

    // 1. Lançar a RECEITA (Cachê)
    if (compromisso.valor_cache && parseFloat(compromisso.valor_cache) > 0) {
      // Verifica se a receita para este show já foi lançada, para evitar duplicatas
      const receitaExistente = await Transacao.findOne({ 
        where: { compromisso_id: idDoCompromisso, tipo: 'receita' }
      });

      if (!receitaExistente) {
        await Transacao.create({
          usuario_id: usuarioId,
          compromisso_id: idDoCompromisso,
          descricao: `Receita do compromisso: ${compromisso.nome_evento}`,
          valor: compromisso.valor_cache,
          tipo: 'receita',
          data: compromisso.data,
        });
        console.log(`Receita do compromisso ${idDoCompromisso} lançada.`);
        // Dispara os gatilhos de conquista apenas quando a receita é criada
        conquistaServico.verificarEConcederConquistas(usuarioId, 'PRIMEIRA_RECEITA_SHOW', conexao);
        conquistaServico.verificarEConcederConquistas(usuarioId, 'TOTAL_RECEITAS', conexao);
      }
    }
    
    // 2. Lançar as DESPESAS
    if (compromisso.despesas && compromisso.despesas.length > 0) {
      // Verifica se as despesas para este show já foram lançadas
      const despesasExistentes = await Transacao.count({
        where: { compromisso_id: idDoCompromisso, tipo: 'despesa' }
      });

      if (despesasExistentes === 0) {
        const promessasDeDespesas = compromisso.despesas.map(d => 
          Transacao.create({
            usuario_id: usuarioId,
            compromisso_id: idDoCompromisso,
            descricao: d.descricao,
            valor: d.valor,
            tipo: 'despesa',
            data: compromisso.data,
          })
        );
        await Promise.all(promessasDeDespesas);
        console.log(`${promessasDeDespesas.length} despesa(s) do compromisso ${idDoCompromisso} lançada(s).`);
      }
    }

  } catch (erro) {
    console.error(`Erro ao processar automação do compromisso ${compromisso.id}:`, erro);
  }
};