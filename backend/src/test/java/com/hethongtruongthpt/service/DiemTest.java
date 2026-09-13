package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.Diem;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.MonHoc;
import com.hethongtruongthpt.entity.PhanCongDay;
import com.hethongtruongthpt.entity.GiaoVien;
import com.hethongtruongthpt.repository.HocSinhRepository;
import com.hethongtruongthpt.repository.MonHocRepository;
import com.hethongtruongthpt.repository.PhanCongDayRepository;
import com.hethongtruongthpt.repository.GiaoVienRepository;
import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.repository.LopHocRepository;
import com.hethongtruongthpt.repository.DiemRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
public class DiemTest {

    @Autowired private DiemCrudService diemCrudService;
    @Autowired private DiemRepository diemRepository;
    
    @Autowired private HocSinhRepository hocSinhRepository;
    @Autowired private MonHocRepository monHocRepository;
    @Autowired private GiaoVienRepository giaoVienRepository;
    @Autowired private PhanCongDayRepository phanCongDayRepository;
    @Autowired private LopHocRepository lopHocRepository;

    @Autowired private com.hethongtruongthpt.repository.UserRepository userRepository;

    @Test
    public void testOptimisticLocking() {
        String randomStr = UUID.randomUUID().toString().substring(0, 4);

        // Fetch or create User for GiaoVien
        com.hethongtruongthpt.entity.User user = userRepository.findAll().stream().findFirst().orElseGet(() -> {
            com.hethongtruongthpt.entity.User u = new com.hethongtruongthpt.entity.User();
            u.setUsername("user" + randomStr);
            u.setPassword("test");
            u.setRole(com.hethongtruongthpt.enums.RoleEnum.GIAO_VIEN);
            u.setIsActive(true);
            return userRepository.save(u);
        });

        // Fetch or create GiaoVien
        GiaoVien gv = giaoVienRepository.findAll().stream().findFirst().orElseGet(() -> {
            GiaoVien newGv = new GiaoVien();
            newGv.setHoTen("Test GV");
            newGv.setMaGiaoVien("GV" + randomStr);
            newGv.setUser(user);
            return giaoVienRepository.save(newGv);
        });

        // Create dedicated LopHoc for test
        LopHoc lop = new LopHoc();
        lop.setTenLop("10T" + randomStr);
        lop.setKhoi(10);
        lop.setNamHoc("2024-2025");
        lop = lopHocRepository.save(lop);

        // Create dedicated User for HocSinh
        com.hethongtruongthpt.entity.User userHs = new com.hethongtruongthpt.entity.User();
        userHs.setUsername("hs" + randomStr);
        userHs.setPassword("test");
        userHs.setRole(com.hethongtruongthpt.enums.RoleEnum.HOC_SINH);
        userHs.setIsActive(true);
        userHs = userRepository.save(userHs);

        // Create dedicated HocSinh for test
        HocSinh hs = new HocSinh();
        hs.setUser(userHs);
        hs.setHoTen("Nguyen Test HS");
        hs.setMaHocSinh("HS" + randomStr);
        hs.setNgaySinh(java.time.LocalDate.of(2008, 1, 15));
        hs.setGioiTinh("NAM");
        hs.setNamNhapHoc(2024);
        hs.setSdt("090" + (int)(1000000 + Math.random() * 9000000));
        hs.setDiaChi("123 Duong ABC, Quan 1, TP.HCM");
        hs.setMaBhyt("HS" + randomStr + "12345");
        hs.setDanToc("Kinh");
        hs.setTonGiao("Không");
        hs.setLop(lop);
        hs = hocSinhRepository.save(hs);

        // Create dedicated MonHoc for test
        MonHoc mh = new MonHoc();
        mh.setTenMon("MonHoc " + randomStr);
        mh.setMaMon("M" + randomStr);
        mh.setNhomDanhGia("Toan");
        mh.setSoDtxHocKy(4);
        mh.setKhoiApDung("10");
        mh = monHocRepository.save(mh);

        // Create dedicated PhanCongDay
        PhanCongDay pcd = new PhanCongDay();
        pcd.setLop(lop);
        pcd.setMonHoc(mh);
        pcd.setGiaoVien(gv);
        pcd.setHocKy(1);
        pcd.setNamHoc("2024-2025");
        pcd = phanCongDayRepository.save(pcd);

        Diem diem = new Diem();
        diem.setHocSinh(hs);
        diem.setMonHoc(mh);
        diem.setPhanCongDay(pcd);
        diem.setGiaoVienNhap(gv);

        diem.setLoaiDiem("GK");
        diem.setSoThuTu(0);
        diem.setHocKy(1);
        diem.setNamHoc("2024-2025"); 
        diem.setGiaTriDiem(new BigDecimal("7.0"));
        diem.setStatus("DRAFT");

        List<Diem> savedList = diemCrudService.saveAll(List.of(diem));
        Integer diemId = savedList.get(0).getId();

        // Simulated Transaction 1 gets the entity
        Diem tx1 = diemRepository.findById(diemId).get();
        // Simulated Transaction 2 gets the SAME entity version
        Diem tx2 = diemRepository.findById(diemId).get();

        // Tx1 modifies and saves successfully, version increments
        tx1.setGiaTriDiem(new BigDecimal("8.0"));
        diemCrudService.saveAll(List.of(tx1));

        // Tx2 tries to modify and save with the old version -> should fail
        tx2.setGiaTriDiem(new BigDecimal("9.0"));

        assertThrows(
            ObjectOptimisticLockingFailureException.class,
            () -> diemCrudService.saveAll(List.of(tx2)),
            "Expected saveAll to throw ObjectOptimisticLockingFailureException due to concurrent modification"
        );
        
        System.out.println("Optimistic locking test passed!");
    }
}
