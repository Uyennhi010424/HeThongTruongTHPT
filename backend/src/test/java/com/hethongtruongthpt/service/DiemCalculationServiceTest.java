package com.hethongtruongthpt.service;

import com.hethongtruongthpt.repository.DiemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class DiemCalculationServiceTest {

    @Mock
    private DiemRepository diemRepository;

    @InjectMocks
    private DiemCalculationService diemCalculationService;

    private List<Map<String, Object>> mockSummaryData;

    @BeforeEach
    void setUp() {
        mockSummaryData = new ArrayList<>();
        // Học sinh 1: Giỏi (ĐTB > 8.0)
        mockSummaryData.add(createDiemRow(1, 1, 1, 1, "TX", 8.5));
        mockSummaryData.add(createDiemRow(1, 1, 1, 2, "TX", 9.0));
        mockSummaryData.add(createDiemRow(1, 1, 1, 1, "GK", 8.0));
        mockSummaryData.add(createDiemRow(1, 1, 1, 1, "CK", 9.0));

        // Học sinh 2: Khá (ĐTB 6.5 -> 7.9)
        mockSummaryData.add(createDiemRow(2, 1, 1, 1, "TX", 6.0));
        mockSummaryData.add(createDiemRow(2, 1, 1, 2, "TX", 6.5));
        mockSummaryData.add(createDiemRow(2, 1, 1, 1, "GK", 7.0));
        mockSummaryData.add(createDiemRow(2, 1, 1, 1, "CK", 7.5));

        // Học sinh 3: Trung bình (ĐTB 5.0 -> 6.4)
        mockSummaryData.add(createDiemRow(3, 1, 1, 1, "TX", 5.0));
        mockSummaryData.add(createDiemRow(3, 1, 1, 2, "TX", 5.5));
        mockSummaryData.add(createDiemRow(3, 1, 1, 1, "GK", 5.0));
        mockSummaryData.add(createDiemRow(3, 1, 1, 1, "CK", 5.5));
        
        // Học sinh 4: Yếu (ĐTB < 5.0)
        mockSummaryData.add(createDiemRow(4, 1, 1, 1, "TX", 4.0));
        mockSummaryData.add(createDiemRow(4, 1, 1, 2, "TX", 4.5));
        mockSummaryData.add(createDiemRow(4, 1, 1, 1, "GK", 3.0));
        mockSummaryData.add(createDiemRow(4, 1, 1, 1, "CK", 4.0));
    }

    private Map<String, Object> createDiemRow(int hsId, int mhId, int hk, int stt, String loai, double diem) {
        Map<String, Object> row = new HashMap<>();
        row.put("hoc_sinh_id", hsId);
        row.put("mon_hoc_id", mhId);
        row.put("loai_diem", loai);
        row.put("so_thu_tu", stt);
        row.put("hoc_ky", hk);
        row.put("gia_tri", diem);
        row.put("khoi", 10);
        return row;
    }

    @Test
    void testGetDistribution() {
        when(diemRepository.findSummaryByNamHoc(anyString())).thenReturn(mockSummaryData);

        // Gọi hàm getDistribution cho học kỳ 1 (vì mockData toàn học kỳ 1)
        Map<String, Object> result = diemCalculationService.getDistribution("2023-2024", 1, 10);

        assertNotNull(result);
        assertEquals(4, result.get("total"));

        @SuppressWarnings("unchecked")
        Map<String, Integer> counts = (Map<String, Integer>) result.get("counts");
        assertNotNull(counts);

        // Student 1: (8.5 + 9.0 + 2*8.0 + 3*9.0) / (2 + 5) = 60.5 / 7 = 8.64 -> TOT
        assertEquals(1, counts.get("TOT"));

        // Student 2: (6.0 + 6.5 + 2*7.0 + 3*7.5) / 7 = 49 / 7 = 7.0 -> KHA
        assertEquals(1, counts.get("KHA"));

        // Student 3: (5.0 + 5.5 + 2*5.0 + 3*5.5) / 7 = 37 / 7 = 5.28 -> DAT
        assertEquals(1, counts.get("DAT"));

        // Student 4: (4.0 + 4.5 + 2*3.0 + 3*4.0) / 7 = 26.5 / 7 = 3.78 -> CHUA_DAT
        assertEquals(1, counts.get("CHUA_DAT"));
    }
}
