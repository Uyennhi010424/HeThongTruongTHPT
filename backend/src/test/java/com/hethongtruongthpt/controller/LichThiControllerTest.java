package com.hethongtruongthpt.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hethongtruongthpt.config.JwtTokenProvider;
import com.hethongtruongthpt.entity.LichThi;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.UserRepository;
import com.hethongtruongthpt.service.LichThiService;
import com.hethongtruongthpt.service.LichThiPdfService;
import com.hethongtruongthpt.service.TokenBlacklistCache;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(LichThiController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("LichThiController")
@SuppressWarnings("null")
class LichThiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private LichThiService lichThiService;

    @MockBean
    private LichThiPdfService lichThiPdfService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private TokenBlacklistCache tokenBlacklistCache;

    @MockBean
    private UserRepository userRepository;

    private LichThi sampleLichThi;

    @BeforeEach
    void setUp() {
        sampleLichThi = new LichThi();
        sampleLichThi.setId(1);
        sampleLichThi.setNgayThi(LocalDate.of(2025, 5, 15));
        sampleLichThi.setGioBatDau(LocalTime.of(8, 0));
        sampleLichThi.setThoiGianLamBai(90);
        sampleLichThi.setPhongThi("P.402");
        sampleLichThi.setHocKy(2);
        sampleLichThi.setNamHoc("2024-2025");
    }

    @Nested
    @DisplayName("GET /api/lichthi")
    class GetAll {
        @Test
        @DisplayName("should return all lich thi")
        void returnsAll() throws Exception {
            when(lichThiService.getAll()).thenReturn(List.of(sampleLichThi));

            mockMvc.perform(get("/api/lichthi"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].id").value(1))
                    .andExpect(jsonPath("$.data[0].phongThi").value("P.402"));
        }

        @Test
        @DisplayName("should return empty list when no data")
        void returnsEmpty() throws Exception {
            when(lichThiService.getAll()).thenReturn(List.of());

            mockMvc.perform(get("/api/lichthi"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data").isEmpty());
        }
    }

    @Nested
    @DisplayName("GET /api/lichthi/bylop")
    class GetByLopId {
        @Test
        @DisplayName("should return lich thi filtered by lopId")
        void returnsByLopId() throws Exception {
            when(lichThiService.getByLopId(5)).thenReturn(List.of(sampleLichThi));

            mockMvc.perform(get("/api/lichthi/bylop").param("lopId", "5"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0].id").value(1));
        }
    }

    @Nested
    @DisplayName("GET /api/lichthi/{id}")
    class GetById {
        @Test
        @DisplayName("should return lich thi by id")
        void returnsById() throws Exception {
            when(lichThiService.getById(1)).thenReturn(sampleLichThi);

            mockMvc.perform(get("/api/lichthi/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.phongThi").value("P.402"));
        }

        @Test
        @DisplayName("should return error when not found")
        void returnsErrorWhenNotFound() throws Exception {
            when(lichThiService.getById(99)).thenThrow(new ResourceNotFoundException("Không tìm thấy lịch thi"));

            mockMvc.perform(get("/api/lichthi/99"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("POST /api/lichthi")
    class Create {
        @Test
        @DisplayName("should create lich thi")
        void createsLichThi() throws Exception {
            LichThi newLichThi = new LichThi();
            newLichThi.setPhongThi("P.101");
            newLichThi.setNgayThi(LocalDate.of(2025, 6, 1));
            newLichThi.setGioBatDau(LocalTime.of(9, 0));
            newLichThi.setThoiGianLamBai(60);
            newLichThi.setHocKy(1);
            newLichThi.setNamHoc("2025-2026");

            when(lichThiService.create(any(LichThi.class))).thenAnswer(inv -> {
                LichThi saved = inv.getArgument(0);
                saved.setId(2);
                return saved;
            });

            mockMvc.perform(post("/api/lichthi")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(newLichThi)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.id").value(2))
                    .andExpect(jsonPath("$.data.phongThi").value("P.101"));
        }
    }

    @Nested
    @DisplayName("PUT /api/lichthi/{id}")
    class Update {
        @Test
        @DisplayName("should update lich thi")
        void updatesLichThi() throws Exception {
            when(lichThiService.update(eq(1), any(LichThi.class))).thenAnswer(inv -> {
                LichThi updated = inv.getArgument(1);
                updated.setId(1);
                return updated;
            });

            LichThi updateData = new LichThi();
            updateData.setPhongThi("P.999");

            mockMvc.perform(put("/api/lichthi/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateData)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.phongThi").value("P.999"));
        }
    }

    @Nested
    @DisplayName("DELETE /api/lichthi/{id}")
    class Delete {
        @Test
        @DisplayName("should delete lich thi")
        void deletesLichThi() throws Exception {
            doNothing().when(lichThiService).delete(1);

            mockMvc.perform(delete("/api/lichthi/1"))
                    .andExpect(status().isOk());

            verify(lichThiService).delete(1);
        }
    }
}
