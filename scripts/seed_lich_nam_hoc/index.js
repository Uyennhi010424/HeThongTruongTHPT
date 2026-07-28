const mysql = require('mysql2/promise');

// =====================================================================
// Lich nam hoc THPT Viet Nam 2025-2026
// Nam hoc: 05/09/2025 - 31/05/2026
// Ngay hoc thuc te muc tieu: ~180-190 ngay
// =====================================================================

// Tap hop cac ngay KHONG hoc (Holiday, Tet, Exam, Other_Off)
const OFF_DAYS = new Set([
    // --- TRUOC NAM HOC (thang 8 va truoc 5/9) ---
    // Ngay 2/9: Quoc khanh (nghi but truong chua bat dau)
    '2025-09-02',

    // --- HOC KY 1: 05/09/2025 - 30/01/2026 ---
    // Nghi le: Tet Duong lich 1/1/2026
    '2026-01-01',
    // Nghi Tet Am Lich 2026 (Tet Binh Ngo, ngay 1 thang 1 Am Lich = 29/01/2026)
    // Thong thuong nghi 7 ngay: 26/01 - 01/02/2026
    '2026-01-26', '2026-01-27', '2026-01-28', '2026-01-29',
    '2026-01-30', '2026-01-31', '2026-02-01',
    // Thi hoc ky 1 (tham khao: khoang 23/12/2025 - 29/12/2025, ~5 ngay)
    '2025-12-22', '2025-12-23', '2025-12-24', '2025-12-25', '2025-12-26',
    // Nghi tat nien / giua ky (khoang 27/12 - 04/01)
    '2025-12-27', '2025-12-28', '2025-12-29', '2025-12-30', '2025-12-31',
    '2026-01-02', '2026-01-03', '2026-01-04',

    // --- HOC KY 2: 05/02/2026 - 31/05/2026 ---
    // Gio To Hung Vuong (mung 10 thang 3 Am Lich 2026 = 28/04/2026)
    '2026-04-28',
    // 30/4 Giai phong mien Nam
    '2026-04-30',
    // 1/5 Quoc te Lao dong
    '2026-05-01',
    // Thi hoc ky 2 (khoang 18/05 - 23/05/2026, ~5 ngay)
    '2026-05-18', '2026-05-19', '2026-05-20', '2026-05-21', '2026-05-22',
]);

// Loai ngay tuong ung
const OFF_TYPES = {
    '2025-09-02': { loai: 'HOLIDAY', mo_ta: 'Quoc khanh 2/9' },
    '2026-01-01': { loai: 'HOLIDAY', mo_ta: 'Tet Duong lich' },
    '2026-01-26': { loai: 'TET', mo_ta: 'Nghi Tet Binh Ngo 2026' },
    '2026-01-27': { loai: 'TET', mo_ta: 'Nghi Tet Binh Ngo 2026' },
    '2026-01-28': { loai: 'TET', mo_ta: 'Giao thua Tet Binh Ngo' },
    '2026-01-29': { loai: 'TET', mo_ta: 'Mung 1 Tet Binh Ngo' },
    '2026-01-30': { loai: 'TET', mo_ta: 'Mung 2 Tet Binh Ngo' },
    '2026-01-31': { loai: 'TET', mo_ta: 'Mung 3 Tet Binh Ngo' },
    '2026-02-01': { loai: 'TET', mo_ta: 'Mung 4 Tet Binh Ngo' },
    '2025-12-22': { loai: 'EXAM', mo_ta: 'Thi hoc ky 1' },
    '2025-12-23': { loai: 'EXAM', mo_ta: 'Thi hoc ky 1' },
    '2025-12-24': { loai: 'EXAM', mo_ta: 'Thi hoc ky 1' },
    '2025-12-25': { loai: 'EXAM', mo_ta: 'Thi hoc ky 1' },
    '2025-12-26': { loai: 'EXAM', mo_ta: 'Thi hoc ky 1' },
    '2025-12-27': { loai: 'OTHER_OFF', mo_ta: 'Nghi dong HK1' },
    '2025-12-28': { loai: 'OTHER_OFF', mo_ta: 'Nghi dong HK1' },
    '2025-12-29': { loai: 'OTHER_OFF', mo_ta: 'Nghi dong HK1' },
    '2025-12-30': { loai: 'OTHER_OFF', mo_ta: 'Nghi dong HK1' },
    '2025-12-31': { loai: 'OTHER_OFF', mo_ta: 'Nghi dong HK1' },
    '2026-01-02': { loai: 'OTHER_OFF', mo_ta: 'Nghi dong HK1' },
    '2026-01-03': { loai: 'OTHER_OFF', mo_ta: 'Nghi dong HK1' },
    '2026-01-04': { loai: 'OTHER_OFF', mo_ta: 'Nghi dong HK1' },
    '2026-04-28': { loai: 'HOLIDAY', mo_ta: 'Gio To Hung Vuong' },
    '2026-04-30': { loai: 'HOLIDAY', mo_ta: 'Giai phong mien Nam 30/4' },
    '2026-05-01': { loai: 'HOLIDAY', mo_ta: 'Quoc te Lao dong 1/5' },
    '2026-05-18': { loai: 'EXAM', mo_ta: 'Thi hoc ky 2' },
    '2026-05-19': { loai: 'EXAM', mo_ta: 'Thi hoc ky 2' },
    '2026-05-20': { loai: 'EXAM', mo_ta: 'Thi hoc ky 2' },
    '2026-05-21': { loai: 'EXAM', mo_ta: 'Thi hoc ky 2' },
    '2026-05-22': { loai: 'EXAM', mo_ta: 'Thi hoc ky 2' },
};

async function seed() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'LiChaengisreal1127@',
        database: 'hethongthpt',
        port: 3306
    });

    console.log("Connected to MySQL.");

    // Xoa du lieu cu, insert lai tu dau
    await connection.execute('DELETE FROM lich_nam_hoc');
    console.log("Cleared old lich_nam_hoc data.");

    // Pham vi insert: truoc va sau nam hoc de du lieu day du
    const startDate = new Date('2025-08-01');
    const endDate   = new Date('2026-06-30');

    let currentDate = new Date(startDate);
    let studyCount = 0;
    let totalInserted = 0;

    while (currentDate <= endDate) {
        // Dung UTC de tranh lech gio
        const y = currentDate.getUTCFullYear();
        const m = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
        const d = String(currentDate.getUTCDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        const dayOfWeek = currentDate.getUTCDay(); // 0 = Sunday

        let loaiNgay, moTa, ngayHoc;

        if (dayOfWeek === 0) {
            loaiNgay = 'SUNDAY';
            moTa = 'Chu nhat';
            ngayHoc = false;
        } else if (OFF_DAYS.has(dateStr)) {
            const info = OFF_TYPES[dateStr] || { loai: 'OTHER_OFF', mo_ta: 'Nghi' };
            loaiNgay = info.loai;
            moTa = info.mo_ta;
            ngayHoc = false;
        } else {
            loaiNgay = 'STUDY';
            moTa = '';
            ngayHoc = true;
        }

        await connection.execute(
            'INSERT INTO lich_nam_hoc (ngay, loai_ngay, mo_ta, ngay_hoc) VALUES (?, ?, ?, ?)',
            [dateStr, loaiNgay, moTa, ngayHoc ? 1 : 0]
        );

        totalInserted++;
        if (ngayHoc) studyCount++;

        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // Dem rieng ngay hoc trong pham vi nam hoc 05/09/2025 - 31/05/2026
    const [rows] = await connection.execute(`
        SELECT COUNT(*) as ngay_hoc_nam_hoc
        FROM lich_nam_hoc
        WHERE ngay BETWEEN '2025-09-05' AND '2026-05-31'
          AND ngay_hoc = 1
    `);
    console.log(`\nTong ngay insert: ${totalInserted}`);
    console.log(`Tong ngay STUDY (ca pham vi): ${studyCount}`);
    console.log(`Ngay HOC thuc te trong nam hoc (05/09/2025 - 31/05/2026): ${rows[0].ngay_hoc_nam_hoc}`);

    await connection.end();
}

seed().catch(console.error);
