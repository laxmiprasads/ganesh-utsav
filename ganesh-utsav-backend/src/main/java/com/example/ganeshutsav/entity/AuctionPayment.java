package com.example.ganeshutsav.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * One money receipt against an auction won by a resident. Every increase of
 * {@link Auction#getAmountPaid()} stores a row here, so the committee and the colony can see
 * how much was paid and on which date, per winning resident.
 */
@Entity
@Table(name = "auction_payments")
public class AuctionPayment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auction_id", nullable = false)
    private Auction auction;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate paymentDate;

    /**
     * How this receipt came in: cash, UPI, bank transfer or other. Optional so rows recorded before
     * payment modes were captured still load, and backfilled receipts stay valid.
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private PaymentMethod paymentMethod;

    /** Screenshot or receipt photo the committee attached to this payment. */
    @Column(length = 500)
    private String paymentProofPath;

    /** Who received the money on a cash receipt; UPI and bank transfers keep a proof instead. */
    @Column(length = 120)
    private String paidTo;

    @Column(length = 500)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    private User createdBy;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() { createdAt = Instant.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Auction getAuction() { return auction; }
    public void setAuction(Auction auction) { this.auction = auction; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDate getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getPaymentProofPath() { return paymentProofPath; }
    public void setPaymentProofPath(String paymentProofPath) { this.paymentProofPath = paymentProofPath; }
    public String getPaidTo() { return paidTo; }
    public void setPaidTo(String paidTo) { this.paidTo = paidTo; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public Instant getCreatedAt() { return createdAt; }
}
