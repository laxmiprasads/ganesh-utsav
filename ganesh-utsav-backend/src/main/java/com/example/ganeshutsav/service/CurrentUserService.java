package com.example.ganeshutsav.service;

import com.example.ganeshutsav.entity.User;
import com.example.ganeshutsav.repository.UserRepository;
import com.example.ganeshutsav.security.AppUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {
    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AppUserDetails details) {
            return details.user();
        }
        return userRepository.findByUsername("admin").orElse(null);
    }
}
