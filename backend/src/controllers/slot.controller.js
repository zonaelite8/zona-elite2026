const db = require('../config/db');

// BUSINESS RULES:
// - Fuerza max capacity: 5. If fuerza >= 3, personalizado is BLOCKED.
// - Personalizado max capacity: 2. If personalizado >= 2, fuerza is BLOCKED.
// - Both modalities can coexist in the same time block.

// Get all time-blocks with cross-modality info (public endpoint)
const getSlots = async (req, res) => {
  const { date } = req.query;

  try {
    // Get all slots with their booking counts
    let queryText = `
      SELECT s.id, s.modality, s.date, s.start_time, s.end_time, s.capacity,
             COALESCE(COUNT(b.id), 0)::int AS bookings_count
      FROM slots s
      LEFT JOIN bookings b ON s.id = b.slot_id
    `;

    const params = [];
    if (date) {
      queryText += ` WHERE s.date = $1`;
      params.push(date);
    } else {
      queryText += ` WHERE s.date >= CURRENT_DATE`;
    }

    queryText += ` GROUP BY s.id ORDER BY s.date ASC, s.start_time ASC`;

    const result = await db.query(queryText, params);
    const allSlots = result.rows;

    // Group by (date, start_time) to compute cross-modality blocking
    const timeBlockMap = {};
    allSlots.forEach(slot => {
      const key = `${slot.date}_${slot.start_time}`;
      if (!timeBlockMap[key]) {
        timeBlockMap[key] = { date: slot.date, start_time: slot.start_time, end_time: slot.end_time, slots: [] };
      }
      timeBlockMap[key].slots.push(slot);
    });

    // For each slot, add cross-blocking info
    const enrichedSlots = allSlots.map(slot => {
      const key = `${slot.date}_${slot.start_time}`;
      const block = timeBlockMap[key];
      
      const fuerzaSlot = block.slots.find(s => s.modality === 'fuerza');
      const personalSlot = block.slots.find(s => s.modality === 'personalizado');
      
      const fuerzaBooked = fuerzaSlot ? fuerzaSlot.bookings_count : 0;
      const personalBooked = personalSlot ? personalSlot.bookings_count : 0;

      const spots_left = slot.capacity - slot.bookings_count;

      // Apply business rules
      let cross_blocked = false;
      if (slot.modality === 'fuerza') {
        // Fuerza is blocked if personalizado has 2+ bookings
        cross_blocked = personalBooked >= 2;
      } else {
        // Personalizado is blocked if fuerza has 3+ bookings
        cross_blocked = fuerzaBooked >= 3;
      }

      return {
        ...slot,
        spots_left,
        cross_blocked,
        // Extra context
        fuerza_booked_in_block: fuerzaBooked,
        personalizado_booked_in_block: personalBooked
      };
    });

    return res.json(enrichedSlots);
  } catch (error) {
    console.error('Error fetching slots:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new time block — auto-creates BOTH fuerza and personalizado slots
const createSlot = async (req, res) => {
  const { date, start_time, end_time } = req.body;

  if (!date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Fields date, start_time, end_time are required' });
  }

  try {
    const created = [];

    // Create fuerza slot if not exists
    const fuerzaCheck = await db.query(
      'SELECT id FROM slots WHERE modality = $1 AND date = $2 AND start_time = $3',
      ['fuerza', date, start_time]
    );
    if (fuerzaCheck.rows.length === 0) {
      const r = await db.query(
        'INSERT INTO slots (modality, date, start_time, end_time, capacity) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        ['fuerza', date, start_time, end_time, 5]
      );
      created.push(r.rows[0]);
    }

    // Create personalizado slot if not exists
    const persCheck = await db.query(
      'SELECT id FROM slots WHERE modality = $1 AND date = $2 AND start_time = $3',
      ['personalizado', date, start_time]
    );
    if (persCheck.rows.length === 0) {
      const r = await db.query(
        'INSERT INTO slots (modality, date, start_time, end_time, capacity) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        ['personalizado', date, start_time, end_time, 2]
      );
      created.push(r.rows[0]);
    }

    if (created.length === 0) {
      return res.status(400).json({ error: 'Ya existe un bloque de horario para esa fecha y hora.' });
    }

    return res.status(201).json({
      message: `Horario creado: ${created.length} slot(s) generados`,
      slots: created
    });
  } catch (error) {
    console.error('Error creating slot:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all slots with booking details for admin
const getAdminSlots = async (req, res) => {
  const { date } = req.query;

  try {
    let queryText = `
      SELECT s.id, s.modality, s.date, s.start_time, s.end_time, s.capacity,
             COALESCE(
               json_agg(
                 json_build_object(
                   'booking_id', b.id,
                   'user_id', u.id,
                   'user_name', u.name,
                   'user_email', u.email,
                   'booked_at', b.created_at
                 )
               ) FILTER (WHERE b.id IS NOT NULL), '[]'
             ) as bookings
      FROM slots s
      LEFT JOIN bookings b ON s.id = b.slot_id
      LEFT JOIN users u ON b.user_id = u.id
    `;

    const params = [];
    if (date) {
      queryText += ` WHERE s.date = $1`;
      params.push(date);
    } else {
      queryText += ` WHERE s.date >= CURRENT_DATE`;
    }

    queryText += ` GROUP BY s.id ORDER BY s.date ASC, s.start_time ASC, s.modality ASC`;

    const result = await db.query(queryText, params);
    return res.json(result.rows);
  } catch (error) {
    console.error('Error fetching admin slots:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a slot (Admin only)
const deleteSlot = async (req, res) => {
  const { id } = req.params;

  try {
    const checkResult = await db.query('SELECT * FROM slots WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    await db.query('DELETE FROM slots WHERE id = $1', [id]);
    return res.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    console.error('Error deleting slot:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Create standard weekly slots (both modalities per time block)
const createWeeklySlots = async (req, res) => {
  const { startDate, endDate } = req.body;
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Time blocks (each creates both fuerza + personalizado)
    const timeBlocks = [
      { start_time: '08:00:00', end_time: '09:00:00' },
      { start_time: '09:00:00', end_time: '10:00:00' },
      { start_time: '10:00:00', end_time: '11:00:00' },
      { start_time: '17:00:00', end_time: '18:00:00' },
      { start_time: '18:00:00', end_time: '19:00:00' },
      { start_time: '19:00:00', end_time: '20:00:00' }
    ];

    let count = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day >= 1 && day <= 5) {
        const dateStr = d.toISOString().split('T')[0];

        for (const tb of timeBlocks) {
          for (const modality of ['fuerza', 'personalizado']) {
            const capacity = modality === 'fuerza' ? 5 : 2;
            const check = await db.query(
              'SELECT id FROM slots WHERE modality = $1 AND date = $2 AND start_time = $3',
              [modality, dateStr, tb.start_time]
            );
            if (check.rows.length === 0) {
              await db.query(
                'INSERT INTO slots (modality, date, start_time, end_time, capacity) VALUES ($1, $2, $3, $4, $5)',
                [modality, dateStr, tb.start_time, tb.end_time, capacity]
              );
              count++;
            }
          }
        }
      }
    }

    return res.status(201).json({ message: `Created ${count} slots successfully` });
  } catch (error) {
    console.error('Error creating weekly slots:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getSlots,
  createSlot,
  getAdminSlots,
  deleteSlot,
  createWeeklySlots
};
