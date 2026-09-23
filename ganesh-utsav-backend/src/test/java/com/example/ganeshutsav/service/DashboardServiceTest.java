package com.example.ganeshutsav.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.ganeshutsav.dto.DashboardDtos;
import com.example.ganeshutsav.entity.PaymentStatus;
import com.example.ganeshutsav.entity.RecordStatus;
import com.example.ganeshutsav.mapper.EntityMapper;
import com.example.ganeshutsav.repository.AuctionRepository;
import com.example.ganeshutsav.repository.ContributionRepository;
import com.example.ganeshutsav.repository.ExpenseRepository;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * The dashboard is the committee's financial control center, so the auction card reports the total
 * auction money next to the money actually received. A part payment counts as soon as it is
 * recorded, not only when the winning amount is fully settled.
 */
@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {
    @Mock
    private ContributionRepository contributionRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private AuctionRepository auctionRepository;

    private DashboardService dashboardService() {
        return new DashboardService(contributionRepository, expenseRepository, auctionRepository, new EntityMapper());
    }

    private void givenNumbers(BigDecimal contributions, BigDecimal auctionWinningTotal, BigDecimal auctionMoneyReceived, BigDecimal expenses) {
        when(contributionRepository.sumByStatus(PaymentStatus.PAID)).thenReturn(contributions);
        when(auctionRepository.sumWinningAmountByStatus(RecordStatus.ACTIVE)).thenReturn(auctionWinningTotal);
        when(auctionRepository.sumAmountPaidByStatus(RecordStatus.ACTIVE)).thenReturn(auctionMoneyReceived);
        when(expenseRepository.sumByStatus(RecordStatus.ACTIVE)).thenReturn(expenses);
        when(auctionRepository.countByStatus(RecordStatus.ACTIVE)).thenReturn(4L);
    }

    @Test
    void countsPartPaidAuctionMoneyInsteadOfOnlyFullyPaidWinningAmounts() {
        // 25,000 + 15,000 + 12,000 settled auctions plus the 5,000 already received on a
        // 15,000 winning bid that is still PARTIAL: 67,000 offered, 57,000 received.
        givenNumbers(new BigDecimal("6000.00"), new BigDecimal("67000.00"), new BigDecimal("57000.00"), new BigDecimal("27000.00"));

        DashboardDtos.StatResponse stats = dashboardService().stats(false);

        assertThat(stats.auctionWinningTotal()).isEqualByComparingTo("67000.00");
        assertThat(stats.auctionTotal()).isEqualByComparingTo("57000.00");
        assertThat(stats.totalCollected()).isEqualByComparingTo("63000.00");
        assertThat(stats.balance()).isEqualByComparingTo("36000.00");
        verify(auctionRepository).sumAmountPaidByStatus(RecordStatus.ACTIVE);
    }

    @Test
    void showsReceivedAuctionMoneyInTheCollectionChart() {
        givenNumbers(new BigDecimal("6000.00"), new BigDecimal("67000.00"), new BigDecimal("57000.00"), new BigDecimal("27000.00"));

        DashboardDtos.StatResponse stats = dashboardService().stats(false);

        assertThat(stats.collectionVsExpenses())
                .extracting(DashboardDtos.ChartPoint::label, point -> point.value().toPlainString())
                .containsExactly(
                        tuple("Contributions", "6000.00"),
                        tuple("Auctions", "57000.00"),
                        tuple("Expenses", "27000.00"));
    }
}
