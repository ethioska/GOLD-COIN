let multiplier = 1.0;
let gameInterval;
let betPlaced = false;

function placeBet() {
  const betAmount = document.getElementById("betAmount").value;
  if (!betAmount || betAmount <= 0) {
    alert("Enter a valid bet amount!");
    return;
  }

  document.getElementById("status").innerText = "Bet Placed! 🚀";
  multiplier = 1.0;
  clearInterval(gameInterval);

  betPlaced = true;
  gameInterval = setInterval(runGame, 1000);
}

function runGame() {
  multiplier += (Math.random() * 1.5).toFixed(2); // random growth
  document.getElementById("multiplier").innerText = `Multiplier: ${multiplier.toFixed(2)}x`;

  // Random crash
  if (Math.random() < 0.2) { 
    clearInterval(gameInterval);
    document.getElementById("status").innerText = "💥 Crashed!";
    betPlaced = false;
  }
}
