document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Populate Sidebar & Header
    const dashboardLink = document.querySelectorAll('nav a')[0];
    const headerTitle = document.querySelector('header p.text-sm.font-semibold');
    const headerRole = document.querySelector('header p.text-xs.text-slate-500');

    let dashboardUrl = 'student_dashboard.html';
    let roleText = 'Student';

    if (user.role === 'admin') {
        dashboardUrl = 'admin.html';
        roleText = 'System Administrator';
    } else if (user.role === 'dept_admin') {
        dashboardUrl = 'department_admin.html';
        roleText = 'Department Admin';
    }

    if (dashboardLink) dashboardLink.href = dashboardUrl;
    if (headerTitle) headerTitle.textContent = user.name;
    if (headerRole) headerRole.textContent = roleText;

    // Render Notifications
    if (window.location.pathname.endsWith('admin_notification_ui.html')) {
        renderNotificationsPage(user);
    } else {
        // Global logic for notification bell
        const bellIcon = document.querySelector('button .material-symbols-outlined:contains("notifications")');
        // Actually this is complex without jQuery. Let's just attach redirect to any button wrapping a notifications icon.
        const bells = document.querySelectorAll('.material-symbols-outlined');
        bells.forEach(b => {
            if (b.textContent.trim() === 'notifications') {
                const btn = b.closest('button') || b.parentElement;
                if (btn && btn.tagName === 'BUTTON' || btn.tagName === 'DIV') {
                    btn.style.cursor = 'pointer';
                    btn.addEventListener('click', () => {
                        window.location.href = 'admin_notification_ui.html';
                    });
                }
            }
        });
    }
});

function renderNotificationsPage(user) {
    const notifications = getUserNotifications(user.id) || [];

    // Unread count
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.querySelector('.px-2.py-0\\.5.rounded-full');
    if (badge) {
        badge.textContent = `${unreadCount} New`;
        if (unreadCount === 0) badge.style.display = 'none';
        else badge.style.display = 'inline-block';
    }

    const bellBadge = document.querySelector('button .absolute.top-2.right-2');
    if (bellBadge && unreadCount === 0) {
        bellBadge.style.display = 'none';
    }

    const listContainer = document.querySelector('.max-h-\\[440px\\].overflow-y-auto');
    if (listContainer) {
        listContainer.innerHTML = '';

        if (notifications.length === 0) {
            listContainer.innerHTML = '<div class="p-4 text-center text-slate-500">No notifications found.</div>';
            return;
        }

        [...notifications].reverse().forEach(notif => {
            const timeDiff = Math.floor((new Date() - new Date(notif.createdDate)) / 60000); // mins
            let timeStr = timeDiff + ' mins ago';
            if (timeDiff > 60) timeStr = Math.floor(timeDiff / 60) + ' hours ago';
            if (timeDiff > 1440) timeStr = Math.floor(timeDiff / 1440) + ' days ago';
            if (timeDiff <= 0) timeStr = 'Just now';

            // Mark read visually if so
            const bgClass = notif.read ? 'bg-slate-50/40 dark:bg-slate-800/20 opacity-70' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 relative';
            const dot = notif.read ? '' : `<span class="absolute top-6 left-2 w-1.5 h-1.5 rounded-full bg-primary"></span>`;

            listContainer.innerHTML += `
               <div onclick="window.location.href='${notif.link}'" class="p-4 flex gap-4 cursor-pointer transition-colors border-t border-slate-50 dark:border-slate-800/30 ${bgClass}">
                    ${dot}
                    <div class="h-10 w-10 shrink-0 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <span class="material-symbols-outlined">info</span>
                    </div>
                    <div class="flex flex-col">
                        <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">${notif.message}</p>
                        <span class="text-[10px] font-medium text-slate-400 mt-2 uppercase tracking-tight">${timeStr}</span>
                    </div>
                </div>
            `;
        });
    }

    const markReadBtn = document.querySelector('button.text-primary.hover\\:underline');
    if (markReadBtn) {
        markReadBtn.addEventListener('click', () => {
            markAllNotificationsAsRead(user.id);
            window.location.reload();
        });
    }
}
