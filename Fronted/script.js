// 🌐 Backend URL (change after deployment)
const BACKEND_URL = "https://  
http://gold-coin-production.up.railway.app";  // e.g. https://gold-coin.onrender.com
// 🔑 Replace with real Telegram user ID (later we’ll auto-detect from Telegram WebApp)
const TELEGRAM_ID = "6726975094";  

// ================== COINS ==================
// ✅ Load Coins
async function loadCoins() {
  try {
    const res = await fetch(${BACKEND_URL}/coins/${TELEGRAM_ID});
    const data = await res.json();
    document.getElementById("coins").innerText = 
      NC: ${data.NC} | SC: ${data.SC} | GC: ${data.GC} | DC: ${data.DC} | SKA: ${data.SKA}
    ;
  } catch {
    alert("⚠️ Could not load coins");
  }
}

// ================== BET ==================
// ✅ Place Bet
async function placeBet(type = "NC", amount = 1) {
  try {
    const res = await fetch(${BACKEND_URL}/bet/place, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID, type, amount })
    });
    const data = await res.json();
    if (res.ok) {
      alert(🎉 ${data.win ? "You WON!" : "You lost!"}\nCoins: ${JSON.stringify(data.coins)});
      loadCoins();
    } else {
      alert("❌ " + data.error);
    }
  } catch {
    alert("⚠️ Server not reachable");
  }
}

// ================== MARKETPLACE ==================
// ✅ Open Marketplace (show items)
async function openMarketplace() {
  try {
    const res = await fetch(${BACKEND_URL}/marketplace);
    const data = await res.json();

    const container = document.getElementById("marketplace-container");
    container.innerHTML = "<h3>Marketplace</h3>";

    data.items.forEach(item => {
      const btn = document.createElement("button");
      btn.innerText = ${item.name} (Cost: ${JSON.stringify(item.cost)});
      btn.onclick = () => buyItem(item.id);
      btn.style.margin = "5px";
      container.appendChild(btn);
    });
  } catch {
    alert("⚠️ Marketplace not available");
  }
}

// ✅ Buy Item
async function buyItem(itemId) {
  try {
    const res = await fetch(${BACKEND_URL}/marketplace/buy, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID, itemId })
    });
    const data = await res.json();
    if (res.ok) {
      alert("✅ " + data.message);
      loadCoins();
    } else {
      alert("❌ " + data.error);
    }
  } catch {
    alert("⚠️ Could not buy item");
  }
}

// ================== PLACEHOLDERS ==================
function swapCoins() {
  alert("🔄 Swap feature coming soon...");
}

function withdrawCoins() {
  alert("💸 Withdraw feature coming soon...");
}

// ================== EVENT LISTENERS ==================
document.getElementById("place-bet").addEventListener("click", () => placeBet("NC", 1));
document.getElementById("swap-coins").addEventListener("click", swapCoins);
document.getElementById("marketplace").addEventListener("click", openMarketplace);
document.getElementById("withdraw").addEventListener("click", withdrawCoins);

// Load coins on page start
window.onload = loadCoins;
