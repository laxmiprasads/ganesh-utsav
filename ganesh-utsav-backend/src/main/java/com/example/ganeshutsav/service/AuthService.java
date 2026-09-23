package com.example.ganeshutsav.service;

import com.example.ganeshutsav.dto.AuthDtos;
import com.example.ganeshutsav.security.AppUserDetails;
import com.example.ganeshutsav.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public AuthDtos.LoginResponse login(AuthDtos.LoginRequest request) {
        var auth = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        AppUserDetails details = (AppUserDetails) auth.getPrincipal();
        return new AuthDtos.LoginResponse(jwtService.generateToken(details), "Bearer", details.getUsername(), details.user().getRole().name());
    }
}
