// src/controladores/musica.controlador.js
const { Op } = require("sequelize");
const axios = require("axios");
const cheerio = require("cheerio");

// ... (as outras funções como criar, listar, etc., permanecem exatamente iguais)
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

// --- FUNÇÃO BUSCAINTELIGENTE MAIS ROBUSTA ---
exports.buscaInteligente = async (req, res) => {
  const { nomeMusica, nomeArtista } = req.body;
  if (!nomeMusica || !nomeArtista) {
    return res
      .status(400)
      .json({ mensagem: "Nome da música e do artista são necessários." });
  }

  const termoBusca = encodeURIComponent(`${nomeMusica} ${nomeArtista}`);
  const urlBusca = `https://www.cifraclub.com.br/search/?q=${termoBusca}`;

  try {
    console.log(`[Busca Inteligente] Buscando URL: ${urlBusca}`);
    const { data } = await axios.get(urlBusca);
    const $ = cheerio.load(data);

    let linkEncontrado = null;

    // **NOVA LÓGICA DE BUSCA**
    // Procura por todos os links na área de resultados
    $(".gsc-webResult.gsc-result a.gs-title").each((i, el) => {
      const href = $(el).attr("href");
      // Procura pelo primeiro link que não seja um link de "videoaulas"
      if (
        href &&
        href.includes("cifraclub.com.br") &&
        !href.includes("/videoaulas/")
      ) {
        linkEncontrado = href;
        return false; // Interrompe o loop 'each' assim que encontrar o primeiro link válido
      }
    });

    if (linkEncontrado) {
      console.log(`[Busca Inteligente] Link encontrado: ${linkEncontrado}`);

      // O resto da lógica para raspar a página da cifra permanece o mesmo
      const { data: dataCifra } = await axios.get(linkEncontrado);
      const $cifra = cheerio.load(dataCifra);

      let nome =
        $cifra(".g-1 > h1.g-4").text().trim() || $cifra("h1.t1").text().trim();
      let artista =
        $cifra(".g-1 > h2.g-4 > a").text().trim() ||
        $cifra("h2.t3").text().trim();
      const tom = $cifra("#cifra_tom").text().trim();
      const cifraHtml = $cifra("pre").html();

      if (!cifraHtml) {
        return res
          .status(404)
          .json({
            mensagem: "Não foi possível extrair a cifra da página encontrada.",
          });
      }

      const cifraComQuebrasDeLinha = cifraHtml.replace(/<br\s*\/?>/gi, "\n");
      const $temp = cheerio.load(cifraComQuebrasDeLinha);
      const cifraLimpa = $temp.text();

      return res.status(200).json({
        nome: nome,
        artista: artista,
        tom: tom,
        notas_adicionais: cifraLimpa,
      });
    } else {
      console.log(
        "[Busca Inteligente] Nenhum resultado válido encontrado com a nova lógica."
      );
      return res
        .status(404)
        .json({
          mensagem: "Nenhuma cifra encontrada para esta música no Cifra Club.",
        });
    }
  } catch (erro) {
    console.error("Erro na busca inteligente:", erro);
    return res
      .status(500)
      .json({ mensagem: "Erro ao realizar a busca no Cifra Club." });
  }
};
