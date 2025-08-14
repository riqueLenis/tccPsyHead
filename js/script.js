document.addEventListener('DOMContentLoaded', () => {
    const sidebarLinks = document.querySelectorAll('.sidebar nav a');
    const contentSections = document.querySelectorAll('.content-section');
    const pacienteForm = document.getElementById('pacienteForm');
    const featureCards = document.querySelectorAll('.feature-card');
    const pacientesViewList = document.getElementById('pacientes-view-list');
    const pacientesViewForm = document.getElementById('pacientes-view-form');
    const showFormBtn = document.getElementById('show-add-paciente-form-btn');
    const backToListBtn = document.getElementById('back-to-list-btn');
    const hideAllSections = () => {
        contentSections.forEach(section => section.classList.add('hidden'));
    };

    const removeActiveClass = () => {
        sidebarLinks.forEach(link => link.classList.remove('active-nav-link'));
    };

    const activateSection = (sectionId, navLinkId) => {
        hideAllSections();
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        removeActiveClass();
        const targetNavLink = document.getElementById(navLinkId);
        if (targetNavLink) {
            targetNavLink.classList.add('active-nav-link');
        }
    };

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.id.replace('-link', '-section');
            activateSection(targetId, link.id);
        });
    });

    featureCards.forEach(card => {
        card.addEventListener('click', (event) => {
            event.preventDefault();
            const targetLinkId = card.dataset.target;
            if (targetLinkId) {
                document.getElementById(targetLinkId)?.click();
            }
        });
    });

    const goBackToList = () => {
        pacientesViewForm.classList.add('hidden');
        pacientesViewList.classList.remove('hidden');
    };

    if (showFormBtn) {
        showFormBtn.addEventListener('click', () => {
            pacientesViewList.classList.add('hidden');
            pacientesViewForm.classList.remove('hidden');
        });
    }
    if (backToListBtn) {
        backToListBtn.addEventListener('click', goBackToList);
    }
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
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            try {
                const response = await fetch('http://localhost:3000/api/pacientes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(pacienteData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Ocorreu um erro no servidor.');
                }
                const result = await response.json();
                alert(result.message);
                pacienteForm.reset();
                goBackToList();
            } catch (error) {
                console.error('Falha ao cadastrar paciente:', error);
                alert(`Erro ao cadastrar: ${error.message}`);
            }
        });
    }
    activateSection('dashboard-section', 'dashboard-link');
});