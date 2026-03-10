const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET = 'YOUR_SECRET_KEY';

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, department, studentId, semester } = req.body;
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: 'Email already exists' });

        const hashedPwd = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role, department, student_id, semester) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, email, hashedPwd, role || 'student', department || null, studentId || null, semester || null]
        );
        res.status(201).json({ success: true, userId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = users[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '1d' });

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                phone: user.phone,
                avatar: user.avatar,
                studentId: user.student_id,
                semester: user.semester
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, path.join(__dirname, '../uploads')) },
    filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.originalname) }
});
const upload = multer({ storage: storage });

router.post('/update-profile', upload.single('avatar'), async (req, res) => {
    try {
        const { id, name, email, phone, department } = req.body;
        const avatarPath = req.file ? `/uploads/${req.file.filename}` : null;

        let query = 'UPDATE users SET name=?, email=?, phone=?, department=?';
        let params = [name, email, phone, department];

        if (avatarPath) {
            query += ', avatar=?';
            params.push(avatarPath);
        }

        query += ' WHERE id=?';
        params.push(id);

        await db.query(query, params);

        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        const user = users[0];
        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                phone: user.phone,
                avatar: user.avatar
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/change-password', async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;
        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });

        const match = await bcrypt.compare(currentPassword, users[0].password);
        if (!match) return res.status(401).json({ error: 'Incorrect current password' });

        const hashedNewPwd = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPwd, userId]);

        res.json({ success: true });
    } catch (err) {
        console.error('Change Password Error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/users', async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email, role, department FROM users');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
