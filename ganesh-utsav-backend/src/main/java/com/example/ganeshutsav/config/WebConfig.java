package com.example.ganeshutsav.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final String uploadDir;

    public WebConfig(@Value("${app.upload.dir:uploads}") String uploadDir) {
        this.uploadDir = uploadDir;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        java.nio.file.Path root = java.nio.file.Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            java.nio.file.Files.createDirectories(root);
        } catch (java.io.IOException ex) {
            throw new IllegalStateException("Could not create upload directory: " + root, ex);
        }
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(root.toUri().toString());
    }
}
