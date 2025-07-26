// src/controladores/setlist.controlador.js
const { Op, fn, col, literal } = require('sequelize'); // fn, col, e literal são necessários
const { v4: uuidv4 } = require('uuid');
const conquistaServico = require('../servicos/conquista.servico');
const logService = require('../servicos/log.servico');

exports.estatisticas = async (req, res, conexao, next) => {
  const { Musica, Setlist, Compromisso, SetlistMusica } = conexao.models;
  const usuarioId = req.usuario.id;
  try {
    const anoAtual = new Date().getFullYear();

    // --- CORREÇÃO DEFINITIVA AQUI ---
    const dialeto = conexao.getDialect();
    const condicaoAno = dialeto === 'sqlite'
        ? conexao.where(conexao.fn('strftime', '%Y', conexao.col('data')), String(anoAtual))
        : literal(`EXTRACT(YEAR FROM "data") = ${anoAtual}`);

    const totalShowsAno = await Compromisso.count({
        where: {
            usuario_id: usuarioId,
            tipo: 'Show',
            status: 'Realizado',
            [Op.and]: [condicaoAno] // Usa a condição dinâmica
        }
    });

    const musicaMaisTocadaRaw = await SetlistMusica.findOne({
        attributes: [
            'musica_id',
            [fn('COUNT', col('musica_id')), 'contagem']
        ],
        include: [{
            model: Setlist,
            as: 'setlist',
            where: { usuario_id: usuarioId },
            attributes: []
        }],
        group: ['musica_id'], // Em SQLite, o group by deve ser mais simples
        order: [[col('contagem'), 'DESC']],
        limit: 1,
        raw: true
    });
    
    let musicaMaisTocada = null;
    if (musicaMaisTocadaRaw) {
        const musica = await Musica.findByPk(musicaMaisTocadaRaw.musica_id);
        if(musica) {
            musicaMaisTocada = {
                nome: musica.nome,
                artista: musica.artista,
                contagem: parseInt(musicaMaisTocadaRaw.contagem, 10)
            };
        }
    }

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

    return res.status(200).json({ 
        totalMusicas, 
        totalSetlists, 
        proximoShow,
        totalShowsAno: totalShowsAnoCorrigido, // Usa a contagem corrigida
        musicaMaisTocada
    });
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
        through: { attributes: ['ordem'] }
      }]
    });

    if (!setlist) {
      return res.status(404).json({ mensagem: "Setlist não encontrado." });
    }

    if (setlist.musicas && setlist.musicas.length > 0) {
        setlist.musicas.sort((a, b) => {
            const ordemA = a.SetlistMusica?.ordem ?? a.setlist_musicas?.ordem ?? 0;
            const ordemB = b.SetlistMusica?.ordem ?? b.setlist_musicas?.ordem ?? 0;
            return ordemA - ordemB;
        });
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

exports.gerirPartilha = async (req, res, conexao, next) => {
  const { Setlist } = conexao.models;
  const { id } = req.params;
  const { partilhar } = req.body;
  const usuarioId = req.usuario.id;

  try {
    const setlist = await Setlist.findOne({ where: { id, usuario_id: usuarioId } });
    if (!setlist) {
      return res.status(404).json({ mensagem: "Setlist não encontrado." });
    }

    if (partilhar) {
      if (!setlist.publico_uuid) {
        setlist.publico_uuid = uuidv4();
      }
    } else {
      setlist.publico_uuid = null;
    }

    await setlist.save();
    return res.status(200).json(setlist);
  } catch (erro) {
    next(erro);
  }
};

exports.buscarPublicoPorUuid = async (req, res, conexao, next) => {
  const { Setlist, Musica, Usuario } = conexao.models;
  const { uuid } = req.params;

  try {
    const setlist = await Setlist.findOne({
      where: { publico_uuid: uuid },
      include: [
        {
          model: Musica,
          as: 'musicas',
          attributes: ['nome', 'artista'],
          through: { attributes: ['ordem'] }
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nome']
        }
      ]
    });

    if (!setlist) {
      return res.status(404).json({ mensagem: "Setlist público não encontrado." });
    }
    
    if (setlist.musicas && setlist.musicas.length > 0) {
        setlist.musicas.sort((a, b) => {
            const ordemA = a.SetlistMusica?.ordem ?? a.setlist_musicas?.ordem ?? 0;
            const ordemB = b.SetlistMusica?.ordem ?? b.setlist_musicas?.ordem ?? 0;
            return ordemA - ordemB;
        });
    }

    return res.status(200).json(setlist);
  } catch (erro) {
    next(erro);
  }
};