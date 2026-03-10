const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/:user_id', async (req, res) => {
    try {
        const [notifications] = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [req.params.user_id]);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/:user_id/mark-read', async (req, res) => {
    try {
        await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.params.user_id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/:notification_id/read', async (req, res) => {
    try {
        await db.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [req.params.notification_id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
