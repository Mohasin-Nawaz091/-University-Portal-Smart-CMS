document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth(['student']);
    if (!user) return;

    renderSidebar(user);

    if (window.location.pathname.endsWith('student_dashboard.html') || window.location.pathname.endsWith('student-dashboard.html')) {
        renderDashboardStats(user);
        renderRecentComplaints(user);
    } else if (window.location.pathname.endsWith('my_complaints.html')) {
        renderRecentComplaints(user);
    }
});

function renderSidebar(user) {
    const sidebarName = document.getElementById('sidebarName');
    const sidebarId = document.getElementById('sidebarId');
    const sidebarAvatar = document.getElementById('sidebarAvatar');

    if (sidebarName) sidebarName.textContent = user.name;
    if (sidebarId) sidebarId.textContent = user.email; // Using email as ID display
    if (sidebarAvatar && user.avatar) {
        sidebarAvatar.src = user.avatar.startsWith('http') ? user.avatar : `${user.avatar}`;
    }

    // Also support old design if any
    const userNameElements = document.querySelectorAll('.user-name');
    const userEmailElements = document.querySelectorAll('.user-email');
    userNameElements.forEach(el => el.textContent = user.name);
    userEmailElements.forEach(el => el.textContent = user.email);
}

async function renderDashboardStats(user) {
    const allComplaints = (await getComplaints()).filter(c => c.userId === user.id);
    const pendingCount = allComplaints.filter(c => c.status === 'Pending').length;
    const inProgressCount = allComplaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
    const resolvedCount = allComplaints.filter(c => c.status === 'Resolved').length;

    const statContainers = document.querySelectorAll('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4 h3');
    if (statContainers.length >= 4) {
        statContainers[0].textContent = allComplaints.length;
        statContainers[1].textContent = pendingCount;
        statContainers[2].textContent = inProgressCount;
        statContainers[3].textContent = resolvedCount;
    }
}

async function renderRecentComplaints(user) {
    const allComplaints = (await getComplaints()).filter(c => c.userId === user.id).sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    const tbody = document.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (allComplaints.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-slate-500">No complaints found.</td></tr>';
        return;
    }

    allComplaints.forEach(complaint => {
        let statusClass = 'bg-slate-100 text-slate-700';
        if (complaint.status === 'Resolved') statusClass = 'bg-emerald-100 text-emerald-700';
        else if (complaint.status === 'In Progress' || complaint.status === 'Assigned') statusClass = 'bg-amber-100 text-amber-700';

        const priorityColor = complaint.priority === 'high' ? 'bg-red-500' : (complaint.priority === 'medium' ? 'bg-blue-500' : 'bg-slate-300');

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer';
        tr.onclick = () => window.location.href = `view_complaints.html?id=${complaint.id}`;

        tr.innerHTML = `
            <td class="px-6 py-4 font-mono text-xs text-slate-500">#CMP-${complaint.id}</td>
            <td class="px-6 py-4 font-semibold">${complaint.title}</td>
            <td class="px-6 py-4 capitalize">${complaint.category}</td>
            <td class="px-6 py-4 text-slate-500">${new Date(complaint.createdDate).toLocaleDateString()}</td>
            <td class="px-6 py-4">
                <span class="px-2.5 py-1 rounded-full text-xs font-bold ${statusClass}">${complaint.status}</span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-1.5 capitalize">
                    <span class="w-2 h-2 rounded-full ${priorityColor}"></span>
                    ${complaint.priority}
                </div>
            </td>
            <td class="px-6 py-4 text-right">
                <button onclick="event.stopPropagation(); window.location.href='view_complaints.html?id=${complaint.id}';" class="px-3 py-1 bg-primary/10 text-primary font-bold rounded hover:bg-primary/20 text-xs">View</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    const showingText = document.querySelector('.text-xs.text-slate-500.font-medium');
    if (showingText && showingText.textContent.includes('Showing')) {
        showingText.textContent = `Showing ${allComplaints.length} of ${allComplaints.length} results`;
    }
}
