package com.example.ganeshutsav.dto;

import jakarta.validation.constraints.NotBlank;

public final class AuthDtos {
    private AuthDtos() {}

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}

    public record LoginResponse(String token, String tokenType, String username, String role) {}
}
