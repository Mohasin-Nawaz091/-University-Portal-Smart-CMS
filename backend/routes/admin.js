const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/complaints', async (req, res) => {
    try {
        const [complaints] = await db.query(`
            SELECT c.*, u.name as student_name, d.name as department_name 
            FROM complaints c 
            LEFT JOIN users u ON c.student_id = u.id 
            LEFT JOIN departments d ON c.department_id = d.id 
            ORDER BY c.created_at DESC
        `);
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/reports', async (req, res) => {
    try {
        const [totalRows] = await db.query('SELECT count(*) as count FROM complaints');
        const [pendingRows] = await db.query("SELECT count(*) as count FROM complaints WHERE status = 'Pending'");
        const [resolvedRows] = await db.query("SELECT count(*) as count FROM complaints WHERE status = 'Resolved'");
        const [categoriesRows] = await db.query("SELECT category as label, count(*) as count FROM complaints GROUP BY category");

        res.json({
            total: totalRows[0].count,
            pending: pendingRows[0].count,
            resolved: resolvedRows[0].count,
            categories: categoriesRows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/assign', async (req, res) => {
    try {
        const { complaint_id, department_name, status, priority, admin_note } = req.body;

        // Get department id by name
        let [depts] = await db.query('SELECT id FROM departments WHERE LOWER(name) = LOWER(?)', [department_name]);
        let deptId;
        if (depts.length > 0) {
            deptId = depts[0].id;
        } else {
            // Check if user meant ID directly
            deptId = parseInt(department_name) || null;
            if (!deptId) return res.status(400).json({ error: 'Department not found' });
        }

        // Update complaint with status and priority as well
        await db.query('UPDATE complaints SET department_id = ?, status = ?, priority = ? WHERE id = ?',
            [deptId, status || 'Assigned', priority || 'medium', complaint_id]);

        // Always add an entry to updates table for tracking
        const trackingNote = admin_note || `Complaint assigned to ${department_name}`;
        await db.query('INSERT INTO complaint_updates (complaint_id, updated_by, status, comment) VALUES (?, ?, ?, ?)',
            [complaint_id, req.body.admin_id || 1, status || 'Assigned', trackingNote]);

        // Create notification for student
        const [comps] = await db.query('SELECT student_id, title FROM complaints WHERE id = ?', [complaint_id]);
        if (comps.length > 0) {
            await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)',
                [comps[0].student_id, `Your complaint #${complaint_id} (${comps[0].title}) was assigned to ${department_name}`]);
        }

        // Create notification for department admin
        const [deptAdmins] = await db.query('SELECT id FROM users WHERE role IN ("dept_admin", "department_admin") AND (department LIKE ? OR ? LIKE CONCAT("%", department, "%"))', [`%${department_name}%`, department_name]);
        for (const admin of deptAdmins) {
            await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)',
                [admin.id, `New complaint #${complaint_id} assigned to your department: ${comps[0].title}`]);
        }

        res.json({ success: true });
    } catch (err) {
        console.error("Assign Error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
