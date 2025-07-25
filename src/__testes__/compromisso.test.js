// src/__testes__/compromisso.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const conexao = require('../database');
const tratadorDeErros = require('../middlewares/tratadorDeErros');

// Importa o serviço que vamos simular
const contratoServico = require('../servicos/contrato.servico.js');

// Rotas
const usuarioRotas = require('../rotas/usuario.rotas');
const compromissoRotas = require('../rotas/compromisso.rotas');

// --- SIMULAÇÃO (MOCK) ---
// Diz ao Jest para substituir o serviço de contratos por uma simulação
jest.mock('../servicos/contrato.servico.js');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/usuarios', usuarioRotas(conexao));
app.use('/api/compromissos', compromissoRotas(conexao));
app.use(tratadorDeErros);

describe('Testes das Rotas de Compromissos', () => {
  let token;
  let usuario;

  beforeEach(async () => {
    jest.clearAllMocks(); // Limpa os mocks
    await conexao.sync({ force: true }); 
    
    const dadosUsuario = { nome: 'Utilizador Compromisso', email: `comp-${Date.now()}@teste.com`, senha: '12345678' };
    const registroRes = await request(app).post('/api/usuarios/registrar').send(dadosUsuario);
    usuario = registroRes.body.usuario;

    const loginResponse = await request(app).post('/api/usuarios/login').send({ email: dadosUsuario.email, senha: '12345678' });
    token = loginResponse.body.token;
  });

  afterAll(async () => {
    await conexao.close();
  });

  it('Deve criar um novo compromisso para um utilizador autenticado', async () => {
    const novoCompromisso = {
      tipo: 'Show',
      nome_evento: 'Show de Teste',
      data: new Date().toISOString(),
      local: 'Palco Teste',
    };

    const response = await request(app)
      .post('/api/compromissos')
      .set('Authorization', `Bearer ${token}`)
      .send(novoCompromisso);

    expect(response.status).toBe(201);
    expect(response.body.nome_evento).toBe(novoCompromisso.nome_evento);
  });

  it('Deve listar os compromissos do utilizador autenticado', async () => {
     const novoCompromisso = { tipo: 'Ensaio', nome_evento: 'Ensaio Teste', data: new Date().toISOString() };
     await request(app).post('/api/compromissos').set('Authorization', `Bearer ${token}`).send(novoCompromisso);

    const response = await request(app)
        .get('/api/compromissos')
        .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].nome_evento).toBe(novoCompromisso.nome_evento);
  });

  // --- TESTE CORRIGIDO ---
  it('Deve chamar o serviço de geração de contrato com os dados corretos', async () => {
    // 1. Atualiza o nosso utilizador de teste para 'premium'
    const { Usuario } = conexao.models;
    await Usuario.update({ plano: 'premium' }, { where: { id: usuario.id } });

    // 2. Cria um compromisso para o teste
    const compromissoRes = await request(app)
      .post('/api/compromissos')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'Show', nome_evento: 'Show para Contrato', data: new Date() });
    const compromissoId = compromissoRes.body.id;

    // 3. Define os dados do contratante
    const dadosContratante = {
      nome: 'Contratante Teste', nif: '123456789', morada: 'Rua de Teste, 123',
      forma_pagamento: 'Transferência', cidade_foro: 'Cidade Teste', estado_foro: 'TS'
    };
    
    // Simula uma resposta bem-sucedida do PDF para evitar que o teste fique pendurado
    contratoServico.gerarContratoPDF.mockImplementation((compromisso, contratante, artista, stream) => {
        stream.end();
    });

    // 4. Chama a rota para gerar o contrato
    const response = await request(app)
      .post(`/api/compromissos/${compromissoId}/gerar-contrato`)
      .set('Authorization', `Bearer ${token}`)
      .send(dadosContratante);
    
    // 5. Verifica as chamadas e a resposta
    expect(response.status).toBe(200);
    expect(contratoServico.gerarContratoPDF).toHaveBeenCalledTimes(1);
    expect(contratoServico.gerarContratoPDF).toHaveBeenCalledWith(
        expect.objectContaining({ id: compromissoId }),
        dadosContratante,
        expect.anything(),
        expect.anything()
    );
  });

  it('Deve atualizar um compromisso existente', async () => {
    // 1. Cria um compromisso
    const compromissoRes = await request(app)
      .post('/api/compromissos')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'Show', nome_evento: 'Nome Antigo', data: new Date() });
    
    const compromissoId = compromissoRes.body.id;

    // 2. Envia os dados para atualização
    const dadosAtualizados = {
      nome_evento: 'Nome Novo e Atualizado',
      status: 'Realizado'
    };

    const response = await request(app)
      .put(`/api/compromissos/${compromissoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(dadosAtualizados);

    // 3. Verifica a resposta
    expect(response.status).toBe(200);
    expect(response.body.nome_evento).toBe(dadosAtualizados.nome_evento);
    expect(response.body.status).toBe('Realizado');
  });

  it('Deve apagar um compromisso existente', async () => {
    // 1. Cria um compromisso
    const compromissoRes = await request(app)
      .post('/api/compromissos')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'Ensaio', nome_evento: 'Ensaio para Apagar', data: new Date() });
    
    const compromissoId = compromissoRes.body.id;

    // 2. Envia a requisição para apagar
    const deleteResponse = await request(app)
      .delete(`/api/compromissos/${compromissoId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(204);

    // 3. Tenta buscar o compromisso apagado para confirmar que não existe mais
    const getResponse = await request(app)
      .get(`/api/compromissos/${compromissoId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(getResponse.status).toBe(404);
  });

  it('Deve retornar 404 ao tentar atualizar um compromisso que não existe', async () => {
    const response = await request(app)
      .put('/api/compromissos/9999') // ID que não existe
      .set('Authorization', `Bearer ${token}`)
      .send({ nome_evento: 'Qualquer Nome' });

    expect(response.status).toBe(404);
  });
});