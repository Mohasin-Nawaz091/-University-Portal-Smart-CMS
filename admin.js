document.addEventListener('DOMContentLoaded', () => {

    // Auth for admin
    const user = requireAuth(['admin']);
    if (!user) return;

    // Sidebar admin details
    const adminNameEl = document.querySelector('aside .text-xs.font-semibold.truncate');
    if (adminNameEl) adminNameEl.textContent = user.name;
    const adminRoleEl = document.querySelector('aside .text-\\[10px\\].text-slate-500.truncate');
    if (adminRoleEl) adminRoleEl.textContent = "System Administrator";

    if (window.location.pathname.endsWith('admin.html') || window.location.pathname.endsWith('admin-dashboard.html')) {
        renderAdminDashboardStats();
        renderAdminRecentComplaints();
    } else if (window.location.pathname.endsWith('admin_all_complaints.html')) {
        renderAdminAllComplaints();
    } else if (window.location.pathname.endsWith('admin_assign_complain.html')) {
        initAdminAssignComplaint();
    } else if (window.location.pathname.endsWith('admin_report.html')) {
        renderAdminReports();
    }

});

function renderAdminDashboardStats() {
    const allComplaints = getComplaints();

    // Total
    const statContainers = document.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-3.lg\\:grid-cols-5 .text-2xl.font-bold');
    if (statContainers.length >= 5) {
        statContainers[0].textContent = allComplaints.length; // Total
        statContainers[1].textContent = allComplaints.filter(c => c.status === 'Pending').length; // Pending
        statContainers[2].textContent = allComplaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length; // In Progress
        statContainers[3].textContent = allComplaints.filter(c => c.status === 'Resolved').length; // Resolved
        statContainers[4].textContent = allComplaints.filter(c => c.status === 'Rejected' || c.status === 'Cannot Resolve').length; // Rejected
    }

    // Category Breakdown Center text
    const categoryTotalEl = document.querySelector('.relative.flex-1.flex.items-center.justify-center .text-3xl.font-bold');
    if (categoryTotalEl) categoryTotalEl.textContent = allComplaints.length;
}

function renderAdminRecentComplaints() {
    const allComplaints = getComplaints().sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate)).slice(0, 5);
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

        const priorityColor = complaint.priority === 'high' ? 'bg-red-500' : (complaint.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400');

        let statusBadgeClass = 'bg-slate-100 text-slate-600';
        if (complaint.status === 'Pending') statusBadgeClass = 'bg-amber-100 text-amber-700';
        if (complaint.status === 'In Progress') statusBadgeClass = 'bg-blue-100 text-blue-700';
        if (complaint.status === 'Resolved') statusBadgeClass = 'bg-emerald-100 text-emerald-700';

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer';
        tr.onclick = () => window.location.href = `admin_assign_complain.html?id=${complaint.id}`;

        tr.innerHTML = `
            <td class="px-6 py-4 text-xs font-bold text-slate-500">#CMP-${complaint.id}</td>
            <td class="px-6 py-4">
                <p class="text-sm font-semibold">${complaint.title}</p>
                <p class="text-[10px] text-slate-400">Submitted ${new Date(complaint.createdDate).toLocaleDateString()}</p>
            </td>
            <td class="px-6 py-4 text-xs">
                <span class="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400 capitalize">${complaint.category}</span>
            </td>
            <td class="px-6 py-4">
                <span class="text-xs font-medium">${complaint.studentName}</span>
            </td>
            <td class="px-6 py-4">
                <span class="px-2.5 py-1 ${statusBadgeClass} rounded-full text-[10px] font-bold capitalize">${complaint.status}</span>
            </td>
            <td class="px-6 py-4">
                <span class="text-slate-600 font-bold text-[10px] flex items-center gap-1 uppercase">
                    <span class="size-1.5 rounded-full ${priorityColor}"></span> ${complaint.priority}
                </span>
            </td>
            <td class="px-6 py-4 text-right">
                <button onclick="event.stopPropagation(); window.location.href='admin_assign_complain.html?id=${complaint.id}';" class="px-3 py-1 bg-primary text-white font-bold rounded hover:bg-primary/90 text-xs shadow">Assign/View</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderAdminAllComplaints() {
    const allComplaints = getComplaints().sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
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

        const priorityColor = complaint.priority === 'high' ? 'bg-red-500' : (complaint.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400');

        let statusBadgeClass = 'bg-slate-100 text-slate-600';
        if (complaint.status === 'Pending') statusBadgeClass = 'bg-amber-100 text-amber-700';
        if (complaint.status === 'In Progress' || complaint.status === 'Assigned') statusBadgeClass = 'bg-blue-100 text-blue-700';
        if (complaint.status === 'Resolved') statusBadgeClass = 'bg-emerald-100 text-emerald-700';
        if (complaint.status === 'Rejected') statusBadgeClass = 'bg-red-100 text-red-700';

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer';
        tr.onclick = () => window.location.href = `admin_assign_complain.html?id=${complaint.id}`;

        tr.innerHTML = `
            <td class="px-6 py-4 text-sm font-semibold text-slate-400">#CMP-${complaint.id}</td>
            <td class="px-6 py-4">
                <div class="flex flex-col">
                    <span class="text-sm font-semibold">${complaint.title}</span>
                    <span class="text-xs text-slate-500 capitalize">${complaint.department || 'Not Assigned'} • ${complaint.category}</span>
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">${complaint.studentName ? complaint.studentName.substring(0, 2).toUpperCase() : 'ST'}</div>
                    <span class="text-sm">${complaint.studentName}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-sm">${new Date(complaint.createdDate).toLocaleDateString()}</td>
            <td class="px-6 py-4">
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeClass} capitalize">${complaint.status}</span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full ${priorityColor}"></span>
                    <span class="text-xs font-medium uppercase">${complaint.priority}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                    <button onclick="event.stopPropagation(); window.location.href='admin_assign_complain.html?id=${complaint.id}';" class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-primary" title="View/Assign"><span class="material-symbols-outlined text-lg">visibility</span></button>
                    <button class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500" title="Delete" onclick="event.stopPropagation(); if(confirm('Are you sure you want to delete this complaint?')){ deleteComplaint(${complaint.id}); location.reload(); }"><span class="material-symbols-outlined text-lg">delete</span></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    const showingText = document.querySelector('.px-6.py-4.bg-slate-50 .text-sm.text-slate-500');
    if (showingText) {
        showingText.innerHTML = `Showing <span class="font-semibold text-slate-900 dark:text-slate-100">${allComplaints.length}</span> results`;
    }
}

function initAdminAssignComplaint() {
    const urlParams = new URLSearchParams(window.location.search);
    const complaintId = urlParams.get('id');

    if (!complaintId) {
        alert("No complaint ID provided.");
        window.history.back();
        return;
    }

    const complaint = getComplaintById(complaintId);
    if (!complaint) {
        alert("Complaint not found.");
        window.history.back();
        return;
    }

    // Populate modal fields
    const modalTitleEl = document.querySelector('.flex.items-center.justify-between.px-6.py-4 .text-sm.text-slate-500');
    if (modalTitleEl) modalTitleEl.textContent = `Case #CMP-${complaint.id}: ${complaint.title}`;

    const deptSelect = document.querySelector('select');
    if (deptSelect) {
        deptSelect.innerHTML = '<option value="" disabled selected>Select a department...</option>';
        getDepartments().forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.toLowerCase();
            opt.textContent = d;
            deptSelect.appendChild(opt);
        });

        if (complaint.department) {
            // Find matching option
            for (let i = 0; i < deptSelect.options.length; i++) {
                if (deptSelect.options[i].text === complaint.department) {
                    deptSelect.selectedIndex = i;
                    break;
                }
            }
        }
    }

    // priority
    const priorityBtns = document.querySelectorAll('.grid.grid-cols-2.sm\\:grid-cols-4 button');
    let selectedPriority = complaint.priority;

    priorityBtns.forEach(btn => {
        if (btn.textContent.toLowerCase() === selectedPriority) {
            btn.className = 'px-3 py-2 text-xs font-bold rounded-lg border-2 border-primary bg-primary/5 text-primary';
        } else {
            btn.className = 'px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-primary transition-all';
        }

        btn.addEventListener('click', () => {
            priorityBtns.forEach(b => b.className = 'px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-primary transition-all');
            btn.className = 'px-3 py-2 text-xs font-bold rounded-lg border-2 border-primary bg-primary/5 text-primary';
            selectedPriority = btn.textContent.toLowerCase();
        });
    });

    const noteBox = document.querySelector('textarea');
    if (complaint.adminNotes && complaint.adminNotes.length > 0) {
        noteBox.value = complaint.adminNotes[complaint.adminNotes.length - 1];
    }

    const closeBtn = document.querySelector('button .material-symbols-outlined').parentElement; // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.history.back();
        });
    }
    const cancelBtn = document.querySelector('.px-6.py-4.bg-slate-50.flex button');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.history.back();
        });
    }

    const assignBtn = document.querySelectorAll('.px-6.py-4.bg-slate-50.flex button')[1];
    if (assignBtn) {
        assignBtn.addEventListener('click', () => {
            if (!deptSelect.value) {
                alert("Please select a department");
                return;
            }

            const oldStatus = complaint.status;
            complaint.status = "Assigned";
            complaint.department = deptSelect.options[deptSelect.selectedIndex].text;
            complaint.priority = selectedPriority;

            if (noteBox.value) {
                complaint.adminNotes = complaint.adminNotes || [];
                complaint.adminNotes.push(noteBox.value);
            }

            complaint.timeline = complaint.timeline || [];
            complaint.timeline.push({
                type: 'admin',
                name: 'System Admin',
                date: new Date().toISOString(),
                message: `Assigned to ${complaint.department} with ${selectedPriority} priority.`
            });

            updateComplaint(complaint.id, complaint);

            // Create notification for department
            const deptAdmins = getUsers().filter(u => u.department === complaint.department);
            deptAdmins.forEach(da => {
                addNotification(da.id, `New complaint assigned: ${complaint.title}`, `department_admin.html`);
            });

            // Notification for student
            addNotification(complaint.userId, `Your complaint has been assigned to ${complaint.department}`, `view_complaints.html?id=${complaint.id}`);

            alert("Complaint assigned successfully!");
            window.location.href = 'admin_all_complaints.html';
        });
    }
}

function renderAdminReports() {
    const allComplaints = getComplaints();
    const categories = {};

    allComplaints.forEach(c => {
        categories[c.category] = (categories[c.category] || 0) + 1;
    });

    const totalEl = document.querySelector('.relative.size-48 .text-2xl.font-bold');
    if (totalEl) totalEl.textContent = allComplaints.length;

    const itSupport = categories['it'] || categories['IT Support'] || 0;
    const academic = categories['academic'] || 0;
    const hostel = categories['hostel'] || categories['Hostel'] || categories['facilities'] || 0;
    const others = allComplaints.length - (itSupport + academic + hostel);

    const catNumbers = document.querySelectorAll('.bg-white.dark\\:bg-slate-900.p-6.rounded-xl .flex-1.space-y-4 .text-sm.font-bold');
    if (catNumbers.length >= 4 && allComplaints.length > 0) {
        catNumbers[0].textContent = Math.round((itSupport / allComplaints.length) * 100) + '%';
        catNumbers[1].textContent = Math.round((academic / allComplaints.length) * 100) + '%';
        catNumbers[2].textContent = Math.round((hostel / allComplaints.length) * 100) + '%';
        catNumbers[3].textContent = Math.round((others / allComplaints.length) * 100) + '%';
    }
}
