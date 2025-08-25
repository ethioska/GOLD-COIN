// Connect to Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand(); // make app full screen

// Example balances (later will come from backend/database)
let balance = {
  nc: 5,
  sc: 2,
  gc: 1,
  dc: 0,
  ska: 0
};

// Display balances
function updateBalance() {
  document.getElementById("nc").innerText = balance.nc;
  document.getElementById("sc").innerText = balance.sc;
  document.getElementById("gc").innerText = balance.gc;
  document.getElementById("dc").innerText = balance.dc;
  document.getElementById("ska").innerText = balance.ska;
}
updateBalance();

// Example functions
function placeBet() {
  tg.showAlert("Bet placed! (later will connect to backend)");
}

function swapCoins() {
  tg.showAlert("Swap coins coming soon...");
}

function openMarket() {
  tg.showAlert("Marketplace opening...");
}

function withdraw() {
  tg.showAlert("Withdraw option coming soon...");
}
