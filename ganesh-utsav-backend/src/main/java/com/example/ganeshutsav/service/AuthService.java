package com.example.ganeshutsav.service;

import com.example.ganeshutsav.dto.AuthDtos;
import com.example.ganeshutsav.entity.Role;
import com.example.ganeshutsav.entity.User;
import com.example.ganeshutsav.exception.DuplicateRecordException;
import com.example.ganeshutsav.repository.UserRepository;
import com.example.ganeshutsav.security.AppUserDetails;
import com.example.ganeshutsav.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthDtos.LoginResponse login(AuthDtos.LoginRequest request) {
        var auth = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.username().trim(), request.password()));
        AppUserDetails details = (AppUserDetails) auth.getPrincipal();
        return new AuthDtos.LoginResponse(jwtService.generateToken(details), "Bearer", details.getUsername(), details.user().getRole().name());
    }

    @Transactional
    public AuthDtos.MessageResponse register(AuthDtos.RegisterRequest request) {
        String username = request.username().trim();
        if (userRepository.findByUsername(username).isPresent()) {
            throw new DuplicateRecordException("Username '" + username + "' is already taken. Please choose another username.");
        }

        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.COMMITTEE);
        user.setActive(true);
        userRepository.save(user);

        return new AuthDtos.MessageResponse("Account created successfully for '" + username + "'. You can now sign in.");
    }
}
