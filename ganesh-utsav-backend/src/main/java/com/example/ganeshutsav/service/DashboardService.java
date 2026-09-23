package com.example.ganeshutsav.service;

import com.example.ganeshutsav.dto.DashboardDtos;
import com.example.ganeshutsav.entity.PaymentStatus;
import com.example.ganeshutsav.entity.RecordStatus;
import com.example.ganeshutsav.mapper.EntityMapper;
import com.example.ganeshutsav.repository.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DashboardService {
    private final ContributionRepository contributionRepository;
    private final ExpenseRepository expenseRepository;
    private final AuctionRepository auctionRepository;
    private final EntityMapper mapper;

    public DashboardService(ContributionRepository contributionRepository, ExpenseRepository expenseRepository, AuctionRepository auctionRepository, EntityMapper mapper) {
        this.contributionRepository = contributionRepository;
        this.expenseRepository = expenseRepository;
        this.auctionRepository = auctionRepository;
        this.mapper = mapper;
    }

    public DashboardDtos.StatResponse stats(boolean includeRecent) {
        BigDecimal contributionTotal = contributionRepository.sumByStatus(PaymentStatus.PAID);
        BigDecimal auctionWinningTotal = auctionRepository.sumWinningAmountByStatus(RecordStatus.ACTIVE);
        BigDecimal auctionTotal = auctionRepository.sumAmountPaidByStatus(RecordStatus.ACTIVE);
        BigDecimal expenseTotal = expenseRepository.sumByStatus(RecordStatus.ACTIVE);
        BigDecimal totalCollected = contributionTotal.add(auctionTotal);
        BigDecimal balance = totalCollected.subtract(expenseTotal);

        List<DashboardDtos.ChartPoint> collectionVsExpenses = List.of(
                new DashboardDtos.ChartPoint("Contributions", contributionTotal),
                new DashboardDtos.ChartPoint("Auctions", auctionTotal),
                new DashboardDtos.ChartPoint("Expenses", expenseTotal)
        );

        List<DashboardDtos.ContributionResponse> contributions = includeRecent
                ? contributionRepository.findTop5ByOrderByPaymentDateDescIdDesc().stream().map(mapper::dashboardContribution).toList()
                : List.of();
        List<DashboardDtos.ExpenseResponse> expenses = includeRecent
                ? expenseRepository.findTop5ByStatusOrderByExpenseDateDescIdDesc(RecordStatus.ACTIVE).stream().map(mapper::dashboardExpense).toList()
                : List.of();
        List<DashboardDtos.AuctionResponse> auctions = includeRecent
                ? auctionRepository.findTop5ByStatusOrderByAuctionDateDescIdDesc(RecordStatus.ACTIVE).stream().map(mapper::dashboardAuction).toList()
                : List.of();

        return new DashboardDtos.StatResponse(
                contributionTotal,
                auctionTotal,
                auctionWinningTotal,
                totalCollected,
                expenseTotal,
                balance,
                auctionRepository.countByStatus(RecordStatus.ACTIVE),
                new ArrayList<>(),
                new ArrayList<>(),
                new ArrayList<>(),
                collectionVsExpenses,
                contributions,
                expenses,
                auctions
        );
    }
}
