package com.hethongtruongthpt.config;

import com.hethongtruongthpt.service.GiaoVienService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class TeacherAccountSyncRunner implements CommandLineRunner {
    private final GiaoVienService giaoVienService;

    public TeacherAccountSyncRunner(GiaoVienService giaoVienService) {
        this.giaoVienService = giaoVienService;
    }

    @Override
    public void run(String... args) {
        giaoVienService.syncMissingTeacherAccounts();
    }
}
