package com.example.ganeshutsav.repository;

import com.example.ganeshutsav.entity.Expense;
import com.example.ganeshutsav.entity.RecordStatus;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    @Query("select coalesce(sum(e.amount), 0) from Expense e where e.status = :status")
    BigDecimal sumByStatus(RecordStatus status);

    List<Expense> findTop5ByStatusOrderByExpenseDateDescIdDesc(RecordStatus status);
}
