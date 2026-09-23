package com.example.ganeshutsav.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("png", "jpg", "jpeg", "webp", "gif", "heic", "heif", "bmp");

    private final Path root;
    private final long maxSize;

    public FileStorageService(
            @Value("${app.upload.dir:uploads}") String uploadDir,
            @Value("${app.upload.max-size:5242880}") long maxSize) throws IOException {
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.maxSize = maxSize;
        Files.createDirectories(this.root);
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please choose a photo to upload");
        }
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException("Photo must be smaller than 5 MB");
        }
        String contentType = file.getContentType();
        String originalName = file.getOriginalFilename();
        String extension = extensionOf(originalName);
        if (contentType == null || contentType.isBlank()) {
            contentType = guessContentType(extension);
        }
        if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed (got: " + (file.getContentType() == null ? "unknown type" : file.getContentType()) + ")");
        }
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            String derived = extensionFromContentType(contentType);
            extension = derived.isBlank() ? "png" : derived;
        }
        String filename = UUID.randomUUID() + "." + extension;
        Path target = root.resolve(filename).normalize();
        if (!target.startsWith(root)) {
            throw new IllegalStateException("Could not save the uploaded photo");
        }
        try {
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new IllegalStateException("Could not save the uploaded photo (" + ex.getMessage() + ")", ex);
        }
        return "/uploads/" + filename;
    }

    private String extensionOf(String name) {
        if (name == null || !name.contains(".")) {
            return "";
        }
        return name.substring(name.lastIndexOf('.') + 1).toLowerCase();
    }

    private String guessContentType(String extension) {
        return switch (extension) {
            case "png" -> "image/png";
            case "jpg", "jpeg" -> "image/jpeg";
            case "gif" -> "image/gif";
            case "webp" -> "image/webp";
            case "bmp" -> "image/bmp";
            case "heic", "heif" -> "image/heic";
            default -> null;
        };
    }

    private String extensionFromContentType(String contentType) {
        if (contentType == null) {
            return "";
        }
        return switch (contentType.toLowerCase().split(";")[0].trim()) {
            case "image/png" -> "png";
            case "image/jpeg" -> "jpg";
            case "image/gif" -> "gif";
            case "image/webp" -> "webp";
            case "image/bmp" -> "bmp";
            case "image/heic", "image/heif" -> "heic";
            default -> "";
        };
    }
}
