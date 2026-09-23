package com.example.ganeshutsav.repository;

import com.example.ganeshutsav.entity.Auction;
import com.example.ganeshutsav.entity.RecordStatus;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AuctionRepository extends JpaRepository<Auction, Long> {
    /**
     * Money actually received from auctions, including part payments, so the dashboard reflects a
     * partial payment the moment the committee records it.
     */
    @Query("select coalesce(sum(a.amountPaid), 0) from Auction a where a.status = :recordStatus")
    BigDecimal sumAmountPaidByStatus(RecordStatus recordStatus);

    /**
     * Total auction money offered by winners, i.e. the sum of the winning bids, no matter how much
     * has been collected yet. The dashboard shows it next to the money actually received.
     */
    @Query("select coalesce(sum(a.winningAmount), 0) from Auction a where a.status = :recordStatus")
    BigDecimal sumWinningAmountByStatus(RecordStatus recordStatus);

    long countByStatus(RecordStatus status);

    List<Auction> findTop5ByStatusOrderByAuctionDateDescIdDesc(RecordStatus status);
}
