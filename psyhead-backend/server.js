require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {
    Pool
} = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

//middleware
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET || 'seu_segredo_super_secreto', (err, terapeuta) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.terapeuta = terapeuta;
        next();
    });
};

//rota pra adicionar um novo terapeuta
app.post('/api/auth/registrar', async (req, res) => {
    const {
        nome,
        email,
        senha
    } = req.body;
    if (!nome || !email || !senha) {
        return res.status(400).json({
            error: 'Nome, email e senha são obrigatórios.'
        });
    }

    try {
        const senhaHash = await bcrypt.hash(senha, 10);
        const queryText = 'INSERT INTO terapeutas (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, email;';
        const result = await pool.query(queryText, [nome, email, senhaHash]);

        res.status(201).json({
            message: 'Terapeuta registrado com sucesso!',
            terapeuta: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao registrar terapeuta:', error);
        res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
});

//rota de login
app.post('/api/auth/login', async (req, res) => {
    const {
        email,
        senha
    } = req.body;
    if (!email || !senha) {
        return res.status(400).json({
            error: 'Email e senha são obrigatórios.'
        });
    }

    try {
        const queryText = 'SELECT * FROM terapeutas WHERE email = $1;';
        const result = await pool.query(queryText, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Credenciais inválidas.'
            });
        }

        const terapeuta = result.rows[0];

        const senhaValida = await bcrypt.compare(senha, terapeuta.senha_hash);
        if (!senhaValida) {
            return res.status(401).json({
                error: 'Credenciais inválidas.'
            });
        }
        const token = jwt.sign({
                id: terapeuta.id,
                email: terapeuta.email
            },
            process.env.JWT_SECRET || 'seu_segredo_super_secreto', {
                expiresIn: '8h'
            }
        );

        res.status(200).json({
            message: 'Login bem-sucedido!',
            token: token,
            terapeuta: {
                nome: terapeuta.nome
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
});

//rota pra buscar o paciente no bd
app.post('/api/pacientes', verificarToken, async (req, res) => {
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
//rota pra estatisticas do dashboard index
app.get('/api/dashboard/stats', verificarToken, async (req, res) => {
    console.log('Buscando estatísticas para o dashboard principal');
    try {
        const queryText = `
      SELECT
        (SELECT COUNT(*) FROM pacientes) AS pacientes_ativos,
        
        (SELECT COUNT(*) FROM sessoes WHERE data_sessao::date = CURRENT_DATE) AS sessoes_hoje,
        
        (SELECT COALESCE(SUM(valor_sessao), 0) FROM sessoes WHERE status_pagamento = 'Pago' AND data_sessao >= DATE_TRUNC('month', CURRENT_DATE)) AS faturamento_mes;
    `;

        const result = await pool.query(queryText);
        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao buscar estatísticas do dashboard:', error);
        res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
});

//rota pra buscar os pacientes salvos no BD
app.get('/api/pacientes', verificarToken, async (req, res) => {
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
app.get('/api/pacientes/:id', verificarToken, async (req, res) => {
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
app.put('/api/pacientes/:id', verificarToken, async (req, res) => {
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

app.delete('/api/pacientes/:id', verificarToken, async (req, res) => {
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
app.post('/api/sessoes', verificarToken, async (req, res) => {
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

//rota pra buscar os detalhes de uma unica sessao
app.get('/api/sessoes/:id', verificarToken, async (req, res) => {
    const {
        id
    } = req.params;
    console.log(`Buscando detalhes da sessão com ID: ${id}`);

    try {
        const queryText = `
      SELECT 
        s.*,
        p.nome_completo AS paciente_nome
      FROM sessoes s
      JOIN pacientes p ON s.paciente_id = p.id
      WHERE s.id = $1;
    `;
        const result = await pool.query(queryText, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Sessão não encontrada.'
            });
        }
        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao buscar detalhes da sessão:', error);
        res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
});

//rota pra atualizar uma sessão
app.put('/api/sessoes/:id', verificarToken, async (req, res) => {
    const {
        id
    } = req.params;
    const {
        data_sessao,
        duracao_minutos,
        tipo_sessao,
        resumo_sessao,
        valor_sessao,
        status_pagamento
    } = req.body;

    if (!data_sessao) {
        return res.status(400).json({
            error: 'A data da sessão é obrigatória.'
        });
    }

    try {
        const queryText = `
      UPDATE sessoes SET
        data_sessao = $1, duracao_minutos = $2, tipo_sessao = $3, 
        resumo_sessao = $4, valor_sessao = $5, status_pagamento = $6
      WHERE id = $7
      RETURNING *;
    `;
        const values = [
            data_sessao, duracao_minutos, tipo_sessao, resumo_sessao,
            valor_sessao, status_pagamento, id
        ];
        const result = await pool.query(queryText, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Sessão não encontrada para atualização.'
            });
        }
        res.status(200).json({
            message: 'Sessão atualizada com sucesso!',
            sessao: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao atualizar sessão:', error);
        res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
});

//rota pra excluir uma sessão
app.delete('/api/sessoes/:id', verificarToken, async (req, res) => {
    const {
        id
    } = req.params;
    try {
        const queryText = 'DELETE FROM sessoes WHERE id = $1 RETURNING id;';
        const result = await pool.query(queryText, [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Sessão não encontrada para exclusão.'
            });
        }
        res.status(200).json({
            message: 'Sessão excluída com sucesso.'
        });
    } catch (error) {
        console.error('Erro ao excluir sessão:', error);
        res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
});

//rota pra buscar todas as sessões de um paciente especific
app.get('/api/pacientes/:pacienteId/sessoes', verificarToken, async (req, res) => {
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
app.get('/api/sessoes', verificarToken, async (req, res) => {
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

//rota pra add uma medicação pra um paciente
app.post('/api/pacientes/:pacienteId/medicacoes', verificarToken, async (req, res) => {
    const {
        pacienteId
    } = req.params;
    const {
        nome_medicamento,
        dosagem,
        frequencia,
        data_inicio,
        data_termino,
        medico_prescritor,
        observacoes
    } = req.body;

    if (!nome_medicamento || !data_inicio) {
        return res.status(400).json({
            error: 'Nome do medicamento e data de início são obrigatórios.'
        });
    }

    try {
        const queryText = `
      INSERT INTO medicacoes (
        paciente_id, nome_medicamento, dosagem, frequencia, data_inicio,
        data_termino, medico_prescritor, observacoes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
        const values = [
            pacienteId, nome_medicamento, dosagem, frequencia, data_inicio,
            data_termino || null, medico_prescritor, observacoes
        ];

        const result = await pool.query(queryText, values);
        res.status(201).json({
            message: 'Medicação registrada com sucesso!',
            medicacao: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao registrar medicação:', error);
        res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
});

//rota pra listar todas as medicações de um paciente
app.get('/api/pacientes/:pacienteId/medicacoes', verificarToken, async (req, res) => {
    const {
        pacienteId
    } = req.params;
    try {
        const queryText = 'SELECT * FROM medicacoes WHERE paciente_id = $1 ORDER BY data_inicio DESC;';
        const result = await pool.query(queryText, [pacienteId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar medicações do paciente:', error);
        res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
});

//rota pra atualizar uma medicacao
app.put('/api/medicacoes/:id', verificarToken, async (req, res) => {
    const {
        id
    } = req.params;
    const {
        nome_medicamento,
        dosagem,
        frequencia,
        data_inicio,
        data_termino,
        medico_prescritor,
        observacoes
    } = req.body;

    try {
        const queryText = `
      UPDATE medicacoes SET
        nome_medicamento = $1, dosagem = $2, frequencia = $3, data_inicio = $4,
        data_termino = $5, medico_prescritor = $6, observacoes = $7
      WHERE id = $8 RETURNING *;
    `;
        const values = [
            nome_medicamento, dosagem, frequencia, data_inicio,
            data_termino || null, medico_prescritor, observacoes, id
        ];
        const result = await pool.query(queryText, values);
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Medicação não encontrada.'
            });
        }
        res.status(200).json({
            message: 'Medicação atualizada com sucesso!',
            medicacao: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao atualizar medicação:', error);
        res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
});

//rota pra excluir uma medicacao
app.delete('/api/medicacoes/:id', verificarToken, async (req, res) => {
    const {
        id
    } = req.params;
    try {
        const queryText = 'DELETE FROM medicacoes WHERE id = $1 RETURNING id;';
        const result = await pool.query(queryText, [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Medicação não encontrada.'
            });
        }
        res.status(200).json({
            message: 'Medicação excluída com sucesso.'
        });
    } catch (error) {
        console.error('Erro ao excluir medicação:', error);
        res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
});

//rota pro resumo financeiro do mes atual
app.get('/api/financeiro/resumo', verificarToken, async (req, res) => {
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
app.get('/api/financeiro/transacoes', verificarToken, async (req, res) => {
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
//relatorios rota geração
app.post('/api/relatorios/financeiro', verificarToken, async (req, res) => {
    const { data_inicio, data_fim } = req.body;
    console.log(`Gerando relatório financeiro de ${data_inicio} a ${data_fim}`);

    if (!data_inicio || !data_fim) {
        return res.status(400).json({ error: 'Data de início e data de fim são obrigatórias.' });
    }

    try {
        const queryResumo = `
            SELECT
                COALESCE(SUM(CASE WHEN status_pagamento = 'Pago' THEN valor_sessao ELSE 0 END), 0) AS faturamento_total,
                COUNT(*) AS total_sessoes
            FROM sessoes
            WHERE data_sessao::date BETWEEN $1 AND $2;
        `;
        
        const queryTransacoes = `
            SELECT s.data_sessao, s.valor_sessao, s.status_pagamento, p.nome_completo AS paciente_nome
            FROM sessoes s
            JOIN pacientes p ON s.paciente_id = p.id
            WHERE s.data_sessao::date BETWEEN $1 AND $2
            ORDER BY s.data_sessao DESC;
        `;

        const resumoResult = await pool.query(queryResumo, [data_inicio, data_fim]);
        const transacoesResult = await pool.query(queryTransacoes, [data_inicio, data_fim]);

        res.status(200).json({
            resumo: resumoResult.rows[0],
            transacoes: transacoesResult.rows
        });

    } catch (error) {
        console.error('Erro ao gerar relatório financeiro:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

//rotas das avaliacoes
app.post('/api/sessoes/:sessaoId/avaliacao', verificarToken, async (req, res) => {
    const {
        sessaoId
    } = req.params;
    const {
        nota_geral,
        comentarios_positivos,
        pontos_a_melhorar
    } = req.body;

    if (!nota_geral) return res.status(400).json({
        error: 'A nota geral é obrigatória.'
    });

    try {
        const queryText = `
            INSERT INTO avaliacoes (sessao_id, nota_geral, comentarios_positivos, pontos_a_melhorar, status)
            VALUES ($1, $2, $3, $4, 'Respondida')
            RETURNING *;
        `;
        const values = [sessaoId, nota_geral, comentarios_positivos, pontos_a_melhorar];
        const result = await pool.query(queryText, values);
        res.status(201).json({
            message: 'Avaliação registrada com sucesso!',
            avaliacao: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao registrar avaliação:', error);
        res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
});
//continuacao rota avaliacao
app.get('/api/sessoes/:sessaoId/avaliacao', verificarToken, async (req, res) => {
    const {
        sessaoId
    } = req.params;
    try {
        const queryText = 'SELECT * FROM avaliacoes WHERE sessao_id = $1;';
        const result = await pool.query(queryText, [sessaoId]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Nenhuma avaliação encontrada para esta sessão.'
            });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar avaliação:', error);
        res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
});

//rotas das avaliacoes pendentes
app.get('/api/avaliacoes/pendentes', verificarToken, async (req, res) => {
    try {
        const queryText = `
            SELECT s.id, s.data_sessao, p.nome_completo AS paciente_nome
            FROM sessoes s
            JOIN pacientes p ON s.paciente_id = p.id
            LEFT JOIN avaliacoes a ON s.id = a.sessao_id
            WHERE s.data_sessao < NOW() AND a.id IS NULL
            ORDER BY s.data_sessao DESC;
        `;
        const result = await pool.query(queryText);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar avaliações pendentes:', error);
        res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
});

//rota para lisya as avaliacoes recebidas
app.get('/api/avaliacoes/recebidas', verificarToken, async (req, res) => {
    try {
        const queryText = `
            SELECT a.id, a.nota_geral, a.comentarios_positivos, s.data_sessao, p.nome_completo AS paciente_nome
            FROM avaliacoes a
            JOIN sessoes s ON a.sessao_id = s.id
            JOIN pacientes p ON s.paciente_id = p.id
            ORDER BY s.data_sessao DESC;
        `;
        const result = await pool.query(queryText);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar avaliações recebidas:', error);
        res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor do PsyHead rodando na porta ${PORT}`);
});