// src/__tests__/usuario.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const conexao = require('../database'); // A nossa conexão com o banco de dados (agora configurável)
const tratadorDeErros = require('../middlewares/tratadorDeErros');

// Importa as rotas que vamos testar
const usuarioRotas = require('../rotas/usuario.rotas');

// --- Configuração da Aplicação de Teste ---
// Criamos uma instância do Express APENAS para os testes
const app = express();
app.use(cors());
app.use(express.json());
// Registamos as rotas que queremos testar
app.use('/api/usuarios', usuarioRotas(conexao));
app.use(tratadorDeErros);


// --- Ciclo de Vida dos Testes ---
// O 'describe' agrupa testes relacionados
describe('Testes das Rotas de Usuário', () => {

  // Antes de TODOS os testes deste ficheiro, executa isto:
  beforeAll(async () => {
    // Sincroniza o banco de dados e aplica as migrações na base de dados de teste em memória
    await conexao.sync({ force: true });
  });

  // Depois de TODOS os testes deste ficheiro, executa isto:
  afterAll(async () => {
    // Fecha a conexão com o banco de dados para evitar que o processo fique pendurado
    await conexao.close();
  });


  // --- Testes Específicos ---
  // O 'it' ou 'test' define um caso de teste individual
  it('Deve registar um novo utilizador com sucesso', async () => {
    const novoUsuario = {
      nome: 'Utilizador de Teste',
      email: 'teste@email.com',
      senha: 'password123',
    };

    // Faz a requisição POST para a rota de registo
    const response = await request(app)
      .post('/api/usuarios/registrar')
      .send(novoUsuario);

    // Asserções: verificamos se a resposta é a que esperamos
    expect(response.status).toBe(201); // Esperamos o status HTTP 201 (Created)
    expect(response.body).toHaveProperty('token'); // Esperamos que a resposta tenha um token
    expect(response.body.usuario.nome).toBe(novoUsuario.nome); // Verificamos se o nome do utilizador está correto
    expect(response.body.usuario.email).toBe(novoUsuario.email);
    expect(response.body.usuario).not.toHaveProperty('senha'); // MUITO IMPORTANTE: garantir que a senha não é retornada
  });

  it('Não deve registar um utilizador com um e-mail já existente', async () => {
    // Primeiro, criamos um utilizador para garantir que o e-mail já existe
    const usuarioExistente = {
      nome: 'Utilizador Existente',
      email: 'existente@email.com',
      senha: 'password123',
    };
    await request(app).post('/api/usuarios/registrar').send(usuarioExistente);

    // Agora, tentamos registar outro utilizador com o mesmo e-mail
    const novoUsuarioComEmailRepetido = {
      nome: 'Outro Utilizador',
      email: 'existente@email.com',
      senha: 'outrasenha456',
    };

    const response = await request(app)
      .post('/api/usuarios/registrar')
      .send(novoUsuarioComEmailRepetido);

    // Asserções
    expect(response.status).toBe(400); // Esperamos o status HTTP 400 (Bad Request)
    expect(response.body.mensagem).toBe('Este e-mail já está em uso.');
  });
  
  // Adicione mais testes aqui para login, recuperação de senha, etc.

});