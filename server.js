// Arquivo: casa-espiritual-backend/server.js
/**
 * @fileoverview Arquivo principal do servidor backend.
 * Configura e inicia o servidor Express, define middlewares, monta as rotas da API
 * e trata erros básicos.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// A importação do 'db' aqui garante que a conexão com o banco de dados
// e a criação das tabelas (definidas em database.js) sejam inicializadas
// quando o servidor é iniciado.
const db = require('./database.js');
const patientRoutes = require('./routes/patients.js');
const recordRoutes = require('./routes/records.js');
const generalDataRoutes = require('./routes/generalData.js');

/**
 * Instância principal da aplicação Express.
 * @type {express.Application}
 */
const app = express();

/**
 * Porta em que o servidor backend será executado.
 * Utiliza a variável de ambiente PORT se definida, caso contrário, usa 3001.
 * @type {string | number}
 */
const PORT = process.env.PORT || 3001;

// --- Configuração de Middlewares ---

/**
 * Middleware CORS (Cross-Origin Resource Sharing).
 * Habilita o CORS para permitir que o frontend React (servido em uma porta diferente)
 * faça requisições para esta API backend.
 */
app.use(cors());

/**
 * Middleware para parsear corpos de requisição JSON.
 * Permite que o Express entenda e processe dados enviados no formato JSON no corpo das requisições.
 */
app.use(express.json());

/**
 * Middleware para parsear corpos de requisição URL-encoded.
 * Permite que o Express entenda e processe dados enviados através de formulários HTML tradicionais.
 * `extended: true` permite objetos e arrays aninhados.
 */
app.use(express.urlencoded({ extended: true }));

// --- Definição de Rotas da API ---

/**
 * @route GET /
 * @description Rota raiz da API, geralmente usada para um teste básico de conectividade
 * ou para fornecer informações gerais sobre a API.
 * @returns {object} 200 - Mensagem de boas-vindas.
 */
app.get('/', (req, res) => {
  res.json({ message: "Bem-vindo à API da Casa de Acompanhamento Espiritual!" });
});

/**
 * Monta as rotas relacionadas a pacientes sob o prefixo `/api/patients`.
 * Todas as rotas definidas em `patientRoutes` serão acessíveis via `/api/patients/...`.
 */
app.use('/api/patients', patientRoutes);

/**
 * Monta as rotas relacionadas a prontuários (registros) de um paciente específico.
 * Estas rotas são aninhadas e esperam um `patientId` na URL.
 * O `recordRoutes` (definido em `routes/records.js`) deve usar `mergeParams: true`
 * em seu router para acessar `req.params.patientId`.
 * Rotas acessíveis via `/api/patients/:patientId/records/...`.
 */
app.use('/api/patients/:patientId/records', recordRoutes);

/**
 * Monta as rotas para consultas gerais de dados, como a listagem de todos os prontuários.
 * Rotas acessíveis via `/api/geral/...`.
 */
app.use('/api/geral', generalDataRoutes);

/**
 * Monta as rotas de autenticação sob o prefixo `/api/auth`.
 * Rotas acessíveis via `/api/auth/...`.
 */
const authRoutes = require('./routes/auth.js');
app.use('/api/auth', authRoutes);


// --- Middlewares de Tratamento de Erros ---

/**
 * Middleware para tratar rotas não encontradas (Erro 404).
 * Este middleware é alcançado se nenhuma das rotas anteriores corresponder à requisição.
 * @param {express.Request} req - O objeto de requisição.
 * @param {express.Response} res - O objeto de resposta.
 * @param {express.NextFunction} next - Função para chamar o próximo middleware.
 */
app.use((req, res, next) => {
  res.status(404).json({ error: "Endpoint não encontrado." });
});

/**
 * Middleware global para tratamento de erros.
 * Captura quaisquer erros que ocorram durante o processamento das requisições
 * e envia uma resposta de erro 500 (Erro Interno do Servidor).
 * @param {Error} err - O objeto de erro.
 * @param {express.Request} req - O objeto de requisição.
 * @param {express.Response} res - O objeto de resposta.
 * @param {express.NextFunction} next - Função para chamar o próximo middleware (não usada aqui, pois é o final da pilha de erros).
 */
app.use((err, req, res, next) => {
  // Em um ambiente de produção, erros detalhados (err.stack) devem ser logados
  // em um sistema de monitoramento, e não expostos ao cliente.
  res.status(500).json({ error: 'Algo correu mal no servidor!' });
});


// --- Inicialização do Servidor ---

/**
 * Inicia o servidor Express para escutar requisições na porta especificada.
 */
app.listen(PORT, () => {
  // console.log(`Servidor backend rodando na porta ${PORT}`);
});
