const db = require('../config/db');

// Create a booking
const createBooking = async (req, res) => {
  const { slotId } = req.body;
  const userId = req.user.id;

  if (!slotId) {
    return res.status(400).json({ error: 'Slot ID is required' });
  }

  try {
    // 1. Fetch slot details and current bookings count
    const slotQuery = await db.query(
      `SELECT s.*, COALESCE(COUNT(b.id), 0)::int AS bookings_count
       FROM slots s
       LEFT JOIN bookings b ON s.id = b.slot_id
       WHERE s.id = $1
       GROUP BY s.id`,
      [slotId]
    );

    const slot = slotQuery.rows[0];

    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    // 2. Check own capacity
    if (slot.bookings_count >= slot.capacity) {
      return res.status(400).json({ error: 'Este horario está lleno' });
    }

    // 3. Cross-modality blocking rules
    // Find the OTHER modality slot at the same time block
    const otherModality = slot.modality === 'fuerza' ? 'personalizado' : 'fuerza';
    const otherSlotQuery = await db.query(
      `SELECT s.*, COALESCE(COUNT(b.id), 0)::int AS bookings_count
       FROM slots s
       LEFT JOIN bookings b ON s.id = b.slot_id
       WHERE s.modality = $1 AND s.date = $2 AND s.start_time = $3
       GROUP BY s.id`,
      [otherModality, slot.date, slot.start_time]
    );
    const otherSlot = otherSlotQuery.rows[0];
    const otherBooked = otherSlot ? otherSlot.bookings_count : 0;

    if (slot.modality === 'fuerza' && otherBooked >= 2) {
      return res.status(400).json({ error: 'Este horario está bloqueado: ya hay 2 reservas de entrenamiento personalizado en este bloque.' });
    }
    if (slot.modality === 'personalizado' && otherBooked >= 3) {
      return res.status(400).json({ error: 'Este horario está bloqueado: ya hay 3 o más reservas de fuerza en este bloque.' });
    }

    // 4. Check if user already booked this slot
    const userBookingCheck = await db.query(
      'SELECT * FROM bookings WHERE user_id = $1 AND slot_id = $2',
      [userId, slotId]
    );

    if (userBookingCheck.rows.length > 0) {
      return res.status(400).json({ error: 'You have already booked this session' });
    }

    // 4. Create the booking
    const result = await db.query(
      'INSERT INTO bookings (user_id, slot_id) VALUES ($1, $2) RETURNING *',
      [userId, slotId]
    );

    // 5. Notify admin of new booking
    try {
      const userQuery = await db.query('SELECT name FROM users WHERE id = $1', [userId]);
      const userName = userQuery.rows[0]?.name || 'Un usuario';
      const dateStr = slot.date ? new Date(slot.date).toISOString().split('T')[0] : '';
      const timeStr = slot.start_time ? slot.start_time.substring(0, 5) : '';
      const msg = `📅 ${userName} reservó ${slot.modality} para el ${dateStr} a las ${timeStr}.`;
      await db.query(
        'INSERT INTO notifications (message, type) VALUES ($1, $2)',
        [msg, 'new_booking']
      );
    } catch (notifErr) {
      console.error('Error creating booking notification:', notifErr);
    }

    return res.status(201).json({
      message: 'Booking confirmed successfully',
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get bookings for logged-in user
const getUserBookings = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT b.id AS booking_id, b.created_at AS booked_at,
              s.id AS slot_id, s.modality, s.date, s.start_time, s.end_time
       FROM bookings b
       JOIN slots s ON b.slot_id = s.id
       WHERE b.user_id = $1
       ORDER BY s.date DESC, s.start_time DESC`,
      [userId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Cancel a booking
const cancelBooking = async (req, res) => {
  const { id } = req.params; // booking ID
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // Verify booking exists and belongs to user (unless admin)
    const bookingQuery = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
    const booking = bookingQuery.rows[0];

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to cancel this booking' });
    }

    // Fetch user and slot details for notification if user is cancelling
    if (userRole !== 'admin') {
      const detailsQuery = await db.query(
        `SELECT u.name, s.modality, s.date, s.start_time 
         FROM users u, slots s 
         WHERE u.id = $1 AND s.id = $2`,
        [userId, booking.slot_id]
      );
      if (detailsQuery.rows.length > 0) {
        const { name, modality, date, start_time } = detailsQuery.rows[0];
        const dateStr = date ? date.toISOString().split('T')[0] : '';
        const msg = `El usuario ${name} ha cancelado su reserva de ${modality} para el ${dateStr} a las ${start_time}.`;
        await db.query(
          'INSERT INTO notifications (message, type) VALUES ($1, $2)',
          [msg, 'cancelation']
        );
      }
    }

    await db.query('DELETE FROM bookings WHERE id = $1', [id]);

    return res.json({ message: 'Booking canceled successfully' });
  } catch (error) {
    console.error('Error canceling booking:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all bookings (Admin only)
const getAllBookings = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT b.id AS booking_id, b.created_at AS booked_at,
              u.id AS user_id, u.name AS user_name, u.email AS user_email,
              s.id AS slot_id, s.modality, s.date, s.start_time, s.end_time
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN slots s ON b.slot_id = s.id
       ORDER BY s.date DESC, s.start_time DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  cancelBooking,
  getAllBookings
};
