document.addEventListener('DOMContentLoaded', async () => {

    const user = requireAuth();
    if (!user) return;

    renderUserInfo(user);

    // Determine context based on URL
    if (window.location.pathname.endsWith('submit_complaints.html')) {
        initSubmitComplaint(user);
    } else if (window.location.pathname.endsWith('view_complaints.html')) {
        initViewComplaint(user);
    }

});

function renderUserInfo(user) {
    // Sidebar population
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const sidebarName = document.getElementById('sidebarName');
    const sidebarId = document.getElementById('sidebarId');

    if (sidebarAvatar && user.avatar) {
        sidebarAvatar.src = user.avatar.startsWith('http') ? user.avatar : `http://localhost:3000${user.avatar}`;
    }
    if (sidebarName) sidebarName.textContent = user.name;
    if (sidebarId) sidebarId.textContent = user.studentId || user.email;

    // Navbar population (for pages without sidebar)
    const navbarAvatar = document.getElementById('navbarAvatar');
    if (navbarAvatar && user.avatar) {
        navbarAvatar.src = user.avatar.startsWith('http') ? user.avatar : `http://localhost:3000${user.avatar}`;
    }
}

async function initSubmitComplaint(user) {
    const form = document.querySelector('form');
    if (!form) return;

    // Optional: Setup actual file preview
    const fileInput = document.getElementById('file-upload');
    let base64Image = null;

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    base64Image = event.target.result;
                    const previewContainer = document.getElementById('file-preview-container');
                    if (previewContainer) {
                        previewContainer.innerHTML = `
                            <div class="relative group aspect-square rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <img class="w-full h-full object-cover" src="${base64Image}" />
                                <div class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button class="bg-red-500 text-white p-1 rounded-full" type="button" onclick="document.getElementById('file-preview-container').innerHTML=''; base64Image=null;"><span class="material-symbols-outlined text-sm">close</span></button>
                                </div>
                            </div>
                        `;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const titleInput = document.querySelector('input[type="text"][placeholder*="e.g."]') || document.querySelector('input[type="text"]');
        const categorySelect = document.querySelector('select');
        const priorityInput = document.querySelector('input[name="priority"]:checked');
        const descTextarea = document.querySelector('textarea');

        if (!titleInput.value || !categorySelect.value || !priorityInput || !descTextarea.value) {
            alert("Please fill all required fields.");
            return;
        }

        const newComplaint = {
            userId: user.id,
            studentName: user.name,
            studentEmail: user.email,
            title: titleInput.value,
            category: categorySelect.value,
            priority: priorityInput.value,
            description: descTextarea.value,
            image: base64Image,
            status: "Pending",
            department: null,
            adminNotes: [],
            departmentNotes: []
        };

        const saved = await saveComplaint(newComplaint);

        // Notification
        await addNotification(1, `New complaint submitted: ${saved.title}`, `admin_assign_complain.html?id=${saved.id}`);

        alert("Complaint submitted successfully!");
        window.location.href = 'my_complaints.html';
    });
}

async function initViewComplaint(user) {
    const urlParams = new URLSearchParams(window.location.search);
    const complaintId = urlParams.get('id');

    if (!complaintId) {
        alert("No complaint ID provided.");
        window.history.back();
        return;
    }

    const complaint = await getComplaintById(complaintId);
    if (!complaint) {
        alert("Complaint not found.");
        window.history.back();
        return;
    }

    // Protect from other students
    if (user.role === 'student' && complaint.userId !== user.id) {
        alert("Unauthorized access");
        window.history.back();
        return;
    }

    // Fill UI
    // Breadcrumb ID
    const breadcrumbIds = Array.from(document.querySelectorAll('span, p, h1, div')).filter(el => el.textContent && el.textContent.includes('CMP-'));
    breadcrumbIds.forEach(el => {
        if (el.tagName === 'SPAN' && el.classList.contains('font-semibold') && el.classList.contains('text-slate-900')) {
            el.textContent = `CMP-${complaint.id}`;
        }
    });

    const titleH1 = document.querySelector('h1.text-3xl.font-black');
    if (titleH1) titleH1.textContent = complaint.title;

    // Badges update
    const badgeContainer = document.querySelector('.flex.flex-wrap.gap-2.items-center');
    if (badgeContainer) {
        let statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
        if (complaint.status === 'Resolved') statusBadgeClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
        else if (complaint.status === 'In Progress' || complaint.status === 'Assigned') statusBadgeClass = 'bg-amber-100 text-amber-600 border-amber-200';

        let priorityBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
        if (complaint.priority === 'high') priorityBadgeClass = 'bg-red-100 text-red-600 border-red-200';
        else if (complaint.priority === 'medium') priorityBadgeClass = 'bg-blue-100 text-blue-600 border-blue-200';

        badgeContainer.innerHTML = `
            <span class="px-3 py-1 ${statusBadgeClass} text-xs font-bold rounded-full border uppercase">${complaint.status}</span>
            <span class="px-3 py-1 ${priorityBadgeClass} text-xs font-bold rounded-full border uppercase">${complaint.priority} PRIORITY</span>
            <span class="text-xs text-slate-500 ml-2">ID: #CMP-${complaint.id}</span>
        `;
    }

    const complaintInfoGrid = document.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-2 > div');
    if (complaintInfoGrid.length >= 2) {
        // [0] Submitted On, [1] Category
        complaintInfoGrid[0].querySelector('.font-medium').textContent = new Date(complaint.createdDate).toLocaleDateString();
        complaintInfoGrid[1].querySelector('.font-medium').textContent = complaint.category.toUpperCase();
    }

    const descEl = document.getElementById('complaintDescription') || document.querySelector('section:not(.bg-white) .bg-slate-50.rounded-lg p') || document.querySelector('.bg-slate-50.rounded-lg p');
    if (descEl) descEl.textContent = complaint.description;

    const imgPreview = document.querySelector('.group.relative.w-32.h-24 img');
    if (imgPreview && complaint.image) {
        imgPreview.src = complaint.image;
    } else if (imgPreview) {
        imgPreview.closest('.group').style.display = 'none'; // hide if no image
    }

    // Populate Student Information
    const studentNameEl = document.querySelector('h4.text-lg.font-bold');
    if (studentNameEl) studentNameEl.textContent = complaint.studentName;

    // Find grid with student details. Since we don't have exact IDs, looking up by 'Student ID' and 'Email'
    const studentInfoSpans = document.querySelectorAll('.text-sm.font-bold');
    studentInfoSpans.forEach(span => {
        const prev = span.previousElementSibling;
        if (prev && prev.textContent === 'Student ID') span.textContent = complaint.userId;
        if (prev && prev.textContent === 'Email') span.textContent = complaint.studentEmail || "student@uni.edu";
    });

    // Populate Timeline Activity
    const timelineContainer = document.querySelector('.space-y-6.relative');
    if (timelineContainer) {
        timelineContainer.innerHTML = '';
        const timeline = complaint.timeline || [];

        if (timeline.length === 0) {
            timelineContainer.innerHTML = `
                <div class="text-center py-4 text-slate-500 text-sm italic">
                    No activity recorded yet.
                </div>
            `;
        }

        timeline.forEach(item => {
            let iconClass = 'bg-slate-100 text-slate-500';
            let iconStr = 'person';

            if (item.type === 'admin') {
                iconClass = 'bg-primary/20 text-primary';
                iconStr = 'settings_suggest';
            } else if (item.type === 'student') {
                iconClass = 'bg-primary/10 text-primary';
                iconStr = 'account_circle';
            } else if (item.type === 'department') {
                iconClass = 'bg-amber-100 text-amber-600';
                iconStr = 'corporate_fare';
            }

            timelineContainer.innerHTML += `
                <div class="relative flex items-start gap-4 mb-6">
                    <div class="z-10 flex items-center justify-center w-10 h-10 ${iconClass} rounded-full shrink-0">
                        <span class="material-symbols-outlined text-sm">${iconStr}</span>
                    </div>
                    <div class="flex-1 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg">
                        <div class="flex items-center justify-between mb-2">
                            <p class="text-sm font-bold">${item.name}</p>
                            <span class="text-xs text-slate-500">${new Date(item.date).toLocaleString()}</span>
                        </div>
                        <p class="text-sm text-slate-700 dark:text-slate-300 ${item.type === 'system' ? 'italic' : ''}">${item.message}</p>
                    </div>
                </div>
            `;
        });
    }

    // Add Comment Logic
    const commentBtn = document.querySelector('button.bg-primary.text-white.px-6');
    const commentBox = document.querySelector('textarea.resize-none');

    if (commentBtn && commentBox) {
        commentBtn.addEventListener('click', async () => {
            if (!commentBox.value) return;

            const commentText = commentBox.value;
            try {
                const result = await addComment(complaint.id, commentText);
                if (!result.success) throw new Error(result.error || "Failed to post comment");
            } catch (err) {
                alert("Error posting comment: " + err.message);
                return;
            }

            // Notification logic based on who commented
            try {
                if (user.role === 'student') {
                    if (complaint.department) {
                        const allUsers = await fetch('http://localhost:3000/api/users', reqOpts()).then(r => r.json());
                        const deptAdmin = allUsers.find(u => u.department && complaint.department && u.department.toLowerCase().includes(complaint.department.toLowerCase()));
                        if (deptAdmin) await addNotification(deptAdmin.id, `Student commented on ${complaint.title}`, `depart_admin_update_complain_status.html?id=${complaint.id}`);
                    }
                } else {
                    await addNotification(complaint.userId, `New comment on your complaint ${complaint.title}`, `view_complaints.html?id=${complaint.id}`);
                }
            } catch (notifyErr) {
                console.warn("Notification failed, but comment was posted.", notifyErr);
            }

            commentBox.value = '';
            // Refresh to show the new comment from the real backend
            const updated = await getComplaintById(complaint.id);
            initViewComplaint(user, updated);
        });
    }

    // Functional Buttons
    const btnPrint = document.getElementById('btnPrintReport');
    if (btnPrint) btnPrint.onclick = () => window.print();

    const btnExportPDF = document.getElementById('btnExportPDF');
    if (btnExportPDF) btnExportPDF.onclick = () => {
        alert("Exporting as PDF...");
        window.print();
    };

    const btnContactSupport = document.getElementById('btnContactSupport');
    if (btnContactSupport) {
        btnContactSupport.onclick = () => {
            window.location.href = `mailto:support@university.edu?subject=Support Request for Complaint #CMP-${complaint.id}`;
        };
    }

    // Admin Specific Actions
    if (user.role === 'admin') {
        const quickActionsContainer = document.querySelector('section.bg-primary\\/5 .space-y-3');
        if (quickActionsContainer) {
            const assignBtn = document.createElement('button');
            assignBtn.className = 'w-full flex items-center justify-between p-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all group mt-3';
            assignBtn.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-white">assignment_ind</span>
                    <span class="text-sm font-medium">Reassign / Manage</span>
                </div>
                <span class="material-symbols-outlined text-xs text-white">arrow_forward</span>
            `;
            assignBtn.onclick = () => window.location.href = `admin_assign_complain.html?id=${complaint.id}`;
            quickActionsContainer.prepend(assignBtn);
        }
    }

    const btnForward = document.getElementById('btnForwardComplaint');
    if (btnForward) {
        btnForward.onclick = async () => {
            const email = prompt("Enter the email address to forward this complaint to:");
            if (email) {
                alert(`Complaint #CMP-${complaint.id} has been forwarded to ${email}.`);
                // Optional: log to timeline
                complaint.timeline = complaint.timeline || [];
                complaint.timeline.push({
                    type: 'system',
                    name: 'System',
                    date: new Date().toISOString(),
                    message: `Complaint forwarded to ${email} by ${user.name}`
                });
                await updateComplaint(complaint.id, { timeline: complaint.timeline });
                initViewComplaint(user);
            }
        };
    }

    const btnHistory = document.getElementById('btnViewHistory');
    if (btnHistory) {
        btnHistory.onclick = () => {
            const tl = document.querySelector('.space-y-6.relative');
            if (tl) tl.scrollIntoView({ behavior: 'smooth' });
        };
    }

    // Hide Student Info Card for students, show for admins
    if (user.role === 'student') {
        document.querySelectorAll('h3').forEach(h3 => {
            if (h3.textContent.trim().toLowerCase().includes('student information')) {
                const card = h3.closest('section');
                if (card) card.style.display = 'none';
            }
        });
    } else if (user.role === 'admin' || user.role === 'dept_admin' || user.role === 'department_admin') {
        // Ensure it's visible for staff
        document.querySelectorAll('h3').forEach(h3 => {
            if (h3.textContent.trim().toLowerCase().includes('student information')) {
                const card = h3.closest('section');
                if (card) card.style.display = 'block';
            }
        });
    }

}
