package com.hethongtruongthpt.dto.backup;

import java.time.Instant;

public class BackupInfo {
    private String filename;
    private long fileSize;
    private Instant createdAt;

    public BackupInfo() {
    }

    public BackupInfo(String filename, long fileSize, Instant createdAt) {
        this.filename = filename;
        this.fileSize = fileSize;
        this.createdAt = createdAt;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
