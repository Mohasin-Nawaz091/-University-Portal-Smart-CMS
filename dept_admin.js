document.addEventListener('DOMContentLoaded', () => {

    // Auth for department admin
    const user = requireAuth(['dept_admin']);
    if (!user) return;

    // Sidebar admin details
    const deptAdminNameEl = document.querySelector('header .text-sm.font-semibold.text-slate-900');
    if (deptAdminNameEl) deptAdminNameEl.textContent = user.name;
    const deptAdminRoleEl = document.querySelector('header .text-xs.text-slate-500');
    if (deptAdminRoleEl) deptAdminRoleEl.textContent = "Dept. Admin, " + user.department;

    if (window.location.pathname.endsWith('department_admin.html')) {
        renderDeptDashboardStats(user);
        renderDeptRecentComplaints(user);
    } else if (window.location.pathname.endsWith('depart_admin_update_complain_status.html')) {
        initDeptUpdateComplaint(user);
    }
});

function renderDeptDashboardStats(user) {
    const allComplaints = getComplaints().filter(c => c.department === user.department && c.status !== 'Pending');

    const assignedCount = allComplaints.length;
    let pendingActionCount = allComplaints.filter(c => c.status === 'Assigned').length;
    let inProgressCount = allComplaints.filter(c => c.status === 'In Progress').length;
    let resolvedCount = allComplaints.filter(c => c.status === 'Resolved').length;

    const statContainers = document.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4 h3');
    if (statContainers.length >= 4) {
        statContainers[0].textContent = assignedCount;
        statContainers[1].textContent = pendingActionCount;
        statContainers[2].textContent = inProgressCount;
        statContainers[3].textContent = resolvedCount;
    }

    const titleEl = document.querySelector('h2.text-3xl.font-black');
    if (titleEl) titleEl.textContent = `Department Dashboard - ${user.department}`;
}

function renderDeptRecentComplaints(user) {
    const allComplaints = getComplaints().filter(c => c.department === user.department && c.status !== 'Pending').sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    const tbody = document.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (allComplaints.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-slate-500">No assigned complaints found.</td></tr>';
        return;
    }

    allComplaints.forEach(complaint => {
        const priorityColor = complaint.priority === 'high' ? 'bg-red-100 text-red-700' : (complaint.priority === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600');

        let statusDot = 'bg-slate-500';
        let statusTextClass = 'text-slate-600';
        if (complaint.status === 'Assigned') { statusDot = 'bg-amber-500'; statusTextClass = 'text-amber-600'; }
        if (complaint.status === 'In Progress') { statusDot = 'bg-blue-500'; statusTextClass = 'text-blue-600'; }
        if (complaint.status === 'Resolved') { statusDot = 'bg-emerald-500'; statusTextClass = 'text-emerald-600'; }

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer';
        tr.onclick = () => window.location.href = `depart_admin_update_complain_status.html?id=${complaint.id}`;

        tr.innerHTML = `
            <td class="px-6 py-4 text-sm font-medium text-slate-500">#CMP-${complaint.id}</td>
            <td class="px-6 py-4">
                <p class="text-sm font-semibold text-slate-900 dark:text-white">${complaint.title}</p>
                <p class="text-xs text-slate-400 truncate w-48">${complaint.description.substring(0, 40)}...</p>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">${complaint.studentName ? complaint.studentName.substring(0, 2).toUpperCase() : 'ST'}</div>
                    <span class="text-sm text-slate-700 dark:text-slate-300">${complaint.studentName}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">${new Date(complaint.createdDate).toLocaleDateString()}</td>
            <td class="px-6 py-4">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${priorityColor}">${complaint.priority}</span>
            </td>
            <td class="px-6 py-4">
                <span class="flex items-center gap-1.5 text-sm font-medium ${statusTextClass}">
                    <span class="w-2 h-2 rounded-full ${statusDot}"></span>
                    ${complaint.status}
                </span>
            </td>
            <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                    <button onclick="event.stopPropagation(); window.location.href='view_complaints.html?id=${complaint.id}';" class="p-1.5 hover:text-primary transition-colors" title="View Details">
                        <span class="material-symbols-outlined text-xl">visibility</span>
                    </button>
                    <button onclick="event.stopPropagation(); window.location.href='depart_admin_update_complain_status.html?id=${complaint.id}';" class="px-3 py-1 text-xs font-bold text-primary border border-primary/20 rounded-md hover:bg-primary/5 transition-colors">
                        Update
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function initDeptUpdateComplaint(user) {
    const urlParams = new URLSearchParams(window.location.search);
    const complaintId = urlParams.get('id');

    if (!complaintId) {
        alert("No complaint ID provided.");
        window.location.href = 'department_admin.html';
        return;
    }

    const complaint = getComplaintById(complaintId);
    if (!complaint || complaint.department !== user.department) {
        alert("Complaint not found or unauthorized.");
        window.location.href = 'department_admin.html';
        return;
    }

    // Header Links
    const backBtn = document.querySelector('header button.bg-primary');
    if (backBtn) backBtn.addEventListener('click', () => window.location.href = 'department_admin.html');
    const headerTitle = document.querySelector('header h2');
    if (headerTitle) headerTitle.textContent = `Complaints / CMP-${complaint.id}`;

    // Title Section
    const pageTitle = document.querySelector('.mb-8 h1');
    const pageSubtitle = document.querySelector('.mb-8 p');
    if (pageSubtitle) {
        pageSubtitle.innerHTML = `<span class="font-semibold text-primary">Case #CMP-${complaint.id}:</span> ${complaint.title}`;
    }

    // Summary Card
    const nameEl = document.querySelector('.flex.items-center.gap-3 div p.text-sm.font-semibold');
    const dateEl = document.querySelector('.flex.items-center.gap-3 div p.text-xs.text-slate-500');
    if (nameEl) nameEl.textContent = complaint.studentName;
    if (dateEl) dateEl.textContent = `Submitted: ${new Date(complaint.createdDate).toLocaleDateString()}`;

    const descEl = document.querySelector('.p-4.bg-slate-50 p');
    if (descEl) descEl.textContent = `"${complaint.description}"`;

    const statusEl = document.querySelectorAll('.grid.grid-cols-2.gap-4 p.text-sm.font-medium')[0];
    const deptEl = document.querySelectorAll('.grid.grid-cols-2.gap-4 p.text-sm.font-medium')[1];
    if (statusEl) statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-blue-400"></span> ${complaint.status}`;
    if (deptEl) deptEl.textContent = complaint.department;

    // Timeline elements
    const timelineContainerInner = document.querySelector('.relative.space-y-6');
    if (timelineContainerInner && complaint.timeline && complaint.timeline.length > 0) {
        timelineContainerInner.innerHTML = '';
        [...complaint.timeline].reverse().forEach(item => {
            let iconClass = 'bg-slate-400';
            if (item.type === 'admin' || item.type === 'dept_admin') iconClass = 'bg-primary';

            const d = new Date(item.date);
            timelineContainerInner.innerHTML += `
               <div class="relative flex items-start gap-4">
                    <div class="absolute left-0 w-10 flex items-center justify-center">
                        <div class="w-3 h-3 rounded-full ${iconClass} ring-4 ring-white dark:ring-slate-900"></div>
                    </div>
                    <div class="pl-10 pb-4">
                        <p class="text-sm font-semibold">${item.message}</p>
                        <p class="text-xs text-slate-500 mt-0.5">${d.toLocaleDateString()} • ${d.toLocaleTimeString()} by ${item.name}</p>
                    </div>
                </div>
            `;
        });
    }

    // Form population
    const form = document.querySelector('form');
    const statusSelect = document.querySelectorAll('select')[0];
    const prioritySelect = document.querySelectorAll('select')[1];

    // matching status value
    const statusMap = {
        'Pending': 'pending',
        'Assigned': 'pending', // show assigned as pending for dept admin
        'In Progress': 'in_progress',
        'Resolved': 'resolved',
        'Cannot Resolve': 'cannot_resolve',
        'Escalated': 'escalate'
    };
    if (statusSelect) {
        const val = statusMap[complaint.status] || 'pending';
        for (let i = 0; i < statusSelect.options.length; i++) {
            if (statusSelect.options[i].value === val) {
                statusSelect.selectedIndex = i; break;
            }
        }
    }

    if (prioritySelect) {
        for (let i = 0; i < prioritySelect.options.length; i++) {
            if (prioritySelect.options[i].value === complaint.priority.toLowerCase()) {
                prioritySelect.selectedIndex = i; break;
            }
        }
    }

    if (form) {
        const cancelBtn = form.querySelector('button[type="button"]');
        if (cancelBtn) cancelBtn.addEventListener('click', () => window.location.href = 'department_admin.html');

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const selectedStatusText = statusSelect.options[statusSelect.selectedIndex].text;
            const noteText = document.querySelector('textarea').value;

            complaint.status = selectedStatusText;
            complaint.priority = prioritySelect.options[prioritySelect.selectedIndex].value;

            if (noteText) {
                complaint.departmentNotes = complaint.departmentNotes || [];
                complaint.departmentNotes.push(noteText);
            }

            complaint.timeline = complaint.timeline || [];
            complaint.timeline.push({
                type: 'dept_admin',
                name: user.name,
                date: new Date().toISOString(),
                message: `Status updated to ${selectedStatusText}`
            });

            updateComplaint(complaint.id, complaint);

            // Notify student
            addNotification(complaint.userId, `Your complaint status has been updated to ${selectedStatusText}.`, `view_complaints.html?id=${complaint.id}`);

            alert("Complaint updated successfully!");
            window.location.href = 'department_admin.html';
        });
    }
}
