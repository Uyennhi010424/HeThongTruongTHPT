package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.NamHoc;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.NamHocRepository;
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
@DisplayName("NamHocService")
@SuppressWarnings("null")
class NamHocServiceTest {

    @Mock
    private NamHocRepository namHocRepository;

    @InjectMocks
    private NamHocService namHocService;

    private NamHoc sampleNamHoc;

    @BeforeEach
    void setUp() {
        sampleNamHoc = new NamHoc();
        sampleNamHoc.setId(1);
        sampleNamHoc.setTenNamHoc("2024-2025");
        sampleNamHoc.setTrangThai("DANG_MO");
    }

    @Nested
    @DisplayName("getAll()")
    class GetAll {
        @Test
        @DisplayName("should return all nam hoc")
        void returnsAll() {
            when(namHocRepository.findAll()).thenReturn(List.of(sampleNamHoc));

            List<NamHoc> result = namHocService.getAll();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTenNamHoc()).isEqualTo("2024-2025");
        }
    }

    @Nested
    @DisplayName("getById()")
    class GetById {
        @Test
        @DisplayName("should return nam hoc when found")
        void returnsWhenFound() {
            when(namHocRepository.findById(1)).thenReturn(Optional.of(sampleNamHoc));

            NamHoc result = namHocService.getById(1);

            assertThat(result.getTenNamHoc()).isEqualTo("2024-2025");
        }

        @Test
        @DisplayName("should throw when not found")
        void throwsWhenNotFound() {
            when(namHocRepository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> namHocService.getById(99))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("create()")
    class Create {
        @Test
        @DisplayName("should auto-generate ID when null")
        void autoGeneratesId() {
            NamHoc newNamHoc = new NamHoc();
            newNamHoc.setTenNamHoc("2025-2026");

            when(namHocRepository.findMaxId()).thenReturn(5);
            when(namHocRepository.save(any(NamHoc.class))).thenAnswer(inv -> inv.getArgument(0));

            NamHoc result = namHocService.create(newNamHoc);

            assertThat(result.getId()).isEqualTo(6);
            assertThat(result.getTenNamHoc()).isEqualTo("2025-2026");
            verify(namHocRepository).save(any(NamHoc.class));
        }

        @Test
        @DisplayName("should keep existing ID when provided")
        void keepsExistingId() {
            NamHoc newNamHoc = new NamHoc();
            newNamHoc.setId(10);
            newNamHoc.setTenNamHoc("2025-2026");

            when(namHocRepository.save(any(NamHoc.class))).thenAnswer(inv -> inv.getArgument(0));

            NamHoc result = namHocService.create(newNamHoc);

            assertThat(result.getId()).isEqualTo(10);
            verify(namHocRepository, never()).findMaxId();
        }
    }

    @Nested
    @DisplayName("update()")
    class Update {
        @Test
        @DisplayName("should update existing nam hoc")
        void updatesExisting() {
            when(namHocRepository.findById(1)).thenReturn(Optional.of(sampleNamHoc));
            when(namHocRepository.save(any(NamHoc.class))).thenAnswer(inv -> inv.getArgument(0));

            NamHoc updated = new NamHoc();
            updated.setTenNamHoc("2024-2025 (updated)");

            NamHoc result = namHocService.update(1, updated);

            assertThat(result.getId()).isEqualTo(1);
            assertThat(result.getTenNamHoc()).isEqualTo("2024-2025 (updated)");
        }

        @Test
        @DisplayName("should throw when updating non-existent")
        void throwsWhenNotFound() {
            when(namHocRepository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> namHocService.update(99, new NamHoc()))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("delete()")
    class Delete {
        @Test
        @DisplayName("should delete by id")
        void deletesById() {
            doNothing().when(namHocRepository).deleteById(1);

            namHocService.delete(1);

            verify(namHocRepository).deleteById(1);
        }
    }
}
