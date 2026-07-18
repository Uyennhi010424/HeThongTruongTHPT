package com.hethongtruongthpt;

import com.hethongtruongthpt.repository.ThoiKhoaBieuRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class ClearTimetableTest {

    @Autowired
    private ThoiKhoaBieuRepository repo;

    @Test
    public void clearAllTimetable() {
        System.out.println("====== START CLEAR TIMETABLE ======");
        repo.deleteAll();
        System.out.println("====== CLEAR TIMETABLE SUCCESS ======");
    }
}
