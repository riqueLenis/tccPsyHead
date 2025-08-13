document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const userTypeInput = document.getElementById('userType');

    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');
    const credentialsError = document.getElementById('credentialsError');

    const showError = (element, message) => {
        element.textContent = message;
        element.classList.remove('hidden');
        if (element.id.includes('username')) usernameInput.classList.add('border-danger-red');
        if (element.id.includes('password')) passwordInput.classList.add('border-danger-red');
    };

    const hideError = (element) => {
        element.classList.add('hidden');
        if (element.id.includes('username')) usernameInput.classList.remove('border-danger-red');
        if (element.id.includes('password')) passwordInput.classList.remove('border-danger-red');
    };

    usernameInput.addEventListener('input', () => hideError(usernameError));
    passwordInput.addEventListener('input', () => hideError(passwordError));

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        hideError(usernameError);
        hideError(passwordError);
        hideError(credentialsError);
        
        let isValid = true;
        if (usernameInput.value.trim() === '') {
            showError(usernameError, 'Por favor, insira seu e-mail.');
            isValid = false;
        }
        if (passwordInput.value.trim() === '') {
            showError(passwordError, 'Por favor, insira sua senha.');
            isValid = false;
        }

        if (!isValid) return;

        const email = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const userType = userTypeInput.value;

        console.log(`Tentativa de login como ${userType} com:`, { email });

        let isAuthenticated = false;
        if (userType === 'terapeuta' && email === 'terapeuta@psyhead.com' && password === '123') {
            isAuthenticated = true;
        } else if (userType === 'responsavel' && email === 'paciente@psyhead.com' && password === '123') {
            isAuthenticated = true;
        }

        if (isAuthenticated) {
            console.log('Login bem-sucedido!');
            localStorage.setItem('userType', userType);
            window.location.href = 'index.html';
        } else {
            showError(credentialsError, 'Credenciais inválidas. Verifique seu e-mail, senha e tipo de usuário.');
            console.error('Falha no login: Credenciais inválidas.');
        }
    });
});