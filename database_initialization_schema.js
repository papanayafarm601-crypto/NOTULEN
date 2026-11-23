const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

function initDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Enable Foreign Keys
            db.run('PRAGMA foreign_keys = ON');

            // 1. Tabel Users
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'notulis',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // 2. Tabel Meetings
            db.run(`CREATE TABLE IF NOT EXISTS meetings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                meeting_number TEXT UNIQUE NOT NULL,
                document_number TEXT,
                title TEXT NOT NULL,
                meeting_date DATE NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                location TEXT NOT NULL,
                meeting_type TEXT NOT NULL,
                leader_name TEXT NOT NULL,
                secretary_name TEXT NOT NULL,
                is_important INTEGER DEFAULT 0,
                is_archived INTEGER DEFAULT 0,
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )`);

            // 3. Tabel Participants
            db.run(`CREATE TABLE IF NOT EXISTS participants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                meeting_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                position TEXT,
                department TEXT,
                attendance_status TEXT DEFAULT 'Hadir',
                notes TEXT,
                FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
            )`);

            // 4. Tabel Agendas
            db.run(`CREATE TABLE IF NOT EXISTS agendas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                meeting_id INTEGER NOT NULL,
                agenda_order INTEGER NOT NULL,
                description TEXT NOT NULL,
                FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
            )`);

            // 5. Tabel Discussions
            db.run(`CREATE TABLE IF NOT EXISTS discussions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                meeting_id INTEGER NOT NULL,
                summary TEXT,
                important_notes TEXT,
                participant_inputs TEXT,
                FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
            )`);

            // 6. Tabel Decisions
            db.run(`CREATE TABLE IF NOT EXISTS decisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                meeting_id INTEGER NOT NULL,
                decision_number TEXT,
                description TEXT NOT NULL,
                pic TEXT,
                deadline DATE,
                FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
            )`);

            // 7. Tabel Follow Ups
            db.run(`CREATE TABLE IF NOT EXISTS follow_ups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                meeting_id INTEGER NOT NULL,
                task_description TEXT NOT NULL,
                pic TEXT NOT NULL,
                target_date DATE,
                status TEXT DEFAULT 'Belum dimulai',
                FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
            )`);

            // 8. Tabel Attachments
            db.run(`CREATE TABLE IF NOT EXISTS attachments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                meeting_id INTEGER NOT NULL,
                file_name TEXT NOT NULL,
                original_name TEXT NOT NULL,
                file_type TEXT NOT NULL,
                file_size INTEGER,
                file_path TEXT NOT NULL,
                is_photo INTEGER DEFAULT 0,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
            )`);

            // 9. Tabel Institution Settings
            db.run(`CREATE TABLE IF NOT EXISTS institution_settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                institution_name TEXT NOT NULL,
                logo_path TEXT,
                address TEXT,
                phone TEXT,
                email TEXT,
                head_name TEXT,
                head_title TEXT,
                secretary_name TEXT,
                number_format TEXT DEFAULT 'NOT/{NO}/{BLN}/{THN}',
                header_text TEXT,
                last_backup DATETIME
            )`);

            // 10. Tabel Activity Logs & Revision History
            db.run(`CREATE TABLE IF NOT EXISTS activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                username TEXT,
                action TEXT NOT NULL,
                details TEXT,
                ip_address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS meeting_revisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                meeting_id INTEGER NOT NULL,
                edited_by TEXT NOT NULL,
                revision_note TEXT,
                edited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
            )`);

            // Seed Default Admin User
            const defaultPassword = bcrypt.hashSync('admin123', 10);
            db.run(`INSERT OR IGNORE INTO users (id, username, password_hash, full_name, role) 
                    VALUES (1, 'admin', ?, 'Administrator Sekolah', 'admin')`, [defaultPassword]);
            
            const staffPassword = bcrypt.hashSync('notulis123', 10);
            db.run(`INSERT OR IGNORE INTO users (id, username, password_hash, full_name, role) 
                    VALUES (2, 'notulis', ?, 'Staf Tata Usaha / Notulis', 'notulis')`, [staffPassword]);

            // Seed Default Institution Settings
            db.run(`INSERT OR IGNORE INTO institution_settings 
                    (id, institution_name, address, phone, email, head_name, head_title, secretary_name, number_format, header_text) 
                    VALUES (1, 'PEMERINTAH KABUPATEN / DINAS PENDIDIKAN\nSEKOLAH MENENGAH NEGERI 1 NUSANTARA', 'Jl. Pendidikan No. 123, Kota Nusantara', '(021) 555-1234', 'info@sman1nusantara.sch.id', 'Dr. H. Ahmad Fauzi, M.Pd.', 'Kepala Sekolah', 'Siti Aminah, S.Pd.', 'NOT/{NO}/{BLN}/{THN}', 'TERAKREDITASI A - NPSN: 12345678')`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
}

if (require.main === module) {
    initDatabase().then(() => {
        console.log('Database SQLite berhasil diinisialisasi di:', dbPath);
        process.exit(0);
    }).catch(err => {
        console.error('Gagal inisialisasi database:', err);
        process.exit(1);
    });
}

module.exports = { db, initDatabase };