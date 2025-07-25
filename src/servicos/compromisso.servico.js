// src/servicos/compromisso.servico.js
const conquistaServico = require('./conquista.servico.js');
const { Op } = require('sequelize');

exports.processarCompromissoRealizado = async (compromisso, conexao) => {
  const { Transacao, Setlist, Musica, SetlistMusica } = conexao.models;
  const usuarioId = compromisso.usuario_id;
  const idDoCompromisso = compromisso.id;

  try {
    console.log(`Processando automações para o compromisso ID: ${idDoCompromisso}`);
    
    if (compromisso.tipo === 'Show') {
      conquistaServico.verificarEConcederConquistas(usuarioId, 'CONTAGEM_SHOWS_REALIZADOS', conexao);
    }
    
    // --- Automação financeira (lógica existente) ---
    if (compromisso.valor_cache && parseFloat(compromisso.valor_cache) > 0) {
      const receitaExistente = await Transacao.findOne({ where: { compromisso_id: idDoCompromisso, tipo: 'receita' }});
      if (!receitaExistente) {
        await Transacao.create({
          usuario_id: usuarioId, compromisso_id: idDoCompromisso,
          descricao: `Receita do compromisso: ${compromisso.nome_evento}`,
          valor: compromisso.valor_cache, tipo: 'receita', data: compromisso.data,
        });
        console.log(`Receita do compromisso ${idDoCompromisso} lançada.`);
        conquistaServico.verificarEConcederConquistas(usuarioId, 'PRIMEIRA_RECEITA_SHOW', conexao);
        conquistaServico.verificarEConcederConquistas(usuarioId, 'TOTAL_RECEITAS', conexao);
      }
    }
    
    if (compromisso.despesas && compromisso.despesas.length > 0) {
      // ... (lógica de despesas existente)
    }

    // --- NOVA LÓGICA DE POPULARIDADE DE MÚSICAS ---
    if (compromisso.setlist_id) {
        console.log(`Compromisso ${idDoCompromisso} tem um setlist. Atualizando popularidade das músicas...`);
        
        // Encontra todos os IDs das músicas no setlist associado
        const musicasNoSetlist = await SetlistMusica.findAll({
            where: { setlist_id: compromisso.setlist_id },
            attributes: ['musica_id']
        });

        const idsDasMusicas = musicasNoSetlist.map(m => m.musica_id);

        if (idsDasMusicas.length > 0) {
            // Incrementa a popularidade e atualiza a data da última vez tocada
            // para todas as músicas encontradas, de uma só vez.
            await Musica.update(
                {
                    popularidade: conexao.literal('popularidade + 1'),
                    ultima_vez_tocada: compromisso.data
                },
                {
                    where: {
                        id: { [Op.in]: idsDasMusicas },
                        usuario_id: usuarioId // Garante que só atualiza as músicas do próprio utilizador
                    }
                }
            );
            console.log(`${idsDasMusicas.length} músicas tiveram sua popularidade atualizada.`);
        }
    }
    // --- FIM DA NOVA LÓGICA ---

  } catch (erro) {
    console.error(`Erro ao processar automação do compromisso ${compromisso.id}:`, erro);
  }
};