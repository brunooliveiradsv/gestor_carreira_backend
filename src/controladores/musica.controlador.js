// src/controladores/musica.controlador.js
const { Op } = require("sequelize");

/**
 * Cria uma nova música e associa as tags predefinidas através dos seus IDs.
 */
exports.criar = async (req, res, conexao) => {
  const { Musica } = conexao.models;
  const {
    nome, artista, tom, duracao_segundos, bpm, link_cifra, notas_adicionais, 
    tagIds, // Espera um array de IDs de tags, ex: [1, 5, 12]
  } = req.body;
  const usuarioId = req.usuario.id;

  if (!nome || !artista) {
    return res.status(400).json({ mensagem: "Nome da música e artista são obrigatórios." });
  }

  const t = await conexao.transaction();
  try {
    const novaMusica = await Musica.create({
      nome: nome.trim(), artista: artista.trim(), tom, duracao_segundos, bpm, link_cifra, notas_adicionais, usuario_id: usuarioId,
    }, { transaction: t });

    // Se foram enviados IDs de tags, o Sequelize irá criar as associações na tabela 'musica_tags'
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      await novaMusica.setTags(tagIds, { transaction: t });
    }

    await t.commit();
    // Devolve a música recém-criada, incluindo as suas tags associadas
    const musicaCompleta = await Musica.findByPk(novaMusica.id, { include: ["tags"] });
    return res.status(201).json(musicaCompleta);
  } catch (erro) {
    await t.rollback();
    console.error("Erro ao criar música:", erro);
    return res.status(500).json({ mensagem: "Erro ao criar a música." });
  }
};

/**
 * Atualiza uma música existente e sincroniza as suas tags predefinidas.
 */
exports.atualizar = async (req, res, conexao) => {
  const { Musica } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;
  // Separa o array de IDs de tags do resto dos dados da música
  const { tagIds, ...dadosMusica } = req.body;
  const t = await conexao.transaction();

  try {
    const musica = await Musica.findOne({ where: { id, usuario_id: usuarioId }, transaction: t });
    if (!musica) {
      await t.rollback();
      return res.status(404).json({ mensagem: "Música não encontrada." });
    }

    // Atualiza os campos da música (nome, artista, tom, etc.)
    await musica.update(dadosMusica, { transaction: t });

    // Sincroniza as associações de tags. O `setTags` remove as antigas e adiciona as novas.
    if (Array.isArray(tagIds)) {
      await musica.setTags(tagIds, { transaction: t });
    }

    await t.commit();
    // Devolve a música atualizada com as tags incluídas para o frontend
    const musicaAtualizada = await Musica.findByPk(id, { include: "tags" });
    return res.status(200).json(musicaAtualizada);
  } catch (erro) {
    await t.rollback();
    console.error("Erro ao atualizar música:", erro);
    return res.status(500).json({ mensagem: "Erro ao atualizar a música." });
  }
};


// --- Funções Adicionais (sem alterações necessárias) ---

/**
 * Lista as músicas do utilizador com base nos filtros fornecidos.
 */
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

/**
 * Busca uma música específica pelo seu ID.
 */
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

/**
 * Apaga uma música do repertório.
 */
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

/**
 * Regista que uma música foi tocada, atualizando a data e incrementando a popularidade.
 */
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

/**
 * Função de busca interna, usada para verificar se uma música já existe no repertório do utilizador.
 */
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