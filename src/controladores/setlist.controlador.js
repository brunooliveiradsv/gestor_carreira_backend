// src/controladores/setlist.controlador.js
const { Op } = require('sequelize');
const conquistaServico = require('../servicos/conquista.servico');
const logService = require('../servicos/log.servico');

exports.estatisticas = async (req, res, conexao, next) => {
  const { Musica, Setlist, Compromisso } = conexao.models;
  const usuarioId = req.usuario.id;
  try {
    const totalMusicas = await Musica.count({ where: { usuario_id: usuarioId } });
    const totalSetlists = await Setlist.count({ where: { usuario_id: usuarioId } });
    const proximoShow = await Compromisso.findOne({
      where: {
        usuario_id: usuarioId,
        data: { [Op.gte]: new Date() },
        status: 'Agendado'
      },
      order: [['data', 'ASC']],
      include: [{ model: Setlist, as: 'setlist' }]
    });
    return res.status(200).json({ totalMusicas, totalSetlists, proximoShow });
  } catch (erro) {
    next(erro);
  }
};

exports.criar = async (req, res, conexao, next) => {
  const { Setlist } = conexao.models;
  const { nome } = req.body;
  const usuarioId = req.usuario.id;
  if (!nome) {
    return res.status(400).json({ mensagem: "O nome do setlist é obrigatório." });
  }
  try {
    const novoSetlist = await Setlist.create({ nome, usuario_id: usuarioId });
    logService.registrarAcao(conexao, usuarioId, 'CREATE_SETLIST', { setlistId: novoSetlist.id, setlistName: novoSetlist.nome });
    conquistaServico.verificarEConcederConquistas(usuarioId, 'CONTAGEM_REPERTORIOS', conexao);
    conquistaServico.verificarEConcederConquistas(usuarioId, 'PRIMEIRO_REPERTORIO_CRIADO', conexao);
    return res.status(201).json(novoSetlist);
  } catch (erro) {
    next(erro);
  }
};

exports.listar = async (req, res, conexao, next) => {
  const { Setlist } = conexao.models;
  const usuarioId = req.usuario.id;
  try {
    const setlists = await Setlist.findAll({
      where: { usuario_id: usuarioId },
      order: [['nome', 'ASC']]
    });
    return res.status(200).json(setlists);
  } catch (erro) {
    next(erro);
  }
};

exports.buscarPorId = async (req, res, conexao, next) => {
  const { Setlist, Musica } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;
  try {
    const setlist = await Setlist.findOne({
      where: { id, usuario_id: usuarioId },
      include: [{
        model: Musica,
        as: 'musicas',
        // CORREÇÃO: Pede explicitamente o atributo 'ordem' da tabela de ligação
        through: { attributes: ['ordem'] }
      }],
      // --- AQUI ESTÁ A CORREÇÃO FINAL ---
      // Esta nova sintaxe força o Sequelize a ordenar as músicas
      // pela coluna 'ordem' da tabela de ligação 'setlist_musicas'
      order: [
        [{ model: Musica, as: 'musicas' }, 'setlist_musicas', 'ordem', 'ASC']
      ]
    });

    if (!setlist) {
      return res.status(404).json({ mensagem: "Setlist não encontrado." });
    }

    return res.status(200).json(setlist);
  } catch (erro) {
    next(erro);
  }
};

exports.atualizar = async (req, res, conexao, next) => {
  const { Setlist } = conexao.models;
  const { id } = req.params;
  const { nome, notas_adicionais } = req.body;
  const usuarioId = req.usuario.id;
  try {
    const [updated] = await Setlist.update({ nome, notas_adicionais }, { where: { id, usuario_id: usuarioId } });
    if (updated) {
      const setlistAtualizado = await Setlist.findByPk(id);
      logService.registrarAcao(conexao, usuarioId, 'UPDATE_SETLIST_DETAILS', { setlistId: id });
      return res.status(200).json(setlistAtualizado);
    }
    return res.status(404).json({ mensagem: "Setlist não encontrado." });
  } catch (erro) {
    next(erro);
  }
};

exports.apagar = async (req, res, conexao, next) => {
  const { Setlist } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;
  try {
    const deletado = await Setlist.destroy({ where: { id, usuario_id: usuarioId } });
    if (deletado) {
      logService.registrarAcao(conexao, usuarioId, 'DELETE_SETLIST', { setlistId: id });
      return res.status(204).send();
    }
    return res.status(404).json({ mensagem: "Setlist não encontrado." });
  } catch (erro) {
    next(erro);
  }
};

exports.atualizarMusicas = async (req, res, conexao, next) => {
  const { Setlist, SetlistMusica } = conexao.models;
  const { id } = req.params;
  const { musicasIds } = req.body;
  const usuarioId = req.usuario.id;
  const t = await conexao.transaction();
  try {
    const setlist = await Setlist.findOne({ where: { id, usuario_id: usuarioId }, transaction: t });
    if (!setlist) {
      await t.rollback();
      return res.status(404).json({ mensagem: "Setlist não encontrado." });
    }
    const musicasParaAssociar = musicasIds.map((musicaId, index) => ({
      setlist_id: setlist.id,
      musica_id: musicaId,
      ordem: index
    }));
    await SetlistMusica.destroy({ where: { setlist_id: setlist.id }, transaction: t });
    if (musicasParaAssociar.length > 0) {
      await SetlistMusica.bulkCreate(musicasParaAssociar, { transaction: t });
    }
    await t.commit();
    logService.registrarAcao(conexao, usuarioId, 'UPDATE_SETLIST_MUSICS', { setlistId: id, musicCount: musicasIds.length });
    return res.status(200).json({ mensagem: "Setlist atualizado com sucesso." });
  } catch (erro) {
    await t.rollback();
    next(erro);
  }
};

exports.sugerirMusicas = async (req, res, conexao, next) => {
  const { Setlist, Musica, Tag } = conexao.models;
  const { id } = req.params;
  const { quantidade = 5 } = req.body;
  const usuarioId = req.usuario.id;
  try {
    const setlistAtual = await Setlist.findOne({
      where: { id, usuario_id: usuarioId },
      include: [{ model: Musica, as: 'musicas', include: [{ model: Tag, as: 'tags' }] }]
    });
    if (!setlistAtual || setlistAtual.musicas.length === 0) {
      return res.status(400).json({ mensagem: "Adicione músicas para obter sugestões." });
    }
    const idsDasTagsNoSetlist = [...new Set(setlistAtual.musicas.flatMap(m => m.tags.map(t => t.id)))];
    const idsDasMusicasNoSetlist = setlistAtual.musicas.map(m => m.id);
    if (idsDasTagsNoSetlist.length === 0) {
      return res.status(400).json({ mensagem: "Nenhuma música no setlist possui tags para basear a sugestão." });
    }
    const sugestoes = await Musica.findAll({
      where: {
        usuario_id: usuarioId,
        id: { [Op.notIn]: idsDasMusicasNoSetlist }
      },
      include: [{
        model: Tag,
        as: 'tags',
        where: { id: { [Op.in]: idsDasTagsNoSetlist } },
        attributes: []
      }],
      order: [['popularidade', 'DESC'], ['ultima_vez_tocada', 'ASC']],
      limit: quantidade
    });
    return res.status(200).json(sugestoes);
  } catch (erro) {
    next(erro);
  }
};