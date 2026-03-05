document.addEventListener('DOMContentLoaded', () => {

    // Determine context based on URL
    if (window.location.pathname.endsWith('submit_complaints.html')) {
        const user = requireAuth(['student']);
        if (!user) return;
        initSubmitComplaint(user);
    } else if (window.location.pathname.endsWith('view_complaints.html')) {
        const user = requireAuth(); // any logged in user can view (with some restrictions)
        if (!user) return;
        initViewComplaint(user);
    }

});

function initSubmitComplaint(user) {
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
                    // Optional: Update a preview thumbnail if needed
                };
                reader.readAsDataURL(file);
            }
        });
    }

    form.addEventListener('submit', (e) => {
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
            departmentNotes: [],
            timeline: [
                {
                    type: "student",
                    name: user.name,
                    date: new Date().toISOString(),
                    message: "Complaint submitted."
                }
            ]
        };

        const saved = saveComplaint(newComplaint);

        // Notification
        addNotification(1, `New complaint submitted: ${saved.title}`, `admin_assign_complain.html?id=${saved.id}`); // send to admin

        alert("Complaint submitted successfully!");
        window.location.href = 'my_complaints.html';
    });
}

function initViewComplaint(user) {
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

    const descEl = document.querySelector('.bg-slate-50.rounded-lg p');
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
    if (timelineContainer && complaint.timeline) {
        timelineContainer.innerHTML = '';
        complaint.timeline.forEach(item => {
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
        commentBtn.addEventListener('click', () => {
            if (!commentBox.value) return;

            let type = 'user';
            if (user.role === 'admin') type = 'admin';
            else if (user.role === 'dept_admin') type = 'department';
            else if (user.role === 'student') type = 'student';

            complaint.timeline = complaint.timeline || [];
            complaint.timeline.push({
                type: type,
                name: user.name,
                date: new Date().toISOString(),
                message: commentBox.value
            });

            updateComplaint(complaint.id, { timeline: complaint.timeline });

            // Notification logic based on who commented
            if (user.role === 'student') {
                if (complaint.department) {
                    addNotification(getUsers().find(u => u.department === complaint.department)?.id, `Student commented on ${complaint.title}`, `depart_admin_update_complain_status.html?id=${complaint.id}`);
                }
            } else {
                addNotification(complaint.userId, `New comment on your complaint ${complaint.title}`, `view_complaints.html?id=${complaint.id}`);
            }

            commentBox.value = '';
            initViewComplaint(user); // Reload timeline
        });
    }

}
