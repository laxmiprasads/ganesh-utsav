package com.example.ganeshutsav.mapper;

import com.example.ganeshutsav.dto.AuctionDtos;
import com.example.ganeshutsav.dto.ContributionDtos;
import com.example.ganeshutsav.dto.DashboardDtos;
import com.example.ganeshutsav.dto.ExpenseDtos;
import com.example.ganeshutsav.entity.*;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class EntityMapper {
    public ContributionDtos.ContributionResponse contribution(Contribution c) {
        String occasion = c.getOccasion() == null || c.getOccasion().isBlank() ? "Ganesh Chaturthi" : c.getOccasion();
        String createdBy = c.getCreatedBy() == null ? null : c.getCreatedBy().getUsername();
        return new ContributionDtos.ContributionResponse(c.getId(), c.getContributorName(), c.getFlatNumber(), c.getAmount(), c.getPaymentMethod(), c.getTransactionId(), c.getPaidTo(), c.getPaymentProofPath(), c.getPaymentDate(), c.getStatus(), occasion, c.getNotes(), createdBy, c.getCreatedAt(), c.getUpdatedAt());
    }

    public ExpenseDtos.CategoryResponse expenseCategory(ExpenseCategory c) {
        return new ExpenseDtos.CategoryResponse(c.getId(), c.getName(), c.getStatus(), c.getCreatedAt(), c.getUpdatedAt());
    }

    public ExpenseDtos.ExpenseResponse expense(Expense e) {
        ExpenseCategory category = e.getCategory();
        String occasion = e.getOccasion() == null || e.getOccasion().isBlank() ? "Ganesh Chaturthi" : e.getOccasion();
        String createdBy = e.getCreatedBy() == null ? null : e.getCreatedBy().getUsername();
        return new ExpenseDtos.ExpenseResponse(e.getId(), category == null ? null : category.getId(), category == null ? null : category.getName(), e.getDescription(), e.getAmount(), e.getExpenseDate(), e.getPaidBy(), e.getReceiptUrl(), occasion, e.getNotes(), e.getStatus(), createdBy, e.getCreatedAt(), e.getUpdatedAt());
    }

    public AuctionDtos.AuctionResponse auction(Auction a) {
        return auction(a, List.of());
    }

    /** Auction plus its payment ledger, so partial payments stay visible per winning resident. */
    public AuctionDtos.AuctionResponse auction(Auction a, List<AuctionPayment> payments) {
        String occasion = a.getOccasion() == null || a.getOccasion().isBlank() ? "Ganesh Chaturthi" : a.getOccasion();
        return new AuctionDtos.AuctionResponse(a.getId(), a.getAuctionName(), a.getWinnerName(), a.getFlatNumber(), a.getWinningAmount(), a.getAmountPaid(), balance(a.getWinningAmount(), a.getAmountPaid()), a.getAuctionDate(), a.getPaymentStatus(), occasion, a.getNotes(), a.getStatus(), a.getCreatedAt(), a.getUpdatedAt(), payments.stream().map(this::auctionPayment).toList());
    }

    public AuctionDtos.AuctionPaymentResponse auctionPayment(AuctionPayment p) {
        User createdBy = p.getCreatedBy();
        return new AuctionDtos.AuctionPaymentResponse(p.getId(), p.getAuction() == null ? null : p.getAuction().getId(), p.getAmount(), p.getPaymentDate(), p.getPaymentMethod(), p.getPaymentProofPath(), p.getPaidTo(), p.getNotes(), createdBy == null ? null : createdBy.getUsername(), p.getCreatedAt());
    }

    public DashboardDtos.ContributionResponse dashboardContribution(Contribution c) {
        return new DashboardDtos.ContributionResponse(c.getId(), c.getContributorName(), c.getFlatNumber(), c.getAmount(), c.getPaymentDate(), c.getPaymentMethod().name(), c.getStatus().name());
    }

    public DashboardDtos.ExpenseResponse dashboardExpense(Expense e) {
        return new DashboardDtos.ExpenseResponse(e.getId(), e.getCategory() == null ? null : e.getCategory().getName(), e.getDescription(), e.getAmount(), e.getExpenseDate(), e.getPaidBy());
    }

    public DashboardDtos.AuctionResponse dashboardAuction(Auction a) {
        return new DashboardDtos.AuctionResponse(a.getId(), a.getAuctionName(), a.getWinnerName(), a.getWinningAmount(), a.getAmountPaid(), balance(a.getWinningAmount(), a.getAmountPaid()), a.getAuctionDate(), a.getPaymentStatus().name());
    }

    private java.math.BigDecimal balance(java.math.BigDecimal winningAmount, java.math.BigDecimal amountPaid) {
        java.math.BigDecimal won = winningAmount == null ? java.math.BigDecimal.ZERO : winningAmount;
        java.math.BigDecimal paid = amountPaid == null ? java.math.BigDecimal.ZERO : amountPaid;
        return won.subtract(paid);
    }
}
