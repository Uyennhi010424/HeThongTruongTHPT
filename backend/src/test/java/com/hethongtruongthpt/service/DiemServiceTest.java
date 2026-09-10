package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.Diem;
import com.hethongtruongthpt.entity.GiaoVien;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.MonHoc;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DiemService")
@SuppressWarnings("null")
class DiemServiceTest {

    @Mock private DiemCrudService diemCrudService;
    @Mock private DiemCalculationService diemCalculationService;

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
            when(diemCrudService.getAll()).thenReturn(List.of(sampleDiem));

            List<Diem> result = diemService.getAll();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getGiaTriDiem()).isEqualByComparingTo("8.5");
            verify(diemCrudService).getAll();
        }
    }

    @Nested
    @DisplayName("getById()")
    class GetById {
        @Test
        @DisplayName("should return score when found")
        void returnsWhenFound() {
            when(diemCrudService.getById(1)).thenReturn(sampleDiem);

            Diem result = diemService.getById(1);

            assertThat(result.getId()).isEqualTo(1);
            verify(diemCrudService).getById(1);
        }
    }

    @Nested
    @DisplayName("create()")
    class Create {
        @Test
        @DisplayName("should save and return score")
        void savesAndAudits() {
            when(diemCrudService.create(sampleDiem)).thenReturn(sampleDiem);

            Diem result = diemService.create(sampleDiem);

            assertThat(result.getId()).isEqualTo(1);
            verify(diemCrudService).create(sampleDiem);
        }
    }

    @Nested
    @DisplayName("saveAll()")
    class SaveAll {
        @Test
        @DisplayName("should batch save")
        void batchSaveAndAudit() {
            when(diemCrudService.saveAll(any())).thenReturn(List.of(sampleDiem));

            List<Diem> result = diemService.saveAll(List.of(sampleDiem));

            assertThat(result).hasSize(1);
            verify(diemCrudService).saveAll(any());
        }
    }

    @Nested
    @DisplayName("delete()")
    class Delete {
        @Test
        @DisplayName("should delete score")
        void deletesAndAudits() {
            doNothing().when(diemCrudService).delete(1);

            diemService.delete(1);

            verify(diemCrudService).delete(1);
        }
    }
}
