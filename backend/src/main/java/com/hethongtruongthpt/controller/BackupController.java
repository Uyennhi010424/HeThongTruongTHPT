package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.dto.backup.BackupInfo;
import com.hethongtruongthpt.dto.backup.BackupResult;
import com.hethongtruongthpt.service.BackupService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/admin/backup")
@PreAuthorize("hasRole('ADMIN')")
public class BackupController {
    private final BackupService backupService;

    public BackupController(BackupService backupService) {
        this.backupService = backupService;
    }

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<BackupResult>> createBackup() {
        BackupResult result = backupService.createBackup();
        if (result.isSuccess()) {
            return ResponseEntity.ok(ApiResponse.ok("Tạo bản sao lưu thành công", result));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error(result.getMessage()));
    }

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<BackupInfo>>> listBackups() {
        List<BackupInfo> backups = backupService.listBackups();
        return ResponseEntity.ok(ApiResponse.ok(backups));
    }

    @PostMapping("/restore")
    public ResponseEntity<ApiResponse<String>> restoreBackup(@RequestParam String filename) {
        boolean success = backupService.restoreBackup(filename);
        if (success) {
            return ResponseEntity.ok(ApiResponse.ok("Phục hồi thành công từ: " + filename, filename));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Phục hồi thất bại từ: " + filename));
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadBackup(@RequestParam String filename) {
        try {
            Path filePath = backupService.getBackupFilePath(filename);
            Resource resource = new FileSystemResource(filePath.toFile());

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(resource.contentLength())
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
