// Initialize storage if empty
if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([
        { id: 1, name: 'Admin User', email: 'admin@university.edu', password: 'password', role: 'admin' },
        { id: 2, name: 'IT Dept Admin', email: 'it@university.edu', password: 'password', role: 'dept_admin', department: 'IT Department' },
        { id: 3, name: 'John Doe', email: 'student@university.edu', password: 'password', role: 'student' }
    ]));
}

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

// Constants
const DEPARTMENTS = [
    'IT Department',
    'Hostel Department',
    'Discipline Committee',
    'Academic Department',
    'Library'
];
