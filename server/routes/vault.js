import express from 'express';
import VaultItem from '../models/VaultItem.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// TODO: add bulk import/export endpoints for encrypted vault backups

/**
 * Fetch all encrypted vault items for the authenticated user.
 */
router.get('/', async (req, res) => {
  try {
    const items = await VaultItem.find({ userId: req.user.userId }).sort({ updatedAt: -1 });
    return res.json({ items });
  } catch (err) {
    console.error('Error fetching vault items:', err);
    return res.status(500).json({ error: 'Failed to retrieve vault items' });
  }
});

/**
 * Save a new encrypted vault item.
 */
router.post('/', async (req, res) => {
  try {
    const { encryptedData, iv } = req.body || {};

    if (!encryptedData || !iv) {
      return res.status(400).json({ error: 'Encrypted payload and IV are required' });
    }

    const item = new VaultItem({
      userId: req.user.userId,
      encryptedData,
      iv,
    });

    await item.save();
    return res.status(201).json({ message: 'Vault item saved', item });
  } catch (err) {
    console.error('Error saving vault item:', err);
    return res.status(500).json({ error: 'Failed to save encrypted vault item' });
  }
});

/**
 * Update an existing encrypted vault item.
 */
router.put('/:id', async (req, res) => {
  try {
    const { encryptedData, iv } = req.body || {};

    if (!encryptedData || !iv) {
      return res.status(400).json({ error: 'Encrypted payload and IV are required' });
    }

    const item = await VaultItem.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!item) {
      return res.status(404).json({ error: 'Vault item not found or unauthorized' });
    }

    item.encryptedData = encryptedData;
    item.iv = iv;
    await item.save();

    return res.json({ message: 'Vault item updated', item });
  } catch (err) {
    console.error('Error updating vault item:', err);
    return res.status(500).json({ error: 'Failed to update vault item' });
  }
});

/**
 * Delete a vault item by ID.
 */
router.delete('/:id', async (req, res) => {
  try {
    const deletedItem = await VaultItem.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!deletedItem) {
      return res.status(404).json({ error: 'Vault item not found or unauthorized' });
    }

    return res.json({ message: 'Vault item deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('Error deleting vault item:', err);
    return res.status(500).json({ error: 'Failed to delete vault item' });
  }
});

export default router;
