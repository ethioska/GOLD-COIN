function placeBet() {
  let bet = document.getElementById("betAmount").value;
  if (!bet || bet <= 0) {
    alert("Enter a valid bet!");
    return;
  }
  document.getElementById("status").innerText = "Game Started!";
  
  let multiplier = 1.0;
  let interval = setInterval(() => {
    multiplier += 0.1;
    document.getElementById("multiplier").innerText = `Multiplier: ${multiplier.toFixed(1)}x`;

    if (multiplier >= Math.random() * 10) {
      clearInterval(interval);
      document.getElementById("status").innerText = "💥 Plane crashed!";
    }
  }, 500);
}

// Show sections
function showSection(section) {
  if (section === "referral") {
    document.getElementById("referralModal").style.display = "flex";
  } else if (section === "wallet") {
    document.getElementById("walletModal").style.display = "flex";
  }
}

// Close modal
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

// Copy referral link
function copyReferral() {
  let refLink = document.getElementById("refLink");
  refLink.select();
  refLink.setSelectionRange(0, 99999);
  document.execCommand("copy");
  alert("Referral link copied!");
}
