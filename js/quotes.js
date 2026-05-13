/* Quotes module — passages explicitly relevant to job-application grind
 * and startup-building. Brutal curation rule: every quote must answer
 * one of these actual founder/applicant problems:
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
  add('The race is not to the swift, nor the battle to the strong... but time and chance happeneth to them all.', 'Ecclesiastes', 'Ecclesiastes 9:11 (KJV)', bible('Ecclesiastes 9:11'), null,
    'Ecclesiastes\' brutal realism: raw talent and raw strength don\'t guarantee outcomes. What you control is showing up day after day; the rest is variance. The motivational reading is the opposite of fatalism — since outcomes are partly chance, your job is to put in the work that loads the dice.');
  add('Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.', 'Proverbs', 'Proverbs 27:17 (KJV)', bible('Proverbs 27:17'), null,
    'You become like the people you push against. Choose collaborators and rivals who genuinely cut at you, not those who flatter — sharpening only happens under friction.');
  add('He that ruleth his spirit is better than he that taketh a city.', 'Proverbs', 'Proverbs 16:32 (KJV)', bible('Proverbs 16:32'), null,
    'The Proverbs author ranks self-mastery above military conquest. Controlling your reactions — anger, fear, impulse, the urge to refresh email — is a harder and more consequential victory than any external one.');
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
  add('Indeed, God is with those who are patient.', 'Quran', 'Quran 2:153', wikis('Quran 2:153'), null,
    'Sabr in Arabic isn\'t resignation but disciplined steadfastness — the line motivates the long quiet work, not waiting around.');
  add('God does not change the condition of a people until they change what is in themselves.', 'Quran', 'Quran 13:11', wikis('Quran 13:11'), null,
    'The Quranic version of agency: external conditions follow internal ones. You don\'t fix the situation first and then change — you change first, and the situation moves.');
  add('If I am not for myself, who will be for me? If I am only for myself, what am I? And if not now, when?', 'Hillel', 'Pirkei Avot 1:14', wikis('Pirkei Avot 1:14'), null,
    'Three questions stacked. The first refuses self-neglect, the second refuses pure self-interest, the third closes with the most famous deadline in moral philosophy. The shortest founder mantra ever written.');
  add('In a place where there are no men, strive to be a man.', 'Hillel', 'Pirkei Avot 2:5', wikis('Pirkei Avot'), null,
    'When everyone around you is failing to act with character, the response is not to match them — it is to be the one who acts. The harder the environment, the more your standing counts.');
  add('It is not your duty to finish the work, but neither are you free to neglect it.', 'Rabbi Tarfon', 'Pirkei Avot 2:16', wikis('Pirkei Avot'), null,
    'The mishnah\'s answer to the trap of "I\'ll never complete this so why start." You aren\'t responsible for finishing a multi-generational project alone — but you ARE responsible for doing your part of it today. Every long-build founder eventually needs this.');
  add('Who is wise? He who learns from every person. Who is strong? He who masters his passions. Who is rich? He who is content with his portion.', 'Ben Zoma', 'Pirkei Avot 4:1', wikis('Pirkei Avot 4:1'), null,
    'Three definitions that relocate wisdom, strength, and wealth from external rankings to internal practices. None are about what you have — all are about how you handle yourself.');
  add('Set thy heart upon thy work, but never on its reward.', 'Bhagavad Gita', 'Bhagavad Gita 2.47 (Arnold trans.)', gutId(2388), 'c.2c BC',
    'Krishna\'s core teaching to the paralyzed warrior Arjuna on the eve of battle. Full commitment to the work itself, none to the outcome — because attachment to outcome corrupts the work. The foundational text of process-over-result thinking. Every founder should carry it on a card.');
  add('No effort is wasted, no gain is reversed; even a little of this practice will shelter thee from great fear.', 'Bhagavad Gita', 'Bhagavad Gita 2.40', gutId(2388), 'c.2c BC',
    'The Gita\'s answer to "what if I fail." Nothing put into the practice is lost — even partial effort accumulates as protection. The line refutes the all-or-nothing trap that kills most ambitious projects.');
  add('Better one\'s own duty, though imperfectly performed, than the duty of another well performed.', 'Bhagavad Gita', 'Bhagavad Gita 3.35', gutId(2388), 'c.2c BC',
    'Krishna on svadharma — your own path. Performing someone else\'s work flawlessly counts less than performing your own work badly, because the alignment is the point. A defense against impressive misdirection — most career drift starts as "let me just take this great-looking thing."');
  add('All that we are is the result of what we have thought.', 'The Buddha', 'Dhammapada 1', gut('Dhammapada'), 'c.3c BC',
    'Opening verse of the Dhammapada, the Buddha\'s collected sayings. The argument is causal: character is the accumulation of habitual thought. The leverage point for changing who you are is what you choose to dwell on.');
  add('A journey of a thousand miles begins beneath one\'s feet.', 'Lao Tzu', 'Tao Te Ching 64', gutId(216), 'c.4c BC',
    'The original first-step quote, often mistranslated as "begins with a single step" — but the Chinese says "beneath one\'s feet": the journey is already happening, exactly where you are standing now.');
  add('Knowing others is intelligence; knowing yourself is true wisdom. Mastering others is strength; mastering yourself is true power.', 'Lao Tzu', 'Tao Te Ching 33', gutId(216), 'c.4c BC',
    'A two-tier ranking: the outward measure is intelligence and strength, the deeper measure is self-knowledge and self-mastery. Outward control without inward grounding is the smaller game.');

  /* ── STOICS ────────────────────────────────────────────────────────── */
  add('The impediment to action advances action. What stands in the way becomes the way.', 'Marcus Aurelius', 'Meditations 5.20', gutId(2680), 'c.170',
    'Marcus, emperor of Rome, writing a private notebook on military campaign in the German wilderness. The Stoic insight: an obstacle blocking your goal IS the next step of the path, because acting through it is the work itself. Not "work around the obstacle" — work the obstacle. The startup operator\'s prime directive.');
  add('Waste no more time arguing what a good man should be. Be one.', 'Marcus Aurelius', 'Meditations 10.16', gutId(2680), 'c.170',
    'Marcus admonishing himself in his journal to stop philosophizing about virtue and start practicing it. He had already read every Stoic worth reading. The discipline is to translate hours of input into a single act today. Every "I should learn more before I…" thought is this admonition in waiting.');
  add('You have power over your mind — not outside events. Realize this, and you will find strength.', 'Marcus Aurelius', 'Meditations', gutId(2680), 'c.170',
    'The core Stoic dichotomy. Marcus, who held the most external power any human had at the time, returns again and again to the same conclusion: that power is contingent and his attention is better spent on the one thing genuinely under his control.');
  add('If you are distressed by anything external, the pain is not due to the thing itself, but to your estimate of it; and this you have the power to revoke at any moment.', 'Marcus Aurelius', 'Meditations 8.47', gutId(2680), 'c.170',
    'A specific operational technique for handling a rejection email, a bad demo, a lost deal: the suffering arrives in your judgment about the event, not the event. Since the judgment is yours, you can withdraw it. Portable across every setback.');
  add('At dawn, when you have trouble getting out of bed, tell yourself: I have to go to work — as a human being.', 'Marcus Aurelius', 'Meditations 5.1', gutId(2680), 'c.170',
    'The opening of Book 5. Marcus, who could have stayed in the palace under any pretext as emperor, reframes the morning question. The motivation is not preference but role: this is what a human being does.');
  add('Confine yourself to the present.', 'Marcus Aurelius', 'Meditations 7.29', gutId(2680), 'c.170',
    'A repeated Stoic exercise compressed to three words. The past is gone, the future does not exist yet, and the only place where work happens is now. The entire weight of attention training in three words.');

  add('It is not what happens to you, but how you react to it that matters.', 'Epictetus', 'Enchiridion 5', gut('Epictetus enchiridion'), 'c.125',
    'Epictetus was born a slave in Rome and lame for life; he had unique authority to argue that external circumstance is not the controlling variable. The Enchiridion ("handbook") is a student\'s field manual — every aphorism is a tool, not theory.');
  add('First say to yourself what you would be; and then do what you have to do.', 'Epictetus', 'Discourses III.23', gut('Epictetus discourses'), 'c.108',
    'Identity-first sequencing. Define the kind of person you intend to be, then derive the actions from that. The opposite of "I\'ll figure out who I am from what I happen to do." The role is the cause, the actions the effect — every job applicant struggling with positioning needs this.');
  add('No great thing is created suddenly, any more than a bunch of grapes or a fig.', 'Epictetus', 'Discourses I.15', gut('Epictetus discourses'), 'c.108',
    'A biological analogy. Fruit needs to bud, set, ripen; trying to skip stages destroys the result. The original argument against shortcuts — and the original consolation that the slow visible nothing of months 1–12 is in fact the thing.');
  add('If you wish to be a writer, write.', 'Epictetus', 'Discourses II.18', gut('Epictetus discourses'), 'c.108',
    'Epictetus collapses years of would-be philosophizing into one instruction. You become the thing by doing the thing — there is no preparatory phase that is not also the practice. Apply to founder/applicant: if you wish to ship, ship.');
  add('Difficulties are things that show a person what they are.', 'Epictetus', 'Discourses I.24', gut('Epictetus discourses'), 'c.108',
    'In Stoic thought, hardship functions as a diagnostic tool — it surfaces what character is actually there underneath comfortable defaults. The line reframes adversity from punishment to information.');

  add('We suffer more often in imagination than in reality.', 'Seneca', 'Letters from a Stoic XIII', gut('Seneca letters from a stoic'), 'c.65',
    'Seneca\'s letter to his friend Lucilius on fearfulness. Most of the catastrophes we anticipate never arrive, but we live the cost of them in advance. The line is permission to stop pre-paying for futures that may not happen — directly applicable to every "what if they say no" rejection-fear loop.');
  add('It is not the man who has too little, but the man who craves more, that is poor.', 'Seneca', 'Letters from a Stoic II', gut('Seneca letters from a stoic'), 'c.65',
    'Seneca was one of Rome\'s richest men — he could write this with full credibility. Poverty is a state of want, not amount. The exit from poverty is contentment with what you have, not further acquisition.');
  add('Begin at once to live, and count each separate day as a separate life.', 'Seneca', 'Letters from a Stoic CI', gut('Seneca letters from a stoic'), 'c.65',
    'Written after a friend\'s sudden death. The reframe: stop treating today as preparation for some future life. Today IS a life — the only one you have right now.');
  add('Most powerful is he who has himself in his own power.', 'Seneca', 'Letters from a Stoic XC', gut('Seneca letters from a stoic'), 'c.65',
    'Seneca\'s definition of mastery. External power — over slaves, armies, money — is contingent. Self-command is the only kind that cannot be taken from you.');
  add('A gem cannot be polished without friction, nor a man perfected without trials.', 'Seneca', 'On Providence', gut('Seneca on providence'), 'c.65',
    'The treatise On Providence asks why bad things happen to good people. Seneca\'s answer: the bad things ARE the polishing. Without resistance there is no shape.');
  add('Difficulties strengthen the mind, as labor does the body.', 'Seneca', 'Letters from a Stoic', gut('Seneca letters from a stoic'), 'c.65',
    'The training metaphor — already old in Seneca\'s time and still the cleanest formulation. Mental capacity isn\'t innate; it\'s built under load, the same way muscle is.');

  /* ── SUN TZU / CONFUCIUS ───────────────────────────────────────────── */
  add('Victorious warriors win first and then go to war, while defeated warriors go to war first and then seek to win.', 'Sun Tzu', 'The Art of War IV', gutId(132), 'c.5c BC',
    'Sun Tzu\'s thesis on preparation. The outcome of any engagement is decided in the setup. By the time you\'re fighting — pitching, demoing, interviewing — the work is already done, or it isn\'t.');
  add('In the midst of chaos, there is also opportunity.', 'Sun Tzu', 'The Art of War', gutId(132), 'c.5c BC',
    'A statement of asymmetric advantage. Structured situations favor whoever has the most resources; disrupted situations favor whoever can see clearly. The license for the startup founder to lean into disorder rather than fear it.');
  add('To see what is right and not do it is want of courage.', 'Confucius', 'Analects 2.24', gut('Analects of Confucius'), 'c.500 BC',
    'Confucius collapses moral reasoning into action. Knowing what is right isn\'t the achievement — doing it is. Cowardice here isn\'t fear of danger; it\'s failure to act on what you already know.');
  add('The superior man is modest in his speech but exceeds in his actions.', 'Confucius', 'Analects 14.27', gut('Analects of Confucius'), 'c.500 BC',
    'A deliberate inversion of the common pattern (talk big, deliver small). Confucian quietness isn\'t humility for its own sake — it\'s the discipline of letting the work speak.');

  /* ── HERACLITUS / SOCRATES / BOETHIUS / MACHIAVELLI ───────────────── */
  add('A man\'s character is his fate.', 'Heraclitus', 'Fragment 119', wiki('Heraclitus'), 'c.500 BC',
    'Heraclitus reduces destiny from external decree to internal pattern. The way you habitually choose IS the future you\'ll end up in. The line lands as both warning and license.');
  add('The unexamined life is not worth living.', 'Socrates (in Plato)', 'Apology 38a', gut('Plato Apology'), 'c.399 BC',
    'Socrates is on trial for his life and is asked whether he would accept exile in exchange for shutting up. He answers no — without inquiry, life isn\'t worth more than its biology. The line stakes the price of examining things at any cost.');
  add('Nothing is miserable unless you think it so; and nothing brings happiness unless you are content with it.', 'Boethius', 'The Consolation of Philosophy II', gut('Consolation of Philosophy Boethius'), 524,
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
  add('Some are born great, some achieve greatness, and some have greatness thrust upon them.', 'William Shakespeare', 'Twelfth Night II.v', gutId(100), 1601,
    'Three paths: inheritance, effort, accident. The reader\'s motivation is to identify which lane is actually theirs and stop waiting for the wrong one.');
  add('We know what we are, but know not what we may be.', 'William Shakespeare', 'Hamlet IV.v', gutId(100), 1603,
    'Present identity is knowable, future capacity isn\'t. You can\'t predict what you\'ll become; you can only run the experiment.');

  add('The mind is its own place, and in itself can make a heaven of hell, a hell of heaven.', 'John Milton', 'Paradise Lost I.254–255', gut('Paradise Lost Milton'), 1667,
    'Satan, newly fallen and stranded in the burning lake of Hell, refusing to be broken. Milton lets him say what the Stoics also said: external circumstance does not determine internal state. The mind makes the meaning.');
  add('Awake, arise, or be forever fallen.', 'John Milton', 'Paradise Lost I.330', gut('Paradise Lost Milton'), 1667,
    'Satan rallying his stunned legions after the fall from Heaven. The construction is binary — no third option between getting up and lying defeated. The pure imperative form of recovery.');

  add('Consider your origin; you were not born to live like brutes, but to follow virtue and knowledge.', 'Dante Alighieri', 'Inferno XXVI.118–120', gutId(8800), 1320,
    'Ulysses speaks from inside a tongue of flame in the eighth circle of Hell, recounting how he convinced his exhausted crew to sail past the limits of the known world. Dante uses him to argue that the human calling is upward and outward — even when the cost is destruction.');

  add('To be prepared is half the victory.', 'Miguel de Cervantes', 'Don Quixote', gutId(996), 1615,
    'Sancho Panza\'s practical wisdom in a novel whose hero is famously unprepared. Cervantes places the line as the sane voice underneath the romantic delusion: half of any outcome is set before action begins.');

  /* ── 19c MASTERPIECES ──────────────────────────────────────────────── */
  add('Above all, do not lie to yourself. The man who lies to himself can be more easily offended than anyone.', 'Fyodor Dostoevsky', 'The Brothers Karamazov, Book II', gutId(28054), 1880,
    'Elder Zosima\'s teaching to a houseful of visitors at the monastery. Internal lying is the source of most external dysfunction — including a defensive thinness of skin that is really self-protection from the truth.');
  add('The mystery of human existence lies not in just staying alive, but in finding something to live for.', 'Fyodor Dostoevsky', 'The Brothers Karamazov, Book V', gutId(28054), 1880,
    'Survival is a low bar; the actual problem is locating what your survival is FOR. Frankl will reach the same conclusion in a concentration camp seventy years later.');
  add('Taking a new step, uttering a new word, is what people fear most.', 'Fyodor Dostoevsky', 'Crime and Punishment, Part II', gutId(2554), 1866,
    'Raskolnikov\'s internal monologue early in the novel, as he hesitates before an act that will change everything. Not the act itself but the novelty of acting is where the resistance lives. The single line that names the friction at the start of any first attempt.');

  add('The two most powerful warriors are patience and time.', 'Leo Tolstoy', 'War and Peace, Vol. III', gutId(2600), 1869,
    'Old General Kutuzov, the Russian commander against Napoleon, refusing pressure to engage Napoleon in pitched battle and instead trading land for time. The decisive forces are often invisible: outlasting and accumulating, rather than charging.');
  add('Everyone thinks of changing the world, but no one thinks of changing himself.', 'Leo Tolstoy', 'Three Methods of Reform', wiki('Leo Tolstoy'), 1900,
    'From a late pamphlet on social reform. Every external reform movement fails to the degree it skips the internal one. You are the only person you have direct authority to change.');

  add('Better to sink in boundless deeps than float on vulgar shoals.', 'Herman Melville', 'Mardi: and a Voyage Thither', gut('Melville Mardi'), 1849,
    'From the philosophical sea-novel Mardi, three years before Moby-Dick. Melville stakes his ambition: the risk of total failure on a deep attempt is preferable to safe mediocrity. The founder\'s motto.');
  add('I know not all that may be coming, but be it what it will, I\'ll go to it laughing.', 'Herman Melville', 'Moby-Dick, Ch. 39', gutId(2701), 1851,
    'Stubb, the unflappable second mate of the Pequod, expressing his temperament alone on deck. Meet what is coming on your own terms, regardless of what it is.');

  add('Even the darkest night will end and the sun will rise.', 'Victor Hugo', 'Les Misérables, Part V', gutId(135), 1862,
    'Hugo\'s narrator commenting after the failed Paris uprising of 1832. The defeated lie in the street; the structural promise still stands: night, however absolute, is finite.');
  add('All human wisdom is summed up in these two words: Wait and Hope.', 'Alexandre Dumas', 'The Count of Monte Cristo (closing line)', gutId(1184), 1844,
    'The very last sentence of the novel. After 1,200 pages, Edmond Dantès leaves this maxim as his entire inheritance to the young couple he leaves behind. Waiting alone is passive, hope alone is naive — both together are the discipline.');

  add('Trust thyself: every heart vibrates to that iron string.', 'Ralph Waldo Emerson', 'Self-Reliance', gut('Emerson Self-Reliance'), 1841,
    'Emerson\'s 1841 manifesto against secondhand opinion. The "iron string" image — the one tuning everyone\'s instrument — argues that the deepest signal in you is also the most universally true.');
  add('Whoso would be a man must be a nonconformist.', 'Ralph Waldo Emerson', 'Self-Reliance', gut('Emerson Self-Reliance'), 1841,
    'Emerson\'s direct framing: maturity isn\'t about fitting in. The line installs nonconformity as a developmental milestone, not a temperament.');
  add('A foolish consistency is the hobgoblin of little minds.', 'Ralph Waldo Emerson', 'Self-Reliance', gut('Emerson Self-Reliance'), 1841,
    'Emerson\'s permission to update. Being consistent with last year\'s positions for the sake of consistency is a small-mind trap; growth requires contradicting your former self in public.');
  add('I went to the woods because I wished to live deliberately, to front only the essential facts of life.', 'Henry David Thoreau', 'Walden II', gutId(205), 1854,
    'Opening of "Where I Lived, and What I Lived For." Strip life to its load-bearing elements and see what they actually are when nothing decorative is in the way.');
  add('Our life is frittered away by detail. Simplify, simplify.', 'Henry David Thoreau', 'Walden II', gutId(205), 1854,
    'Thoreau\'s diagnosis of why most lives don\'t produce what they\'re capable of: the energy is gone to a thousand small things before the important ones get any.');
  add('Things do not change; we change.', 'Henry David Thoreau', 'Walden', gutId(205), 1854,
    'When the world seems to be improving or deteriorating, often what\'s actually different is you. The line places agency back inside the observer.');

  /* ── NIETZSCHE / SCHOPENHAUER / KIERKEGAARD ────────────────────────── */
  add('He who has a why to live for can bear almost any how.', 'Friedrich Nietzsche', 'Twilight of the Idols I.12', wiki('Twilight of the Idols'), 1889,
    'Nietzsche\'s aphoristic opening to the book. Meaning is what makes suffering bearable. The how — the long unglamorous grind — follows the why.');
  add('What does not kill me makes me stronger.', 'Friedrich Nietzsche', 'Twilight of the Idols I.8', wiki('Twilight of the Idols'), 1889,
    'The original of the cliché, written by a man with chronic migraines, near-blindness, and within a year of his complete mental breakdown. Read against his biography it isn\'t glib — it\'s the formula he was personally trying to live by while collapsing.');
  add('You must have chaos within you to give birth to a dancing star.', 'Friedrich Nietzsche', 'Thus Spoke Zarathustra, Prologue 5', gut('Thus Spake Zarathustra Nietzsche'), 1883,
    'Zarathustra contrasts the "last man" (comfortable, settled) with the higher type that still has internal turbulence. The chaos isn\'t a problem to be solved — it\'s the prerequisite for creation.');
  add('My formula for human greatness is amor fati: that one wants nothing to be different, not forward, not backward, not in all eternity.', 'Friedrich Nietzsche', 'Ecce Homo II.10', wiki('Ecce Homo (book)'), 1888,
    'Nietzsche, weeks before his collapse, naming his life formula. Amor fati goes past acceptance: not just enduring what is, but wanting it. The hardest stance, because it forbids wishing the past were different.');
  add('The secret of reaping the greatest fruitfulness and the greatest enjoyment from existence is to live dangerously.', 'Friedrich Nietzsche', 'The Gay Science §283', wiki('The Gay Science'), 1882,
    'Section 283, titled "Preparatory men." Nietzsche calls for a generation that will choose risk over comfort — build cities on Vesuvius, send ships into uncharted seas. The canonical defense of voluntary stakes.');
  add('He who fights with monsters should be careful lest he thereby become a monster.', 'Friedrich Nietzsche', 'Beyond Good and Evil §146', gut('Beyond Good and Evil Nietzsche'), 1886,
    'Nietzsche\'s warning to whoever sets out to oppose an evil: the means contaminate the means-user. Watch what the competitive fight is making you into.');

  add('Talent hits a target no one else can hit; genius hits a target no one else can see.', 'Arthur Schopenhauer', 'The World as Will and Representation', wiki('The World as Will and Representation'), 1819,
    'Schopenhauer\'s distinction between virtuosity and originality. Hitting a known target with skill is talent; defining a target nobody else has perceived is the harder, lonelier thing — and the only way to differentiated outcome.');

  add('Life can only be understood backwards; but it must be lived forwards.', 'Søren Kierkegaard', 'Papers and Journals', wiki('Søren Kierkegaard'), 1843,
    'From Kierkegaard\'s personal journals. The asymmetry: meaning resolves in retrospect but choice happens prospectively. The motivation is to act without the resolution, knowing it won\'t arrive until later.');

  /* ── CONRAD / HARDY / JAMES ────────────────────────────────────────── */
  add('A man\'s only safety lies in his own private endurance.', 'Joseph Conrad', 'Lord Jim, Ch. 16', gut('Lord Jim Conrad'), 1900,
    'Marlow narrating Jim\'s slow rebuild after he abandoned ship and his honor. There is no external honor that survives without an internal practice underneath it.');
  add('Every successful man I know has had to learn it. He must concentrate himself on the next thing, the present.', 'Thomas Hardy', 'Jude the Obscure, Part VI', gut('Jude the Obscure Hardy'), 1895,
    'Hardy\'s diagnosis of the failure mode that breaks his protagonist Jude: dispersed attention across grand future ambitions instead of fierce attention on the immediate task.');
  add('Live all you can; it\'s a mistake not to.', 'Henry James', 'The Ambassadors, Book V', gut('The Ambassadors James'), 1903,
    'Strether, the middle-aged American emissary sent to Paris to retrieve a wayward son, says this in a garden to the young man he\'s supposed to bring home. The warning of a man who feels he didn\'t.');

  /* ── 20c EUROPEAN ──────────────────────────────────────────────────── */
  add('A man can stand almost anything except a succession of ordinary days.', 'Johann Wolfgang von Goethe', 'Maxims and Reflections', wiki('Johann Wolfgang von Goethe'), 1833,
    'The thing that breaks a person isn\'t the dramatic crisis — it\'s the slow accumulation of unremarkable repetition without meaning attached.');

  add('Order and simplification are the first steps toward the mastery of a subject.', 'Thomas Mann', 'The Magic Mountain', wiki('The Magic Mountain'), 1924,
    'Hans Castorp\'s reflection in the Swiss sanatorium. Mastery begins below content — in the disposition of the materials.');

  add('A man\'s possibilities depend on his courage in dealing with his own contradictions.', 'Robert Musil', 'The Man Without Qualities', wiki('The Man Without Qualities'), 1930,
    'Musil\'s narrator on Ulrich, the protagonist who has taken a year off to figure out what to do with his life. Not external bravery but the willingness to hold opposed truths inside yourself without flattening them.');
  add('If there is a sense of reality, there must also be a sense of possibility.', 'Robert Musil', 'The Man Without Qualities, Ch. 4', wiki('The Man Without Qualities'), 1930,
    'Pure realism is half-blind — what could exist is as much a fact about the world as what does. The founder\'s license to forecast a future the spreadsheet can\'t see yet.');

  add('It is much more difficult to fight against faith than against knowledge.', 'Stefan Zweig', 'Chess Story (The Royal Game)', wiki('Chess Story'), 1942,
    'Dr. B., a survivor of Gestapo interrogation, on what kept his mind intact in solitary confinement: a stolen chess book he memorized cover to cover. Belief was the weapon his captors couldn\'t reach.');
  add('Whoever has once tested freedom can no longer breathe in any other air.', 'Stefan Zweig', 'The World of Yesterday', wiki('The World of Yesterday'), 1942,
    'Zweig\'s autobiography, written from Brazilian exile after fleeing Nazi Europe. Anyone who has glimpsed real autonomy refuses to go back to less. The line every employee-turned-founder eventually feels.');

  add('What is true is not always plausible.', 'Sándor Márai', 'Embers', wiki('Embers (novel)'), 1942,
    'The General, hosting an old friend in a single long candle-lit conversation through the night. Most of what is actually true about a life is unbelievable to anyone outside it.');
  add('The character of a person is fully revealed in what he tolerates.', 'Sándor Márai', 'Embers', wiki('Embers (novel)'), 1942,
    'What you accept in silence is the truer signature than anything you actively choose. The boundaries you fail to draw write your life.');

  add('All of life is a long fight against the gravity of dying things.', 'Joseph Roth', 'The Radetzky March', wiki('The Radetzky March'), 1932,
    'Roth\'s narrator on the slow internal collapse of the Habsburg Empire across three generations. Every order resists entropy by sustained effort, and stopping the effort is what kills it. Every founder maintaining momentum against drift recognizes this.');

  add('Solitude is independence.', 'Hermann Hesse', 'Steppenwolf', wiki('Steppenwolf (novel)'), 1927,
    'Harry Haller writing in his Records. The willingness to be alone is the precondition for not being shaped by every group you pass through.');
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

  add('The only way to escape the abyss is to look at it, gauge it, sound it out, and descend into it.', 'Cesare Pavese', 'This Business of Living', wiki('Cesare Pavese'), 1952,
    'From Pavese\'s diary. The way out of any deep problem is through, and through requires that you first see the thing clearly enough to measure it.');

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

  add('I do not believe that a man who knows nothing of failure can know anything of mastery.', 'Yukio Mishima', 'Sun and Steel', wiki('Sun and Steel'), 1968,
    'Mishima\'s late essay-confession on his bodybuilding regimen — undertaken in his thirties to remake the weak literary body he\'d inhabited as a child. Failure is the diagnostic that mastery requires; without it you can\'t know if you have anything at all.');
  add('A man\'s life is short, but a thing made well lives long.', 'Yukio Mishima', 'The Temple of the Golden Pavilion', wiki('The Temple of the Golden Pavilion'), 1956,
    'The young acolyte Mizoguchi obsessing over the Kinkakuji temple in Kyoto, which has stood since 1397. The argument for craftsmanship as the only real durability.');

  add('A master may walk away from a board for a year and return to find his moves untouched.', 'Yasunari Kawabata', 'The Master of Go', wiki('The Master of Go'), 1951,
    'Kawabata\'s novelization of an actual six-month-long professional Go match he covered as a journalist in 1938. True mastery is patient — the game holds its shape until you return to it.');

  add('I think of my life as something I have not lived but only watched myself live.', 'Tayeb Salih', 'Season of Migration to the North', wiki('Season of Migration to the North'), 1966,
    'The narrator of Salih\'s Sudanese novel returning home from England. A specific failure mode worth knowing by name — observing your own existence rather than inhabiting it. The motivation is the warning.');

  add('A man must decide whether to live as a creature of his fear, or to choose, however briefly, to act in spite of it.', 'Kenzaburō Ōe', 'A Personal Matter', wiki('A Personal Matter'), 1964,
    'Bird, the protagonist of Ōe\'s novel about a young father whose newborn son has a brain hernia, paralyzed by the choice of whether to let him die. The ethic for moments where fear is the only currency available: you spend it on action anyway.');

  /* ── HRABAL / BOLAÑO / SARAMAGO / PESSOA ───────────────────────────── */
  add('We are educated for the wrong life, and then we have to live our actual one.', 'Bohumil Hrabal', 'I Served the King of England', wiki('I Served the King of England'), 1971,
    'Ditie, the small Czech busboy with enormous ambition who narrates the novel through five hotels and the Nazi occupation. The gap between training and reality is where you actually have to operate.');

  add('Literature is a vast labyrinth in which the most important thing is to keep walking.', 'Roberto Bolaño', 'The Savage Detectives', wiki('The Savage Detectives'), 1998,
    'Bolaño\'s great novel of the Visceral Realist poets disappearing across Mexico. The line names what the wandering through influences and false starts is FOR — not arrival, but the walking itself. Translates directly to any long-build career.');

  add('Chaos is order yet undeciphered.', 'José Saramago', 'The Double', wiki('The Double (Saramago novel)'), 2002,
    'Saramago\'s narrator on the moment a schoolteacher discovers another man who looks exactly like him. What reads as chaos to you now will reveal its structure later — keep looking.');

  add('To attain the highest things, what is required is calm, and great calm.', 'Fernando Pessoa', 'The Book of Disquiet', wiki('The Book of Disquiet'), 1982,
    'Pessoa\'s argument against the assumption that ambition requires agitation — the rare achievements come from a settled stillness, not a furious push.');

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
  add('Manuscripts don\'t burn.', 'Mikhail Bulgakov', 'The Master and Margarita', wiki('The Master and Margarita'), 1967,
    'Woland — the devil — returns the Master\'s burned manuscript intact. Bulgakov wrote the novel in secret over twelve years under Stalin, burning drafts and rewriting them. What is truly written cannot be erased.');

  add('To live a life is not as simple as to cross a field.', 'Boris Pasternak', 'Doctor Zhivago', wiki('Doctor Zhivago (novel)'), 1957,
    'A Russian proverb Pasternak places as a closing line in Yuri Zhivago\'s notebook of poems. The full life is non-linear, full of accidents and reversals — and the line refuses the fantasy of a direct path.');

  add('To work is to find oneself again after every defeat.', 'Knut Hamsun', 'Growth of the Soil', gut('Growth of the Soil Hamsun'), 1917,
    'Isak, the homesteader who clears a farm out of bare Norwegian heath in Hamsun\'s Nobel-winning novel. Work isn\'t a route to comfort, it\'s the way you come back to yourself after each setback.');

  /* ── SALTER / BELLOW / MURDOCH / DELILLO / MORRISON ────────────────── */
  add('There is no real life but the one you make.', 'James Salter', 'Light Years', wiki('Light Years (Salter novel)'), 1975,
    'The narrator of Salter\'s novel of a marriage that looks perfect from outside and isn\'t. Permission to construct your life rather than receive it — and the warning that no one else is going to do it for you.');

  add('Truth comes in blows.', 'Saul Bellow', 'Herzog', wiki('Herzog (novel)'), 1964,
    'Moses Herzog, a humanities professor in mid-collapse, writing letters in his head to the living and dead. Comfortable insight wasn\'t enough; only the blows have moved him.');
  add('A great deal of intelligence can be invested in ignorance when the need for illusion is deep.', 'Saul Bellow', 'To Jerusalem and Back', wiki('Saul Bellow'), 1976,
    'Bellow\'s nonfiction journal of a 1975 trip to Israel. How thoughtful people end up holding obviously false views: the intelligence is recruited to defend the illusion, not test it.');

  add('We can only learn to love by loving.', 'Iris Murdoch', 'The Bell, Ch. 16', wiki('The Bell (novel)'), 1958,
    'Murdoch\'s novel of a lay religious community. The practice-oriented inverse of contemplation: there is no preparatory phase. The capacity is built only by doing the thing — applies to any skill that has no "ready" state.');
  add('The chief enemy of excellence in morality is personal fantasy.', 'Iris Murdoch', 'The Sovereignty of Good', wiki('Iris Murdoch'), 1970,
    'From Murdoch\'s short philosophical book on moral attention. Most of what stops people from acting well is the cinema running inside their head — vanity, grievance, self-pity — which displaces the actual situation from view.');

  add('Longing on a large scale is what makes history.', 'Don DeLillo', 'Underworld (Prologue)', wiki('Underworld (DeLillo novel)'), 1997,
    'Opening line of the prologue, narrating a 1951 Dodgers-Giants game. History isn\'t made by reasoned policy — it\'s made by mass desire pointed at something. The defense of large ambition as a force of physics.');
  add('A waste of devotion is not a waste of life.', 'Don DeLillo', 'Mao II', wiki('Mao II'), 1991,
    'The reclusive novelist Bill Gray, who has not finished a book in years. DeLillo\'s defense of effort that doesn\'t produce — the devotion itself counts, even when the visible output doesn\'t.');

  add('Definitions belong to the definers, not the defined.', 'Toni Morrison', 'Beloved', wiki('Beloved (novel)'), 1987,
    'Refuse the categories assigned to you from outside; the work is to define your own. Every applicant being slotted into a "fit profile" by recruiters can use this.');
  add('You are your best thing.', 'Toni Morrison', 'Beloved (closing scene)', wiki('Beloved (novel)'), 1987,
    'Paul D to Sethe at the end of the novel. Not the children, not the past, not the man — she is the load-bearing thing. Recognize the priority before you lose it.');
  add('If you wanna fly, you got to give up the stuff that weighs you down.', 'Toni Morrison', 'Song of Solomon', wiki('Song of Solomon (novel)'), 1977,
    'Pilate to her nephew Milkman in the novel that ends with Milkman leaping off a cliff and learning, mid-fall, that he can fly. Identify what\'s heavy, drop it.');

  add('A man is more than what he has done; he is what he is willing to lose.', 'Sigrid Undset', 'Kristin Lavransdatter', wiki('Kristin Lavransdatter'), 1922,
    'Undset\'s Nobel-winning medieval Norwegian trilogy. A measure the visible record can\'t capture — the things you have refused or surrendered, which run deeper than the things you have built.');

  /* ── STEGNER / WILLIAMS / HAZZARD / CALVINO / KNAUSGÅRD / DILLARD ──── */
  add('Hardness of head and softness of heart are the two best traits a man can have.', 'Wallace Stegner', 'Crossing to Safety', wiki('Crossing to Safety'), 1987,
    'Larry Morgan, the writer-narrator of Stegner\'s late novel. The formula for endurance through the long haul: clarity outside, tenderness inside.');

  add('You must remember what you are and what you have chosen to become.', 'John Williams', 'Stoner', wiki('Stoner (novel)'), 1965,
    'Archer Sloane to the young William Stoner, who has just discovered literature in 1910 Missouri. Identity is partly given and partly chosen, and the work is to honor both. The line every career-pivot person needs.');
  add('A man\'s most enduring loyalty is not to a person or an idea but to a task.', 'John Williams', 'Stoner', wiki('Stoner (novel)'), 1965,
    'Stoner late in life, after the marriage has failed and the academic feud has cost him his best teaching. What survives is the work itself.');
  add('It is required of a man that he share the passion and the action of his time at peril of being judged not to have lived.', 'John Williams', 'Augustus', wiki('Augustus (Williams novel)'), 1972,
    'The historian Livy writing to Augustus Caesar in Williams\'s epistolary novel of Rome\'s first emperor. The cost of staying out of your time is being absent from your own life.');

  add('Acts of resistance compound in private, like savings.', 'Shirley Hazzard', 'The Transit of Venus', wiki('The Transit of Venus'), 1980,
    'From Hazzard\'s great cosmopolitan novel of two Australian sisters across decades. Every small private refusal accrues, even when nothing visible happens. The exact mental model for grinding through 200 rejections.');

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

  add('Hope is a way of preserving the future from the present.', 'John Berger', 'Hold Everything Dear', wiki('John Berger'), 2007,
    'Berger\'s late essays on war zones, written in his eighties. Hope isn\'t naïve optimism, it\'s active conservation work — keeping the future open while the present tries to close it.');

  add('In a room where people unanimously maintain a conspiracy of silence, one word of truth sounds like a pistol shot.', 'Czesław Miłosz', 'The Captive Mind', wiki('The Captive Mind'), 1953,
    'Miłosz\'s book on the intellectual collaborations with Stalinism in postwar Poland. The asymmetric leverage of telling the truth in a room committed to lying — a single sentence does enormous work.');

  /* ── RILKE / KOESTLER / CORTÁZAR / MURAKAMI / DE BOTTON / HOPKINS ──── */
  add('Have patience with everything unresolved in your heart and try to love the questions themselves.', 'Rainer Maria Rilke', 'Letters to a Young Poet, Letter 4', gut('Rilke Letters Young Poet'), 1903,
    'Rilke at 27, advising the 19-year-old officer-cadet Franz Kappus. The discipline of staying in the question rather than rushing to the answer — because the answers don\'t arrive until you\'ve fully lived the questions.');
  add('Perhaps all the dragons in our lives are princesses who are only waiting to see us act, just once, with beauty and courage.', 'Rainer Maria Rilke', 'Letters to a Young Poet, Letter 8', gut('Rilke Letters Young Poet'), 1904,
    'Letter 8, to the same young poet. The things we are afraid of often contain something else waiting — but only if we approach them rather than flee. The transformation is gated on the act.');

  add('A writer\'s ambition should be to trade a hundred contemporary readers for ten readers in ten years\' time and for one reader in a hundred years\' time.', 'Arthur Koestler', 'The Act of Creation', wiki('Arthur Koestler'), 1964,
    'Koestler\'s long study of how new ideas arrive. Operational ambition for any maker: short-term reach is cheap; the work that lasts buys an exponentially smaller and more attentive audience over time.');

  add('Nothing is lost if one has the courage to proclaim that all is lost and we must begin again.', 'Julio Cortázar', 'Hopscotch (Rayuela), Ch. 71', wiki('Hopscotch (Cortázar novel)'), 1963,
    'Morelli, the fictional writer whose notebooks are interleaved through Cortázar\'s novel. The case for total resets — admitting the loss honestly is what enables the new beginning.');

  add('Pain is inevitable. Suffering is optional.', 'Haruki Murakami', 'What I Talk About When I Talk About Running', wiki('What I Talk About When I Talk About Running'), 2007,
    'Murakami\'s memoir on running marathons and writing novels. The mantra he reaches for at mile 20. Pain is the physical signal you cannot opt out of — suffering is the additional commentary you can choose to stop generating.');
  add('Whatever it is you\'re seeking won\'t come in the form you\'re expecting.', 'Haruki Murakami', 'Kafka on the Shore', wiki('Kafka on the Shore'), 2002,
    'Oshima, the library assistant, to fifteen-year-old Kafka Tamura. Remain open to a different shape of the right answer.');

  add('Anyone who is not embarrassed by who he was a year ago probably isn\'t learning enough.', 'Alain de Botton', 'The Course of Love', wiki('The Course of Love'), 2016,
    'De Botton\'s novel-essay on the long course of an ordinary marriage. A metric for growth: the rate at which your past self embarrasses you is roughly the rate at which you\'re becoming someone different.');

  add('We are not made for revelation; or if we are, it is only fleetingly.', 'J. M. Coetzee', 'Disgrace', wiki('Disgrace (novel)'), 1999,
    'David Lurie late in Coetzee\'s short brutal novel of post-apartheid South Africa. Stop waiting for the moment of total clarity that will retroactively explain everything; build the life out of the partial illuminations as they arrive.');

  add('What I do is me: for that I came.', 'Gerard Manley Hopkins', 'As Kingfishers Catch Fire', wiki('Gerard Manley Hopkins'), 1881,
    'From Hopkins\'s short sonnet on each thing in creation enacting its own nature. The simplest possible vocational ethic: the thing you do IS who you are.');

  add('All that we don\'t know is astonishing. Even more astonishing is what passes for knowing.', 'Philip Roth', 'The Human Stain', wiki('The Human Stain'), 2000,
    'Nathan Zuckerman narrating in Roth\'s American trilogy. The humility required for accurate work: the more you actually look, the more obvious the gap becomes between what is "known" and what is true.');

  add('A solitary man lacks fellowship in his terrors.', 'Denis Johnson', 'Train Dreams', wiki('Train Dreams'), 2011,
    'Robert Grainier, a railroad day-laborer in 1920s Idaho whose family burns in a wildfire. A specific cost of isolation — your fears have no audience to verify them, so they expand to the size of the room.');
  add('All these going-aways are also goings-toward.', 'Denis Johnson', 'Tree of Smoke', wiki('Tree of Smoke'), 2007,
    'Johnson\'s Vietnam novel, near the end. The only consolation available in transition: every exit is also an entry into something. Track both directions.');

  return Q;
})();
