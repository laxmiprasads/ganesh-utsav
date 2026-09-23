package com.example.ganeshutsav.service;

import com.example.ganeshutsav.dto.ExpenseDtos;
import com.example.ganeshutsav.entity.Expense;
import com.example.ganeshutsav.entity.ExpenseCategory;
import com.example.ganeshutsav.entity.RecordStatus;
import com.example.ganeshutsav.exception.DuplicateRecordException;
import com.example.ganeshutsav.exception.ResourceNotFoundException;
import com.example.ganeshutsav.mapper.EntityMapper;
import com.example.ganeshutsav.repository.ExpenseCategoryRepository;
import com.example.ganeshutsav.repository.ExpenseRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ExpenseService {
    private final ExpenseRepository repository;
    private final ExpenseCategoryRepository categoryRepository;
    private final CurrentUserService currentUserService;
    private final EntityMapper mapper;

    public ExpenseService(ExpenseRepository repository, ExpenseCategoryRepository categoryRepository, CurrentUserService currentUserService, EntityMapper mapper) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
        this.currentUserService = currentUserService;
        this.mapper = mapper;
    }

    public List<ExpenseDtos.CategoryResponse> categories() {
        return categoryRepository.findAll().stream().map(mapper::expenseCategory).toList();
    }

    public ExpenseDtos.CategoryResponse createCategory(ExpenseDtos.CategoryRequest request) {
        categoryRepository.findByNameIgnoreCase(request.name()).ifPresent(c -> { throw new DuplicateRecordException("Expense category already exists"); });
        ExpenseCategory category = new ExpenseCategory();
        category.setName(request.name());
        category.setStatus(request.status() == null ? RecordStatus.ACTIVE : request.status());
        return mapper.expenseCategory(categoryRepository.save(category));
    }

    public ExpenseDtos.CategoryResponse updateCategory(Long id, ExpenseDtos.CategoryRequest request) {
        ExpenseCategory category = findCategory(id);
        category.setName(request.name());
        category.setStatus(request.status() == null ? RecordStatus.ACTIVE : request.status());
        return mapper.expenseCategory(categoryRepository.save(category));
    }

    public List<ExpenseDtos.ExpenseResponse> list(String search, Long categoryId, String occasion, LocalDate from, LocalDate to) {
        return repository.findAll().stream()
                .filter(e -> e.getStatus() == RecordStatus.ACTIVE)
                .filter(e -> categoryId == null || (e.getCategory() != null && e.getCategory().getId().equals(categoryId)))
                .filter(e -> occasion == null || occasion.isBlank() || (e.getOccasion() != null && e.getOccasion().equalsIgnoreCase(occasion)))
                .filter(e -> from == null || !e.getExpenseDate().isBefore(from))
                .filter(e -> to == null || !e.getExpenseDate().isAfter(to))
                .filter(e -> matches(e.getCategory() == null ? null : e.getCategory().getName(), search) || matches(e.getDescription(), search) || matches(e.getPaidBy(), search))
                .map(mapper::expense)
                .toList();
    }

    public ExpenseDtos.ExpenseResponse get(Long id) {
        return mapper.expense(find(id));
    }

    public ExpenseDtos.ExpenseResponse create(ExpenseDtos.ExpenseRequest request) {
        Expense e = new Expense();
        apply(e, request);
        e.setCreatedBy(currentUserService.currentUser());
        e.setUpdatedBy(currentUserService.currentUser());
        return mapper.expense(repository.save(e));
    }

    public ExpenseDtos.ExpenseResponse update(Long id, ExpenseDtos.ExpenseRequest request) {
        Expense e = find(id);
        apply(e, request);
        e.setUpdatedBy(currentUserService.currentUser());
        return mapper.expense(repository.save(e));
    }

    public void deactivate(Long id) {
        Expense e = find(id);
        e.setStatus(RecordStatus.INACTIVE);
        e.setUpdatedBy(currentUserService.currentUser());
        repository.save(e);
    }

    Expense find(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Expense not found"));
    }

    ExpenseCategory findCategory(Long id) {
        return categoryRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Expense category not found"));
    }

    private void apply(Expense e, ExpenseDtos.ExpenseRequest request) {
        if (request.categoryId() != null) {
            e.setCategory(findCategory(request.categoryId()));
        }
        e.setDescription(request.description());
        e.setAmount(request.amount());
        e.setExpenseDate(request.expenseDate());
        e.setPaidBy(request.paidBy());
        e.setReceiptUrl(request.receiptUrl());
        e.setOccasion(request.occasion() == null || request.occasion().isBlank() ? "Ganesh Chaturthi" : request.occasion().trim());
        e.setNotes(request.notes());
        e.setStatus(request.status() == null ? RecordStatus.ACTIVE : request.status());
    }

    private boolean matches(String value, String search) {
        return search == null || search.isBlank() || (value != null && value.toLowerCase().contains(search.toLowerCase()));
    }
}
