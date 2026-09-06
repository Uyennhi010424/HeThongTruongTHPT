package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.AdminConfig;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.AdminConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class AdminConfigService {
    private final AdminConfigRepository adminConfigRepository;

    public AdminConfigService(AdminConfigRepository adminConfigRepository) {
        this.adminConfigRepository = adminConfigRepository;
    }

    public List<AdminConfig> getAll() {
        return adminConfigRepository.findAll();
    }

    public AdminConfig getByKey(String key) {
        return adminConfigRepository.findByConfigKey(key).orElse(null);
    }

    @Transactional
    public AdminConfig upsert(String key, String value, String description) {
        AdminConfig config = adminConfigRepository.findByConfigKey(key).orElse(null);
        if (config != null) {
            config.setConfigValue(value);
            if (description != null) {
                config.setDescription(description);
            }
        } else {
            config = new AdminConfig();
            config.setConfigKey(key);
            config.setConfigValue(value);
            config.setDescription(description);
        }
        return adminConfigRepository.save(config);
    }

    @Transactional
    public void upsertAll(Map<String, String> configs) {
        for (Map.Entry<String, String> entry : configs.entrySet()) {
            upsert(entry.getKey(), entry.getValue(), null);
        }
    }

    @SuppressWarnings("null")
    public void deleteByKey(String key) {
        AdminConfig config = adminConfigRepository.findByConfigKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cấu hình: " + key));
        adminConfigRepository.delete(config);
    }
}
