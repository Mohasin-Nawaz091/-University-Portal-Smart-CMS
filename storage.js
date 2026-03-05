// Constants
let DEPARTMENTS = JSON.parse(localStorage.getItem('departments')) || [
    'IT Department',
    'Hostel Management',
    'Discipline Committee',
    'Academic Department',
    'Library'
];
if (!localStorage.getItem('departments')) {
    localStorage.setItem('departments', JSON.stringify(DEPARTMENTS));
}

function syncDefaultUsers() {
    let users = JSON.parse(localStorage.getItem('users')) || [];

    // Ensure admin exists
    if (!users.find(u => u.email === 'admin@university.edu')) {
        users.push({ id: users.length + 1, name: 'System Admin', email: 'admin@university.edu', password: 'password123', role: 'admin' });
    }

    // Ensure all departments have an admin account
    DEPARTMENTS.forEach(dept => {
        let emailPrefix = dept.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        let deptEmail = `${emailPrefix}_admin@university.edu`;
        if (!users.find(u => u.department === dept && u.role === 'dept_admin')) {
            users.push({
                id: users.length + 1,
                name: `${dept} Admin`,
                email: deptEmail,
                password: 'password123', // Default
                role: 'dept_admin',
                department: dept
            });
        }
    });

    localStorage.setItem('users', JSON.stringify(users));
}

syncDefaultUsers();

if (!localStorage.getItem('complaints')) {
    localStorage.setItem('complaints', JSON.stringify([]));
}

if (!localStorage.getItem('notifications')) {
    localStorage.setItem('notifications', JSON.stringify([]));
}

// Helper methods for Users
function getUsers() {
    return JSON.parse(localStorage.getItem('users'));
}

function saveUser(user) {
    const users = getUsers();
    user.id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
    return user;
}

function getUserByEmail(email) {
    return getUsers().find(u => u.email === email);
}

// Helpers for Current Auth
function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

function requireAuth(allowedRoles = []) {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        alert("Unauthorized access");
        logout();
        return null;
    }
    return user;
}

// Helper methods for Complaints
function getComplaints() {
    return JSON.parse(localStorage.getItem('complaints'));
}

function saveComplaint(complaint) {
    const complaints = getComplaints();
    complaint.id = complaints.length > 0 ? Math.max(...complaints.map(c => c.id)) + 1 : 1;
    complaint.createdDate = new Date().toISOString();
    complaints.push(complaint);
    localStorage.setItem('complaints', JSON.stringify(complaints));
    return complaint;
}

function updateComplaint(id, updates) {
    const complaints = getComplaints();
    const index = complaints.findIndex(c => c.id == id);
    if (index !== -1) {
        complaints[index] = { ...complaints[index], ...updates };
        localStorage.setItem('complaints', JSON.stringify(complaints));
        return complaints[index];
    }
    return null;
}

function getComplaintById(id) {
    return getComplaints().find(c => c.id == id);
}

function deleteComplaint(id) {
    const complaints = getComplaints();
    const index = complaints.findIndex(c => c.id == id);
    if (index !== -1) {
        complaints.splice(index, 1);
        localStorage.setItem('complaints', JSON.stringify(complaints));
        return true;
    }
    return false;
}

// Helper methods for Notifications
function getNotifications() {
    return JSON.parse(localStorage.getItem('notifications'));
}

function addNotification(userId, message, link = '#') {
    const notifications = getNotifications();
    const notification = {
        id: notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1,
        userId: userId,
        message: message,
        link: link,
        read: false,
        createdDate: new Date().toISOString()
    };
    notifications.push(notification);
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

function markNotificationRead(id) {
    const notifications = getNotifications();
    const index = notifications.findIndex(n => n.id == id);
    if (index !== -1) {
        notifications[index].read = true;
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }
}

function getUserNotifications(userId) {
    return getNotifications().filter(n => n.userId == userId).sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
}

function markAllNotificationsAsRead(userId) {
    let allNotifications = getNotifications();
    allNotifications = allNotifications.map(n => {
        if (n.userId === userId) {
            n.read = true;
        }
        return n;
    });
    localStorage.setItem('notifications', JSON.stringify(allNotifications));
}

function addDepartment(newDeptName) {
    if (!DEPARTMENTS.includes(newDeptName)) {
        DEPARTMENTS.push(newDeptName);
        localStorage.setItem('departments', JSON.stringify(DEPARTMENTS));
        syncDefaultUsers(); // Creates account for the new dept automatically
        return true;
    }
    return false;
}

function getDepartments() {
    return JSON.parse(localStorage.getItem('departments')) || [];
}
