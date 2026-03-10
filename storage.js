// Auth/Local User Management
function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

function requireAuth(allowedRoles = []) {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }

    // Role mapping: treat 'dept_admin' and 'department_admin' as the same
    const normalizedUserRole = user.role === 'dept_admin' ? 'department_admin' : user.role;
    const normalizedAllowedRoles = allowedRoles.map(r => r === 'dept_admin' ? 'department_admin' : r);

    if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(normalizedUserRole)) {
        alert("Unauthorized content access denied.");
        logout();
        return null;
    }
    return user;
}

const reqOpts = () => ({
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }
});

function normalizeComplaint(c) {
    if (!c) return null;
    // ensure names match what frontend expects
    return {
        ...c,
        createdDate: c.created_at,
        studentName: c.student_name || 'Student',
        userId: c.student_id,
        image: c.image_path ? c.image_path : null,
        department: c.department_name || c.department || 'General'
    };
}

// Departments
async function getDepartments() {
    return fetch('http://localhost:3000/api/department/list', reqOpts()).then(r => r.json()).then(lst => lst.map(d => d.name));
}

async function addDepartment(newDeptName) {
    return fetch('http://localhost:3000/api/department/add', {
        method: 'POST',
        ...reqOpts(),
        body: JSON.stringify({ name: newDeptName })
    }).then(r => r.json()).then(r => r.success);
}

// Users
async function getUsers() {
    return [getCurrentUser()];
}
async function getUserByEmail(email) {
    return getCurrentUser();
}
async function saveUser(user) {
    return user;
}

// Complaints
async function getComplaints() {
    const user = getCurrentUser();
    let compls = [];
    if (user && user.role === 'student') {
        compls = await fetch(`http://localhost:3000/api/complaints/student/${user.id}`, reqOpts()).then(r => r.json());
    } else if (user && (user.role === 'dept_admin' || user.role === 'department_admin')) {
        compls = await fetch(`http://localhost:3000/api/department/assigned/${encodeURIComponent(user.department)}`, reqOpts()).then(r => r.json());
    } else {
        compls = await fetch('http://localhost:3000/api/admin/complaints', reqOpts()).then(r => r.json());
    }
    return compls.map(normalizeComplaint);
}

async function saveComplaint(complaint) {
    try {
        const formData = new FormData();
        formData.append('student_id', complaint.userId);
        formData.append('title', complaint.title);
        formData.append('category', complaint.category);
        formData.append('priority', complaint.priority);
        formData.append('description', complaint.description);

        if (complaint.image) {
            const arr = complaint.image.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) u8arr[n] = bstr.charCodeAt(n);
            const blob = new Blob([u8arr], { type: mime });
            formData.append('image', blob, 'upload.png');
        }

        const res = await fetch('http://localhost:3000/api/complaints', {
            method: 'POST',
            body: formData,
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        return { ...complaint, id: data.complaintId };
    } catch (err) {
        console.error(err);
        return null;
    }
}

async function updateComplaint(id, updates) {
    const user = getCurrentUser();

    // Department Admin Role: Use specific status update endpoint
    if (user && (user.role === 'department_admin' || user.role === 'dept_admin')) {
        const lastTL = (updates.timeline && updates.timeline.length > 0) ? updates.timeline[updates.timeline.length - 1] : null;
        await fetch('http://localhost:3000/api/department/update', {
            method: 'POST',
            ...reqOpts(),
            body: JSON.stringify({
                complaint_id: id,
                status: updates.status,
                priority: updates.priority,
                comment: lastTL ? lastTL.message : 'No comments provided',
                updated_by: user.id
            })
        });
        return updates;
    }

    // Central Admin Role: Assignment Logic
    if (user && (user.role === 'admin' || user.role === 'super_admin') && updates.department) {
        try {
            const adminNote = (updates.adminNotes && Array.isArray(updates.adminNotes) && updates.adminNotes.length > 0)
                ? updates.adminNotes[updates.adminNotes.length - 1]
                : (updates.adminNote || '');

            await fetch('http://localhost:3000/api/admin/assign', {
                method: 'POST',
                ...reqOpts(),
                body: JSON.stringify({
                    complaint_id: id,
                    department_name: updates.department,
                    status: updates.status || 'Assigned',
                    priority: updates.priority || 'medium',
                    admin_id: user.id,
                    admin_note: adminNote
                })
            });
            return updates;
        } catch (err) {
            console.error("Assignment Fetch Error:", err);
            throw err;
        }
    }

    // Generic Update for other cases (e.g., student editing titles/descriptions if allowed)
    await fetch(`http://localhost:3000/api/complaints/${id}`, {
        method: 'PUT',
        ...reqOpts(),
        body: JSON.stringify(updates)
    });
    return updates;
}

async function addComment(complaintId, comment) {
    const user = getCurrentUser();
    const res = await fetch(`http://localhost:3000/api/complaints/${complaintId}/comment`, {
        method: 'POST',
        ...reqOpts(),
        body: JSON.stringify({
            comment: comment,
            updated_by: user.id
        })
    });
    return res.json();
}

async function getComplaintById(id) {
    return normalizeComplaint(await fetch(`http://localhost:3000/api/complaints/${id}`, reqOpts()).then(r => r.json()));
}

async function deleteComplaint(id) {
    return fetch(`http://localhost:3000/api/complaints/${id}`, {
        method: 'DELETE',
        ...reqOpts()
    }).then(r => r.json());
}

// Notifications
async function getNotifications() {
    return fetch(`http://localhost:3000/api/notifications/${getCurrentUser().id}`, reqOpts()).then(r => r.json());
}

async function addNotification(userId, message, link) { }

async function markNotificationRead(id) {
    return fetch(`http://localhost:3000/api/notifications/${id}/read`, { method: 'POST', ...reqOpts() }).then(r => r.json());
}

async function getUserNotifications(userId) {
    return fetch(`http://localhost:3000/api/notifications/${userId}`, reqOpts()).then(r => r.json()).then(arr => arr.map(n => ({ ...n, createdDate: n.created_at })));
}

async function markAllNotificationsAsRead(userId) {
    return fetch(`http://localhost:3000/api/notifications/${userId}/mark-read`, { method: 'POST', ...reqOpts() }).then(r => r.json());
}
