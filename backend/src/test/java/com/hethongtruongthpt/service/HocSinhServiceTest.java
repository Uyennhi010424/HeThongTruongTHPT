package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.enums.RoleEnum;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.*;
import com.hethongtruongthpt.util.DefaultAccountPasswordPolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("HocSinhService")
@SuppressWarnings("null")
class HocSinhServiceTest {

    @Mock
    private HocSinhRepository hocSinhRepository;

    @Mock
    private LopHocRepository lopHocRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private PhuHuynhRepository phuHuynhRepository;

    @Mock
    private PhuHuynhHocSinhRepository phuHuynhHocSinhRepository;

    @Mock
    private LichSuHocTapRepository lichSuHocTapRepository;

    @Mock
    private DefaultAccountPasswordPolicy passwordPolicy;

    @Mock
    private PlatformTransactionManager transactionManager;

    @Mock
    private TransactionTemplate transactionTemplate;

    @InjectMocks
    private HocSinhService hocSinhService;

    private HocSinh sampleHocSinh;
    private LopHoc sampleLop;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        when(transactionTemplate.getTransactionManager()).thenReturn(transactionManager);
        when(transactionManager.getTransaction(any())).thenReturn(mock(TransactionStatus.class));

        sampleLop = new LopHoc();
        sampleLop.setId(1);
        sampleLop.setTenLop("10A1");
        sampleLop.setKhoi(10);
        sampleLop.setNamHoc("2024-2025");
        sampleLop.setSiSo(40);

        sampleUser = new User();
        sampleUser.setId(1);
        sampleUser.setUsername("hocsinh@tdu.edu.vn");
        sampleUser.setRole(RoleEnum.HOC_SINH);
        sampleUser.setIsActive(true);

        sampleHocSinh = new HocSinh();
        sampleHocSinh.setId(1);
        sampleHocSinh.setHoTen("Nguyen Van A");
        sampleHocSinh.setMaHocSinh("HS2024");
        sampleHocSinh.setNgaySinh(LocalDate.of(2008, 1, 15));
        sampleHocSinh.setGioiTinh("NAM");
        sampleHocSinh.setLop(sampleLop);
        sampleHocSinh.setUser(sampleUser);
        sampleHocSinh.setTrangThai(1);
        sampleHocSinh.setNamNhapHoc(2024);
    }

    @Nested
    @DisplayName("getAll()")
    class GetAll {
        @Test
        @DisplayName("should return all hoc sinh")
        void returnsAll() {
            when(hocSinhRepository.findAllWithLop()).thenReturn(List.of(sampleHocSinh));
            when(phuHuynhHocSinhRepository.findByHocSinhIdIn(anyList())).thenReturn(List.of());

            List<HocSinh> result = hocSinhService.getAll();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getHoTen()).isEqualTo("Nguyen Van A");
        }
    }

    @Nested
    @DisplayName("getById()")
    class GetById {
        @Test
        @DisplayName("should return hoc sinh when found")
        void returnsWhenFound() {
            when(hocSinhRepository.findByIdWithLop(1)).thenReturn(Optional.of(sampleHocSinh));
            when(phuHuynhHocSinhRepository.findByHocSinhIdIn(anyList())).thenReturn(List.of());

            HocSinh result = hocSinhService.getById(1);

            assertThat(result.getHoTen()).isEqualTo("Nguyen Van A");
        }

        @Test
        @DisplayName("should throw when not found")
        void throwsWhenNotFound() {
            when(hocSinhRepository.findByIdWithLop(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> hocSinhService.getById(99))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("getByUsername()")
    class GetByUsername {
        @Test
        @DisplayName("should return hoc sinh when email matches")
        void returnsWhenFound() {
            when(hocSinhRepository.findByEmailIgnoreCase("hocsinh@tdu.edu.vn"))
                    .thenReturn(Optional.of(sampleHocSinh));
            when(phuHuynhHocSinhRepository.findByHocSinhIdIn(anyList()))
                    .thenReturn(List.of());

            HocSinh result = hocSinhService.getByUsername("hocsinh@tdu.edu.vn");

            assertThat(result).isNotNull();
            assertThat(result.getHoTen()).isEqualTo("Nguyen Van A");
        }

        @Test
        @DisplayName("should return null when username is blank")
        void returnsNullWhenBlank() {
            HocSinh result = hocSinhService.getByUsername("  ");

            assertThat(result).isNull();
            verifyNoInteractions(hocSinhRepository);
        }

        @Test
        @DisplayName("should return null when not found")
        void returnsNullWhenNotFound() {
            when(hocSinhRepository.findByEmailIgnoreCase("unknown@tdu.edu.vn"))
                    .thenReturn(Optional.empty());

            HocSinh result = hocSinhService.getByUsername("unknown@tdu.edu.vn");

            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("getByLopId()")
    class GetByLopId {
        @Test
        @DisplayName("should return list by lop id")
        void returnsByLopId() {
            when(hocSinhRepository.findByLopIdAndTrangThai(1, 1)).thenReturn(List.of(sampleHocSinh));
            when(phuHuynhHocSinhRepository.findByHocSinhIdIn(anyList()))
                    .thenReturn(List.of());

            List<HocSinh> result = hocSinhService.getByLopId(1);

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("countByLopId()")
    class CountByLopId {
        @Test
        @DisplayName("should return count by lop id")
        void returnsCount() {
            when(hocSinhRepository.countByLopId(1)).thenReturn(25L);

            long result = hocSinhService.countByLopId(1);

            assertThat(result).isEqualTo(25L);
        }
    }

    @Nested
    @DisplayName("countByTrangThai()")
    class CountByTrangThai {
        @Test
        @DisplayName("should return count by trang thai")
        void returnsCount() {
            when(hocSinhRepository.countByTrangThai(1)).thenReturn(100L);

            long result = hocSinhService.countByTrangThai(1);

            assertThat(result).isEqualTo(100L);
        }
    }

    @Nested
    @DisplayName("create()")
    class Create {
        @Test
        @DisplayName("should create new hoc sinh successfully")
        void createsSuccessfully() {
            HocSinh newHs = new HocSinh();
            newHs.setHoTen("Tran Thi B");
            newHs.setNgaySinh(LocalDate.of(2008, 5, 20));
            newHs.setGioiTinh("NU");
            newHs.setNamNhapHoc(2024);
            LopHoc lopRef = new LopHoc();
            lopRef.setId(1);
            newHs.setLop(lopRef);

            when(lopHocRepository.findById(1)).thenReturn(Optional.of(sampleLop));
            when(hocSinhRepository.findActiveDuplicateInClass(anyString(), any(LocalDate.class), anyInt()))
                    .thenReturn(List.of());
            when(passwordPolicy.getStudentDefaultPassword()).thenReturn("Abc1234@");
            when(userRepository.findByUsername(anyString())).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPwd");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                u.setId(100);
                return u;
            });
            when(hocSinhRepository.findByMaHocSinh(anyString())).thenReturn(Optional.empty());
            when(hocSinhRepository.save(any(HocSinh.class))).thenAnswer(inv -> {
                HocSinh hs = inv.getArgument(0);
                hs.setId(50);
                return hs;
            });
            when(hocSinhRepository.findById(50)).thenReturn(Optional.of(sampleHocSinh));
            when(phuHuynhHocSinhRepository.findByHocSinhIdIn(anyList())).thenReturn(List.of());

            HocSinh result = hocSinhService.create(newHs);

            assertThat(result).isNotNull();
            verify(hocSinhRepository).save(any(HocSinh.class));
        }

        @Test
        @DisplayName("should throw when lop id is null")
        void throwsWhenLopIdNull() {
            HocSinh newHs = new HocSinh();
            newHs.setHoTen("Tran Thi B");
            newHs.setLop(new LopHoc()); // id is null

            assertThatThrownBy(() -> hocSinhService.create(newHs))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("should throw when lop not found")
        void throwsWhenLopNotFound() {
            HocSinh newHs = new HocSinh();
            newHs.setHoTen("Tran Thi B");
            LopHoc lopRef = new LopHoc();
            lopRef.setId(999);
            newHs.setLop(lopRef);

            when(lopHocRepository.findById(999)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> hocSinhService.create(newHs))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("should throw when duplicate student in same class")
        void throwsWhenDuplicateStudentInSameClass() {
            HocSinh newHs = new HocSinh();
            newHs.setHoTen("Nguyen Van A");
            newHs.setNgaySinh(LocalDate.of(2008, 1, 15));
            newHs.setGioiTinh("NAM");
            newHs.setNamNhapHoc(2024);
            LopHoc lopRef = new LopHoc();
            lopRef.setId(1);
            newHs.setLop(lopRef);

            when(lopHocRepository.findById(1)).thenReturn(Optional.of(sampleLop));
            when(hocSinhRepository.findActiveDuplicateInClass(eq("Nguyen Van A"), eq(LocalDate.of(2008, 1, 15)), eq(1)))
                    .thenReturn(List.of(sampleHocSinh));

            assertThatThrownBy(() -> hocSinhService.create(newHs))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("đã tồn tại trong lớp");
        }

        @Test
        @DisplayName("should throw when duplicate ma bhyt")
        void throwsWhenDuplicateMaBhyt() {
            HocSinh newHs = new HocSinh();
            newHs.setHoTen("Tran Thi C");
            newHs.setNgaySinh(LocalDate.of(2008, 5, 20));
            newHs.setGioiTinh("NU");
            newHs.setNamNhapHoc(2024);
            newHs.setMaBhyt("BHYT123456");
            LopHoc lopRef = new LopHoc();
            lopRef.setId(1);
            newHs.setLop(lopRef);

            when(lopHocRepository.findById(1)).thenReturn(Optional.of(sampleLop));
            when(hocSinhRepository.findByMaBhytActive("BHYT123456"))
                    .thenReturn(List.of(sampleHocSinh));

            assertThatThrownBy(() -> hocSinhService.create(newHs))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Mã BHYT");
        }
    }

    @Nested
    @DisplayName("update()")
    class Update {
        @Test
        @DisplayName("should update existing hoc sinh")
        void updatesExisting() {
            when(hocSinhRepository.findByIdWithLop(1)).thenReturn(Optional.of(sampleHocSinh));
            when(phuHuynhHocSinhRepository.findByHocSinhIdIn(anyList())).thenReturn(List.of());
            when(lopHocRepository.findById(1)).thenReturn(Optional.of(sampleLop));
            when(hocSinhRepository.save(any(HocSinh.class))).thenAnswer(inv -> inv.getArgument(0));

            HocSinh updated = new HocSinh();
            updated.setHoTen("Nguyen Van A Updated");
            updated.setNgaySinh(LocalDate.of(2008, 1, 15));
            updated.setGioiTinh("NAM");
            LopHoc lopRef = new LopHoc();
            lopRef.setId(1);
            updated.setLop(lopRef);
            updated.setUser(sampleUser);

            HocSinh result = hocSinhService.update(1, updated);

            assertThat(result).isNotNull();
            verify(hocSinhRepository).save(any(HocSinh.class));
        }

        @Test
        @DisplayName("should throw when updating non-existent")
        void throwsWhenNotFound() {
            when(hocSinhRepository.findByIdWithLop(99)).thenReturn(Optional.empty());

            HocSinh updated = new HocSinh();
            updated.setHoTen("Test");

            assertThatThrownBy(() -> hocSinhService.update(99, updated))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("should keep existing lop when lop is null in update")
        void keepsExistingLopWhenNull() {
            HocSinh existing = new HocSinh();
            existing.setId(1);
            existing.setHoTen("Nguyen Van A");
            existing.setLop(sampleLop);
            existing.setUser(sampleUser);

            when(hocSinhRepository.findByIdWithLop(1)).thenReturn(Optional.of(existing));
            when(phuHuynhHocSinhRepository.findByHocSinhIdIn(anyList())).thenReturn(List.of());
            when(hocSinhRepository.save(any(HocSinh.class))).thenAnswer(inv -> inv.getArgument(0));

            HocSinh updated = new HocSinh();
            updated.setHoTen("Nguyen Van A Updated");
            // lop is null

            HocSinh result = hocSinhService.update(1, updated);

            assertThat(result).isNotNull();
            verify(hocSinhRepository).save(any(HocSinh.class));
        }
    }

    @Nested
    @DisplayName("delete()")
    class Delete {
        @Test
        @DisplayName("should soft delete by setting trang thai to 0")
        void softDeletes() {
            when(hocSinhRepository.findByIdWithLop(1)).thenReturn(Optional.of(sampleHocSinh));
            when(phuHuynhHocSinhRepository.findByHocSinhIdIn(anyList())).thenReturn(List.of());
            when(hocSinhRepository.save(any(HocSinh.class))).thenAnswer(inv -> inv.getArgument(0));

            hocSinhService.delete(1);

            verify(hocSinhRepository).save(argThat(hs -> hs.getTrangThai() == 0));
        }

        @Test
        @DisplayName("should throw when deleting non-existent")
        void throwsWhenNotFound() {
            when(hocSinhRepository.findByIdWithLop(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> hocSinhService.delete(99))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
