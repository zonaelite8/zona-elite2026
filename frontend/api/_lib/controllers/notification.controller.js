const db = require('../config/db');

const getNotifications = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50'
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE notifications SET read = TRUE WHERE id = $1', [id]);
    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteAllNotifications = async (req, res) => {
  try {
    await db.query('DELETE FROM notifications');
    return res.json({ message: 'All notifications deleted' });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  deleteAllNotifications
};
