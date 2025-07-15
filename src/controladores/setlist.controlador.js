// src/controladores/setlist.controlador.js
const { Op } = require('sequelize');
const conquistaServico = require('../servicos/conquista.servico');

// --- FUNÇÕES DO DASHBOARD ---

exports.estatisticas = async (req, res, conexao) => {
  const { Musica, Setlist, Compromisso } = conexao.models;
  const usuarioId = req.usuario.id;

  try {
    const totalMusicas = await Musica.count({ where: { usuario_id: usuarioId } });
    const totalSetlists = await Setlist.count({ where: { usuario_id: usuarioId } });
    
    const proximoShow = await Compromisso.findOne({
      where: {
        usuario_id: usuarioId,
        data: { [Op.gte]: new Date() }, // Data maior ou igual a hoje
        status: 'Agendado'
      },
      order: [['data', 'ASC']],
      include: [{ model: Setlist, as: 'setlist' }]
    });

    return res.status(200).json({
      totalMusicas,
      totalSetlists,
      proximoShow
    });

  } catch (erro) {
    console.error("Erro ao buscar estatísticas do repertório:", erro);
    return res.status(500).json({ mensagem: "Erro ao buscar estatísticas." });
  }
};

// --- CRUD BÁSICO DE SETLISTS ---

exports.criar = async (req, res, conexao) => {
  const { Setlist } = conexao.models;
  const { nome } = req.body;
  const usuarioId = req.usuario.id;

  if (!nome) {
    return res.status(400).json({ mensagem: "O nome do setlist é obrigatório." });
  }

  try {
    const novoSetlist = await Setlist.create({ nome, usuario_id: usuarioId });
    
    conquistaServico.verificarEConcederConquistas(usuarioId, 'CONTAGEM_REPERTORIOS', conexao);
    conquistaServico.verificarEConcederConquistas(usuarioId, 'PRIMEIRO_REPERTORIO_CRIADO', conexao);
    
    return res.status(201).json(novoSetlist);
  } catch (erro) {
    return res.status(400).json({ mensagem: "Erro ao criar setlist." });
  }
};

exports.listar = async (req, res, conexao) => {
  const { Setlist } = conexao.models;
  const usuarioId = req.usuario.id;
  try {
    const setlists = await Setlist.findAll({
      where: { usuario_id: usuarioId },
      order: [['nome', 'ASC']]
    });
    return res.status(200).json(setlists);
  } catch (erro) {
    return res.status(500).json({ mensagem: "Erro ao listar setlists." });
  }
};

exports.buscarPorId = async (req, res, conexao) => {
  const { Setlist, Musica } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;

  try {
    const setlist = await Setlist.findOne({
      where: { id, usuario_id: usuarioId },
      include: [{
        model: Musica,
        as: 'musicas',
        through: { attributes: ['ordem'] } // Inclui o campo 'ordem' da tabela de ligação
      }]
    });

    if (!setlist) {
      return res.status(404).json({ mensagem: "Setlist não encontrado." });
    }

    // Ordena as músicas com base no campo 'ordem'
    setlist.musicas.sort((a, b) => a.setlist_musicas.ordem - b.setlist_musicas.ordem);

    return res.status(200).json(setlist);
  } catch (erro) {
    console.error("Erro ao buscar setlist por ID:", erro);
    return res.status(500).json({ mensagem: "Erro ao buscar setlist." });
  }
};

exports.atualizar = async (req, res, conexao) => {
  const { Setlist } = conexao.models;
  const { id } = req.params;
  const { nome, notas_adicionais } = req.body;
  const usuarioId = req.usuario.id;

  try {
    const [updated] = await Setlist.update({ nome, notas_adicionais }, { where: { id, usuario_id: usuarioId } });
    if (updated) {
      const setlistAtualizado = await Setlist.findByPk(id);
      return res.status(200).json(setlistAtualizado);
    }
    return res.status(404).json({ mensagem: "Setlist não encontrado." });
  } catch (erro) {
    return res.status(400).json({ mensagem: "Erro ao atualizar setlist." });
  }
};

exports.apagar = async (req, res, conexao) => {
  const { Setlist } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;
  try {
    const deletado = await Setlist.destroy({ where: { id, usuario_id: usuarioId } });
    if (deletado) {
      return res.status(204).send();
    }
    return res.status(404).json({ mensagem: "Setlist não encontrado." });
  } catch (erro) {
    return res.status(500).json({ mensagem: "Erro ao apagar setlist." });
  }
};

// --- LÓGICA INTELIGENTE ---

exports.atualizarMusicas = async (req, res, conexao) => {
  const { Setlist, Musica } = conexao.models;
  const { id } = req.params;
  const { musicasIds } = req.body; // Espera um array de IDs de músicas na ordem correta
  const usuarioId = req.usuario.id;
  const t = await conexao.transaction();

  try {
    const setlist = await Setlist.findOne({ where: { id, usuario_id: usuarioId }, transaction: t });
    if (!setlist) {
      await t.rollback();
      return res.status(404).json({ mensagem: "Setlist não encontrado." });
    }

    // Cria os objetos para a tabela de ligação, incluindo a ordem
    const musicasParaAssociar = musicasIds.map((musicaId, index) => ({
      setlist_id: setlist.id,
      musica_id: musicaId,
      ordem: index
    }));

    // Remove todas as músicas antigas e insere as novas em uma única transação
    await conexao.models.setlist_musicas.destroy({ where: { setlist_id: setlist.id }, transaction: t });
    if (musicasParaAssociar.length > 0) {
      await conexao.models.setlist_musicas.bulkCreate(musicasParaAssociar, { transaction: t });
    }
    
    await t.commit();
    return res.status(200).json({ mensagem: "Setlist atualizado com sucesso." });

  } catch (erro) {
    await t.rollback();
    console.error("Erro ao atualizar músicas do setlist:", erro);
    return res.status(500).json({ mensagem: "Ocorreu um erro ao atualizar as músicas do setlist." });
  }
};

exports.sugerirMusicas = async (req, res, conexao) => {
  const { Setlist, Musica, Tag } = conexao.models;
  const { id } = req.params; // ID do setlist
  const { quantidade = 5 } = req.body; // Quantidade de sugestões desejadas
  const usuarioId = req.usuario.id;

  try {
    const setlistAtual = await Setlist.findOne({
      where: { id, usuario_id: usuarioId },
      include: [{ model: Musica, as: 'musicas', include: [{ model: Tag, as: 'tags' }] }]
    });

    if (!setlistAtual || setlistAtual.musicas.length === 0) {
      return res.status(400).json({ mensagem: "Setlist vazio ou não encontrado. Adicione músicas para obter sugestões." });
    }

    // Pega os IDs de todas as tags presentes no setlist e os IDs das músicas que já estão nele
    const idsDasTagsNoSetlist = [...new Set(setlistAtual.musicas.flatMap(m => m.tags.map(t => t.id)))];
    const idsDasMusicasNoSetlist = setlistAtual.musicas.map(m => m.id);

    if (idsDasTagsNoSetlist.length === 0) {
      return res.status(400).json({ mensagem: "Nenhuma música no setlist possui tags para basear a sugestão." });
    }

    // Busca músicas que:
    // 1. Pertencem ao usuário
    // 2. NÃO estão no setlist atual
    // 3. Possuem PELO MENOS UMA das tags encontradas
    const sugestoes = await Musica.findAll({
      where: {
        usuario_id: usuarioId,
        id: { [Op.notIn]: idsDasMusicasNoSetlist } // Exclui músicas que já estão na lista
      },
      include: [{
        model: Tag,
        as: 'tags',
        where: { id: { [Op.in]: idsDasTagsNoSetlist } }, // Filtra por tags relevantes
        attributes: []
      }],
      order: [['popularidade', 'DESC'], ['ultima_vez_tocada', 'ASC']], // Prioriza populares e menos tocadas recentemente
      limit: quantidade
    });

    return res.status(200).json(sugestoes);

  } catch (erro) {
    console.error("Erro ao sugerir músicas:", erro);
    return res.status(500).json({ mensagem: "Ocorreu um erro ao gerar sugestões." });
  }
};