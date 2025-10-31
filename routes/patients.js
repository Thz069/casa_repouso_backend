// Arquivo: casa-espiritual-backend/routes/patients.js
/**
 * @fileoverview Define as rotas da API para o gerenciamento de pacientes.
 * Inclui operações CRUD (Criar, Ler, Atualizar, Excluir) para os registros de pacientes.
 */

const express = require('express');
const router = express.Router();
const db = require('../database.js'); // Módulo de conexão com o banco de dados SQLite.
const { v4: uuidv4 } = require('uuid'); // Biblioteca para gerar IDs únicos universais.

/**
 * Middleware simulado para verificação de token de autenticação.
 * Em um sistema de produção, esta função validaria um token JWT (JSON Web Token)
 * enviado no cabeçalho da requisição para proteger as rotas.
 * Atualmente, permite que todas as requisições prossigam para fins de desenvolvimento.
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
 * @route   GET /api/patients
 * @description Obtém uma lista de todos os pacientes cadastrados, ordenados por nome completo.
 * @access  Público (ou Privado, se `verifyToken` for ativado)
 * @returns {object[]} 200 - Um array de objetos, onde cada objeto representa um paciente.
 * @returns {Error} 500 - Erro interno do servidor ao consultar o banco de dados.
 */
router.get('/', /*verifyToken,*/ (req, res) => {
  const sql = "SELECT * FROM pacientes ORDER BY nomeCompleto ASC";
  db.all(sql, [], (err, rows) => {
    if (err) {
      // Em produção, logar o erro detalhado no servidor e retornar uma mensagem genérica.
      res.status(500).json({"error": `Erro ao consultar o banco de dados: ${err.message}`});
      return;
    }
    res.json(rows);
  });
});

/**
 * @route   POST /api/patients
 * @description Registra um novo paciente no sistema.
 * @access  Público (ou Privado, se `verifyToken` for ativado)
 * @param   {object} req.body - Objeto contendo os dados do paciente a ser criado.
 * @param   {string} req.body.nomeCompleto - Nome completo do paciente (obrigatório).
 * @param   {string} req.body.telefonePrincipal - Telefone principal do paciente (obrigatório).
 * @param   {string} [req.body.dataNascimento] - Data de nascimento (YYYY-MM-DD).
 * @param   {string} [req.body.genero] - Gênero do paciente.
 * @param   {string} [req.body.cpf] - CPF do paciente (deve ser único se a restrição UNIQUE estiver ativa no DB).
 * @param   {string} [req.body.email] - Email do paciente.
 * @param   {string} [req.body.cep] - CEP do endereço do paciente.
 * @param   {string} [req.body.logradouro] - Logradouro do endereço.
 * @param   {string} [req.body.numeroEndereco] - Número do endereço.
 * @param   {string} [req.body.complemento] - Complemento do endereço.
 * @param   {string} [req.body.bairro] - Bairro do endereço.
 * @param   {string} [req.body.cidade] - Cidade do endereço.
 * @param   {string} [req.body.estado] - Estado do endereço.
 * @param   {string} [req.body.comoConheceu] - Como o paciente conheceu a casa.
 * @param   {string} [req.body.motivoInicialBusca] - Motivo inicial da busca do paciente.
 * @param   {string} [req.body.data_proxima_consulta] - Data da próxima consulta do paciente (YYYY-MM-DD).
 * @returns {object} 201 - O objeto do paciente recém-criado, incluindo seu ID gerado e datas de cadastro/modificação.
 * @returns {Error} 400 - Se campos obrigatórios (nomeCompleto, telefonePrincipal) estiverem faltando.
 * @returns {Error} 500 - Erro interno do servidor ao inserir no banco de dados.
 */
router.post('/', /*verifyToken,*/ (req, res) => {
  const {
    nomeCompleto, dataNascimento, genero, cpf, telefonePrincipal, email,
    cep, logradouro, numeroEndereco, complemento, bairro, cidade, estado,
    comoConheceu, motivoInicialBusca, data_proxima_consulta
  } = req.body;

  if (!nomeCompleto || !telefonePrincipal) {
    return res.status(400).json({ "error": "Os campos 'nomeCompleto' e 'telefonePrincipal' são obrigatórios." });
  }
  const newPatientId = uuidv4();
  const currentDate = new Date().toISOString();
  const sql = `INSERT INTO pacientes (
                  id, nomeCompleto, dataNascimento, genero, cpf, telefonePrincipal, email,
                  cep, logradouro, numeroEndereco, complemento, bairro, cidade, estado,
                  comoConheceu, motivoInicialBusca, data_proxima_consulta,
                  dataCadastro, data_ultima_modificacao_cadastro
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    newPatientId, nomeCompleto, dataNascimento || null, genero || null, cpf || null,
    telefonePrincipal, email || null, cep || null, logradouro || null, numeroEndereco || null,
    complemento || null, bairro || null, cidade || null, estado || null, comoConheceu || null,
    motivoInicialBusca || null, data_proxima_consulta || null,
    currentDate, currentDate
  ];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ "error": `Erro ao inserir na base de dados: ${err.message}` });
    }
    // Após a inserção, busca e retorna o paciente completo.
    db.get("SELECT * FROM pacientes WHERE id = ?", [newPatientId], (err, row) => {
      if (err) {
        return res.status(500).json({"error": `Erro ao obter paciente recém-criado: ${err.message}`});
      }
      res.status(201).json(row);
    });
  });
});

/**
 * @route   GET /api/patients/:id
 * @description Obtém os dados de um paciente específico pelo seu ID.
 * @access  Público (ou Privado, se `verifyToken` for ativado)
 * @param   {string} req.params.id - O ID do paciente a ser buscado.
 * @returns {object} 200 - O objeto do paciente encontrado.
 * @returns {Error} 404 - Se o paciente com o ID fornecido não for encontrado.
 * @returns {Error} 500 - Erro interno do servidor ao consultar o banco de dados.
 */
router.get('/:id', /*verifyToken,*/ (req, res) => {
  const patientId = req.params.id;
  const sql = "SELECT * FROM pacientes WHERE id = ?";
  db.get(sql, [patientId], (err, row) => {
    if (err) {
      res.status(500).json({"error": `Erro ao consultar o banco de dados: ${err.message}`});
      return;
    }
    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ "error": `Paciente com ID ${patientId} não encontrado.` });
    }
  });
});

/**
 * @route   PUT /api/patients/:id
 * @description Atualiza os dados de um paciente existente.
 * Apenas os campos fornecidos no corpo da requisição são atualizados.
 * @access  Público (ou Privado, se `verifyToken` for ativado)
 * @param   {string} req.params.id - O ID do paciente a ser atualizado.
 * @param   {object} req.body - Objeto contendo os campos do paciente a serem atualizados.
 * Pode incluir qualquer um dos campos da tabela `pacientes` (exceto `id` e `dataCadastro`).
 * @returns {object} 200 - O objeto do paciente completamente atualizado.
 * @returns {Error} 400 - Se nenhum dado ou nenhum campo válido for fornecido para atualização.
 * @returns {Error} 404 - Se o paciente com o ID fornecido não for encontrado ou nenhum dado for alterado.
 * @returns {Error} 500 - Erro interno do servidor ao atualizar o banco de dados.
 */
router.put('/:id', /*verifyToken,*/ (req, res) => {
  const patientId = req.params.id;
  // Os campos são extraídos dinamicamente do req.body abaixo.

  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ "error": "Nenhum dado fornecido para atualização." });
  }

  // Lista de campos permitidos para atualização.
  const possibleFields = [
    'nomeCompleto', 'dataNascimento', 'genero', 'cpf', 'telefonePrincipal', 'email',
    'cep', 'logradouro', 'numeroEndereco', 'complemento', 'bairro', 'cidade', 'estado',
    'comoConheceu', 'motivoInicialBusca', 'data_proxima_consulta'
  ];

  let fieldsToUpdate = [];
  let params = [];

  possibleFields.forEach(field => {
    if (req.body[field] !== undefined) { // Verifica se o campo foi enviado no corpo.
      fieldsToUpdate.push(`${field} = ?`);
      // Trata strings vazias para campos de data como NULL.
      if ((field === 'dataNascimento' || field === 'data_proxima_consulta') && req.body[field] === '') {
        params.push(null);
      } else {
        params.push(req.body[field]);
      }
    }
  });

  if (fieldsToUpdate.length === 0) {
    return res.status(400).json({ "error": "Nenhum campo válido fornecido para atualização. Verifique os nomes dos campos enviados." });
  }

  // Adiciona a data de última modificação e o ID do paciente aos parâmetros da query.
  fieldsToUpdate.push("data_ultima_modificacao_cadastro = ?");
  params.push(new Date().toISOString());
  params.push(patientId); // Para a cláusula WHERE.

  const sql = `UPDATE pacientes SET ${fieldsToUpdate.join(", ")} WHERE id = ?`;

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ "error": `Erro ao atualizar na base de dados: ${err.message}` });
    }
    if (this.changes === 0) { // Nenhuma linha foi alterada (paciente não encontrado ou dados iguais).
      return res.status(404).json({ "error": `Paciente com ID ${patientId} não encontrado ou nenhum dado alterado.` });
    }
    // Após a atualização, busca e retorna o paciente completo.
    db.get("SELECT * FROM pacientes WHERE id = ?", [patientId], (err, row) => {
      if (err) {
        return res.status(500).json({"error": `Erro ao obter paciente atualizado: ${err.message}`});
      }
      res.json(row); // Retorna o objeto do paciente com todos os campos atualizados.
    });
  });
});

/**
 * @route   DELETE /api/patients/:id
 * @description Exclui um paciente do sistema.
 * A exclusão em cascata configurada no banco de dados removerá os prontuários associados.
 * @access  Público (ou Privado, se `verifyToken` for ativado)
 * @param   {string} req.params.id - O ID do paciente a ser excluído.
 * @returns {object} 200 - Mensagem de sucesso indicando que o paciente foi excluído.
 * @returns {Error} 404 - Se o paciente com o ID fornecido não for encontrado.
 * @returns {Error} 500 - Erro interno do servidor ao excluir do banco de dados.
 */
router.delete('/:id', /*verifyToken,*/ (req, res) => {
  const patientId = req.params.id;
  const sql = 'DELETE FROM pacientes WHERE id = ?';
  db.run(sql, [patientId], function (err) {
    if (err) {
      return res.status(500).json({ "error": `Erro ao excluir da base de dados: ${err.message}` });
    }
    if (this.changes === 0) { // Nenhuma linha foi afetada pela exclusão.
      return res.status(404).json({ "error": `Paciente com ID ${patientId} não encontrado para exclusão.` });
    }
    res.json({ "message": "success", "detail": `Paciente com ID ${patientId} excluído com sucesso.` });
  });
});

module.exports = router;