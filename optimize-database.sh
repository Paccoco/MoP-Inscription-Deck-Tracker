#!/bin/bash
# Database Performance Optimization Script
# Adds indexes to frequently queried columns

echo "🚀 Adding database indexes for performance optimization..."

# Add indexes to cards.db
sqlite3 cards.db <<EOF
-- Cards table indexes
CREATE INDEX IF NOT EXISTS idx_cards_owner ON cards(owner);
CREATE INDEX IF NOT EXISTS idx_cards_deck ON cards(deck);
CREATE INDEX IF NOT EXISTS idx_cards_card_name ON cards(card_name);
CREATE INDEX IF NOT EXISTS idx_cards_deck_owner ON cards(deck, owner);

-- Users table indexes  
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_approved ON users(approved);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- Completed decks table indexes
CREATE INDEX IF NOT EXISTS idx_completed_decks_deck ON completed_decks(deck);
CREATE INDEX IF NOT EXISTS idx_completed_decks_completed_at ON completed_decks(completed_at);
CREATE INDEX IF NOT EXISTS idx_completed_decks_disposition ON completed_decks(disposition);

-- Deck requests table indexes
CREATE INDEX IF NOT EXISTS idx_deck_requests_username ON deck_requests(username);
CREATE INDEX IF NOT EXISTS idx_deck_requests_deck ON deck_requests(deck);
CREATE INDEX IF NOT EXISTS idx_deck_requests_requested_at ON deck_requests(requested_at);
CREATE INDEX IF NOT EXISTS idx_deck_requests_fulfilled ON deck_requests(fulfilled);

-- Activity table indexes
CREATE INDEX IF NOT EXISTS idx_activity_username ON activity(username);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_username_timestamp ON activity(username, timestamp);

-- Activity log table indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log(timestamp);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_username ON notifications(username);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_username_read ON notifications(username, read);

-- Announcement table indexes
CREATE INDEX IF NOT EXISTS idx_announcement_active ON announcement(active);
CREATE INDEX IF NOT EXISTS idx_announcement_expiry ON announcement(expiry);

-- System updates table indexes
CREATE INDEX IF NOT EXISTS idx_system_updates_update_time ON system_updates(update_time);
CREATE INDEX IF NOT EXISTS idx_system_updates_status ON system_updates(status);

-- Update checks table indexes
CREATE INDEX IF NOT EXISTS idx_update_checks_check_time ON update_checks(check_time);
CREATE INDEX IF NOT EXISTS idx_update_checks_update_available ON update_checks(update_available);

-- Gotify config table indexes
CREATE INDEX IF NOT EXISTS idx_gotify_config_username ON gotify_config(username);

-- Scheduled updates table indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_updates_scheduled_time ON scheduled_updates(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_updates_status ON scheduled_updates(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_updates_created_by ON scheduled_updates(created_by);

-- Card history table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_card_history_card_id ON card_history(card_id);
CREATE INDEX IF NOT EXISTS idx_card_history_timestamp ON card_history(timestamp);

-- Deck history table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_deck_history_deck_id ON deck_history(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_history_timestamp ON deck_history(timestamp);

-- Analyze tables for query optimization
ANALYZE;

-- Vacuum to optimize database file
VACUUM;
EOF

echo "✅ Database indexes created successfully!"
echo "📊 Performance optimizations:"
echo "   - Added 25+ indexes on frequently queried columns"
echo "   - Optimized JOIN queries with composite indexes"
echo "   - Added timestamp indexes for chronological queries"
echo "   - User-based queries optimized with username indexes"
echo "   - Database analyzed and vacuumed for optimal performance"
echo ""
echo "🔍 Query performance should be significantly improved for:"
echo "   - Card lookups by owner, deck, or name"
echo "   - User authentication and authorization checks"
echo "   - Activity logs and notifications"
echo "   - Admin dashboard data aggregation"
echo "   - Historical data queries"
