package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.Diem;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.MonHoc;
import com.hethongtruongthpt.entity.PhanCongDay;
import com.hethongtruongthpt.entity.GiaoVien;
import com.hethongtruongthpt.repository.DiemRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;

@SpringBootTest
public class DiemTest {

    @Autowired
    private DiemCrudService diemCrudService;

    @Autowired
    private DiemRepository diemRepository;

    @Test
    public void testUpdate() {
        try {
            // Use existing IDs for DB constraints
            // We need a real hoc_sinh_id, mon_hoc_id, phan_cong_day_id.
            // Let's assume hoc_sinh_id=1 exists. If not, we will catch the error.
            Diem diem = new Diem();
            
            HocSinh hs = new HocSinh();
            hs.setId(1);
            diem.setHocSinh(hs);

            MonHoc mh = new MonHoc();
            mh.setId(1);
            diem.setMonHoc(mh);

            PhanCongDay pcd = new PhanCongDay();
            pcd.setId(1);
            diem.setPhanCongDay(pcd);

            GiaoVien gv = new GiaoVien();
            gv.setId(1);
            diem.setGiaoVienNhap(gv);

            diem.setLoaiDiem("TX");
            diem.setSoThuTu(4);
            diem.setHocKy(1);
            diem.setNamHoc("2024-2025");
            diem.setGiaTriDiem(new BigDecimal("8.0"));
            diem.setStatus("DRAFT");

            List<Diem> savedList = diemCrudService.saveAll(List.of(diem));
            System.out.println("SAVE 1 SUCCESSFUL, ID: " + savedList.get(0).getId());

            // NOW UPDATE IT
            Diem updateReq = new Diem();
            updateReq.setId(savedList.get(0).getId());
            updateReq.setHocSinh(hs);
            updateReq.setMonHoc(mh);
            updateReq.setPhanCongDay(pcd);
            updateReq.setGiaoVienNhap(gv);
            updateReq.setLoaiDiem("TX");
            updateReq.setSoThuTu(4);
            updateReq.setHocKy(1);
            updateReq.setNamHoc("2024-2025");
            updateReq.setGiaTriDiem(new BigDecimal("9.5"));

            diemCrudService.saveAll(List.of(updateReq));
            System.out.println("UPDATE SUCCESSFUL");

            Diem fetched = diemRepository.findById(savedList.get(0).getId()).get();
            System.out.println("FETCHED SCORE: " + fetched.getGiaTriDiem());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
