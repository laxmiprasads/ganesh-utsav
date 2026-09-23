package com.example.ganeshutsav.controller;

import com.example.ganeshutsav.dto.*;
import com.example.ganeshutsav.service.*;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/committee")
public class CommitteeControllers {
    private final DashboardService dashboardService;
    private final ContributionService contributionService;
    private final ExpenseService expenseService;
    private final AuctionService auctionService;

    public CommitteeControllers(DashboardService dashboardService, ContributionService contributionService, ExpenseService expenseService, AuctionService auctionService) {
        this.dashboardService = dashboardService;
        this.contributionService = contributionService;
        this.expenseService = expenseService;
        this.auctionService = auctionService;
    }

    @GetMapping("/dashboard")
    public DashboardDtos.StatResponse dashboard() { return dashboardService.stats(true); }

    @GetMapping("/contributions")
    public List<ContributionDtos.ContributionResponse> contributions(@RequestParam(required = false) String search, @RequestParam(required = false) String status, @RequestParam(required = false) String paymentMethod, @RequestParam(required = false) String occasion, @RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to) {
        return contributionService.list(search, status, paymentMethod, occasion, from, to);
    }

    @PostMapping("/contributions")
    @ResponseStatus(HttpStatus.CREATED)
    public ContributionDtos.ContributionResponse createContribution(@Valid @RequestBody ContributionDtos.ContributionRequest request) { return contributionService.create(request); }

    @GetMapping("/contributions/{id}")
    public ContributionDtos.ContributionResponse contribution(@PathVariable Long id) { return contributionService.get(id); }

    @PutMapping("/contributions/{id}")
    public ContributionDtos.ContributionResponse updateContribution(@PathVariable Long id, @Valid @RequestBody ContributionDtos.ContributionRequest request) { return contributionService.update(id, request); }

    @GetMapping("/expense-categories")
    public List<ExpenseDtos.CategoryResponse> expenseCategories() { return expenseService.categories(); }

    @PostMapping("/expense-categories")
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseDtos.CategoryResponse createExpenseCategory(@Valid @RequestBody ExpenseDtos.CategoryRequest request) { return expenseService.createCategory(request); }

    @PutMapping("/expense-categories/{id}")
    public ExpenseDtos.CategoryResponse updateExpenseCategory(@PathVariable Long id, @Valid @RequestBody ExpenseDtos.CategoryRequest request) { return expenseService.updateCategory(id, request); }

    @GetMapping("/expenses")
    public List<ExpenseDtos.ExpenseResponse> expenses(@RequestParam(required = false) String search, @RequestParam(required = false) Long categoryId, @RequestParam(required = false) String occasion, @RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to) {
        return expenseService.list(search, categoryId, occasion, from, to);
    }

    @PostMapping("/expenses")
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseDtos.ExpenseResponse createExpense(@Valid @RequestBody ExpenseDtos.ExpenseRequest request) { return expenseService.create(request); }

    @GetMapping("/expenses/{id}")
    public ExpenseDtos.ExpenseResponse expense(@PathVariable Long id) { return expenseService.get(id); }

    @PutMapping("/expenses/{id}")
    public ExpenseDtos.ExpenseResponse updateExpense(@PathVariable Long id, @Valid @RequestBody ExpenseDtos.ExpenseRequest request) { return expenseService.update(id, request); }

    @DeleteMapping("/expenses/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteExpense(@PathVariable Long id) { expenseService.deactivate(id); }

    @GetMapping("/auctions")
    public List<AuctionDtos.AuctionResponse> auctions(@RequestParam(required = false) String search, @RequestParam(required = false) String winnerName, @RequestParam(required = false) String paymentStatus, @RequestParam(required = false) String occasion, @RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to) {
        return auctionService.list(search, winnerName, paymentStatus, occasion, from, to);
    }

    @PostMapping("/auctions")
    @ResponseStatus(HttpStatus.CREATED)
    public AuctionDtos.AuctionResponse createAuction(@Valid @RequestBody AuctionDtos.AuctionRequest request) { return auctionService.create(request); }

    @GetMapping("/auctions/{id}")
    public AuctionDtos.AuctionResponse auction(@PathVariable Long id) { return auctionService.get(id); }

    @PutMapping("/auctions/{id}")
    public AuctionDtos.AuctionResponse updateAuction(@PathVariable Long id, @Valid @RequestBody AuctionDtos.AuctionRequest request) { return auctionService.update(id, request); }

    @PostMapping("/auctions/{id}/payments")
    @ResponseStatus(HttpStatus.CREATED)
    public AuctionDtos.AuctionResponse addAuctionPayment(@PathVariable Long id, @Valid @RequestBody AuctionDtos.AuctionPaymentRequest request) { return auctionService.addPayment(id, request); }

    @DeleteMapping("/auctions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAuction(@PathVariable Long id) { auctionService.deactivate(id); }
}
