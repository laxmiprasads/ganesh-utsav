package com.example.ganeshutsav.service;

import com.example.ganeshutsav.dto.AuctionDtos;
import com.example.ganeshutsav.entity.Auction;
import com.example.ganeshutsav.entity.AuctionPayment;
import com.example.ganeshutsav.entity.PaymentStatus;
import com.example.ganeshutsav.entity.RecordStatus;
import com.example.ganeshutsav.exception.ResourceNotFoundException;
import com.example.ganeshutsav.mapper.EntityMapper;
import com.example.ganeshutsav.repository.AuctionPaymentRepository;
import com.example.ganeshutsav.repository.AuctionRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuctionService {
    private final AuctionRepository repository;
    private final AuctionPaymentRepository paymentRepository;
    private final CurrentUserService currentUserService;
    private final EntityMapper mapper;

    public AuctionService(AuctionRepository repository, AuctionPaymentRepository paymentRepository, CurrentUserService currentUserService, EntityMapper mapper) {
        this.repository = repository;
        this.paymentRepository = paymentRepository;
        this.currentUserService = currentUserService;
        this.mapper = mapper;
    }

    public List<AuctionDtos.AuctionResponse> list(String search, String winnerName, String paymentStatus, String occasion, LocalDate from, LocalDate to) {
        Map<Long, List<AuctionPayment>> paymentsByAuction = paymentRepository.findAllWithAuction().stream()
                .collect(Collectors.groupingBy(payment -> payment.getAuction().getId()));
        return repository.findAll().stream()
                .filter(a -> a.getStatus() == RecordStatus.ACTIVE)
                .filter(a -> winnerName == null || winnerName.isBlank() || (a.getWinnerName() != null && a.getWinnerName().equalsIgnoreCase(winnerName)))
                .filter(a -> paymentStatus == null || a.getPaymentStatus().name().equalsIgnoreCase(paymentStatus))
                .filter(a -> occasion == null || occasion.isBlank() || (a.getOccasion() != null && a.getOccasion().equalsIgnoreCase(occasion)))
                .filter(a -> from == null || !a.getAuctionDate().isBefore(from))
                .filter(a -> to == null || !a.getAuctionDate().isAfter(to))
                .filter(a -> matches(a.getAuctionName(), search) || matches(a.getWinnerName(), search))
                .map(a -> mapper.auction(a, paymentsByAuction.getOrDefault(a.getId(), List.of())))
                .toList();
    }

    public AuctionDtos.AuctionResponse get(Long id) {
        return response(find(id));
    }

    public AuctionDtos.AuctionResponse create(AuctionDtos.AuctionRequest request) {
        Auction a = new Auction();
        apply(a, request);
        a.setCreatedBy(currentUserService.currentUser());
        a.setUpdatedBy(currentUserService.currentUser());
        Auction saved = repository.save(a);
        recordPayment(saved, BigDecimal.ZERO, request, true);
        return response(saved);
    }

    public AuctionDtos.AuctionResponse update(Long id, AuctionDtos.AuctionRequest request) {
        Auction a = find(id);
        BigDecimal previouslyPaid = paid(a);
        apply(a, request);
        a.setUpdatedBy(currentUserService.currentUser());
        Auction saved = repository.save(a);
        recordPayment(saved, previouslyPaid, request, false);
        return response(saved);
    }

    /**
     * Records one more receipt for an auction: the money received now is added to the amount already
     * collected, the payment status is recomputed, and the receipt keeps how it was paid together
     * with the proof, so the auctions tab can print the whole money trail.
     */
    public AuctionDtos.AuctionResponse addPayment(Long id, AuctionDtos.AuctionPaymentRequest request) {
        Auction a = find(id);
        BigDecimal collected = paid(a);
        BigDecimal winningAmount = a.getWinningAmount() == null ? BigDecimal.ZERO : a.getWinningAmount();
        BigDecimal pending = winningAmount.subtract(collected);
        if (pending.signum() <= 0) {
            throw new IllegalArgumentException("This auction is already fully collected");
        }
        if (request.amount().compareTo(pending) > 0) {
            throw new IllegalArgumentException("Amount is more than the remaining balance of " + pending.toPlainString());
        }

        BigDecimal amountPaid = collected.add(request.amount());
        a.setAmountPaid(amountPaid);
        a.setPaymentStatus(deriveStatus(amountPaid, a.getWinningAmount()));
        a.setUpdatedBy(currentUserService.currentUser());
        Auction saved = repository.save(a);

        AuctionPayment payment = new AuctionPayment();
        payment.setAuction(saved);
        payment.setAmount(request.amount());
        payment.setPaymentMethod(request.paymentMethod());
        payment.setPaymentProofPath(request.paymentProofPath());
        payment.setPaidTo(request.paidTo());
        payment.setPaymentDate(request.paymentDate() == null ? LocalDate.now() : request.paymentDate());
        payment.setNotes(request.notes());
        payment.setCreatedBy(currentUserService.currentUser());
        paymentRepository.save(payment);

        return response(saved);
    }

    public void deactivate(Long id) {
        Auction a = find(id);
        a.setStatus(RecordStatus.INACTIVE);
        a.setUpdatedBy(currentUserService.currentUser());
        repository.save(a);
    }

    Auction find(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Auction not found"));
    }

    /**
     * Payment status is never entered by hand: it is derived from how much of the
     * winning amount has been paid.
     * nothing paid -> PENDING, part of it -> PARTIAL, full or extra -> PAID.
     */
    public static PaymentStatus deriveStatus(BigDecimal amountPaid, BigDecimal winningAmount) {
        BigDecimal paid = amountPaid == null ? BigDecimal.ZERO : amountPaid;
        BigDecimal won = winningAmount == null ? BigDecimal.ZERO : winningAmount;
        if (paid.signum() <= 0) {
            return PaymentStatus.PENDING;
        }
        return paid.compareTo(won) >= 0 ? PaymentStatus.PAID : PaymentStatus.PARTIAL;
    }

    private void apply(Auction a, AuctionDtos.AuctionRequest request) {
        a.setAuctionName(request.auctionName());
        a.setWinnerName(request.winnerName());
        a.setFlatNumber(request.flatNumber());
        a.setWinningAmount(request.winningAmount());
        BigDecimal amountPaid = request.amountPaid() == null ? BigDecimal.ZERO : request.amountPaid();
        a.setAmountPaid(amountPaid);
        a.setAuctionDate(request.auctionDate());
        a.setPaymentStatus(deriveStatus(amountPaid, request.winningAmount()));
        a.setOccasion(request.occasion() == null || request.occasion().isBlank() ? "Ganesh Chaturthi" : request.occasion().trim());
        a.setNotes(request.notes());
        a.setStatus(request.status() == null ? RecordStatus.ACTIVE : request.status());
    }

    /**
     * Keeps the money trail for the winning resident: every time the committee raises the amount
     * paid on an auction, the increase is stored as its own receipt with the date the money came in.
     * The ledger is append only, so a downward correction of amountPaid does not erase paid history.
     */
    private void recordPayment(Auction auction, BigDecimal previouslyPaid, AuctionDtos.AuctionRequest request, boolean created) {
        BigDecimal increase = paid(auction).subtract(previouslyPaid == null ? BigDecimal.ZERO : previouslyPaid);
        if (increase.signum() <= 0) {
            return;
        }
        AuctionPayment payment = new AuctionPayment();
        payment.setAuction(auction);
        payment.setAmount(increase);
        payment.setPaymentMethod(request.paymentMethod());
        payment.setPaymentProofPath(request.paymentProofPath());
        payment.setPaidTo(request.paidTo());
        payment.setPaymentDate(resolvePaymentDate(request, auction, created));
        payment.setCreatedBy(currentUserService.currentUser());
        paymentRepository.save(payment);
    }

    private LocalDate resolvePaymentDate(AuctionDtos.AuctionRequest request, Auction auction, boolean created) {
        if (request.paymentDate() != null) {
            return request.paymentDate();
        }
        return created ? auction.getAuctionDate() : LocalDate.now();
    }

    private BigDecimal paid(Auction auction) {
        return auction.getAmountPaid() == null ? BigDecimal.ZERO : auction.getAmountPaid();
    }

    private AuctionDtos.AuctionResponse response(Auction auction) {
        return mapper.auction(auction, paymentRepository.findByAuctionIdOrderByPaymentDateAscIdAsc(auction.getId()));
    }

    private boolean matches(String value, String search) {
        return search == null || search.isBlank() || (value != null && value.toLowerCase().contains(search.toLowerCase()));
    }
}
