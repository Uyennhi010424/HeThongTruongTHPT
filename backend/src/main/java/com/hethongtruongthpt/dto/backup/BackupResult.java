package com.hethongtruongthpt.dto.backup;

import java.time.LocalDateTime;

public class BackupResult {
    private boolean success;
    private String filename;
    private long fileSize;
    private LocalDateTime createdAt;
    private String message;

    public BackupResult() {
    }

    public BackupResult(boolean success, String filename, long fileSize, LocalDateTime createdAt, String message) {
        this.success = success;
        this.filename = filename;
        this.fileSize = fileSize;
        this.createdAt = createdAt;
        this.message = message;
    }

    public static BackupResult ofSuccess(String filename, long fileSize) {
        return new BackupResult(true, filename, fileSize, LocalDateTime.now(), "Sao lưu thành công");
    }

    public static BackupResult ofFailure(String message) {
        return new BackupResult(false, null, 0, LocalDateTime.now(), message);
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public long getFileSize() {
        return fileSize;
    }

    public void setFileSize(long fileSize) {
        this.fileSize = fileSize;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
