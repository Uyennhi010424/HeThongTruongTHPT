package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.HanhKiem;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.NamHoc;
import com.hethongtruongthpt.enums.HanhKiemEnum;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.HanhKiemRepository;
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
@DisplayName("HanhKiemService")
@SuppressWarnings("null")
class HanhKiemServiceTest {

    @Mock
    private HanhKiemRepository hanhKiemRepository;

    @InjectMocks
    private HanhKiemService hanhKiemService;

    private HanhKiem sampleHanhKiem;

    @BeforeEach
    void setUp() {
        HocSinh hs = new HocSinh();
        hs.setId(10);

        NamHoc nh = new NamHoc();
        nh.setId(1);

        sampleHanhKiem = new HanhKiem();
        sampleHanhKiem.setId(1);
        sampleHanhKiem.setHocSinh(hs);
        sampleHanhKiem.setNamHoc(nh);
        sampleHanhKiem.setHocKy(1);
        sampleHanhKiem.setXepLoai(HanhKiemEnum.TOT);
        sampleHanhKiem.setNhanXet("Hoc sinh tot");
    }

    @Nested
    @DisplayName("getAll()")
    class GetAll {
        @Test
        @DisplayName("should return all hanh kiem")
        void returnsAll() {
            when(hanhKiemRepository.findAll()).thenReturn(List.of(sampleHanhKiem));

            List<HanhKiem> result = hanhKiemService.getAll();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getXepLoai()).isEqualTo(HanhKiemEnum.TOT);
        }
    }

    @Nested
    @DisplayName("getById()")
    class GetById {
        @Test
        @DisplayName("should return hanh kiem when found")
        void returnsWhenFound() {
            when(hanhKiemRepository.findById(1)).thenReturn(Optional.of(sampleHanhKiem));

            HanhKiem result = hanhKiemService.getById(1);

            assertThat(result.getXepLoai()).isEqualTo(HanhKiemEnum.TOT);
        }

        @Test
        @DisplayName("should throw when not found")
        void throwsWhenNotFound() {
            when(hanhKiemRepository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> hanhKiemService.getById(99))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("getByHocSinhId()")
    class GetByHocSinhId {
        @Test
        @DisplayName("should return list by hoc sinh id")
        void returnsByHocSinhId() {
            when(hanhKiemRepository.findByHocSinhId(10)).thenReturn(List.of(sampleHanhKiem));

            List<HanhKiem> result = hanhKiemService.getByHocSinhId(10);

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getByGiaoVienId()")
    class GetByGiaoVienId {
        @Test
        @DisplayName("should return list by giao vien id")
        void returnsByGiaoVienId() {
            when(hanhKiemRepository.findByGiaoVienId(5)).thenReturn(List.of(sampleHanhKiem));

            List<HanhKiem> result = hanhKiemService.getByGiaoVienId(5);

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getByHocSinhAndNamHoc()")
    class GetByHocSinhAndNamHoc {
        @Test
        @DisplayName("should return list by hoc sinh and nam hoc")
        void returnsByHocSinhAndNamHoc() {
            when(hanhKiemRepository.findByHocSinhIdAndNamHocId(10, 1))
                    .thenReturn(List.of(sampleHanhKiem));

            List<HanhKiem> result = hanhKiemService.getByHocSinhAndNamHoc(10, 1);

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getByLopAndNamHoc()")
    class GetByLopAndNamHoc {
        @Test
        @DisplayName("should return list by lop and nam hoc")
        void returnsByLopAndNamHoc() {
            when(hanhKiemRepository.findByHocSinhLopIdAndNamHocId(3, 1))
                    .thenReturn(List.of(sampleHanhKiem));

            List<HanhKiem> result = hanhKiemService.getByLopAndNamHoc(3, 1);

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getByLop()")
    class GetByLop {
        @Test
        @DisplayName("should return list by lop id")
        void returnsByLopId() {
            when(hanhKiemRepository.findByHocSinhLopId(3)).thenReturn(List.of(sampleHanhKiem));

            List<HanhKiem> result = hanhKiemService.getByLop(3);

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("create()")
    class Create {
        @Test
        @DisplayName("should save and return new hanh kiem")
        void createsHanhKiem() {
            HanhKiem newHk = new HanhKiem();
            newHk.setXepLoai(HanhKiemEnum.KHA);

            when(hanhKiemRepository.save(any(HanhKiem.class))).thenAnswer(inv -> inv.getArgument(0));

            HanhKiem result = hanhKiemService.create(newHk);

            assertThat(result.getXepLoai()).isEqualTo(HanhKiemEnum.KHA);
            verify(hanhKiemRepository).save(any(HanhKiem.class));
        }
    }

    @Nested
    @DisplayName("update()")
    class Update {
        @Test
        @DisplayName("should update existing hanh kiem")
        void updatesExisting() {
            when(hanhKiemRepository.findById(1)).thenReturn(Optional.of(sampleHanhKiem));
            when(hanhKiemRepository.save(any(HanhKiem.class))).thenAnswer(inv -> inv.getArgument(0));

            HanhKiem updated = new HanhKiem();
            updated.setXepLoai(HanhKiemEnum.YEU);
            updated.setNhanXet("Can cai thien");

            HanhKiem result = hanhKiemService.update(1, updated);

            assertThat(result.getId()).isEqualTo(1);
            assertThat(result.getXepLoai()).isEqualTo(HanhKiemEnum.YEU);
        }

        @Test
        @DisplayName("should throw when updating non-existent")
        void throwsWhenNotFound() {
            when(hanhKiemRepository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> hanhKiemService.update(99, new HanhKiem()))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("delete()")
    class Delete {
        @Test
        @DisplayName("should delete by id")
        void deletesById() {
            when(hanhKiemRepository.findById(1)).thenReturn(Optional.of(sampleHanhKiem));
            doNothing().when(hanhKiemRepository).deleteById(1);

            hanhKiemService.delete(1);

            verify(hanhKiemRepository).deleteById(1);
        }
    }

    @Nested
    @DisplayName("saveAll()")
    class SaveAll {
        @Test
        @DisplayName("should save new hanh kiem when id is null")
        void savesNewWhenIdNull() {
            HanhKiem newHk = new HanhKiem();
            newHk.setXepLoai(HanhKiemEnum.TOT);

            when(hanhKiemRepository.save(any(HanhKiem.class))).thenAnswer(inv -> inv.getArgument(0));

            List<HanhKiem> result = hanhKiemService.saveAll(List.of(newHk));

            assertThat(result).hasSize(1);
            verify(hanhKiemRepository).save(any(HanhKiem.class));
        }

        @Test
        @DisplayName("should verify existing before saving when id is present")
        void verifiesExistingBeforeSave() {
            when(hanhKiemRepository.findById(1)).thenReturn(Optional.of(sampleHanhKiem));
            when(hanhKiemRepository.save(any(HanhKiem.class))).thenAnswer(inv -> inv.getArgument(0));

            List<HanhKiem> result = hanhKiemService.saveAll(List.of(sampleHanhKiem));

            assertThat(result).hasSize(1);
            verify(hanhKiemRepository).findById(1);
            verify(hanhKiemRepository).save(any(HanhKiem.class));
        }
    }
}
