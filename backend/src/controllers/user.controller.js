const db = require('../config/db');

exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, email, role, phone, cedula, available_classes, plan_type, payment_method, payment_amount, payment_date, expiration_date, payment_status, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.createUser = async (req, res) => {
  let { name, email, phone, cedula, plan_type, payment_method, payment_amount, payment_date, expiration_date, payment_status } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!email) {
    email = `cliente_${Date.now()}@zonaelite.local`;
  }
  try {
    const userExist = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe un usuario con este correo' });
    }
    const result = await db.query(
      'INSERT INTO users (name, email, phone, cedula, role, is_verified, plan_type, payment_method, payment_amount, payment_date, expiration_date, payment_status) VALUES ($1, $2, $3, $4, $5, true, $6, $7, $8, $9, $10, $11) RETURNING *',
      [name, email, phone, cedula, 'client', plan_type || null, payment_method || 'efectivo', payment_amount || 0, payment_date || null, expiration_date || null, payment_status || 'pendiente']
    );
    res.status(201).json({ message: 'Usuario creado exitosamente', user: result.rows[0] });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
};

exports.updateUserClasses = async (req, res) => {
  try {
    const { id } = req.params;
    const { available_classes, plan_type, payment_method, payment_amount, payment_date, expiration_date, payment_status } = req.body;

    if (available_classes === undefined && plan_type === undefined && payment_method === undefined && payment_amount === undefined && payment_date === undefined && expiration_date === undefined && payment_status === undefined) {
      return res.status(400).json({ error: 'At least one field is required' });
    }

    let query = 'UPDATE users SET ';
    let values = [];
    let counter = 1;

    const fields = { available_classes, plan_type, payment_method, payment_amount, payment_date, expiration_date, payment_status };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        if (counter > 1) query += ', ';
        query += `${key} = $${counter} `;
        // Si el valor es una cadena vacía en fechas, lo convertimos a null para la BD
        values.push(value === '' && (key === 'payment_date' || key === 'expiration_date') ? null : value);
        counter++;
      }
    }

    query += `WHERE id = $${counter} RETURNING id, name, email, available_classes, plan_type, payment_method, payment_amount, payment_date, expiration_date, payment_status`;
    values.push(id);

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error updating user classes:', error);
    res.status(500).json({ error: 'Failed to update user classes' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting the main admin
    const adminCheck = await db.query('SELECT email FROM users WHERE id = $1', [id]);
    if (adminCheck.rows.length > 0 && adminCheck.rows[0].email === 'zonaelite8@gmail.com') {
      return res.status(403).json({ error: 'No se puede eliminar al administrador principal' });
    }

    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
};

