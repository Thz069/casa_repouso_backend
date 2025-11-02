const express = require('express');
const router = express.Router();
const db = require('../database.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Rota de Login
router.post('/login', async (req, res) => {
  const { nome_usuario, senha } = req.body;

  if (!nome_usuario || !senha) {
    return res.status(400).json({ error: 'Nome de usuário e senha são obrigatórios.' });
  }

  const sql = "SELECT * FROM atendentes WHERE nome_usuario = ?";

  try {
    const user = await new Promise((resolve, reject) => {
      db.get(sql, [nome_usuario], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const match = await bcrypt.compare(senha, user.hash_senha);

    if (match) {
      const payload = { userId: user.id, name: user.nome_completo_atendente };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

      res.json({
        success: true,
        message: 'Login bem-sucedido!',
        token: token,
        user: {
          id: user.id,
          name: user.nome_completo_atendente
        }
      });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Rota de Cadastro
router.post('/register', async (req, res) => {
  const { nome_completo_atendente, nome_usuario, senha } = req.body;

  if (!nome_completo_atendente || !nome_usuario || !senha) {
    return res.status(400).json({ error: 'Nome completo, nome de usuário e senha são obrigatórios.' });
  }

  try {
    const checkUserSql = "SELECT id FROM atendentes WHERE nome_usuario = ?";
    const existingUser = await new Promise((resolve, reject) => {
      db.get(checkUserSql, [nome_usuario], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Este nome de usuário já está em uso.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(senha, saltRounds);

    const newUser = {
      id: uuidv4(),
      nome_completo_atendente,
      nome_usuario,
      hash_senha: hashedPassword,
    };

    const insertSql = "INSERT INTO atendentes (id, nome_completo_atendente, nome_usuario, hash_senha) VALUES (?, ?, ?, ?)";
    await new Promise((resolve, reject) => {
      db.run(insertSql, [newUser.id, newUser.nome_completo_atendente, newUser.nome_usuario, newUser.hash_senha], function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });

    res.status(201).json({
      message: 'Atendente criado com sucesso!',
      userId: newUser.id
    });

  } catch (err) {
    res.status(500).json({ error: 'Erro interno do servidor ao tentar registrar o atendente.' });
  }
});

module.exports = router;
