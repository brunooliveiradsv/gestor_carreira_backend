// src/controladores/musica.controlador.js
const { Op, Sequelize } = require("sequelize");
const conquistaServico = require('../servicos/conquista.servico');

exports.listarRepertorioUsuario = async (req, res, conexao, next) => {
  const { Musica, Tag } = conexao.models;
  const usuarioId = req.usuario.id;
  const { termoBusca, tom, bpm } = req.query;

  const whereClause = { usuario_id: usuarioId };
  if (termoBusca) {
    whereClause[Op.or] = [
      { nome: { [Op.iLike]: `%${termoBusca}%` } },
      { artista: { [Op.iLike]: `%${termoBusca}%` } },
    ];
  }
  if (tom) whereClause.tom = { [Op.iLike]: `%${tom}%` };
  if (bpm) whereClause.bpm = bpm;

  try {
    const musicas = await Musica.findAll({
      where: whereClause,
      include: ['musica_mestre', { model: Tag, as: 'tags', through: { attributes: [] } }],
      order: [['artista', 'ASC'], ['nome', 'ASC']]
    });

    const repertorioProcessado = musicas.map(musica => {
        const musicaJSON = musica.toJSON();
        if (musicaJSON.master_id && musicaJSON.musica_mestre) {
            const mestre = musicaJSON.musica_mestre;
            if (musicaJSON.tom !== mestre.tom ||
                musicaJSON.bpm !== mestre.bpm ||
                musicaJSON.notas_adicionais !== mestre.notas_adicionais ||
                musicaJSON.link_cifra !== mestre.link_cifra) 
            {
                musicaJSON.is_modificada = true;
            }
        }
        return musicaJSON;
    });

    return res.status(200).json(repertorioProcessado);
  } catch (erro) {
    next(erro);
  }
};

exports.buscarPorId = async (req, res, conexao, next) => {
    const { Musica, Tag } = conexao.models;
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    try {
        const musica = await Musica.findOne({ 
            where: { id, usuario_id: usuarioId },
            include: [{ model: Tag, as: 'tags' }]
        });
        if (musica) return res.status(200).json(musica);
        return res.status(404).json({ mensagem: "Música não encontrada no seu repertório." });
    } catch (error) {
        next(error);
    }
};

exports.buscarMusicasPublicas = async (req, res, conexao, next) => {
    const { Musica } = conexao.models;
    const { termoBusca = '' } = req.query;
    try {
        const musicas = await Musica.findAll({
            where: {
                is_publica: true,
                master_id: null,
                [Op.or]: [
                    { nome: { [Op.iLike]: `%${termoBusca}%` } },
                    { artista: { [Op.iLike]: `%${termoBusca}%` } },
                ]
            },
            limit: 20,
            order: [['artista', 'ASC'], ['nome', 'ASC']]
        });
        return res.status(200).json(musicas);
    } catch (error) {
        next(error);
    }
};

exports.criarManual = async (req, res, conexao, next) => {
    const { Musica } = conexao.models;
    const { nome, artista, tom, notas_adicionais } = req.body;
    const usuarioId = req.usuario.id;

    if (!nome || !artista) return res.status(400).json({ mensagem: "Nome e artista são obrigatórios." });

    try {
        const novaMusica = await Musica.create({
            nome, artista, tom, notas_adicionais,
            usuario_id: usuarioId, master_id: null, is_publica: false
        });
        
        conquistaServico.verificarEConcederConquistas(usuarioId, 'CONTAGEM_MUSICAS', conexao);
        
        return res.status(201).json(novaMusica);
    } catch (error) {
        next(error);
    }
};

exports.importar = async (req, res, conexao, next) => {
    const { Musica, Tag } = conexao.models;
    const { master_id } = req.body;
    const usuarioId = req.usuario.id;
    const t = await conexao.transaction();

    try {
        const musicaMestre = await Musica.findOne({ 
            where: { id: master_id, is_publica: true, master_id: null },
            include: [{ model: Tag, as: 'tags' }]
        });
        if (!musicaMestre) {
            await t.rollback();
            return res.status(404).json({ mensagem: "Música do banco de dados não encontrada ou não é pública." });
        }

        const jaImportada = await Musica.findOne({ where: { usuario_id: usuarioId, master_id: master_id } });
        if (jaImportada) {
            await t.rollback();
            return res.status(400).json({ mensagem: "Esta música já foi importada para o seu repertório." });
        }
        
        const novaCopia = await Musica.create({
            nome: musicaMestre.nome, artista: musicaMestre.artista, tom: musicaMestre.tom,
            bpm: musicaMestre.bpm, duracao_minutos: musicaMestre.duracao_minutos,
            link_cifra: musicaMestre.link_cifra, notas_adicionais: musicaMestre.notas_adicionais,
            usuario_id: usuarioId, master_id: musicaMestre.id, is_publica: false
        }, { transaction: t });

        if (musicaMestre.tags && musicaMestre.tags.length > 0) {
            const tagIds = musicaMestre.tags.map(tag => tag.id);
            await novaCopia.setTags(tagIds, { transaction: t });
        }

        await t.commit();
        conquistaServico.verificarEConcederConquistas(usuarioId, 'CONTAGEM_MUSICAS', conexao);
        
        const musicaComTags = await Musica.findByPk(novaCopia.id, { include: ['tags'] });
        return res.status(201).json(musicaComTags);
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

exports.atualizar = async (req, res, conexao, next) => {
    const { Musica } = conexao.models;
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    const { tagIds, ...dadosMusica } = req.body;

    try {
        const musica = await Musica.findOne({ where: { id, usuario_id: usuarioId } });
        if (!musica) {
            return res.status(404).json({ mensagem: "Música não encontrada no seu repertório." });
        }
        
        await musica.update(dadosMusica);
        
        const musicaAtualizada = await Musica.findByPk(id, { include: ['tags'] });
        return res.status(200).json(musicaAtualizada);
    } catch (error) {
        next(error);
    }
};

exports.apagar = async (req, res, conexao, next) => {
    const { Musica } = conexao.models;
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    try {
        const deletado = await Musica.destroy({ where: { id, usuario_id: usuarioId } });
        if (deletado) return res.status(204).send();
        return res.status(404).json({ mensagem: "Música não encontrada no seu repertório." });
    } catch (erro) {
        next(erro);
    }
};