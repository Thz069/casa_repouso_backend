// Arquivo: casa-espiritual-backend/database.js
/**
 * @fileoverview Configuração e inicialização do banco de dados SQLite.
 * Este módulo é responsável por criar o arquivo do banco de dados (se não existir),
 * conectar-se a ele e definir o esquema das tabelas da aplicação:
 * `atendentes`, `pacientes` e `prontuarios`.
 * Também insere um atendente padrão para fins de desenvolvimento e simulação.
 */

const sqlite3 = require('sqlite3').verbose(); // Importa o driver sqlite3 no modo verbose para mais detalhes em erros.
const DBSOURCE = "db.sqlite"; // Define o nome do arquivo que armazenará o banco de dados SQLite.

/**
 * Objeto de conexão com o banco de dados SQLite.
 * A conexão é estabelecida quando este módulo é carregado.
 * O banco de dados e as tabelas são criados se não existirem.
 * @type {sqlite3.Database}
 */
let db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    // Lança um erro se a conexão com o banco de dados falhar,
    // impedindo a aplicação de continuar sem uma base de dados funcional.
    // Em um ambiente de produção, este erro seria logado de forma mais robusta.
    throw err; // Interrompe a execução se não conseguir abrir o DB.
  } else {
    // Bloco executado após a conexão bem-sucedida.
    // Ativa o suporte a chaves estrangeiras no SQLite, essencial para integridade referencial.
    db.run("PRAGMA foreign_keys = ON;", (pragmaErr) => {
      if (pragmaErr) {
        // Em produção, este erro seria logado.
        // A falha em ativar chaves estrangeiras pode levar a inconsistências nos dados.
      }
    });

    /**
     * Cria a tabela `atendentes` se ela não existir.
     * Armazena informações sobre os usuários (atendentes) do sistema.
     * - id: Chave primária, identificador único do atendente (TEXT, formato UUID).
     * - nome_usuario: Nome de usuário para login (TEXT, deve ser único e não nulo).
     * - hash_senha: Hash da senha do atendente (TEXT, não nulo). NUNCA armazene senhas em texto plano.
     * - nome_completo_atendente: Nome completo do atendente (TEXT).
     */
    db.run(`CREATE TABLE IF NOT EXISTS atendentes (
            id TEXT PRIMARY KEY,
            nome_usuario TEXT UNIQUE NOT NULL,
            hash_senha TEXT NOT NULL,
            nome_completo_atendente TEXT
        )`, (errTableAtendentes) => {
      if (errTableAtendentes) {
        // Erro ao criar a tabela 'atendentes'.
      } else {
        // Insere um atendente padrão para desenvolvimento ou se a tabela estiver vazia.
        // 'INSERT OR IGNORE' previne erro se o atendente com 'id' 'user01' já existir.
        const insertDefaultAttendant = `INSERT OR IGNORE INTO atendentes (id, nome_usuario, hash_senha, nome_completo_atendente) VALUES (?, ?, ?, ?)`;
        // ATENÇÃO: 'senha123hash' é um placeholder. Em produção, use hashes de senha seguros gerados por bibliotecas como bcrypt.
        db.run(insertDefaultAttendant, ['user01', 'atendente', 'senha123hash', 'Atendente Principal'], function(errInsertAttendant) {
          if (errInsertAttendant) {
            // Erro ao inserir o atendente padrão.
          } else if (this.changes > 0) {
            // Atendente padrão inserido com sucesso.
          }
        });
      }
    });

    /**
     * Cria a tabela `pacientes` se ela não existir.
     * Armazena informações detalhadas sobre os pacientes.
     * - id: Chave primária, identificador único do paciente (TEXT, formato UUID).
     * - nomeCompleto: Nome completo do paciente (TEXT, não nulo).
     * - dataNascimento: Data de nascimento do paciente (TEXT, formato YYYY-MM-DD).
     * - genero: Gênero do paciente (TEXT).
     * - cpf: CPF do paciente (TEXT, com restrição UNIQUE para garantir unicidade).
     * - telefonePrincipal: Telefone principal de contato (TEXT, não nulo).
     * - email: Endereço de email do paciente (TEXT).
     * - cep, logradouro, numeroEndereco, complemento, bairro, cidade, estado: Campos de endereço (TEXT).
     * - comoConheceu: Como o paciente conheceu a instituição (TEXT).
     * - motivoInicialBusca: Motivo inicial da busca por atendimento (TEXT).
     * - data_proxima_consulta: Data agendada para a próxima consulta do paciente (TEXT, formato YYYY-MM-DD).
     * - dataCadastro: Data e hora do cadastro do paciente (TEXT, formato ISO 8601, não nulo).
     * - data_ultima_modificacao_cadastro: Data e hora da última modificação do cadastro (TEXT, formato ISO 8601, não nulo).
     */
    const createPacientesTableSql = `
        CREATE TABLE IF NOT EXISTS pacientes (
            id TEXT PRIMARY KEY,
            nomeCompleto TEXT NOT NULL,
            dataNascimento TEXT,
            genero TEXT,
            cpf TEXT UNIQUE,
            telefonePrincipal TEXT NOT NULL,
            email TEXT,
            cep TEXT,
            logradouro TEXT,
            numeroEndereco TEXT,
            complemento TEXT,
            bairro TEXT,
            cidade TEXT,
            estado TEXT,
            comoConheceu TEXT,
            motivoInicialBusca TEXT,
            data_proxima_consulta TEXT,
            dataCadastro TEXT NOT NULL,
            data_ultima_modificacao_cadastro TEXT NOT NULL
        )`;
    db.run(createPacientesTableSql, (errTablePacientes) => {
      if (errTablePacientes) {
        // Erro ao criar a tabela 'pacientes'.
      }
    });

    /**
     * Cria a tabela `prontuarios` se ela não existir.
     * Armazena os registros de atendimento (prontuários) de cada paciente.
     * - recordId: Chave primária, identificador único do prontuário (TEXT, formato UUID).
     * - patientId: Chave estrangeira referenciando `pacientes(id)`. Se o paciente for excluído, os prontuários associados também são (ON DELETE CASCADE). (TEXT, não nulo).
     * - id_atendente_fk: Chave estrangeira referenciando `atendentes(id)`. Se o atendente for excluído, este campo é definido como NULL (ON DELETE SET NULL). (TEXT, não nulo).
     * - data_hora_atendimento: Data e hora do atendimento (TEXT, formato ISO 8601, não nulo).
     * - tipo_atendimento: Tipo de atendimento realizado (TEXT).
     * - queixa_sessao: Queixa principal ou assunto da sessão (TEXT, não nulo).
     * - relato_paciente: Relato fornecido pelo paciente durante a sessão (TEXT, permite NULL).
     * - observacoes_atendente: Observações do atendente sobre a sessão (TEXT, permite NULL).
     * - intervencoes_orientacoes: Intervenções realizadas e orientações fornecidas (TEXT).
     * - encaminhamentos: Encaminhamentos feitos, se houver (TEXT).
     * - plano_proxima_sessao: Plano definido para a próxima sessão (TEXT).
     * - data_criacao_prontuario: Data e hora de criação do registro do prontuário (TEXT, formato ISO 8601, não nulo).
     * - data_ultima_modificacao: Data e hora da última modificação do prontuário (TEXT, formato ISO 8601, não nulo).
     */
    const createProntuariosTableSql = `
        CREATE TABLE IF NOT EXISTS prontuarios (
            recordId TEXT PRIMARY KEY,
            patientId TEXT NOT NULL,
            id_atendente_fk TEXT NOT NULL,
            data_hora_atendimento TEXT NOT NULL,
            tipo_atendimento TEXT,
            queixa_sessao TEXT NOT NULL,
            relato_paciente TEXT,
            observacoes_atendente TEXT,
            intervencoes_orientacoes TEXT,
            encaminhamentos TEXT,
            plano_proxima_sessao TEXT,
            data_criacao_prontuario TEXT NOT NULL,
            data_ultima_modificacao TEXT NOT NULL,
            FOREIGN KEY (patientId) REFERENCES pacientes (id) ON DELETE CASCADE,
            FOREIGN KEY (id_atendente_fk) REFERENCES atendentes (id) ON DELETE SET NULL
        )`;
    db.run(createProntuariosTableSql, (errTableProntuarios) => {
      if (errTableProntuarios) {
        // Erro ao criar a tabela 'prontuarios'.
      }
    });
  }
});

// Exporta a instância da conexão com o banco de dados para ser utilizada por outros módulos da aplicação.
module.exports = db;