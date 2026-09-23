package com.example.ganeshutsav.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class DashboardDtos {
    private DashboardDtos() {}

    public record StatResponse(
            BigDecimal contributionTotal,
            BigDecimal auctionTotal,
            BigDecimal auctionWinningTotal,
            BigDecimal totalCollected,
            BigDecimal expenseTotal,
            BigDecimal balance,
            long auctionCount,
            List<ChartPoint> contributionsOverTime,
            List<ChartPoint> expensesByCategory,
            List<ChartPoint> auctionCollections,
            List<ChartPoint> collectionVsExpenses,
            List<ContributionResponse> recentContributions,
            List<ExpenseResponse> recentExpenses,
            List<AuctionResponse> recentAuctions
    ) {}

    public record ChartPoint(String label, BigDecimal value) {}

    public record ContributionResponse(Long id, String contributorName, String flatNumber, BigDecimal amount, LocalDate paymentDate, String paymentMethod, String status) {}

    public record ExpenseResponse(Long id, String category, String description, BigDecimal amount, LocalDate expenseDate, String paidBy) {}

    public record AuctionResponse(Long id, String auctionName, String winner, BigDecimal winningAmount, BigDecimal amountPaid, BigDecimal balance, LocalDate auctionDate, String paymentStatus) {}
}
