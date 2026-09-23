package com.example.ganeshutsav.repository;

import com.example.ganeshutsav.entity.Contribution;
import com.example.ganeshutsav.entity.PaymentStatus;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ContributionRepository extends JpaRepository<Contribution, Long> {
    @Query("select coalesce(sum(c.amount), 0) from Contribution c where c.status = :status")
    BigDecimal sumByStatus(PaymentStatus status);

    List<Contribution> findTop5ByOrderByPaymentDateDescIdDesc();
}
