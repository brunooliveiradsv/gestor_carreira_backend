// src/controladores/musica.controlador.js
const { Op } = require("sequelize");

exports.criar = async (req, res, conexao) => {
  console.log("CORPO DO PEDIDO (CRIAR):", req.body); // <-- DEBUG
  const { Musica, Tag } = conexao.models;
  const {
    nome,
    artista,
    tom,
    duracao_segundos,
    bpm,
    link_cifra,
    notas_adicionais,
    tags,
  } = req.body;
  const usuarioId = req.usuario.id;

  if (!nome || !artista) {
    return res
      .status(400)
      .json({ mensagem: "Nome da música e artista são obrigatórios." });
  }

  const t = await conexao.transaction();
  try {
    const novaMusica = await Musica.create(
      {
        nome: nome.trim(),
        artista: artista.trim(),
        tom,
        duracao_segundos,
        bpm,
        link_cifra,
        notas_adicionais,
        usuario_id: usuarioId,
      },
      { transaction: t }
    );

    if (tags && Array.isArray(tags) && tags.length > 0) {
      console.log("Processando tags para nova música:", tags); // <-- DEBUG
      const tagsParaAssociar = [];
      for (const nomeTag of tags) {
        const [tag] = await Tag.findOrCreate({
          where: { nome: nomeTag.trim(), usuario_id: usuarioId },
          defaults: { nome: nomeTag.trim(), usuario_id: usuarioId },
          transaction: t,
        });
        tagsParaAssociar.push(tag);
      }
      await novaMusica.setTags(tagsParaAssociar, { transaction: t });
      console.log("Tags associadas com sucesso."); // <-- DEBUG
    }

    await t.commit();
    const musicaCompleta = await Musica.findByPk(novaMusica.id, {
      include: ["tags"],
    });
    return res.status(201).json(musicaCompleta);
  } catch (erro) {
    await t.rollback();
    console.error("Erro ao criar música:", erro);
    return res.status(500).json({ mensagem: "Erro ao criar a música." });
  }
};

exports.atualizar = async (req, res, conexao) => {
  console.log(`CORPO DO PEDIDO (ATUALIZAR ID: ${req.params.id}):`, req.body); // <-- DEBUG
  const { Musica, Tag } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;
  const { tags, ...dadosMusica } = req.body;
  const t = await conexao.transaction();

  try {
    const musica = await Musica.findOne({
      where: { id, usuario_id: usuarioId },
      transaction: t,
    });
    if (!musica) {
      await t.rollback();
      return res.status(404).json({ mensagem: "Música não encontrada." });
    }

    await musica.update(dadosMusica, { transaction: t });

    if (Array.isArray(tags)) {
      console.log("Processando tags para música existente:", tags); // <-- DEBUG
      const tagsParaAssociar = [];
      if (tags.length > 0) {
        for (const nomeTag of tags) {
          const [tag] = await Tag.findOrCreate({
            where: { nome: nomeTag.trim(), usuario_id: usuarioId },
            defaults: { nome: nomeTag.trim(), usuario_id: usuarioId },
            transaction: t,
          });
          tagsParaAssociar.push(tag);
        }
      }
      // O setTags lida com a remoção de tags antigas e adição de novas
      await musica.setTags(tagsParaAssociar, { transaction: t });
      console.log("Tags sincronizadas com sucesso."); // <-- DEBUG
    }

    await t.commit();
    const musicaAtualizada = await Musica.findByPk(id, { include: "tags" });
    return res.status(200).json(musicaAtualizada);
  } catch (erro) {
    await t.rollback();
    console.error("Erro ao atualizar música:", erro);
    return res.status(500).json({ mensagem: "Erro ao atualizar a música." });
  }
};

// --- Funções de listar, buscarPorId, etc. permanecem as mesmas ---

exports.listar = async (req, res, conexao) => {
  const { Musica, Tag } = conexao.models;
  const usuarioId = req.usuario.id;
  const { termoBusca, tom, tags, semTocarDesde, popularidade } = req.query;

  const whereClause = { usuario_id: usuarioId };
  if (termoBusca) {
    whereClause[Op.or] = [
      { nome: { [Op.iLike]: `%${termoBusca}%` } },
      { artista: { [Op.iLike]: `%${termoBusca}%` } },
    ];
  }
  if (tom) whereClause.tom = tom;
  if (semTocarDesde) {
    whereClause[Op.or] = [
      { ultima_vez_tocada: { [Op.is]: null } },
      { ultima_vez_tocada: { [Op.lt]: new Date(semTocarDesde) } },
    ];
  }

  const orderClause = [];
  if (popularidade === "desc") orderClause.push(["popularidade", "DESC"]);
  orderClause.push(["nome", "ASC"]);

  try {
    const musicas = await Musica.findAll({
      where: whereClause,
      include: [
        {
          model: Tag,
          as: "tags",
          attributes: ["id", "nome"],
          ...(tags && { where: { id: { [Op.in]: tags.split(",") } } }),
          through: { attributes: [] },
        },
      ],
      order: orderClause,
    });
    return res.status(200).json(musicas);
  } catch (erro) {
    console.error("Erro ao listar músicas:", erro);
    return res.status(500).json({ mensagem: "Erro ao listar as músicas." });
  }
};

exports.buscarPorId = async (req, res, conexao) => {
  const { Musica, Tag } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;
  try {
    const musica = await Musica.findOne({
      where: { id, usuario_id: usuarioId },
      include: [{ model: Tag, as: "tags" }],
    });
    if (!musica)
      return res.status(404).json({ mensagem: "Música não encontrada." });
    return res.status(200).json(musica);
  } catch (erro) {
    return res.status(500).json({ mensagem: "Erro ao buscar a música." });
  }
};

exports.apagar = async (req, res, conexao) => {
  const { Musica } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;
  try {
    const deletado = await Musica.destroy({
      where: { id, usuario_id: usuarioId },
    });
    if (deletado) return res.status(204).send();
    return res.status(404).json({ mensagem: "Música não encontrada." });
  } catch (erro) {
    return res.status(500).json({ mensagem: "Erro ao apagar música." });
  }
};

exports.tocarMusica = async (req, res, conexao) => {
  const { Musica } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;
  try {
    const musica = await Musica.findOne({
      where: { id, usuario_id: usuarioId },
    });
    if (!musica)
      return res.status(404).json({ mensagem: "Música não encontrada." });
    await musica.update({
      ultima_vez_tocada: new Date(),
      popularidade: musica.popularidade + 1,
    });
    return res.status(200).json(musica);
  } catch (erro) {
    console.error("Erro ao registrar 'tocar música':", erro);
    return res.status(500).json({ mensagem: "Erro ao registrar a ação." });
  }
};

exports.buscaInterna = async (req, res, conexao) => {
  const { Musica, Tag } = conexao.models;
  const { nome, artista } = req.query;
  if (!nome || !artista)
    return res
      .status(400)
      .json({ mensagem: "Nome da música e artista são necessários." });
  try {
    const nomeLimpo = nome.trim();
    const artistaLimpo = artista.trim();
    const musica = await Musica.findOne({
      where: {
        nome: { [Op.iLike]: nomeLimpo },
        artista: { [Op.iLike]: artistaLimpo },
        usuario_id: req.usuario.id,
      },
      include: [{ model: Tag, as: "tags" }],
    });
    if (musica) {
      console.log(
        `[Busca Interna] Música "${nomeLimpo}" encontrada no banco de dados.`
      );
      return res.status(200).json(musica);
    } else {
      return res
        .status(404)
        .json({ mensagem: "Música não encontrada no banco de dados interno." });
    }
  } catch (error) {
    console.error("Erro na busca interna:", error);
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
};
