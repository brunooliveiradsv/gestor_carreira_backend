// src/__testes__/vitrine.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const conexao = require('../database');
const tratadorDeErros = require('../middlewares/tratadorDeErros');

// Rotas
const usuarioRotas = require('../rotas/usuario.rotas');
const vitrineRotas = require('../rotas/vitrine.rotas');

// Mock do middleware de autenticação de fãs
jest.mock('../middlewares/authFa.js', () => () => (req, res, next) => {
    req.fa = { id: 1, nome: 'Fã Principal', email: 'fa1@teste.com' };
    next();
});

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/usuarios', usuarioRotas(conexao));
app.use('/api/vitrine', vitrineRotas(conexao));
app.use(tratadorDeErros);

describe('Testes das Rotas da Vitrine (Showcase)', () => {
  let artista;

  beforeEach(async () => {
    await conexao.sync({ force: true });
    const { Usuario, Fa } = conexao.models;

    artista = await Usuario.create({
        nome: 'Artista da Vitrine',
        email: 'vitrine@teste.com',
        senha: '123',
        plano: 'premium',
        status_assinatura: 'ativa',
        url_unica: 'artista-vitrine',
    });
    
    await Fa.bulkCreate([
        { id: 1, nome: 'Fã Principal', email: 'fa1@teste.com' },
        { id: 2, nome: 'Fã Secundário', email: 'fa2@teste.com' }
    ]);
  });

  afterAll(async () => {
    await conexao.close();
  });

  it('Deve exibir a vitrine de um utilizador premium', async () => {
    const response = await request(app).get(`/api/vitrine/${artista.url_unica}`);
    expect(response.status).toBe(200);
    expect(response.body.artista.nome).toBe('Artista da Vitrine');
  });
  
  it('Não deve exibir a vitrine de um utilizador que não seja premium', async () => {
    await artista.update({ plano: 'free' });
    const response = await request(app).get(`/api/vitrine/${artista.url_unica}`);
    expect(response.status).toBe(404);
  });

  it('Deve permitir que um fã autenticado aplauda um artista', async () => {
    const response = await request(app)
        .post(`/api/vitrine/${artista.url_unica}/aplaudir`);

    expect(response.status).toBe(200);
    expect(response.body.mensagem).toBe('Aplauso registado com sucesso!');

    const { Interacao } = conexao.models;
    const interacao = await Interacao.findOne({ where: { fa_id: 1, artista_id: artista.id, tipo: 'APLAUSO' } });
    expect(interacao).not.toBeNull();
  });

  it('Deve permitir que um fã curta e descurta uma música (toggle)', async () => {
    const { Musica, MusicaFaLike } = conexao.models;
    const musica = await Musica.create({ nome: 'Música para Curtir', artista: 'Teste', usuario_id: artista.id });

    const resLike = await request(app).post(`/api/vitrine/musicas/${musica.id}/like`);
    expect(resLike.status).toBe(200);
    expect(resLike.body.totalLikes).toBe(1);

    let likeNaDB = await MusicaFaLike.findOne({ where: { fa_id: 1, musica_id: musica.id } });
    expect(likeNaDB).not.toBeNull();

    const resUnlike = await request(app).post(`/api/vitrine/musicas/${musica.id}/like`);
    expect(resUnlike.status).toBe(200);
    expect(resUnlike.body.totalLikes).toBe(0);

    likeNaDB = await MusicaFaLike.findOne({ where: { fa_id: 1, musica_id: musica.id } });
    expect(likeNaDB).toBeNull();
  });

  it('Deve retornar as músicas mais curtidas do artista', async () => {
    const { Musica, MusicaFaLike } = conexao.models;
    const musica1 = await Musica.create({ nome: 'Mais Curtida', artista: 'Teste', usuario_id: artista.id });
    const musica2 = await Musica.create({ nome: 'Menos Curtida', artista: 'Teste', usuario_id: artista.id });
    
    await MusicaFaLike.create({ fa_id: 1, musica_id: musica1.id });
    await MusicaFaLike.create({ fa_id: 2, musica_id: musica1.id });
    await MusicaFaLike.create({ fa_id: 1, musica_id: musica2.id });

    const response = await request(app).get(`/api/vitrine/${artista.url_unica}/musicas-curtidas`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].musica.nome).toBe('Mais Curtida');
    // --- CORREÇÃO APLICADA AQUI ---
    expect(response.body[0].total_likes).toBe(2); 
  });

  it('Deve retornar o ranking de fãs corretamente', async () => {
    const { Interacao } = conexao.models;
    await Interacao.create({ fa_id: 1, artista_id: artista.id, tipo: 'APLAUSO', pontos: 5 });
    await Interacao.create({ fa_id: 1, artista_id: artista.id, tipo: 'LIKE_MUSICA', pontos: 2 });
    await Interacao.create({ fa_id: 2, artista_id: artista.id, tipo: 'APLAUSO', pontos: 5 });

    const response = await request(app).get(`/api/vitrine/${artista.url_unica}/ranking`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].fa.nome).toBe('Fã Principal');
    // --- CORREÇÃO APLICADA AQUI ---
    expect(response.body[0].total_pontos).toBe(7);
  });

  it('Deve permitir que um fã envie um feedback', async () => {
    const feedback = { nota: 5, comentario: 'O show foi incrível!' };
    const response = await request(app)
      .post(`/api/vitrine/${artista.url_unica}/feedback`)
      .send(feedback);

    expect(response.status).toBe(201);
    expect(response.body.mensagem).toBe('Feedback enviado com sucesso. Obrigado!');

    const { Feedback } = conexao.models;
    const feedbackNaDB = await Feedback.findOne({ where: { fa_id: 1, artista_id: artista.id } });
    expect(feedbackNaDB).not.toBeNull();
    expect(feedbackNaDB.nota).toBe(5);
  });
});