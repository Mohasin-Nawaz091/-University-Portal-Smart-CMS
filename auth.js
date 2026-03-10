document.addEventListener('DOMContentLoaded', async () => {

    // Auto-redirect if already logged in and on login/register page
    const currentUser = getCurrentUser();
    if (currentUser) {
        if (window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html') || window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html')) {
            redirectBasedOnRole(currentUser.role);
        }
    }

    const loginForm = document.querySelector('form');
    if (loginForm && window.location.pathname.endsWith('login.html')) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (!email || !password) {
                alert("Please enter email and password");
                return;
            }

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();

                if (data.success) {
                    localStorage.setItem('token', data.token);
                    setCurrentUser(data.user);
                    redirectBasedOnRole(data.user.role);
                } else {
                    alert(data.error || "Login failed");
                }
            } catch (err) {
                alert("Server error");
                console.error(err);
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm && window.location.pathname.endsWith('register.html')) {

        const regDeptSelect = document.getElementById('department');
        if (regDeptSelect) {
            regDeptSelect.innerHTML = '<option value="" disabled selected>Select Department</option>';
            const depts = ['BSAI', 'BSSE', 'BSDS', 'BSCS', 'BBA', 'Business Analytics'];
            depts.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d;
                opt.textContent = d;
                regDeptSelect.appendChild(opt);
            });
        }

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const studentId = document.getElementById('studentId') ? document.getElementById('studentId').value : '';
            const department = document.getElementById('department') ? document.getElementById('department').value : '';
            const semester = document.getElementById('semester') ? document.getElementById('semester').value : '';

            if (!name || !email || !password || !studentId || !department || !semester) {
                alert("Please fill all fields");
                return;
            }

            try {
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name, email, password, studentId, department, semester, role: 'student'
                    })
                });

                const data = await res.json();
                if (data.success) {
                    alert("Registration successful, please login.");
                    window.location.href = 'login.html';
                } else {
                    alert(data.error || "Registration failed");
                }
            } catch (err) {
                alert("Server error");
                console.error(err);
            }
        });
    }

    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            logout();
        });
    });


    // Hide explicit Profile nav links to avoid mapping duplication
    document.querySelectorAll('aside nav a').forEach(link => {
        if (link.textContent.includes('Profile')) {
            link.style.display = 'none';
        }
    });

});

function redirectBasedOnRole(role) {
    if (role === 'student') {
        window.location.href = 'student_dashboard.html';
    } else if (role === 'admin') {
        window.location.href = 'admin.html';
    } else if (role === 'dept_admin' || role === 'department_admin') {
        window.location.href = 'department_admin.html';
    }
}
