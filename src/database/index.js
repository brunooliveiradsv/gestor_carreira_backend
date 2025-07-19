// src/database/index.js
const Sequelize = require('sequelize');
const dbConfig = require('../config/database');

// Importa TODOS os modelos da aplicação
const Usuario = require('../modelos/usuario.modelo');
const Compromisso = require('../modelos/compromisso.modelo');
const Transacao = require('../modelos/transacao.modelo.js');
const Contato = require('../modelos/contato.modelo.js');
const Conquista = require('../modelos/conquista.modelo.js');
const UsuarioConquista = require('../modelos/usuario_conquista.modelo.js');
const Notificacao = require('../modelos/notificacao.modelo.js');
const Equipamento = require('../modelos/equipamento.modelo.js');
const Setlist = require('../modelos/setlist.modelo.js');
const Musica = require('../modelos/musica.modelo.js');
const Tag = require('../modelos/tag.modelo.js');
const SetlistMusica = require('../modelos/setlist_musica.modelo.js');
const SugestaoMusica = require('../modelos/sugestao_musica.modelo.js');
const ActivityLog = require('../modelos/activity_log.modelo.js');
const Post = require('../modelos/post.modelo.js');

const conexao = new Sequelize(dbConfig);

// Coloca todos os modelos num array para facilitar a gestão
const modelos = [
  Usuario,
  Compromisso,
  Transacao,
  Contato,
  Conquista,
  UsuarioConquista,
  Notificacao,
  Equipamento,
  Setlist,
  Musica,
  Tag,
  SetlistMusica,
  SugestaoMusica,
  ActivityLog,
  Post
];

// Inicializa cada modelo, passando a conexão
modelos.forEach(modelo => modelo.init(conexao));

// Executa as associações de cada modelo, se o método 'associate' existir
modelos.forEach(modelo => {
  if (modelo.associate) {
    modelo.associate(conexao.models);
  }
});

module.exports = conexao;