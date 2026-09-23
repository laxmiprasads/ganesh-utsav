package com.example.ganeshutsav.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.ganeshutsav.dto.AuctionDtos;
import com.example.ganeshutsav.entity.Auction;
import com.example.ganeshutsav.entity.AuctionPayment;
import com.example.ganeshutsav.entity.PaymentMethod;
import com.example.ganeshutsav.entity.PaymentStatus;
import com.example.ganeshutsav.entity.RecordStatus;
import com.example.ganeshutsav.entity.User;
import com.example.ganeshutsav.mapper.EntityMapper;
import com.example.ganeshutsav.repository.AuctionPaymentRepository;
import com.example.ganeshutsav.repository.AuctionRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Payment status drives what the dashboard and the auction list show, so the mapping from the money
 * received to the status must stay exact. The same service keeps the receipt ledger the auction tab
 * prints below every auction, so the money trail is covered here too.
 */
@ExtendWith(MockitoExtension.class)
class AuctionServiceTest {
    @Mock
    private AuctionRepository repository;

    @Mock
    private AuctionPaymentRepository paymentRepository;

    @Mock
    private CurrentUserService currentUserService;

    /** Receipt rows the service writes, kept so the ledger reads back like the database would. */
    private final List<AuctionPayment> receipts = new ArrayList<>();

    private AuctionService auctionService() {
        return new AuctionService(repository, paymentRepository, currentUserService, new EntityMapper());
    }

    @Test
    void derivesPaymentStatusFromPartPayments() {
        assertThat(AuctionService.deriveStatus(new BigDecimal("0"), new BigDecimal("15000"))).isEqualTo(PaymentStatus.PENDING);
        assertThat(AuctionService.deriveStatus(new BigDecimal("5000"), new BigDecimal("15000"))).isEqualTo(PaymentStatus.PARTIAL);
        assertThat(AuctionService.deriveStatus(new BigDecimal("15000"), new BigDecimal("15000"))).isEqualTo(PaymentStatus.PAID);
        assertThat(AuctionService.deriveStatus(new BigDecimal("20000"), new BigDecimal("15000"))).isEqualTo(PaymentStatus.PAID);
        assertThat(AuctionService.deriveStatus(null, new BigDecimal("15000"))).isEqualTo(PaymentStatus.PENDING);
    }

    @Test
    void acceptsAnAuctionWithNoMoneyPaidYet() {
        givenStoredAuctions();

        AuctionDtos.AuctionResponse response = auctionService().create(request(null));

        assertThat(response.amountPaid()).isEqualByComparingTo("0");
        assertThat(response.balance()).isEqualByComparingTo("15000");
        assertThat(response.paymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(response.payments()).isEmpty();
        verify(paymentRepository, never()).save(any(AuctionPayment.class));
    }

    @Test
    void storesEachBalancePaymentAsItsOwnReceipt() {
        when(repository.findById(7L)).thenReturn(Optional.of(auction(7L, new BigDecimal("5000"))));
        givenStoredAuctions();
        givenReceiptLedger();

        AuctionDtos.AuctionResponse response = auctionService().update(7L, request(new BigDecimal("15000")));

        assertThat(response.amountPaid()).isEqualByComparingTo("15000");
        assertThat(response.balance()).isEqualByComparingTo("0");
        assertThat(response.paymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(receipts).hasSize(1);
        assertThat(receipts.get(0).getAmount()).isEqualByComparingTo("10000");
        assertThat(receipts.get(0).getPaymentDate()).isEqualTo(LocalDate.now());
        assertThat(response.payments()).hasSize(1);
    }

    @Test
    void keepsTheReceiptLedgerWhenAmountPaidIsCorrectedDownwards() {
        when(repository.findById(9L)).thenReturn(Optional.of(auction(9L, new BigDecimal("15000"))));
        givenStoredAuctions();

        AuctionDtos.AuctionResponse response = auctionService().update(9L, request(new BigDecimal("12000")));

        assertThat(response.amountPaid()).isEqualByComparingTo("12000");
        assertThat(response.paymentStatus()).isEqualTo(PaymentStatus.PARTIAL);
        assertThat(receipts).isEmpty();
    }

    /** An auction with a 15,000 winning bid and the given money collected so far. */
    private Auction auction(Long id, BigDecimal amountPaid) {
        Auction a = new Auction();
        a.setId(id);
        a.setAuctionName("cloth");
        a.setWinnerName("Chandu");
        a.setWinningAmount(new BigDecimal("15000"));
        a.setAmountPaid(amountPaid);
        a.setPaymentStatus(AuctionService.deriveStatus(amountPaid, a.getWinningAmount()));
        a.setAuctionDate(LocalDate.now().minusDays(3));
        return a;
    }

    private void givenStoredAuctions() {
        when(currentUserService.currentUser()).thenReturn(new User());
        when(repository.save(any(Auction.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.findByAuctionIdOrderByPaymentDateAscIdAsc(any())).thenAnswer(invocation -> List.copyOf(receipts));
    }

    /** Stores the receipt rows the service writes, so the ledger reads back like the database would. */
    private void givenReceiptLedger() {
        when(paymentRepository.save(any(AuctionPayment.class))).thenAnswer(invocation -> {
            AuctionPayment payment = invocation.getArgument(0);
            receipts.add(payment);
            return payment;
        });
    }

    private AuctionDtos.AuctionRequest request(BigDecimal amountPaid) {
        return new AuctionDtos.AuctionRequest("cloth", "Chandu", "A-101", new BigDecimal("15000"), amountPaid, LocalDate.now().minusDays(2), null, PaymentMethod.CASH, null, "Committee", "Ganesh Chaturthi", null, RecordStatus.ACTIVE);
    }

    @Test
    void addsABalancePaymentWithItsPaymentModeAndProof() {
        when(repository.findById(7L)).thenReturn(Optional.of(auction(7L, new BigDecimal("12000"))));
        givenStoredAuctions();
        givenReceiptLedger();

        AuctionDtos.AuctionResponse response = auctionService().addPayment(7L,
                new AuctionDtos.AuctionPaymentRequest(new BigDecimal("3000"), PaymentMethod.UPI, "/uploads/upi-3000.jpg", null, LocalDate.now(), "Balance by UPI"));

        assertThat(response.amountPaid()).isEqualByComparingTo("15000");
        assertThat(response.balance()).isEqualByComparingTo("0");
        assertThat(response.paymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(receipts).hasSize(1);
        AuctionPayment receipt = receipts.get(0);
        assertThat(receipt.getAmount()).isEqualByComparingTo("3000");
        assertThat(receipt.getPaymentMethod()).isEqualTo(PaymentMethod.UPI);
        assertThat(receipt.getPaymentProofPath()).isEqualTo("/uploads/upi-3000.jpg");
        assertThat(receipt.getNotes()).isEqualTo("Balance by UPI");
        assertThat(receipt.getPaymentDate()).isEqualTo(LocalDate.now());
    }

    @Test
    void refusesMoreMoneyThanThePendingBalance() {
        when(repository.findById(7L)).thenReturn(Optional.of(auction(7L, new BigDecimal("12000"))));

        assertThatThrownBy(() -> auctionService().addPayment(7L,
                new AuctionDtos.AuctionPaymentRequest(new BigDecimal("4000"), PaymentMethod.CASH, null, null, null, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("remaining balance");

        assertThat(receipts).isEmpty();
        verify(repository, never()).save(any(Auction.class));
    }

    @Test
    void refusesAPaymentOnAFullyCollectedAuction() {
        when(repository.findById(9L)).thenReturn(Optional.of(auction(9L, new BigDecimal("15000"))));

        assertThatThrownBy(() -> auctionService().addPayment(9L,
                new AuctionDtos.AuctionPaymentRequest(new BigDecimal("500"), PaymentMethod.CASH, null, null, LocalDate.now(), null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("fully collected");
    }

    @Test
    void recordsWhoReceivedTheCash() {
        when(repository.findById(7L)).thenReturn(Optional.of(auction(7L, new BigDecimal("12000"))));
        givenStoredAuctions();
        givenReceiptLedger();

        auctionService().addPayment(7L, new AuctionDtos.AuctionPaymentRequest(new BigDecimal("3000"), PaymentMethod.CASH, null, "Ravi", LocalDate.now(), null));

        assertThat(receipts).hasSize(1);
        assertThat(receipts.get(0).getPaidTo()).isEqualTo("Ravi");
        assertThat(receipts.get(0).getPaymentProofPath()).isNull();
    }
}
