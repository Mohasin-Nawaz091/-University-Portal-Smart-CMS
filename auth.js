document.addEventListener('DOMContentLoaded', () => {

    // Auto-redirect if already logged in and on login/register page
    const currentUser = getCurrentUser();
    if (currentUser) {
        if (window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html') || window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html')) {
            redirectBasedOnRole(currentUser.role);
        }
    }

    const loginForm = document.querySelector('form');
    if (loginForm && window.location.pathname.endsWith('login.html')) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const role = document.querySelector('input[name="role"]:checked').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Simple validation
            if (!email || !password) {
                alert("Please enter email and password");
                return;
            }

            // Simple login logic (accepts any email/password, but tries to see if user exists)
            // If user doesn't exist, we just simulate a login anyway per instructions: "allow login with any email/password and just use the selected role"
            let user = getUserByEmail(email);
            if (!user) {
                // creating dummy user on the fly if not exists just to satisfy the role requirement
                user = {
                    id: Date.now(),
                    name: 'Guest ' + role,
                    email: email,
                    role: role,
                    department: role === 'dept_admin' ? 'IT Department' : null
                };
                saveUser(user);
            } else {
                // force the selected role for this session, per prompt requirement
                user.role = role;
                if (role === 'dept_admin' && !user.department) user.department = 'IT Department';
            }

            setCurrentUser(user);
            redirectBasedOnRole(role);
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm && window.location.pathname.endsWith('register.html')) {
        registerForm.addEventListener('submit', (e) => {
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

            if (getUserByEmail(email)) {
                alert("Email already registered!");
                return;
            }

            const newUser = {
                name: name,
                email: email,
                password: password, // In real world we hash this
                studentId: studentId,
                department: department,
                semester: semester,
                role: 'student'
            };

            const savedUser = saveUser(newUser);
            setCurrentUser(savedUser);
            window.location.href = 'student_dashboard.html';
        });
    }

    // Handle logout buttons
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    });

});

function redirectBasedOnRole(role) {
    if (role === 'student') {
        window.location.href = 'student_dashboard.html';
    } else if (role === 'admin') {
        window.location.href = 'admin.html';
    } else if (role === 'dept_admin') {
        window.location.href = 'department_admin.html';
    }
}
