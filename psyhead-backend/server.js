require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {
    Pool
} = require('pg');
//config servidor
const app = express();
const PORT = process.env.PORT || 3000;
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
//rota pra buscar o paciente no bd
app.post('/api/pacientes', async (req, res) => {
    console.log('recebida requisição para cadastrar paciente', req.body);
    const {
        nome_completo,
        data_nascimento,
        sexo,
        cpf,
        rg,
        nacionalidade,
        telefone,
        celular,
        email,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        historico_medico,
        motivacao_consulta
    } = req.body;

    if (!nome_completo || !data_nascimento || !celular || !motivacao_consulta) {
        return res.status(400).json({
            erro: 'campos obrigatórios faltando!'
        });
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
        res.status(500).json({
            error: 'Erro interno do servidor ao tentar cadastrar o paciente'
        });
    }
});

//rota pra buscar os pacientes salvos no BD
app.get('/api/pacientes', async (req, res) => {
    console.log('recebida requisição para buscar todos os pacientes!!');

    try {
        const queryText = `
        SELECT id, nome_completo, celular, data_nascimento 
        FROM pacientes ORDER BY nome_completo ASC;
        `;
        const result = await pool.query(queryText);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar pacientes no banco de dados:', error);
        res.status(500).json({
            error: 'Erro interno do servidor ao tentar buscar os pacientes'
        });
    }
});

//buscando paciente especifico
app.get('/api/pacientes/:id', async (req, res) => {
    const {
        id
    } = req.params;
    console.log(`recebida requisição para buscar o paciente com ID ${id}`);

    try {
        const queryText = 'SELECT * FROM pacientes WHERE id = $1';
        const result = await pool.query(queryText, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Paciente não encontrado '
            });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('erro ao buscar paciente por ID', error);
        res.status(500).json({
            error: 'erro interno do servidor, consulte o suporte'
        });
    }
});

//rota pra atualizar um paciente
app.put('/api/pacientes/:id', async (req, res) => {
    const {
        id
    } = req.params;
    console.log(`recebida requisição para atualizar o paciente com ID: {id}`);

    const {
        nome_completo,
        data_nascimento,
        sexo,
        cpf,
        rg,
        nacionalidade,
        telefone,
        celular,
        email,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        historico_medico,
        motivacao_consulta
    } = req.body;
    if (!nome_completo || !data_nascimento || !celular || !motivacao_consulta) {
        return res.status(400).json({
            error: 'campos obrigatórios faltando!!'
        });
    }
    try {
        const queryText = `
        UPDATE pacientes SET nome_completo = $1, data_nascimento = $2, sexo = $3, cpf = $4, rg = $5,
        nacionalidade = $6, telefone = $7, celular = $8, email = $9, cep = $10, logradouro = $11,
        numero = $12, complemento = $13, bairro = $14, cidade = $15, estado = $16, historico_medico = $17,
        motivacao_consulta = $18 WHERE id = $19 RETURNING *;
        `;
        const values = [
            nome_completo, data_nascimento, sexo, cpf, rg, nacionalidade, telefone, celular,
            email, cep, logradouro, numero, complemento, bairro, cidade, estado, historico_medico,
            motivacao_consulta, id
        ];
        const result = await pool.query(queryText, values);
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'paciente não encontrado para atualização '
            });
        }
        res.status(200).json({
            message: 'paciente atualizado com sucesso!!',
            paciente: result.rows[0]
        });
    } catch (error) {
        console.error('erro ao atualizar paciente:', error);
        res.status(500).json({
            error: 'erro interno do servidor, consulte o suporte'
        });
    }
});

app.delete('/api/pacientes/:id', async (req, res) => {
    const {
        id
    } = req.params;
    console.log(`Recebida requisição para EXCLUIR o paciente com ID: ${id}`);

    try {
        const queryText = 'DELETE FROM pacientes WHERE id = $1 RETURNING *;';
        const result = await pool.query(queryText, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Paciente não encontrado para exclusão'
            });
        }
        res.status(200).json({
            message: `Paciente "${result.rows[0].nome_completo}" foi excluído com sucesso.`
        });
    } catch (error) {
        console.error('Erro ao excluir paciente:', error);
        res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
});

//rota para marcar uma sessao
app.post('/api/sessoes', async (req, res) => {
    console.log('Recebida requisição para criar nova sessão:', req.body);

    const {
        paciente_id,
        data_sessao,
        duracao_minutos,
        tipo_sessao,
        resumo_sessao,
        valor_sessao,
        status_pagamento
    } = req.body;

    if (!paciente_id || !data_sessao) {
        return res.status(400).json({
            error: 'ID do paciente e data da sessão são obrigatórios.'
        });
    }

    try {
        const queryText = `
      INSERT INTO sessoes (
        paciente_id, data_sessao, duracao_minutos, tipo_sessao, 
        resumo_sessao, valor_sessao, status_pagamento
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
        const values = [
            paciente_id, data_sessao, duracao_minutos, tipo_sessao,
            resumo_sessao, valor_sessao, status_pagamento
        ];

        const result = await pool.query(queryText, values);
        res.status(201).json({
            message: 'Sessão registrada com sucesso!',
            sessao: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao registrar sessão:', error);
        res.status(500).json({
            error: 'Erro interno do servidor ao registrar a sessão.'
        });
    }
});

//rota pra buscar todas as sessões de um paciente especific
app.get('/api/pacientes/:pacienteId/sessoes', async (req, res) => {
    const {
        pacienteId
    } = req.params;
    console.log(`Buscando todas as sessões para o paciente ID: ${pacienteId}`);

    try {
        const queryText = 'SELECT * FROM sessoes WHERE paciente_id = $1 ORDER BY data_sessao DESC';
        const result = await pool.query(queryText, [pacienteId]);

        res.status(200).json(result.rows);

    } catch (error) {
        console.error('Erro ao buscar sessões do paciente:', error);
        res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
});

//rota pra alimentar o fullcalender biblioteca do js
app.get('/api/sessoes', async (req, res) => {
    console.log('Buscando todas as sessões para o calendário');
    try {
        const queryText = `
      SELECT 
        s.id,
        s.data_sessao AS start, -- FullCalendar usa a chave "start" para a data do evento
        p.nome_completo AS title -- FullCalendar usa a chave "title" para o texto do evento
      FROM sessoes s
      JOIN pacientes p ON s.paciente_id = p.id;
    `;

        const result = await pool.query(queryText);
        res.status(200).json(result.rows);

    } catch (error) {
        console.error('Erro ao buscar todas as sessões:', error);
        res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
});

//rota pro resumo financeiro do mes atual
app.get('/api/financeiro/resumo', async (req, res) => {
    console.log('Buscando resumo financeiro do mês atual');
    try {
        const queryText = `
      SELECT
        -- Soma o valor da sessão APENAS se o status for 'Pago'
        COALESCE(SUM(CASE WHEN status_pagamento = 'Pago' THEN valor_sessao ELSE 0 END), 0) AS faturamento_mes,
        
        -- Soma o valor da sessão APENAS se o status for 'Pendente'
        COALESCE(SUM(CASE WHEN status_pagamento = 'Pendente' THEN valor_sessao ELSE 0 END), 0) AS a_receber,
        
        -- Conta quantas sessões foram pagas
        COUNT(CASE WHEN status_pagamento = 'Pago' THEN 1 END) AS sessoes_pagas,
        
        -- Conta quantas sessões estão pendentes
        COUNT(CASE WHEN status_pagamento = 'Pendente' THEN 1 END) AS sessoes_pendentes

      FROM sessoes
      WHERE data_sessao >= DATE_TRUNC('month', CURRENT_DATE); -- Filtra apenas para o mês corrente
    `;
        const result = await pool.query(queryText);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar resumo financeiro:', error);
        res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
});

//rota para as transacoes recentes
app.get('/api/financeiro/transacoes', async (req, res) => {
    console.log('Buscando transações financeiras recentes');
    try {
        const queryText = `
      SELECT 
        s.id,
        s.data_sessao,
        s.valor_sessao,
        s.status_pagamento,
        p.nome_completo AS paciente_nome
      FROM sessoes s
      JOIN pacientes p ON s.paciente_id = p.id
      ORDER BY s.data_sessao DESC
      LIMIT 10; -- Pega as 10 últimas sessões
    `;
        const result = await pool.query(queryText);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar transações:', error);
        res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor do PsyHead rodando na porta ${PORT}`);
});