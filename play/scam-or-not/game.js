'use strict';
(function () {
  const { el, shuffle, best, shareBox, moreGames } = window.Play;
  // [channel, from, time, text, answer ('scam'|'real'), tell]  All brands, numbers and links are made up.
  const MSGS = [
    ['SMS', 'VM-NOVABK', '09:12', 'Dear customer, your Nova Bank KYC has expired. Your account will be BLOCKED today. Update now: nova-kyc-verify.in/upd', 'scam',
     "Urgency plus a link to \"update KYC\". Banks don't block accounts through an SMS link, and the link isn't the bank's own website."],
    ['SMS', 'AD-NOVABK', '13:47', 'Rs 2,450.00 debited from A/c XX4821 on 14-Oct at QuickKart. Avl bal Rs 18,320.11. Not you? Call the number on the back of your card.', 'real',
     'No link and no request. It tells you to use a number you already have.'],
    ['WhatsApp', '+91 9xxxx x2731', '22:05', "Hi Mum, this is my new number, my phone fell in water 😩 can you send ₹18,000 for a new one today? Will explain later", 'scam',
     "New number, an emergency, money today, and no call. Ring your child's old number first."],
    ['SMS', 'BZ-SWIFTP', '10:30', 'SwiftPost: Your parcel could not be delivered due to incomplete address. Pay ₹25 redelivery fee: swiftpost-redeliver.top', 'scam',
     'A tiny fee and an odd web address. The ₹25 is not the goal; your card details are.'],
    ['SMS', 'VK-QKKART', '11:02', 'Your QuickKart order #QK-55102 is out for delivery. Delivery code: 4471. Share it only with the delivery agent at your door.', 'real',
     "An order you expect, no link, and the code is only for the person at your door."],
    ['WhatsApp', 'HR Team – Priya', '16:18', 'Hello! Part-time job: like YouTube videos and earn ₹3,000–₹8,000 per day. No experience needed. Reply YES to start.', 'scam',
     "Big money for trivial tasks. These start with small payouts, then ask you to \"invest\" to unlock bigger ones."],
    ['Call', "'Officer Sharma, Cyber Police'", '15:40', "Your Aadhaar is linked to a money-laundering case. Stay on this video call. You are under digital arrest. Transfer your savings to an RBI safe account for verification.", 'scam',
     "There is no such thing as a \"digital arrest\" or an \"RBI safe account\". Police don't hold you on a video call. Hang up and call 1930."],
    ['SMS', 'VM-NOVABK', '08:55', '482913 is your OTP to log in to Nova Bank NetBanking. Valid for 5 minutes. Never share your OTP with anyone, including bank staff.', 'real',
     "Genuine OTPs warn you not to share them. It's safe when you just tried to log in; the danger is the caller who asks you to read it out."],
    ['WhatsApp', 'Refund Desk', '12:21', 'We are processing your ₹4,999 refund. Please approve the UPI request and enter your UPI PIN to receive the money.', 'scam',
     'You never enter your UPI PIN to receive money. A PIN is only ever for paying.'],
    ['Email', 'MetroPower Billing <alerts@metropower-bill.co>', '19:10', 'Your electricity will be disconnected tonight at 9:30 pm because your last bill was not updated. Call our officer immediately on 9xxxx xx118.', 'scam',
     "\"Tonight\", a personal mobile number and an \"officer\". Real disconnection notices come with time and through official channels."],
    ['Email', 'QuickKart Receipts', '18:44', "Thanks for your order: Steel water bottle, 1 L. Total ₹349. You can view or manage the order in the QuickKart app.", 'real',
     "It matches something you bought, asks for nothing, and points you to the app you already use."],
    ['Telegram', 'Crypto Growth Club', '21:30', 'Join 4,200 members earning 3% DAILY, guaranteed. Our AI trading bot never loses. Minimum ₹10,000.', 'scam',
     "\"Guaranteed\" and \"never loses\" don't exist in investing. 3% a day would be more than double your money every month."],
    ['SMS', 'JD-CITYGS', '09:40', 'CityGas: Meter reading for October is due. Our technician (ID card shown) will visit 10 am–1 pm on 16 Oct. No payment is collected at the door.', 'real',
     "Scheduled, no link, and it tells you what they will not do."],
    ['Call', "'Nova Bank Customer Care'", '17:05', "Sir, your card reward points worth ₹7,800 expire today. I've sent an OTP to convert them to cash. Please read it out to me.", 'scam',
     'Anyone asking you to read out an OTP is stealing it. The OTP message itself tells you never to share it.'],
    ['SMS', 'VK-SKYAIR', '06:15', 'SkyAir: Flight SA 612 BOM–DEL on 18 Oct is delayed by 45 minutes. New departure 19:35. No action needed.', 'real',
     'A factual update about a trip you booked. No link, no ask.'],
  ];
  const LIMIT = 10; // seconds for the speed bonus
  const stage = document.getElementById('stage'), bar = document.getElementById('bar'), hudStep = document.getElementById('hud-step'), hudScore = document.getElementById('hud-score');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let s, keyHandler = null, timerId = null;

  function reset() { s = { order: shuffle(MSGS), i: 0, right: 0, points: 0, log: [] }; hudScore.textContent = '0'; intro(); }

  function intro() {
    bar.style.width = '0%'; hudStep.textContent = 'Ready';
    stage.replaceChildren();
    stage.append(el('p', 'kick', 'How it works'));
    const ul = el('ul', 'how');
    ['Fifteen messages: texts, WhatsApps, emails, calls.', 'Decide: scam or genuine. Swipe left for scam, right for genuine, or use the buttons.', 'Correct answers score 100. Answer fast for up to 50 bonus points.', 'Every brand, number and link here is made up.'].forEach(t => ul.append(el('li', null, t)));
    stage.append(ul);
    const b = el('button', 'btn', 'Start'); b.type = 'button'; b.onclick = show; stage.append(b); b.focus({ preventScroll: true });
  }

  function show() {
    const m = s.order[s.i];
    hudStep.textContent = (s.i + 1) + ' of ' + MSGS.length;
    stage.replaceChildren();
    const timer = el('div', 'timer'), ti = el('i'); timer.append(ti); timer.setAttribute('aria-hidden', 'true'); stage.append(timer);
    const phone = el('div', 'phone' + (m[0] === 'Call' ? ' call' : ''));
    const meta = el('div', 'meta'); meta.append(el('span', 'chan', m[0] === 'Call' ? 'Incoming call' : m[0]), el('span', null, m[2]));
    phone.append(meta, el('p', 'from', m[1]), el('p', 'msg', m[0] === 'Call' ? '"' + m[3] + '"' : m[3]));
    stage.append(phone);
    const picks = el('div', 'picks scam');
    [['scam', 'Scam', '← or S'], ['real', 'Genuine', '→ or G']].forEach(([v, label, hint]) => {
      const b = el('button', 'pick'); b.type = 'button'; b.append(document.createTextNode(label), el('small', null, hint));
      b.onclick = () => answer(v, picks, phone); picks.append(b);
    });
    stage.append(picks, el('p', 'swipe-hint', 'On a phone, swipe the message left or right.'));
    const t0 = performance.now(); s.t0 = t0;
    clearInterval(timerId);
    timerId = setInterval(() => { const left = Math.max(0, 1 - (performance.now() - t0) / (LIMIT * 1000)); ti.style.width = (left * 100) + '%'; if (!left) clearInterval(timerId); }, 100);
    keyHandler = e => {
      if (e.key === 'ArrowLeft' || e.key === 's' || e.key === 'S') answer('scam', picks, phone);
      if (e.key === 'ArrowRight' || e.key === 'g' || e.key === 'G') answer('real', picks, phone);
    };
    document.addEventListener('keydown', keyHandler);
    swipe(phone, v => answer(v, picks, phone));
  }

  function swipe(node, done) {
    let x0 = null, dx = 0;
    node.addEventListener('pointerdown', e => { x0 = e.clientX; dx = 0; node.setPointerCapture(e.pointerId); });
    node.addEventListener('pointermove', e => { if (x0 == null) return; dx = e.clientX - x0; if (!reduce) node.style.transform = 'translateX(' + dx + 'px) rotate(' + dx / 30 + 'deg)'; });
    const end = () => { if (x0 == null) return; x0 = null; node.style.transform = ''; if (Math.abs(dx) > 80) done(dx < 0 ? 'scam' : 'real'); };
    node.addEventListener('pointerup', end); node.addEventListener('pointercancel', end);
  }

  function answer(v, picks, phone) {
    if (picks.dataset.done) return; picks.dataset.done = '1';
    clearInterval(timerId); document.removeEventListener('keydown', keyHandler);
    const m = s.order[s.i], ok = v === m[4], secs = (performance.now() - s.t0) / 1000;
    const bonus = ok ? Math.round(Math.max(0, 1 - secs / LIMIT) * 50) : 0;
    if (ok) { s.right++; s.points += 100 + bonus; }
    s.log.push({ m, ok });
    [...picks.children].forEach(b => { b.disabled = true; });
    phone.style.pointerEvents = 'none';
    hudScore.textContent = String(s.points);
    bar.style.width = ((s.i + 1) / MSGS.length * 100) + '%';
    const fb = el('div', 'fb ' + (ok ? 'good' : 'bad'));
    fb.append(el('b', 'v', (ok ? 'Right' + (bonus ? ' · +' + bonus + ' speed bonus' : '') + '. ' : 'Caught out. ') + (m[4] === 'scam' ? 'This is a scam.' : 'This one is genuine.')));
    fb.append(document.createTextNode(m[5]));
    picks.after(fb);
    const last = s.i === MSGS.length - 1;
    const nb = el('button', 'btn', last ? 'See your score' : 'Next message'); nb.type = 'button'; nb.style.marginTop = '14px';
    nb.onclick = () => { if (last) results(); else { s.i++; show(); } };
    fb.after(nb); nb.focus({ preventScroll: true });
  }

  function results() {
    hudStep.textContent = 'Results';
    const n = s.right;
    const rank = n >= 14 ? ['Scam-Proof', 'Fraudsters would give up on you. Now teach your family.']
      : n >= 11 ? ['Hard to Fool', 'You caught most of them. One slip is all a scammer needs, so check the ones you missed.']
      : n >= 8 ? ['Getting There', 'You spot the obvious ones. The polite, official-sounding ones are the dangerous ones.']
      : ['Easy Target', "Don't worry, that's why this game exists. Read the tells below; they repeat."];
    stage.replaceChildren();
    const r = el('div', 'result');
    r.append(el('p', 'kick', 'You got right'), el('p', 'score-big', n + '/' + MSGS.length), el('p', 'rank', rank[0]), el('p', null, rank[1]));
    r.append(el('p', 'small-note', s.points + ' points including speed bonus.'));
    const b = best('scam-or-not', s.points); if (b > s.points) r.append(el('p', 'small-note', 'Your best so far: ' + b + ' points.'));
    r.append(el('p', 'lesson', 'Three rules beat almost every scam: never share an OTP or PIN, never act on urgency, and never use a link or number the message gives you. Use the one you already have.'));
    r.append(shareBox('I scored ' + n + '/' + MSGS.length + ' on Scam or Not? (' + rank[0] + '). Could your family spot them?', 'https://readsigil.com/play/scam-or-not/'));
    const miss = s.log.filter(x => !x.ok);
    if (miss.length) {
      r.append(el('p', 'kick review-k', 'The ones that got you'));
      const ul = el('ul', 'review');
      miss.forEach(x => { const li = el('li'); li.append(el('b', null, (x.m[4] === 'scam' ? 'Scam: ' : 'Genuine: ') + x.m[1]), document.createTextNode(x.m[5])); ul.append(li); });
      r.append(ul);
    }
    const again = el('button', 'btn ghost', 'Play again (new order)'); again.type = 'button'; again.style.marginTop = '18px'; again.onclick = reset;
    r.append(again, moreGames('scam-or-not'));
    stage.append(r);
  }

  reset();
})();
