// Arquivo: casa-espiritual-backend/routes/records.js
/**
 * @fileoverview Define as rotas da API para o gerenciamento de prontuários (registros médicos) de pacientes.
 * Estas rotas são aninhadas sob as rotas de pacientes (ex: /api/patients/:patientId/records)
 * e permitem listar e adicionar prontuários para um paciente específico.
 * A opção `mergeParams: true` no router é essencial para que este router filho
 * possa acessar os parâmetros da URL definidos na rota pai (como `patientId`).
 */

const express = require('express');
// mergeParams: true é crucial para que req.params.patientId (da rota pai) seja acessível aqui.
const router = express.Router({ mergeParams: true });
const db = require('../database.js'); // Módulo de conexão com o banco de dados SQLite.
const { v4: uuidv4 } = require('uuid'); // Biblioteca para gerar IDs únicos universais.

/**
 * Middleware simulado para verificação de token de autenticação.
 * Em um sistema de produção, esta função validaria um token JWT.
 * Atualmente, permite que todas as requisições prossigam para fins de desenvolvimento.
 * @param {express.Request} req - O objeto de requisição do Express.
 * @param {express.Response} res - O objeto de resposta do Express.
 * @param {express.NextFunction} next - Função para chamar o próximo middleware na pilha.
 */
const verifyToken = (req, res, next) => {
  // TODO: Implementar a validação real de token JWT para proteger estas rotas.
  next(); // Permite o prosseguimento sem validação de token por enquanto.
};

/**
 * @route   GET /api/patients/:patientId/records
 * @description Obtém todos os prontuários de um paciente específico.
 * Suporta parâmetros de query `limit` (para limitar o número de resultados)
 * e `sort` (com valor 'desc' para ordenar pelos mais recentes primeiro, baseado em `data_hora_atendimento`).
 * @access  Público (ou Privado, se `verifyToken` for ativado e implementado)
 * @param   {string} req.params.patientId - O ID do paciente cujos prontuários são solicitados.
 * @param   {string} [req.query.limit] - Opcional. Número máximo de prontuários a serem retornados.
 * @param   {string} [req.query.sort] - Opcional. Se 'desc', ordena por `data_hora_atendimento` descendente. Por padrão, ordena ascendente.
 * @returns {object[]} 200 - Um array de objetos, onde cada objeto representa um prontuário do paciente.
 * @returns {Error} 500 - Erro interno do servidor ao consultar o banco de dados.
 */
router.get('/', /*verifyToken,*/ (req, res) => {
  const { patientId } = req.params; // ID do paciente vindo da rota pai.
  const { limit, sort } = req.query; // Parâmetros de query para paginação e ordenação.

  let sql = "SELECT * FROM prontuarios WHERE patientId = ?";
  let params = [patientId];

  // Constrói a cláusula ORDER BY.
  if (sort && sort.toLowerCase() === 'desc') {
    sql += " ORDER BY data_hora_atendimento DESC";
  } else {
    // Ordenação padrão se 'sort' não for 'desc' ou não for fornecido.
    // Pode ser ajustado para ASC ou DESC conforme a necessidade padrão de exibição.
    sql += " ORDER BY data_hora_atendimento DESC"; // Mantendo DESC como padrão para ver os mais recentes.
  }

  // Adiciona a cláusula LIMIT se fornecida e válida.
  if (limit) {
    const numLimit = parseInt(limit, 10);
    if (!isNaN(numLimit) && numLimit > 0) {
      sql += " LIMIT ?";
      params.push(numLimit);
    }
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({"error": `Erro ao consultar prontuários: ${err.message}`});
      return;
    }
    res.json(rows);
  });
});

/**
 * @route   POST /api/patients/:patientId/records
 * @description Adiciona um novo prontuário para um paciente específico.
 * @access  Público (ou Privado, se `verifyToken` for ativado e implementado)
 * @param   {string} req.params.patientId - O ID do paciente ao qual o prontuário será associado.
 * @param   {object} req.body - Objeto contendo os dados do prontuário a ser criado.
 * @param   {string} req.body.data_hora_atendimento - Data e hora do atendimento (formato ISO 8601 esperado). (Obrigatório)
 * @param   {string} req.body.queixa_sessao - Queixa principal ou assunto da sessão. (Obrigatório)
 * @param   {string} req.body.id_atendente_fk - ID do atendente que registrou o prontuário. (Obrigatório)
 * @param   {string} [req.body.tipo_atendimento] - Tipo de atendimento realizado.
 * @param   {string} [req.body.relato_paciente] - Relato fornecido pelo paciente (opcional, pode não ser mais usado pelo formulário principal).
 * @param   {string} [req.body.observacoes_atendente] - Observações do atendente (opcional, pode não ser mais usado pelo formulário principal).
 * @param   {string} [req.body.intervencoes_orientacoes] - Intervenções realizadas e orientações fornecidas.
 * @param   {string} [req.body.encaminhamentos] - Encaminhamentos feitos, se houver.
 * @param   {string} [req.body.plano_proxima_sessao] - Plano para a próxima sessão, incluindo sugestões concatenadas.
 * @param   {string} [req.body.data_proxima_sessao_prontuario] - Data definida neste prontuário para a próxima sessão (opcional, não mais usado para atualizar paciente.data_proxima_consulta).
 * @returns {object} 201 - O objeto do prontuário recém-criado, incluindo seu ID gerado.
 * @returns {Error} 400 - Se campos obrigatórios estiverem faltando.
 * @returns {Error} 500 - Erro interno do servidor ao inserir no banco de dados.
 */
router.post('/', /*verifyToken,*/ (req, res) => {
  const { patientId } = req.params; // ID do paciente vindo da rota pai.
  // Desestrutura os campos esperados do corpo da requisição.
  const {
    data_hora_atendimento,
    tipo_atendimento,
    queixa_sessao,
    // Os campos relato_paciente e observacoes_atendente podem ou não vir do frontend.
    // Se não vierem, serão tratados como NULL abaixo.
    intervencoes_orientacoes,
    encaminhamentos,
    plano_proxima_sessao,
    // O campo data_proxima_sessao_prontuario foi removido da lógica principal de atualização do paciente,
    // mas a coluna ainda pode existir no banco de dados para registros antigos.
    // Se o frontend não o envia mais, ele será NULL.
    id_atendente_fk
  } = req.body;

  // Validação dos campos obrigatórios.
  if (!data_hora_atendimento || !queixa_sessao || !id_atendente_fk) {
    return res.status(400).json({ "error": "Campos obrigatórios do prontuário em falta (data_hora_atendimento, queixa_sessao, id_atendente_fk)." });
  }

  const newRecordId = uuidv4(); // Gera um ID único para o novo prontuário.
  const currentDate = new Date().toISOString(); // Data atual para os campos de timestamp.

  const sql = `INSERT INTO prontuarios (
                  recordId, patientId, id_atendente_fk, data_hora_atendimento, tipo_atendimento,
                  queixa_sessao, relato_paciente, observacoes_atendente, intervencoes_orientacoes,
                  encaminhamentos, plano_proxima_sessao, data_proxima_sessao_prontuario,
                  data_criacao_prontuario, data_ultima_modificacao
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const paramsSql = [
    newRecordId, patientId, id_atendente_fk,
    new Date(data_hora_atendimento).toISOString(), // Garante o formato ISO 8601 para a data do atendimento.
    tipo_atendimento || null,
    queixa_sessao,
    req.body.relato_paciente || null, // Pega do corpo da requisição; se não existir, insere NULL.
    req.body.observacoes_atendente || null, // Pega do corpo da requisição; se não existir, insere NULL.
    intervencoes_orientacoes || null,
    encaminhamentos || null,
    plano_proxima_sessao || null,
    req.body.data_proxima_sessao_prontuario ? new Date(req.body.data_proxima_sessao_prontuario).toISOString().split('T')[0] : null, // Se enviado e válido, guarda YYYY-MM-DD.
    currentDate, currentDate
  ];

  db.run(sql, paramsSql, function (err) {
    if (err) {
      return res.status(500).json({ "error": `Erro ao inserir prontuário: ${err.message}` });
    }
    // Após a inserção, busca e retorna o prontuário completo com os dados inseridos.
    db.get("SELECT * FROM prontuarios WHERE recordId = ?", [newRecordId], (err, row) => {
      if (err) {
        return res.status(500).json({"error": `Erro ao obter prontuário recém-criado: ${err.message}`});
      }
      res.status(201).json(row);
    });
  });
});

// TODO: Implementar rotas opcionais para gerenciamento individual de prontuários, se necessário:
// GET /api/patients/:patientId/records/:recordId - Obter um prontuário específico.
// PUT /api/patients/:patientId/records/:recordId - Atualizar um prontuário existente.
// DELETE /api/patients/:patientId/records/:recordId - Excluir um prontuário específico.

module.exports = router;