'use strict';
(function () {
  const { el, shuffle, best, shareBox, moreGames } = window.Play;
  // [text, form, answer, source (human) or note (ai), tell]
  const ITEMS = [
    ['Hope is the thing with feathers –\nThat perches in the soul –\nAnd sings the tune without the words –\nAnd never stops – at all –', 'Poem', 'human', 'Emily Dickinson, "Hope is the thing with feathers" (written around 1861)',
     'The dashes and the odd, concrete "thing with feathers". Dickinson leaves the image strange instead of explaining it.'],
    ['If you shed tears when you miss the sun, you also miss the stars.', 'Aphorism', 'human', 'Rabindranath Tagore, Stray Birds (1916)',
     'A simple image with a sting in it. Tagore trusts you to get it without a moral at the end.'],
    ['Work is love made visible.', 'Aphorism', 'human', 'Kahlil Gibran, The Prophet (1923)',
     'Four words and no hedging. Machines usually add a clause to explain themselves.'],
    ['The mass of men lead lives of quiet desperation.', 'Prose', 'human', 'Henry David Thoreau, Walden (1854)',
     'Blunt, and a little rude about people. AI tends to soften judgments like this.'],
    ['We are all in the gutter, but some of us are looking at the stars.', 'Line from a play', 'human', "Oscar Wilde, Lady Windermere's Fan (1892)",
     'A low, physical word ("gutter") beside a lofty one. Human wit takes that risk.'],
    ['Who has seen the wind?\nNeither I nor you:\nBut when the leaves hang trembling,\nThe wind is passing through.', 'Poem', 'human', 'Christina Rossetti, Sing-Song (1872)',
     'Nursery-rhyme plainness. It never tries to sound profound, which is why it is.'],
    ["I'm Nobody! Who are you?\nAre you – Nobody – too?", 'Poem', 'human', 'Emily Dickinson, "I\'m Nobody! Who are you?" (written around 1861)',
     'Playful and conversational, with odd capitals. It sounds like a person whispering a joke.'],
    ["Your children are not your children.\nThey are the sons and daughters of Life's longing for itself.", 'Prose poem', 'human', 'Kahlil Gibran, The Prophet (1923)',
     'It opens with a claim that sounds wrong on purpose and makes you work for the meaning.'],
    ['The lamp does not ask the night for permission.\nIt simply begins.', 'Aphorism', 'ai', 'Written by an AI (Claude) for this game.',
     'It sounds wise, but the image is generic and the lesson is spelled out in "simply begins".'],
    ['Grief is a quiet visitor –\nIt does not knock, nor stay –\nIt rearranges all the chairs\nAnd then it goes away –', 'Poem', 'ai', 'Written by an AI (Claude) for this game, imitating Dickinson.',
     'Borrowed dashes, but the metaphor is tidy and wraps up neatly. Dickinson rarely ties a bow.'],
    ['Most men spend their mornings preparing for a day that never quite arrives.', 'Prose', 'ai', 'Written by an AI (Claude) for this game, imitating Thoreau.',
     'A smooth imitation, with the soft "never quite" that language models love.'],
    ['Love does not hold the door open; it takes down the wall.', 'Aphorism', 'ai', 'Written by an AI (Claude) for this game.',
     'The "does not X; it Y" turn is a favourite AI pattern. Neat, balanced and forgettable.'],
    ['Ambition is merely boredom that has learned to dress well.', 'Epigram', 'ai', 'Written by an AI (Claude) for this game, imitating Wilde.',
     'Wilde-flavoured, but engineered: an abstract noun plus a witty definition.'],
    ['Who has heard the rain\nUpon a sleeping town?\nIt writes its little letters\nAnd never sets them down.', 'Poem', 'ai', 'Written by an AI (Claude) for this game, imitating Rossetti.',
     'It copies the shape of a real poem. "Writes its little letters" is pretty but does not quite make sense.'],
    ['A river remembers every stone, yet carries none of them.', 'Aphorism', 'ai', 'Written by an AI (Claude) for this game.',
     'A balanced paradox that sounds ancient and says very little.'],
  ];
  const stage = document.getElementById('stage'), bar = document.getElementById('bar'), hudStep = document.getElementById('hud-step'), hudScore = document.getElementById('hud-score');
  let s, keyHandler = null;

  function reset() { s = { order: shuffle(ITEMS), i: 0, right: 0, streak: 0, bestStreak: 0, log: [] }; hudScore.textContent = '0'; intro(); }

  function intro() {
    bar.style.width = '0%'; hudStep.textContent = 'Ready';
    stage.replaceChildren();
    stage.append(el('p', 'kick', 'How it works'));
    const ul = el('ul', 'how');
    ['Fifteen short pieces: poems, aphorisms, lines of prose.', 'Some are by famous human writers. Some were written by an AI to imitate them.', 'Pick Human or AI. Keyboard: H or A.'].forEach(t => ul.append(el('li', null, t)));
    stage.append(ul);
    const b = el('button', 'btn', 'Start'); b.type = 'button'; b.onclick = show; stage.append(b); b.focus({ preventScroll: true });
  }

  function show() {
    const it = s.order[s.i];
    hudStep.textContent = (s.i + 1) + ' of ' + ITEMS.length;
    stage.replaceChildren();
    stage.append(el('p', 'form', it[1]), el('p', 'verse', it[0]));
    const picks = el('div', 'picks');
    [['human', 'Human', 'Press H'], ['ai', 'AI', 'Press A']].forEach(([v, label, hint]) => {
      const b = el('button', 'pick'); b.type = 'button'; b.dataset.v = v; b.append(document.createTextNode(label), el('small', null, hint));
      b.onclick = () => answer(v, picks); picks.append(b);
    });
    stage.append(picks);
    if (s.streak >= 2) stage.append(el('p', 'small-note streak', 'Streak: ' + s.streak + ' in a row'));
    keyHandler = e => { if (e.key === 'h' || e.key === 'H') answer('human', picks); if (e.key === 'a' || e.key === 'A') answer('ai', picks); };
    document.addEventListener('keydown', keyHandler);
  }

  function answer(v, picks) {
    if (picks.dataset.done) return; picks.dataset.done = '1';
    document.removeEventListener('keydown', keyHandler);
    const it = s.order[s.i], ok = v === it[2];
    [...picks.children].forEach(b => { b.disabled = true; });
    if (ok) { s.right++; s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak); } else s.streak = 0;
    s.log.push({ it, ok });
    hudScore.textContent = String(s.right);
    bar.style.width = ((s.i + 1) / ITEMS.length * 100) + '%';
    const fb = el('div', 'fb ' + (ok ? 'good' : 'bad'));
    fb.append(el('b', 'v', (ok ? 'Right. ' : 'Fooled. ') + (it[2] === 'human' ? 'A human wrote this.' : 'An AI wrote this.')));
    fb.append(el('p', null, it[3]), el('p', null, 'The tell: ' + it[4]));
    picks.after(fb);
    const last = s.i === ITEMS.length - 1;
    const nb = el('button', 'btn', last ? 'See your score' : 'Next'); nb.type = 'button'; nb.style.marginTop = '14px';
    nb.onclick = () => { if (last) results(); else { s.i++; show(); } };
    fb.after(nb); nb.focus({ preventScroll: true });
  }

  function results() {
    hudStep.textContent = 'Results';
    const n = s.right;
    const rank = n >= 13 ? ['Machine Whisperer', 'You can hear the difference between a voice and an imitation of one.']
      : n >= 10 ? ['Sharp Reader', 'You caught most of them. The neat, balanced ones are the hardest.']
      : n >= 7 ? ['Coin Flipper', 'Guessing at random scores about 7. The machine is better at sounding human than it looks.']
      : ['Fooled by the Machine', 'The AI convinced you more often than the poets did. You are not alone.'];
    stage.replaceChildren();
    const r = el('div', 'result');
    r.append(el('p', 'kick', 'You spotted'), el('p', 'score-big', n + '/' + ITEMS.length), el('p', 'rank', rank[0]), el('p', null, rank[1]));
    if (s.bestStreak >= 3) r.append(el('p', 'small-note', 'Longest streak: ' + s.bestStreak + '.'));
    const b = best('human-or-ai', n); if (b > n) r.append(el('p', 'small-note', 'Your best so far: ' + b + '/' + ITEMS.length + '.'));
    r.append(el('p', 'lesson', 'Machines write balanced paradoxes, explain their images and tie neat bows. Humans take risks: odd words, rude truths, images left unexplained.'));
    r.append(shareBox('I spotted ' + n + '/' + ITEMS.length + ' in Human or AI? (' + rank[0] + '). Think you can tell the poets from the machine?', 'https://readsigil.com/play/human-or-ai/'));
    const miss = s.log.filter(x => !x.ok);
    if (miss.length) {
      r.append(el('p', 'kick review-k', 'The ones that fooled you'));
      const ul = el('ul', 'review');
      miss.forEach(m => { const li = el('li'); li.append(el('b', null, m.it[2] === 'human' ? 'Human: ' + m.it[3] : 'AI-written'), document.createTextNode(m.it[0].replace(/\n/g, ' / '))); ul.append(li); });
      r.append(ul);
    }
    const again = el('button', 'btn ghost', 'Play again (new order)'); again.type = 'button'; again.style.marginTop = '18px'; again.onclick = reset;
    r.append(again, moreGames('human-or-ai'));
    stage.append(r);
  }

  reset();
})();
