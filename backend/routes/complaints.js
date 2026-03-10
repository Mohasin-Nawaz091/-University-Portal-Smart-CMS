const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'))
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})
const upload = multer({ storage: storage })

router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { student_id, title, category, priority, description, department_id } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        const [result] = await db.query(
            'INSERT INTO complaints (student_id, title, category, priority, description, image_path, department_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [student_id, title, category, priority, description, imagePath, department_id || null]
        );
        const complaintId = result.insertId;

        // Add initial timeline entry
        await db.query('INSERT INTO complaint_updates (complaint_id, updated_by, status, comment) VALUES (?, ?, ?, ?)',
            [complaintId, student_id, 'Pending', 'Complaint submitted.']);

        res.json({ success: true, complaintId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/student/:id', async (req, res) => {
    try {
        const [complaints] = await db.query(`
            SELECT c.*, d.name as department_name 
            FROM complaints c 
            LEFT JOIN departments d ON c.department_id = d.id 
            WHERE c.student_id = ? 
            ORDER BY c.created_at DESC
        `, [req.params.id]);
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const [complaints] = await db.query(`
            SELECT c.*, u.name as student_name, d.name as department_name 
            FROM complaints c 
            JOIN users u ON c.student_id = u.id 
            LEFT JOIN departments d ON c.department_id = d.id 
            ORDER BY c.created_at DESC
        `);
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [complaints] = await db.query(`
            SELECT c.*, u.name as student_name, d.name as department_name 
            FROM complaints c 
            LEFT JOIN users u ON c.student_id = u.id 
            LEFT JOIN departments d ON c.department_id = d.id 
            WHERE c.id = ?
        `, [req.params.id]);

        if (complaints.length === 0) return res.status(404).json({ error: 'Not found' });

        const [updates] = await db.query(`
            SELECT cu.*, u.name as user_name, u.role as user_role 
            FROM complaint_updates cu 
            JOIN users u ON cu.updated_by = u.id 
            WHERE cu.complaint_id = ? 
            ORDER BY cu.updated_at ASC
        `, [req.params.id]);

        res.json({
            ...complaints[0],
            timeline: updates.map(upd => ({
                id: upd.id,
                name: upd.user_name,
                date: upd.created_at,
                message: upd.comment,
                status: upd.status,
                type: (upd.user_role === 'admin') ? 'admin' :
                    (upd.user_role === 'dept_admin' || upd.user_role === 'department_admin') ? 'department' : 'student'
            }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/:id/comment', async (req, res) => {
    try {
        const { id } = req.params;
        const { comment, updated_by } = req.body;
        console.log(`POST /${id}/comment - User: ${updated_by}, Comment: ${comment}`);

        if (!updated_by) {
            console.error("Missing updated_by in comment post");
            return res.status(400).json({ error: "Missing user information" });
        }

        const [complaints] = await db.query('SELECT status FROM complaints WHERE id = ?', [id]);
        const status = complaints.length > 0 ? complaints[0].status : 'Pending';

        await db.query(
            'INSERT INTO complaint_updates (complaint_id, updated_by, status, comment) VALUES (?, ?, ?, ?)',
            [id, updated_by, status, comment]
        );

        res.json({ success: true });
    } catch (err) {
        console.error("Comment post error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { title, category, priority, description } = req.body;
        await db.query(
            'UPDATE complaints SET title=?, category=?, priority=?, description=? WHERE id=?',
            [title, category, priority, description, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM complaints WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
