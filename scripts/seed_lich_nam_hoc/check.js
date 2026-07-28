const mysql = require('mysql2/promise');

async function check() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'LiChaengisreal1127@',
        database: 'hethongthpt',
        port: 3306
    });

    // Check lich_nam_hoc
    const [lnhRows] = await connection.execute(`
        SELECT MIN(ngay) as tu_ngay, MAX(ngay) as den_ngay, 
               COUNT(*) as tong_ngay,
               SUM(CASE WHEN ngay_hoc=1 THEN 1 ELSE 0 END) as ngay_hoc
        FROM lich_nam_hoc
    `);
    console.log("=== LICH NAM HOC ===");
    console.table(lnhRows);

    // Check nam_hoc 2025-2026
    const [nhRows] = await connection.execute(`
        SELECT ten_nam_hoc, ngay_bat_dau_hk1, ngay_ket_thuc_hk2 
        FROM nam_hoc WHERE ten_nam_hoc='2025-2026'
    `);
    console.log("=== NAM HOC 2025-2026 ===");
    console.table(nhRows);

    // How many study days in the actual school year range?
    if (nhRows.length > 0) {
        const from = nhRows[0].ngay_bat_dau_hk1;
        const to = nhRows[0].ngay_ket_thuc_hk2;
        const [countRows] = await connection.execute(`
            SELECT COUNT(*) as so_ngay_hoc FROM lich_nam_hoc 
            WHERE ngay BETWEEN ? AND ? AND ngay_hoc = 1
        `, [from, to]);
        console.log(`=== SO NGAY HOC trong nam hoc (${from} → ${to}) ===`);
        console.table(countRows);

        const soNgayHoc = countRows[0].so_ngay_hoc;
        const siSo10A1 = 30;
        const tongVang10A1 = 50;
        const tyLe = (tongVang10A1 / (siSo10A1 * soNgayHoc) * 100).toFixed(2);
        console.log(`\n=== KIEM TRA 10A1 ===`);
        console.log(`Cong thuc: ${tongVang10A1} / (${siSo10A1} x ${soNgayHoc}) x 100 = ${tyLe}%`);
    }

    // Check class 10A1 absence count
    const [lopRows] = await connection.execute(`
        SELECT l.ten_lop, l.si_so, 
               COUNT(CASE WHEN d.loai_vang='CO_PHEP' THEN 1 END) as co_phep,
               COUNT(CASE WHEN d.loai_vang='KHONG_PHEP' THEN 1 END) as khong_phep,
               COUNT(CASE WHEN d.loai_vang IN ('CO_PHEP','KHONG_PHEP') THEN 1 END) as tong_vang
        FROM lop l
        LEFT JOIN diem_danh d ON d.lop_hoc_id = l.id
        WHERE l.ten_lop = '10A1'
        GROUP BY l.id, l.ten_lop, l.si_so
    `);
    console.log("=== DIEM DANH 10A1 ===");
    console.table(lopRows);

    await connection.end();
}

check().catch(console.error);
