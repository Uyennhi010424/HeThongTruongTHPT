package com.hethongtruongthpt.config;

import com.hethongtruongthpt.entity.*;
import com.hethongtruongthpt.enums.RoleEnum;
import com.hethongtruongthpt.repository.*;
import com.hethongtruongthpt.service.PhanCongDayService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
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
    private final TonGiaoRepository tonGiaoRepository;
    private final DiemDanhRepository diemDanhRepository;
    private final HocSinhRepository hocSinhRepository;
    private final PhuHuynhRepository phuHuynhRepository;
    private final PhuHuynhHocSinhRepository phuHuynhHocSinhRepository;
    private final PasswordEncoder passwordEncoder;
    private final ToHopMonRepository toHopMonRepository;
    private final ChiTietToHopRepository chiTietToHopRepository;
    private final ChuNhiemRepository chuNhiemRepository;
    private final PhanCongDayService phanCongDayService;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    // Data for random names
    private final String[] HOS = {"Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"};
    private final String[] DEMS = {"Văn", "Thị", "Thanh", "Minh", "Thu", "Ngọc", "Gia", "Hoàng", "Xuân", "Hải", "Tuấn", "Đức", "Bích", "Quỳnh"};
    private final String[] TENS = {"Anh", "Minh", "Huy", "Nam", "Hà", "Linh", "Khang", "Bảo", "Long", "Trang", "Phương", "Thảo", "Hương", "Tâm", "Đạt", "Phát", "Sơn", "Khoa", "Tùng", "Cường", "Hùng", "Hải", "Tuấn", "Dũng", "Hoa", "Mai", "Lan", "Vy", "Nhung", "Nga", "Hằng", "Yến", "My", "Trâm", "Nhi", "Nhiên", "Thủy", "Tiên"};

    private Set<String> usedHocSinhNames = new HashSet<>();

    public SampleDataSeeder(
            LopHocRepository lopHocRepository,
            MonHocRepository monHocRepository,
            NamHocRepository namHocRepository,
            UserRepository userRepository,
            GiaoVienRepository giaoVienRepository,
            DanTocRepository danTocRepository,
            TonGiaoRepository tonGiaoRepository,
            DiemDanhRepository diemDanhRepository,
            HocSinhRepository hocSinhRepository,
            PhuHuynhRepository phuHuynhRepository,
            PhuHuynhHocSinhRepository phuHuynhHocSinhRepository,
            PasswordEncoder passwordEncoder,
            ToHopMonRepository toHopMonRepository,
            ChiTietToHopRepository chiTietToHopRepository,
            ChuNhiemRepository chuNhiemRepository,
            PhanCongDayService phanCongDayService,
            org.springframework.jdbc.core.JdbcTemplate jdbcTemplate
    ) {
        this.lopHocRepository = lopHocRepository;
        this.monHocRepository = monHocRepository;
        this.namHocRepository = namHocRepository;
        this.userRepository = userRepository;
        this.giaoVienRepository = giaoVienRepository;
        this.danTocRepository = danTocRepository;
        this.tonGiaoRepository = tonGiaoRepository;
        this.diemDanhRepository = diemDanhRepository;
        this.hocSinhRepository = hocSinhRepository;
        this.phuHuynhRepository = phuHuynhRepository;
        this.phuHuynhHocSinhRepository = phuHuynhHocSinhRepository;
        this.passwordEncoder = passwordEncoder;
        this.toHopMonRepository = toHopMonRepository;
        this.chiTietToHopRepository = chiTietToHopRepository;
        this.chuNhiemRepository = chuNhiemRepository;
        this.phanCongDayService = phanCongDayService;
        this.jdbcTemplate = jdbcTemplate;
    }

    private boolean checkDataExists(String tableName) {
        try {
            Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + tableName, Long.class);
            return count != null && count > 0;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    @Transactional
    public void run(String... args) {
        log.info("=== SampleDataSeeder START ===");
        
        seedMonHoc();
        seedToHopMon();
        seedNamHoc();
        seedLopHoc();
        seedGiaoVien();
        seedChuNhiem();
        seedDanToc();
        seedTonGiao();
        seedHocSinhAndPhuHuynh();
        seedDiemDanh();
        seedPhanCongDay();
        
        log.info("=== SampleDataSeeder DONE ===");
    }

    private void seedPhanCongDay() {
        if (checkDataExists("phan_cong_day")) {
            log.info("PhanCongDay already exists, skip");
            return;
        }
        log.info("Bắt đầu tự động phân công giảng dạy...");
        phanCongDayService.autoAssignAllSubjects("2025-2026", 1);
        log.info("Đã hoàn thành phân công giảng dạy HK1 & HK2 2025-2026.");
    }

    private void seedChuNhiem() {
        if (checkDataExists("chu_nhiem")) { log.info("ChuNhiem already exists, skip"); return; }

        List<LopHoc> lops = lopHocRepository.findAll();
        List<GiaoVien> giaoViens = giaoVienRepository.findAll();
        
        if (lops.isEmpty() || giaoViens.isEmpty()) return;

        Collections.shuffle(giaoViens);
        int gvIndex = 0;

        for (LopHoc lop : lops) {
            if (gvIndex >= giaoViens.size()) break;
            GiaoVien gvcn = giaoViens.get(gvIndex++);
            
            lop.setGvcn(gvcn);
            lopHocRepository.save(lop);

            ChuNhiemId cnId = new ChuNhiemId();
            cnId.setLopId(lop.getId());
            cnId.setGiaoVienId(gvcn.getId());
            
            ChuNhiem cn = new ChuNhiem();
            cn.setId(cnId);
            chuNhiemRepository.save(cn);
        }
        log.info("Seeded GVCN cho 15 lớp");
    }

    private String generateRandomName(boolean isUniqueRequired) {
        Random rand = new Random();
        while (true) {
            String ho = HOS[rand.nextInt(HOS.length)];
            String dem = DEMS[rand.nextInt(DEMS.length)];
            String ten = TENS[rand.nextInt(TENS.length)];
            String fullName = ho + " " + dem + " " + ten;
            
            if (isUniqueRequired) {
                if (!usedHocSinhNames.contains(fullName)) {
                    usedHocSinhNames.add(fullName);
                    return fullName;
                }
            } else {
                return fullName;
            }
        }
    }

    private String normalizeAscii(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd').replace('Đ', 'D')
                .replaceAll("[^a-zA-Z0-9]", "")
                .toLowerCase(Locale.ROOT);
    }

    private String buildLocalPart(String fullName) {
        if (fullName == null || fullName.isBlank()) return "user";
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 0) return "user";
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < parts.length - 1; i++) {
            String normalized = normalizeAscii(parts[i]);
            if (!normalized.isEmpty()) builder.append(normalized.charAt(0));
        }
        String lastName = normalizeAscii(parts[parts.length - 1]);
        if (!lastName.isEmpty()) builder.append(lastName);
        return builder.toString();
    }

    private void seedHocSinhAndPhuHuynh() {
        if (checkDataExists("hoc_sinh")) { log.info("HocSinh already exists, skip"); return; }

        List<LopHoc> lops = lopHocRepository.findAll();
        if (lops.isEmpty()) return;

        String studentDefaultPw = passwordEncoder.encode("Abc1234@");
        String parentDefaultPw = passwordEncoder.encode("Abc1234@");
        int totalStudents = 0;

        for (LopHoc lop : lops) {
            for (int i = 1; i <= 35; i++) {
                // 1. Sinh học sinh
                String fullName = generateRandomName(true);
                String maHs = String.format("HS2025%04d", totalStudents + 1);
                String username = buildLocalPart(fullName) + (totalStudents + 1) + "@tdu.edu.vn";

                User uHs = new User();
                uHs.setUsername(username);
                uHs.setEmail(username);
                uHs.setPassword(studentDefaultPw);
                uHs.setRole(RoleEnum.HOC_SINH);
                uHs.setIsActive(true);
                uHs.setMustChangePassword(true);
                uHs = userRepository.save(uHs);

                HocSinh hs = new HocSinh();
                hs.setUser(uHs);
                hs.setMaHocSinh(maHs);
                hs.setHoTen(fullName);
                hs.setEmail(username);
                hs.setLop(lop);
                hs.setGioiTinh(totalStudents % 2 == 0 ? "NAM" : "NU");
                hs.setSdt(String.format("09%08d", new Random().nextInt(90000000) + 10000000));
                
                int namNhapHoc = 2025;
                if (lop.getKhoi() == 11) namNhapHoc = 2024;
                if (lop.getKhoi() == 12) namNhapHoc = 2023;
                hs.setNamNhapHoc(namNhapHoc);
                
                hs.setNgaySinh(LocalDate.of(2010 - (lop.getKhoi() - 10), 1, 1).plusDays(new Random().nextInt(300)));
                hs.setTrangThai(1);
                hs.setDiaChi("Cần Thơ");
                // Gán dân tộc mặc định "Kinh"
                hs.setDanToc("Kinh");
                hs.setTonGiao("Không");

                hs = hocSinhRepository.save(hs);

                // 2. Sinh phụ huynh
                String phName = generateRandomName(false);
                String phUsername = buildLocalPart(phName) + (totalStudents + 1) + "@gmail.com";

                User uPh = new User();
                uPh.setUsername(phUsername);
                uPh.setEmail(phUsername);
                uPh.setPassword(parentDefaultPw);
                uPh.setRole(RoleEnum.PHU_HUYNH);
                uPh.setIsActive(true);
                uPh.setMustChangePassword(true);
                uPh = userRepository.save(uPh);

                PhuHuynh ph = new PhuHuynh();
                ph.setUser(uPh);
                ph.setHoTen(phName);
                ph.setEmail(phUsername);
                ph.setSoDienThoai(String.format("09%08d", new Random().nextInt(90000000) + 10000000));
                ph.setQuanHe(totalStudents % 2 == 0 ? "CHA" : "ME");
                ph.setNgheNghiep("Kinh doanh");
                ph = phuHuynhRepository.save(ph);

                // 3. Liên kết Phụ huynh - Học sinh
                PhuHuynhHocSinh phhs = new PhuHuynhHocSinh();
                phhs.setPhuHuynh(ph);
                phhs.setHocSinh(hs);
                phhs.setQuanHe(ph.getQuanHe());
                phhs.setLaNguoiLienHeChinh(true);
                phuHuynhHocSinhRepository.save(phhs);

                totalStudents++;
            }
            
            lop.setSiSo(35);
            lopHocRepository.save(lop);
        }
        log.info("Seeded {} học sinh và phụ huynh cho {} lớp", totalStudents, lops.size());
    }

    private void seedGiaoVien() {
        if (checkDataExists("giao_vien")) { log.info("GiaoVien already exists, skip"); return; }

        List<MonHoc> monHocs = monHocRepository.findAll();
        if (monHocs.isEmpty()) return;

        int totalTeachers = 0;
        java.util.Set<String> usedTeacherEmails = new java.util.HashSet<>();
        
        for (MonHoc mon : monHocs) {
            if (!mon.getIsActive()) continue;

            for (int i = 1; i <= 10; i++) {
                String fullName = generateRandomName(false);
                String maGv = String.format("GV%04d", totalTeachers + 1);
                
                String baseLocal = buildLocalPart(fullName);
                String username = baseLocal + "c3@tdu.edu.vn";
                int suffix = 2;
                while (usedTeacherEmails.contains(username) || userRepository.findByUsername(username).isPresent()) {
                    username = baseLocal + suffix + "c3@tdu.edu.vn";
                    suffix++;
                }
                usedTeacherEmails.add(username);
                
                String defaultPw = passwordEncoder.encode(username.split("@")[0] + "@123");

                User u = new User();
                u.setUsername(username);
                u.setPassword(defaultPw);
                u.setRole(RoleEnum.GIAO_VIEN);
                u.setIsActive(true);
                u.setMustChangePassword(false);
                u = userRepository.save(u);

                GiaoVien gv = new GiaoVien();
                gv.setUser(u);
                gv.setMaGiaoVien(maGv);
                gv.setHoTen(fullName);
                gv.setBoMon(mon.getTenMon());
                gv.setEmail(username);
                gv.setGioiTinh(totalTeachers % 2 == 0);
                gv.setNgaySinh(LocalDate.of(1985, 1, 1).plusDays(new Random().nextInt(3000)));
                gv.setTrinhDo("Cử nhân Sư phạm");
                gv.setSoDienThoai(String.format("09%08d", new Random().nextInt(90000000) + 10000000));
                gv.setDiaChi("Cần Thơ");
                
                giaoVienRepository.save(gv);
                totalTeachers++;
            }
        }
        log.info("Seeded {} giáo viên cho {} môn học", totalTeachers, monHocs.size());
    }

    // ─── Dân tộc ───
    private void seedDanToc() {
        if (checkDataExists("dan_toc")) { log.info("DanToc already exists, skip"); return; }

        String[][] dantocs = {
            {"Kinh", "Dân tộc Kinh - đa số"},
            {"Tày", "Dân tộc Tày"},
            {"Thái", "Dân tộc Thái"},
            {"Mường", "Dân tộc Mường"},
            {"Khmer", "Dân tộc Khmer - Khơ Me"},
            {"Hoa", "Dân tộc Hoa"}
        };

        for (String[] dt : dantocs) {
            DanToc d = new DanToc();
            d.setTenDanToc(dt[0]);
            d.setMoTa(dt[1]);
            danTocRepository.save(d);
        }
    }

    // ─── Tôn giáo ───
    private void seedTonGiao() {
        if (checkDataExists("ton_giao")) { log.info("TonGiao already exists, skip"); return; }

        String[][] tongiaos = {
            {"Không", "Không theo tôn giáo"},
            {"Phật giáo", "Phật giáo"},
            {"Thiên Chúa giáo", "Thiên Chúa giáo (Công giáo)"},
            {"Tin lành", "Đạo Tin lành"},
            {"Cao Đài", "Đạo Cao Đài"},
            {"Hòa Hảo", "Phật giáo Hòa Hảo"},
            {"Hồi giáo", "Hồi giáo (Islam)"}
        };

        for (String[] tg : tongiaos) {
            TonGiao t = new TonGiao();
            t.setTenTonGiao(tg[0]);
            t.setMoTa(tg[1]);
            tonGiaoRepository.save(t);
        }
    }

    private void seedDiemDanh() {
        // Skip for now to save time
    }

    // ─── Lớp học ───
    private void seedLopHoc() {
        if (checkDataExists("lop")) { log.info("LopHoc already exists, skip"); return; }

        Map<String, ToHopMon> thMap = new HashMap<>();
        for (ToHopMon th : toHopMonRepository.findAll()) {
            thMap.put(th.getMaToHop(), th);
        }

        List<LopHoc> lops = new ArrayList<>();

        String[] toHopK10 = {"TN1", "TN2", "XH1", "XH2", "KH1"};
        String[] toHopK11 = {"TN1", "TN3", "XH1", "XH3", "KH2"};
        String[] toHopK12 = {"TN2", "XH2", "XH3", "KH1", "KH3"};

        for (int khoi = 10; khoi <= 12; khoi++) {
            for (int i = 1; i <= 5; i++) {
                String thCode = "";
                if (khoi == 10) thCode = toHopK10[i - 1];
                else if (khoi == 11) thCode = toHopK11[i - 1];
                else thCode = toHopK12[i - 1];

                ToHopMon th = thMap.get(thCode);

                LopHoc lop = new LopHoc();
                lop.setTenLop(khoi + "A" + i);
                lop.setKhoi(khoi);
                lop.setNamHoc("2025-2026");
                lop.setSiSo(0);
                lop.setToHopId(th != null ? th.getId() : null);
                lops.add(lop);
            }
        }

        lopHocRepository.saveAll(lops);
        log.info("Seeded 15 lớp học với 9 tổ hợp đa dạng");
    }

    private void seedMonHoc() {
        if (checkDataExists("mon_hoc")) return;

        MonHoc toan = createMonHoc("TOAN", "Toán", "DIEM_SO", 4);
        MonHoc van = createMonHoc("VAN", "Ngữ văn", "DIEM_SO", 4);
        MonHoc anh = createMonHoc("ANH", "Tiếng Anh", "DIEM_SO", 4);
        MonHoc lichSu = createMonHoc("SU", "Lịch sử", "DIEM_SO", 3);
        MonHoc gdtc = createMonHoc("GDTC", "Giáo dục thể chất", "NHAN_XET", 0);
        MonHoc qpan = createMonHoc("GDQPAN", "Giáo dục quốc phòng - An ninh", "NHAN_XET", 0);
        MonHoc hdtn = createMonHoc("HDTN-HN", "Hoạt động trải nghiệm, hướng nghiệp", "NHAN_XET", 0);
        MonHoc ndgd = createMonHoc("GDDP", "Nội dung giáo dục địa phương", "NHAN_XET", 0);
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
    }

    private void seedToHopMon() {
        if (checkDataExists("to_hop_mon")) return;

        Map<String, MonHoc> monMap = new HashMap<>();
        for (MonHoc m : monHocRepository.findAll()) {
            monMap.put(m.getMaMon(), m);
        }

        String[][] toHopData = {
            {"TN1", "Tự nhiên 1", "Tự nhiên", "LY", "HOA", "SINH", "TINHOC"},
            {"TN2", "Tự nhiên 2", "Tự nhiên", "LY", "HOA", "SINH", "CN-CN"},
            {"TN3", "Tự nhiên 3", "Tự nhiên", "LY", "SINH", "TINHOC", "CN-CN"},
            {"XH1", "Xã hội 1", "Xã hội", "DIA", "GDKTPL", "TINHOC", "MT"},
            {"XH2", "Xã hội 2", "Xã hội", "DIA", "GDKTPL", "CN-CN", "AMNHAC"},
            {"XH3", "Xã hội 3", "Xã hội", "DIA", "GDKTPL", "TINHOC", "AMNHAC"},
            {"KH1", "Kết hợp 1", "Kết hợp", "LY", "SINH", "DIA", "CN-CN"},
            {"KH2", "Kết hợp 2", "Kết hợp", "LY", "HOA", "GDKTPL", "CN-CN"},
            {"KH3", "Kết hợp 3", "Kết hợp", "HOA", "SINH", "GDKTPL", "CN-CN"}
        };

        for (String[] data : toHopData) {
            ToHopMon th = new ToHopMon();
            th.setMaToHop(data[0]);
            th.setTenToHop(data[1]);
            th.setBan(data[2]);
            th.setIsActive(true);
            th = toHopMonRepository.save(th);

            for (int i = 3; i < data.length; i++) {
                MonHoc mh = monMap.get(data[i]);
                if (mh != null) {
                    ChiTietToHop ct = new ChiTietToHop();
                    ct.setToHopMon(th);
                    ct.setMonHoc(mh);
                    chiTietToHopRepository.save(ct);
                }
            }
        }
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

    private void seedNamHoc() {
        if (checkDataExists("nam_hoc")) return;

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
}
