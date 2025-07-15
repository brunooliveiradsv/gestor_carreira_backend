// src/controladores/musica.controlador.js
const { Op } = require("sequelize");
const axios = require("axios");
const cheerio = require("cheerio");

// ... (as outras funções como criar, listar, etc., permanecem exatamente iguais)
// Para manter a resposta focada, elas foram omitidas aqui, mas devem continuar no seu ficheiro.
exports.criar = async (req, res, conexao) => {
  const { Musica, Tag } = conexao.models;
  let {
    nome,
    artista,
    tom,
    duracao_segundos,
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

  const duracaoParaSalvar = duracao_segundos
    ? parseInt(duracao_segundos, 10)
    : null;
  if (isNaN(duracaoParaSalvar)) {
    duracao_segundos = null;
  }

  const t = await conexao.transaction();
  try {
    const novaMusica = await Musica.create(
      {
        nome,
        artista,
        tom,
        duracao_segundos: duracaoParaSalvar,
        link_cifra,
        notas_adicionais,
        usuario_id: usuarioId,
      },
      { transaction: t }
    );

    if (tags && tags.length > 0) {
      const tagsParaAssociar = [];
      for (const nomeTag of tags) {
        const [tag] = await Tag.findOrCreate({
          where: { nome: nomeTag.trim(), usuario_id: usuarioId },
          transaction: t,
        });
        tagsParaAssociar.push(tag);
      }
      await novaMusica.setTags(tagsParaAssociar, { transaction: t });
    }

    await t.commit();
    const musicaCompleta = await Musica.findByPk(novaMusica.id, {
      include: "tags",
    });
    return res.status(201).json(musicaCompleta);
  } catch (erro) {
    await t.rollback();
    console.error("Erro ao criar música:", erro);
    return res.status(500).json({ mensagem: "Erro ao criar a música." });
  }
};

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
  if (tom) {
    whereClause.tom = tom;
  }
  if (semTocarDesde) {
    whereClause[Op.or] = [
      { ultima_vez_tocada: { [Op.is]: null } },
      { ultima_vez_tocada: { [Op.lt]: new Date(semTocarDesde) } },
    ];
  }

  const orderClause = [];
  if (popularidade === "desc") {
    orderClause.push(["popularidade", "DESC"]);
  }
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

    if (!musica) {
      return res.status(404).json({ mensagem: "Música não encontrada." });
    }
    return res.status(200).json(musica);
  } catch (erro) {
    return res.status(500).json({ mensagem: "Erro ao buscar a música." });
  }
};

exports.atualizar = async (req, res, conexao) => {
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

    if (tags && Array.isArray(tags)) {
      const tagsParaAssociar = [];
      for (const nomeTag of tags) {
        const [tag] = await Tag.findOrCreate({
          where: { nome: nomeTag.trim(), usuario_id: usuarioId },
          transaction: t,
        });
        tagsParaAssociar.push(tag);
      }
      await musica.setTags(tagsParaAssociar, { transaction: t });
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

exports.apagar = async (req, res, conexao) => {
  const { Musica } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;

  try {
    const deletado = await Musica.destroy({
      where: { id, usuario_id: usuarioId },
    });
    if (deletado) {
      return res.status(204).send();
    }
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
    if (!musica) {
      return res.status(404).json({ mensagem: "Música não encontrada." });
    }

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

// --- FUNÇÃO DE BUSCA INTELIGENTE ATUALIZADA ---
exports.buscaInteligente = async (req, res) => {
  const { nomeMusica, nomeArtista } = req.body;
  if (!nomeMusica || !nomeArtista) {
    return res
      .status(400)
      .json({ mensagem: "Nome da música e do artista são necessários." });
  }

  try {
    // ETAPA 1: Buscar o link da cifra no Cifra Club
    const termoBuscaCifra = encodeURIComponent(`${nomeMusica} ${nomeArtista}`);
    const urlBuscaCifra = `https://www.cifraclub.com.br/search/?q=${termoBuscaCifra}`;

    const { data: dataBusca } = await axios.get(urlBuscaCifra);
    const $busca = cheerio.load(dataBusca);
    const linkCifra = $busca(".gsc-thumbnail-inside a.gs-title")
      .first()
      .attr("href");

    if (!linkCifra) {
      return res
        .status(404)
        .json({
          mensagem:
            "Não foi possível encontrar a cifra principal para esta música.",
        });
    }

    // ETAPA 2: Raspar os dados da página da cifra encontrada
    const { data: dataCifra } = await axios.get(linkCifra);
    const $cifra = cheerio.load(dataCifra);

    let nome = $cifra(".g-1 > h1.g-4").text().trim();
    let artista = $cifra(".g-1 > h2.g-4 > a").text().trim();
    if (!nome) {
      nome = $cifra("h1.t1").text().trim();
    }
    if (!artista) {
      artista = $cifra("h2.t3").text().trim();
    }

    const tom = $cifra("#cifra_tom").text().trim();
    const cifraHtml = $cifra("pre").html();
    const cifraComQuebrasDeLinha = cifraHtml.replace(/<br\s*\/?>/gi, "\n");
    const $temp = cheerio.load(cifraComQuebrasDeLinha);
    const cifraLimpa = $temp.text();

    // ETAPA 3 (Simples): Buscar dados técnicos usando a API do Google Search
    const termoBuscaGoogle = encodeURIComponent(
      `bpm and key for ${nomeArtista} ${nomeMusica}`
    );
    // A utilização de uma API de busca real (como a do Google) seria o ideal.
    // Por agora, vamos simular uma busca e extrair de sites conhecidos.
    // Esta é uma implementação simplificada.
    let bpm = null;
    let duracao = null;

    // Simulando a busca por BPM em sites como "tunebat" ou "songbpm"
    // Em um cenário real, você faria uma chamada a uma API de busca ou rasparia a página de resultados.
    // Por exemplo, uma busca por "Stairway to Heaven Led Zeppelin bpm" retorna resultados claros.
    // Vamos deixar estes campos como "null" por agora, para serem preenchidos manualmente se não forem encontrados.

    return res.status(200).json({
      nome: nome || nomeMusica,
      artista: artista || nomeArtista,
      tom: tom || "",
      notas_adicionais: cifraLimpa || "",
      bpm: bpm, // Campo para o BPM
      duracao_segundos: duracao, // Campo para a duração
    });
  } catch (erro) {
    console.error("Erro na busca inteligente:", erro);
    return res
      .status(500)
      .json({
        mensagem: "Ocorreu um erro geral ao buscar os dados da música.",
      });
  }
};
