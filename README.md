# Casa Espiritual - Sistema de Gerenciamento de Pacientes

Este é o backend do sistema de gerenciamento de pacientes para uma casa espiritual, permitindo o cadastro e acompanhamento de pacientes e seus prontuários.

## Funcionalidades

O sistema oferece uma API RESTful completa para gerenciar os dados da aplicação. As principais funcionalidades incluem:

- **Gerenciamento de Pacientes:**
  - `GET /api/patients`: Listar todos os pacientes.
  - `GET /api/patients/:id`: Obter detalhes de um paciente específico.
  - `POST /api/patients`: Adicionar um novo paciente.
  - `PUT /api/patients/:id`: Atualizar as informações de um paciente.
  - `DELETE /api/patients/:id`: Excluir um paciente.

- **Gerenciamento de Prontuários:**
  - `GET /api/patients/:patientId/records`: Listar todos os prontuários de um paciente.
  - `POST /api/patients/:patientId/records`: Adicionar um novo prontuário para um paciente.

- **Consultas Gerais:**
  - `GET /api/geral/todos-prontuarios`: Obter uma lista de todos os prontuários de todos os pacientes.

- **Autenticação de Usuários:**
  - `POST /api/auth/login`: Autenticar um usuário e obter um token JWT.
  - `POST /api/auth/register`: Registrar um novo usuário.

## Estrutura do Projeto

- `server.js`: Arquivo principal que inicializa o servidor Express, configura os middlewares e define as rotas.
- `database.js`: Responsável pela conexão com o banco de dados SQLite e pela criação das tabelas.
- `routes/`: Diretório que contém os arquivos de rota da aplicação.
  - `patients.js`: Define as rotas para o CRUD de pacientes.
  - `records.js`: Define as rotas para o CRUD de prontuários.
  - `generalData.js`: Define as rotas para consultas gerais.
  - `auth.js`: Define as rotas para autenticação de usuários.
- `db.sqlite`: Arquivo do banco de dados SQLite.

## Banco de Dados

O sistema utiliza o SQLite como banco de dados. A estrutura do banco de dados é definida no arquivo `database.js` e consiste nas seguintes tabelas:

- **atendentes:** Armazena as informações dos usuários do sistema.
  - `id` (TEXT, PK): Identificador único do atendente.
  - `nome_usuario` (TEXT, UNIQUE): Nome de usuário para login.
  - `hash_senha` (TEXT): Hash da senha do usuário.
  - `nome_completo_atendente` (TEXT): Nome completo do atendente.

- **pacientes:** Armazena as informações dos pacientes.
  - `id` (TEXT, PK): Identificador único do paciente.
  - `nomeCompleto` (TEXT): Nome completo do paciente.
  - ... (demais campos do paciente)

- **prontuarios:** Armazena os registros dos atendimentos.
  - `recordId` (TEXT, PK): Identificador único do prontuário.
  - `patientId` (TEXT, FK): Chave estrangeira que referencia o `id` da tabela `pacientes`.
  - `id_atendente_fk` (TEXT, FK): Chave estrangeira que referencia o `id` da tabela `atendentes`.
  - ... (demais campos do prontuário)

## API Endpoints

A seguir, uma descrição detalhada dos principais endpoints da API.

### Autenticação

#### `POST /api/auth/register`

Registra um novo atendente no sistema.

- **Corpo da Requisição:**
  ```json
  {
    "nome_completo_atendente": "Nome do Atendente",
    "nome_usuario": "usuario",
    "senha": "senha"
  }
  ```

- **Resposta de Sucesso (201):**
  ```json
  {
    "message": "Atendente criado com sucesso!",
    "userId": "uuid-do-novo-atendente"
  }
  ```

#### `POST /api/auth/login`

Autentica um atendente e retorna um token JWT.

- **Corpo da Requisição:**
  ```json
  {
    "nome_usuario": "usuario",
    "senha": "senha"
  }
  ```

- **Resposta de Sucesso (200):**
  ```json
  {
    "success": true,
    "message": "Login bem-sucedido!",
    "token": "seu-token-jwt",
    "user": {
      "id": "uuid-do-atendente",
      "name": "Nome do Atendente"
    }
  }
  ```

### Pacientes

#### `GET /api/patients`

Lista todos os pacientes cadastrados.

- **Resposta de Sucesso (200):**
  ```json
  [
    {
      "id": "uuid-do-paciente",
      "nomeCompleto": "Nome do Paciente",
      ...
    }
  ]
  ```

#### `GET /api/patients/:id`

Busca um paciente específico pelo ID.

- **Resposta de Sucesso (200):**
  ```json
  {
    "id": "uuid-do-paciente",
    "nomeCompleto": "Nome do Paciente",
    ...
  }
  ```

#### `POST /api/patients`

Cria um novo paciente.

- **Corpo da Requisição:**
  ```json
  {
    "nomeCompleto": "Novo Paciente",
    "telefonePrincipal": "123456789",
    ...
  }
  ```

- **Resposta de Sucesso (201):**
  ```json
  {
    "id": "uuid-do-novo-paciente",
    "nomeCompleto": "Novo Paciente",
    ...
  }
  ```

#### `PUT /api/patients/:id`

Atualiza os dados de um paciente.

- **Corpo da Requisição:**
  ```json
  {
    "nomeCompleto": "Nome Atualizado do Paciente",
    ...
  }
  ```

- **Resposta de Sucesso (200):**
  ```json
  {
    "id": "uuid-do-paciente",
    "nomeCompleto": "Nome Atualizado do Paciente",
    ...
  }
  ```

#### `DELETE /api/patients/:id`

Exclui um paciente.

- **Resposta de Sucesso (200):**
  ```json
  {
    "message": "success",
    "detail": "Paciente com ID uuid-do-paciente excluído com sucesso."
  }
  ```

### Prontuários

#### `GET /api/patients/:patientId/records`

Lista todos os prontuários de um paciente específico.

- **Resposta de Sucesso (200):**
  ```json
  [
    {
      "recordId": "uuid-do-prontuario",
      "patientId": "uuid-do-paciente",
      ...
    }
  ]
  ```

#### `POST /api/patients/:patientId/records`

Adiciona um novo prontuário para um paciente.

- **Corpo da Requisição:**
  ```json
  {
    "data_hora_atendimento": "2024-01-01T10:00:00.000Z",
    "queixa_sessao": "Queixa do paciente",
    "id_atendente_fk": "uuid-do-atendente",
    ...
  }
  ```

- **Resposta de Sucesso (201):**
  ```json
  {
    "recordId": "uuid-do-novo-prontuario",
    ...
  }
  ```

### Consultas Gerais

#### `GET /api/geral/todos-prontuarios`

Lista todos os prontuários de todos os pacientes.

- **Resposta de Sucesso (200):**
  ```json
  [
    {
      "recordId": "uuid-do-prontuario",
      "patientId": "uuid-do-paciente",
      "patientName": "Nome do Paciente",
      "attendantName": "Nome do Atendente",
      ...
    }
  ]
  ```

## Instalação e Execução

### Pré-requisitos
- Node.js (v14 ou superior)
- npm

### Passos para a Instalação

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/casa-espiritual-backend.git
   ```

2. **Navegue até o diretório do projeto:**
   ```bash
   cd casa-espiritual-backend
   ```

3. **Instale as dependências:**
   ```bash
   npm install
   ```

### Executando a Aplicação

Para iniciar o servidor, execute o seguinte comando:

```bash
npm start
```

O servidor estará rodando em `http://localhost:3001`.
