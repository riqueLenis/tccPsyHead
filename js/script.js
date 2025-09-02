document.addEventListener('DOMContentLoaded', () => {
    const sidebarLinks = document.querySelectorAll('.sidebar nav a');
    const contentSections = document.querySelectorAll('.content-section');
    const pacienteForm = document.getElementById('pacienteForm');
    const pacienteIdInput = document.getElementById('pacienteId');
    const featureCards = document.querySelectorAll('.feature-card');
    const pacientesViewList = document.getElementById('pacientes-view-list');
    const pacientesViewForm = document.getElementById('pacientes-view-form');
    const pacientesViewDetail = document.getElementById('pacientes-view-detail');
    const showFormBtn = document.getElementById('show-add-paciente-form-btn');
    const backToListBtn = document.getElementById('back-to-list-btn');
    const detailBackToListBtn = document.getElementById('detail-back-to-list-btn');
    const detailHeader = document.querySelector('#pacientes-view-detail .page-header');
    //seletores do modulo de sessoes
    const patientSelector = document.getElementById('patient-selector');
    const sessionListContainer = document.getElementById('session-list-container');
    const sessionFormContainer = document.getElementById('session-form-container');
    const showAddSessionFormBtn = document.getElementById('show-add-session-form-btn');
    const cancelSessionFormBtn = document.getElementById('cancel-session-form-btn');
    const sessionForm = document.getElementById('sessionForm');
    const sessionFormPatientName = document.getElementById('session-form-patient-name');

    //sessão das sessões dos pacientes
    const popularDropdownPacientes = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/pacientes');
            if (!response.ok) throw new Error('Falha ao buscar pacientes.');
            const pacientes = await response.json();

            patientSelector.innerHTML = '<option value="">Selecione um paciente</option>';
            pacientes.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = p.nome_completo;
                patientSelector.appendChild(option);
            });
        } catch (error) {
            console.error(error);
            patientSelector.innerHTML = '<option value="">Erro ao carregar pacientes</option>';
        }
    };

    const carregarSessoes = async (pacienteId) => {
        sessionListContainer.innerHTML = '<p class="info-message">Carregando sessões...</p>';
        try {
            const response = await fetch(`http://localhost:3000/api/pacientes/${pacienteId}/sessoes`);
            if (!response.ok) throw new Error('Falha ao buscar sessões.');
            const sessoes = await response.json();

            sessionListContainer.innerHTML = '';
            if (sessoes.length === 0) {
                sessionListContainer.innerHTML = '<p class="info-message">Nenhuma sessão registrada para este paciente.</p>';
                return;
            }

            sessoes.forEach(s => {
                const dataFormatada = new Date(s.data_sessao).toLocaleString('pt-BR', {
                    dateStyle: 'long',
                    timeStyle: 'short'
                });
                const statusClass = s.status_pagamento === 'Pago' ? 'status-pago' : 'status-pendente';
                const cardHTML = `
                    <div class="session-card">
                        <div class="session-card-info">
                            <strong>Data da Sessão</strong>
                            <p>${dataFormatada}</p>
                        </div>
                        <div class="session-card-info">
                            <strong>Duração</strong>
                            <p>${s.duracao_minutos} min</p>
                        </div>
                        <div class="session-card-info">
                            <strong>Pagamento</strong>
                            <p><span class="status-badge ${statusClass}">${s.status_pagamento}</span></p>
                        </div>
                        <div class="session-card-actions">
                            <a href="#" class="btn btn-secondary btn-sm">Ver Detalhes</a>
                        </div>
                    </div>
                `;
                sessionListContainer.innerHTML += cardHTML;
            });
        } catch (error) {
            console.error(error);
            sessionListContainer.innerHTML = '<p class="error-message">Erro ao carregar sessões.</p>';
        }
    };

    //callender js
    let calendar;
    const inicializarCalendario = () => {
        const calendarEl = document.getElementById('calendar');
        if (calendar) {
            calendar.refetchEvents();
            return;
        }
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'pt-br',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            buttonText: {
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia',
            },
            events: 'http://localhost:3000/api/sessoes',

            eventClick: function (info) {
                alert('Evento: ' + info.event.title);
            }
        });

        calendar.render();
    };

    const calcularIdade = (dataNascimento) => {
        if (!dataNascimento) return 'N/A';
        const hoje = new Date();
        const nascimento = new Date(dataNascimento);
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        return idade;
    };

    const hideAllSections = () => {
        contentSections.forEach(section => section.classList.add('hidden'));
    };

    const removeActiveClass = () => {
        sidebarLinks.forEach(link => link.classList.remove('active-nav-link'));
    };

    const activateSection = (sectionId, navLinkId) => {
        hideAllSections();
        const targetSection = document.getElementById(sectionId);
        if (targetSection) targetSection.classList.remove('hidden');
        removeActiveClass();
        const targetNavLink = document.getElementById(navLinkId);
        if (targetNavLink) targetNavLink.classList.add('active-nav-link');
        if (sectionId === 'pacientes-section') {
            goBackToList();
        }
        if (sectionId === 'sessoes-section') {
            popularDropdownPacientes();
            sessionListContainer.innerHTML = '<p class="info-message">Por favor, selecione um paciente para ver suas sessões.</p>';
            sessionFormContainer.classList.add('hidden');
            showAddSessionFormBtn.disabled = true;
        }
        if (sectionId === 'agenda-section') {
            inicializarCalendario();
        }
        if (sectionId === 'financeiro-section') {
            carregarResumoFinanceiro();
            carregarTransacoesRecentes();
        }
    };

    const goBackToList = () => {
        if (pacientesViewForm) pacientesViewForm.classList.add('hidden');
        if (pacientesViewDetail) pacientesViewDetail.classList.add('hidden');
        if (pacientesViewList) pacientesViewList.classList.remove('hidden');
        carregarPacientes();
    };

    //funcoes do paciete
    const mostrarDetalhesPaciente = async (pacienteId) => {
        try {
            const response = await fetch(`http://localhost:3000/api/pacientes/${pacienteId}`);
            if (!response.ok) throw new Error('Paciente não encontrado');
            const paciente = await response.json();

            document.getElementById('detail-patient-name').textContent = paciente.nome_completo;
            const detailCard = document.querySelector('.patient-detail-card');
            detailCard.innerHTML = `
                <div class="detail-section">
                    <h4 class="detail-section-title">Dados Pessoais</h4>
                    <div class="detail-grid">
                        <div class="detail-item"><strong>Data de Nasc.</strong><span>${new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')}</span></div>
                        <div class="detail-item"><strong>Idade</strong><span>${calcularIdade(paciente.data_nascimento)} anos</span></div>
                        <div class="detail-item"><strong>Sexo</strong><span>${paciente.sexo}</span></div>
                        <div class="detail-item"><strong>CPF</strong><span>${paciente.cpf || 'Não informado'}</span></div>
                        <div class="detail-item"><strong>RG</strong><span>${paciente.rg || 'Não informado'}</span></div>
                        <div class="detail-item"><strong>Nacionalidade</strong><span>${paciente.nacionalidade}</span></div>
                    </div>
                </div>
                <div class="detail-section">
                    <h4 class="detail-section-title">Contato</h4>
                    <div class="detail-grid">
                        <div class="detail-item"><strong>Celular</strong><span>${paciente.celular}</span></div>
                        <div class="detail-item"><strong>Telefone</strong><span>${paciente.telefone || 'Não informado'}</span></div>
                        <div class="detail-item"><strong>E-mail</strong><span>${paciente.email || 'Não informado'}</span></div>
                    </div>
                </div>
                <div class="detail-section">
                    <h4 class="detail-section-title">Dados Clínicos</h4>
                    <div class="detail-grid">
                        <div class="detail-item full-width"><strong>Motivo da Consulta</strong><span>${paciente.motivacao_consulta}</span></div>
                        <div class="detail-item full-width"><strong>Histórico Médico Relevante</strong><span>${paciente.historico_medico || 'Nenhum'}</span></div>
                    </div>
                </div>
            `;

            pacientesViewList.classList.add('hidden');
            pacientesViewForm.classList.add('hidden');
            pacientesViewDetail.classList.remove('hidden');
            pacientesViewDetail.dataset.pacienteId = pacienteId;

        } catch (error) {
            console.error('Erro ao buscar detalhes do paciente:', error);
            alert(error.message);
        }
    };

    const excluirPaciente = async (pacienteId) => {
        const nomePaciente = document.getElementById('detail-patient-name').textContent;
        if (!confirm(`Você tem certeza que deseja excluir permanentemente o paciente "${nomePaciente}"? Esta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/pacientes/${pacienteId}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ocorreu um erro no servidor.');
            }
            const result = await response.json();
            alert(result.message);
            goBackToList();

        } catch (error) {
            console.error('Falha ao excluir paciente:', error);
            alert(`Erro ao excluir: ${error.message}`);
        }
    }

    const carregarPacientes = async () => {
        const patientGrid = document.querySelector('.patient-grid');
        patientGrid.innerHTML = '<p>Carregando pacientes...</p>';
        try {
            const response = await fetch('http://localhost:3000/api/pacientes');
            if (!response.ok) throw new Error('Falha na rede ao buscar pacientes');
            const pacientes = await response.json();

            patientGrid.innerHTML = '';
            if (pacientes.length === 0) {
                patientGrid.innerHTML = '<p>Nenhum paciente cadastrado ainda. Clique em "Adicionar Novo Paciente" para começar</p>';
                return;
            }

            pacientes.forEach(paciente => {
                const idade = calcularIdade(paciente.data_nascimento);
                const cardHTML = `
                    <div class="patient-card">
                        <div class="patient-card-header">
                            <div class="patient-avatar"><img src="../assets/euLink.png${paciente.id}"></div>
                            <div class="patient-info">
                                <h4 class="patient-name">${paciente.nome_completo}</h4>
                                <span class="patient-status status-active">Ativo</span>
                            </div>
                        </div>
                        <div class="patient-card-body">
                            <p><i class="fas fa-cake-candles icon-info"></i> ${idade} anos</p>
                            <p><i class="fas fa-mobile-alt icon-info"></i> ${paciente.celular || 'Não informado'}</p>
                            <p><i class="fas fa-calendar-day icon-info"></i> Nenhuma sessão agendada</p>
                        </div>
                        <div class="patient-card-actions">
                            <a href="#" class="btn btn-secondary btn-sm btn-view-prontuario" data-id="${paciente.id}">Ver Prontuário</a>
                            <a href="#" class="btn btn-primary btn-sm" data-id="${paciente.id}">Agendar</a>
                        </div>
                    </div>
                `;
                patientGrid.innerHTML += cardHTML;
            });

        } catch (error) {
            console.error('Erro ao carregar pacientes:', error);
            patientGrid.innerHTML = '<p class="error-message">Não foi possível carregar a lista de pacientes, verifique o servidor e tente novamente</p>';
        }
    };

    //forms criar e editar
    const abrirFormularioEdicao = async (pacienteId) => {
        try {
            const response = await fetch(`http://localhost:3000/api/pacientes/${pacienteId}`);
            if (!response.ok) throw new Error('Não foi possível carregar os dados do paciente');
            const paciente = await response.json();

            //preenchimento do forms
            pacienteForm.elements['nome'].value = paciente.nome_completo;
            pacienteForm.elements['dataNascimento'].value = new Date(paciente.data_nascimento).toISOString().split('T')[0];
            pacienteForm.elements['sexo'].value = paciente.sexo;
            pacienteForm.elements['cpf'].value = paciente.cpf;
            pacienteForm.elements['rg'].value = paciente.rg;
            pacienteForm.elements['nacionalidade'].value = paciente.nacionalidade;
            pacienteForm.elements['telefone'].value = paciente.telefone;
            pacienteForm.elements['celular'].value = paciente.celular;
            pacienteForm.elements['email'].value = paciente.email;
            pacienteForm.elements['cep'].value = paciente.cep;
            pacienteForm.elements['logradouro'].value = paciente.logradouro;
            pacienteForm.elements['numero'].value = paciente.numero;
            pacienteForm.elements['complemento'].value = paciente.complemento;
            pacienteForm.elements['bairro'].value = paciente.bairro;
            pacienteForm.elements['cidade'].value = paciente.cidade;
            pacienteForm.elements['estado'].value = paciente.estado;
            pacienteForm.elements['motivacaoConsulta'].value = paciente.motivacao_consulta;
            pacienteForm.elements['historicoMedico'].value = paciente.historico_medico;
            pacienteIdInput.value = paciente.id;
            document.querySelector('#pacientes-view-form .section-title').textContent = 'Editar Paciente';
            pacienteForm.querySelector('button[type="submit"]').textContent = 'Salvar Alterações';
            pacientesViewDetail.classList.add('hidden');
            pacientesViewForm.classList.remove('hidden');

        } catch (error) {
            console.error('Erro ao preparar formulário de edição:', error);
            alert(error.message);
        }
    };
    if (pacienteForm) {
        pacienteForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(pacienteForm);
            const pacienteData = {
                nome_completo: formData.get('nome'),
                data_nascimento: formData.get('dataNascimento'),
                sexo: formData.get('sexo'),
                cpf: formData.get('cpf'),
                rg: formData.get('rg'),
                nacionalidade: formData.get('nacionalidade'),
                telefone: formData.get('telefone'),
                celular: formData.get('celular'),
                email: formData.get('email'),
                cep: formData.get('cep'),
                logradouro: formData.get('logradouro'),
                numero: formData.get('numero'),
                complemento: formData.get('complemento'),
                bairro: formData.get('bairro'),
                cidade: formData.get('cidade'),
                estado: formData.get('estado'),
                historico_medico: formData.get('historicoMedico'),
                motivacao_consulta: formData.get('motivacaoConsulta'),
            };

            if (!pacienteData.nome_completo || !pacienteData.data_nascimento || !pacienteData.celular || !pacienteData.motivacao_consulta) {
                alert('Por favor preencha todos os campos obrigatórios');
                return;
            }

            const id = pacienteIdInput.value;
            const method = id ? 'PUT' : 'POST';
            const url = id ? `http://localhost:3000/api/pacientes/${id}` : 'http://localhost:3000/api/pacientes';

            try {
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(pacienteData),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Ocorreu um erro no servidor');
                }
                const result = await response.json();
                alert(result.message);

                pacienteForm.reset();
                pacienteIdInput.value = '';
                if (id) {
                    mostrarDetalhesPaciente(id);
                } else {
                    goBackToList();
                }
            } catch (error) {
                console.error('Falha ao salvar paciente:', error);
                alert(`Erro ao salvar: ${error.message}`);
            }
        });
    }
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.id.replace('-link', '-section');
            activateSection(targetId, link.id);
        });
    });

    //funcao pra carregar o resumo financeiroq
    const carregarResumoFinanceiro = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/financeiro/resumo');
            if (!response.ok) throw new Error('Falha ao buscar resumo financeiro.');
            const resumo = await response.json();
            const formatarMoeda = (valor) => {
                return parseFloat(valor).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                });
            };

            document.getElementById('faturamento-mes').textContent = formatarMoeda(resumo.faturamento_mes);
            document.getElementById('a-receber').textContent = formatarMoeda(resumo.a_receber);
            document.getElementById('sessoes-pagas').textContent = resumo.sessoes_pagas;
            document.getElementById('sessoes-pendentes').textContent = resumo.sessoes_pendentes;

        } catch (error) {
            console.error(error);
        }
    };
    //carregar transacoes recentes
    const carregarTransacoesRecentes = async () => {
        const tbody = document.getElementById('transactions-table-body');
        tbody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';
        try {
            const response = await fetch('http://localhost:3000/api/financeiro/transacoes');
            if (!response.ok) throw new Error('Falha ao buscar transações.');
            const transacoes = await response.json();

            tbody.innerHTML = '';
            if (transacoes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4">Nenhuma transação encontrada.</td></tr>';
                return;
            }

            transacoes.forEach(t => {
                const dataFormatada = new Date(t.data_sessao).toLocaleDateString('pt-BR');
                const statusClass = t.status_pagamento === 'Pago' ? 'status-pago' : 'status-pendente';
                const linhaHTML = `
                <tr>
                    <td>${t.paciente_nome}</td>
                    <td>${dataFormatada}</td>
                    <td>${parseFloat(t.valor_sessao).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td><span class="status-badge ${statusClass}">${t.status_pagamento}</span></td>
                </tr>
            `;
                tbody.innerHTML += linhaHTML;
            });
        } catch (error) {
            console.error(error);
            tbody.innerHTML = '<tr><td colspan="4" class="error-message">Erro ao carregar transações.</td></tr>';
        }
    };

    //modulos
    if (patientSelector) {
        patientSelector.addEventListener('change', () => {
            const pacienteId = patientSelector.value;
            if (pacienteId) {
                carregarSessoes(pacienteId);
                showAddSessionFormBtn.disabled = false;
            } else {
                sessionListContainer.innerHTML = '<p class="info-message">Por favor, selecione um paciente para ver suas sessões.</p>';
                showAddSessionFormBtn.disabled = true;
            }
        });
    }
    if (showAddSessionFormBtn) {
        showAddSessionFormBtn.addEventListener('click', () => {
            const selectedOption = patientSelector.options[patientSelector.selectedIndex];
            sessionFormPatientName.textContent = selectedOption.text;
            sessionFormContainer.classList.remove('hidden');
            sessionForm.reset();
        });
    }
    if (cancelSessionFormBtn) {
        cancelSessionFormBtn.addEventListener('click', () => {
            sessionFormContainer.classList.add('hidden');
        });
    }
    if (sessionForm) {
        sessionForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const pacienteId = patientSelector.value;
            if (!pacienteId) {
                alert('Por favor, selecione um paciente primeiro.');
                return;
            }

            const formData = new FormData(sessionForm);
            const sessionData = {
                paciente_id: pacienteId,
                data_sessao: formData.get('data_sessao'),
                duracao_minutos: formData.get('duracao_minutos'),
                tipo_sessao: formData.get('tipo_sessao'),
                resumo_sessao: formData.get('resumo_sessao'),
                valor_sessao: formData.get('valor_sessao'),
                status_pagamento: formData.get('status_pagamento'),
            };
            try {
                const response = await fetch('http://localhost:3000/api/sessoes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(sessionData)
                });
                if (!response.ok) throw new Error('Falha ao salvar sessão.');

                const result = await response.json();
                alert(result.message);
                sessionFormContainer.classList.add('hidden');
                carregarSessoes(pacienteId);
            } catch (error) {
                alert(error.message);
                console.error(error);
            }
        });
    }
    featureCards.forEach(card => {
        card.addEventListener('click', (event) => {
            event.preventDefault();
            const targetLinkId = card.dataset.target;
            if (targetLinkId) document.getElementById(targetLinkId) ?.click();
        });
    });
    if (showFormBtn) {
        showFormBtn.addEventListener('click', () => {
            console.log('Botão "Adicionar Paciente" CLICADO!');
            pacienteForm.reset();
            pacienteIdInput.value = '';
            document.querySelector('#pacientes-view-form .section-title').textContent = 'Adicionar Novo Paciente';
            pacienteForm.querySelector('button[type="submit"]').textContent = 'Salvar Paciente';
            pacientesViewList.classList.add('hidden');
            pacientesViewForm.classList.remove('hidden');
        });
    }
    if (backToListBtn) backToListBtn.addEventListener('click', goBackToList);
    if (detailBackToListBtn) detailBackToListBtn.addEventListener('click', goBackToList);
    if (pacientesViewList) {
        pacientesViewList.addEventListener('click', (event) => {
            const prontuarioBtn = event.target.closest('.btn-view-prontuario');
            if (prontuarioBtn) {
                event.preventDefault();
                const pacienteId = prontuarioBtn.dataset.id;
                mostrarDetalhesPaciente(pacienteId);
            }
        });
    }
    if (detailHeader) {
        detailHeader.addEventListener('click', (event) => {
            const pacienteId = pacientesViewDetail.dataset.pacienteId;
            const editBtn = event.target.closest('#edit-patient-btn');
            const deleteBtn = event.target.closest('#delete-patient-btn');

            if (editBtn) abrirFormularioEdicao(pacienteId);
            if (deleteBtn) excluirPaciente(pacienteId);
        });
    }

    activateSection('dashboard-section', 'dashboard-link');
});