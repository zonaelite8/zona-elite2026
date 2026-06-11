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

    // 4.5. Check if user already booked ANOTHER slot at the exact same time
    const concurrentBookingCheck = await db.query(
      `SELECT b.* FROM bookings b
       JOIN slots s ON b.slot_id = s.id
       WHERE b.user_id = $1 AND s.date = $2 AND s.start_time = $3`,
      [userId, slot.date, slot.start_time]
    );

    if (concurrentBookingCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Ya tienes una reserva en este mismo horario. No puedes reservar fuerza y personalizado a la vez.' });
    }

    // 4. Create the booking with a unique cancel token
    const crypto = require('crypto');
    const cancelToken = crypto.randomUUID();

    const result = await db.query(
      'INSERT INTO bookings (user_id, slot_id, cancel_token) VALUES ($1, $2, $3) RETURNING *',
      [userId, slotId, cancelToken]
    );

    // 5. Notify admin and user of new booking
    try {
      const userQuery = await db.query('SELECT name, email FROM users WHERE id = $1', [userId]);
      const user = userQuery.rows[0];
      const userName = user?.name || 'Un usuario';
      const userEmail = user?.email;
      
      const dateStr = slot.date ? new Date(slot.date).toISOString().split('T')[0] : '';
      const timeStr = slot.start_time ? slot.start_time.substring(0, 5) : '';
      const modalityUpper = slot.modality.charAt(0).toUpperCase() + slot.modality.slice(1);
      
      // Database notification
      const msg = `📅 ${userName} reservó entrenamiento ${slot.modality} para el ${dateStr} a las ${timeStr}.`;
      await db.query(
        'INSERT INTO notifications (message, type) VALUES ($1, $2)',
        [msg, 'new_booking']
      );

      // Email notifications
      const emailService = require('../services/email.service');
      
      if (userEmail) {
        // Send email to client
        const clientSubject = `Confirmación de Reserva - Zona Elite`;
        const clientHtml = `
          <div style="background-color: #12141A; color: #F5F5F5; font-family: 'Inter', Arial, sans-serif; padding: 40px 20px; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #171A21; border: 1px solid #1E222B; border-radius: 16px; overflow: hidden;">
              <div style="background-color: #171A21; padding: 30px; text-align: center; border-bottom: 2px solid #F5B927;">
                <h1 style="color: #F5B927; font-family: 'Outfit', Arial, sans-serif; margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase;">ZONA ÉLITE</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #FFFFFF; font-size: 22px; margin-top: 0;">¡Hola ${userName}!</h2>
                <p style="color: #D1D5DB; font-size: 16px;">Tu reserva de entrenamiento <strong style="color: #F5B927; text-transform: uppercase;">${modalityUpper}</strong> ha sido confirmada.</p>
                
                <div style="background-color: #12141A; border: 1px solid #1E222B; border-radius: 12px; padding: 20px; margin: 30px 0;">
                  <p style="margin: 0 0 10px 0;"><span style="color: #8D94A5; display: inline-block; width: 60px;">Fecha:</span> <strong style="color: #FFFFFF; font-size: 16px;">${dateStr}</strong></p>
                  <p style="margin: 0;"><span style="color: #8D94A5; display: inline-block; width: 60px;">Hora:</span> <strong style="color: #FFFFFF; font-size: 16px;">${timeStr}</strong></p>
                </div>
                
                
                <div style="text-align: center; margin-top: 40px;">
                  <p style="color: #8D94A5; font-size: 14px; margin-bottom: 15px;">¿No puedes asistir?</p>
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/cancelar?token=${cancelToken}" style="background-color: transparent; border: 1px solid #ef4444; color: #ef4444; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: bold; display: inline-block;">Cancelar mi reserva</a>
                </div>
              </div>
              <div style="background-color: #12141A; padding: 20px; text-align: center; border-top: 1px solid #1E222B;">
                <p style="color: #8D94A5; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Zona Élite • Tu mejor versión te espera</p>
              </div>
            </div>
          </div>
        `;
        try {
          emailService.sendEmail(userEmail, clientSubject, '', clientHtml);
        } catch (emailErr) {
          console.error('Failed to send booking confirmation email to client:', emailErr);
        }
      }

      // Send email to admin
      const adminEmail = 'zonaelite8@gmail.com';
      const adminSubject = `Nueva Reserva: ${modalityUpper} - ${dateStr}`;
      const adminHtml = `
          <div style="background-color: #12141A; color: #F5F5F5; font-family: 'Inter', Arial, sans-serif; padding: 40px 20px; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #171A21; border: 1px solid #1E222B; border-radius: 16px; overflow: hidden;">
              <div style="background-color: #171A21; padding: 20px 30px; border-bottom: 2px solid #F5B927;">
                <h1 style="color: #F5B927; font-family: 'Outfit', Arial, sans-serif; margin: 0; font-size: 20px; letter-spacing: 1px; text-transform: uppercase;">ZONA ÉLITE - Panel Admin</h1>
              </div>
              <div style="padding: 30px;">
                <h2 style="color: #FFFFFF; font-size: 22px; margin-top: 0; border-bottom: 1px solid #1E222B; padding-bottom: 15px;">Nueva Reserva Registrada</h2>
                
                <div style="margin-top: 25px;">
                  <h3 style="color: #8D94A5; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Datos del Cliente</h3>
                  <div style="background-color: #12141A; border: 1px solid #1E222B; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                    <p style="margin: 0 0 10px 0; color: #D1D5DB;"><strong>Nombre:</strong> ${userName}</p>
                    <p style="margin: 0 0 10px 0; color: #D1D5DB;"><strong>Email:</strong> ${userEmail}</p>
                    <p style="margin: 0 0 10px 0; color: #D1D5DB;"><strong>Teléfono:</strong> ${user?.phone || 'No registrado'}</p>
                    <p style="margin: 0; color: #D1D5DB;"><strong>Cédula:</strong> ${user?.cedula || 'No registrado'}</p>
                  </div>

                  <h3 style="color: #8D94A5; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Detalles de la Reserva</h3>
                  <div style="background-color: #12141A; border: 1px solid #1E222B; border-radius: 12px; padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #D1D5DB;"><strong>Modalidad:</strong> <span style="color: #F5B927; font-weight: bold;">${modalityUpper}</span></p>
                    <p style="margin: 0 0 10px 0; color: #D1D5DB;"><strong>Fecha:</strong> ${dateStr}</p>
                    <p style="margin: 0; color: #D1D5DB;"><strong>Hora:</strong> ${timeStr}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
      `;
      try {
        emailService.sendEmail(adminEmail, adminSubject, '', adminHtml);
      } catch (emailErr) {
        console.error('Failed to send booking admin email:', emailErr);
      }

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
        const dateStr = date ? new Date(date).toISOString().split('T')[0] : '';
        const timeStr = start_time ? start_time.substring(0, 5) : '';
        const msg = `El usuario ${name} ha cancelado su reserva de entrenamiento ${modality} para el ${dateStr} a las ${timeStr}.`;
        
        await db.query(
          'INSERT INTO notifications (message, type) VALUES ($1, $2)',
          [msg, 'cancelation']
        );

        // Email admin
        const emailService = require('../services/email.service');
        const adminEmail = 'zonaelite8@gmail.com';
        const adminSubject = `Reserva CANCELADA: ${modality} - ${dateStr}`;
        const adminHtml = `
          <div style="background-color: #12141A; color: #F5F5F5; font-family: 'Inter', Arial, sans-serif; padding: 40px 20px; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #171A21; border: 1px solid #1E222B; border-radius: 16px; overflow: hidden;">
              <div style="background-color: #171A21; padding: 20px 30px; border-bottom: 2px solid #ef4444;">
                <h1 style="color: #ef4444; font-family: 'Outfit', Arial, sans-serif; margin: 0; font-size: 20px; letter-spacing: 1px; text-transform: uppercase;">Reserva Cancelada</h1>
              </div>
              <div style="padding: 30px;">
                <p style="color: #D1D5DB; font-size: 16px;">El cliente <strong>${name}</strong> ha cancelado su reserva desde el panel.</p>
                <div style="background-color: #12141A; border: 1px solid #1E222B; border-radius: 12px; padding: 20px;">
                  <p style="margin: 0 0 10px 0; color: #D1D5DB;"><strong>Modalidad:</strong> ${modality}</p>
                  <p style="margin: 0 0 10px 0; color: #D1D5DB;"><strong>Fecha:</strong> ${dateStr}</p>
                  <p style="margin: 0; color: #D1D5DB;"><strong>Hora:</strong> ${timeStr}</p>
                </div>
                <p style="color: #8D94A5; font-size: 14px; margin-top: 20px;">El cupo ha sido liberado automáticamente en el sistema.</p>
              </div>
            </div>
          </div>
        `;
        try {
          emailService.sendEmail(adminEmail, adminSubject, '', adminHtml);
        } catch (emailErr) {
          console.error('Failed to send admin cancellation email:', emailErr);
        }
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

// Get booking by cancel token
const getBookingByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const result = await db.query(
      `SELECT b.id, s.date, s.start_time, s.modality, u.name as user_name
       FROM bookings b
       JOIN slots s ON b.slot_id = s.id
       JOIN users u ON b.user_id = u.id
       WHERE b.cancel_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Token inválido o reserva ya cancelada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching booking by token:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
};

// Cancel booking by token
const cancelBookingByToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    // Find the booking
    const bookingQuery = await db.query(
      `SELECT b.id, b.slot_id, b.user_id, s.date, s.start_time, s.modality, u.name as user_name, u.email as user_email
       FROM bookings b
       JOIN slots s ON b.slot_id = s.id
       JOIN users u ON b.user_id = u.id
       WHERE b.cancel_token = $1`,
      [token]
    );

    const booking = bookingQuery.rows[0];

    if (!booking) {
      return res.status(404).json({ error: 'Token inválido o reserva ya cancelada' });
    }

    // Delete the booking
    await db.query('DELETE FROM bookings WHERE id = $1', [booking.id]);

    // Format strings for notification
    const dateStr = new Date(booking.date).toISOString().split('T')[0];
    const timeStr = booking.start_time.substring(0, 5);

    // Notify admin
    const adminMsg = `❌ ${booking.user_name} ha CANCELADO su reserva de entrenamiento ${booking.modality} para el ${dateStr} a las ${timeStr}.`;
    await db.query(
      'INSERT INTO notifications (message, type) VALUES ($1, $2)',
      [adminMsg, 'cancel_booking']
    );

    // Email admin
    const emailService = require('../services/email.service');
    const adminEmail = 'zonaelite8@gmail.com';
    const adminSubject = `Reserva CANCELADA: ${booking.modality} - ${dateStr}`;
    const adminHtml = `
      <div style="background-color: #12141A; color: #F5F5F5; font-family: 'Inter', Arial, sans-serif; padding: 40px 20px; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #171A21; border: 1px solid #1E222B; border-radius: 16px; overflow: hidden;">
          <div style="background-color: #171A21; padding: 20px 30px; border-bottom: 2px solid #ef4444;">
            <h1 style="color: #ef4444; font-family: 'Outfit', Arial, sans-serif; margin: 0; font-size: 20px; letter-spacing: 1px; text-transform: uppercase;">Reserva Cancelada</h1>
          </div>
          <div style="padding: 30px;">
            <p style="color: #D1D5DB; font-size: 16px;">El cliente <strong>${booking.user_name}</strong> ha cancelado su reserva.</p>
            <div style="background-color: #12141A; border: 1px solid #1E222B; border-radius: 12px; padding: 20px;">
              <p style="margin: 0 0 10px 0; color: #D1D5DB;"><strong>Modalidad:</strong> ${booking.modality}</p>
              <p style="margin: 0 0 10px 0; color: #D1D5DB;"><strong>Fecha:</strong> ${dateStr}</p>
              <p style="margin: 0; color: #D1D5DB;"><strong>Hora:</strong> ${timeStr}</p>
            </div>
            <p style="color: #8D94A5; font-size: 14px; margin-top: 20px;">El cupo ha sido liberado automáticamente en el sistema.</p>
          </div>
        </div>
      </div>
    `;
    
    try {
      emailService.sendEmail(adminEmail, adminSubject, '', adminHtml);
    } catch (emailErr) {
      console.error('Failed to send cancellation email:', emailErr);
    }

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking by token:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  cancelBooking,
  getAllBookings,
  getBookingByToken,
  cancelBookingByToken
};
