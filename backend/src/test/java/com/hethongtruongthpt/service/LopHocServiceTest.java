package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.LopHocRepository;
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
@DisplayName("LopHocService")
@SuppressWarnings("null")
class LopHocServiceTest {

    @Mock
    private LopHocRepository lopHocRepository;

    @InjectMocks
    private LopHocService lopHocService;

    private LopHoc sampleLopHoc;

    @BeforeEach
    void setUp() {
        sampleLopHoc = new LopHoc();
        sampleLopHoc.setId(1);
        sampleLopHoc.setTenLop("10A1");
        sampleLopHoc.setKhoi(10);
        sampleLopHoc.setNamHoc("2024-2025");
        sampleLopHoc.setSiSo(40);
    }

    @Nested
    @DisplayName("getAll()")
    class GetAll {
        @Test
        @DisplayName("should return all lop hoc")
        void returnsAll() {
            when(lopHocRepository.findAll()).thenReturn(List.of(sampleLopHoc));

            List<LopHoc> result = lopHocService.getAll();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTenLop()).isEqualTo("10A1");
        }
    }

    @Nested
    @DisplayName("getById()")
    class GetById {
        @Test
        @DisplayName("should return lop hoc when found")
        void returnsWhenFound() {
            when(lopHocRepository.findById(1)).thenReturn(Optional.of(sampleLopHoc));

            LopHoc result = lopHocService.getById(1);

            assertThat(result.getTenLop()).isEqualTo("10A1");
        }

        @Test
        @DisplayName("should throw when not found")
        void throwsWhenNotFound() {
            when(lopHocRepository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> lopHocService.getById(99))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("create()")
    class Create {
        @Test
        @DisplayName("should create new lop hoc successfully")
        void createsSuccessfully() {
            LopHoc newLop = new LopHoc();
            newLop.setTenLop("11A1");
            newLop.setKhoi(11);
            newLop.setNamHoc("2024-2025");

            when(lopHocRepository.findByTenLopAndNamHoc("11A1", "2024-2025"))
                    .thenReturn(Optional.empty());
            when(lopHocRepository.save(any(LopHoc.class))).thenAnswer(inv -> inv.getArgument(0));

            LopHoc result = lopHocService.create(newLop);

            assertThat(result.getTenLop()).isEqualTo("11A1");
            verify(lopHocRepository).save(any(LopHoc.class));
        }

        @Test
        @DisplayName("should throw when ten lop is blank")
        void throwsWhenTenLopBlank() {
            LopHoc newLop = new LopHoc();
            newLop.setTenLop("");
            newLop.setKhoi(10);
            newLop.setNamHoc("2024-2025");

            assertThatThrownBy(() -> lopHocService.create(newLop))
                    .isInstanceOf(ApiException.class);
        }

        @Test
        @DisplayName("should throw when khoi is null")
        void throwsWhenKhoiNull() {
            LopHoc newLop = new LopHoc();
            newLop.setTenLop("10A1");
            newLop.setKhoi(null);
            newLop.setNamHoc("2024-2025");

            assertThatThrownBy(() -> lopHocService.create(newLop))
                    .isInstanceOf(ApiException.class);
        }

        @Test
        @DisplayName("should throw when nam hoc is blank")
        void throwsWhenNamHocBlank() {
            LopHoc newLop = new LopHoc();
            newLop.setTenLop("10A1");
            newLop.setKhoi(10);
            newLop.setNamHoc("");

            assertThatThrownBy(() -> lopHocService.create(newLop))
                    .isInstanceOf(ApiException.class);
        }

        @Test
        @DisplayName("should throw when ten lop does not start with 10/11/12")
        void throwsWhenInvalidGradePrefix() {
            LopHoc newLop = new LopHoc();
            newLop.setTenLop("9A1");
            newLop.setKhoi(9);
            newLop.setNamHoc("2024-2025");

            assertThatThrownBy(() -> lopHocService.create(newLop))
                    .isInstanceOf(ApiException.class);
        }

        @Test
        @DisplayName("should throw when ten lop does not match khoi")
        void throwsWhenKhoiMismatch() {
            LopHoc newLop = new LopHoc();
            newLop.setTenLop("10A1");
            newLop.setKhoi(11);
            newLop.setNamHoc("2024-2025");

            assertThatThrownBy(() -> lopHocService.create(newLop))
                    .isInstanceOf(ApiException.class);
        }

        @Test
        @DisplayName("should throw when lop already exists for nam hoc")
        void throwsWhenDuplicate() {
            LopHoc newLop = new LopHoc();
            newLop.setTenLop("10A1");
            newLop.setKhoi(10);
            newLop.setNamHoc("2024-2025");

            when(lopHocRepository.findByTenLopAndNamHoc("10A1", "2024-2025"))
                    .thenReturn(Optional.of(sampleLopHoc));

            assertThatThrownBy(() -> lopHocService.create(newLop))
                    .isInstanceOf(ApiException.class);
        }
    }

    @Nested
    @DisplayName("update()")
    class Update {
        @Test
        @DisplayName("should update existing lop hoc")
        void updatesExisting() {
            when(lopHocRepository.findById(1)).thenReturn(Optional.of(sampleLopHoc));
            when(lopHocRepository.findByTenLopAndNamHoc("10A2", "2024-2025"))
                    .thenReturn(Optional.empty());
            when(lopHocRepository.save(any(LopHoc.class))).thenAnswer(inv -> inv.getArgument(0));

            LopHoc updated = new LopHoc();
            updated.setTenLop("10A2");
            updated.setKhoi(10);
            updated.setNamHoc("2024-2025");

            LopHoc result = lopHocService.update(1, updated);

            assertThat(result.getId()).isEqualTo(1);
            assertThat(result.getTenLop()).isEqualTo("10A2");
        }

        @Test
        @DisplayName("should throw when updating non-existent")
        void throwsWhenNotFound() {
            when(lopHocRepository.findById(99)).thenReturn(Optional.empty());

            LopHoc updated = new LopHoc();
            updated.setTenLop("10A1");
            updated.setKhoi(10);
            updated.setNamHoc("2024-2025");

            assertThatThrownBy(() -> lopHocService.update(99, updated))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("should throw when updating to duplicate ten lop + nam hoc")
        void throwsWhenDuplicate() {
            LopHoc otherLop = new LopHoc();
            otherLop.setId(2);
            otherLop.setTenLop("10A2");
            otherLop.setKhoi(10);
            otherLop.setNamHoc("2024-2025");

            when(lopHocRepository.findById(1)).thenReturn(Optional.of(sampleLopHoc));
            when(lopHocRepository.findByTenLopAndNamHoc("10A2", "2024-2025"))
                    .thenReturn(Optional.of(otherLop));

            LopHoc updated = new LopHoc();
            updated.setTenLop("10A2");
            updated.setKhoi(10);
            updated.setNamHoc("2024-2025");

            assertThatThrownBy(() -> lopHocService.update(1, updated))
                    .isInstanceOf(ApiException.class);
        }
    }

    @Nested
    @DisplayName("delete()")
    class Delete {
        @Test
        @DisplayName("should delete by id")
        void deletesById() {
            doNothing().when(lopHocRepository).deleteById(1);

            lopHocService.delete(1);

            verify(lopHocRepository).deleteById(1);
        }
    }
}
