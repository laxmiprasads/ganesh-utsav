package com.example.ganeshutsav.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "expenses")
public class Expense {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private ExpenseCategory category;

    @Column(nullable = false, length = 220)
    private String description;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate expenseDate;

    @Column(length = 100)
    private String paidBy;

    @Column(length = 500)
    private String receiptUrl;

    @Column(length = 500)
    private String notes;

    @Column(length = 100)
    private String occasion = "Ganesh Chaturthi";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RecordStatus status = RecordStatus.ACTIVE;

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
    public ExpenseCategory getCategory() { return category; }
    public void setCategory(ExpenseCategory category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDate getExpenseDate() { return expenseDate; }
    public void setExpenseDate(LocalDate expenseDate) { this.expenseDate = expenseDate; }
    public String getPaidBy() { return paidBy; }
    public void setPaidBy(String paidBy) { this.paidBy = paidBy; }
    public String getReceiptUrl() { return receiptUrl; }
    public void setReceiptUrl(String receiptUrl) { this.receiptUrl = receiptUrl; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getOccasion() { return occasion; }
    public void setOccasion(String occasion) { this.occasion = occasion; }
    public RecordStatus getStatus() { return status; }
    public void setStatus(RecordStatus status) { this.status = status; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public User getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(User updatedBy) { this.updatedBy = updatedBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
