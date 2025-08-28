import express from "express";
import User from "../models/User.js";

const router = express.Router();

// 🎮 Place Bet
router.post("/place", async (req, res) => {
  try {
    const { telegramId, type, amount } = req.body;

    if (!telegramId || !type || !amount) {
      return res.status(400).json({ error: "Missing fields" });
    }

    let user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // check balance
    if (user.coins[type] >= amount) {
      user.coins[type] -= amount;

      // Example: simple win chance 50/50
      const win = Math.random() < 0.5;
      if (win) {
        user.coins[type] += amount * 2; // double back
      }

      await user.save();
      return res.json({ success: true, win, coins: user.coins });
    } else {
      return res.status(400).json({ error: "Not enough coins" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
