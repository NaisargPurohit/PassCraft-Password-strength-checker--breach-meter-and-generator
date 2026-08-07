import express from 'express';
import mongoose from 'mongoose';
import VaultItem from '../models/VaultItem.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all vault routes
router.use(authMiddleware);

// In-Memory Fallback Store for Vault Items
export const inMemoryVault = [];

const isMongoConnected = () => mongoose.connection.readyState === 1;

// ==========================================
// 1. GET ALL ENCRYPTED VAULT ITEMS FOR USER
// ==========================================
router.get('/', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const items = await VaultItem.find({ userId: req.user.userId }).sort({ updatedAt: -1 });
      return res.json({ items });
    } else {
      const items = inMemoryVault
        .filter(item => item.userId === req.user.userId)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      return res.json({ items });
    }
  } catch (err) {
    console.error('Error fetching vault items:', err);
    return res.status(500).json({ error: 'Failed to retrieve vault items' });
  }
});

// ==========================================
// 2. CREATE NEW ENCRYPTED VAULT ITEM
// ==========================================
router.post('/', async (req, res) => {
  try {
    const { encryptedData, iv } = req.body || {};

    if (!encryptedData || !iv) {
      return res.status(400).json({ error: 'Encrypted payload (encryptedData) and IV are required' });
    }

    if (isMongoConnected()) {
      const item = new VaultItem({
        userId: req.user.userId,
        encryptedData,
        iv,
      });

      await item.save();
      return res.status(201).json({ message: 'Vault item saved', item });
    } else {
      const item = {
        _id: 'mem_v_' + Date.now(),
        userId: req.user.userId,
        encryptedData,
        iv,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryVault.unshift(item);
      return res.status(201).json({ message: 'Vault item saved (In-Memory)', item });
    }
  } catch (err) {
    console.error('Error saving vault item:', err);
    return res.status(500).json({ error: 'Failed to save encrypted vault item' });
  }
});

// ==========================================
// 3. UPDATE AN EXISTING VAULT ITEM
// ==========================================
router.put('/:id', async (req, res) => {
  try {
    const { encryptedData, iv } = req.body || {};

    if (!encryptedData || !iv) {
      return res.status(400).json({ error: 'Encrypted payload and IV are required' });
    }

    if (isMongoConnected()) {
      const item = await VaultItem.findOne({ _id: req.params.id, userId: req.user.userId });
      if (!item) {
        return res.status(404).json({ error: 'Vault item not found or unauthorized' });
      }

      item.encryptedData = encryptedData;
      item.iv = iv;
      await item.save();

      return res.json({ message: 'Vault item updated', item });
    } else {
      const index = inMemoryVault.findIndex(
        it => it._id === req.params.id && it.userId === req.user.userId
      );
      if (index === -1) {
        return res.status(404).json({ error: 'Vault item not found or unauthorized' });
      }

      inMemoryVault[index].encryptedData = encryptedData;
      inMemoryVault[index].iv = iv;
      inMemoryVault[index].updatedAt = new Date();

      return res.json({ message: 'Vault item updated (In-Memory)', item: inMemoryVault[index] });
    }
  } catch (err) {
    console.error('Error updating vault item:', err);
    return res.status(500).json({ error: 'Failed to update vault item' });
  }
});

// ==========================================
// 4. DELETE A VAULT ITEM
// ==========================================
router.delete('/:id', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const deletedItem = await VaultItem.findOneAndDelete({
        _id: req.params.id,
        userId: req.user.userId,
      });

      if (!deletedItem) {
        return res.status(404).json({ error: 'Vault item not found or unauthorized' });
      }

      return res.json({ message: 'Vault item deleted successfully', id: req.params.id });
    } else {
      const index = inMemoryVault.findIndex(
        it => it._id === req.params.id && it.userId === req.user.userId
      );
      if (index === -1) {
        return res.status(404).json({ error: 'Vault item not found or unauthorized' });
      }

      inMemoryVault.splice(index, 1);
      return res.json({ message: 'Vault item deleted successfully (In-Memory)', id: req.params.id });
    }
  } catch (err) {
    console.error('Error deleting vault item:', err);
    return res.status(500).json({ error: 'Failed to delete vault item' });
  }
});

export default router;
