// src/database/index.js
const Sequelize = require('sequelize');
const dbConfig = require('../config/database');

// Importa todas as definições de modelo
const Usuario = require('../modelos/usuario.modelo');
const Compromisso = require('../modelos/compromisso.modelo');
const Transacao = require('../modelos/transacao.modelo.js');
const Contato = require('../modelos/contato.modelo.js');
const Repertorio = require('../modelos/repertorio.modelo.js');
const Conquista = require('../modelos/conquista.modelo.js');
const UsuarioConquista = require('../modelos/usuario_conquista.modelo.js');
const Notificacao = require('../modelos/notificacao.modelo.js');
const Equipamento = require('../modelos/equipamento.modelo.js');

const conexao = new Sequelize(dbConfig);

// Inicializa cada modelo
Usuario.init(conexao);
Compromisso.init(conexao);
Transacao.init(conexao);
Contato.init(conexao);
Repertorio.init(conexao);
Conquista.init(conexao);
UsuarioConquista.init(conexao);
Notificacao.init(conexao);
Equipamento.init(conexao);

// Executa as associações de cada modelo
Usuario.associate(conexao.models);
Compromisso.associate(conexao.models);
Transacao.associate(conexao.models);
Contato.associate(conexao.models);
Repertorio.associate(conexao.models);
Conquista.associate(conexao.models);
Notificacao.associate(conexao.models);
Equipamento.associate(conexao.models);

module.exports = conexao;