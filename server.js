// server.js
const express = require("express");
const conexao = require("./src/database");
const cors = require("cors"); // <-- 1. IMPORTE O PACOTE

const app = express();
// --- NOVA CONFIGURAÇÃO DO CORS ---
const corsOptions = {
  origin: 'https://gestor-carreira-frontend.vercel.app', // Apenas seu frontend pode acessar
  optionsSuccessStatus: 200 // Para compatibilidade com navegadores mais antigos
};
app.use(cors(corsOptions));
// Importamos o nosso arquivo de rotas
const usuarioRotas = require("./src/rotas/usuario.rotas.js");

// Isso garante que o controlador terá acesso aos modelos inicializados.
app.use("/api/usuarios", usuarioRotas(conexao));

// Rotas de Compromisso
const compromissoRotas = require("./src/rotas/compromisso.rotas.js");
app.use("/api/compromissos", compromissoRotas(conexao));

// Rotas Financeiras
const financeiroRotas = require("./src/rotas/financeiro.rotas.js");
app.use("/api/financeiro", financeiroRotas(conexao));

// Rotas de Contatos
const contatoRotas = require("./src/rotas/contato.rotas.js");
app.use("/api/contatos", contatoRotas(conexao));

// Rotas de Repertório
const repertorioRotas = require("./src/rotas/repertorio.rotas.js");
app.use("/api/repertorios", repertorioRotas(conexao));

// --- GARANTA QUE ESTAS DUAS LINHAS ESTÃO PRESENTES E CORRETAS ---
const conquistaRotas = require('./src/rotas/conquista.rotas.js');
app.use('/api/conquistas', conquistaRotas(conexao));

// Rotas de Administração
const adminRotas = require("./src/rotas/admin.rotas.js");
app.use("/api/admin", adminRotas(conexao));

const tarefasAgendadas = require('./src/tarefas-agendadas');
tarefasAgendadas.iniciarTarefas(conexao);

// --- LINHA NOVA ---
const notificacaoRotas = require('./src/rotas/notificacao.rotas.js');
app.use('/api/notificacoes', notificacaoRotas(conexao));

const equipamentoRotas = require('./src/rotas/equipamento.rotas.js');
app.use('/api/equipamentos', equipamentoRotas(conexao));

const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
  console.log(`Servidor rodando na porta ${PORTA}`);
});
