package com.example.ganeshutsav.config;
import com.example.ganeshutsav.entity.ExpenseCategory;
import com.example.ganeshutsav.entity.Role;
import com.example.ganeshutsav.entity.User;
import com.example.ganeshutsav.repository.ExpenseCategoryRepository;
import com.example.ganeshutsav.repository.UserRepository;
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
            // Create initial committee user only if it doesn't exist
            if (users.findByUsername("Prasad").isEmpty()) {
                User user = new User();
                user.setUsername("Prasad");
                user.setRole(Role.COMMITTEE);
                user.setPasswordHash(
                        passwordEncoder.encode("Prasad@122006")
                );
                user.setActive(true);
                users.save(user);
            }
            // Seed expense categories only once
            if (expenseCategories.count() == 0) {
                List.of(
                        "Decoration",
                        "Food",
                        "Sound System",
                        "Lighting",
                        "Idol",
                        "Pooja Materials",
                        "Cleaning",
                        "Transportation",
                        "Prasadam",
                        "Events",
                        "Printing",
                        "Other"
                ).forEach(name -> {
                    ExpenseCategory category = new ExpenseCategory();
                    category.setName(name);
                    expenseCategories.save(category);
                });
            }
        };
    }
}