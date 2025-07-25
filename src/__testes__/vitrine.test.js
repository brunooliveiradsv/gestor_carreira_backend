
// src/__testes__/vitrine.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const conexao = require('../database');
const tratadorDeErros = require('../middlewares/tratadorDeErros');

// Rotas
const usuarioRotas = require('../rotas/usuario.rotas');
const vitrineRotas = require('../rotas/vitrine.rotas');

const app = express();
app.use(cors());
app.use(express.json());
// Nota: A rota de vitrine não precisa de autenticação, mas a de utilizador sim, para podermos criar os dados de teste.
app.use('/api/usuarios', usuarioRotas(conexao));
app.use('/api/vitrine', vitrineRotas(conexao));
app.use(tratadorDeErros);

describe('Testes das Rotas da Vitrine (Showcase)', () => {

  beforeEach(async () => {
    await conexao.sync({ force: true });
  });

  afterAll(async () => {
    await conexao.close();
  });

  it('Deve exibir a vitrine de um utilizador premium com uma URL única', async () => {
    // 1. Cria um utilizador e torna-o premium
    const { Usuario } = conexao.models;
    const novoUsuario = await Usuario.create({
        nome: 'Artista Premium',
        email: 'premium@teste.com',
        senha: '123',
        plano: 'premium',
        status_assinatura: 'ativa',
        url_unica: 'artista-premium-teste'
    });

    // 2. Tenta aceder à sua vitrine
    const response = await request(app)
      .get(`/api/vitrine/${novoUsuario.url_unica}`);

    expect(response.status).toBe(200);
    expect(response.body.artista.nome).toBe('Artista Premium');
  });

  it('Não deve exibir a vitrine de um utilizador que não seja premium', async () => {
    // 1. Cria um utilizador com plano 'free' (o padrão)
     const { Usuario } = conexao.models;
     const novoUsuario = await Usuario.create({
        nome: 'Artista Free',
        email: 'free@teste.com',
        senha: '123',
        plano: 'free',
        status_assinatura: 'ativa',
        url_unica: 'artista-free-teste'
    });

    // 2. Tenta aceder à sua vitrine, o que deve falhar
    const response = await request(app)
        .get(`/api/vitrine/${novoUsuario.url_unica}`);

    expect(response.status).toBe(404); // A regra de negócio retorna 404 para esconder a página
  });

  it('Deve permitir que um visitante aplauda um artista', async () => {
    // 1. Cria o artista premium
    const { Usuario } = conexao.models;
    const novoUsuario = await Usuario.create({
        nome: 'Artista Aplaudido',
        email: 'aplauso@teste.com',
        senha: '123',
        plano: 'premium',
        status_assinatura: 'ativa',
        url_unica: 'artista-aplaudido',
        aplausos: 10 // Começa com 10 aplausos
    });

    // 2. Envia a requisição para aplaudir
    const response = await request(app)
        .post(`/api/vitrine/${novoUsuario.url_unica}/aplaudir`);

    expect(response.status).toBe(200);
    // Verifica se o total de aplausos na resposta é 11
    expect(response.body.aplausos).toBe(11);

    // 3. Confirma na base de dados
    const usuarioAtualizado = await Usuario.findByPk(novoUsuario.id);
    expect(usuarioAtualizado.aplausos).toBe(11);
  });
});