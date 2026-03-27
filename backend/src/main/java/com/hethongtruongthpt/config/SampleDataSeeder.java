package com.hethongtruongthpt.config;

import com.hethongtruongthpt.entity.GiaoVien;
import com.hethongtruongthpt.entity.HanhKiem;
import com.hethongtruongthpt.entity.HocKy;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.LichThi;
import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.entity.Diem;
import com.hethongtruongthpt.entity.MonHoc;
import com.hethongtruongthpt.entity.NamHoc;
import com.hethongtruongthpt.entity.PhanQuyen;
import com.hethongtruongthpt.entity.PhanQuyenId;
import com.hethongtruongthpt.entity.Roles;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.entity.ThongBao;
import com.hethongtruongthpt.entity.ThoiKhoaBieu;
import com.hethongtruongthpt.entity.DanToc;
import com.hethongtruongthpt.entity.PhuHuynh;
import com.hethongtruongthpt.entity.HocBa;
import com.hethongtruongthpt.enums.HanhKiemEnum;
import com.hethongtruongthpt.enums.LoaiDiemEnum;
import com.hethongtruongthpt.enums.ThongBaoDoiTuongEnum;
import com.hethongtruongthpt.repository.GiaoVienRepository;
import com.hethongtruongthpt.repository.HanhKiemRepository;
import com.hethongtruongthpt.repository.HocKyRepository;
import com.hethongtruongthpt.repository.HocSinhRepository;
import com.hethongtruongthpt.repository.LichThiRepository;
import com.hethongtruongthpt.repository.LopHocRepository;
import com.hethongtruongthpt.repository.DiemRepository;
import com.hethongtruongthpt.repository.MonHocRepository;
import com.hethongtruongthpt.repository.NamHocRepository;
import com.hethongtruongthpt.repository.PhanQuyenRepository;
import com.hethongtruongthpt.repository.RolesRepository;
import com.hethongtruongthpt.repository.ThoiKhoaBieuRepository;
import com.hethongtruongthpt.repository.ThongBaoRepository;
import com.hethongtruongthpt.repository.UserRepository;
import com.hethongtruongthpt.repository.DanTocRepository;
import com.hethongtruongthpt.repository.PhuHuynhRepository;
import com.hethongtruongthpt.repository.HocBaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Component
@Order(2)
public class SampleDataSeeder implements CommandLineRunner {
    private final LopHocRepository lopHocRepository;
    private final MonHocRepository monHocRepository;
    private final NamHocRepository namHocRepository;
    private final HocKyRepository hocKyRepository;
    private final GiaoVienRepository giaoVienRepository;
    private final HocSinhRepository hocSinhRepository;
    private final DiemRepository diemRepository;
    private final HanhKiemRepository hanhKiemRepository;
    private final ThongBaoRepository thongBaoRepository;
    private final ThoiKhoaBieuRepository thoiKhoaBieuRepository;
    private final LichThiRepository lichThiRepository;
    private final DanTocRepository danTocRepository;
    private final PhuHuynhRepository phuHuynhRepository;
    private final HocBaRepository hocBaRepository;
    private final UserRepository userRepository;
    private final RolesRepository rolesRepository;
    private final PhanQuyenRepository phanQuyenRepository;
    private final PasswordEncoder passwordEncoder;

    public SampleDataSeeder(
            LopHocRepository lopHocRepository,
            MonHocRepository monHocRepository,
            NamHocRepository namHocRepository,
            HocKyRepository hocKyRepository,
            GiaoVienRepository giaoVienRepository,
            HocSinhRepository hocSinhRepository,
            DiemRepository diemRepository,
            HanhKiemRepository hanhKiemRepository,
            ThongBaoRepository thongBaoRepository,
            ThoiKhoaBieuRepository thoiKhoaBieuRepository,
            LichThiRepository lichThiRepository,
                DanTocRepository danTocRepository,
                PhuHuynhRepository phuHuynhRepository,
                HocBaRepository hocBaRepository,
            UserRepository userRepository,
            RolesRepository rolesRepository,
            PhanQuyenRepository phanQuyenRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.lopHocRepository = lopHocRepository;
        this.monHocRepository = monHocRepository;
        this.namHocRepository = namHocRepository;
        this.hocKyRepository = hocKyRepository;
        this.giaoVienRepository = giaoVienRepository;
        this.hocSinhRepository = hocSinhRepository;
        this.diemRepository = diemRepository;
        this.hanhKiemRepository = hanhKiemRepository;
        this.thongBaoRepository = thongBaoRepository;
        this.thoiKhoaBieuRepository = thoiKhoaBieuRepository;
        this.lichThiRepository = lichThiRepository;
        this.danTocRepository = danTocRepository;
        this.phuHuynhRepository = phuHuynhRepository;
        this.hocBaRepository = hocBaRepository;
        this.userRepository = userRepository;
        this.rolesRepository = rolesRepository;
        this.phanQuyenRepository = phanQuyenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedLopHoc();
        seedMonHoc();
        seedNamHoc();
        seedHocKy();
        seedDanToc();
        seedPhuHuynh();
        seedHocBa();
        seedGiaoVien();
        seedHocSinh();
        seedUsersAndRoles();
        seedThongBao();
        seedDiem();
        seedHanhKiem();
        seedThoiKhoaBieu();
        seedLichThi();
    }

    private void seedLopHoc() {
        if (lopHocRepository.count() > 0) return;

        LopHoc lop10A1 = new LopHoc();
        lop10A1.setTenLop("10A1");
        lop10A1.setKhoi("10");

        LopHoc lop11B2 = new LopHoc();
        lop11B2.setTenLop("11B2");
        lop11B2.setKhoi("11");

        LopHoc lop12C1 = new LopHoc();
        lop12C1.setTenLop("12C1");
        lop12C1.setKhoi("12");

        lopHocRepository.saveAll(List.of(lop10A1, lop11B2, lop12C1));
    }

    private void seedMonHoc() {
        if (monHocRepository.count() > 0) return;

        MonHoc toan = new MonHoc();
        toan.setTenMon("Toán");
        toan.setHeSo(2.0);

        MonHoc van = new MonHoc();
        van.setTenMon("Ngữ văn");
        van.setHeSo(2.0);

        MonHoc anh = new MonHoc();
        anh.setTenMon("Tiếng Anh");
        anh.setHeSo(1.0);

        MonHoc vatLi = new MonHoc();
        vatLi.setTenMon("Vật lí");
        vatLi.setHeSo(1.0);

        MonHoc hoaHoc = new MonHoc();
        hoaHoc.setTenMon("Hóa học");
        hoaHoc.setHeSo(1.0);

        MonHoc sinhHoc = new MonHoc();
        sinhHoc.setTenMon("Sinh học");
        sinhHoc.setHeSo(1.0);

        MonHoc lichSu = new MonHoc();
        lichSu.setTenMon("Lịch sử");
        lichSu.setHeSo(1.0);

        MonHoc diaLi = new MonHoc();
        diaLi.setTenMon("Địa lí");
        diaLi.setHeSo(1.0);

        MonHoc gdktpl = new MonHoc();
        gdktpl.setTenMon("Giáo dục kinh tế và pháp luật (GDKT&PL)");
        gdktpl.setHeSo(1.0);

        MonHoc tinHoc = new MonHoc();
        tinHoc.setTenMon("Tin học");
        tinHoc.setHeSo(1.0);

        MonHoc congNghe = new MonHoc();
        congNghe.setTenMon("Công nghệ");
        congNghe.setHeSo(1.0);

        MonHoc gdqpAn = new MonHoc();
        gdqpAn.setTenMon("GDQP-AN");
        gdqpAn.setHeSo(1.0);

        MonHoc gdtc = new MonHoc();
        gdtc.setTenMon("Giáo dục thể chất (GDTC)");
        gdtc.setHeSo(0.0);

        MonHoc amNhac = new MonHoc();
        amNhac.setTenMon("Âm nhạc");
        amNhac.setHeSo(0.0);

        MonHoc gddp = new MonHoc();
        gddp.setTenMon("Nội dung giáo dục địa phương (GDĐP)");
        gddp.setHeSo(0.0);

        MonHoc hdtnHn = new MonHoc();
        hdtnHn.setTenMon("Hoạt động trải nghiệm, hướng nghiệp (HĐTN, HN)");
        hdtnHn.setHeSo(0.0);

        monHocRepository.saveAll(List.of(
                toan,
                van,
                anh,
                vatLi,
                hoaHoc,
                sinhHoc,
                lichSu,
                diaLi,
                gdktpl,
                tinHoc,
                congNghe,
                gdqpAn,
                gdtc,
                amNhac,
                gddp,
                hdtnHn
        ));
    }

    private void seedNamHoc() {
        if (namHocRepository.count() > 0) return;

        NamHoc nam2023 = new NamHoc();
        nam2023.setId(1L);
        nam2023.setTenNamHoc("2023-2024");

        NamHoc nam2024 = new NamHoc();
        nam2024.setId(2L);
        nam2024.setTenNamHoc("2024-2025");

        NamHoc nam2025 = new NamHoc();
        nam2025.setId(3L);
        nam2025.setTenNamHoc("2025-2026");

        namHocRepository.saveAll(List.of(nam2023, nam2024, nam2025));
    }

    private void seedHocKy() {
        if (hocKyRepository.count() > 0) return;

        HocKy hk1 = new HocKy();
        hk1.setId(1L);
        hk1.setTenHocKy("Học kỳ 1");

        HocKy hk2 = new HocKy();
        hk2.setId(2L);
        hk2.setTenHocKy("Học kỳ 2");

        hocKyRepository.saveAll(List.of(hk1, hk2));
    }

    private void seedGiaoVien() {
        if (giaoVienRepository.count() > 0) return;

        GiaoVien gv1 = new GiaoVien();
        gv1.setHoTen("Nguyễn Thị Lan");
        gv1.setNgaySinh(LocalDate.of(1985, 3, 12));
        gv1.setGioiTinh(false);
        gv1.setBoMon("Toán");
        gv1.setTrinhDo("Thạc sĩ");
        gv1.setSdt("0905123456");
        gv1.setEmail("lan.nguyen@school.edu");

        GiaoVien gv2 = new GiaoVien();
        gv2.setHoTen("Trần Văn Minh");
        gv2.setNgaySinh(LocalDate.of(1980, 9, 21));
        gv2.setGioiTinh(true);
        gv2.setBoMon("Ngữ văn");
        gv2.setTrinhDo("Cử nhân");
        gv2.setSdt("0912345678");
        gv2.setEmail("minh.tran@school.edu");

        GiaoVien gv3 = new GiaoVien();
        gv3.setHoTen("Phạm Thị Hoa");
        gv3.setNgaySinh(LocalDate.of(1988, 1, 5));
        gv3.setGioiTinh(false);
        gv3.setBoMon("Tiếng Anh");
        gv3.setTrinhDo("Thạc sĩ");
        gv3.setSdt("0987654321");
        gv3.setEmail("hoa.pham@school.edu");

        giaoVienRepository.saveAll(List.of(gv1, gv2, gv3));
    }

    private void seedHocSinh() {
        if (hocSinhRepository.count() > 0) return;

        List<LopHoc> classes = lopHocRepository.findAll();
        if (classes.isEmpty()) return;

        List<DanToc> danTocs = danTocRepository.findAll();
        List<PhuHuynh> phuHuynhs = phuHuynhRepository.findAll();
        List<HocBa> hocBas = hocBaRepository.findAll();
        if (danTocs.isEmpty() || phuHuynhs.isEmpty() || hocBas.isEmpty()) return;

        LopHoc lop10A1 = classes.stream()
                .filter(lop -> "10A1".equalsIgnoreCase(lop.getTenLop()))
                .findFirst()
                .orElse(classes.get(0));

        LopHoc lop11B2 = classes.stream()
                .filter(lop -> "11B2".equalsIgnoreCase(lop.getTenLop()))
                .findFirst()
                .orElse(classes.get(0));

        HocSinh hs1 = new HocSinh();
        hs1.setHoTen("Lê Gia Huy");
        hs1.setNgaySinh(LocalDate.of(2008, 8, 15));
        hs1.setGioiTinh(true);
        hs1.setDiaChi("12 Nguyễn Trãi, Q.5");
        hs1.setSdt("0977123456");
        hs1.setEmail("huy.le@student.edu");
        hs1.setNamNhapHoc(2023);
        hs1.setMaBhyt("BHYT123456");
        hs1.setDienChinhSach(false);
        hs1.setTrangThai(1);
        hs1.setLopHoc(lop10A1);
        hs1.setDanTocId(danTocs.get(0).getId());
        hs1.setPhuHuynhId(phuHuynhs.get(0).getId());
        hs1.setHocBaId(hocBas.get(0).getId());
        hs1.setCreatedAt(LocalDateTime.now());
        hs1.setUpdatedAt(LocalDateTime.now());

        HocSinh hs2 = new HocSinh();
        hs2.setHoTen("Nguyễn Minh Anh");
        hs2.setNgaySinh(LocalDate.of(2007, 11, 2));
        hs2.setGioiTinh(false);
        hs2.setDiaChi("45 Lê Lợi, Q.1");
        hs2.setSdt("0968123456");
        hs2.setEmail("anh.nguyen@student.edu");
        hs2.setNamNhapHoc(2022);
        hs2.setMaBhyt("BHYT789012");
        hs2.setDienChinhSach(true);
        hs2.setTrangThai(1);
        hs2.setLopHoc(lop11B2);
        hs2.setDanTocId(danTocs.get(0).getId());
        hs2.setPhuHuynhId(phuHuynhs.get(0).getId());
        hs2.setHocBaId(hocBas.get(0).getId());
        hs2.setCreatedAt(LocalDateTime.now());
        hs2.setUpdatedAt(LocalDateTime.now());

        hocSinhRepository.saveAll(List.of(hs1, hs2));
    }

    private void seedThongBao() {
        if (thongBaoRepository.count() > 0) return;

        ThongBao tb1 = new ThongBao();
        tb1.setTieuDe("Thông báo lịch thi");
        tb1.setNoiDung("Học sinh kiểm tra lịch thi cuối kỳ tại mục Lịch thi.");
        tb1.setDoiTuong(ThongBaoDoiTuongEnum.HOC_SINH);
        tb1.setNgayDang(LocalDateTime.now().minusDays(3));
        tb1.setTrangThai(1);

        ThongBao tb2 = new ThongBao();
        tb2.setTieuDe("Họp giáo viên chủ nhiệm");
        tb2.setNoiDung("Giáo viên chủ nhiệm họp vào thứ 6 tuần này.");
        tb2.setDoiTuong(ThongBaoDoiTuongEnum.GIAO_VIEN);
        tb2.setNgayDang(LocalDateTime.now().minusDays(1));
        tb2.setTrangThai(1);

        ThongBao tb3 = new ThongBao();
        tb3.setTieuDe("Thông báo học phí");
        tb3.setNoiDung("Phụ huynh hoàn tất học phí trước ngày 15.");
        tb3.setDoiTuong(ThongBaoDoiTuongEnum.PHU_HUYNH);
        tb3.setNgayDang(LocalDateTime.now().minusDays(5));
        tb3.setTrangThai(0);

        thongBaoRepository.saveAll(List.of(tb1, tb2, tb3));
    }

    private void seedDanToc() {
        if (danTocRepository.count() > 0) return;

        DanToc kinh = new DanToc();
        kinh.setId(1L);
        kinh.setTenDanToc("Kinh");
        kinh.setMoTa("Dân tộc phổ biến");

        DanToc tay = new DanToc();
        tay.setId(2L);
        tay.setTenDanToc("Tày");
        tay.setMoTa("Dân tộc vùng núi phía Bắc");

        danTocRepository.saveAll(List.of(kinh, tay));
    }

    private void seedPhuHuynh() {
        if (phuHuynhRepository.count() > 0) return;

        PhuHuynh ph1 = new PhuHuynh();
        ph1.setId(1L);
        ph1.setHoTen("Nguyễn Văn Phúc");
        ph1.setSoDienThoai("0905123999");
        ph1.setEmail("phuc.nguyen@parent.edu");
        ph1.setDiaChi("12 Lý Thường Kiệt, Q.10");
        ph1.setNgheNghiep("Kinh doanh");

        PhuHuynh ph2 = new PhuHuynh();
        ph2.setId(2L);
        ph2.setHoTen("Trần Thị Hạnh");
        ph2.setSoDienThoai("0911222333");
        ph2.setEmail("hanh.tran@parent.edu");
        ph2.setDiaChi("54 Trường Chinh, Q.12");
        ph2.setNgheNghiep("Giáo viên");

        phuHuynhRepository.saveAll(List.of(ph1, ph2));
    }

    private void seedHocBa() {
        if (hocBaRepository.count() > 0) return;

        List<NamHoc> years = namHocRepository.findAll();
        if (years.isEmpty()) return;

        HocBa hb1 = new HocBa();
        hb1.setId(1L);
        hb1.setNamHocId(years.get(0).getId());
        hb1.setHocLuc("Khá");
        hb1.setHanhKiem("Tốt");
        hb1.setGhiChu("Hồ sơ học tập năm gần nhất");

        HocBa hb2 = new HocBa();
        hb2.setId(2L);
        hb2.setNamHocId(years.get(0).getId());
        hb2.setHocLuc("Giỏi");
        hb2.setHanhKiem("Tốt");
        hb2.setGhiChu("Hồ sơ học tập năm gần nhất");

        hocBaRepository.saveAll(List.of(hb1, hb2));
    }

    private void seedDiem() {
        if (diemRepository.count() > 0) return;

        Diem d1 = new Diem();
        d1.setLoaiDiem(LoaiDiemEnum.MIENG);
        d1.setDiemSo(8.5);

        Diem d2 = new Diem();
        d2.setLoaiDiem(LoaiDiemEnum.MUOI_LAM_PHUT);
        d2.setDiemSo(7.0);

        Diem d3 = new Diem();
        d3.setLoaiDiem(LoaiDiemEnum.GIUA_KY);
        d3.setDiemSo(8.0);

        Diem d4 = new Diem();
        d4.setLoaiDiem(LoaiDiemEnum.CUOI_KY);
        d4.setDiemSo(8.8);

        diemRepository.saveAll(List.of(d1, d2, d3, d4));
    }

    private void seedHanhKiem() {
        if (hanhKiemRepository.count() > 0) return;

        HanhKiem hk1 = new HanhKiem();
        hk1.setXepLoai(HanhKiemEnum.TOT);
        hk1.setNhanXet("Chăm chỉ, tích cực tham gia lớp.");
        hk1.setNgayDanhGia(LocalDate.now().minusDays(10));

        HanhKiem hk2 = new HanhKiem();
        hk2.setXepLoai(HanhKiemEnum.KHA);
        hk2.setNhanXet("Có tiến bộ, cần giữ nề nếp.");
        hk2.setNgayDanhGia(LocalDate.now().minusDays(40));

        hanhKiemRepository.saveAll(List.of(hk1, hk2));
    }

    private void seedThoiKhoaBieu() {
        if (thoiKhoaBieuRepository.count() > 0) return;

        ThoiKhoaBieu tkb1 = new ThoiKhoaBieu();
        tkb1.setThu(2);
        tkb1.setTietBatDau(1);
        tkb1.setSoTiet(3);
        tkb1.setGhiChu("Toán, Văn, Anh");

        ThoiKhoaBieu tkb2 = new ThoiKhoaBieu();
        tkb2.setThu(4);
        tkb2.setTietBatDau(4);
        tkb2.setSoTiet(3);
        tkb2.setGhiChu("Lý, Hóa, Sinh");

        thoiKhoaBieuRepository.saveAll(List.of(tkb1, tkb2));
    }

    private void seedLichThi() {
        if (lichThiRepository.count() > 0) return;

        LichThi lt1 = new LichThi();
        lt1.setNgayThi(LocalDate.now().plusDays(7));
        lt1.setGioBatDau(LocalTime.of(7, 30));
        lt1.setThoiGianThi(90);
        lt1.setPhongThi("A101");
        lt1.setGhiChu("Thi giữa kỳ Toán");

        LichThi lt2 = new LichThi();
        lt2.setNgayThi(LocalDate.now().plusDays(10));
        lt2.setGioBatDau(LocalTime.of(13, 30));
        lt2.setThoiGianThi(60);
        lt2.setPhongThi("B203");
        lt2.setGhiChu("Thi giữa kỳ Văn");

        lichThiRepository.saveAll(List.of(lt1, lt2));
    }

    private void seedUsersAndRoles() {
        Roles adminRole = ensureRole("ADMIN");
        Roles teacherRole = ensureRole("GIAOVIEN");
        Roles studentRole = ensureRole("HOCSINH");
        Roles parentRole = ensureRole("PHUHUYNH");

        User admin = ensureUser("admin", "admin@gmail.com", "admin123@", 1);
        User teacher = ensureUser("gv_demo", "gv.demo@school.edu", "teacher123", 1);
        User student = ensureUser("hs_demo", "hs.demo@student.edu", "student123", 1);
        User parent = ensureUser("ph_demo", "ph.demo@parent.edu", "parent123", 1);

        assignRoleIfMissing(admin, adminRole);
        assignRoleIfMissing(teacher, teacherRole);
        assignRoleIfMissing(student, studentRole);
        assignRoleIfMissing(parent, parentRole);
    }

    private Roles ensureRole(String roleName) {
        return rolesRepository.findByRoleName(roleName)
                .orElseGet(() -> {
                    Roles role = new Roles();
                    Long maxId = rolesRepository.findMaxId();
                    role.setId(maxId + 1);
                    role.setRoleName(roleName);
                    return rolesRepository.save(role);
                });
    }

    private User ensureUser(String username, String email, String rawPassword, Integer status) {
        return userRepository.findByUsername(username)
                .orElseGet(() -> {
                    User user = new User();
                    user.setUsername(username);
                    user.setEmail(email);
                    user.setStatus(status);
                    user.setPassword(passwordEncoder.encode(rawPassword));
                    return userRepository.save(user);
                });
    }

    private void assignRoleIfMissing(User user, Roles role) {
        if (user == null || role == null) return;
        if (!phanQuyenRepository.findByIdUserId(user.getId()).isEmpty()) return;
        PhanQuyenId id = new PhanQuyenId();
        id.setUserId(user.getId());
        id.setRolesId(role.getId());

        PhanQuyen mapping = new PhanQuyen();
        mapping.setId(id);
        phanQuyenRepository.save(mapping);
    }
}
