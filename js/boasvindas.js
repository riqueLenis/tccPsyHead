document.addEventListener('DOMContentLoaded', () => {
    const goToDashboardBtn = document.getElementById('goToDashboardBtn');

    if (goToDashboardBtn) {
        goToDashboardBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
});