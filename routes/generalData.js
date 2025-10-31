// Arquivo: casa-espiritual-backend/routes/generalData.js
/**
 * @fileoverview Define as rotas da API para consultas gerais de dados,
 * como a listagem de todos os prontuários do sistema.
 */

const express = require('express');
const router = express.Router();
const db = require('../database.js'); // Módulo de conexão com o banco de dados SQLite.

/**
 * Middleware simulado para verificação de token de autenticação.
 * Em um sistema de produção, esta função validaria um token JWT (JSON Web Token)
 * enviado no cabeçalho da requisição para proteger as rotas.
 * Por agora, permite que todas as requisições prossigam.
 * @param {express.Request} req - O objeto de requisição do Express.
 * @param {express.Response} res - O objeto de resposta do Express.
 * @param {express.NextFunction} next - Função para chamar o próximo middleware na pilha.
 */
const verifyToken = (req, res, next) => {
  // TODO: Implementar a validação real de token JWT.
  // Exemplo de como seria com JWT:
  // const bearerHeader = req.headers['authorization'];
  // if (typeof bearerHeader !== 'undefined') {
  //   const bearerToken = bearerHeader.split(' ')[1];
  //   jwt.verify(bearerToken, 'SUA_CHAVE_SECRETA_JWT', (err, decoded) => {
  //     if (err) {
  //       return res.status(403).json({ error: "Token inválido ou expirado." });
  //     }
  //     req.user = decoded; // Adiciona os dados do usuário decodificados ao objeto req.
  //     next();
  //   });
  // } else {
  //   res.status(401).json({ error: "Token de autenticação não fornecido." });
  // }
  next(); // Permite o prosseguimento sem validação de token por enquanto.
};

/**
 * Rota para obter todos os prontuários de todos os pacientes.
 * Realiza um JOIN com as tabelas de pacientes e atendentes para enriquecer os dados do prontuário.
 * Os resultados são ordenados pela data e hora do atendimento, dos mais recentes para os mais antigos.
 *
 * @route GET /api/geral/todos-prontuarios
 * @description Obtém uma lista agregada de todos os prontuários, incluindo o nome do paciente e do atendente.
 * @access Privado (deveria ser protegido por token de autenticação via middleware `verifyToken`).
 * @returns {object[]} 200 - Um array de objetos, onde cada objeto representa um prontuário com dados adicionais.
 * @returns {Error} 500 - Erro interno do servidor ao consultar o banco de dados ou exceção inesperada.
 *
 * @example Estrutura do objeto de prontuário retornado:
 * {
 * "recordId": "string",
 * "patientId": "string",
 * "patientName": "string",
 * "id_atendente_fk": "string",
 * "attendantName": "string" | null,
 * "data_hora_atendimento": "string (ISO 8601)",
 * "tipo_atendimento": "string" | null,
 * "queixa_sessao": "string",
 * "relato_paciente": "string" | null,
 * "observacoes_atendente": "string" | null,
 * "intervencoes_orientacoes": "string" | null,
 * "encaminhamentos": "string" | null,
 * "plano_proxima_sessao": "string" | null,
 * "data_criacao_prontuario": "string (ISO 8601)",
 * "data_ultima_modificacao": "string (ISO 8601)"
 * }
 */
router.get('/todos-prontuarios', /* verifyToken, */ async (req, res) => {
  const sql = `
    SELECT 
      p.recordId,
      p.patientId,
      pac.nomeCompleto AS patientName,
      p.id_atendente_fk,
      at.nome_completo_atendente AS attendantName,
      p.data_hora_atendimento,
      p.tipo_atendimento,
      p.queixa_sessao,
      p.relato_paciente,
      p.observacoes_atendente,
      p.intervencoes_orientacoes,
      p.encaminhamentos,
      p.plano_proxima_sessao,
      p.data_criacao_prontuario,
      p.data_ultima_modificacao
    FROM 
      prontuarios p
    INNER JOIN 
      pacientes pac ON p.patientId = pac.id
    LEFT JOIN 
      atendentes at ON p.id_atendente_fk = at.id 
    ORDER BY 
      p.data_hora_atendimento DESC;
  `;
  // Nota: O LEFT JOIN com a tabela 'atendentes' é usado para garantir que os prontuários
  // sejam retornados mesmo que o atendente associado tenha sido removido ou
  // se o campo id_atendente_fk for nulo (dependendo das regras de integridade).

  try {
    db.all(sql, [], (err, rows) => {
      if (err) {
        // Em produção, erros detalhados do banco de dados não deveriam ser expostos ao cliente.
        // Seriam logados no servidor e uma mensagem genérica seria enviada.
        res.status(500).json({ "error": `Erro ao consultar o banco de dados: ${err.message}` });
        return;
      }
      res.json(rows);
    });
  } catch (error) {
    // Captura exceções síncronas inesperadas, embora com db.all o erro principal venha no callback.
    res.status(500).json({ "error": "Ocorreu um erro inesperado no servidor ao processar sua solicitação." });
  }
});

module.exports = router;