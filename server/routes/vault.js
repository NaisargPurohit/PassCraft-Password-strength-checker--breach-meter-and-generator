import express from 'express';
import VaultItem from '../models/VaultItem.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// TODO: add export to csv button here later when product asks for it

router.get('/', async (req, res) => {
  try {
    const items = await VaultItem.find({ userId: req.user.userId }).sort({ updatedAt: -1 });
    // console.log("fetched items count:", items.length);
    return res.json({ items });
  } catch (err) {
    // console.error("fetch vault err:", err);
    return res.status(500).json({ error: 'Failed to retrieve vault items' });
  }
});

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
    return res.status(500).json({ error: 'Failed to save encrypted vault item' });
  }
});

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
    return res.status(500).json({ error: 'Failed to update vault item' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await VaultItem.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Vault item not found or unauthorized' });
    }

    return res.json({ message: 'Vault item deleted successfully', id: req.params.id });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete vault item' });
  }
});

export default router;
