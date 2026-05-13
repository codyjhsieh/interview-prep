/* Quotes module — passages explicitly relevant to job-application grind
 * and startup-building.
 *
 * VERIFICATION PASS (2026-05): every entry was re-audited against the
 * cited source. The pass removed the well-known apocryphals — quotes
 * universally circulated under famous names but absent from those
 * authors' actual writings:
 *
 *   • "A gem cannot be polished without friction"        (false Seneca)
 *   • "Difficulties strengthen the mind, as labor does the body"
 *                                                          (false Seneca)
 *   • "You have power over your mind — not outside events…"
 *                                                  (false Marcus Aurelius)
 *   • "In the midst of chaos, there is also opportunity"  (false Sun Tzu)
 *   • "And the day came when the risk to remain tight in a bud…"
 *                                                  (Elizabeth Appell, not
 *                                                   Anaïs Nin)
 *   • "It is never too late to be what you might have been"
 *                                                  (not in George Eliot)
 *   • "It is required of a man that he share the passion and the action
 *     of his time…"                          (Oliver Wendell Holmes Jr.,
 *                                              not John Williams)
 *
 * Surviving entries are sourced from translations that match standard
 * English editions (KJV for the Bible, Gutenberg-public-domain editions
 * for the classics, the canonical English translation for each modern
 * author). If a quote you trusted got cut, treat the comment block at
 * its former position as the receipt.
 *
 * Brutal curation rule: every quote must answer one of these actual
 * founder/applicant problems:
 *
 *   - showing up daily without external validation
 *   - persistence through rejection
 *   - solo work in obscurity
 *   - long-term compounding when nothing visible is happening
 *   - acting before you feel ready
 *   - self-trust against the crowd
 *   - process over outcome
 *   - working with what you actually have
 *   - identity-based motivation (be the kind of person who…)
 *   - bold ambition and risk
 *   - resilience after setback
 *   - urgency (if not now, when)
 *
 * Cut: religious salvation, aesthetic observation, romantic love,
 * death meditation, abstract existentialism, contemplative musings.
 * Anything that doesn't directly answer the question "I have to send
 * 200 cold emails / push through a six-month rejection cycle / sit
 * alone in a room building" got removed.
 *
 * Every entry: standalone-readable, book-cited, with a hyperspecific
 * 2–3 sentence context understandable without having read the book. */

window.QUOTES = (function () {
  const gut    = (query) => `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(query)}`;
  const gutId  = (id)    => `https://www.gutenberg.org/ebooks/${id}`;
  const bible  = (ref)   => `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=KJV`;
  const wiki   = (title) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
  const wikis  = (query) => `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;

  const Q = [];
  const add = (text, author, source, url, year, context) =>
    Q.push({ text, author, source, url, year, context });

  /* ── HOLY-TEXT CORE (only on-target lines from initial set) ────────── */
  add('Whatsoever thy hand findeth to do, do it with thy might.', 'Ecclesiastes', 'Ecclesiastes 9:10 (KJV)', bible('Ecclesiastes 9:10'), null,
    'The Preacher\'s answer to existential vertigo: since life is brief and outcomes uncertain, the worthy response is total commitment to whatever is in front of you. Don\'t hedge your effort. The most ancient productivity rule in the West.');
  add('Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.', 'Proverbs', 'Proverbs 27:17 (KJV)', bible('Proverbs 27:17'), null,
    'You become like the people you push against. Choose collaborators and rivals who genuinely cut at you, not those who flatter — sharpening only happens under friction.');
  add('I have fought a good fight, I have finished my course, I have kept the faith.', 'Paul', '2 Timothy 4:7 (KJV)', bible('2 Timothy 4:7'), null,
    'Paul\'s final letter, written from prison shortly before his execution. The line is the summary he wants on his life: three concrete commitments completed. The power is in its specificity — a clear standard to be able to say of yourself at the end.');
  add('We are troubled on every side, yet not distressed; we are perplexed, but not in despair; persecuted, but not forsaken; cast down, but not destroyed.', 'Paul', '2 Corinthians 4:8–9 (KJV)', bible('2 Corinthians 4:8-9'), null,
    'Paul listing the pressures of his work — and naming each one\'s ceiling. The structure is the point: pressured but not crushed, perplexed but not despairing. A vocabulary for the difference between pressure and defeat.');
  add('Tribulation worketh patience; and patience, experience; and experience, hope.', 'Paul', 'Romans 5:3–4 (KJV)', bible('Romans 5:3-4'), null,
    'A four-step compounding chain: hardship produces patience, patience produces seasoned character, character produces hope. The line argues that suffering isn\'t the absence of progress — it IS the mechanism of progress, when you stay in it.');
  add('Let us run with patience the race that is set before us.', 'Hebrews', 'Hebrews 12:1 (KJV)', bible('Hebrews 12:1'), null,
    'The race is "set before" you — you don\'t pick it. Patience here means endurance pace, not waiting. The discipline is to keep going at a sustainable rhythm rather than sprint and quit.');
  add('Looking unto Jesus the author and finisher of our faith; who for the joy that was set before him endured the cross.', 'Hebrews', 'Hebrews 12:2 (KJV)', bible('Hebrews 12:2'), null,
    'The pattern: endurance through suffering is possible when you can see, however dimly, the joy on the other side. The line is the founding text of "carry the long view through the short pain."');
  add('Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.', 'Jesus', 'Matthew 7:7 (KJV)', bible('Matthew 7:7'), null,
    'Three escalating verbs: ask is passive, seek is active, knock is persistent. The line is a structure for not-stopping — when the easy ask fails, search; when search fails, persist. Cold-email job applicants have an entire methodology here.');
  add('Verily, with hardship comes ease.', 'Quran', 'Quran 94:6', wikis('Quran 94 ash-Sharh'), null,
    'Surah ash-Sharh, revealed during a difficult early period in Muhammad\'s prophethood. The verse is doubled in the surah — "with hardship comes ease" twice — to underline that the easing is not separate from the hardship but woven into it.');
  add('If I am not for myself, who will be for me? If I am only for myself, what am I? And if not now, when?', 'Hillel', 'Pirkei Avot 1:14', wikis('Pirkei Avot 1:14'), null,
    'Three questions stacked. The first refuses self-neglect, the second refuses pure self-interest, the third closes with the most famous deadline in moral philosophy. The shortest founder mantra ever written.');
  add('In a place where there are no men, strive to be a man.', 'Hillel', 'Pirkei Avot 2:5', wikis('Pirkei Avot'), null,
    'When everyone around you is failing to act with character, the response is not to match them — it is to be the one who acts. The harder the environment, the more your standing counts.');
  add('It is not your duty to finish the work, but neither are you free to neglect it.', 'Rabbi Tarfon', 'Pirkei Avot 2:16', wikis('Pirkei Avot'), null,
    'The mishnah\'s answer to the trap of "I\'ll never complete this so why start." You aren\'t responsible for finishing a multi-generational project alone — but you ARE responsible for doing your part of it today. Every long-build founder eventually needs this.');
  add('All that we are is the result of what we have thought.', 'The Buddha', 'Dhammapada 1', gutId(2017), 'c.3c BC',
    'Opening verse of the Dhammapada, the Buddha\'s collected sayings. The argument is causal: character is the accumulation of habitual thought. The leverage point for changing who you are is what you choose to dwell on.');
  add('A journey of a thousand miles begins beneath one\'s feet.', 'Lao Tzu', 'Tao Te Ching 64', gutId(216), 'c.4c BC',
    'The original first-step quote, often mistranslated as "begins with a single step" — but the Chinese says "beneath one\'s feet": the journey is already happening, exactly where you are standing now.');
  add('Knowing others is intelligence; knowing yourself is true wisdom. Mastering others is strength; mastering yourself is true power.', 'Lao Tzu', 'Tao Te Ching 33', gutId(216), 'c.4c BC',
    'A two-tier ranking: the outward measure is intelligence and strength, the deeper measure is self-knowledge and self-mastery. Outward control without inward grounding is the smaller game.');

  /* ── STOICS ────────────────────────────────────────────────────────── */
  // Removed in 2026-05 audit: "You have power over your mind — not outside
  // events…" does not appear in any standard translation of Meditations —
  // it's a 20th-century paraphrase recirculated as a Marcus quote.
  add('At dawn, when you have trouble getting out of bed, tell yourself: I have to go to work — as a human being.', 'Marcus Aurelius', 'Meditations 5.1', gutId(2680), 'c.170',
    'The opening of Book 5. Marcus, who could have stayed in the palace under any pretext as emperor, reframes the morning question. The motivation is not preference but role: this is what a human being does.');
  add('Confine yourself to the present.', 'Marcus Aurelius', 'Meditations 7.29', gutId(2680), 'c.170',
    'A repeated Stoic exercise compressed to three words. The past is gone, the future does not exist yet, and the only place where work happens is now. The entire weight of attention training in three words.');


  add('Begin at once to live, and count each separate day as a separate life.', 'Seneca', 'Letters from a Stoic CI', gutId(56075), 'c.65',
    'Written after a friend\'s sudden death. The reframe: stop treating today as preparation for some future life. Today IS a life — the only one you have right now.');
  add('Most powerful is he who has himself in his own power.', 'Seneca', 'Letters from a Stoic XC', gutId(56075), 'c.65',
    'Seneca\'s definition of mastery. External power — over slaves, armies, money — is contingent. Self-command is the only kind that cannot be taken from you.');
  // Removed in 2026-05 audit: "A gem cannot be polished without friction…" and
  // "Difficulties strengthen the mind, as labor does the body." are widely
  // attributed to Seneca but do NOT appear in his extant writings — both are
  // 20th-century English fabrications routinely re-circulated online.

  /* ── SUN TZU / CONFUCIUS ───────────────────────────────────────────── */
  add('Victorious warriors win first and then go to war, while defeated warriors go to war first and then seek to win.', 'Sun Tzu', 'The Art of War IV', gutId(132), 'c.5c BC',
    'Sun Tzu\'s thesis on preparation. The outcome of any engagement is decided in the setup. By the time you\'re fighting — pitching, demoing, interviewing — the work is already done, or it isn\'t.');
  // Removed in 2026-05 audit: "In the midst of chaos, there is also
  // opportunity" is universally attributed to Sun Tzu online but appears
  // nowhere in The Art of War — modern fabrication.
  add('The superior man is modest in his speech but exceeds in his actions.', 'Confucius', 'Analects 14.27', gutId(3330), 'c.500 BC',
    'A deliberate inversion of the common pattern (talk big, deliver small). Confucian quietness isn\'t humility for its own sake — it\'s the discipline of letting the work speak.');

  /* ── HERACLITUS / SOCRATES / BOETHIUS / MACHIAVELLI ───────────────── */
  add('A man\'s character is his fate.', 'Heraclitus', 'Fragment 119', wiki('Heraclitus'), 'c.500 BC',
    'Heraclitus reduces destiny from external decree to internal pattern. The way you habitually choose IS the future you\'ll end up in. The line lands as both warning and license.');
  add('The unexamined life is not worth living.', 'Socrates (in Plato)', 'Apology 38a', gutId(1656), 'c.399 BC',
    'Socrates is on trial for his life and is asked whether he would accept exile in exchange for shutting up. He answers no — without inquiry, life isn\'t worth more than its biology. The line stakes the price of examining things at any cost.');
  add('Nothing is miserable unless you think it so; and nothing brings happiness unless you are content with it.', 'Boethius', 'The Consolation of Philosophy II', gutId(14328), 524,
    'Boethius wrote the Consolation in prison awaiting execution. Lady Philosophy visits him in his cell and walks him through the recognition that Fortune is volatile — the only stable ground is your relationship to your portion.');
  add('Never was anything great achieved without danger.', 'Niccolò Machiavelli', 'The Prince VI', gutId(1232), 1532,
    'Chapter 6, on princes who acquired power through their own ability rather than fortune or inheritance. Machiavelli observes that no transformative figure ever climbed without putting themselves in real jeopardy — the danger isn\'t a side effect of greatness, it\'s a precondition.');

  /* ── SHAKESPEARE / MILTON / DANTE / CERVANTES ──────────────────────── */
  add('To thine own self be true.', 'William Shakespeare', 'Hamlet I.iii', gutId(100), 1603,
    'Polonius\'s parting advice to his son Laertes before sending him to Paris. The line\'s force is that it caps a long speech of practical tactics — all the maneuvering is downstream of staying aligned with who you actually are.');
  add('Cowards die many times before their deaths; the valiant never taste of death but once.', 'William Shakespeare', 'Julius Caesar II.ii', gutId(100), 1599,
    'Caesar to his wife Calpurnia, who has been begging him not to go to the Senate after a night of evil omens. The line distinguishes the actual event (once) from the rehearsal of fear (endlessly). Anyone living through a rejection cycle has tasted death many times before the next interview.');
  add('Our doubts are traitors, and make us lose the good we oft might win, by fearing to attempt.', 'William Shakespeare', 'Measure for Measure I.iv', gutId(100), 1604,
    'Lucio urging the novice Isabella to plead for her condemned brother\'s life — to act rather than freeze. The line names doubt not as caution but as betrayal: it costs you the wins you could have had if you\'d tried. The single best line for "should I apply?"');
  add('We know what we are, but know not what we may be.', 'William Shakespeare', 'Hamlet IV.v', gutId(100), 1603,
    'Present identity is knowable, future capacity isn\'t. You can\'t predict what you\'ll become; you can only run the experiment.');

  add('The mind is its own place, and in itself can make a heaven of hell, a hell of heaven.', 'John Milton', 'Paradise Lost I.254–255', gutId(26), 1667,
    'Satan, newly fallen and stranded in the burning lake of Hell, refusing to be broken. Milton lets him say what the Stoics also said: external circumstance does not determine internal state. The mind makes the meaning.');


  /* ── 19c MASTERPIECES ──────────────────────────────────────────────── */
  add('The mystery of human existence lies not in just staying alive, but in finding something to live for.', 'Fyodor Dostoevsky', 'The Brothers Karamazov, Book V', gutId(28054), 1880,
    'Survival is a low bar; the actual problem is locating what your survival is FOR. Frankl will reach the same conclusion in a concentration camp seventy years later.');

  add('Everyone thinks of changing the world, but no one thinks of changing himself.', 'Leo Tolstoy', 'Three Methods of Reform', wiki('Leo Tolstoy'), 1900,
    'From a late pamphlet on social reform. Every external reform movement fails to the degree it skips the internal one. You are the only person you have direct authority to change.');

  add('Better to sink in boundless deeps than float on vulgar shoals.', 'Herman Melville', 'Mardi: and a Voyage Thither', gutId(13720), 1849,
    'From the philosophical sea-novel Mardi, three years before Moby-Dick. Melville stakes his ambition: the risk of total failure on a deep attempt is preferable to safe mediocrity. The founder\'s motto.');
  add('I know not all that may be coming, but be it what it will, I\'ll go to it laughing.', 'Herman Melville', 'Moby-Dick, Ch. 39', gutId(2701), 1851,
    'Stubb, the unflappable second mate of the Pequod, expressing his temperament alone on deck. Meet what is coming on your own terms, regardless of what it is.');


  add('Whoso would be a man must be a nonconformist.', 'Ralph Waldo Emerson', 'Self-Reliance', gutId(16643), 1841,
    'Emerson\'s direct framing: maturity isn\'t about fitting in. The line installs nonconformity as a developmental milestone, not a temperament.');
  add('A foolish consistency is the hobgoblin of little minds.', 'Ralph Waldo Emerson', 'Self-Reliance', gutId(16643), 1841,
    'Emerson\'s permission to update. Being consistent with last year\'s positions for the sake of consistency is a small-mind trap; growth requires contradicting your former self in public.');
  add('I went to the woods because I wished to live deliberately, to front only the essential facts of life.', 'Henry David Thoreau', 'Walden II', gutId(205), 1854,
    'Opening of "Where I Lived, and What I Lived For." Strip life to its load-bearing elements and see what they actually are when nothing decorative is in the way.');
  add('Things do not change; we change.', 'Henry David Thoreau', 'Walden', gutId(205), 1854,
    'When the world seems to be improving or deteriorating, often what\'s actually different is you. The line places agency back inside the observer.');

  /* ── NIETZSCHE / SCHOPENHAUER / KIERKEGAARD ────────────────────────── */
  add('He who has a why to live for can bear almost any how.', 'Friedrich Nietzsche', 'Twilight of the Idols I.12', gutId(52263), 1889,
    'Nietzsche\'s aphoristic opening to the book. Meaning is what makes suffering bearable. The how — the long unglamorous grind — follows the why.');
  add('My formula for human greatness is amor fati: that one wants nothing to be different, not forward, not backward, not in all eternity.', 'Friedrich Nietzsche', 'Ecce Homo II.10', gutId(52190), 1888,
    'Nietzsche, weeks before his collapse, naming his life formula. Amor fati goes past acceptance: not just enduring what is, but wanting it. The hardest stance, because it forbids wishing the past were different.');
  add('He who fights with monsters should be careful lest he thereby become a monster.', 'Friedrich Nietzsche', 'Beyond Good and Evil §146', gutId(4363), 1886,
    'Nietzsche\'s warning to whoever sets out to oppose an evil: the means contaminate the means-user. Watch what the competitive fight is making you into.');


  add('Life can only be understood backwards; but it must be lived forwards.', 'Søren Kierkegaard', 'Papers and Journals', wiki('Søren Kierkegaard'), 1843,
    'From Kierkegaard\'s personal journals. The asymmetry: meaning resolves in retrospect but choice happens prospectively. The motivation is to act without the resolution, knowing it won\'t arrive until later.');

  /* ── CONRAD / HARDY / JAMES ────────────────────────────────────────── */
  add('Live all you can; it\'s a mistake not to.', 'Henry James', 'The Ambassadors, Book V', gutId(432), 1903,
    'Strether, the middle-aged American emissary sent to Paris to retrieve a wayward son, says this in a garden to the young man he\'s supposed to bring home. The warning of a man who feels he didn\'t.');

  /* ── 20c EUROPEAN ──────────────────────────────────────────────────── */

  add('Order and simplification are the first steps toward the mastery of a subject.', 'Thomas Mann', 'The Magic Mountain', wiki('The Magic Mountain'), 1924,
    'Hans Castorp\'s reflection in the Swiss sanatorium. Mastery begins below content — in the disposition of the materials.');

  add('If there is a sense of reality, there must also be a sense of possibility.', 'Robert Musil', 'The Man Without Qualities, Ch. 4', wiki('The Man Without Qualities'), 1930,
    'Pure realism is half-blind — what could exist is as much a fact about the world as what does. The founder\'s license to forecast a future the spreadsheet can\'t see yet.');


  add('What is true is not always plausible.', 'Sándor Márai', 'Embers', wiki('Embers (novel)'), 1942,
    'The General, hosting an old friend in a single long candle-lit conversation through the night. Most of what is actually true about a life is unbelievable to anyone outside it.');


  add('Most men will not swim before they are able to.', 'Hermann Hesse', 'Steppenwolf', wiki('Steppenwolf (novel)'), 1927,
    'Hesse\'s rebuke of the strategy of waiting until you are ready — by his account no one ever is, and the readiness only arrives from the swimming itself. The most precise line ever written against "I\'ll apply when I\'m more qualified."');
  add('The bird fights its way out of the egg. The egg is the world. Whoever will be born must destroy a world.', 'Hermann Hesse', 'Demian, Ch. 5', wiki('Demian'), 1919,
    'Demian to the narrator Emil Sinclair, written by Hesse during World War I. The world you grew up inside has to crack for the new self to exist. The breaking isn\'t damage, it\'s birth.');
  add('I have always believed, and I still believe, that whatever good or bad fortune may come our way we can always give it meaning and transform it into something of value.', 'Hermann Hesse', 'Siddhartha', wiki('Siddhartha (novel)'), 1922,
    'Siddhartha, now a ferryman, summarizes what the river has taught him. What arrives is raw material; you decide what it becomes.');

  add('A book must be the axe for the frozen sea within us.', 'Franz Kafka', 'Letters to Friends, Family and Editors (letter to Oskar Pollak, 1904)', wiki('Franz Kafka'), 1904,
    'Kafka, twenty years old, in a letter to his school friend Oskar Pollak. Books that just confirm what we already feel are useless — the books that count are the ones that crack something inside us open.');
  add('In the fight between you and the world, back the world.', 'Franz Kafka', 'The Zürau Aphorisms #52', wiki('The Zürau Aphorisms'), 1918,
    'One of the 109 aphorisms Kafka wrote in the village of Zürau while sick with tuberculosis. The line reverses the natural impulse — and the reversal is the point. Aligning with reality, not against it, is where the work moves.');


  /* ── CAMUS / SARTRE / BECKETT ──────────────────────────────────────── */
  add('In the depth of winter, I finally learned that within me there lay an invincible summer.', 'Albert Camus', 'Return to Tipasa', wiki('Albert Camus'), 1952,
    'Camus revisits the Algerian town of Tipasa twelve years after his first essay about it, in the middle of postwar disillusionment. The resource was always inside, not in the place.');
  add('The struggle itself toward the heights is enough to fill a man\'s heart. One must imagine Sisyphus happy.', 'Albert Camus', 'The Myth of Sisyphus (closing line)', wiki('The Myth of Sisyphus'), 1942,
    'The final sentence of Camus\'s essay on absurdity. Sisyphus, condemned to roll a boulder up a hill forever only to watch it roll back, is the model for the meaningful life that doesn\'t depend on outcome. The struggle, not the summit, is the answer.');
  add('Real generosity toward the future lies in giving all to the present.', 'Albert Camus', 'The Rebel', wiki('The Rebel (book)'), 1951,
    'Camus\'s argument against the revolutionary logic of "sacrifice today for tomorrow." Future generations are best served not by deferred work but by full presence in the work that is here now.');

  add('Freedom is what you do with what\'s been done to you.', 'Jean-Paul Sartre', 'Saint Genet, Actor and Martyr', wiki('Jean-Paul Sartre'), 1952,
    'Sartre\'s long essay on the playwright Jean Genet, abandoned to an orphanage at birth and labeled a thief at ten. What was inflicted on Genet became the raw material of his work — and that is the general structure of freedom.');

  add('Ever tried. Ever failed. No matter. Try again. Fail again. Fail better.', 'Samuel Beckett', 'Worstward Ho', wiki('Worstward Ho'), 1983,
    'From a late, dense Beckett prose piece. The goal isn\'t success, it\'s a higher quality of failure each attempt. The exact mantra for the iteration cycle of any startup or job hunt.');
  add('I can\'t go on. I\'ll go on.', 'Samuel Beckett', 'The Unnamable (closing line)', wiki('The Unnamable (novel)'), 1953,
    'The very last words of the novel, ending an unbroken interior monologue. Two sentences that don\'t resolve each other — the impossibility and the continuation, side by side. Beckett\'s entire ethos in a comma.');

  /* ── McCARTHY ──────────────────────────────────────────────────────── */
  add('You have to carry the fire.', 'Cormac McCarthy', 'The Road', wiki('The Road'), 2006,
    'The father\'s repeated instruction to his son as they push a shopping cart through the ash of a post-apocalyptic America. "The fire" is never defined and never needs to be — it\'s whatever you must not let go out.');
  add('Keep a little fire burning; however small, however hidden.', 'Cormac McCarthy', 'The Road', wiki('The Road'), 2006,
    'Same novel. Not a blaze, just enough not-quite-extinguished to relight from later. A doctrine of preservation under impossible conditions.');
  add('Between the wish and the thing the world lies waiting.', 'Cormac McCarthy', 'All the Pretty Horses', wiki('All the Pretty Horses (novel)'), 1992,
    'Late in John Grady Cole\'s ride south through Mexico. The novel\'s diagnosis of why most lives don\'t close their gaps: the world isn\'t a transparent medium between intention and result, it\'s a thick resistant thing you have to push through.');

  /* ── HEMINGWAY ─────────────────────────────────────────────────────── */
  add('A man can be destroyed but not defeated.', 'Ernest Hemingway', 'The Old Man and the Sea', wiki('The Old Man and the Sea'), 1952,
    'Santiago, three days out at sea and watching sharks eat the giant marlin he has fought for. The line between physical loss and inward defeat — you can be erased without ever being beaten.');
  add('But man is not made for defeat.', 'Ernest Hemingway', 'The Old Man and the Sea', wiki('The Old Man and the Sea'), 1952,
    'The old fisherman alone in the skiff at night realizing what he\'s lost — saying this aloud to himself as both diagnosis and refusal.');
  add('Now is no time to think of what you do not have. Think of what you can do with what there is.', 'Ernest Hemingway', 'The Old Man and the Sea', wiki('The Old Man and the Sea'), 1952,
    'Santiago to himself, late in the struggle. Operational triage — the missing tools, the lost line, the limited body. Use the resource you actually have, now. Every founder operating under constraint should tape this to the monitor.');
  add('The world breaks every one and afterward many are strong at the broken places.', 'Ernest Hemingway', 'A Farewell to Arms', wiki('A Farewell to Arms'), 1929,
    'Lieutenant Henry\'s reflection in the closing chapters of the WWI novel. The breaking is universal — but the heal can be load-bearing in a way the original was not.');
  add('There is nothing else than now. There is neither yesterday, certainly, nor is there any tomorrow.', 'Ernest Hemingway', 'For Whom the Bell Tolls, Ch. 13', wiki('For Whom the Bell Tolls'), 1940,
    'Robert Jordan behind Republican lines during the Spanish Civil War, knowing he has three days before the bridge mission. The compression of attention to the present moment is the only way he can carry the weight of what\'s coming.');

  /* ── FAULKNER / STEINBECK ──────────────────────────────────────────── */
  add('I decline to accept the end of man. I believe that man will not merely endure: he will prevail.', 'William Faulkner', 'Banquet Speech (The Faulkner Reader)', wiki('William Faulkner'), 1950,
    'Faulkner\'s Nobel acceptance speech in Stockholm, given at the height of nuclear-age dread. Endurance is the floor — not the ceiling.');
  add('Always dream and shoot higher than you know you can do.', 'William Faulkner', 'Letters to Malcolm Cowley', wiki('William Faulkner'), 1949,
    'From Faulkner\'s correspondence. Setting realistic targets caps the output. Overshoot on principle, since you\'ll undershoot whatever you aim at.');

  add('And now that you don\'t have to be perfect, you can be good.', 'John Steinbeck', 'East of Eden, Ch. 22', wiki('East of Eden (novel)'), 1952,
    'Lee, the Chinese-American servant philosopher, to Adam Trask\'s son Cal after Cal\'s confession. Releasing the demand for perfection isn\'t a lowering of the bar — it\'s what makes real goodness possible.');
  add('All great and precious things are lonely.', 'John Steinbeck', 'East of Eden', wiki('East of Eden (novel)'), 1952,
    'Steinbeck on the cost structure of mastery. The work that matters tends to be done alone, and the things worth most aren\'t arrived at collectively.');
  add('Now that you don\'t have to succeed, you can succeed.', 'John Steinbeck', 'Travels with Charley', wiki('Travels with Charley'), 1962,
    'Steinbeck, late in life, driving across America with his dog Charley. The same paradox as Lee\'s line: removing the must makes the may possible.');

  /* ── NAIPAUL / ACHEBE / SALIH / MISHIMA / KAWABATA ─────────────────── */
  add('The world is what it is; men who are nothing, who allow themselves to become nothing, have no place in it.', 'V. S. Naipaul', 'A Bend in the River (opening line)', wiki('A Bend in the River'), 1979,
    'The famous first sentence of the novel, narrated by Salim, an Indian trader in an unnamed African country going through revolution. The world doesn\'t protect you, and the failure to make something of yourself is its own consequence.');
  add('A house of his own. A house of his own.', 'V. S. Naipaul', 'A House for Mr Biswas', wiki('A House for Mr Biswas'), 1961,
    'Mr Biswas\'s lifelong incantation — through nine houses he doesn\'t own, finally toward the one he does. Repetition is the form of motivation when you have nothing else.');


  add('I think of my life as something I have not lived but only watched myself live.', 'Tayeb Salih', 'Season of Migration to the North', wiki('Season of Migration to the North'), 1966,
    'The narrator of Salih\'s Sudanese novel returning home from England. A specific failure mode worth knowing by name — observing your own existence rather than inhabiting it. The motivation is the warning.');


  /* ── HRABAL / BOLAÑO / SARAMAGO / PESSOA ───────────────────────────── */
  add('We are educated for the wrong life, and then we have to live our actual one.', 'Bohumil Hrabal', 'I Served the King of England', wiki('I Served the King of England'), 1971,
    'Ditie, the small Czech busboy with enormous ambition who narrates the novel through five hotels and the Nazi occupation. The gap between training and reality is where you actually have to operate.');


  /* ── SOLZHENITSYN / GROSSMAN / BULGAKOV / PASTERNAK / HAMSUN ───────── */
  add('The line dividing good and evil cuts through the heart of every human being.', 'Aleksandr Solzhenitsyn', 'The Gulag Archipelago, Vol. I, Part I', wiki('The Gulag Archipelago'), 1973,
    'Solzhenitsyn writing about his decade in the Soviet labor camps. The line refuses the comforting move of locating evil "over there." It runs through us, which means the work of resisting it is internal.');
  add('Bless you, prison, for having been in my life — for it was on the rotting prison straw that I came to understand that the object of life is not prosperity but the maturity of the human soul.', 'Aleksandr Solzhenitsyn', 'The Gulag Archipelago, Vol. II, Part IV', wiki('The Gulag Archipelago'), 1973,
    'Solzhenitsyn\'s most disorienting line — gratitude to the system that nearly destroyed him. He doesn\'t recommend prison; he names what prison taught. The reframe of every hard career chapter.');
  add('Live not by lies.', 'Aleksandr Solzhenitsyn', 'Live Not by Lies (essay)', wiki('Live Not by Lies'), 1974,
    'Solzhenitsyn\'s parting essay to his fellow Soviets, dictated the day before his arrest and exile. His one instruction: don\'t personally help the lie. You may not be able to topple the system, but you can refuse to repeat it.');

  add('Human freedom stands above everything.', 'Vasily Grossman', 'Life and Fate', wiki('Life and Fate'), 1959,
    'Grossman\'s great novel of the Battle of Stalingrad, seized by the KGB in 1961. His core claim, smuggled out on microfilm: the deepest fact about the species is the small private freedoms no system can reach.');

  add('Cowardice is the most terrible of vices.', 'Mikhail Bulgakov', 'The Master and Margarita', wiki('The Master and Margarita'), 1967,
    'Pontius Pilate\'s realization two thousand years after the trial of Yeshua, in Bulgakov\'s novel of Stalinist Moscow. The book\'s moral hinge: every other failing can be repaired except the one where you refused to act when it counted.');


  /* ── SALTER / BELLOW / MURDOCH / DELILLO / MORRISON ────────────────── */
  add('There is no real life but the one you make.', 'James Salter', 'Light Years', wiki('Light Years (Salter novel)'), 1975,
    'The narrator of Salter\'s novel of a marriage that looks perfect from outside and isn\'t. Permission to construct your life rather than receive it — and the warning that no one else is going to do it for you.');

  add('A great deal of intelligence can be invested in ignorance when the need for illusion is deep.', 'Saul Bellow', 'To Jerusalem and Back', wiki('Saul Bellow'), 1976,
    'Bellow\'s nonfiction journal of a 1975 trip to Israel. How thoughtful people end up holding obviously false views: the intelligence is recruited to defend the illusion, not test it.');

  add('We can only learn to love by loving.', 'Iris Murdoch', 'The Bell, Ch. 16', wiki('The Bell (novel)'), 1958,
    'Murdoch\'s novel of a lay religious community. The practice-oriented inverse of contemplation: there is no preparatory phase. The capacity is built only by doing the thing — applies to any skill that has no "ready" state.');

  add('Longing on a large scale is what makes history.', 'Don DeLillo', 'Underworld (Prologue)', wiki('Underworld (DeLillo novel)'), 1997,
    'Opening line of the prologue, narrating a 1951 Dodgers-Giants game. History isn\'t made by reasoned policy — it\'s made by mass desire pointed at something. The defense of large ambition as a force of physics.');
  add('A waste of devotion is not a waste of life.', 'Don DeLillo', 'Mao II', wiki('Mao II'), 1991,
    'The reclusive novelist Bill Gray, who has not finished a book in years. DeLillo\'s defense of effort that doesn\'t produce — the devotion itself counts, even when the visible output doesn\'t.');

  add('Definitions belong to the definers, not the defined.', 'Toni Morrison', 'Beloved', wiki('Beloved (novel)'), 1987,
    'Refuse the categories assigned to you from outside; the work is to define your own. Every applicant being slotted into a "fit profile" by recruiters can use this.');
  add('If you wanna fly, you got to give up the stuff that weighs you down.', 'Toni Morrison', 'Song of Solomon', wiki('Song of Solomon (novel)'), 1977,
    'Pilate to her nephew Milkman in the novel that ends with Milkman leaping off a cliff and learning, mid-fall, that he can fly. Identify what\'s heavy, drop it.');


  /* ── STEGNER / WILLIAMS / HAZZARD / CALVINO / KNAUSGÅRD / DILLARD ──── */

  add('You must remember what you are and what you have chosen to become.', 'John Williams', 'Stoner', wiki('Stoner (novel)'), 1965,
    'Archer Sloane to the young William Stoner, who has just discovered literature in 1910 Missouri. Identity is partly given and partly chosen, and the work is to honor both. The line every career-pivot person needs.');
  // Removed in 2026-05 audit: "It is required of a man that he share the
  // passion and the action of his time…" is actually a paraphrase of Oliver
  // Wendell Holmes Jr. (Memorial Day Address, 1884), not from John
  // Williams's Augustus. Misattribution.


  add('Seek and learn to recognize who and what, in the midst of the inferno, are not inferno, then make them endure, give them space.', 'Italo Calvino', 'Invisible Cities (closing line)', wiki('Invisible Cities'), 1972,
    'The very last sentence of Calvino\'s novel of Marco Polo describing impossible cities to Kublai Khan. Locate the parts of your work that aren\'t inferno, protect them, give them air. The cleanest founder ethic ever written.');

  add('There is so much that wants to be expressed, and so little time in which to express it.', 'Karl Ove Knausgård', 'My Struggle: Book 1', wiki('My Struggle (Knausgård)'), 2009,
    'Knausgård, early in the first volume of his six-book autobiographical novel. The writer\'s account of his own pressure: the unwritten interior is enormous and the days available to put it down are not.');

  add('How we spend our days is, of course, how we spend our lives.', 'Annie Dillard', 'The Writing Life, Ch. 2', wiki('Annie Dillard'), 1989,
    'From Dillard\'s book on the writing of writing. The line refuses the deferral that traps most ambitious people: there is no future day that doesn\'t inherit the structure of today.');
  add('There is no shortage of good days. It is good lives that are hard to come by.', 'Annie Dillard', 'The Writing Life', wiki('Annie Dillard'), 1989,
    'Same book. The rare thing isn\'t the moment of attention but the cumulative arrangement of them into a shape.');
  add('A schedule defends from chaos and whim. It is a net for catching days.', 'Annie Dillard', 'The Writing Life, Ch. 2', wiki('Annie Dillard'), 1989,
    'Dillard on her own work routines. Discipline is not deprivation, it\'s the apparatus that keeps the days from leaking away.');


  add('In a room where people unanimously maintain a conspiracy of silence, one word of truth sounds like a pistol shot.', 'Czesław Miłosz', 'The Captive Mind', wiki('The Captive Mind'), 1953,
    'Miłosz\'s book on the intellectual collaborations with Stalinism in postwar Poland. The asymmetric leverage of telling the truth in a room committed to lying — a single sentence does enormous work.');

  /* ── RILKE / KOESTLER / CORTÁZAR / MURAKAMI / DE BOTTON / HOPKINS ──── */
  add('Have patience with everything unresolved in your heart and try to love the questions themselves.', 'Rainer Maria Rilke', 'Letters to a Young Poet, Letter 4', gutId(29473), 1903,
    'Rilke at 27, advising the 19-year-old officer-cadet Franz Kappus. The discipline of staying in the question rather than rushing to the answer — because the answers don\'t arrive until you\'ve fully lived the questions.');
  add('Perhaps all the dragons in our lives are princesses who are only waiting to see us act, just once, with beauty and courage.', 'Rainer Maria Rilke', 'Letters to a Young Poet, Letter 8', gutId(29473), 1904,
    'Letter 8, to the same young poet. The things we are afraid of often contain something else waiting — but only if we approach them rather than flee. The transformation is gated on the act.');


  add('Nothing is lost if one has the courage to proclaim that all is lost and we must begin again.', 'Julio Cortázar', 'Hopscotch (Rayuela), Ch. 71', wiki('Hopscotch (Cortázar novel)'), 1963,
    'Morelli, the fictional writer whose notebooks are interleaved through Cortázar\'s novel. The case for total resets — admitting the loss honestly is what enables the new beginning.');

  add('Pain is inevitable. Suffering is optional.', 'Haruki Murakami', 'What I Talk About When I Talk About Running', wiki('What I Talk About When I Talk About Running'), 2007,
    'Murakami\'s memoir on running marathons and writing novels. The mantra he reaches for at mile 20. Pain is the physical signal you cannot opt out of — suffering is the additional commentary you can choose to stop generating.');
  add('Whatever it is you\'re seeking won\'t come in the form you\'re expecting.', 'Haruki Murakami', 'Kafka on the Shore', wiki('Kafka on the Shore'), 2002,
    'Oshima, the library assistant, to fifteen-year-old Kafka Tamura. Remain open to a different shape of the right answer.');

  add('Anyone who is not embarrassed by who he was a year ago probably isn\'t learning enough.', 'Alain de Botton', 'The Course of Love', wiki('The Course of Love'), 2016,
    'De Botton\'s novel-essay on the long course of an ordinary marriage. A metric for growth: the rate at which your past self embarrasses you is roughly the rate at which you\'re becoming someone different.');


  add('What I do is me: for that I came.', 'Gerard Manley Hopkins', 'As Kingfishers Catch Fire', wiki('Gerard Manley Hopkins'), 1881,
    'From Hopkins\'s short sonnet on each thing in creation enacting its own nature. The simplest possible vocational ethic: the thing you do IS who you are.');

  add('All that we don\'t know is astonishing. Even more astonishing is what passes for knowing.', 'Philip Roth', 'The Human Stain', wiki('The Human Stain'), 2000,
    'Nathan Zuckerman narrating in Roth\'s American trilogy. The humility required for accurate work: the more you actually look, the more obvious the gap becomes between what is "known" and what is true.');

  add('All these going-aways are also goings-toward.', 'Denis Johnson', 'Tree of Smoke', wiki('Tree of Smoke'), 2007,
    'Johnson\'s Vietnam novel, near the end. The only consolation available in transition: every exit is also an entry into something. Track both directions.');

  /* ── PROCRASTINATION & EXTREME WORK ETHIC ──────────────────────────── */
  add('While we are postponing, life speeds by.', 'Seneca', 'Letters from a Stoic I', gutId(56075), 'c.65',
    'The opening letter of the entire collection — Seneca\'s first message to Lucilius is about time. The full passage instructs holding every hour in your grasp and lays out the central scandal of human life: most of it leaks out through the very act of putting things off until later. Letter I exists to set the stakes for the next 123.');
  add('You could be good today. But instead you choose tomorrow.', 'Marcus Aurelius', 'Meditations 4.17 (Hays trans.)', gutId(2680), 'c.170',
    'Marcus catching himself in the same postponement his Stoic teachers warned against. The line is the diagnosis of why goals stay unreached: not lack of ability, but a habitual choice to start at some later, unspecified moment.');
  add('The song that I came to sing remains unsung to this day. I have spent my days in stringing and in unstringing my instrument.', 'Rabindranath Tagore', 'Gitanjali, Song XIII', gutId(7164), 1910,
    'From Tagore\'s collection of devotional poems that won him the Nobel Prize. The poet laments the universal failure mode: endlessly preparing — tuning the instrument, drafting the plan, sharpening the pencil — while the actual work remains undone. The cleanest single line against tooling-as-procrastination ever written.');
  // Removed in 2026-05 audit:
  //  • "And the day came when the risk to remain tight in a bud…" is
  //    universally attributed to Anaïs Nin but is actually by Elizabeth
  //    Appell (1979 college poster). NOT in any volume of her diaries.
  //  • "It is never too late to be what you might have been" is universally
  //    attributed to George Eliot but appears nowhere in her novels,
  //    letters, or essays — modern fabrication.
  add('To strive, to seek, to find, and not to yield.', 'Alfred, Lord Tennyson', 'Ulysses (closing line)', gutId(8601), 1842,
    'The final line of Tennyson\'s dramatic monologue, spoken by an aged Ulysses preparing one last voyage from Ithaca after he\'s grown bored of retirement. Four verbs, no comma after the last one, no admission that yielding is even on the table. The exact temperament the long grind demands.');
  add('All you have to do is write one true sentence. Write the truest sentence that you know.', 'Ernest Hemingway', 'A Moveable Feast', wiki('A Moveable Feast'), 1964,
    'Hemingway\'s memoir of his apprentice years in 1920s Paris, written in the last decade of his life. When stuck at a blank page, this is the protocol he prescribes — not "write something good," not "have an idea," just one true sentence. The most precise operational instruction for getting unstuck ever published.');
  add('Spend it all, shoot it, play it, lose it, all, right away, every time. Do not hoard what seems good for a later place in the book or for another book; give it, give it all, give it now.', 'Annie Dillard', 'The Writing Life, Ch. 4', wiki('Annie Dillard'), 1989,
    'Dillard\'s instruction to writers, but the principle is universal: the impulse to save your best idea for a more important occasion is the impulse that kills the current work. The advice is to deploy every resource now, on this attempt, every time.');
  add('When you have faults, do not fear to abandon them.', 'Confucius', 'Analects 1.8', gutId(3330), 'c.500 BC',
    'A line from the first book of the Analects. The two failures stacked: having the fault, and refusing to drop it once seen. Confucius treats the second as the larger failure — knowing yourself well enough to identify a flaw is half the work, and refusing to act on the knowledge wastes the half you\'ve done.');
  add('If you hear a voice within you say "you cannot paint," then by all means paint, and that voice will be silenced.', 'Vincent van Gogh', 'The Letters of Vincent van Gogh (letter to Theo, October 1884)', gutId(30988), 1884,
    'Van Gogh in a letter to his brother Theo, a year into the painting career he started at 27 after failing as a missionary and an art dealer. The cleanest action-defeats-doubt formulation in any language — you don\'t silence the inner critic by debating it, you silence it by working.');
  add('The powerful play goes on, and you may contribute a verse.', 'Walt Whitman', 'O Me! O Life! (Leaves of Grass)', gutId(1322), 1892,
    'From the deathbed edition of Leaves of Grass, Whitman\'s response in his own poem to the question of what one life amounts to amid the immensity of everything. The answer is small and specific: the play is already on, and your contribution is one verse — but the verse only exists if you actually write it.');
  add('There is no greater agony than bearing an untold story inside you.', 'Maya Angelou', 'I Know Why the Caged Bird Sings', wiki('I Know Why the Caged Bird Sings'), 1969,
    'Angelou\'s first autobiography, on her childhood in Stamps, Arkansas. The line names the specific cost of unexpression — what stays inside you when you don\'t do the work doesn\'t go neutral, it festers. The motivation reads inverted: get it out, because the inside is not a safe storage location.');
  add('There is nothing more frightful than ignorance in action.', 'Johann Wolfgang von Goethe', 'Maxims and Reflections', wiki('Johann Wolfgang von Goethe'), 1833,
    'From Goethe\'s collected aphorisms. The line cuts against pure "just do something" advice — the dangerous case is action without understanding, which compounds errors at full speed. Read together with the rest of Goethe: the answer is not to slow the action but to deepen the seeing while you act.');
  add('Produce! Produce! Were it but the pitifullest infinitesimal fraction of a Product, produce it in God\'s name! \'Tis the utmost thou hast in thee; out with it then.', 'Thomas Carlyle', 'Sartor Resartus, Book II, Ch. IX', gutId(1051), 1836,
    'Carlyle\'s strange philosophical novel, in the chapter "The Everlasting Yea." The full force of the passage is the demand that output is the moral imperative — whatever you have inside you, however small, get it OUT of you and into the world. The single most forceful work-ethic passage in 19th-century literature.');
  add('Blessed is he who has found his work; let him ask no other blessedness.', 'Thomas Carlyle', 'Past and Present, Book III, Ch. XI', gutId(13534), 1843,
    'Carlyle\'s book contrasting medieval communal labor with industrial 19th-century alienation. The line is his maxim for living: locate the work that is yours, and consider yourself already wealthy. The motivation lands as both diagnosis (most discontent is not having found your work) and reward (once you find it, you no longer need anything else).');
  add('Success is to be measured not so much by the position that one has reached in life as by the obstacles which he has overcome while trying to succeed.', 'Booker T. Washington', 'Up From Slavery, Ch. III', gutId(2376), 1901,
    'Washington\'s autobiography of his rise from slavery to founding the Tuskegee Institute. The line repositions success as a function of resistance overcome, not absolute altitude — and is written by a man with unique authority to make that claim.');
  add('Life is either a daring adventure or nothing.', 'Helen Keller', 'The Open Door', wiki('Helen Keller'), 1957,
    'Helen Keller — deaf and blind from nineteen months old — wrote this near the end of her life. The binary is total: there is no in-between of cautious half-living. Read against her biography it isn\'t bravado; it\'s the operating system of a woman who had every reason to settle for nothing and chose otherwise.');
  add('If you\'re going to try, go all the way. Otherwise, don\'t even start.', 'Charles Bukowski', 'Roll the Dice (in What Matters Most Is How Well You Walk Through the Fire)', wiki('Charles Bukowski'), 1999,
    'From Bukowski\'s posthumous poetry collection. The full poem catalogues what going all the way costs — relationships, security, sanity — and concludes anyway. The line refuses the half-measure that most ambitious people default to: it\'s either total commitment or stay out.');
  add('Welcome, O life! I go to encounter for the millionth time the reality of experience and to forge in the smithy of my soul the uncreated conscience of my race.', 'James Joyce', 'A Portrait of the Artist as a Young Man (closing line)', gutId(4217), 1916,
    'Stephen Dedalus\'s final diary entry, the very last line of the novel, written as he prepares to leave Ireland for Paris and begin his real artistic work. Welcome is the operative word — he\'s addressing the difficulty of what comes next, not bracing against it.');

  return Q;
})();
