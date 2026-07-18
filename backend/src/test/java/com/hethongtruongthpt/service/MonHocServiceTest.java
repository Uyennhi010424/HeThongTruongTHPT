package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.MonHoc;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.MonHocRepository;
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
@DisplayName("MonHocService")
@SuppressWarnings("null")
class MonHocServiceTest {

    @Mock
    private MonHocRepository monHocRepository;

    @InjectMocks
    private MonHocService monHocService;

    private MonHoc sampleMonHoc;

    @BeforeEach
    void setUp() {
        sampleMonHoc = new MonHoc();
        sampleMonHoc.setId(1);
        sampleMonHoc.setTenMon("Toan");
        sampleMonHoc.setMaMon("TOAN");
        sampleMonHoc.setNhomDanhGia("DIEM_SO");
        sampleMonHoc.setSoDtxHocKy(4);
        sampleMonHoc.setKhoiApDung("10,11,12");
        sampleMonHoc.setIsActive(true);
    }

    @Nested
    @DisplayName("getAll()")
    class GetAll {
        @Test
        @DisplayName("should return all mon hoc")
        void returnsAll() {
            when(monHocRepository.findAll()).thenReturn(List.of(sampleMonHoc));

            List<MonHoc> result = monHocService.getAll();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTenMon()).isEqualTo("Toan");
        }
    }

    @Nested
    @DisplayName("getById()")
    class GetById {
        @Test
        @DisplayName("should return mon hoc when found")
        void returnsWhenFound() {
            when(monHocRepository.findById(1)).thenReturn(Optional.of(sampleMonHoc));

            MonHoc result = monHocService.getById(1);

            assertThat(result.getTenMon()).isEqualTo("Toan");
        }

        @Test
        @DisplayName("should throw when not found")
        void throwsWhenNotFound() {
            when(monHocRepository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> monHocService.getById(99))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("create()")
    class Create {
        @Test
        @DisplayName("should create new mon hoc successfully")
        void createsSuccessfully() {
            MonHoc newMon = new MonHoc();
            newMon.setTenMon("Ngu Van");
            newMon.setIsActive(true);

            when(monHocRepository.findByTenMon("Ngu Van")).thenReturn(Optional.empty());
            when(monHocRepository.save(any(MonHoc.class))).thenAnswer(inv -> inv.getArgument(0));

            MonHoc result = monHocService.create(newMon);

            assertThat(result.getTenMon()).isEqualTo("Ngu Van");
            assertThat(result.getNhomDanhGia()).isEqualTo("DIEM_SO");
            assertThat(result.getSoDtxHocKy()).isEqualTo(4);
            verify(monHocRepository).save(any(MonHoc.class));
        }

        @Test
        @DisplayName("should throw when ten mon is blank")
        void throwsWhenTenMonBlank() {
            MonHoc newMon = new MonHoc();
            newMon.setTenMon("");

            assertThatThrownBy(() -> monHocService.create(newMon))
                    .isInstanceOf(ApiException.class);
        }

        @Test
        @DisplayName("should throw when ten mon already exists")
        void throwsWhenDuplicate() {
            MonHoc newMon = new MonHoc();
            newMon.setTenMon("Toan");

            when(monHocRepository.findByTenMon("Toan")).thenReturn(Optional.of(sampleMonHoc));

            assertThatThrownBy(() -> monHocService.create(newMon))
                    .isInstanceOf(ApiException.class);
        }
    }

    @Nested
    @DisplayName("update()")
    class Update {
        @Test
        @DisplayName("should update existing mon hoc")
        void updatesExisting() {
            when(monHocRepository.findById(1)).thenReturn(Optional.of(sampleMonHoc));
            when(monHocRepository.findByTenMon("Toan Moi")).thenReturn(Optional.empty());
            when(monHocRepository.save(any(MonHoc.class))).thenAnswer(inv -> inv.getArgument(0));

            MonHoc updated = new MonHoc();
            updated.setTenMon("Toan Moi");

            MonHoc result = monHocService.update(1, updated);

            assertThat(result.getId()).isEqualTo(1);
            assertThat(result.getTenMon()).isEqualTo("Toan Moi");
        }

        @Test
        @DisplayName("should throw when updating non-existent")
        void throwsWhenNotFound() {
            when(monHocRepository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> monHocService.update(99, new MonHoc()))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("should throw when updating to duplicate ten mon")
        void throwsWhenDuplicateTenMon() {
            MonHoc otherMon = new MonHoc();
            otherMon.setId(2);
            otherMon.setTenMon("Ngu Van");

            when(monHocRepository.findById(1)).thenReturn(Optional.of(sampleMonHoc));
            when(monHocRepository.findByTenMon("Ngu Van")).thenReturn(Optional.of(otherMon));

            MonHoc updated = new MonHoc();
            updated.setTenMon("Ngu Van");

            assertThatThrownBy(() -> monHocService.update(1, updated))
                    .isInstanceOf(ApiException.class);
        }
    }

    @Nested
    @DisplayName("delete()")
    class Delete {
        @Test
        @DisplayName("should delete by id")
        void deletesById() {
            doNothing().when(monHocRepository).deleteById(1);

            monHocService.delete(1);

            verify(monHocRepository).deleteById(1);
        }
    }
}
