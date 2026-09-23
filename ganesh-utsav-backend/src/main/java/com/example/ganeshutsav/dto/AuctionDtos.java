package com.example.ganeshutsav.dto;

import com.example.ganeshutsav.entity.PaymentMethod;
import com.example.ganeshutsav.entity.PaymentStatus;
import com.example.ganeshutsav.entity.RecordStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class AuctionDtos {
    private AuctionDtos() {}

    public record AuctionRequest(
            @NotBlank @Size(min = 2, max = 120) String auctionName,
            @NotBlank @Size(min = 2, max = 120) String winnerName,
            @Size(max = 30) String flatNumber,
            @NotNull @DecimalMin(value = "0.01") BigDecimal winningAmount,
            @NotNull @DecimalMin(value = "0.00") BigDecimal amountPaid,
            @NotNull @PastOrPresent LocalDate auctionDate,
            /**
             * Date of the money received for the newly added part of amountPaid. Optional; when it
             * is missing the auction date is used on create and today is used on update.
             */
            @PastOrPresent LocalDate paymentDate,
            /** How the newly added part of amountPaid came in, plus its proof photo. All optional. */
            PaymentMethod paymentMethod,
            @Size(max = 500) String paymentProofPath,
            /** Receiver of a cash payment; used instead of a proof photo when the money came in cash. */
            @Size(max = 120) String paidTo,
            @Size(max = 100) String occasion,
            @Size(max = 500) String notes,
            RecordStatus status
    ) {}

    /**
     * One more receipt for an auction. The popup on the auctions tab sends the money received now,
     * how it came in, who took the cash or the proof photo, and the service adds it to the money
     * already collected.
     */
    public record AuctionPaymentRequest(
            @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
            PaymentMethod paymentMethod,
            @Size(max = 500) String paymentProofPath,
            @Size(max = 120) String paidTo,
            @PastOrPresent LocalDate paymentDate,
            @Size(max = 500) String notes
    ) {}

    /** One recorded receipt for an auction, kept so partial payments stay traceable. */
    public record AuctionPaymentResponse(Long id, Long auctionId, BigDecimal amount, LocalDate paymentDate, PaymentMethod paymentMethod, String paymentProofPath, String paidTo, String notes, String recordedBy, Instant createdAt) {}

    public record AuctionResponse(Long id, String auctionName, String winner, String flatNumber, BigDecimal winningAmount, BigDecimal amountPaid, BigDecimal balance, LocalDate auctionDate, PaymentStatus paymentStatus, String occasion, String notes, RecordStatus status, Instant createdAt, Instant updatedAt, List<AuctionPaymentResponse> payments) {}
}
