const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/assigned/:department_name', async (req, res) => {
    try {
        const { department_name } = req.params;
        const [depts] = await db.query('SELECT id FROM departments WHERE name LIKE ? OR ? LIKE CONCAT(\"%\", name, \"%\")', [`%${department_name}%`, department_name]);
        if (depts.length === 0) return res.status(404).json({ error: 'Department not found' });
        const deptId = depts[0].id;

        const [complaints] = await db.query(`
            SELECT c.*, u.name as student_name, d.name as department 
            FROM complaints c 
            JOIN users u ON c.student_id = u.id
            JOIN departments d ON c.department_id = d.id
            WHERE c.department_id = ? 
            ORDER BY c.created_at DESC
        `, [deptId]);
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/update', async (req, res) => {
    try {
        const { complaint_id, status, comment, updated_by, priority } = req.body;

        // Construct update query dynamically
        let query = 'UPDATE complaints SET status = ?';
        let params = [status];

        if (priority) {
            query += ', priority = ?';
            params.push(priority);
        }

        query += ' WHERE id = ?';
        params.push(complaint_id);

        await db.query(query, params);

        await db.query('INSERT INTO complaint_updates (complaint_id, updated_by, status, comment) VALUES (?, ?, ?, ?)',
            [complaint_id, updated_by, status, comment]);

        // Create notification for student
        const [comps] = await db.query('SELECT student_id FROM complaints WHERE id = ?', [complaint_id]);
        if (comps.length > 0) {
            await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)',
                [comps[0].student_id, `Your complaint #${complaint_id} status was updated to ${status}. Details: ${comment}`]);
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/list', async (req, res) => {
    try {
        const [depts] = await db.query('SELECT * FROM departments');
        res.json(depts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/add', async (req, res) => {
    try {
        const { name } = req.body;
        const bcrypt = require('bcrypt');

        const [rows] = await db.query('SELECT id FROM departments WHERE name = ?', [name]);
        if (rows.length > 0) return res.status(400).json({ error: 'Department exists' });

        await db.query('INSERT INTO departments (name) VALUES (?)', [name]);

        // create dept admin
        const emailPrefix = name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        const deptEmail = `${emailPrefix}_admin@university.edu`;
        const hashedPwd = await bcrypt.hash('password123', 10);
        await db.query(
            `INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)`,
            [name + ' Admin', deptEmail, hashedPwd, 'department_admin', name]
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
