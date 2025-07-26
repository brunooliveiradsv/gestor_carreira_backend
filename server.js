// server.js
require('dotenv').config();
const express = require("express");
const path = require('path');
const fs = require('fs');
const conexao = require("./src/database");
const cors = require("cors");
const tratadorDeErros = require('./src/middlewares/tratadorDeErros'); // IMPORTADO

const app = express();

const diretorioDeUploads = path.resolve(__dirname, 'tmp', 'uploads');
if (!fs.existsSync(diretorioDeUploads)) {
  fs.mkdirSync(diretorioDeUploads, { recursive: true });
  console.log(`✅ Diretório de uploads criado em: ${diretorioDeUploads}`);
}

const corsOptions = {
 origin: [
    'https://voxgest.vercel.app',
    'http://localhost:5173'
],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(diretorioDeUploads));

// Importação de todas as rotas da sua API
const usuarioRotas = require("./src/rotas/usuario.rotas.js");
const compromissoRotas = require("./src/rotas/compromisso.rotas.js");
const financeiroRotas = require("./src/rotas/financeiro.rotas.js");
const contatoRotas = require("./src/rotas/contato.rotas.js");
const setlistRotas = require("./src/rotas/setlist.rotas.js");
const conquistaRotas = require('./src/rotas/conquista.rotas.js');
const adminRotas = require("./src/rotas/admin.rotas.js");
const notificacaoRotas = require('./src/rotas/notificacao.rotas.js');
const equipamentoRotas = require('./src/rotas/equipamento.rotas.js');
const tarefasAgendadas = require('./src/tarefas-agendadas');
const musicaRotas = require("./src/rotas/musica.rotas.js");
const tagRotas = require("./src/rotas/tag.rotas.js");
const vitrineRotas = require("./src/rotas/vitrine.rotas.js");
const musicaMestreRotas = require("./src/rotas/musica_mestre.rotas.js");
const logRotas = require("./src/rotas/log.rotas.js");
const postRotas = require("./src/rotas/post.rotas.js"); 
const assinaturaRotas = require("./src/rotas/assinatura.rotas.js");
const webhookRotas = require("./src/rotas/webhook.rotas.js");
const enqueteRotas = require('./src/rotas/enquete.rotas.js');
const authRotas = require('./src/rotas/auth.rotas.js'); // Rota de autenticação

// Registro de todas as rotas da API
app.use("/api/usuarios", usuarioRotas(conexao));
app.use("/api/compromissos", compromissoRotas(conexao));
app.use("/api/financeiro", financeiroRotas(conexao));
app.use("/api/contatos", contatoRotas(conexao));
app.use("/api/setlists", setlistRotas(conexao));
app.use('/api/conquistas', conquistaRotas(conexao));
app.use("/api/admin", adminRotas(conexao));
app.use('/api/notificacoes', notificacaoRotas(conexao));
app.use('/api/equipamentos', equipamentoRotas(conexao));
app.use("/api/musicas", musicaRotas(conexao));
app.use("/api/tags", tagRotas(conexao));
app.use("/api/vitrine", vitrineRotas(conexao));
app.use("/api/admin/musicas", musicaMestreRotas(conexao));
app.use("/api/admin/logs", logRotas(conexao));
app.use("/api/posts", postRotas(conexao));
app.use("/api/assinatura", assinaturaRotas(conexao));
app.use("/webhook", webhookRotas(conexao));
app.use("/api/enquetes", enqueteRotas(conexao));
app.use("/api/auth", authRotas(conexao))

// ADICIONADO: Middleware de tratamento de erros deve ser o ÚLTIMO
app.use(tratadorDeErros);

const PORTA = process.env.PORT || 3000;

async function iniciarServidor() {
  try {
    await conexao.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso.');
    app.listen(PORTA, () => {
      console.log(`🚀 Servidor rodando na porta ${PORTA}`);
      tarefasAgendadas.iniciarTarefas(conexao);
    });
  } catch (error) {
    console.error('❌ Não foi possível conectar ao banco de dados:', error);
    process.exit(1);
  }
}

iniciarServidor();