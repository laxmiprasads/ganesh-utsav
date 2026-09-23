package com.example.ganeshutsav.dto;

import com.example.ganeshutsav.entity.RecordStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public final class ExpenseDtos {
    private ExpenseDtos() {}

    public record CategoryRequest(@NotBlank @Size(min = 2, max = 80) String name, RecordStatus status) {}

    public record CategoryResponse(Long id, String name, RecordStatus status, Instant createdAt, Instant updatedAt) {}

    public record ExpenseRequest(
            Long categoryId,
            @NotBlank @Size(max = 220) String description,
            @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
            @NotNull LocalDate expenseDate,
            @Size(max = 100) String paidBy,
            @Size(max = 500) String receiptUrl,
            @Size(max = 100) String occasion,
            @Size(max = 500) String notes,
            RecordStatus status
    ) {}

    public record ExpenseResponse(Long id, Long categoryId, String category, String description, BigDecimal amount, LocalDate expenseDate, String paidBy, String receiptUrl, String occasion, String notes, RecordStatus status, Instant createdAt, Instant updatedAt) {}
}
