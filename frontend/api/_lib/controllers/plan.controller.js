const db = require('../config/db');

const getAllPlans = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM plans ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error in getAllPlans:', error);
    res.status(500).json({ message: 'Error fetching plans' });
  }
};

const createPlan = async (req, res) => {
  const { name, default_classes = 0, price = 0.00 } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Plan name is required' });
  }
  try {
    const result = await db.query(
      'INSERT INTO plans (name, default_classes, price) VALUES ($1, $2, $3) RETURNING *',
      [name, default_classes, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error in createPlan:', error);
    if (error.code === '23505') { // unique violation
      return res.status(400).json({ message: 'A plan with this name already exists' });
    }
    res.status(500).json({ message: 'Error creating plan' });
  }
};

const updatePlan = async (req, res) => {
  const { id } = req.params;
  const { name, default_classes, price, is_active } = req.body;
  
  try {
    const current = await db.query('SELECT * FROM plans WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const plan = current.rows[0];
    const newName = name !== undefined ? name : plan.name;
    const newClasses = default_classes !== undefined ? default_classes : plan.default_classes;
    const newPrice = price !== undefined ? price : plan.price;
    const newActive = is_active !== undefined ? is_active : plan.is_active;

    const result = await db.query(
      'UPDATE plans SET name = $1, default_classes = $2, price = $3, is_active = $4 WHERE id = $5 RETURNING *',
      [newName, newClasses, newPrice, newActive, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error in updatePlan:', error);
    res.status(500).json({ message: 'Error updating plan' });
  }
};

const deletePlan = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM plans WHERE id = $1', [id]);
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error in deletePlan:', error);
    res.status(500).json({ message: 'Error deleting plan' });
  }
};

module.exports = {
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan
};
