package com.example.ganeshutsav.controller;

import com.example.ganeshutsav.dto.*;
import com.example.ganeshutsav.service.*;
import java.time.LocalDate;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public")
public class PublicControllers {
    private final DashboardService dashboardService;
    private final ContributionService contributionService;
    private final ExpenseService expenseService;
    private final AuctionService auctionService;

    public PublicControllers(DashboardService dashboardService, ContributionService contributionService, ExpenseService expenseService, AuctionService auctionService) {
        this.dashboardService = dashboardService;
        this.contributionService = contributionService;
        this.expenseService = expenseService;
        this.auctionService = auctionService;
    }

    @GetMapping("/dashboard")
    public DashboardDtos.StatResponse dashboard() {
        return dashboardService.stats(true);
    }

    @GetMapping("/contributions")
    public List<ContributionDtos.ContributionResponse> contributions(@RequestParam(required = false) String search, @RequestParam(required = false) String occasion) {
        return contributionService.list(search, "PAID", null, occasion, null, null);
    }

    @GetMapping("/expenses")
    public List<PublicDtos.PublicExpenseResponse> expenses(@RequestParam(required = false) String search, @RequestParam(required = false) Long categoryId, @RequestParam(required = false) String occasion, @RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to) {
        return expenseService.list(search, categoryId, occasion, from, to).stream()
                .map(e -> new PublicDtos.PublicExpenseResponse(e.id(), e.category(), e.description(), e.amount(), e.expenseDate(), e.occasion()))
                .toList();
    }

    @GetMapping("/auctions")
    public List<AuctionDtos.AuctionResponse> auctions(@RequestParam(required = false) String search, @RequestParam(required = false) String winnerName, @RequestParam(required = false) String paymentStatus, @RequestParam(required = false) String occasion, @RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to) {
        return auctionService.list(search, winnerName, paymentStatus, occasion, from, to);
    }
}
