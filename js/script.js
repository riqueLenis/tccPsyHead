document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded. Script is running.');
    const sidebarLinks = document.querySelectorAll('.sidebar nav ul li a');
    const contentSections = document.querySelectorAll('.content-section');

     console.log('Sidebar Links found:', sidebarLinks.length);
     console.log('Content Sections found:', contentSections.length);

    const topNavDashboardLink = document.getElementById('dashboard-top-link');
    const topNavNotificationsLink = document.getElementById('notifications-top-link');
    const pacienteForm = document.getElementById('pacienteForm'); 
    const hideAllSections = () => {
        contentSections.forEach(section => {
            section.classList.add('hidden');
        });
         console.log('All sections hidden.');
    };

    const removeActiveClass = () => {
        sidebarLinks.forEach(link => {
            link.classList.remove('active-nav-link');
        });
        if (topNavDashboardLink) topNavDashboardLink.classList.remove('active-nav-link');
        if (topNavNotificationsLink) topNavNotificationsLink.classList.remove('active-nav-link');
         console.log('All active classes removed.');
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
            console.log(`Nav link "${navLinkId}" set to active.`);
        } else{
            console.error(`ERROR: Target nav link with ID "${navLinkId}" not found!`);
        }
    };

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); 
            console.log(`Sidebar link "${link.id}" clicked.`);
            const targetId = link.id.replace('-link', '-section');
            activateSection(targetId, link.id);
        });
    });

    if (topNavDashboardLink) {
        topNavDashboardLink.addEventListener('click', (event) => {
            event.preventDefault();
            activateSection('dashboard-section', 'dashboard-link');
        });
    }

    if (topNavNotificationsLink) {
        topNavNotificationsLink.addEventListener('click', (event) => {
            event.preventDefault();
            console.log("Notificações clicadas! (Lógica para exibir será implementada)");
        });
    }

    if (pacienteForm) {
        pacienteForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const formData = new FormData(pacienteForm);
            const pacienteData = {};

            for (let [key, value] of formData.entries()) {
                pacienteData[key] = value;
            }

            let isValid = true;
            const requiredFields = ['nome', 'dataNascimento', 'sexo', 'celular', 'motivacaoConsulta'];
            requiredFields.forEach(field => {
                const inputElement = pacienteForm.elements[field];
                if (inputElement && !inputElement.value.trim()) { 
                    inputElement.classList.add('border-danger-red');
                    isValid = false;
                } else if (inputElement) {
                    inputElement.classList.remove('border-danger-red');
                }
            });

            if (!isValid) {
                alert('Por favor, preencha todos os campos obrigatórios marcados.');
                return;
            }

            console.log('Dados do Paciente para envio (simulado):', pacienteData);

            alert('Paciente cadastrado com sucesso (simulado)!');
            pacienteForm.reset();
        });
    }

    const initialSectionId = window.location.hash ? window.location.hash.substring(1) + '-section' : 'dashboard-section';
    const initialNavLinkId = window.location.hash ? window.location.hash.substring(1) + '-link' : 'dashboard-link';

    activateSection(initialSectionId, initialNavLinkId);
});