package com.example.ganeshutsav.config;

import com.example.ganeshutsav.entity.*;
import com.example.ganeshutsav.repository.*;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {
    @Bean
    @Order(2)
    CommandLineRunner seedData(
            UserRepository users,
            ExpenseCategoryRepository expenseCategories,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            User prasad = users.findByUsername("Prasad").orElseGet(() -> {
                User user = new User();
                user.setUsername("Prasad");
                user.setRole(Role.COMMITTEE);
                return user;
            });
            prasad.setPasswordHash(passwordEncoder.encode("Prasad@122006"));
            prasad.setActive(true);
            users.save(prasad);

            users.findByUsername("admin").ifPresent(users::delete);

            if (expenseCategories.count() == 0) {
                List.of("Decoration", "Food", "Sound System", "Lighting", "Idol", "Pooja Materials", "Cleaning", "Transportation", "Prasadam", "Events", "Printing", "Other")
                        .forEach(name -> {
                            ExpenseCategory c = new ExpenseCategory();
                            c.setName(name);
                            expenseCategories.save(c);
                        });
            }
        };
    }
}