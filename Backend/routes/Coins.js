const router = require("express").Router();
const User = require("../models/User");

// Get user coins
router.get("/:telegramId", async (req, res) => {
  const user = await User.findOne({ telegramId: req.params.telegramId });
  if (!user) return res.json({ coins: {} });
  res.json(user.coins);
});

// Add coins
router.post("/:telegramId/add", async (req, res) => {
  const { type, amount } = req.body;
  let user = await User.findOne({ telegramId: req.params.telegramId });
  if (!user) user = new User({ telegramId: req.params.telegramId });
  user.coins[type] += amount;
  await user.save();
  res.json(user.coins);
});

module.exports = router;
