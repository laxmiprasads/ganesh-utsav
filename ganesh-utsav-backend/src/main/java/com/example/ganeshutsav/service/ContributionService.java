package com.example.ganeshutsav.service;

import com.example.ganeshutsav.dto.ContributionDtos;
import com.example.ganeshutsav.entity.Contribution;
import com.example.ganeshutsav.entity.PaymentStatus;
import com.example.ganeshutsav.exception.ResourceNotFoundException;
import com.example.ganeshutsav.mapper.EntityMapper;
import com.example.ganeshutsav.repository.ContributionRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ContributionService {
    private final ContributionRepository repository;
    private final CurrentUserService currentUserService;
    private final EntityMapper mapper;

    public ContributionService(ContributionRepository repository, CurrentUserService currentUserService, EntityMapper mapper) {
        this.repository = repository;
        this.currentUserService = currentUserService;
        this.mapper = mapper;
    }

    public List<ContributionDtos.ContributionResponse> list(String search, String status, String paymentMethod, String occasion, LocalDate from, LocalDate to) {
        return repository.findAll().stream()
                .filter(c -> status == null || c.getStatus().name().equalsIgnoreCase(status))
                .filter(c -> paymentMethod == null || c.getPaymentMethod().name().equalsIgnoreCase(paymentMethod))
                .filter(c -> occasion == null || occasion.isBlank() || (c.getOccasion() != null && c.getOccasion().equalsIgnoreCase(occasion)))
                .filter(c -> from == null || !c.getPaymentDate().isBefore(from))
                .filter(c -> to == null || !c.getPaymentDate().isAfter(to))
                .filter(c -> matches(c.getContributorName(), search) || matches(c.getFlatNumber(), search) || matches(c.getTransactionId(), search))
                .map(mapper::contribution)
                .toList();
    }

    public List<ContributionDtos.PublicContributionResponse> publicContributions(String search) {
        Map<String, ContributionDtos.PublicContributionResponse> grouped = new LinkedHashMap<>();
        repository.findAll().stream()
                .filter(c -> c.getStatus() == PaymentStatus.PAID)
                .filter(c -> matches(c.getContributorName(), search) || matches(c.getFlatNumber(), search))
                .forEach(c -> {
                    String name = c.getContributorName() == null ? "" : c.getContributorName();
                    String flat = c.getFlatNumber() == null ? "" : c.getFlatNumber();
                    String key = name.toLowerCase() + "|" + flat.toLowerCase();
                    ContributionDtos.PublicContributionResponse existing = grouped.get(key);
                    BigDecimal total = (existing == null ? BigDecimal.ZERO : existing.amount()).add(c.getAmount());
                    grouped.put(key, new ContributionDtos.PublicContributionResponse(name, flat.isEmpty() ? null : flat, total));
                });
        return grouped.values().stream()
                .sorted(Comparator.comparing(ContributionDtos.PublicContributionResponse::amount).reversed())
                .toList();
    }

    public ContributionDtos.ContributionResponse get(Long id) {
        return mapper.contribution(find(id));
    }

    public ContributionDtos.ContributionResponse create(ContributionDtos.ContributionRequest request) {
        Contribution c = new Contribution();
        apply(c, request);
        c.setCreatedBy(currentUserService.currentUser());
        c.setUpdatedBy(currentUserService.currentUser());
        return mapper.contribution(repository.save(c));
    }

    public ContributionDtos.ContributionResponse update(Long id, ContributionDtos.ContributionRequest request) {
        Contribution c = find(id);
        apply(c, request);
        c.setUpdatedBy(currentUserService.currentUser());
        return mapper.contribution(repository.save(c));
    }

    Contribution find(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Contribution not found"));
    }

    private void apply(Contribution c, ContributionDtos.ContributionRequest request) {
        c.setContributorName(request.contributorName());
        c.setFlatNumber(request.flatNumber());
        c.setAmount(request.amount());
        c.setPaymentMethod(request.paymentMethod());
        c.setTransactionId(request.transactionId());
        c.setPaidTo(request.paidTo());
        c.setPaymentProofPath(request.paymentProofPath());
        c.setPaymentDate(request.paymentDate());
        c.setStatus(request.status());
        c.setOccasion(request.occasion() == null || request.occasion().isBlank() ? "Ganesh Chaturthi" : request.occasion().trim());
        c.setNotes(request.notes());
    }

    private boolean matches(String value, String search) {
        return search == null || search.isBlank() || (value != null && value.toLowerCase().contains(search.toLowerCase()));
    }
}
