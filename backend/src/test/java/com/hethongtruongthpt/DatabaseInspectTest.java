package com.hethongtruongthpt;

import com.hethongtruongthpt.entity.HocBa;
import com.hethongtruongthpt.repository.HocBaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@SpringBootTest
public class DatabaseInspectTest {

    @Autowired private HocBaRepository hocBaRepository;

    @Test
    public void inspect() {
        System.out.println("====== CALLING HOCBA GROUP BY HOCLUC ======");
        List<HocBa> list = hocBaRepository.findAll();
        Map<String, Long> grouped = list.stream()
            .filter(hb -> hb.getHocLuc() != null)
            .collect(Collectors.groupingBy(HocBa::getHocLuc, Collectors.counting()));
        System.out.println("HocBa Grouped by HocLuc:");
        System.out.println(grouped);
        System.out.println("====== END CALLING ======");
    }
}
