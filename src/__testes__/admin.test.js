// src/__testes__/admin.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // <--- 1. Importar o bcryptjs
const conexao = require('../database');
const tratadorDeErros = require('../middlewares/tratadorDeErros');

// Rotas
const usuarioRotas = require('../rotas/usuario.rotas');
const adminRotas = require('../rotas/admin.rotas');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/usuarios', usuarioRotas(conexao));
app.use('/api/admin', adminRotas(conexao));
app.use(tratadorDeErros);

describe('Testes das Rotas de Administração', () => {
  let adminToken;
  let userToken;
  let regularUser;

  beforeEach(async () => {
    await conexao.sync({ force: true });
    const { Usuario } = conexao.models;

    // 2. Criptografar a senha antes de criar os utilizadores
    const senhaCriptografada = bcrypt.hashSync('senha123', 10);

    // 3. Criar utilizadores com a senha já criptografada
    const adminUser = await Usuario.create({ nome: 'Admin', email: 'admin@teste.com', senha: senhaCriptografada, role: 'admin' });
    const adminLogin = await request(app).post('/api/usuarios/login').send({ email: adminUser.email, senha: 'senha123' });
    adminToken = adminLogin.body.token;

    regularUser = await Usuario.create({ nome: 'User', email: 'user@teste.com', senha: senhaCriptografada, role: 'usuario' });
    const userLogin = await request(app).post('/api/usuarios/login').send({ email: regularUser.email, senha: 'senha123' });
    userToken = userLogin.body.token;
  });

  afterAll(async () => {
    await conexao.close();
  });

  it('O Admin deve conseguir listar todos os utilizadores', async () => {
    const response = await request(app)
      .get('/api/admin/usuarios')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
  });

  it('Um utilizador normal NÃO deve conseguir aceder às rotas de admin', async () => {
    const response = await request(app)
      .get('/api/admin/usuarios')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
    expect(response.body.mensagem).toBe('Acesso negado. Requer nível de administrador.');
  });
  
  it('O Admin deve conseguir conceder um plano premium a um utilizador', async () => {
    const response = await request(app)
      .put(`/api/admin/usuarios/${regularUser.id}/assinatura`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ acao: 'conceder', plano: 'premium' });

    expect(response.status).toBe(200);

    const { Usuario } = conexao.models;
    const userUpdated = await Usuario.findByPk(regularUser.id);
    expect(userUpdated.plano).toBe('premium');
    expect(userUpdated.status_assinatura).toBe('ativa');
  });

  it('O Admin deve conseguir apagar um utilizador', async () => {
    const response = await request(app)
      .delete(`/api/admin/usuarios/${regularUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
      
    expect(response.status).toBe(204);

    const { Usuario } = conexao.models;
    const deletedUser = await Usuario.findByPk(regularUser.id);
    expect(deletedUser).toBeNull();
  });

   it('O Admin NÃO deve conseguir apagar a sua própria conta', async () => {
    // Obtém o ID do admin a partir do token
    const adminPayload = JSON.parse(Buffer.from(adminToken.split('.')[1], 'base64').toString());
    const adminId = adminPayload.id;

    const response = await request(app)
      .delete(`/api/admin/usuarios/${adminId}`) // Tenta apagar o próprio ID
      .set('Authorization', `Bearer ${adminToken}`);
      
    expect(response.status).toBe(403); // Espera "Forbidden"
    expect(response.body.mensagem).toBe('Um administrador não pode apagar a própria conta.');
  });
});