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

        // Fetch or create LopHoc
        LopHoc lop = lopHocRepository.findAll().stream().findFirst().orElseGet(() -> {
            LopHoc newLop = new LopHoc();
            newLop.setTenLop("TestLop");
            newLop.setGvcn(gv);
            newLop.setKhoi(10);
            newLop.setNamHoc("2024-2025");
            return lopHocRepository.save(newLop);
        });

        // Fetch or create HocSinh
        HocSinh hs = hocSinhRepository.findAll().stream().findFirst().orElseGet(() -> {
            HocSinh newHs = new HocSinh();
            newHs.setHoTen("Test HS");
            newHs.setMaHocSinh("HS" + randomStr);
            newHs.setLop(lop);
            return hocSinhRepository.save(newHs);
        });

        // Fetch or create MonHoc
        MonHoc mh = monHocRepository.findAll().stream().findFirst().orElseGet(() -> {
            MonHoc newMh = new MonHoc();
            newMh.setTenMon("Test Mon " + randomStr);
            newMh.setMaMon("M" + randomStr);
            newMh.setNhomDanhGia("Toan");
            newMh.setSoDtxHocKy(4);
            newMh.setKhoiApDung("10");
            return monHocRepository.save(newMh);
        });

        // Fetch or create PhanCongDay
        PhanCongDay pcd = phanCongDayRepository.findAll().stream().findFirst().orElseGet(() -> {
            PhanCongDay newPcd = new PhanCongDay();
            newPcd.setLop(lop);
            newPcd.setMonHoc(mh);
            newPcd.setGiaoVien(gv);
            newPcd.setHocKy(1);
            newPcd.setNamHoc("2024-2025");
            return phanCongDayRepository.save(newPcd);
        });


        Diem diem = new Diem();
        diem.setHocSinh(hs);
        diem.setMonHoc(mh);
        diem.setPhanCongDay(pcd);
        diem.setGiaoVienNhap(gv);

        diem.setLoaiDiem("GK");
        diem.setSoThuTu(0);
        diem.setHocKy(1);
        // Randomize nam_hoc to bypass unique constraints if they exist
        diem.setNamHoc("2024-20" + randomStr.substring(0, 2)); 
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
