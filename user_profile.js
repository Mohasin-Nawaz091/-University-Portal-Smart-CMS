document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Populate Sidebar & Header links based on role
    const dashboardLink = document.querySelectorAll('nav a')[0];
    const logoutBtn = document.querySelector('.logout-btn') || document.querySelector('aside button.text-red-500');

    let dashboardUrl = 'student_dashboard.html';
    let roleText = 'Student';

    if (user.role === 'admin') {
        dashboardUrl = 'admin.html';
        roleText = 'System Administrator';
    } else if (user.role === 'dept_admin') {
        dashboardUrl = 'department_admin.html';
        roleText = 'Department Admin';
    }

    if (dashboardLink) dashboardLink.href = dashboardUrl;

    // Update Header
    const headerName = document.querySelector('header .text-sm.font-semibold');
    const headerRole = document.querySelector('header .text-xs.text-slate-500');
    if (headerName) headerName.textContent = user.name;
    if (headerRole) headerRole.textContent = roleText;

    // Update Profile Banner
    const bannerName = document.querySelector('h3.text-2xl.font-bold');
    const bannerRole = document.querySelector('.inline-flex.items-center.text-primary').lastChild;
    const bannerEmail = document.querySelector('span.text-slate-500.dark\\:text-slate-400').lastChild;

    if (bannerName) bannerName.textContent = user.name;
    if (bannerRole) bannerRole.textContent = roleText;
    if (bannerEmail) bannerEmail.textContent = user.email;

    // Update Details Form
    const nameInput = document.querySelector('input[type="text"][value="Alex Johnson"]');
    const emailInput = document.querySelector('input[type="email"]');

    if (nameInput) nameInput.value = user.name;
    if (emailInput) emailInput.value = user.email;

    // Save changes
    const saveBtn = document.querySelector('button.bg-primary.text-white');
    if (saveBtn && nameInput && emailInput) {
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const users = getUsers();
            const idx = users.findIndex(u => u.id === user.id);
            if (idx > -1) {
                users[idx].name = nameInput.value;
                users[idx].email = emailInput.value;
                localStorage.setItem('users', JSON.stringify(users));
                localStorage.setItem('currentUser', JSON.stringify(users[idx]));
                alert('Profile updated successfully!');
                window.location.reload();
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }

});
