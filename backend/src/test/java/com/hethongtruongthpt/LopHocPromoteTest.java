package com.hethongtruongthpt;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import com.hethongtruongthpt.service.LopHocService;
import com.hethongtruongthpt.dto.lophoc.LopHocPromoteRequest;
import java.util.Map;

@SpringBootTest
public class LopHocPromoteTest {

    @Autowired
    private LopHocService lopHocService;

    @Test
    public void testPromote() {
        System.out.println("====== START TEST PROMOTE ======");
        try {
            Map<String, Object> result = lopHocService.promoteStudents("2025-2026", "2026-2027");
            System.out.println("Result: " + result);
        } catch (Exception e) {
            e.printStackTrace();
        }
        System.out.println("====== END TEST PROMOTE ======");
    }
}
