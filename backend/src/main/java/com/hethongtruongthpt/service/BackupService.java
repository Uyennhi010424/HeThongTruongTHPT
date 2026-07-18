package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.backup.BackupInfo;
import com.hethongtruongthpt.dto.backup.BackupResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BackupService {
    private static final Logger log = LoggerFactory.getLogger(BackupService.class);

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String datasourceUsername;

    @Value("${spring.datasource.password}")
    private String datasourcePassword;

    @Value("${app.backup.dir:./backups}")
    private String backupDir;

    @Value("${app.backup.mysql-path:mysql}")
    private String mysqlPath;

    @Value("${app.backup.mysqldump-path:mysqldump}")
    private String mysqldumpPath;

    /**
     * Tao file sao luu co so du lieu.
     *
     * @return ket qua sao luu
     */
    public BackupResult createBackup() {
        try {
            Path backupPath = Paths.get(backupDir);
            if (!Files.exists(backupPath)) {
                Files.createDirectories(backupPath);
            }

            String dbName = extractDatabaseName(datasourceUrl);
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = String.format("backup_%s_%s.sql", dbName, timestamp);
            Path filePath = backupPath.resolve(filename);

            List<String> command = new ArrayList<>();
            command.add(mysqldumpPath);
            command.add("--host=" + extractHost(datasourceUrl));
            command.add("--port=" + extractPort(datasourceUrl));
            command.add("--user=" + datasourceUsername);
            command.add("--password=" + datasourcePassword);
            command.add("--single-transaction");
            command.add("--routines");
            command.add("--triggers");
            command.add("--events");
            command.add(dbName);

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectOutput(filePath.toFile());
            pb.redirectErrorStream(true);

            log.info("Đang tạo bản sao lưu: {}", filename);
            Process process = pb.start();
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                String errorOutput = new String(process.getInputStream().readAllBytes());
                log.error("mysqldump thất bại (exit code {}): {}", exitCode, errorOutput);
                Files.deleteIfExists(filePath);
                return BackupResult.ofFailure("Sao lưu thất bại: " + errorOutput);
            }

            long fileSize = Files.size(filePath);
            log.info("Sao lưu thành công: {} ({} bytes)", filename, fileSize);
            return BackupResult.ofSuccess(filename, fileSize);

        } catch (IOException e) {
            log.error("Lỗi I/O khi sao lưu: {}", e.getMessage(), e);
            return BackupResult.ofFailure("Lỗi I/O: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Quá trình sao lưu bị gián đoạn", e);
            return BackupResult.ofFailure("Quá trình sao lưu bị gián đoạn");
        }
    }

    /**
     * Liet ke tat ca cac file sao luu.
     *
     * @return danh sach file sao luu
     */
    public List<BackupInfo> listBackups() {
        Path backupPath = Paths.get(backupDir);
        if (!Files.exists(backupPath)) {
            return new ArrayList<>();
        }

        try {
            return Files.list(backupPath)
                    .filter(p -> p.toString().endsWith(".sql"))
                    .map(p -> {
                        File file = p.toFile();
                        Instant createdAt = Instant.ofEpochMilli(file.lastModified());
                        return new BackupInfo(file.getName(), file.length(), createdAt);
                    })
                    .sorted(Comparator.comparing(BackupInfo::getCreatedAt).reversed())
                    .collect(Collectors.toList());
        } catch (IOException e) {
            log.error("Lỗi khi đọc danh sách sao lưu: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * Phuc hui co so du lieu tu file sao luu.
     *
     * @param filename ten file sao luu
     * @return true neu thanh cong
     */
    public boolean restoreBackup(String filename) {
        if (filename == null || filename.isBlank()) {
            throw new IllegalArgumentException("Tên file sao lưu không được để trống");
        }

        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new IllegalArgumentException("Tên file không hợp lệ");
        }

        Path filePath = Paths.get(backupDir).resolve(filename);
        if (!Files.exists(filePath)) {
            throw new IllegalArgumentException("File sao lưu không tồn tại: " + filename);
        }

        try {
            // Tạo file tạm bỏ qua dòng warning ở đầu (nếu có)
            Path tempFile = Files.createTempFile("backup_clean_", ".sql");
            List<String> lines = Files.readAllLines(filePath);
            int startLine = 0;
            if (!lines.isEmpty() && lines.get(0).contains("mysqldump:")) {
                startLine = 1;
            }
            Files.write(tempFile, lines.subList(startLine, lines.size()));

            String dbName = extractDatabaseName(datasourceUrl);

            List<String> command = new ArrayList<>();
            command.add(mysqlPath);
            command.add("--host=" + extractHost(datasourceUrl));
            command.add("--port=" + extractPort(datasourceUrl));
            command.add("--user=" + datasourceUsername);
            command.add("--password=" + datasourcePassword);
            command.add("--database=" + dbName);

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectInput(tempFile.toFile());
            pb.redirectErrorStream(true);

            log.info("Đang phục hồi từ bản sao lưu: {}", filename);
            Process process = pb.start();
            int exitCode = process.waitFor();

            // Xóa file tạm
            try { Files.deleteIfExists(tempFile); } catch (IOException ignored) {}

            if (exitCode != 0) {
                String errorOutput = new String(process.getInputStream().readAllBytes());
                log.error("Phục hồi thất bại (exit code {}): {}", exitCode, errorOutput);
                return false;
            }

            log.info("Phục hồi thành công từ: {}", filename);
            return true;

        } catch (IOException e) {
            log.error("Lỗi I/O khi phục hồi: {}", e.getMessage(), e);
            return false;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Quá trình phục hồi bị gián đoạn", e);
            return false;
        }
    }

    /**
     * Lay duong dan file sao luu.
     *
     * @param filename ten file
     * @return duong dan file
     */
    public Path getBackupFilePath(String filename) {
        if (filename == null || filename.isBlank()) {
            throw new IllegalArgumentException("Tên file không được để trống");
        }
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new IllegalArgumentException("Tên file không hợp lệ");
        }
        Path filePath = Paths.get(backupDir).resolve(filename);
        if (!Files.exists(filePath)) {
            throw new IllegalArgumentException("File không tồn tại: " + filename);
        }
        return filePath;
    }

    private String extractDatabaseName(String url) {
        // jdbc:mysql://localhost:3306/hethongthpt?serverTimezone=Asia/Ho_Chi_Minh&...
        if (url == null) return "hethongthpt";
        int schemeEnd = url.indexOf("://");
        if (schemeEnd == -1) return "hethongthpt";
        int pathStart = url.indexOf('/', schemeEnd + 3);
        if (pathStart == -1) return "hethongthpt";
        String afterPath = url.substring(pathStart + 1);
        // Cut at first delimiter: ?, &, #, ;
        for (int i = 0; i < afterPath.length(); i++) {
            char c = afterPath.charAt(i);
            if (c == '?' || c == '&' || c == '#' || c == ';') {
                return afterPath.substring(0, i);
            }
        }
        return afterPath;
    }

    private String extractHost(String url) {
        // jdbc:mysql://localhost:3306/...
        try {
            int start = url.indexOf("//") + 2;
            int end = url.indexOf(':', start);
            if (end == -1) end = url.indexOf('/', start);
            return url.substring(start, end);
        } catch (Exception e) {
            return "localhost";
        }
    }

    private String extractPort(String url) {
        try {
            int start = url.indexOf("//") + 2;
            int colonPos = url.indexOf(':', start);
            if (colonPos == -1) return "3306";
            int end = url.indexOf('/', colonPos);
            return url.substring(colonPos + 1, end);
        } catch (Exception e) {
            return "3306";
        }
    }
}
