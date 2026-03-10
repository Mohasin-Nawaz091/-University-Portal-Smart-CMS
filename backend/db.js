const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'mohasin091',
    port: 3306
};

// Create a pool without database first to create the db if not exists
const initDbAndTables = async () => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.query(`CREATE DATABASE IF NOT EXISTS university_complaint_system`);
        await connection.end();
        console.log("Database ensured");

        // Connect to the specific database
        const pool = mysql.createPool({
            ...dbConfig,
            database: 'university_complaint_system',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Ensure tables exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                student_id VARCHAR(50),
                semester VARCHAR(50),
                phone VARCHAR(50),
                avatar VARCHAR(255),
                role ENUM('student', 'admin', 'department_admin', 'dept_admin') DEFAULT 'student',
                department VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ensure columns exist even if table already exists
        const [columns] = await pool.query('SHOW COLUMNS FROM users');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('phone')) await pool.query('ALTER TABLE users ADD COLUMN phone VARCHAR(50)');
        if (!columnNames.includes('avatar')) await pool.query('ALTER TABLE users ADD COLUMN avatar VARCHAR(255)');
        if (!columnNames.includes('student_id')) await pool.query('ALTER TABLE users ADD COLUMN student_id VARCHAR(50)');
        if (!columnNames.includes('semester')) await pool.query('ALTER TABLE users ADD COLUMN semester VARCHAR(50)');

        // Update ENUM for role
        await pool.query("ALTER TABLE users MODIFY COLUMN role ENUM('student', 'admin', 'department_admin', 'dept_admin') DEFAULT 'student'");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS departments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS complaints (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                category VARCHAR(255),
                priority VARCHAR(50),
                description TEXT,
                image_path VARCHAR(255),
                status VARCHAR(50) DEFAULT 'Pending',
                department_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS complaint_updates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                complaint_id INT NOT NULL,
                updated_by INT NOT NULL,
                status VARCHAR(50),
                comment TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
                FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50),
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Seed initial admin and departments if needed
        const [admins] = await pool.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
        if (admins.length === 0) {
            const hashedPwd = await bcrypt.hash('password123', 10);
            await pool.query(
                `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
                ['System Admin', 'admin@university.edu', hashedPwd, 'admin']
            );
        }

        const initialDepartments = [
            { name: 'IT Department', email: 'it_admin@university.edu' },
            { name: 'Hostel Department', email: 'hostel_admin@university.edu' },
            { name: 'Discipline Committee', email: 'discipline_admin@university.edu' },
            { name: 'Academic Department', email: 'academic_admin@university.edu' },
            { name: 'Library', email: 'library_admin@university.edu' }
        ];

        for (let dept of initialDepartments) {
            const [rows] = await pool.query(`SELECT id FROM departments WHERE name = ?`, [dept.name]);
            if (rows.length === 0) {
                await pool.query(`INSERT INTO departments (name) VALUES (?)`, [dept.name]);

                const hashedPwd = await bcrypt.hash('password123', 10);
                await pool.query(
                    `INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)`,
                    [dept.name + ' Admin', dept.email, hashedPwd, 'department_admin', dept.name]
                );
            }
        }

        console.log("Tables and initial data ensured");
        return pool;
    } catch (err) {
        console.error("Database connection error: ", err);
        process.exit(1);
    }
};

const poolPromise = initDbAndTables();

module.exports = {
    query: async (sql, values) => {
        const pool = await poolPromise;
        return pool.query(sql, values);
    }
};
