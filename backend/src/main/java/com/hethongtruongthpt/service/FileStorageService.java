package com.hethongtruongthpt.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );
    private static final long MAX_SIZE = 2 * 1024 * 1024; // 2MB

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    public String storeAvatar(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("File rỗng");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IOException("Chỉ chấp nhận ảnh JPEG, PNG, GIF, WEBP");
        }

        if (file.getSize() > MAX_SIZE) {
            throw new IOException("Kích thước ảnh tối đa 2MB");
        }

        String extension = getExtension(contentType);
        String filename = UUID.randomUUID() + extension;

        Path avatarDir = Paths.get(uploadDir, "avatars").toAbsolutePath().normalize();
        Files.createDirectories(avatarDir);

        Path target = avatarDir.resolve(filename);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/avatars/" + filename;
    }

    public String storeImage(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("File rỗng");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IOException("Chỉ chấp nhận ảnh JPEG, PNG, GIF, WEBP");
        }

        if (file.getSize() > MAX_SIZE) {
            throw new IOException("Kích thước ảnh tối đa 2MB");
        }

        String extension = getExtension(contentType);
        String filename = UUID.randomUUID() + extension;

        Path imageDir = Paths.get(uploadDir, "images").toAbsolutePath().normalize();
        Files.createDirectories(imageDir);

        Path target = imageDir.resolve(filename);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/images/" + filename;
    }

    private String getExtension(String contentType) {
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }
}
