package com.example.ganeshutsav.dto;

import com.example.ganeshutsav.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDate;

public final class PublicDtos {
    private PublicDtos() {}

    public record PublicExpenseResponse(Long id, String category, String description, BigDecimal amount, LocalDate expenseDate, String occasion) {}

    public record PublicAuctionResponse(Long id, String auctionName, String winner, BigDecimal winningAmount, BigDecimal amountPaid, BigDecimal balance, LocalDate auctionDate, PaymentStatus paymentStatus) {}
}
