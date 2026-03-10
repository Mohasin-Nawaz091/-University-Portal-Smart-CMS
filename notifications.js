document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Global logic for notification bell
    setupNotificationBell(user);

    // Render Notifications Page if on the correct UI
    if (window.location.pathname.endsWith('admin_notification_ui.html')) {
        renderNotificationsPage(user);
    }
});

function setupNotificationBell(user) {
    // Attach listener to any element representing the notification bell
    const bells = document.querySelectorAll('.material-symbols-outlined');
    bells.forEach(b => {
        if (b.textContent.trim() === 'notifications') {
            const btn = b.closest('button') || b.parentElement;
            if (btn) {
                // Ensure relative positioning for badge
                if (!btn.classList.contains('relative')) btn.classList.add('relative');
                btn.style.cursor = 'pointer';

                // Add/Update badge
                initBellBadge(btn, user);

                // Re-clone to remove old listeners if any, then add fresh one
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);

                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleNotificationDropdown(newBtn, user);
                });
            }
        }
    });
}

async function initBellBadge(btn, user) {
    const notifications = await getUserNotifications(user.id) || [];
    const unread = notifications.filter(n => !n.read).length;

    let badge = btn.querySelector('.notif-badge');
    if (unread > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'notif-badge absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900';
            btn.appendChild(badge);
        }
    } else if (badge) {
        badge.remove();
    }
}

async function toggleNotificationDropdown(anchor, user) {
    let dropdown = document.getElementById('notif-dropdown');
    if (dropdown) {
        dropdown.remove();
        return;
    }

    dropdown = document.createElement('div');
    dropdown.id = 'notif-dropdown';
    dropdown.className = 'absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-[100] overflow-hidden';

    // Position dropdown under anchor if it's not already absolute
    const rect = anchor.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
    dropdown.style.left = (rect.right - 320 + window.scrollX) + 'px';
    dropdown.style.position = 'absolute';

    dropdown.innerHTML = `
        <div class="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 class="font-bold text-sm">Notifications</h3>
            <a href="admin_notification_ui.html" class="text-xs text-primary hover:underline">View All</a>
        </div>
        <div id="notif-list-mini" class="max-h-80 overflow-y-auto">
            <div class="p-4 text-center text-slate-500 text-sm">Loading...</div>
        </div>
    `;

    document.body.appendChild(dropdown);

    // Prevent closing when clicking inside
    dropdown.addEventListener('click', (e) => e.stopPropagation());

    // Close on click outside
    const closeHandler = () => {
        dropdown.remove();
        document.removeEventListener('click', closeHandler);
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 10);

    // Fetch and populate
    const notifications = await getUserNotifications(user.id) || [];
    const listMini = document.getElementById('notif-list-mini');
    if (listMini) {
        listMini.innerHTML = '';
        if (notifications.length === 0) {
            listMini.innerHTML = '<div class="p-4 text-center text-slate-500 text-sm">No notifications</div>';
        } else {
            [...notifications].reverse().slice(0, 5).forEach(n => {
                const item = document.createElement('div');
                item.className = `p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${n.read ? 'opacity-60' : ''}`;
                item.innerHTML = `
                    <p class="text-xs font-semibold text-slate-900 dark:text-slate-100">${n.message}</p>
                    <p class="text-[10px] text-slate-400 mt-1 uppercase">${new Date(n.createdDate).toLocaleTimeString()}</p>
                `;
                item.onclick = async () => {
                    await markNotificationRead(n.id);
                    window.location.href = n.link || '#';
                };
                listMini.appendChild(item);
            });
        }
    }
}

async function renderNotificationsPage(user) {
    const notifications = await getUserNotifications(user.id) || [];

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
        markReadBtn.addEventListener('click', async () => {
            await markAllNotificationsAsRead(user.id);
            window.location.reload();
        });
    }
}
