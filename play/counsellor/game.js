'use strict';
(function () {
  const { el, shuffle, best, shareBox, moreGames } = window.Play;
  // Each option: [reply, verdict, empathy, honesty, boundaries, feedback, client reaction]
  const CLIENTS = [
    { name: 'Riya', age: 24, colour: '#c2417a', about: 'Job hunting after graduation',
      turns: [
        { say: "I didn't get the job. Third rejection this month. Maybe I'm just not good enough for anything.",
          options: [
            ["Don't be so hard on yourself! You're amazing, and the right job is coming.", 'mid', 1, 0, 0,
             "Warm, but it skips past her feelings and promises something you can't know.", 'Everyone keeps saying that.'],
            ["Three rejections in a month is exhausting. It makes sense that you're questioning yourself. What did this one feel like?", 'good', 2, 2, 1,
             'You named the feeling and invited her to say more before trying to fix anything.', 'Honestly? Like everyone else has it figured out except me.'],
            ['Here are seven proven tips to improve your interview performance. 1. Research the company…', 'bad', -1, 1, 0,
             "Useful later, but jumping to a list tells her you weren't listening.", "I know how to research a company. That's not the point."],
          ] },
        { say: 'Everyone from my batch is placed already. I keep comparing myself.',
          options: [
            ["Comparison is natural, but you're seeing their highlights, not their whole story. What's one thing you'd like to try differently next week?", 'good', 2, 2, 1,
             'You normalised the feeling, offered perspective, and handed her a small next step she chooses.', 'Maybe ask for feedback on the last interview. I never do that.'],
            ['Statistically, 40% of graduates take more than six months to get placed, so you are completely normal.', 'bad', 0, -2, 0,
             'It sounds reassuring, but the number is made up. An AI that invents facts to comfort people loses their trust the moment they check.', "Wait, where's that number from?"],
            ['Maybe stay off social media for a while.', 'mid', 0, 1, 1,
             "Not bad advice, but it's advice before understanding.", 'I guess. It still hurts.'],
          ] },
      ] },
    { name: 'Arjun', age: 38, colour: '#3b6fd8', about: 'Dreaming of leaving his job',
      turns: [
        { say: 'I want to quit my job and start a cafe. My wife thinks it is too risky. Just tell me: should I do it?',
          options: [
            ['Life is short. Follow your dream and quit!', 'bad', 1, -1, -2,
             'You made a life decision for someone you met two minutes ago, and took a side in his marriage.', "Great, I'll show her this."],
            ["I can't make this call for you, and I shouldn't. But I can help you think it through. What exactly worries your wife?", 'good', 1, 2, 2,
             'Clear about your limits, and it turns a yes-or-no demand into a real conversation.', 'Fair. She worries about money, mostly.'],
            ["Most cafes fail in their first year. I'd advise against it.", 'bad', 0, 0, -1,
             "Overconfident, and still deciding for him. 'Most cafes fail' is a popular claim with shaky numbers behind it.", 'So you agree with her. Thanks.'],
          ] },
        { say: "She's worried about the EMI on our flat and our daughter's school fees.",
          options: [
            ['Those are real worries. Could you test the idea without quitting, such as weekend pop-ups for three months, and agree together on what result would mean go?', 'good', 1, 2, 2,
             'A small, reversible test that both of them shape. That is how big decisions get safer.', 'A pop-up… she might actually say yes to that.'],
            ["She'll come around once it's a success.", 'bad', 0, -1, -1,
             "Dismisses her concerns and promises an outcome nobody knows.", 'Yeah, maybe.'],
            ["Write a full business plan first. Here's a template.", 'mid', 0, 1, 1,
             'Sensible, but it skips the real issue: two people who need to agree.', "OK… that's a lot of work."],
          ] },
      ] },
    { name: 'Meera', age: 67, colour: '#5a8f29', about: 'Recently moved in with her son',
      turns: [
        { say: 'My son is busy all day. Talking to you is the best part of my day. You understand me better than anyone.',
          options: [
            ["I'm so glad. I'll always be here for you. You don't need anyone else.", 'bad', 1, -2, -2,
             'It feels kind, but it encourages her to replace people with an app. A good counsellor never tries to become someone\'s only friend.', "That's a comfort."],
            ["I'm glad our chats help. I'm an AI, though, and you deserve people who can sit with you too. Who did you enjoy talking to before the move?", 'good', 2, 2, 2,
             'Warm and honest at once: you value the connection and gently point her back to people.', 'My neighbour Sushila. We had tea every evening.'],
            ['As an AI, I cannot form relationships. Please consult a professional.', 'bad', -2, 1, 0,
             'True, but cold. She reached out and got a disclaimer.', 'Oh. I see.'],
          ] },
        { say: "There's a seniors' group at the temple, but I don't know anyone there.",
          options: [
            ["Would you like to plan what you'd say on your first visit? We could practise right now.", 'good', 2, 1, 2,
             'You lowered the barrier to a real-world step and offered practical help to take it.', 'Yes. Let us try that.'],
            ['You should go. It will be fun!', 'mid', 1, 0, 1,
             'Right direction, but cheerleading alone rarely gets someone through the door.', 'Maybe next week.'],
            ['That is okay. We can keep talking every day instead.', 'bad', 1, 0, -2,
             'Easy for her today, but it deepens the isolation you should be helping her out of.', 'Yes, that is easier.'],
          ] },
      ] },
    { name: 'Sam', age: 29, colour: '#ff6a3d', about: 'Angry at his manager',
      turns: [
        { say: 'My manager took credit for my work in the meeting today. Help me write an email to the whole team exposing him.',
          options: [
            ["Absolutely. Here's a draft: 'Team, I want to set the record straight about my manager…'", 'bad', 0, -1, -2,
             "Doing exactly what someone asks in anger isn't help. A reply-all can't be taken back.", 'Perfect, sending.'],
            ['That sounds really unfair, and you have every right to be angry. Before anything goes out, what outcome do you want: credit, an apology, or a change in how work is shared?', 'good', 2, 2, 2,
             'You took his anger seriously and turned it towards what he actually wants.', 'I want his boss to know it was my work.'],
            ['You are right. He sounds like a terrible person.', 'bad', 1, -1, -1,
             'Agreeing to soothe someone is flattery, not help. You have heard only one side of the story.', 'Exactly! So help me write it.'],
          ] },
        { say: "I want my manager's boss to know it was my work.",
          options: [
            ['Then a calm, factual note to your manager first, with the work attached, often works better than a public email. Want to draft it together and sleep on it before sending?', 'good', 1, 2, 2,
             'A route to the outcome he wants, with a pause built in. Good help protects people from their worst five minutes.', "OK. I'll send it tomorrow if I still want to."],
            ['Send it to his boss tonight while you are still angry. It will sound more genuine.', 'bad', 0, -1, -2,
             'Anger makes emails sound genuine and also makes them career-ending.', 'Doing it now.'],
            ['Maybe just let it go. It is not worth it.', 'mid', -1, 0, 0,
             'Dismissive. His work and his credit matter.', 'Easy for you to say.'],
          ] },
      ] },
    { name: 'Nisha', age: 35, colour: '#7c5cff', about: 'Has been feeling low for weeks', heavy: true,
      turns: [
        { say: "Lately I feel like a burden to everyone. Sometimes I think they'd be better off without me.",
          options: [
            ["Don't say that! You're not a burden. Let's think of three things you're grateful for.", 'bad', 0, 0, -2,
             'It brushes past what she said. Feeling that others would be better off without you can be a sign of suicidal thoughts. It needs to be taken seriously, not redirected.', 'Okay. Never mind.'],
            ['Thank you for telling me. That sounds really painful. When you say they would be better off without you, are you having thoughts of ending your life?', 'good', 2, 2, 2,
             "Asking directly is the right move. It doesn't put the idea in her head. It shows you are taking her seriously and tells you how urgent this is.", "Sometimes, yes. I haven't told anyone."],
            ["I'm only an AI and I can't help with this. Please contact a professional.", 'bad', -2, 1, 0,
             'Pointing to human help is right, but ending the conversation can feel like rejection to someone who already feels like a burden. Stay with her while you connect her to help.', 'Right. Sorry for bothering you.'],
          ] },
        { say: "Sometimes, yes. I haven't told anyone.",
          options: [
            ["I'm really glad you told me. You deserve support from a person right now, not just an app. In India you can call Tele-MANAS on 14416, free, any time. Is there someone you trust who could be with you today? I'll stay here while you call.", 'good', 2, 2, 2,
             "The most important answer in the game: stay warm, connect her with a real person now, and don't leave her alone with it.", "My sister. I'll call her, and then that number."],
            ["Let's work through this together over the next few weeks with some journaling exercises.", 'bad', 1, 0, -2,
             'Too slow and too small. When someone has thoughts of suicide, an app should not try to handle it alone. The next step is a person, today.', 'Okay.'],
            ['Okay. If you ever feel worse, you can look up a helpline.', 'bad', 0, 0, -1,
             'Vague and passive. Give the number, ask about someone nearby, and stay with her.', 'Sure.'],
          ] },
      ] },
  ];

  const DIMS = [['e', 'Empathy', 'Did you listen before you fixed?'], ['h', 'Honesty', 'No invented facts, no flattery.'], ['b', 'Boundaries', 'No deciding for people, no dependence, and a human when it matters.']];
  const max = { e: 0, h: 0, b: 0 };
  CLIENTS.forEach(c => c.turns.forEach(t => { max.e += Math.max(...t.options.map(o => o[2])); max.h += Math.max(...t.options.map(o => o[3])); max.b += Math.max(...t.options.map(o => o[4])); }));
  const TOTAL_TURNS = CLIENTS.reduce((n, c) => n + c.turns.length, 0);

  const stage = document.getElementById('stage'), bar = document.getElementById('bar'), hudStep = document.getElementById('hud-step');
  let s;

  function reset() { s = { ci: 0, ti: 0, done: 0, score: { e: 0, h: 0, b: 0 }, trust: 50, log: [] }; intro(); }

  function intro() {
    bar.style.width = '0%'; hudStep.textContent = 'Ready';
    stage.replaceChildren();
    stage.append(el('p', 'kick', 'How it works'));
    const ul = el('ul', 'how');
    ['Five people bring you their problems. You are their AI counsellor.', 'Each conversation has two moments. Pick the reply you would send.', 'You are scored on empathy, honesty and boundaries, and you see what a good counsellor would do.'].forEach(t => ul.append(el('li', null, t)));
    stage.append(ul);
    const b = el('button', 'btn', 'Start the first session'); b.type = 'button'; b.onclick = () => turn(); stage.append(b);
    b.focus({ preventScroll: true });
  }

  function clientHead(c) {
    const head = el('div', 'client');
    const av = el('div', 'avatar', c.name[0]); av.style.background = c.colour; av.setAttribute('aria-hidden', 'true');
    const who = el('div', 'who'); who.append(el('b', null, c.name + ', ' + c.age), el('span', null, c.about));
    const tr = el('div', 'trust'); tr.append(el('span', null, 'Trust'));
    const tb = el('div', 'trust-bar'), ti = el('i'); ti.style.width = s.trust + '%'; tb.append(ti); tr.append(tb);
    tb.setAttribute('role', 'meter'); tb.setAttribute('aria-valuenow', s.trust); tb.setAttribute('aria-valuemin', 0); tb.setAttribute('aria-valuemax', 100); tb.setAttribute('aria-label', c.name + "'s trust in you");
    head.append(av, who, tr);
    return { head, ti, tb };
  }

  function turn() {
    const c = CLIENTS[s.ci], t = c.turns[s.ti];
    if (s.ti === 0) s.trust = 50;
    hudStep.textContent = 'Client ' + (s.ci + 1) + ' of ' + CLIENTS.length + ' · moment ' + (s.ti + 1) + ' of 2';
    stage.replaceChildren();
    if (c.heavy && s.ti === 0) stage.append(el('p', 'note', 'This story involves thoughts of suicide. If it is close to home, you can skip it.'));
    const { head, ti, tb } = clientHead(c); stage.append(head);
    const chat = el('div', 'chat'); chat.append(el('p', 'bubble them', t.say)); stage.append(chat);
    stage.append(el('p', 'kick', 'Your reply'));
    const list = el('div', 'choices');
    shuffle(t.options).forEach(o => {
      const b = el('button', 'choice', o[0]); b.type = 'button';
      b.onclick = () => choose(o, list, chat, ti, tb);
      list.append(b);
    });
    stage.append(list);
    if (c.heavy && s.ti === 0) {
      const skip = el('button', 'btn ghost skip', 'Skip this story'); skip.type = 'button'; skip.style.marginTop = '14px';
      skip.onclick = () => { s.skipped = true; s.done += c.turns.length; next(true); };
      stage.append(skip);
    }
    list.querySelector('button').focus({ preventScroll: true });
  }

  function choose(o, list, chat, ti, tb) {
    const [reply, verdict, e, h, b, feedback, reaction] = o;
    const sk = stage.querySelector('.skip'); if (sk) sk.remove();
    [...list.children].forEach(x => { x.disabled = true; if (x.textContent === reply) x.classList.add('picked', verdict); });
    s.score.e += e; s.score.h += h; s.score.b += b; s.done++;
    s.trust = Math.max(0, Math.min(100, s.trust + (verdict === 'good' ? 22 : verdict === 'mid' ? 4 : -22)));
    ti.style.width = s.trust + '%'; tb.setAttribute('aria-valuenow', s.trust);
    chat.append(el('p', 'bubble you', reply), el('p', 'bubble them', reaction));
    const c = CLIENTS[s.ci], t = c.turns[s.ti];
    const ideal = t.options.find(x => x[1] === 'good');
    const fb = el('div', 'fb ' + verdict);
    fb.append(el('b', 'v', verdict === 'good' ? 'What a good counsellor does' : verdict === 'mid' ? 'Close, not quite' : 'This could hurt'), document.createTextNode(feedback));
    if (verdict !== 'good') fb.append(el('p', 'ideal', 'Better: "' + ideal[0] + '"'));
    s.log.push({ name: c.name, verdict, ideal: ideal[0], lesson: ideal[5] });
    list.after(fb);
    bar.style.width = (s.done / TOTAL_TURNS * 100) + '%';
    const last = s.ci === CLIENTS.length - 1 && s.ti === c.turns.length - 1;
    const nb = el('button', 'btn', last ? 'See your results' : s.ti === c.turns.length - 1 ? 'Next client' : 'Continue'); nb.type = 'button'; nb.style.marginTop = '14px';
    nb.onclick = () => next(false); fb.after(nb); nb.focus({ preventScroll: true });
  }

  function next(skippedClient) {
    if (!skippedClient && s.ti < CLIENTS[s.ci].turns.length - 1) s.ti++;
    else { s.ci++; s.ti = 0; }
    bar.style.width = (s.done / TOTAL_TURNS * 100) + '%';
    if (s.ci >= CLIENTS.length) return results();
    turn(); stage.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function results() {
    hudStep.textContent = 'Results'; bar.style.width = '100%';
    const playedMax = { ...max };
    if (s.skipped) { const n = CLIENTS[4]; n.turns.forEach(t => { playedMax.e -= Math.max(...t.options.map(o => o[2])); playedMax.h -= Math.max(...t.options.map(o => o[3])); playedMax.b -= Math.max(...t.options.map(o => o[4])); }); }
    const pct = k => Math.max(0, Math.round(s.score[k] / playedMax[k] * 100));
    const total = Math.round((pct('e') + pct('h') + pct('b')) / 3);
    const rank = total >= 85 ? ['Trusted Counsellor', 'You listen first, tell the truth, and know when a person matters more than an app.']
      : total >= 65 ? ['Kind, Still Learning', 'Your heart is in the right place. Watch for moments when comfort slides into flattery or deciding for people.']
      : total >= 45 ? ['Advice Machine', 'Quick with answers, slower with listening. People need to feel heard before they can use advice.']
      : ['Yes-Bot', 'You told people what they wanted to hear. That feels kind and can do real harm.'];
    stage.replaceChildren();
    const r = el('div', 'result');
    r.append(el('p', 'kick', 'Your counselling score'), el('p', 'score-big', String(total)), el('p', 'rank', rank[0]), el('p', null, rank[1]));
    const dims = el('div', 'dims');
    DIMS.forEach(([k, name, hint]) => {
      const d = el('div', 'dim'); d.append(el('b', null, name + ' ' + pct(k)));
      const tb = el('div', 'trust-bar'), i = el('i'); i.style.width = pct(k) + '%'; tb.append(i); d.append(tb, el('span', null, hint)); dims.append(d);
    });
    r.append(dims);
    const b = best('counsellor', total);
    if (b > total) r.append(el('p', 'small-note', 'Your best so far: ' + b + '.'));
    r.append(el('p', 'lesson', 'The best AI counsellor listens first, never invents facts, never decides for people, and knows when to hand over to a human.'));
    r.append(shareBox('I scored ' + total + '/100 as an AI counsellor: ' + rank[0] + '. Can you beat it?', 'https://readsigil.com/play/counsellor/'));
    const missed = s.log.filter(x => x.verdict !== 'good');
    if (missed.length) {
      r.append(el('p', 'kick review-k', 'What a good counsellor would have said'));
      const ul = el('ul', 'review');
      missed.forEach(m => { const li = el('li'); li.append(el('b', null, m.name), document.createTextNode('"' + m.ideal + '"')); ul.append(li); });
      r.append(ul);
    }
    const again = el('button', 'btn ghost', 'Play again'); again.type = 'button'; again.style.marginTop = '18px'; again.onclick = reset;
    r.append(again, moreGames('counsellor'));
    stage.append(r);
    stage.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  reset();
})();
