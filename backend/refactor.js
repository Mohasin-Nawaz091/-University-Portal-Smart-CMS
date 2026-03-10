const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const filesToRefactor = [
    'auth.js',
    'complaints.js',
    'admin.js',
    'dept_admin.js',
    'notifications.js',
    'dashboard.js',
    'user_profile.js'
];

for (const file of filesToRefactor) {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8');

    // Make DOMContentLoaded async
    content = content.replace(/addEventListener\('DOMContentLoaded',\s*\(\)\s*=>\s*\{/g, "addEventListener('DOMContentLoaded', async () => {");

    // Add async to specific known functions
    content = content.replace(/function initSubmitComplaint\(/g, "async function initSubmitComplaint(");
    content = content.replace(/function initViewComplaint\(/g, "async function initViewComplaint(");
    content = content.replace(/function renderAdminDashboardStats\(/g, "async function renderAdminDashboardStats(");
    content = content.replace(/function renderAdminRecentComplaints\(/g, "async function renderAdminRecentComplaints(");
    content = content.replace(/function renderAdminAllComplaints\(/g, "async function renderAdminAllComplaints(");
    content = content.replace(/function initAdminAssignComplaint\(/g, "async function initAdminAssignComplaint(");
    content = content.replace(/function renderAdminReports\(/g, "async function renderAdminReports(");
    content = content.replace(/function loadDeptDashboardStats\(/g, "async function loadDeptDashboardStats(");
    content = content.replace(/function loadDeptComplaints\(/g, "async function loadDeptComplaints(");
    content = content.replace(/function initUpdateStatus\(/g, "async function initUpdateStatus(");

    // Callbacks to async
    content = content.replace(/addEventListener\('submit',\s*\((.*?)\)\s*=>\s*\{/g, "addEventListener('submit', async ($1) => {");
    content = content.replace(/addEventListener\('click',\s*\((.*?)\)\s*=>\s*\{/g, "addEventListener('click', async ($1) => {");
    content = content.replace(/onclick="\(\)\s*=>\s*\{/g, "onclick=\"async () => {");

    // Rewrite data fetching to use await
    content = content.replace(/getComplaints\(\)/g, "(await getComplaints())");
    content = content.replace(/getComplaintById\(/g, "(await getComplaintById(");
    content = content.replace(/getDepartments\(\)/g, "(await getDepartments())");
    content = content.replace(/updateComplaint\(/g, "(await updateComplaint(");
    content = content.replace(/saveComplaint\(/g, "(await saveComplaint(");
    content = content.replace(/getUsers\(\)/g, "(await getUsers())");
    content = content.replace(/getUserByEmail\(/g, "(await getUserByEmail(");
    content = content.replace(/saveUser\(/g, "(await saveUser(");
    content = content.replace(/addNotification\(/g, "(await addNotification(");
    content = content.replace(/getUserNotifications\(/g, "(await getUserNotifications(");
    content = content.replace(/markAllNotificationsAsRead\(/g, "(await markAllNotificationsAsRead(");
    content = content.replace(/markNotificationRead\(/g, "(await markNotificationRead(");

    // Clean up any potential syntax errors
    content = content.replace(/\(await \(await getComplaints\(\)\)\)/g, "(await getComplaints())");
    content = content.replace(/await\s+await/g, "await");

    fs.writeFileSync(filePath, content, 'utf8');
}

console.log("Files rewritten successfully");
