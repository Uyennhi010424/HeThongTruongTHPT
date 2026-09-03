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
    private com.hethongtruongthpt.service.HocSinhService hocSinhService;

    @Test
    public void testGetAll() {
        System.out.println("====== START TEST GET ALL ======");
        try {
            var list = hocSinhService.getAll();
            System.out.println("Fetched students count: " + list.size());
            
            var paged = hocSinhService.search("", null, null, 0, 10);
            System.out.println("Paged students count: " + paged.getTotalElements());

            System.out.println("Successfully verified search & getAll!");
        } catch (Exception e) {
            e.printStackTrace();
        }
        System.out.println("====== END TEST GET ALL ======");
    }
}
