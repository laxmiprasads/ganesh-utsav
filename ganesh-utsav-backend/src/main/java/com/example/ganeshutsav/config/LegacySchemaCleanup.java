package com.example.ganeshutsav.config;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Ganesh Utsav 2026 keeps a simpler data model than the original schema, but Hibernate's
 * "ddl-auto: update" never removes or relaxes existing columns. This runner fixes up the
 * leftovers once at startup, before the data seeder inserts anything:
 *
 * - contributions store the contributor name directly, so contributor_id is dropped
 * - auctions store the auction item name and winner name directly, so category_id and
 *   winner_contributor_id are dropped
 * - the contributors and auction_categories tables are no longer used
 * - expenses no longer require a category, so expenses.category_id is made nullable
 * - auctions keep a payment ledger, so amount_paid already stored on older auctions is recorded
 *   once as an opening payment row
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class LegacySchemaCleanup implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(LegacySchemaCleanup.class);

    private final JdbcTemplate jdbcTemplate;

    public LegacySchemaCleanup(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            migrateAuctionNames();
            dropLegacyColumn("contributions", "contributor_id");
            dropLegacyColumn("auctions", "winner_contributor_id");
            dropLegacyColumn("auctions", "category_id");
            dropLegacyTable("contributors");
            dropLegacyTable("auction_categories");
            makeColumnNullable("expenses", "category_id", "bigint null");
            backfillAuctionPayments();
            backfillAuctionPaymentHistory();
        } catch (Exception ex) {
            log.warn("Legacy contributor cleanup skipped: {}", ex.getMessage());
        }
    }

    private void dropLegacyColumn(String table, String column) {
        if (!columnExists(table, column)) {
            return;
        }
        List<String> foreignKeys = jdbcTemplate.queryForList(
                "select constraint_name from information_schema.key_column_usage where table_schema = database() and table_name = ? and column_name = ? and referenced_table_name is not null",
                String.class, table, column);
        for (String foreignKey : foreignKeys) {
            jdbcTemplate.execute("alter table " + table + " drop foreign key " + foreignKey);
        }
        jdbcTemplate.execute("alter table " + table + " drop column " + column);
        log.info("Dropped legacy column {}.{}", table, column);
    }

    /**
     * Payment status is now derived from amount_paid. Older rows only knew PAID / PENDING,
     * so a previously PAID auction is treated as fully collected and the status is recomputed.
     */
    private void backfillAuctionPayments() {
        if (!columnExists("auctions", "amount_paid")) {
            return;
        }
        int filled = jdbcTemplate.update(
                "update auctions set amount_paid = case when payment_status = 'PAID' then winning_amount else 0 end where amount_paid is null or amount_paid = 0");
        if (filled > 0) {
            log.info("Backfilled amount_paid on {} auction row(s)", filled);
        }
        int recalculated = jdbcTemplate.update(
                "update auctions set payment_status = case when amount_paid <= 0 then 'PENDING' when amount_paid >= winning_amount then 'PAID' else 'PARTIAL' end "
                        + "where payment_status <> case when amount_paid <= 0 then 'PENDING' when amount_paid >= winning_amount then 'PAID' else 'PARTIAL' end");
        if (recalculated > 0) {
            log.info("Recalculated payment_status on {} auction row(s)", recalculated);
        }
    }

    /**
     * Auctions created before payment history existed already have an amount_paid value. This stores
     * that money as the opening receipt of the auction so every winning resident has a payment trail.
     */
    private void backfillAuctionPaymentHistory() {
        if (!tableExists("auction_payments") || !columnExists("auctions", "amount_paid")) {
            return;
        }
        int inserted = jdbcTemplate.update(
                "insert into auction_payments (auction_id, amount, payment_date, notes, created_by, created_at) "
                        + "select a.id, a.amount_paid, a.auction_date, 'Opening amount carried forward from the auction record', a.created_by, now() "
                        + "from auctions a "
                        + "where a.amount_paid > 0 and not exists (select 1 from auction_payments p where p.auction_id = a.id)");
        if (inserted > 0) {
            log.info("Recorded opening auction payment history for {} auction row(s)", inserted);
        }
    }

    private void migrateAuctionNames() {
        if (!columnExists("auctions", "category_id") || !columnExists("auctions", "auction_name") || !tableExists("auction_categories")) {
            return;
        }
        int updated = jdbcTemplate.update(
                "update auctions a join auction_categories c on a.category_id = c.id set a.auction_name = c.name where a.auction_name is null or a.auction_name = ''");
        if (updated > 0) {
            log.info("Copied {} auction category name(s) into auctions.auction_name", updated);
        }
    }

    private void dropLegacyTable(String table) {
        if (!tableExists(table)) {
            return;
        }
        jdbcTemplate.execute("drop table if exists " + table);
        log.info("Dropped legacy table {}", table);
    }

    private boolean tableExists(String table) {
        Integer exists = jdbcTemplate.queryForObject(
                "select count(*) from information_schema.tables where table_schema = database() and table_name = ?",
                Integer.class, table);
        return exists != null && exists > 0;
    }

    private void makeColumnNullable(String table, String column, String columnDefinition) {
        List<String> current = jdbcTemplate.queryForList(
                "select is_nullable from information_schema.columns where table_schema = database() and table_name = ? and column_name = ?",
                String.class, table, column);
        if (current.isEmpty() || "YES".equalsIgnoreCase(current.get(0))) {
            return;
        }
        jdbcTemplate.execute("alter table " + table + " modify column " + column + " " + columnDefinition);
        log.info("Made {}.{} nullable", table, column);
    }

    private boolean columnExists(String table, String column) {
        Integer exists = jdbcTemplate.queryForObject(
                "select count(*) from information_schema.columns where table_schema = database() and table_name = ? and column_name = ?",
                Integer.class, table, column);
        return exists != null && exists > 0;
    }
}