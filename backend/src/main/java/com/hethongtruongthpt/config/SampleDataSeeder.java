package com.hethongtruongthpt.config;

import com.hethongtruongthpt.entity.*;
import com.hethongtruongthpt.enums.RoleEnum;
import com.hethongtruongthpt.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Component
@Order(2)
public class SampleDataSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(SampleDataSeeder.class);
    private final LopHocRepository lopHocRepository;
    private final MonHocRepository monHocRepository;
    private final NamHocRepository namHocRepository;
    private final UserRepository userRepository;
    private final GiaoVienRepository giaoVienRepository;
    private final DanTocRepository danTocRepository;
    private final DiemDanhRepository diemDanhRepository;
    private final HocSinhRepository hocSinhRepository;
    private final PasswordEncoder passwordEncoder;
    private final ToHopMonRepository toHopMonRepository;
    private final ChiTietToHopRepository chiTietToHopRepository;

    public SampleDataSeeder(
            LopHocRepository lopHocRepository,
            MonHocRepository monHocRepository,
            NamHocRepository namHocRepository,
            UserRepository userRepository,
            GiaoVienRepository giaoVienRepository,
            DanTocRepository danTocRepository,
            DiemDanhRepository diemDanhRepository,
            HocSinhRepository hocSinhRepository,
            PasswordEncoder passwordEncoder,
            ToHopMonRepository toHopMonRepository,
            ChiTietToHopRepository chiTietToHopRepository
    ) {
        this.lopHocRepository = lopHocRepository;
        this.monHocRepository = monHocRepository;
        this.namHocRepository = namHocRepository;
        this.userRepository = userRepository;
        this.giaoVienRepository = giaoVienRepository;
        this.danTocRepository = danTocRepository;
        this.diemDanhRepository = diemDanhRepository;
        this.hocSinhRepository = hocSinhRepository;
        this.passwordEncoder = passwordEncoder;
        this.toHopMonRepository = toHopMonRepository;
        this.chiTietToHopRepository = chiTietToHopRepository;
    }

    @Override
    public void run(String... args) {
        log.info("=== SampleDataSeeder START ===");
        
        // Removed unconditional admin password reset to allow users to keep their changed passwords.

        seedMonHoc();
        seedToHopMon();
        seedLopHoc();
        seedNamHoc();
        seedGiaoVien();
        seedDanToc();
        seedDiemDanh();
        log.info("=== SampleDataSeeder DONE ===");
    }

    // ─── Dân tộc ───
    private void seedDanToc() {
        if (danTocRepository.count() > 0) { log.info("DanToc already exists, skip"); return; }

        String[][] dantocs = {
            {"Kinh", "Dân tộc Kinh - đa số"},
            {"Tày", "Dân tộc Tày"},
            {"Thái", "Dân tộc Thái"},
            {"Mường", "Dân tộc Mường"},
            {"Khmer", "Dân tộc Khmer - Khơ Me"},
            {"Hoa", "Dân tộc Hoa"},
            {"Nùng", "Dân tộc Nùng"},
            {"Hmông", "Dân tộc Hmông - Mông"},
            {"Dao", "Dân tộc Dao"},
            {"Gia Rai", "Dân tộc Gia Rai"},
            {"Ê Đê", "Dân tộc Ê Đê"},
            {"Ba Na", "Dân tộc Ba Na"},
            {"Xơ Đăng", "Dân tộc Xơ Đăng"},
            {"Sán Chay", "Dân tộc Sán Chay"},
            {"Cơ Ho", "Dân tộc Cơ Ho"},
            {"Chăm", "Dân tộc Chăm"},
            {"Sán Dìu", "Dân tộc Sán Dìu"},
            {"Hrê", "Dân tộc Hrê"},
            {"Mnông", "Dân tộc Mnông"},
            {"Raglai", "Dân tộc Raglai"},
        };

        for (String[] dt : dantocs) {
            DanToc d = new DanToc();
            d.setTenDanToc(dt[0]);
            d.setMoTa(dt[1]);
            danTocRepository.save(d);
        }
        log.info("Seeded {} dân tộc", dantocs.length);
    }

    // ─── Điểm danh mẫu ───
    private void seedDiemDanh() {
        if (diemDanhRepository.count() > 0) { log.info("DiemDanh already exists, skip"); return; }

        // Lấy lớp đầu tiên có học sinh
        List<LopHoc> lops = lopHocRepository.findAll();
        LopHoc targetLop = null;
        for (LopHoc lop : lops) {
            if (!hocSinhRepository.findByLopId(lop.getId()).isEmpty()) {
                targetLop = lop;
                break;
            }
        }
        if (targetLop == null) { log.info("No class with students, skip DiemDanh seed"); return; }

        List<HocSinh> students = hocSinhRepository.findByLopId(targetLop.getId());
        List<GiaoVien> teachers = giaoVienRepository.findAll();
        if (students.isEmpty() || teachers.isEmpty()) { log.info("No students or teachers, skip DiemDanh seed"); return; }

        GiaoVien giaoVien = teachers.get(0);

        // Tạo điểm danh cho 5 ngày gần đây (T2-T7), mỗi ngày 2 tiết
        LocalDate today = LocalDate.now();
        int created = 0;

        for (int dayOffset = 1; dayOffset <= 10; dayOffset++) {
            LocalDate ngay = today.minusDays(dayOffset);
            // Bỏ chủ nhật
            if (ngay.getDayOfWeek().getValue() == 7) continue;

            for (int tiet = 1; tiet <= 2; tiet++) {
                for (HocSinh hs : students) {
                    // Kiểm tra đã có chưa (tránh trùng unique constraint)
                    if (diemDanhRepository.findByNgayAndLopHocIdAndTietHoc(ngay, targetLop.getId(), tiet)
                            .stream().anyMatch(d -> d.getHocSinh().getId().equals(hs.getId()))) {
                        continue;
                    }

                    DiemDanh dd = new DiemDanh();
                    dd.setNgay(ngay);
                    dd.setLopHoc(targetLop);
                    dd.setHocSinh(hs);
                    dd.setTietHoc(tiet);
                    dd.setGiaoVien(giaoVien);

                    // ~90% có mặt, ~5% có phép, ~5% không phép
                    int rand = ThreadLocalRandom.current().nextInt(100);
                    if (rand < 90) {
                        dd.setLoaiVang("CO_MAT");
                    } else if (rand < 95) {
                        dd.setLoaiVang("CO_PHEP");
                        dd.setSoNgayVang(1);
                        dd.setGhiChu("Có đơn xin phép");
                    } else {
                        dd.setLoaiVang("KHONG_PHEP");
                        dd.setSoNgayVang(1);
                        dd.setGhiChu("Không phép");
                    }

                    diemDanhRepository.save(dd);
                    created++;
                }
            }
        }
        log.info("Seeded {} điểm danh mẫu cho lớp {}", created, targetLop.getTenLop());
    }

    // ─── Lớp học ───
    @SuppressWarnings("null")
    private void seedLopHoc() {
        if (lopHocRepository.count() > 0) { log.info("LopHoc already exists, skip"); return; }

        // Lấy tổ hợp TN1 để gán cho lớp mẫu
        ToHopMon toHopTN1 = toHopMonRepository.findByMaToHop("TN1").orElse(null);
        Integer toHopTN1Id = toHopTN1 != null ? toHopTN1.getId() : null;

        LopHoc lop10A1 = new LopHoc();
        lop10A1.setTenLop("10A1");
        lop10A1.setKhoi(10);
        lop10A1.setNamHoc("2025-2026");
        lop10A1.setSiSo(35);
        lop10A1.setToHopId(toHopTN1Id);

        LopHoc lop10A2 = new LopHoc();
        lop10A2.setTenLop("10A2");
        lop10A2.setKhoi(10);
        lop10A2.setNamHoc("2025-2026");
        lop10A2.setSiSo(36);
        lop10A2.setToHopId(toHopTN1Id);

        LopHoc lop11B1 = new LopHoc();
        lop11B1.setTenLop("11B1");
        lop11B1.setKhoi(11);
        lop11B1.setNamHoc("2025-2026");
        lop11B1.setSiSo(32);
        lop11B1.setToHopId(toHopTN1Id);

        LopHoc lop12C1 = new LopHoc();
        lop12C1.setTenLop("12C1");
        lop12C1.setKhoi(12);
        lop12C1.setNamHoc("2025-2026");
        lop12C1.setSiSo(30);
        lop12C1.setToHopId(toHopTN1Id);

        lopHocRepository.saveAll(List.of(lop10A1, lop10A2, lop11B1, lop12C1));
    }

    // ─── Môn học (đầy đủ theo CT GDPT 2018) ───
    @SuppressWarnings("null")
    private void seedMonHoc() {
        if (monHocRepository.count() > 0) return;

        // 8 môn bắt buộc
        MonHoc toan = createMonHoc("TOAN", "Toán", "DIEM_SO", 4);
        MonHoc van = createMonHoc("VAN", "Ngữ văn", "DIEM_SO", 4);
        MonHoc anh = createMonHoc("ANH", "Tiếng Anh", "DIEM_SO", 4);
        MonHoc lichSu = createMonHoc("SU", "Lịch sử", "DIEM_SO", 3);
        MonHoc gdtc = createMonHoc("GDTC", "Giáo dục thể chất", "NHAN_XET", 0);
        MonHoc qpan = createMonHoc("GDQPAN", "Giáo dục quốc phòng - An ninh", "NHAN_XET", 0);
        MonHoc hdtn = createMonHoc("HDTN-HN", "Hoạt động trải nghiệm, hướng nghiệp", "NHAN_XET", 0);
        MonHoc ndgd = createMonHoc("GDDP", "Nội dung giáo dục địa phương", "NHAN_XET", 0);

        // 9 môn tự chọn
        MonHoc diaLi = createMonHoc("DIA", "Địa lý", "DIEM_SO", 3);
        MonHoc ktpl = createMonHoc("GDKTPL", "GD Kinh tế & Pháp luật", "DIEM_SO", 3);
        MonHoc vatLi = createMonHoc("LY", "Vật lý", "DIEM_SO", 3);
        MonHoc hoaHoc = createMonHoc("HOA", "Hóa học", "DIEM_SO", 3);
        MonHoc sinhHoc = createMonHoc("SINH", "Sinh học", "DIEM_SO", 3);
        MonHoc congNghe = createMonHoc("CN-CN", "Công nghệ", "DIEM_SO", 3);
        MonHoc tinHoc = createMonHoc("TINHOC", "Tin học", "DIEM_SO", 3);
        MonHoc amNhac = createMonHoc("AMNHAC", "Âm nhạc", "NHAN_XET", 0);
        MonHoc myThuat = createMonHoc("MT", "Mỹ thuật", "NHAN_XET", 0);

        monHocRepository.saveAll(List.of(toan, van, anh, lichSu, gdtc, qpan, hdtn, ndgd,
                diaLi, ktpl, vatLi, hoaHoc, sinhHoc, congNghe, tinHoc, amNhac, myThuat));
        log.info("Seeded 17 môn học theo CT GDPT 2018");
    }

    // ─── Tổ hợp môn tự chọn (9 tổ hợp TN1-KH2) ───
    private void seedToHopMon() {
        if (toHopMonRepository.count() > 0) return;

        Map<String, MonHoc> monMap = new HashMap<>();
        for (MonHoc m : monHocRepository.findAll()) {
            monMap.put(m.getMaMon(), m);
        }

        // 9 tổ hợp theo CT GDPT 2018
        // Mã môn phải khớp với DB: TINHOC, CN-CN, GDKTPL, AMNHAC
        String[][] toHopData = {
            // Nhóm Tự nhiên (định hướng khối A, B)
            {"TN1", "Tự nhiên 1", "Tự nhiên", "LY", "HOA", "SINH", "TINHOC"},
            {"TN2", "Tự nhiên 2", "Tự nhiên", "LY", "HOA", "SINH", "CN-CN"},
            {"TN3", "Tự nhiên 3", "Tự nhiên", "LY", "HOA", "TINHOC", "CN-CN"},
            {"TN4", "Tự nhiên 4", "Tự nhiên", "LY", "SINH", "TINHOC", "DIA"},
            // Nhóm Xã hội (định hướng khối C, D)
            {"XH1", "Xã hội 1", "Xã hội", "DIA", "GDKTPL", "AMNHAC", "TINHOC"},
            {"XH2", "Xã hội 2", "Xã hội", "DIA", "GDKTPL", "AMNHAC", "MT"},
            {"XH3", "Xã hội 3", "Xã hội", "DIA", "GDKTPL", "TINHOC", "CN-CN"},
            // Nhóm Kết hợp (định hướng khối D, thi năng khiếu)
            {"KH1", "Kết hợp 1", "Kết hợp", "LY", "HOA", "DIA", "GDKTPL"},
            {"KH2", "Kết hợp 2", "Kết hợp", "LY", "TINHOC", "DIA", "GDKTPL"}
        };

        for (String[] data : toHopData) {
            ToHopMon th = new ToHopMon();
            th.setMaToHop(data[0]);
            th.setTenToHop(data[1]);
            th.setBan(data[2]);
            th.setIsActive(true);
            th = toHopMonRepository.save(th);

            // Thêm chi tiết tổ hợp (4 môn tự chọn)
            for (int i = 3; i < data.length; i++) {
                MonHoc mh = monMap.get(data[i]);
                if (mh != null) {
                    ChiTietToHop ct = new ChiTietToHop();
                    ct.setToHopMon(th);
                    ct.setMonHoc(mh);
                    chiTietToHopRepository.save(ct);
                }
            }
            log.info("Seeded tổ hợp: {} - {} ({})", data[0], data[1], data[2]);
        }
    }

    /**
     * Tạo username từ họ tên giáo viên.
     * "Nguyễn Văn Toán" → "nvtoan"
     * "Vũ Đức Minh" → "vdminh"
     * "Lê Hoàng Anh" → "lhanh"
     */
    private String buildTeacherUsername(String hoTen) {
        if (hoTen == null || hoTen.isBlank()) return "giaovien";
        String[] parts = hoTen.trim().split("\\s+");
        if (parts.length == 0) return "giaovien";

        StringBuilder sb = new StringBuilder();
        // Lấy chữ cái đầu của các từ trừ từ cuối
        for (int i = 0; i < parts.length - 1; i++) {
            String part = parts[i];
            if (!part.isEmpty()) {
                sb.append(normalizeAscii(String.valueOf(part.charAt(0))));
            }
        }
        // Thêm từ cuối đầy đủ
        String lastWord = parts[parts.length - 1];
        sb.append(normalizeAscii(lastWord));

        String result = sb.toString().toLowerCase();
        return result.isEmpty() ? "giaovien" : result;
    }

    private String normalizeAscii(String value) {
        return java.text.Normalizer.normalize(value, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd').replace('Đ', 'D')
                .replaceAll("[^a-zA-Z]", "")
                .toLowerCase();
    }

    private MonHoc createMonHoc(String ma, String ten, String nhom, int soDtx) {
        MonHoc m = new MonHoc();
        m.setMaMon(ma);
        m.setTenMon(ten);
        m.setNhomDanhGia(nhom);
        m.setSoDtxHocKy(soDtx);
        m.setKhoiApDung("10,11,12");
        m.setIsActive(true);
        return m;
    }

    // ─── Năm học ───
    @SuppressWarnings("null")
    private void seedNamHoc() {
        if (namHocRepository.count() > 0) return;

        NamHoc nam202526 = new NamHoc();
        nam202526.setTenNamHoc("2025-2026");
        nam202526.setNgayBatDauHk1(LocalDate.of(2025, 9, 1));
        nam202526.setNgayKetThucHk1(LocalDate.of(2025, 12, 30));
        nam202526.setNgayBatDauHk2(LocalDate.of(2026, 1, 5));
        nam202526.setNgayKetThucHk2(LocalDate.of(2026, 5, 31));
        nam202526.setDeadlineNhapDiemHk1(LocalDate.of(2026, 1, 10));
        nam202526.setDeadlineNhapDiemHk2(LocalDate.of(2026, 6, 15));
        nam202526.setTrangThai("DANG_MO");

        namHocRepository.save(nam202526);
    }

    // ─── Giáo viên ───
    @SuppressWarnings("null")
    private void seedGiaoVien() {
        // Nếu đã có giáo viên thì bỏ qua — KHÔNG XÓA dữ liệu hiện có
        if (giaoVienRepository.count() > 0) {
            log.info("Giáo viên đã tồn tại ({}), bỏ qua seeding", giaoVienRepository.count());
            return;
        }

        String[][] teacherData = {
            {"GV0001", "Nguyễn Văn Minh", "Toán", "toan@edu.vn"},
            {"GV0002", "Trần Thị Saori", "Ngữ văn", "van@edu.vn"},
            {"GV0003", "Lê Thị Hồng", "Tiếng Anh", "anh@edu.vn"},
            {"GV0004", "Phạm Văn Thái", "Vật lí", "ly@edu.vn"},
            {"GV0005", "Hoàng Anh Dương", "Hóa học", "hoa@edu.vn"},
            {"GV0006", "Vũ Ngọc Tuyến", "Sinh học", "sinh@edu.vn"},
            {"GV0007", "Đỗ Thị Ngọc Tuyến", "Lịch sử", "su@edu.vn"},
            {"GV0008", "Nguyễn Thị Hiền", "Địa lí", "dia@edu.vn"}
        };

        for (String[] td : teacherData) {
            // Username: viết tắt họ + tên đầy đủ (vd: "Nguyễn Minh Tuấn" → "nmtuanc3@edu.vn")
            String hoTen = td[1];
            String username = buildTeacherUsername(hoTen) + "c3@edu.vn";
            // Password: {localPart}@123 (vd: nmtuanc3@123)
            String localPart = username.split("@")[0];
            String defaultPw = passwordEncoder.encode(localPart + "@123");

            User user = userRepository.findByUsername(username).orElseGet(() -> {
                User u = new User();
                u.setUsername(username);
                u.setPassword(defaultPw);
                u.setRole(RoleEnum.GIAO_VIEN);
                u.setIsActive(true);
                u.setMustChangePassword(false);
                return userRepository.save(u);
            });

            GiaoVien gv = new GiaoVien();
            gv.setUser(user);
            gv.setMaGiaoVien(td[0]);
            gv.setHoTen(td[1]);
            gv.setBoMon(td[2]);
            gv.setEmail(td[3]);
            gv.setGioiTinh(true);
            gv.setNgaySinh(LocalDate.of(1985, 1, 1));
            gv.setTrinhDo("Thạc sĩ");
            giaoVienRepository.save(gv);
        }
    }
}
