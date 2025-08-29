/* main.js
   Single-file static app: Home / Referral / Wallet
   Drop index.html, style.css, main.js in repo root.
*/
(function () {
  // ---- helpers + storage keys
  const LS_BAL = 'gc_nc_balance';
  const LS_HISTORY = 'gc_history';
  const LS_PROFILE = 'gc_profile';
  const LS_REF = 'gc_referred_by';
  const LS_MYCODE = 'gc_my_refcode';

  function $id(id){ return document.getElementById(id); }
  function qAll(sel){ return Array.from(document.querySelectorAll(sel)); }
  function toNum(v){ return +(v||0); }
  function formatN(v, d=2){ return Number(v).toFixed(d); }

  // ---- DOM references
  const balanceEl = $id('balance');
  const claimBtn = $id('claimBtn');
  const betInput = $id('betInput');
  const betBtn = $id('betBtn');
  const cashBtn = $id('cashBtn');
  const autoCash = $id('autoCash');
  const multiplierEl = $id('multiplier');
  const statusEl = $id('status');
  const historyEl = $id('history');
  const resultEl = $id('result');
  const canvas = $id('gameCanvas');
  const ctx = canvas.getContext('2d');

  const myCodeInput = $id('myCode');
  const myLinkInput = $id('myLink');
  const copyMyCodeBtn = $id('copyMyCode');
  const copyMyLinkBtn = $id('copyMyLink');
  const referredByEl = $id('referredBy');

  // profile
  const usernameEl = $id('username');
  const phoneEl = $id('phone');
  const memberIdEl = $id('memberId');
  const saveProfileBtn = $id('saveProfile');
  const resetProfileBtn = $id('resetProfile');
  const registeredAtEl = $id('registeredAt');
  const balProfileEl = $id('balProfile');

  // nav
  const navBtns = qAll('.nav-btn');

  // ---- state
  let inRound = false;
  let multiplier = 1;
  let crashAt = 2.0;
  let animFrame = null;
  let startTime = 0;
  let betAmount = 0;

  // ---- storage helpers
  function getBal(){ return toNum(localStorage.getItem(LS_BAL) || '0'); }
  function setBal(v){ localStorage.setItem(LS_BAL, String(+v)); renderBalance(); }
  function renderBalance(){
    balanceEl.textContent = formatN(getBal(),2);
    balProfileEl.textContent = formatN(getBal(),2);
  }

  function getHistory(){ return JSON.parse(localStorage.getItem(LS_HISTORY) || '[]'); }
  function pushHistory(obj){
    const a = getHistory();
    a.unshift(obj);
    while (a.length>10) a.pop();
    localStorage.setItem(LS_HISTORY, JSON.stringify(a));
    renderHistory();
  }
  function renderHistory(){
    const a = getHistory();
    historyEl.innerHTML = a.map(it => `<li class="${it.win ? 'win':'lose'}">${formatN(it.mult,2)}x • ${it.win ? '+':'-'}${formatN(it.amount,2)} NC</li>`).join('');
  }

  function getProfile(){ return JSON.parse(localStorage.getItem(LS_PROFILE) || '{}'); }
  function saveProfile(p){
    localStorage.setItem(LS_PROFILE, JSON.stringify(p||{}));
    renderProfile();
  }
  function renderProfile(){
    const p = getProfile();
    usernameEl.value = p.username||'';
    phoneEl.value = p.phone||'';
    memberIdEl.value = p.memberId||p.memberId || `GC-${String(Math.floor(Math.random()*9000)+1000)}`;
    registeredAtEl.textContent = p.registeredAt || '-';
    balProfileEl.textContent = formatN(getBal(),2);
  }

  function getMyRefCode(){
    let code = localStorage.getItem(LS_MYCODE);
    if (!code){
      code = Math.random().toString(36).slice(2,9).toUpperCase();
      localStorage.setItem(LS_MYCODE, code);
    }
    return code;
  }

  // check URL ?ref=CODE
  function initReferralFromURL(){
    const url = new URL(location.href);
    const r = url.searchParams.get('ref');
    const current = localStorage.getItem(LS_REF);
    if (r && !current){
      localStorage.setItem(LS_REF, r);
      // Note: without backend we can't credit inviter automatically.
    }
    const referred = localStorage.getItem(LS_REF) || '—';
    referredByEl.textContent = referred;
  }

  // copy helper
  async function copyText(t){
    try { await navigator.clipboard.writeText(t); alert('Copied!'); }
    catch(e){ try { document.execCommand('copy'); alert('Copied'); } catch(e){ alert('Copy failed'); } }
  }

  // ---- UI wiring: nav
  function showPage(name){
    qAll('.page').forEach(p => p.classList.remove('active'));
    $id(name).classList.add('active');
    navBtns.forEach(b => b.classList.toggle('active', b.dataset.show === name));
    // update referral/my link when opening referral
    if (name === 'referral') {
      const myCode = getMyRefCode();
      myCodeInput.value = myCode;
      myLinkInput.value = location.origin + location.pathname + '?ref=' + myCode;
      referredByEl.textContent = localStorage.getItem(LS_REF) || '—';
    }
    // refresh profile view
    if (name === 'wallet') renderProfile();
  }
  qAll('.nav-btn').forEach(b => b.addEventListener('click', () => showPage(b.dataset.show)));

  // ---- claim faucet
  claimBtn.addEventListener('click', () => {
    const have = getBal();
    if (have >= 0.01 && localStorage.getItem('gc_claimed') === '1'){ alert('Already claimed'); return; }
    setBal(getBal() + 2.00);
    localStorage.setItem('gc_claimed','1');
    renderBalance();
    alert('2.00 NC added to your wallet');
  });

  // ---- copy referral buttons
  copyMyCodeBtn.addEventListener('click', () => copyText(myCodeInput.value));
  copyMyLinkBtn.addEventListener('click', () => copyText(myLinkInput.value));

  // ---- profile save
  saveProfileBtn.addEventListener('click', () => {
    const p = { username: usernameEl.value.trim(), phone: phoneEl.value.trim(), memberId: memberIdEl.value.trim() || getProfile().memberId || getMyRefCode(), registeredAt: getProfile().registeredAt || new Date().toLocaleString() };
    saveProfile(p);
    alert('Profile saved');
  });
  resetProfileBtn.addEventListener('click', () => {
    localStorage.removeItem(LS_PROFILE);
    renderProfile();
  });

  // ---- game functions
  function rollCrashPoint(){
    // skewed curve: results between 1.01 and ~10
    const r = Math.pow(Math.random(), 0.48);
    return +(1.01 + r * 9.0).toFixed(2);
  }

  function startRound(){
    if (inRound) return;
    const bet = Math.max(0.01, parseFloat(betInput.value||0));
    if (isNaN(bet) || bet <= 0){ alert('Enter bet'); return; }
    if (bet > getBal()){ alert('Insufficient balance'); return; }

    // subtract bet upfront
    setBal(getBal() - bet);
    betAmount = bet;
    multiplier = 1.00;
    crashAt = rollCrashPoint();
    inRound = true;
    startTime = performance.now();
    statusEl.textContent = 'Flying…';
    betBtn.disabled = true;
    cashBtn.disabled = false;
    resultEl.textContent = '';
    tick();
    animFrame = requestAnimationFrame(loop);
  }

  function cashOut(auto=false){
    if (!inRound) return;
    inRound = false;
    cancelAnimationFrame(animFrame);
    const won = +(betAmount * multiplier);
    setBal(getBal() + won);
    statusEl.textContent = auto ? 'Auto-cashed ✓' : 'Cashed ✓';
    resultEl.textContent = `Won ${formatN(won,2)} NC @ ${formatN(multiplier,2)}x`;
    pushHistory({ mult: multiplier, amount: won, win: true });
    betBtn.disabled = false;
    cashBtn.disabled = true;
    // draw final
    drawScene(true);
  }

  function crash(){
    inRound = false;
    cancelAnimationFrame(animFrame);
    statusEl.textContent = '💥 Crashed';
    resultEl.textContent = `Lost ${formatN(betAmount,2)} NC @ ${formatN(crashAt,2)}x`;
    pushHistory({ mult: crashAt, amount: betAmount, win: false });
    betBtn.disabled = false;
    cashBtn.disabled = true;
    multiplier = crashAt;
    drawScene(true);
  }

  // tick updates multiplier; loop draws
  function tick(){
    if (!inRound) return;
    // growth: nonlinear pleasant curve
    multiplier = +(multiplier * 1.006 + 0.002).toFixed(4);
    if (multiplier >= crashAt){ crash(); return; }

    // auto cash
    const a = parseFloat(autoCash.value || '0');
    if (!isNaN(a) && a >= 1.01 && multiplier >= a){
      cashOut(true);
      return;
    }
    // continue
  }

  function loop(){
    tick();
    drawScene(false);
    if (inRound) animFrame = requestAnimationFrame(loop);
  }

  // ---- drawing
  function drawScene(final){
    const w = canvas.clientWidth * devicePixelRatio;
    const h = canvas.clientHeight * devicePixelRatio;
    canvas.width = w; canvas.height = h;
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);

    // clear
    ctx.clearRect(0,0,w,h);

    // background gradient
    const g = ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0,'#05122b'); g.addColorStop(1,'#021029');
    ctx.fillStyle = g; ctx.fillRect(0,0,w/devicePixelRatio,h/devicePixelRatio);

    // draw flight path curve
    ctx.strokeStyle = 'rgba(66,211,146,0.12)'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let t=0;t<=1.0001;t+=0.02){
      const x = 24 + t * (canvas.clientWidth - 48);
      const m = 1 + (crashAt - 1) * t;
      const y = (canvas.clientHeight - 30) - (canvas.clientHeight * 0.5) * Math.log(m) / Math.log(Math.max(crashAt,1.05));
      if (t === 0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();

    // plane/avatar triangle position based on multiplier progress
    const progress = Math.min(1, (multiplier - 1) / Math.max(0.0001, (crashAt - 1)));
    const px = 24 + progress * (canvas.clientWidth - 48);
    const py = (canvas.clientHeight - 30) - (canvas.clientHeight * 0.5) * Math.log(Math.max(multiplier,1.001)) / Math.log(Math.max(crashAt,1.05));

    // draw plane
    ctx.fillStyle = final ? '#ff6b6b' : '#42d392';
    ctx.beginPath();
    ctx.moveTo(px,py);
    ctx.lineTo(px-14,py+8);
    ctx.lineTo(px-6,py-10);
    ctx.closePath();
    ctx.fill();

    // HUD number top-left
    ctx.font = '700 18px system-ui';
    ctx.fillStyle = '#e8f2ff';
    ctx.fillText(formatN(multiplier,2) + 'x', 18, 26);

    // small crash hint bottom-right
    ctx.font = '12px system-ui';
    ctx.fillStyle = '#9fb0d6';
    ctx.fillText('Crash at ' + formatN(crashAt,2) + 'x', canvas.clientWidth - 120, canvas.clientHeight - 8);
  }

  // ---- UI wiring
  betBtn.addEventListener('click', startRound);
  cashBtn.addEventListener('click', () => cashOut(false));
  qAll('.chip').forEach(b => b.addEventListener('click', e => {
    const add = parseFloat(e.currentTarget.dataset.add||0);
    const cur = parseFloat(betInput.value||0);
    betInput.value = formatN(cur + add,2);
  }));

  // copy functions for referral inputs wired earlier
  copyMyCodeBtn && copyMyCodeBtn.addEventListener('click', () => copyText(myCodeInput.value));
  copyMyLinkBtn && copyMyLinkBtn.addEventListener('click', () => copyText(myLinkInput.value));

  // profile save/reset wired above
  // initialize view
  function boot(){
    if (!localStorage.getItem(LS_BAL)) localStorage.setItem(LS_BAL, '2.00'); // starter NC
    renderBalance();
    renderHistory();
    renderProfile();
    initReferralFromURL();

    // set my code & link
    const myCode = getMyRefCode();
    myCodeInput.value = myCode;
    myLinkInput.value = location.origin + location.pathname + '?ref=' + myCode;

    // show home initially
    showPage('home');
    // initial draw
    drawScene(false);
  }

  // expose showPage to global (bottom nav uses it)
  window.showPage = showPage;

  boot();
})();
