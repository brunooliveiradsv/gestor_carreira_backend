// src/database/index.js
const Sequelize = require('sequelize');
const dbConfig = require('../config/database');

// Importa todas as definições de modelo
const Usuario = require('../modelos/usuario.modelo');
const Compromisso = require('../modelos/compromisso.modelo');
const Transacao = require('../modelos/transacao.modelo.js');
const Contato = require('../modelos/contato.modelo.js');
const Conquista = require('../modelos/conquista.modelo.js');
const UsuarioConquista = require('../modelos/usuario_conquista.modelo.js');
const Notificacao = require('../modelos/notificacao.modelo.js');
const Equipamento = require('../modelos/equipamento.modelo.js');
const Musica = require('../modelos/musica.modelo');
const Tag = require('../modelos/tag.modelo.js');
const Setlist = require('../modelos/setlist.modelo.js'); // Atualizado
const SetlistMusica = require('../modelos/setlist_musica.modelo.js'); // Novo

const conexao = new Sequelize(dbConfig);

// Inicializa cada modelo
Usuario.init(conexao);
Compromisso.init(conexao);
Transacao.init(conexao);
Contato.init(conexao);
Conquista.init(conexao);
UsuarioConquista.init(conexao);
Notificacao.init(conexao);
Equipamento.init(conexao);
Musica.init(conexao);
Tag.init(conexao);
Setlist.init(conexao);
SetlistMusica.init(conexao);

// Executa as associações de cada modelo
Usuario.associate(conexao.models);
Compromisso.associate(conexao.models);
Transacao.associate(conexao.models);
Contato.associate(conexao.models);
Conquista.associate(conexao.models);
UsuarioConquista.associate(conexao.models);
Notificacao.associate(conexao.models);
Equipamento.associate(conexao.models);
Musica.associate(conexao.models);
Tag.associate(conexao.models);
Setlist.associate(conexao.models);

module.exports = conexao;