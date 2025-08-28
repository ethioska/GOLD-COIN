import express from "express";
import User from "../models/User.js";

const router = express.Router();

// 🏪 Sample marketplace items
const ITEMS = [
  { id: 1, name: "Golden Sword", cost: { GC: 1 } },
  { id: 2, name: "Silver Shield", cost: { SC: 2 } },
  { id: 3, name: "Diamond Crown", cost: { DC: 1 } },
  { id: 4, name: "SKA Special", cost: { SKA: 1 } }
];

// 📌 List items
router.get("/", (req, res) => {
  res.json({ items: ITEMS });
});

// 📌 Buy item
router.post("/buy", async (req, res) => {
  try {
    const { telegramId, itemId } = req.body;

    if (!telegramId || !itemId) {
      return res.status(400).json({ error: "Missing fields" });
    }

    let user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const item = ITEMS.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // check if user has enough coins
    for (let [coin, price] of Object.entries(item.cost)) {
      if (user.coins[coin] < price) {
        return res.status(400).json({ error: "Not enough " + coin });
      }
    }

    // deduct cost
    for (let [coin, price] of Object.entries(item.cost)) {
      user.coins[coin] -= price;
    }

    await user.save();
    return res.json({ success: true, message: `You bought ${item.name}!`, coins: user.coins });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
