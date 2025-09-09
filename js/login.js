// js/login.js (VERSÃO FINAL COM AUTENTICAÇÃO REAL)
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const credentialsError = document.getElementById('credentialsError');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        credentialsError.classList.add('hidden'); // Esconde erros antigos

        const email = usernameInput.value.trim();
        const senha = passwordInput.value.trim();

        if (!email || !senha) {
            credentialsError.textContent = 'Por favor, preencha o e-mail и a senha.';
            credentialsError.classList.remove('hidden');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao tentar fazer login.');
            }

            // SUCESSO! Salva o token e o nome do usuário no navegador
            localStorage.setItem('psyhead-token', data.token);
            localStorage.setItem('terapeuta-nome', data.terapeuta.nome);

            // Redireciona para o dashboard
            window.location.href = 'index.html';

        } catch (error) {
            console.error('Falha no login:', error);
            credentialsError.textContent = error.message;
            credentialsError.classList.remove('hidden');
        }
    });
});