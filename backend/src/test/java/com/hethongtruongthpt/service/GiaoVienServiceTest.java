package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.giaovien.GiaoVienDTO;
import com.hethongtruongthpt.entity.GiaoVien;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.*;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("GiaoVienService")
class GiaoVienServiceTest {

    @Mock private GiaoVienRepository giaoVienRepository;
    @Mock private UserRepository userRepository;
    @Mock private ChuNhiemRepository chuNhiemRepository;
    @Mock private PhanCongDayRepository phanCongDayRepository;
    @Mock private ThoiKhoaBieuRepository thoiKhoaBieuRepository;
    @Mock private HanhKiemRepository hanhKiemRepository;
    @Mock private DiemRepository diemRepository;
    @Mock private MonHocRepository monHocRepository;
    @Mock private com.hethongtruongthpt.util.DefaultAccountPasswordPolicy passwordPolicy;
    @Mock private UserService userService;
    @Mock private LopHocRepository lopHocRepository;

    @InjectMocks
    private GiaoVienService giaoVienService;

    private GiaoVien sampleGiaoVien;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId(1);
        sampleUser.setUsername("tienntc3@tdu.edu.vn");

        sampleGiaoVien = new GiaoVien();
        sampleGiaoVien.setId(1);
        sampleGiaoVien.setMaGiaoVien("GV0001");
        sampleGiaoVien.setHoTen("Nguyễn Thị Cẩm Tiên");
        sampleGiaoVien.setEmail("tienntc3@tdu.edu.vn");
        sampleGiaoVien.setSoDienThoai("0901234567");
        sampleGiaoVien.setBoMon("Ngữ văn");
        sampleGiaoVien.setTrinhDo("Cử nhân");
        sampleGiaoVien.setGioiTinh(false);
        sampleGiaoVien.setUser(sampleUser);
    }

    @Nested
    @DisplayName("getAll()")
    class GetAll {
        @Test
        @DisplayName("should return all teachers as DTO")
        void returnsAllAsDto() {
            when(monHocRepository.findAll()).thenReturn(List.of());
            when(giaoVienRepository.findAll()).thenReturn(List.of(sampleGiaoVien));

            List<GiaoVienDTO> result = giaoVienService.getAll();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getHoTen()).isEqualTo("Nguyễn Thị Cẩm Tiên");
            assertThat(result.get(0).getUsername()).isEqualTo("tienntc3@tdu.edu.vn");
            verify(giaoVienRepository).findAll();
        }
    }

    @Nested
    @DisplayName("getById()")
    class GetById {
        @Test
        @DisplayName("should return teacher DTO when found")
        void returnsDtoWhenFound() {
            when(giaoVienRepository.findById(1)).thenReturn(Optional.of(sampleGiaoVien));

            GiaoVienDTO result = giaoVienService.getById(1);

            assertThat(result.getId()).isEqualTo(1);
            assertThat(result.getMaGiaoVien()).isEqualTo("GV0001");
        }

        @Test
        @DisplayName("should throw when not found")
        void throwsWhenNotFound() {
            when(giaoVienRepository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> giaoVienService.getById(99))
                .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("create()")
    class Create {
        @Test
        @DisplayName("should throw when hoTen is blank")
        void throwsWhenHoTenBlank() {
            GiaoVien input = new GiaoVien();
            input.setHoTen("");

            assertThatThrownBy(() -> giaoVienService.create(input))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("họ tên");
        }
    }

    @Nested
    @DisplayName("delete()")
    class Delete {
        @Test
        @DisplayName("should delete when no constraints")
        void deletesWhenNoConstraints() {
            when(giaoVienRepository.existsById(1)).thenReturn(true);
            when(chuNhiemRepository.findById_GiaoVienId(1)).thenReturn(List.of());
            when(phanCongDayRepository.findByGiaoVienId(1)).thenReturn(List.of());
            when(thoiKhoaBieuRepository.findByGiaoVienId(1)).thenReturn(List.of());
            when(hanhKiemRepository.findByGiaoVienId(1)).thenReturn(List.of());
            when(diemRepository.existsByGiaoVienNhapId(1)).thenReturn(false);

            giaoVienService.delete(1);

            verify(giaoVienRepository).deleteById(1);
        }

        @Test
        @DisplayName("should throw when teacher has homeroom assignment")
        void throwsWhenHasHomeroom() {
            when(giaoVienRepository.existsById(1)).thenReturn(true);
            when(chuNhiemRepository.findById_GiaoVienId(1)).thenReturn(List.of(new com.hethongtruongthpt.entity.ChuNhiem()));

            assertThatThrownBy(() -> giaoVienService.delete(1))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("chủ nhiệm");
        }

        @Test
        @DisplayName("should throw when teacher has scores")
        void throwsWhenHasScores() {
            when(giaoVienRepository.existsById(1)).thenReturn(true);
            when(chuNhiemRepository.findById_GiaoVienId(1)).thenReturn(List.of());
            when(phanCongDayRepository.findByGiaoVienId(1)).thenReturn(List.of());
            when(thoiKhoaBieuRepository.findByGiaoVienId(1)).thenReturn(List.of());
            when(hanhKiemRepository.findByGiaoVienId(1)).thenReturn(List.of());
            when(diemRepository.existsByGiaoVienNhapId(1)).thenReturn(true);

            assertThatThrownBy(() -> giaoVienService.delete(1))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("dữ liệu điểm");
        }
    }

    @Nested
    @DisplayName("validateTeacher()")
    class ValidateTeacher {
        @Test
        @DisplayName("should reject invalid phone number")
        void rejectsInvalidPhone() {
            GiaoVien input = new GiaoVien();
            input.setHoTen("Nguyễn Test");
            input.setSoDienThoai("123");

            assertThatThrownBy(() -> giaoVienService.create(input))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Số điện thoại");
        }

        @Test
        @DisplayName("should reject future birth date")
        void rejectsFutureBirthDate() {
            GiaoVien input = new GiaoVien();
            input.setHoTen("Nguyễn Test");
            input.setNgaySinh(java.time.LocalDate.now().plusDays(1));

            assertThatThrownBy(() -> giaoVienService.create(input))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("tương lai");
        }
    }
}
