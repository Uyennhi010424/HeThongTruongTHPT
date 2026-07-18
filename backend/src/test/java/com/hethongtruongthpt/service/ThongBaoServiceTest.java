package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.ThongBao;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.ThongBaoRepository;
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
@DisplayName("ThongBaoService")
@SuppressWarnings("null")
class ThongBaoServiceTest {

    @Mock
    private ThongBaoRepository thongBaoRepository;

    @InjectMocks
    private ThongBaoService thongBaoService;

    private ThongBao sampleThongBao;

    @BeforeEach
    void setUp() {
        sampleThongBao = new ThongBao();
        sampleThongBao.setId(1);
        sampleThongBao.setTieuDe("Thong bao test");
        sampleThongBao.setNoiDung("Noi dung test");
        sampleThongBao.setLoai("CHUNG");
    }

    @Nested
    @DisplayName("getAll()")
    class GetAll {
        @Test
        @DisplayName("should return all thong bao")
        void returnsAll() {
            when(thongBaoRepository.findAll()).thenReturn(List.of(sampleThongBao));

            List<ThongBao> result = thongBaoService.getAll();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTieuDe()).isEqualTo("Thong bao test");
        }
    }

    @Nested
    @DisplayName("getById()")
    class GetById {
        @Test
        @DisplayName("should return thong bao when found")
        void returnsWhenFound() {
            when(thongBaoRepository.findById(1)).thenReturn(Optional.of(sampleThongBao));

            ThongBao result = thongBaoService.getById(1);

            assertThat(result.getTieuDe()).isEqualTo("Thong bao test");
        }

        @Test
        @DisplayName("should throw when not found")
        void throwsWhenNotFound() {
            when(thongBaoRepository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> thongBaoService.getById(99))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("create()")
    class Create {
        @Test
        @DisplayName("should save and return new thong bao")
        void createsThongBao() {
            ThongBao newThongBao = new ThongBao();
            newThongBao.setTieuDe("Moi");
            newThongBao.setNoiDung("Noi dung moi");
            newThongBao.setLoai("CHUNG");

            when(thongBaoRepository.save(any(ThongBao.class))).thenAnswer(inv -> inv.getArgument(0));

            ThongBao result = thongBaoService.create(newThongBao);

            assertThat(result.getTieuDe()).isEqualTo("Moi");
            verify(thongBaoRepository).save(any(ThongBao.class));
        }
    }

    @Nested
    @DisplayName("update()")
    class Update {
        @Test
        @DisplayName("should update existing thong bao")
        void updatesExisting() {
            when(thongBaoRepository.findById(1)).thenReturn(Optional.of(sampleThongBao));
            when(thongBaoRepository.save(any(ThongBao.class))).thenAnswer(inv -> inv.getArgument(0));

            ThongBao updated = new ThongBao();
            updated.setTieuDe("Cap nhat");
            updated.setNoiDung("Noi dung cap nhat");

            ThongBao result = thongBaoService.update(1, updated);

            assertThat(result.getId()).isEqualTo(1);
            assertThat(result.getTieuDe()).isEqualTo("Cap nhat");
        }

        @Test
        @DisplayName("should throw when updating non-existent")
        void throwsWhenNotFound() {
            when(thongBaoRepository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> thongBaoService.update(99, new ThongBao()))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("delete()")
    class Delete {
        @Test
        @DisplayName("should delete by id")
        void deletesById() {
            doNothing().when(thongBaoRepository).deleteById(1);

            thongBaoService.delete(1);

            verify(thongBaoRepository).deleteById(1);
        }
    }
}
