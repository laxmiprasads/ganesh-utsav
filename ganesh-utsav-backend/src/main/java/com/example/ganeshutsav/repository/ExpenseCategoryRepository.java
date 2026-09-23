package com.example.ganeshutsav.repository;

import com.example.ganeshutsav.entity.ExpenseCategory;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseCategoryRepository extends JpaRepository<ExpenseCategory, Long> {
    Optional<ExpenseCategory> findByNameIgnoreCase(String name);
}
