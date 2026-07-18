package com.hethongtruongthpt;

import com.hethongtruongthpt.service.ThoiKhoaBieuService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class GenerateTest {

    @Autowired
    private ThoiKhoaBieuService service;

    @Test
    public void testGenerate() {
        System.out.println("====== START TEST GENERATE ======");
        try {
            var res = service.generateScheduleForWeek("2025-2026", 1, 1);
            System.out.println("====== GENERATE SUCCESS, CREATED: " + res.getCreated().size() + " ======");
        } catch (Exception e) {
            System.out.println("====== GENERATE FAILED ======");
            e.printStackTrace();
        }
    }
}
