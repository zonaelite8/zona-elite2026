-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for Users (Atletas & Admins)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Nullable for OAuth users
    google_id VARCHAR(255) UNIQUE, -- For Google Sign-In
    role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('client', 'admin')),
    available_classes INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for Training Slots (Turnos)
CREATE TABLE IF NOT EXISTS slots (
    id SERIAL PRIMARY KEY,
    modality VARCHAR(50) NOT NULL CHECK (modality IN ('fuerza', 'personalizado')),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INT NOT NULL, -- e.g. 5 for fuerza, 2 for personalizado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_slot_time UNIQUE (modality, date, start_time)
);

-- Table for Bookings (Reservas)
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    slot_id INT REFERENCES slots(id) ON DELETE CASCADE,
    evaluation JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_booking UNIQUE (user_id, slot_id)
);

-- Index for performance queries
CREATE INDEX IF NOT EXISTS idx_slots_date ON slots(date);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings(slot_id);

-- Insert default slots seed (sample data)
INSERT INTO slots (modality, date, start_time, end_time, capacity)
VALUES 
('fuerza', CURRENT_DATE, '08:00:00', '09:00:00', 5),
('fuerza', CURRENT_DATE, '09:00:00', '10:00:00', 5),
('personalizado', CURRENT_DATE, '10:00:00', '11:00:00', 2),
('personalizado', CURRENT_DATE, '11:00:00', '12:00:00', 2)
ON CONFLICT DO NOTHING;
