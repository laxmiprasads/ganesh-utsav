package com.example.ganeshutsav.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "auctions")
public class Auction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String auctionName;

    @Column(nullable = false, length = 120)
    private String winnerName;

    @Column(length = 30)
    private String flatNumber;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal winningAmount;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Column(nullable = false)
    private LocalDate auctionDate;

    /**
     * Derived from amountPaid vs winningAmount and never supplied by the client.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RecordStatus status = RecordStatus.ACTIVE;

    @Column(length = 500)
    private String notes;

    @Column(length = 100)
    private String occasion = "Ganesh Chaturthi";

    @ManyToOne(fetch = FetchType.LAZY)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    private User updatedBy;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() { createdAt = Instant.now(); updatedAt = createdAt; }

    @PreUpdate
    void preUpdate() { updatedAt = Instant.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getAuctionName() { return auctionName; }
    public void setAuctionName(String auctionName) { this.auctionName = auctionName; }
    public String getWinnerName() { return winnerName; }
    public void setWinnerName(String winnerName) { this.winnerName = winnerName; }
    public String getFlatNumber() { return flatNumber; }
    public void setFlatNumber(String flatNumber) { this.flatNumber = flatNumber; }
    public BigDecimal getWinningAmount() { return winningAmount; }
    public void setWinningAmount(BigDecimal winningAmount) { this.winningAmount = winningAmount; }
    public BigDecimal getAmountPaid() { return amountPaid; }
    public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }
    public LocalDate getAuctionDate() { return auctionDate; }
    public void setAuctionDate(LocalDate auctionDate) { this.auctionDate = auctionDate; }
    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }
    public RecordStatus getStatus() { return status; }
    public void setStatus(RecordStatus status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getOccasion() { return occasion; }
    public void setOccasion(String occasion) { this.occasion = occasion; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public User getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(User updatedBy) { this.updatedBy = updatedBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
