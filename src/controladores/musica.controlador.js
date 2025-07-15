// src/controladores/musica.controlador.js
const { Op } = require('sequelize');
const axios = require('axios');
const cheerio = require('cheerio');

// ... (todas as outras funções como criar, listar, etc., permanecem exatamente iguais)

exports.criar = async (req, res, conexao) => {
  const { Musica, Tag } = conexao.models;
  let { nome, artista, tom, duracao_segundos, link_cifra, notas_adicionais, tags } = req.body;
  const usuarioId = req.usuario.id;

  if (!nome || !artista) {
    return res.status(400).json({ mensagem: "Nome da música e artista são obrigatórios." });
  }

  const duracaoParaSalvar = duracao_segundos ? parseInt(duracao_segundos, 10) : null;
  if (isNaN(duracaoParaSalvar)) {
    duracao_segundos = null;
  }

  const t = await conexao.transaction();
  try {
    const novaMusica = await Musica.create({
      nome, artista, tom, duracao_segundos: duracaoParaSalvar, link_cifra, notas_adicionais,
      usuario_id: usuarioId
    }, { transaction: t });

    if (tags && tags.length > 0) {
      const tagsParaAssociar = [];
      for (const nomeTag of tags) {
        const [tag] = await Tag.findOrCreate({
          where: { nome: nomeTag.trim(), usuario_id: usuarioId },
          transaction: t
        });
        tagsParaAssociar.push(tag);
      }
      await novaMusica.setTags(tagsParaAssociar, { transaction: t });
    }

    await t.commit();
    const musicaCompleta = await Musica.findByPk(novaMusica.id, { include: 'tags' });
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
      { artista: { [Op.iLike]: `%${termoBusca}%` } }
    ];
  }
  if (tom) {
    whereClause.tom = tom;
  }
  if (semTocarDesde) {
    whereClause[Op.or] = [
      { ultima_vez_tocada: { [Op.is]: null } },
      { ultima_vez_tocada: { [Op.lt]: new Date(semTocarDesde) } }
    ];
  }

  const orderClause = [];
  if (popularidade === 'desc') {
    orderClause.push(['popularidade', 'DESC']);
  }
  orderClause.push(['nome', 'ASC']);

  try {
    const musicas = await Musica.findAll({
      where: whereClause,
      include: [{
        model: Tag,
        as: 'tags',
        attributes: ['id', 'nome'],
        ...(tags && { where: { id: { [Op.in]: tags.split(',') } } }),
        through: { attributes: [] }
      }],
      order: orderClause
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
      include: [{ model: Tag, as: 'tags' }]
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
    const musica = await Musica.findOne({ where: { id, usuario_id: usuarioId }, transaction: t });
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
          transaction: t
        });
        tagsParaAssociar.push(tag);
      }
      await musica.setTags(tagsParaAssociar, { transaction: t });
    }

    await t.commit();
    const musicaAtualizada = await Musica.findByPk(id, { include: 'tags' });
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
    const deletado = await Musica.destroy({ where: { id, usuario_id: usuarioId } });
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
    const musica = await Musica.findOne({ where: { id, usuario_id: usuarioId } });
    if (!musica) {
      return res.status(404).json({ mensagem: "Música não encontrada." });
    }

    await musica.update({
      ultima_vez_tocada: new Date(),
      popularidade: musica.popularidade + 1
    });

    return res.status(200).json(musica);

  } catch (erro) {
    console.error("Erro ao registrar 'tocar música':", erro);
    return res.status(500).json({ mensagem: "Erro ao registrar a ação." });
  }
}

exports.rasparCifra = async (req, res) => {
  let { url } = req.body;

  if (!url || !url.includes('cifraclub.com.br')) {
    return res.status(400).json({ mensagem: "URL do Cifra Club inválida ou não fornecida." });
  }

  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    let nome = $('.g-1 > h1.g-4').text().trim();
    let artista = $('.g-1 > h2.g-4 > a').text().trim();
    
    if (!nome) { nome = $('h1.t1').text().trim(); }
    if (!artista) { artista = $('h2.t3').text().trim(); }

    const tom = $('#cifra_tom').text().trim();
    const cifraHtml = $('pre').html();

    if (!nome || !artista || !cifraHtml) {
      return res.status(404).json({ mensagem: "Não foi possível encontrar os dados da cifra na página. O layout do site pode ter mudado." });
    }

    const cifraComQuebrasDeLinha = cifraHtml.replace(/<br\s*\/?>/gi, '\n');
    const $temp = cheerio.load(cifraComQuebrasDeLinha);
    const cifraLimpa = $temp.text();

    return res.status(200).json({ nome, artista, tom, notas_adicionais: cifraLimpa });

  } catch (erro) {
    console.error("Erro ao fazer scraping do Cifra Club:", erro);
    return res.status(500).json({ mensagem: "Ocorreu um erro ao tentar obter os dados do Cifra Club." });
  }
};

// --- NOVA FUNÇÃO DE BUSCA INTELIGENTE ---
exports.buscaInteligente = async (req, res) => {
    const { nomeMusica, nomeArtista } = req.body;
    if (!nomeMusica || !nomeArtista) {
        return res.status(400).json({ mensagem: "Nome da música e do artista são necessários." });
    }

    // Formata a string de busca para a URL
    const termoBusca = encodeURIComponent(`${nomeMusica} ${nomeArtista}`);
    const urlBusca = `https://www.cifraclub.com.br/busca.php?q=${termoBusca}`;

    try {
        const { data } = await axios.get(urlBusca);
        const $ = cheerio.load(data);

        // Encontra o primeiro link de resultado na lista principal
        const primeiroResultado = $('ul.g-1.g-fix a.gs-title').first().attr('href');
        
        if (primeiroResultado) {
            // Garante que o URL seja completo
            const urlCompleto = primeiroResultado.startsWith('http') ? primeiroResultado : `https://www.cifraclub.com.br${primeiroResultado}`;
            return res.status(200).json({ url: urlCompleto });
        } else {
            return res.status(404).json({ mensagem: "Nenhuma cifra encontrada para esta música no Cifra Club." });
        }

    } catch (erro) {
        console.error("Erro na busca inteligente:", erro);
        return res.status(500).json({ mensagem: "Erro ao realizar a busca no Cifra Club." });
    }
};