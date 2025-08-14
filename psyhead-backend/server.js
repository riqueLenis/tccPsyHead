require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
//config servidor
const app = express();
const PORT = process.env.PORT || 3000; //servidor rodando na porta 3000
//config pra rodar toda requisição
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.post('/api/pacientes', async (req, res) => {
    console.log('recebida requisição para cadastrar paciente', req.body);
    const {
        nome_completo, data_nascimento, sexo, cpf, rg, nacionalidade,
        telefone, celular, email, cep, logradouro, numero, complemento,
        bairro, cidade, estado, historico_medico, motivacao_consulta
    } = req.body;

    if(!nome_completo || !data_nascimento || !celular || !motivacao_consulta){
        return res.status(400).json({ erro: 'campos obrigatórios faltando!' });
    }
    try {
        const queryText = `
        INSERT INTO pacientes (
        nome_completo, data_nascimento, sexo, cpf, rg, nacionalidade,
        telefone, celular, email, cep, logradouro, numero, complemento,
        bairro, cidade, estado, historico_medico, motivacao_consulta
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         RETURNING *;
        `;
        const values = [
            nome_completo, data_nascimento, sexo, cpf, rg, nacionalidade,
            telefone, celular, email, cep, logradouro, numero, complemento,
            bairro, cidade, estado, historico_medico, motivacao_consulta
        ];
        const result = await pool.query(queryText, values);

        res.status(201).json({
            message: 'paciente cadastrado com sucesso!',
            paciente: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao inserir paciente no banco de dados', error);
        res.status(500).json({ error: 'Erro interno do servidor ao tentar cadastrar o paciente' });
    }
});

app.listen(PORT, () => {
    console.log(`servidor do PsyHead rodando na porta ${PORT}`);
});