package com.hethongtruongthpt.config;

import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.entity.MonHoc;
import com.hethongtruongthpt.entity.NamHoc;
import com.hethongtruongthpt.repository.LopHocRepository;
import com.hethongtruongthpt.repository.MonHocRepository;
import com.hethongtruongthpt.repository.NamHocRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@Order(2)
public class SampleDataSeeder implements CommandLineRunner {
    private final LopHocRepository lopHocRepository;
    private final MonHocRepository monHocRepository;
    private final NamHocRepository namHocRepository;

    public SampleDataSeeder(
            LopHocRepository lopHocRepository,
            MonHocRepository monHocRepository,
            NamHocRepository namHocRepository
    ) {
        this.lopHocRepository = lopHocRepository;
        this.monHocRepository = monHocRepository;
        this.namHocRepository = namHocRepository;
    }

    @Override
    public void run(String... args) {
        seedLopHoc();
        seedMonHoc();
        seedNamHoc();
    }

    private void seedLopHoc() {
        if (lopHocRepository.count() > 0) return;

        LopHoc lop10A1 = new LopHoc();
        lop10A1.setTenLop("10A1");
        lop10A1.setKhoi(10);
        lop10A1.setNamHoc("2025-2026");
        lop10A1.setSiSo(35);

        LopHoc lop10A2 = new LopHoc();
        lop10A2.setTenLop("10A2");
        lop10A2.setKhoi(10);
        lop10A2.setNamHoc("2025-2026");
        lop10A2.setSiSo(36);

        LopHoc lop11B1 = new LopHoc();
        lop11B1.setTenLop("11B1");
        lop11B1.setKhoi(11);
        lop11B1.setNamHoc("2025-2026");
        lop11B1.setSiSo(32);

        LopHoc lop12C1 = new LopHoc();
        lop12C1.setTenLop("12C1");
        lop12C1.setKhoi(12);
        lop12C1.setNamHoc("2025-2026");
        lop12C1.setSiSo(30);

        lopHocRepository.saveAll(List.of(lop10A1, lop10A2, lop11B1, lop12C1));
    }

    private void seedMonHoc() {
        if (monHocRepository.count() > 0) return;

        MonHoc toan = new MonHoc();
        toan.setMaMon("TOAN");
        toan.setTenMon("Toán");
        toan.setNhomDanhGia("DIEM_SO");
        toan.setSoDtxHocKy(4);
        toan.setKhoiApDung("10,11,12");
        toan.setIsActive(true);

        MonHoc van = new MonHoc();
        van.setMaMon("VAN");
        van.setTenMon("Ngữ văn");
        van.setNhomDanhGia("DIEM_SO");
        van.setSoDtxHocKy(4);
        van.setKhoiApDung("10,11,12");
        van.setIsActive(true);

        MonHoc anh = new MonHoc();
        anh.setMaMon("ANH");
        anh.setTenMon("Tiếng Anh");
        anh.setNhomDanhGia("DIEM_SO");
        anh.setSoDtxHocKy(4);
        anh.setKhoiApDung("10,11,12");
        anh.setIsActive(true);

        MonHoc vatLi = new MonHoc();
        vatLi.setMaMon("LY");
        vatLi.setTenMon("Vật lí");
        vatLi.setNhomDanhGia("DIEM_SO");
        vatLi.setSoDtxHocKy(4);
        vatLi.setKhoiApDung("10,11,12");
        vatLi.setIsActive(true);

        MonHoc hoaHoc = new MonHoc();
        hoaHoc.setMaMon("HOA");
        hoaHoc.setTenMon("Hóa học");
        hoaHoc.setNhomDanhGia("DIEM_SO");
        hoaHoc.setSoDtxHocKy(4);
        hoaHoc.setKhoiApDung("10,11,12");
        hoaHoc.setIsActive(true);

        MonHoc sinhHoc = new MonHoc();
        sinhHoc.setMaMon("SINH");
        sinhHoc.setTenMon("Sinh học");
        sinhHoc.setNhomDanhGia("DIEM_SO");
        sinhHoc.setSoDtxHocKy(4);
        sinhHoc.setKhoiApDung("10,11,12");
        sinhHoc.setIsActive(true);

        MonHoc lichSu = new MonHoc();
        lichSu.setMaMon("SU");
        lichSu.setTenMon("Lịch sử");
        lichSu.setNhomDanhGia("DIEM_SO");
        lichSu.setSoDtxHocKy(4);
        lichSu.setKhoiApDung("10,11,12");
        lichSu.setIsActive(true);

        MonHoc diaLi = new MonHoc();
        diaLi.setMaMon("DIA");
        diaLi.setTenMon("Địa lí");
        diaLi.setNhomDanhGia("DIEM_SO");
        diaLi.setSoDtxHocKy(4);
        diaLi.setKhoiApDung("10,11,12");
        diaLi.setIsActive(true);

        monHocRepository.saveAll(List.of(
                toan, van, anh, vatLi, hoaHoc, sinhHoc, lichSu, diaLi
        ));
    }

    private void seedNamHoc() {
        if (namHocRepository.count() > 0) return;

        NamHoc nam202324 = new NamHoc();
        nam202324.setTenNamHoc("2023-2024");
        nam202324.setHk1NgayBatDau(LocalDate.of(2023, 9, 1));
        nam202324.setHk1NgayKetThuc(LocalDate.of(2023, 12, 30));
        nam202324.setHk2NgayBatDau(LocalDate.of(2024, 1, 5));
        nam202324.setHk2NgayKetThuc(LocalDate.of(2024, 5, 31));
        nam202324.setDeadlineNhapDiemHk1(LocalDate.of(2024, 1, 10));
        nam202324.setDeadlineNhapDiemHk2(LocalDate.of(2024, 6, 15));
        nam202324.setTrangThai("DA_DONG");

        NamHoc nam202425 = new NamHoc();
        nam202425.setTenNamHoc("2024-2025");
        nam202425.setHk1NgayBatDau(LocalDate.of(2024, 9, 1));
        nam202425.setHk1NgayKetThuc(LocalDate.of(2024, 12, 30));
        nam202425.setHk2NgayBatDau(LocalDate.of(2025, 1, 5));
        nam202425.setHk2NgayKetThuc(LocalDate.of(2025, 5, 31));
        nam202425.setDeadlineNhapDiemHk1(LocalDate.of(2025, 1, 10));
        nam202425.setDeadlineNhapDiemHk2(LocalDate.of(2025, 6, 15));
        nam202425.setTrangThai("DA_DONG");

        NamHoc nam202526 = new NamHoc();
        nam202526.setTenNamHoc("2025-2026");
        nam202526.setHk1NgayBatDau(LocalDate.of(2025, 9, 1));
        nam202526.setHk1NgayKetThuc(LocalDate.of(2025, 12, 30));
        nam202526.setHk2NgayBatDau(LocalDate.of(2026, 1, 5));
        nam202526.setHk2NgayKetThuc(LocalDate.of(2026, 5, 31));
        nam202526.setDeadlineNhapDiemHk1(LocalDate.of(2026, 1, 10));
        nam202526.setDeadlineNhapDiemHk2(LocalDate.of(2026, 6, 15));
        nam202526.setTrangThai("DANG_MO");

        namHocRepository.saveAll(List.of(nam202324, nam202425, nam202526));
    }
}
