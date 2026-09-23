package com.example.ganeshutsav.repository;

import com.example.ganeshutsav.entity.AuctionPayment;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuctionPaymentRepository extends JpaRepository<AuctionPayment, Long> {
    List<AuctionPayment> findByAuctionIdOrderByPaymentDateAscIdAsc(Long auctionId);

    /**
     * Loads the whole payment ledger in one query so a list of auctions can be mapped without a
     * lazy load per row.
     */
    @Query("select p from AuctionPayment p join fetch p.auction order by p.paymentDate asc, p.id asc")
    List<AuctionPayment> findAllWithAuction();

    @Query("select coalesce(sum(p.amount), 0) from AuctionPayment p where p.auction.id = :auctionId")
    BigDecimal sumByAuction(@Param("auctionId") Long auctionId);
}
