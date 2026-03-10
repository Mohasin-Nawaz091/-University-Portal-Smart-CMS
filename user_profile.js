document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Role-based navigation
    const dashboardNavLink = document.getElementById('dashboard-nav-link');
    if (dashboardNavLink) {
        if (user.role === 'admin') dashboardNavLink.href = 'admin.html';
        else if (user.role === 'dept_admin') dashboardNavLink.href = 'department_admin.html';
        else dashboardNavLink.href = 'student_dashboard.html';
    }

    let roleText = 'Student';
    if (user.role === 'admin') roleText = 'System Administrator';
    else if (user.role === 'dept_admin') roleText = user.department + ' Admin';

    // Update Header
    const headerName = document.getElementById('headerName');
    const headerRole = document.getElementById('headerRole');
    const headerAvatar = document.getElementById('headerAvatar');
    if (headerName) headerName.textContent = user.name;
    if (headerRole) headerRole.textContent = roleText;
    if (headerAvatar && user.avatar) {
        headerAvatar.src = user.avatar.startsWith('http') ? user.avatar : `${user.avatar}`;
    }

    // Sidebar population
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const sidebarName = document.getElementById('sidebarName');
    const sidebarEmail = document.getElementById('sidebarEmail');
    if (sidebarAvatar && user.avatar) {
        sidebarAvatar.src = user.avatar.startsWith('http') ? user.avatar : `${user.avatar}`;
    }
    if (sidebarName) sidebarName.textContent = user.name;
    if (sidebarEmail) sidebarEmail.textContent = user.studentId || user.email;

    // Update Profile Banner
    const bannerName = document.getElementById('bannerName');
    const bannerRole = document.getElementById('bannerRole');
    const bannerEmail = document.getElementById('bannerEmail');
    const profileImage = document.getElementById('profileImage');

    if (bannerName) bannerName.textContent = user.name;
    if (bannerRole) bannerRole.textContent = roleText;
    if (bannerEmail) bannerEmail.textContent = user.email;
    if (profileImage && user.avatar) {
        profileImage.src = user.avatar.startsWith('http') ? user.avatar : `${user.avatar}`;
    }

    // Update Details Form
    const inputName = document.getElementById('inputName');
    const inputId = document.getElementById('inputId');
    const inputEmail = document.getElementById('inputEmail');
    const inputPhone = document.getElementById('inputPhone');
    const inputDepartment = document.getElementById('inputDepartment');

    if (inputName) inputName.value = user.name || '';
    if (inputId) inputId.value = user.studentId || user.student_id || user.id || '';
    if (inputEmail) inputEmail.value = user.email || '';
    if (inputPhone) inputPhone.value = user.phone || '';
    if (inputDepartment) {
        inputDepartment.value = user.department || '';
        // If student, and department exists, make it very clear
        if (user.role === 'student' && user.department) {
            const container = document.getElementById('deptDisplayContainer') || inputDepartment.parentElement;
            if (container) {
                container.innerHTML = `<div class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-3 text-sm font-bold text-primary">${user.department}</div>`;
            }
        }
    }

    // Avatar upload preview
    let selectedAvatar = null;
    const avatarInput = document.getElementById('avatarUpload');
    if (avatarInput && profileImage) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                selectedAvatar = file;
                const reader = new FileReader();
                reader.onload = (e) => profileImage.src = e.target.result;
                reader.readAsDataURL(file);
            }
        });
    }

    // Save changes
    const saveBtn = document.querySelector('button.bg-primary.text-white');
    if (saveBtn) {
        saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const formData = new FormData();
                formData.append('id', user.id);
                formData.append('name', inputName.value);
                formData.append('email', inputEmail.value);
                formData.append('phone', inputPhone.value);
                // Department and ID are readonly for students
                if (user.role !== 'student') {
                    formData.append('department', inputDepartment.value);
                }

                if (selectedAvatar) formData.append('avatar', selectedAvatar);

                const res = await fetch('/api/update-profile', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                    body: formData
                });

                const data = await res.json();
                if (data.success) {
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    alert('Profile updated successfully!');
                    window.location.reload();
                } else {
                    alert('Failed to update: ' + data.error);
                }
            } catch (err) {
                console.error(err);
                alert("Server error");
            }
        });
    }

    // Security Update (Password Change)
    const securityBtn = document.getElementById('btnUpdateSecurity');
    if (securityBtn) {
        securityBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const currentPwd = document.getElementById('currentPassword').value;
            const newPwd = document.getElementById('newPassword').value;
            const confirmPwd = document.getElementById('confirmPassword').value;

            if (!currentPwd || !newPwd || !confirmPwd) {
                alert("Please fill all password fields.");
                return;
            }

            if (newPwd !== confirmPwd) {
                alert("New passwords do not match.");
                return;
            }

            try {
                const res = await fetch('/api/change-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        userId: user.id,
                        currentPassword: currentPwd,
                        newPassword: newPwd
                    })
                });

                const data = await res.json();
                if (data.success) {
                    alert("Password updated successfully!");
                    document.getElementById('currentPassword').value = '';
                    document.getElementById('newPassword').value = '';
                    document.getElementById('confirmPassword').value = '';
                } else {
                    alert("Error: " + data.error);
                }
            } catch (err) {
                console.error(err);
                alert("Server error during password change.");
            }
        });
    }

    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    }
});
