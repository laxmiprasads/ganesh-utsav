package com.example.ganeshutsav.dto;

import com.example.ganeshutsav.entity.PaymentMethod;
import com.example.ganeshutsav.entity.PaymentStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public final class ContributionDtos {
    private ContributionDtos() {}

    public record ContributionRequest(
            @NotBlank @Size(min = 2, max = 120) String contributorName,
            @Size(max = 30) String flatNumber,
            @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
            @NotNull PaymentMethod paymentMethod,
            @Size(max = 120) String transactionId,
            @Size(max = 120) String paidTo,
            @Size(max = 500) String paymentProofPath,
            @NotNull LocalDate paymentDate,
            @NotNull PaymentStatus status,
            @Size(max = 100) String occasion,
            @Size(max = 500) String notes
    ) {}

    public record ContributionResponse(Long id, String contributorName, String flatNumber, BigDecimal amount, PaymentMethod paymentMethod, String transactionId, String paidTo, String paymentProofPath, LocalDate paymentDate, PaymentStatus status, String occasion, String notes, String createdBy, Instant createdAt, Instant updatedAt) {}

    public record PublicContributionResponse(String name, String flatNumber, BigDecimal amount) {}
}
