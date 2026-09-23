package com.example.ganeshutsav.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "contributions")
public class Contribution {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String contributorName;

    @Column(length = 30)
    private String flatNumber;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentMethod paymentMethod;

    @Column(length = 120)
    private String transactionId;

    @Column(length = 120)
    private String paidTo;

    @Column(length = 500)
    private String paymentProofPath;

    @Column(nullable = false)
    private LocalDate paymentDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status = PaymentStatus.PAID;

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
    public String getContributorName() { return contributorName; }
    public void setContributorName(String contributorName) { this.contributorName = contributorName; }
    public String getFlatNumber() { return flatNumber; }
    public void setFlatNumber(String flatNumber) { this.flatNumber = flatNumber; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public String getPaidTo() { return paidTo; }
    public void setPaidTo(String paidTo) { this.paidTo = paidTo; }
    public String getPaymentProofPath() { return paymentProofPath; }
    public void setPaymentProofPath(String paymentProofPath) { this.paymentProofPath = paymentProofPath; }
    public LocalDate getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }
    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }
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
