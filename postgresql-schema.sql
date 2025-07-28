-- PostgreSQL Schema for MoP Inscription Deck Tracker
-- Version 2.0+ - Complete schema replacement for SQLite
-- Created: July 28, 2025

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'officer', 'user');
CREATE TYPE deck_status AS ENUM ('incomplete', 'completed', 'allocated', 'sold');
CREATE TYPE notification_type AS ENUM ('approval', 'deck_completion', 'payout', 'request', 'registration', 'system');

-- Users table with enhanced security and UUIDs
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role user_role DEFAULT 'user',
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT username_length CHECK (char_length(username) >= 3),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Cards table with improved indexing
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate cards per user
    UNIQUE(user_id, card_name)
);

-- Completed decks with enhanced tracking
CREATE TABLE completed_decks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deck_name VARCHAR(100) NOT NULL,
    contributors JSONB NOT NULL, -- Store array of contributor info
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    disposition VARCHAR(50),
    recipient VARCHAR(100),
    sale_price DECIMAL(10,2),
    estimated_value DECIMAL(10,2),
    status deck_status DEFAULT 'completed',
    allocated_by UUID REFERENCES users(id),
    allocated_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure valid JSON structure for contributors
    CONSTRAINT valid_contributors CHECK (jsonb_typeof(contributors) = 'array')
);

-- Deck requests with priority and tracking
CREATE TABLE deck_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deck_name VARCHAR(100) NOT NULL,
    priority INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    
    CONSTRAINT priority_range CHECK (priority BETWEEN 1 AND 5)
);

-- Enhanced notifications with better categorization
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional structured data
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Activity log with enhanced tracking
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50), -- 'card', 'deck', 'user', etc.
    target_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discord webhook configuration
CREATE TABLE discord_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_url TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    notification_types JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gotify configuration per user
CREATE TABLE gotify_config (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    server_url TEXT NOT NULL,
    app_token TEXT NOT NULL,
    notification_types JSONB DEFAULT '["all"]'::jsonb,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System announcements
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    links JSONB DEFAULT '[]'::jsonb,
    active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System update tracking
CREATE TABLE system_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    backup_path TEXT,
    rollback_available BOOLEAN DEFAULT false,
    initiated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences and settings
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light',
    timezone VARCHAR(50) DEFAULT 'UTC',
    email_notifications BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session management for better security
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for optimal performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_approved ON users(role, approved);

CREATE INDEX idx_cards_user_id ON cards(user_id);
CREATE INDEX idx_cards_card_name ON cards(card_name);
CREATE INDEX idx_cards_user_card ON cards(user_id, card_name);
CREATE INDEX idx_cards_created_at ON cards(created_at);

CREATE INDEX idx_completed_decks_deck_name ON completed_decks(deck_name);
CREATE INDEX idx_completed_decks_status ON completed_decks(status);
CREATE INDEX idx_completed_decks_completed_at ON completed_decks(completed_at);
CREATE INDEX idx_completed_decks_contributors ON completed_decks USING GIN (contributors);

CREATE INDEX idx_deck_requests_user_id ON deck_requests(user_id);
CREATE INDEX idx_deck_requests_status ON deck_requests(status);
CREATE INDEX idx_deck_requests_priority ON deck_requests(priority DESC);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_action ON activity_log(action);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_target ON activity_log(target_type, target_id);

CREATE INDEX idx_gotify_config_enabled ON gotify_config(enabled) WHERE enabled = true;

CREATE INDEX idx_announcements_active ON announcements(active, expires_at) WHERE active = true;

CREATE INDEX idx_system_updates_status ON system_updates(status);
CREATE INDEX idx_system_updates_created_at ON system_updates(created_at DESC);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);

-- Full-text search indexes
CREATE INDEX idx_cards_card_name_search ON cards USING GIN (to_tsvector('english', card_name));
CREATE INDEX idx_completed_decks_search ON completed_decks USING GIN (to_tsvector('english', deck_name));
CREATE INDEX idx_notifications_search ON notifications USING GIN (to_tsvector('english', title || ' ' || message));

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discord_config_updated_at BEFORE UPDATE ON discord_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gotify_config_updated_at BEFORE UPDATE ON gotify_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE VIEW active_users AS
SELECT u.*, up.theme, up.timezone 
FROM users u 
LEFT JOIN user_preferences up ON u.id = up.user_id 
WHERE u.approved = true;

CREATE VIEW deck_completion_stats AS
SELECT 
    DATE_TRUNC('month', completed_at) as month,
    COUNT(*) as completed_count,
    AVG(sale_price) as avg_sale_price,
    SUM(sale_price) as total_sales
FROM completed_decks 
WHERE completed_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', completed_at)
ORDER BY month DESC;

CREATE VIEW user_contribution_stats AS
SELECT 
    u.id,
    u.username,
    COUNT(c.id) as card_count,
    COUNT(DISTINCT cd.id) as deck_contributions
FROM users u
LEFT JOIN cards c ON u.id = c.user_id
LEFT JOIN completed_decks cd ON cd.contributors @> jsonb_build_array(jsonb_build_object('user_id', u.id))
WHERE u.approved = true
GROUP BY u.id, u.username
ORDER BY card_count DESC, deck_contributions DESC;

-- Create function for full-text search
CREATE OR REPLACE FUNCTION search_cards(search_term TEXT)
RETURNS TABLE (
    id UUID,
    card_name VARCHAR(100),
    username VARCHAR(50),
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.card_name,
        u.username,
        ts_rank(to_tsvector('english', c.card_name), plainto_tsquery('english', search_term)) as rank
    FROM cards c
    JOIN users u ON c.user_id = u.id
    WHERE to_tsvector('english', c.card_name) @@ plainto_tsquery('english', search_term)
    ORDER BY rank DESC, c.card_name;
END;
$$ LANGUAGE plpgsql;

-- Create function for notification cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function for session cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (will be customized per installation)
-- GRANT USAGE ON SCHEMA public TO mop_tracker_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mop_tracker_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mop_tracker_app;

COMMENT ON DATABASE mop_card_tracker IS 'MoP Inscription Deck Tracker - PostgreSQL Database Schema v2.0';
