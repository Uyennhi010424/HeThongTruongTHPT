const mysql = require('mysql2/promise');

async function seed() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'LiChaengisreal1127@',
        database: 'hethongthpt',
        port: 3306
    });

    console.log("Connected to MySQL.");

    // Fetch classes
    const [classes] = await connection.execute('SELECT id, gvcn_id FROM lop');
    
    // Fetch a default teacher just in case
    const [teachers] = await connection.execute('SELECT id FROM giao_vien LIMIT 1');
    const defaultTeacherId = teachers[0].id;

    let totalInserted = 0;

    for (const lop of classes) {
        // Skip some classes randomly (e.g. 20% chance)
        if (Math.random() < 0.2) {
            console.log(`Skipping class ${lop.id}`);
            continue;
        }

        const [students] = await connection.execute('SELECT id FROM hoc_sinh WHERE lop_id = ? AND trang_thai = 1', [lop.id]);
        if (students.length === 0) continue;

        const numRecords = Math.floor(Math.random() * 11) + 10; // 10 to 20
        const teacherId = lop.gvcn_id || defaultTeacherId;

        for (let i = 0; i < numRecords; i++) {
            const randomStudent = students[Math.floor(Math.random() * students.length)].id;
            // Generate a random date in the past 30 days
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));
            const dateStr = date.toISOString().split('T')[0];
            const tietHoc = Math.floor(Math.random() * 5) + 1;
            const isCoPhep = Math.random() < 0.6; // 60% with permission
            const loaiVang = isCoPhep ? 'CO_PHEP' : 'KHONG_PHEP';

            try {
                await connection.execute(`
                    INSERT IGNORE INTO diem_danh 
                    (ngay, lop_hoc_id, hoc_sinh_id, tiet_hoc, loai_vang, co_phep, khong_phep, so_ngay_vang, giao_vien_id, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, NOW())
                `, [dateStr, lop.id, randomStudent, tietHoc, loaiVang, isCoPhep ? 1 : 0, isCoPhep ? 0 : 1, teacherId]);
                totalInserted++;
            } catch (err) {
                // Ignore constraint violations
            }
        }
        console.log(`Inserted ~${numRecords} records for class ${lop.id}`);
    }

    console.log(`Total inserted: ${totalInserted}`);
    await connection.end();
}

seed().catch(console.error);
