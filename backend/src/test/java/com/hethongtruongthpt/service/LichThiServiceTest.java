package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.LichThi;
import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.entity.MonHoc;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.LichThiRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LichThiService")
@SuppressWarnings("null")
class LichThiServiceTest {

    @Mock
    private LichThiRepository lichThiRepository;

    @InjectMocks
    private LichThiService lichThiService;

    private LichThi sampleLichThi;

    private LopHoc sampleLop;
    private MonHoc sampleMonHoc;

    @BeforeEach
    void setUp() {
        sampleLop = new LopHoc();
        sampleLop.setId(1);
        sampleLop.setTenLop("10A1");

        sampleMonHoc = new MonHoc();
        sampleMonHoc.setId(1);
        sampleMonHoc.setTenMon("Toán");

        sampleLichThi = new LichThi();
        sampleLichThi.setId(1);
        sampleLichThi.setLop(sampleLop);
        sampleLichThi.setMonHoc(sampleMonHoc);
        sampleLichThi.setNgayThi(java.time.LocalDate.of(2025, 5, 15));
        sampleLichThi.setGioBatDau(java.time.LocalTime.of(8, 0));
        sampleLichThi.setThoiGianLamBai(90);
        sampleLichThi.setPhongThi("P.402");
        sampleLichThi.setLoaiKiemTra("CK");
        sampleLichThi.setHocKy(2);
        sampleLichThi.setNamHoc("2024-2025");
    }

    @Nested
    @DisplayName("getAll()")
    class GetAll {
        @Test
        @DisplayName("should return all lich thi")
        void returnsAll() {
            when(lichThiRepository.findAll()).thenReturn(List.of(sampleLichThi));

            List<LichThi> result = lichThiService.getAll();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getId()).isEqualTo(1);
            verify(lichThiRepository).findAll();
        }

        @Test
        @DisplayName("should return empty list when no data")
        void returnsEmpty() {
            when(lichThiRepository.findAll()).thenReturn(List.of());

            List<LichThi> result = lichThiService.getAll();

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getByLopId()")
    class GetByLopId {
        @Test
        @DisplayName("should return lich thi filtered by lopId")
        void returnsByLopId() {
            when(lichThiRepository.findByLopId(5)).thenReturn(List.of(sampleLichThi));

            List<LichThi> result = lichThiService.getByLopId(5);

            assertThat(result).hasSize(1);
            verify(lichThiRepository).findByLopId(5);
        }
    }

    @Nested
    @DisplayName("getById()")
    class GetById {
        @Test
        @DisplayName("should return lich thi when found")
        void returnsWhenFound() {
            when(lichThiRepository.findById(1)).thenReturn(Optional.of(sampleLichThi));

            LichThi result = lichThiService.getById(1);

            assertThat(result.getId()).isEqualTo(1);
            assertThat(result.getPhongThi()).isEqualTo("P.402");
        }

        @Test
        @DisplayName("should throw when not found")
        void throwsWhenNotFound() {
            when(lichThiRepository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> lichThiService.getById(99))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Không tìm thấy lịch thi");
        }
    }

    @Nested
    @DisplayName("create()")
    class Create {
        @Test
        @DisplayName("should save and return lich thi")
        void savesAndReturns() {
            LichThi newLichThi = new LichThi();
            newLichThi.setLop(sampleLop);
            newLichThi.setMonHoc(sampleMonHoc);
            newLichThi.setNgayThi(java.time.LocalDate.of(2025, 6, 1));
            newLichThi.setGioBatDau(java.time.LocalTime.of(9, 0));
            newLichThi.setThoiGianLamBai(60);
            newLichThi.setPhongThi("P.101");
            newLichThi.setLoaiKiemTra("GK");
            newLichThi.setHocKy(1);
            newLichThi.setNamHoc("2024-2025");

            when(lichThiRepository.findByLopIdAndMonHocIdAndLoaiKiemTraAndHocKyAndNamHoc(
                    anyInt(), anyInt(), any(), anyInt(), any())).thenReturn(Optional.empty());
            when(lichThiRepository.save(any(LichThi.class))).thenAnswer(inv -> {
                LichThi saved = inv.getArgument(0);
                saved.setId(2);
                return saved;
            });

            LichThi result = lichThiService.create(newLichThi);

            assertThat(result.getId()).isEqualTo(2);
            assertThat(result.getPhongThi()).isEqualTo("P.101");
            verify(lichThiRepository).save(newLichThi);
        }
    }

    @Nested
    @DisplayName("update()")
    class Update {
        @Test
        @DisplayName("should update existing lich thi")
        void updatesExisting() {
            when(lichThiRepository.findById(1)).thenReturn(Optional.of(sampleLichThi));
            when(lichThiRepository.findByLopIdAndMonHocIdAndLoaiKiemTraAndHocKyAndNamHoc(
                    anyInt(), anyInt(), any(), anyInt(), any())).thenReturn(Optional.empty());
            when(lichThiRepository.save(any(LichThi.class))).thenAnswer(inv -> inv.getArgument(0));

            LichThi updated = new LichThi();
            updated.setLop(sampleLop);
            updated.setMonHoc(sampleMonHoc);
            updated.setNgayThi(java.time.LocalDate.of(2025, 5, 15));
            updated.setGioBatDau(java.time.LocalTime.of(8, 0));
            updated.setThoiGianLamBai(90);
            updated.setPhongThi("P.999");
            updated.setLoaiKiemTra("CK");
            updated.setHocKy(2);
            updated.setNamHoc("2024-2025");

            LichThi result = lichThiService.update(1, updated);

            assertThat(result.getId()).isEqualTo(1);
            assertThat(result.getPhongThi()).isEqualTo("P.999");
            verify(lichThiRepository).save(any(LichThi.class));
        }

        @Test
        @DisplayName("should throw when updating non-existent")
        void throwsWhenNotFound() {
            when(lichThiRepository.findById(99)).thenReturn(Optional.empty());

            LichThi updated = new LichThi();
            updated.setLop(sampleLop);
            updated.setMonHoc(sampleMonHoc);
            updated.setNgayThi(java.time.LocalDate.of(2025, 5, 15));
            updated.setGioBatDau(java.time.LocalTime.of(8, 0));
            updated.setThoiGianLamBai(90);
            updated.setLoaiKiemTra("CK");
            updated.setHocKy(2);
            updated.setNamHoc("2024-2025");

            assertThatThrownBy(() -> lichThiService.update(99, updated))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("delete()")
    class Delete {
        @Test
        @DisplayName("should delete by id")
        void deletesById() {
            doNothing().when(lichThiRepository).deleteById(1);

            lichThiService.delete(1);

            verify(lichThiRepository).deleteById(1);
        }
    }
}
