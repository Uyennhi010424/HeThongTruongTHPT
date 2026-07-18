package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.Diem;
import com.hethongtruongthpt.entity.GiaoVien;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.MonHoc;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.DiemAuditLogRepository;
import com.hethongtruongthpt.repository.DiemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DiemService")
@SuppressWarnings("null")
class DiemServiceTest {

    @Mock private DiemRepository diemRepository;
    @Mock private DiemAuditLogRepository diemAuditLogRepository;

    @InjectMocks
    private DiemService diemService;

    private Diem sampleDiem;

    @BeforeEach
    void setUp() {
        HocSinh hs = new HocSinh();
        hs.setId(1);

        MonHoc mon = new MonHoc();
        mon.setId(1);

        GiaoVien gv = new GiaoVien();
        gv.setId(1);

        sampleDiem = new Diem();
        sampleDiem.setId(1);
        sampleDiem.setHocSinh(hs);
        sampleDiem.setMonHoc(mon);
        sampleDiem.setGiaoVienNhap(gv);
        sampleDiem.setLoaiDiem("TX");
        sampleDiem.setSoThuTu(1);
        sampleDiem.setHocKy(1);
        sampleDiem.setNamHoc("2024-2025");
        sampleDiem.setGiaTriDiem(new BigDecimal("8.5"));
    }

    @Nested
    @DisplayName("getAll()")
    class GetAll {
        @Test
        @DisplayName("should return all scores")
        void returnsAll() {
            when(diemRepository.findAll()).thenReturn(List.of(sampleDiem));

            List<Diem> result = diemService.getAll();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getGiaTriDiem()).isEqualByComparingTo("8.5");
        }
    }

    @Nested
    @DisplayName("getById()")
    class GetById {
        @Test
        @DisplayName("should return score when found")
        void returnsWhenFound() {
            when(diemRepository.findById(1)).thenReturn(Optional.of(sampleDiem));

            Diem result = diemService.getById(1);

            assertThat(result.getId()).isEqualTo(1);
        }

        @Test
        @DisplayName("should throw when not found")
        void throwsWhenNotFound() {
            when(diemRepository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> diemService.getById(99))
                .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("create()")
    class Create {
        @Test
        @DisplayName("should save and create audit log")
        void savesAndAudits() {
            when(diemRepository.save(any())).thenReturn(sampleDiem);

            Diem result = diemService.create(sampleDiem);

            assertThat(result.getId()).isEqualTo(1);
            verify(diemRepository).save(any());
            verify(diemAuditLogRepository).save(any());
        }
    }

    @Nested
    @DisplayName("saveAll()")
    class SaveAll {
        @Test
        @DisplayName("should batch save and batch audit")
        void batchSaveAndAudit() {
            Diem newDiem = new Diem();
            newDiem.setHocSinh(sampleDiem.getHocSinh());
            newDiem.setMonHoc(sampleDiem.getMonHoc());
            newDiem.setGiaoVienNhap(sampleDiem.getGiaoVienNhap());
            newDiem.setLoaiDiem("GK");
            newDiem.setGiaTriDiem(new BigDecimal("7.0"));

            when(diemRepository.findAllById(any())).thenReturn(List.of(sampleDiem));
            when(diemRepository.saveAll(any())).thenAnswer(inv -> {
                List<Diem> list = inv.getArgument(0);
                for (int i = 0; i < list.size(); i++) {
                    if (list.get(i).getId() == null) list.get(i).setId(100 + i);
                }
                return list;
            });

            List<Diem> result = diemService.saveAll(List.of(sampleDiem, newDiem));

            assertThat(result).hasSize(2);
            verify(diemRepository).saveAll(any());
            verify(diemAuditLogRepository).saveAll(any());
        }
    }

    @Nested
    @DisplayName("delete()")
    class Delete {
        @Test
        @DisplayName("should delete and create audit log")
        void deletesAndAudits() {
            when(diemRepository.findById(1)).thenReturn(Optional.of(sampleDiem));

            diemService.delete(1);

            verify(diemRepository).deleteById(1);
            verify(diemAuditLogRepository).save(any());
        }
    }
}
