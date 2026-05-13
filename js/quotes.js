/* Quotes module — explicitly motivating, book-sourced, with context.
 *
 * Each entry: text, author, source, url, year, context
 *   - text: the quote (standalone-readable)
 *   - author/source/url/year: verifiable attribution
 *   - context: 1–3 sentences explaining where this sits in the work,
 *     what it means, and why it lands as motivation. Concise but
 *     comprehensive enough that the reader doesn't need the book. */

window.QUOTES = (function () {
  const gut    = (query) => `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(query)}`;
  const gutId  = (id)    => `https://www.gutenberg.org/ebooks/${id}`;
  const bible  = (ref)   => `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=KJV`;
  const wiki   = (title) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
  const wikis  = (query) => `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;

  const Q = [];
  const add = (text, author, source, url, year, context) =>
    Q.push({ text, author, source, url, year, context });

  /* ── HEBREW BIBLE ──────────────────────────────────────────────────── */
  add('Though he slay me, yet will I trust in him.', 'Job', 'Job 13:15 (KJV)', bible('Job 13:15'), null,
    'Job is in the depths of catastrophe — children dead, wealth gone, body in agony — and yet refuses to abandon his integrity. The line is the high-water mark of biblical defiance: trust the work, the way, the path, even when everything visible is being taken from you.');
  add('For I know that my redeemer liveth, and that he shall stand at the latter day upon the earth.', 'Job', 'Job 19:25 (KJV)', bible('Job 19:25'), null,
    'Spoken from the ash heap. Job has lost almost everything and his friends keep insisting he must have done something wrong to deserve it. He answers with a single defiant certainty: someone, eventually, will set this right. The motivation is the radical commitment to a meaning beyond present evidence.');
  add('Weeping may endure for a night, but joy cometh in the morning.', 'Psalms', 'Psalm 30:5 (KJV)', bible('Psalm 30:5'), null,
    'A king\'s thanksgiving song after recovery from near death. The pattern it names — that the worst night ends, that the morning is structurally on its way — is one of the oldest written formulations of the discipline of endurance: outlast the dark.');
  add('Be still, and know that I am God.', 'Psalms', 'Psalm 46:10 (KJV)', bible('Psalm 46:10'), null,
    'The psalm describes catastrophe — mountains falling into the sea, kingdoms at war — and from inside that storm gives the instruction to stop striving and just hold position. For high-effort work the line cuts the other way too: the strength to act often comes from the ability to first be still.');
  add('Wait on the Lord: be of good courage, and he shall strengthen thine heart.', 'David', 'Psalm 27:14 (KJV)', bible('Psalm 27:14'), null,
    'Closing line of a psalm about being surrounded by enemies. "Wait" here doesn\'t mean passivity — it means courageous endurance under attack while strength is being gathered. Patience as an active force, not a default.');
  add('The race is not to the swift, nor the battle to the strong... but time and chance happeneth to them all.', 'Ecclesiastes', 'Ecclesiastes 9:11 (KJV)', bible('Ecclesiastes 9:11'), null,
    'Ecclesiastes\' brutal realism: raw talent and raw strength don\'t guarantee outcomes. What you control is showing up day after day; the rest is variance. The motivational reading is the opposite of fatalism — since outcomes are partly chance, your job is to put in the work that loads the dice.');
  add('Whatsoever thy hand findeth to do, do it with thy might.', 'Ecclesiastes', 'Ecclesiastes 9:10 (KJV)', bible('Ecclesiastes 9:10'), null,
    'The Preacher\'s answer to existential vertigo: since life is brief and outcomes uncertain, the worthy response is total commitment to whatever is in front of you. Don\'t hedge your effort. The most ancient productivity rule in the West.');
  add('Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.', 'Proverbs', 'Proverbs 27:17 (KJV)', bible('Proverbs 27:17'), null,
    'You become like the people you push against. Choose collaborators and rivals who genuinely cut at you, not those who flatter — sharpening only happens under friction.');
  add('He that ruleth his spirit is better than he that taketh a city.', 'Proverbs', 'Proverbs 16:32 (KJV)', bible('Proverbs 16:32'), null,
    'The Proverbs author ranks self-mastery above military conquest. The point is that controlling your reactions — anger, fear, impulse — is a harder and more consequential victory than any external one.');

  /* ── NEW TESTAMENT ─────────────────────────────────────────────────── */
  add('I have fought a good fight, I have finished my course, I have kept the faith.', 'Paul', '2 Timothy 4:7 (KJV)', bible('2 Timothy 4:7'), null,
    'Paul\'s final letter, written from prison shortly before his execution. The line is the summary he wants on his life: three concrete commitments completed. The motivational power is in its specificity — a clear standard to be able to say of yourself at the end.');
  add('I can do all things through Christ which strengtheneth me.', 'Paul', 'Philippians 4:13 (KJV)', bible('Philippians 4:13'), null,
    'Written from prison. In context Paul is saying he has learned to be content in any state — hungry or full, rich or poor — through a strength he doesn\'t locate in himself. The motivation is the move from "I can\'t handle this" to "the source of my strength is not my circumstance."');
  add('We are troubled on every side, yet not distressed; we are perplexed, but not in despair; persecuted, but not forsaken; cast down, but not destroyed.', 'Paul', '2 Corinthians 4:8–9 (KJV)', bible('2 Corinthians 4:8-9'), null,
    'Paul listing the pressures of his ministry — and naming each one\'s ceiling. The structure is the point: troubled but not crushed, perplexed but not despairing, cast down but not destroyed. A vocabulary for the difference between pressure and defeat.');
  add('Tribulation worketh patience; and patience, experience; and experience, hope.', 'Paul', 'Romans 5:3–4 (KJV)', bible('Romans 5:3-4'), null,
    'A four-step compounding chain: hardship produces patience, patience produces seasoned character, character produces hope. The line argues that suffering isn\'t the absence of progress — it IS the mechanism of progress, when you stay in it.');
  add('Let us run with patience the race that is set before us.', 'Hebrews', 'Hebrews 12:1 (KJV)', bible('Hebrews 12:1'), null,
    'The author of Hebrews invokes the image of a great cloud of past witnesses watching the runner. The race is "set before" you — you don\'t pick it. Patience here means endurance pace, not waiting.');
  add('Looking unto Jesus the author and finisher of our faith; who for the joy that was set before him endured the cross.', 'Hebrews', 'Hebrews 12:2 (KJV)', bible('Hebrews 12:2'), null,
    'The pattern: endurance through suffering is possible when you can see, however dimly, the joy on the other side. The line is the founding text of "carry the long view through the short pain."');
  add('Be of good cheer; I have overcome the world.', 'Jesus', 'John 16:33 (KJV)', bible('John 16:33'), null,
    'Jesus\'s last words to his disciples the night before his execution. He doesn\'t deny that tribulation is coming — he tells them they will have it — but says the world has already been beaten on the deeper level. The motivation: stand inside your own confidence even when the visible situation says otherwise.');
  add('Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.', 'Jesus', 'Matthew 7:7 (KJV)', bible('Matthew 7:7'), null,
    'Three escalating verbs: ask is passive, seek is active, knock is persistent. The line is a structure for not-stopping — when the easy ask fails, search; when search fails, persist.');

  /* ── QURAN ─────────────────────────────────────────────────────────── */
  add('Verily, with hardship comes ease.', 'Quran', 'Quran 94:6', wikis('Quran 94 ash-Sharh'), null,
    'Surah ash-Sharh ("The Relief"), revealed during a difficult early period in Muhammad\'s prophethood. The verse is doubled in the surah — "with hardship comes ease" twice — to underline that the easing is not separate from the hardship but woven into it.');
  add('God does not burden a soul beyond what it can bear.', 'Quran', 'Quran 2:286', wikis('Al-Baqara 286'), null,
    'Closing verse of the longest surah, traditionally taught as a prayer. The promise is structural — whatever weight is on you is, by definition, weight you can carry. Reframes "this is too much" into "this is exactly enough."');
  add('Indeed, God is with those who are patient.', 'Quran', 'Quran 2:153', wikis('Quran 2:153'), null,
    'The verse before names prayer and patience as the two resources to seek help in. Sabr in Arabic isn\'t resignation but disciplined steadfastness — the line motivates the long quiet work, not waiting around.');
  add('God does not change the condition of a people until they change what is in themselves.', 'Quran', 'Quran 13:11', wikis('Quran 13:11'), null,
    'The Quranic version of agency: external conditions follow internal ones. You don\'t fix the situation first and then change — you change first, and the situation moves.');

  /* ── PIRKEI AVOT ───────────────────────────────────────────────────── */
  add('If I am not for myself, who will be for me? If I am only for myself, what am I? And if not now, when?', 'Hillel', 'Pirkei Avot 1:14', wikis('Pirkei Avot 1:14'), null,
    'Three questions stacked. The first refuses self-neglect, the second refuses pure self-interest, the third closes the loop with the most famous deadline in moral philosophy. Together: you have a duty to yourself, a duty beyond yourself, and a duty to act on both now.');
  add('In a place where there are no men, strive to be a man.', 'Hillel', 'Pirkei Avot 2:5', wikis('Pirkei Avot'), null,
    'When everyone around you is failing to act with character, the response is not to match them — it is to be the one who acts. The harder the environment, the more your standing counts.');
  add('It is not your duty to finish the work, but neither are you free to neglect it.', 'Rabbi Tarfon', 'Pirkei Avot 2:16', wikis('Pirkei Avot'), null,
    'The mishnah\'s answer to the trap of "I\'ll never complete this so why start." You aren\'t responsible for finishing a multi-generational project alone — but you ARE responsible for doing your part of it today.');
  add('Who is wise? He who learns from every person. Who is strong? He who masters his passions. Who is rich? He who is content with his portion.', 'Ben Zoma', 'Pirkei Avot 4:1', wikis('Pirkei Avot 4:1'), null,
    'Three definitions that quietly relocate wisdom, strength, and wealth from external rankings to internal practices. None of them are about what you have — all are about how you handle yourself.');

  /* ── MARCUS AURELIUS — Meditations ─────────────────────────────────── */
  add('The impediment to action advances action. What stands in the way becomes the way.', 'Marcus Aurelius', 'Meditations 5.20', gutId(2680), 'c.170',
    'Marcus, emperor of Rome, writing a private notebook on campaign. The Stoic insight: an obstacle blocking your goal IS the next step of the path, because acting through it is the work itself. Not "work around the obstacle" — work the obstacle.');
  add('Waste no more time arguing what a good man should be. Be one.', 'Marcus Aurelius', 'Meditations 10.16', gutId(2680), 'c.170',
    'Marcus admonishing himself to stop philosophizing about virtue and start practicing it. The discipline is to translate hours of reading into a single action you can make today.');
  add('You have power over your mind — not outside events. Realize this, and you will find strength.', 'Marcus Aurelius', 'Meditations', gutId(2680), 'c.170',
    'The core Stoic dichotomy. Spending energy on what you don\'t control burns reserves you need for what you do. The strength here is the precision of where to push.');
  add('If you are distressed by anything external, the pain is not due to the thing itself, but to your estimate of it; and this you have the power to revoke at any moment.', 'Marcus Aurelius', 'Meditations 8.47', gutId(2680), 'c.170',
    'A specific Stoic technique: the pain is in your judgment of the event, not the event. Since the judgment is yours, you can withdraw or rewrite it. Operative, not abstract.');
  add('At dawn, when you have trouble getting out of bed, tell yourself: I have to go to work — as a human being.', 'Marcus Aurelius', 'Meditations 5.1', gutId(2680), 'c.170',
    'Opening line of Book 5. Marcus, who could have stayed in the palace under any pretext, reframes the question. The motivation is not preference but role: this is what a human being does.');
  add('Confine yourself to the present.', 'Marcus Aurelius', 'Meditations 7.29', gutId(2680), 'c.170',
    'A repeated Stoic exercise: the past is gone, the future doesn\'t exist yet, the only place where work happens is now. The line is the entire weight of attention training in three words.');

  /* ── EPICTETUS ─────────────────────────────────────────────────────── */
  add('It is not what happens to you, but how you react to it that matters.', 'Epictetus', 'Enchiridion 5', gut('Epictetus enchiridion'), 'c.125',
    'Epictetus was born a slave and lame; he had unique authority to argue that external circumstance is not the controlling variable. The Enchiridion is his student\'s field manual — every aphorism is a tool, not theory.');
  add('First say to yourself what you would be; and then do what you have to do.', 'Epictetus', 'Discourses III.23', gut('Epictetus discourses'), 'c.108',
    'Identity-first sequencing: define the kind of person you intend to be, then derive the actions from that. The opposite of "I\'ll figure out who I am from what I do." The role is the cause, the actions the effect.');
  add('No great thing is created suddenly, any more than a bunch of grapes or a fig.', 'Epictetus', 'Discourses I.15', gut('Epictetus discourses'), 'c.108',
    'A biological analogy: fruit needs to bud, set, ripen. Trying to skip stages destroys the result. The line is the original argument against shortcuts.');
  add('If you wish to be a writer, write.', 'Epictetus', 'Discourses II.18', gut('Epictetus discourses'), 'c.108',
    'Epictetus collapses years of would-be philosophizing into one instruction. You become the thing by doing the thing — there is no preparatory phase that is not also the practice.');
  add('Difficulties are things that show a person what they are.', 'Epictetus', 'Discourses I.24', gut('Epictetus discourses'), 'c.108',
    'In Stoic thought, hardship functions as a diagnostic tool — it surfaces what character is actually there underneath the comfortable defaults. The line reframes adversity from punishment to information.');

  /* ── SENECA ────────────────────────────────────────────────────────── */
  add('We suffer more often in imagination than in reality.', 'Seneca', 'Letters from a Stoic XIII', gut('Seneca letters from a stoic'), 'c.65',
    'Seneca\'s letter on fearfulness. Most of our anticipated catastrophes never arrive — but we live the cost of them in advance. The line is a permission to stop pre-paying for futures that may not happen.');
  add('It is not the man who has too little, but the man who craves more, that is poor.', 'Seneca', 'Letters from a Stoic II', gut('Seneca letters from a stoic'), 'c.65',
    'Seneca was one of Rome\'s richest men — he could write this with full credibility. Poverty is a state of want, not amount. The exit from poverty is contentment with what you have, not acquisition.');
  add('Begin at once to live, and count each separate day as a separate life.', 'Seneca', 'Letters from a Stoic CI', gut('Seneca letters from a stoic'), 'c.65',
    'Written after a friend\'s sudden death. The reframe: stop treating today as preparation for some future life. Today IS a life — the only one you have right now.');
  add('Most powerful is he who has himself in his own power.', 'Seneca', 'Letters from a Stoic XC', gut('Seneca letters from a stoic'), 'c.65',
    'Seneca\'s definition of mastery. External power — over slaves, armies, money — is contingent. Self-command is the only kind that cannot be taken away.');
  add('A gem cannot be polished without friction, nor a man perfected without trials.', 'Seneca', 'On Providence', gut('Seneca on providence'), 'c.65',
    'The treatise On Providence asks why bad things happen to good people. Seneca\'s answer: the bad things are the polishing. Without resistance there is no shape.');
  add('Difficulties strengthen the mind, as labor does the body.', 'Seneca', 'Letters from a Stoic', gut('Seneca letters from a stoic'), 'c.65',
    'The training metaphor — already old in Seneca\'s time and still the cleanest formulation. Mental capacity isn\'t innate; it\'s built under load, the same way muscle is.');

  /* ── SUN TZU ───────────────────────────────────────────────────────── */
  add('Victorious warriors win first and then go to war, while defeated warriors go to war first and then seek to win.', 'Sun Tzu', 'The Art of War IV', gutId(132), 'c.5c BC',
    'Sun Tzu\'s thesis on preparation: the outcome is decided before the engagement, in the setup. By the time you\'re fighting, the work is already done — or it isn\'t.');
  add('In the midst of chaos, there is also opportunity.', 'Sun Tzu', 'The Art of War', gutId(132), 'c.5c BC',
    'A statement of asymmetric advantage: structured situations favor whoever has the most resources, but disrupted situations favor whoever can see clearly. The line is a license to lean into disorder rather than fear it.');

  /* ── LAO TZU ───────────────────────────────────────────────────────── */
  add('A journey of a thousand miles begins beneath one\'s feet.', 'Lao Tzu', 'Tao Te Ching 64', gutId(216), 'c.4c BC',
    'The original first-step quote, often mistranslated as "begins with a single step" — but the Chinese says "beneath one\'s feet": the journey is already happening, exactly where you are standing now.');
  add('Knowing others is intelligence; knowing yourself is true wisdom. Mastering others is strength; mastering yourself is true power.', 'Lao Tzu', 'Tao Te Ching 33', gutId(216), 'c.4c BC',
    'A two-tier ranking: the outward measure is intelligence and strength, the deeper measure is self-knowledge and self-mastery. Outward control without inward grounding is the smaller game.');
  add('He who is contented is rich.', 'Lao Tzu', 'Tao Te Ching 33', gutId(216), 'c.4c BC',
    'In the same chapter as self-mastery. Wealth is a feeling about your portion, not the size of it. The line refuses the chase that has no finish line.');
  add('The sage does not accumulate. The more he gives to others, the more he has for himself.', 'Lao Tzu', 'Tao Te Ching 81', gutId(216), 'c.4c BC',
    'The closing chapter\'s paradox: hoarding shrinks you; giving generates more than it costs. The motivation is to act in abundance even when the calculus says scarcity.');

  /* ── CONFUCIUS ─────────────────────────────────────────────────────── */
  add('To see what is right and not do it is want of courage.', 'Confucius', 'Analects 2.24', gut('Analects of Confucius'), 'c.500 BC',
    'Confucius collapses moral reasoning into action. Knowing what\'s right isn\'t the achievement — doing it is. Cowardice here isn\'t fear of danger; it\'s failure to act on what you already know.');
  add('The superior man is modest in his speech but exceeds in his actions.', 'Confucius', 'Analects 14.27', gut('Analects of Confucius'), 'c.500 BC',
    'The line is a deliberate inversion of the common pattern (talk big, deliver small). Confucian junzi quietness isn\'t humility for its own sake — it\'s the discipline of letting the work speak.');

  /* ── BHAGAVAD GITA ─────────────────────────────────────────────────── */
  add('Set thy heart upon thy work, but never on its reward.', 'Bhagavad Gita', 'Bhagavad Gita 2.47 (Arnold trans.)', gutId(2388), 'c.2c BC',
    'Krishna\'s core teaching to the paralyzed warrior Arjuna. Full commitment to the work itself, none to the outcome — because attachment to outcome corrupts the work. This is the foundational text of "process over result" thinking.');
  add('No effort is wasted, no gain is reversed; even a little of this practice will shelter thee from great fear.', 'Bhagavad Gita', 'Bhagavad Gita 2.40', gutId(2388), 'c.2c BC',
    'The Gita\'s answer to "what if I fail." Nothing put into the practice is lost — even partial effort accumulates as protection. The line refutes the all-or-nothing trap.');
  add('Better one\'s own duty, though imperfectly performed, than the duty of another well performed.', 'Bhagavad Gita', 'Bhagavad Gita 3.35', gutId(2388), 'c.2c BC',
    'Krishna on svadharma — your own path. Performing someone else\'s work flawlessly counts less than performing your own work badly, because the alignment is the point. A defense against impressive misdirection.');

  /* ── DHAMMAPADA ────────────────────────────────────────────────────── */
  add('All that we are is the result of what we have thought.', 'The Buddha', 'Dhammapada 1', gut('Dhammapada'), 'c.3c BC',
    'Opening verse of the Dhammapada. The argument is causal: character is the accumulation of habitual thought. Therefore the leverage point for changing who you are is what you choose to dwell on.');

  /* ── HERACLITUS ────────────────────────────────────────────────────── */
  add('A man\'s character is his fate.', 'Heraclitus', 'Fragment 119', wiki('Heraclitus'), 'c.500 BC',
    'Heraclitus reduces destiny from external decree to internal pattern. The way you habitually choose IS the future you\'ll end up in. The line lands as both warning and license.');

  /* ── SOCRATES ──────────────────────────────────────────────────────── */
  add('The unexamined life is not worth living.', 'Socrates (in Plato)', 'Apology 38a', gut('Plato Apology'), 'c.399 BC',
    'Socrates is on trial for his life and asked whether he\'d accept exile in exchange for shutting up. He answers no — without inquiry, life isn\'t worth more than its biology. The line stakes the price of examining things at any cost.');

  /* ── BOETHIUS ──────────────────────────────────────────────────────── */
  add('Nothing is miserable unless you think it so; and on the other hand, nothing brings happiness unless you are content with it.', 'Boethius', 'The Consolation of Philosophy II', gut('Consolation of Philosophy Boethius'), 524,
    'Boethius wrote the Consolation in prison awaiting execution. Lady Philosophy appears and walks him through the recognition that fortune is volatile and the only stable ground is your relationship to your portion.');

  /* ── AUGUSTINE ─────────────────────────────────────────────────────── */
  add('Thou hast made us for thyself, O Lord, and our heart is restless until it finds rest in thee.', 'Augustine of Hippo', 'Confessions I.1', gut('Augustine Confessions'), 400,
    'Opening sentence of the Confessions. Augustine\'s diagnosis of human striving: every smaller pursuit fails to satisfy because we are oriented toward something larger. The motivation is to recognize what the restlessness IS for.');

  /* ── DANTE ─────────────────────────────────────────────────────────── */
  add('Consider your origin; you were not born to live like brutes, but to follow virtue and knowledge.', 'Dante Alighieri', 'Inferno XXVI.118–120', gutId(8800), 1320,
    'Ulysses, speaking from inside a tongue of flame in the eighth circle of Hell, recounts how he convinced his exhausted crew to sail past the limits of the known world. Dante uses him to argue that the human calling is upward and outward — even when the cost is destruction.');

  /* ── MACHIAVELLI ───────────────────────────────────────────────────── */
  add('Never was anything great achieved without danger.', 'Niccolò Machiavelli', 'The Prince VI', gutId(1232), 1532,
    'Chapter 6, on princes who acquired power through their own ability. Machiavelli observes that no transformative figure ever climbed without putting themselves in real jeopardy — the danger isn\'t a side effect of greatness, it\'s a precondition.');

  /* ── SHAKESPEARE ───────────────────────────────────────────────────── */
  add('To thine own self be true.', 'William Shakespeare', 'Hamlet I.iii', gutId(100), 1603,
    'Polonius\'s parting advice to his son Laertes before sending him to Paris. The line\'s force is that it caps a long speech about practical tactics — all the maneuvering is downstream of staying aligned with who you actually are.');
  add('Cowards die many times before their deaths; the valiant never taste of death but once.', 'William Shakespeare', 'Julius Caesar II.ii', gutId(100), 1599,
    'Caesar to his wife Calpurnia, who has been begging him not to go to the Senate after a night of evil omens. The line distinguishes the actual event (once) from the rehearsal of fear (endlessly). Cowards live the catastrophe over and over before it arrives.');
  add('Our doubts are traitors, and make us lose the good we oft might win, by fearing to attempt.', 'William Shakespeare', 'Measure for Measure I.iv', gutId(100), 1604,
    'Lucio urging Isabella to plead for her condemned brother\'s life — to act rather than freeze. The line names doubt not as caution but as betrayal: it costs you the very wins you could have had if you\'d tried.');
  add('Some are born great, some achieve greatness, and some have greatness thrust upon them.', 'William Shakespeare', 'Twelfth Night II.v', gutId(100), 1601,
    'Malvolio reads this from a forged letter. Three paths: inheritance, effort, accident. The reader\'s motivation is to identify which lane is theirs and stop waiting for the wrong one.');
  add('We know what we are, but know not what we may be.', 'William Shakespeare', 'Hamlet IV.v', gutId(100), 1603,
    'Ophelia\'s mad-scene line — but the thought stands intact: present identity is knowable, future capacity isn\'t. You can\'t predict what you become; you can only run the experiment.');

  /* ── MILTON ────────────────────────────────────────────────────────── */
  add('The mind is its own place, and in itself can make a heaven of hell, a hell of heaven.', 'John Milton', 'Paradise Lost I.254–255', gut('Paradise Lost Milton'), 1667,
    'Satan, newly fallen and stranded in the burning lake, refusing to be broken. Milton lets him say what the Stoics also said: external circumstance does not determine internal state. The mind makes the meaning.');
  add('Awake, arise, or be forever fallen.', 'John Milton', 'Paradise Lost I.330', gut('Paradise Lost Milton'), 1667,
    'Satan rallying his stunned legions after the fall. The construction is binary — there is no third option between getting up and lying defeated. The pure imperative form of recovery.');

  /* ── CERVANTES ─────────────────────────────────────────────────────── */
  add('To be prepared is half the victory.', 'Miguel de Cervantes', 'Don Quixote', gutId(996), 1615,
    'Sancho Panza\'s practical wisdom — for a novel whose hero is famously unprepared. Cervantes places the line as the sane voice underneath the romantic delusion: half of any outcome is set before action begins.');

  /* ── EMERSON & THOREAU ─────────────────────────────────────────────── */
  add('Trust thyself: every heart vibrates to that iron string.', 'Ralph Waldo Emerson', 'Self-Reliance', gut('Emerson Self-Reliance'), 1841,
    'Self-Reliance is Emerson\'s manifesto against secondhand opinion. The "iron string" image — the one tuning everyone\'s instrument — argues that the deepest signal in you is also the most universally true.');
  add('Whoso would be a man must be a nonconformist.', 'Ralph Waldo Emerson', 'Self-Reliance', gut('Emerson Self-Reliance'), 1841,
    'Emerson\'s direct framing: maturity isn\'t about fitting in. The line installs nonconformity as a developmental milestone, not a temperament.');
  add('A foolish consistency is the hobgoblin of little minds.', 'Ralph Waldo Emerson', 'Self-Reliance', gut('Emerson Self-Reliance'), 1841,
    'Emerson\'s permission to update. Being consistent with last year\'s positions for the sake of consistency is a small-mind trap; growth requires contradicting your former self in public.');
  add('I went to the woods because I wished to live deliberately, to front only the essential facts of life.', 'Henry David Thoreau', 'Walden II', gutId(205), 1854,
    'Opening of "Where I Lived, and What I Lived For." Thoreau\'s stated reason for the Walden Pond experiment: strip life to its load-bearing elements and see what they actually are when nothing decorative is in the way.');
  add('Our life is frittered away by detail. Simplify, simplify.', 'Henry David Thoreau', 'Walden II', gutId(205), 1854,
    'Same chapter. Thoreau\'s diagnosis of why most people\'s lives don\'t produce what they\'re capable of: the energy is gone to a thousand small things before the important ones get any. Repeated for emphasis: simplify, simplify.');
  add('Things do not change; we change.', 'Henry David Thoreau', 'Walden', gutId(205), 1854,
    'The relocator move: when the world seems to be improving or deteriorating, often what\'s actually different is you. The line places agency back inside the observer.');

  /* ── HUGO & DUMAS ──────────────────────────────────────────────────── */
  add('Even the darkest night will end and the sun will rise.', 'Victor Hugo', 'Les Misérables', gutId(135), 1862,
    'Hugo\'s narrator commenting after the failed Paris uprising of 1832. The defeated revolutionaries are dead in the street and yet the structural promise stands: night, however absolute, is finite.');
  add('All human wisdom is summed up in these two words: Wait and Hope.', 'Alexandre Dumas', 'The Count of Monte Cristo (closing line)', gutId(1184), 1844,
    'The very last sentence of the novel. After 1,200 pages of escape, revenge, and reckoning, Edmond Dantès leaves this maxim as his only inheritance to the young couple he leaves behind. The pairing is precise: waiting alone is passive, hope alone is naive — both together are the discipline.');

  /* ── DOSTOEVSKY ────────────────────────────────────────────────────── */
  add('Above all, do not lie to yourself. The man who lies to himself can be more easily offended than anyone.', 'Fyodor Dostoevsky', 'The Brothers Karamazov', gutId(28054), 1880,
    'Father Zosima\'s teaching to his fellow monks. Dostoevsky\'s ethics start with the diagnosis that internal lying is the source of most external dysfunction — including a defensive thinness of skin that\'s really self-protection from the truth.');
  add('The mystery of human existence lies not in just staying alive, but in finding something to live for.', 'Fyodor Dostoevsky', 'The Brothers Karamazov', gutId(28054), 1880,
    'A line that re-formulates the entire novel\'s question. Survival is a low bar; the actual problem is locating what your survival is FOR. Frankl will reach the same conclusion seventy years later in a concentration camp.');
  add('Taking a new step, uttering a new word, is what people fear most.', 'Fyodor Dostoevsky', 'Crime and Punishment', gutId(2554), 1866,
    'Raskolnikov\'s internal monologue early in the novel. Not the act itself but the novelty of acting is where the resistance lives. The line names the friction at the start of any first attempt.');

  /* ── TOLSTOY ───────────────────────────────────────────────────────── */
  add('The strongest of all warriors are these two — Time and Patience.', 'Leo Tolstoy', 'War and Peace', gutId(2600), 1869,
    'General Kutuzov, the Russian commander against Napoleon, refusing pressure to engage Napoleon in pitched battle. Tolstoy uses him to argue that the decisive military forces are often invisible: outlasting and accumulating, rather than charging.');
  add('Everyone thinks of changing the world, but no one thinks of changing himself.', 'Leo Tolstoy', 'Three Methods of Reform (Pamphlets)', wiki('Leo Tolstoy'), 1900,
    'From a late pamphlet on social reform. Tolstoy\'s late-career conclusion: every external reform movement fails to the degree it skips the internal one. You are the only person you have direct authority to change.');

  /* ── MELVILLE ──────────────────────────────────────────────────────── */
  add('Better to sink in boundless deeps than float on vulgar shoals.', 'Herman Melville', 'Mardi: and a Voyage Thither', gut('Melville Mardi'), 1849,
    'From the philosophical sea-novel Mardi, three years before Moby-Dick. Melville stakes his ambition: the risk of total failure on a deep attempt is preferable to safe mediocrity. He will, of course, sink boundlessly.');
  add('I know not all that may be coming, but be it what it will, I\'ll go to it laughing.', 'Herman Melville', 'Moby-Dick', gutId(2701), 1851,
    'Stubb, the second mate of the Pequod, expressing his temperament. The motivational kernel is not denial of danger but stance toward it — meet whatever\'s coming on your own terms.');

  /* ── NIETZSCHE ─────────────────────────────────────────────────────── */
  add('He who has a why to live for can bear almost any how.', 'Friedrich Nietzsche', 'Twilight of the Idols I.12', wiki('Twilight of the Idols'), 1889,
    'A Maxim from "Arrows and Epigrams." Nietzsche\'s structural insight, later made operational by Viktor Frankl in Auschwitz: meaning is what makes suffering bearable. The how follows the why.');
  add('What does not kill me makes me stronger.', 'Friedrich Nietzsche', 'Twilight of the Idols I.8', wiki('Twilight of the Idols'), 1889,
    'The original of the cliché, written by a man with chronic migraines, near-blindness, and a year from total breakdown. Read against his biography it\'s not glib — it\'s the formula he was personally trying to live by while collapsing.');
  add('You must have chaos within you to give birth to a dancing star.', 'Friedrich Nietzsche', 'Thus Spoke Zarathustra, Prologue 5', gut('Thus Spake Zarathustra Nietzsche'), 1883,
    'Zarathustra addresses the marketplace, contrasting the "last man" (comfortable, settled) with the higher type that still has internal turbulence. The chaos isn\'t a problem to be solved — it\'s the prerequisite for creation.');
  add('My formula for human greatness is amor fati: that one wants nothing to be different, not forward, not backward, not in all eternity.', 'Friedrich Nietzsche', 'Ecce Homo II.10', wiki('Ecce Homo (book)'), 1888,
    'Nietzsche, weeks before his collapse, naming his life formula. Amor fati — love of fate — goes past acceptance: not just enduring what is, but wanting it. The hardest motivational stance, because it forbids wishing the past were different.');
  add('The secret of reaping the greatest fruitfulness and the greatest enjoyment from existence is to live dangerously.', 'Friedrich Nietzsche', 'The Gay Science §283', wiki('The Gay Science'), 1882,
    '§283 is titled "Preparatory men." Nietzsche calls for a generation that will choose risk over comfort — build cities on Vesuvius, send ships into uncharted seas. The line is the canonical defense of voluntary stakes.');

  /* ── SCHOPENHAUER ──────────────────────────────────────────────────── */
  add('Talent hits a target no one else can hit; genius hits a target no one else can see.', 'Arthur Schopenhauer', 'The World as Will and Representation', wiki('The World as Will and Representation'), 1819,
    'Schopenhauer\'s distinction between virtuosity and originality. Hitting a known target with skill is talent; defining a target nobody else has perceived is the harder, lonelier thing.');

  /* ── KIERKEGAARD ───────────────────────────────────────────────────── */
  add('Life can only be understood backwards; but it must be lived forwards.', 'Søren Kierkegaard', 'Papers and Journals', wiki('Søren Kierkegaard'), 1843,
    'From Kierkegaard\'s journals. The asymmetry: meaning resolves in retrospect but choice happens prospectively. The motivation is to act without the resolution, knowing it won\'t arrive until later.');

  /* ── HEMINGWAY ─────────────────────────────────────────────────────── */
  add('A man can be destroyed but not defeated.', 'Ernest Hemingway', 'The Old Man and the Sea', wiki('The Old Man and the Sea'), 1952,
    'Santiago, three days out at sea and watching sharks eat the giant marlin he has fought for. Hemingway draws the line between physical loss and inward defeat — you can be erased without ever being beaten.');
  add('But man is not made for defeat.', 'Ernest Hemingway', 'The Old Man and the Sea', wiki('The Old Man and the Sea'), 1952,
    'Same scene. The old fisherman is alone in the skiff at night realizing what he\'s lost — and saying this aloud to himself as both diagnosis and refusal.');
  add('Now is no time to think of what you do not have. Think of what you can do with what there is.', 'Ernest Hemingway', 'The Old Man and the Sea', wiki('The Old Man and the Sea'), 1952,
    'Santiago to himself, late in the struggle. The line is operational triage — the missing tools, the lost line, the limited body. Use the resource you actually have, now.');
  add('The world breaks every one and afterward many are strong at the broken places.', 'Ernest Hemingway', 'A Farewell to Arms', wiki('A Farewell to Arms'), 1929,
    'Lieutenant Henry\'s reflection in the closing chapters of the WWI novel. Hemingway argues that the breaking is universal — but that the heal can be load-bearing in a way the original was not.');

  /* ── FAULKNER ──────────────────────────────────────────────────────── */
  add('I decline to accept the end of man. I believe that man will not merely endure: he will prevail.', 'William Faulkner', 'Banquet Speech (The Faulkner Reader)', wiki('William Faulkner'), 1950,
    'Faulkner\'s Nobel acceptance speech in Stockholm, given at the height of nuclear-age dread. Endurance, he says, is the floor — not the ceiling. The writer\'s job is to remind people of the higher claim.');

  /* ── STEINBECK ─────────────────────────────────────────────────────── */
  add('And now that you don\'t have to be perfect, you can be good.', 'John Steinbeck', 'East of Eden', wiki('East of Eden (novel)'), 1952,
    'Lee, the Chinese-American servant philosopher, to a young man crushed by his father\'s rejection. Releasing the demand for perfection isn\'t a lowering of the bar — it\'s what makes real goodness possible.');
  add('All great and precious things are lonely.', 'John Steinbeck', 'East of Eden', wiki('East of Eden (novel)'), 1952,
    'Steinbeck on the cost structure of mastery. The work that matters tends to be done alone, and the things worth most aren\'t arrived at collectively.');

  /* ── HESSE ─────────────────────────────────────────────────────────── */
  add('The bird fights its way out of the egg. The egg is the world. Whoever will be born must destroy a world.', 'Hermann Hesse', 'Demian', wiki('Demian'), 1919,
    'Demian to the narrator Emil Sinclair. Hesse\'s formula for self-becoming: the world you grew up inside has to crack for the new self to exist. The breaking isn\'t damage, it\'s birth.');
  add('You are only afraid if you are not in harmony with yourself.', 'Hermann Hesse', 'Demian', wiki('Demian'), 1919,
    'A diagnostic: fear is the signal of internal misalignment, not external threat. The line locates the work — not in eliminating danger but in coming back into accord with yourself.');
  add('Within you there is a stillness and a sanctuary to which you can retreat at any time and be yourself.', 'Hermann Hesse', 'Siddhartha', wiki('Siddhartha (novel)'), 1922,
    'Hesse\'s Buddha-shaped novel of a young man\'s spiritual search. The closing recognition is that the refuge he was searching for outside was always available inside.');

  /* ── KAFKA ─────────────────────────────────────────────────────────── */
  add('A book must be the axe for the frozen sea within us.', 'Franz Kafka', 'Letters to Friends, Family and Editors (letter to Oskar Pollak, 1904)', wiki('Franz Kafka'), 1904,
    'Kafka, twenty years old, in a letter to his school friend Oskar Pollak. He argues that books that just confirm what we already feel are useless — the books that count are the ones that crack something inside us open.');

  /* ── CAMUS ─────────────────────────────────────────────────────────── */
  add('In the depth of winter, I finally learned that within me there lay an invincible summer.', 'Albert Camus', 'Return to Tipasa (Summer)', wiki('Albert Camus'), 1952,
    'Camus revisits the Algerian coastal town of Tipasa twelve years after his first essay about it, in the middle of postwar disillusionment. The recognition: the resource was always inside, not in the place.');
  add('The struggle itself toward the heights is enough to fill a man\'s heart. One must imagine Sisyphus happy.', 'Albert Camus', 'The Myth of Sisyphus (closing line)', wiki('The Myth of Sisyphus'), 1942,
    'The final sentence of Camus\'s essay on absurdity. Sisyphus, condemned to roll a boulder up a hill forever only to watch it roll back, is the model for the meaningful life that does not depend on outcome. The struggle, not the summit, is the answer.');
  add('Real generosity toward the future lies in giving all to the present.', 'Albert Camus', 'The Rebel', wiki('The Rebel (book)'), 1951,
    'Camus\'s argument against the revolutionary logic of "sacrifice today for tomorrow." Future generations are best served not by deferred work but by full presence in the work that is here now.');
  add('I rebel — therefore we exist.', 'Albert Camus', 'The Rebel', wiki('The Rebel (book)'), 1951,
    'Camus\'s reworking of Descartes. Solidarity is created by the act of refusal: the moment one person says no to an injustice, both the injustice and the community resisting it become real.');

  /* ── SAINT-EXUPÉRY ─────────────────────────────────────────────────── */
  add('What makes the desert beautiful is that somewhere it hides a well.', 'Antoine de Saint-Exupéry', 'The Little Prince', wiki('The Little Prince'), 1943,
    'The narrator, a pilot crashed in the Sahara, walking with the Little Prince in search of water. The line names what makes any hard landscape bearable: the suspicion that the resource exists somewhere in it, even unseen.');

  /* ── FRANKL ────────────────────────────────────────────────────────── */
  add('Everything can be taken from a man but one thing: the last of the human freedoms — to choose one\'s attitude in any given set of circumstances, to choose one\'s own way.', 'Viktor E. Frankl', "Man's Search for Meaning", wiki("Man's Search for Meaning"), 1946,
    'Frankl, an Auschwitz survivor, naming the one thing the camps couldn\'t take. His authority on this point is biographical, not philosophical — he tested it under conditions designed to disprove it.');
  add('When we are no longer able to change a situation, we are challenged to change ourselves.', 'Viktor E. Frankl', "Man's Search for Meaning", wiki("Man's Search for Meaning"), 1946,
    'Frankl\'s formulation for circumstances that cannot be exited — terminal diagnosis, irreversible loss, imprisonment. The "challenge" is the work that remains when external action is closed off.');
  add('Those who have a "why" to live, can bear with almost any "how".', 'Viktor E. Frankl', "Man's Search for Meaning", wiki("Man's Search for Meaning"), 1946,
    'Frankl quoting Nietzsche and confirming it from the camps: the prisoners who survived were those who held an unresolved purpose — a manuscript to finish, a person to find — that the camp couldn\'t reach.');

  /* ── SOLZHENITSYN ──────────────────────────────────────────────────── */
  add('The line dividing good and evil cuts through the heart of every human being.', 'Aleksandr Solzhenitsyn', 'The Gulag Archipelago', wiki('The Gulag Archipelago'), 1973,
    'Solzhenitsyn writing about his decade in the Soviet labor camps. The line refuses the comforting move of locating evil "over there." It runs through us, which means the work of resisting it is internal.');
  add('Bless you, prison, for having been in my life — for it was on the rotting prison straw that I came to understand that the object of life is not prosperity but the maturity of the human soul.', 'Aleksandr Solzhenitsyn', 'The Gulag Archipelago', wiki('The Gulag Archipelago'), 1973,
    'Solzhenitsyn\'s most disorienting line — gratitude to the system that nearly destroyed him. The argument is that comfort would not have produced what the suffering produced. He doesn\'t recommend prison; he names what prison taught.');
  add('Live not by lies.', 'Aleksandr Solzhenitsyn', 'Live Not by Lies (essay)', wiki('Live Not by Lies'), 1974,
    'Solzhenitsyn\'s parting essay to his fellow Soviets, dictated the day before his arrest and exile. His one instruction: don\'t personally help the lie. You may not be able to topple the system, but you can refuse to repeat it.');

  /* ── BECKETT ───────────────────────────────────────────────────────── */
  add('Ever tried. Ever failed. No matter. Try again. Fail again. Fail better.', 'Samuel Beckett', 'Worstward Ho', wiki('Worstward Ho'), 1983,
    'From a late, dense Beckett prose piece. The line is now reflexively quoted as motivational — but in context, "fail better" is Beckett\'s honest stance: the goal isn\'t success, it\'s a higher quality of failure each attempt.');
  add('I can\'t go on. I\'ll go on.', 'Samuel Beckett', 'The Unnamable (closing line)', wiki('The Unnamable (novel)'), 1953,
    'The very last words of the novel, in the middle of the narrator\'s endless monologue. Two sentences that don\'t resolve each other — the impossibility and the continuation, side by side. Beckett\'s entire ethos in a comma.');

  /* ── McCARTHY ──────────────────────────────────────────────────────── */
  add('You have to carry the fire.', 'Cormac McCarthy', 'The Road', wiki('The Road'), 2006,
    'The father\'s repeated instruction to his son as they push a shopping cart through the ash of a post-apocalyptic America. "The fire" is never defined and never needs to be — it\'s whatever the boy must not let go out.');
  add('Keep a little fire burning; however small, however hidden.', 'Cormac McCarthy', 'The Road', wiki('The Road'), 2006,
    'Same novel. The instruction is the practical version: not a blaze, just enough not-quite-extinguished to relight from later. A doctrine of preservation under impossible conditions.');

  /* ── RUMI ──────────────────────────────────────────────────────────── */
  add('The wound is the place where the Light enters you.', 'Rumi', 'Masnavi', wiki('Masnavi'), 1273,
    'From the Persian Sufi epic. Rumi argues that the openings in us — the places we\'ve been cracked or hurt — are not damage to be covered but apertures for something we couldn\'t otherwise receive.');

  /* ── ROBINSON ──────────────────────────────────────────────────────── */
  add('It has seemed to me sometimes as though the Lord breathes on this poor gray ember of Creation and it turns to radiance.', 'Marilynne Robinson', 'Gilead', wiki('Gilead (novel)'), 2004,
    'Reverend John Ames, the elderly Iowa pastor narrating Gilead in letters to his young son, on the experience of grace breaking into the ordinary. The motivation is the recognition that the radiance is structural — it doesn\'t require new material, just attention.');

  return Q;
})();
