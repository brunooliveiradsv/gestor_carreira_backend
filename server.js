// server.js
require('dotenv').config();
const express = require("express");
const path = require('path');
const fs = require('fs'); // Módulo para interagir com o sistema de arquivos
const conexao = require("./src/database");
const cors = require("cors");

const app = express();

// --- NOVA LÓGICA PARA CRIAR PASTA DE UPLOADS ---
// Define o caminho absoluto para a pasta de uploads
const diretorioDeUploads = path.resolve(__dirname, 'tmp', 'uploads');

// Verifica se o diretório não existe
if (!fs.existsSync(diretorioDeUploads)) {
  // Cria o diretório recursivamente (cria 'tmp' e 'uploads' se necessário)
  fs.mkdirSync(diretorioDeUploads, { recursive: true });
  console.log(`✅ Diretório de uploads criado em: ${diretorioDeUploads}`);
}
// --- FIM DA NOVA LÓGICA ---

// Configuração do CORS
const corsOptions = {
 origin: ['https://voxgest.vercel.app', 'http://localhost:5173'], 
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Servir arquivos estáticos da pasta de uploads
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
const sugestaoRotas = require("./src/rotas/sugestao.rotas.js");

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
app.use("/api", sugestaoRotas(conexao));

const PORTA = process.env.PORT || 3000;

// Função assíncrona para iniciar o servidor de forma segura
async function iniciarServidor() {
  try {
    // 1. Tenta autenticar a conexão com o banco de dados
    await conexao.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso.');

    // 2. Se a conexão for bem-sucedida, inicia o servidor web
    app.listen(PORTA, () => {
      console.log(`🚀 Servidor rodando na porta ${PORTA}`);
      
      // 3. Somente após o servidor estar no ar, inicia as tarefas agendadas
      tarefasAgendadas.iniciarTarefas(conexao);
    });

  } catch (error) {
    // Se a conexão falhar, exibe um erro claro e encerra a aplicação
    console.error('❌ Não foi possível conectar ao banco de dados:', error);
    process.exit(1); // Encerra o processo com um código de erro
  }
}

// Chama a função para iniciar a aplicação
iniciarServidor();