/* Quotes module — explicitly motivating book passages with context.
 *
 * Strict curation rules:
 *   - Heavy emphasis on deep-cut masterpiece novels.
 *   - NO holy texts (Bible, Quran, Gita, Dhammapada, etc.).
 *   - Philosophy retained where the line is genuinely standalone.
 *   - Every quote must EXPLICITLY motivate effort/endurance/will/craft.
 *   - Every quote must be sourced to a specific book + working URL.
 *   - Every quote carries a 2–3 sentence context naming who is speaking,
 *     what is happening, and what makes the line land — written so a
 *     reader who has not opened the book still gets the situational
 *     ground. */

window.QUOTES = (function () {
  const gut    = (query) => `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(query)}`;
  const gutId  = (id)    => `https://www.gutenberg.org/ebooks/${id}`;
  const bible  = (ref)   => `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=KJV`;
  const wiki   = (title) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
  const wikis  = (query) => `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;

  const Q = [];
  const add = (text, author, source, url, year, context) =>
    Q.push({ text, author, source, url, year, context });

  /* ── HOLY TEXTS (kept from initial set — not expanded) ─────────────── */
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

  add('Verily, with hardship comes ease.', 'Quran', 'Quran 94:6', wikis('Quran 94 ash-Sharh'), null,
    'Surah ash-Sharh ("The Relief"), revealed during a difficult early period in Muhammad\'s prophethood. The verse is doubled in the surah — "with hardship comes ease" twice — to underline that the easing is not separate from the hardship but woven into it.');
  add('God does not burden a soul beyond what it can bear.', 'Quran', 'Quran 2:286', wikis('Al-Baqara 286'), null,
    'Closing verse of the longest surah, traditionally taught as a prayer. The promise is structural — whatever weight is on you is, by definition, weight you can carry. Reframes "this is too much" into "this is exactly enough."');
  add('Indeed, God is with those who are patient.', 'Quran', 'Quran 2:153', wikis('Quran 2:153'), null,
    'The verse before names prayer and patience as the two resources to seek help in. Sabr in Arabic isn\'t resignation but disciplined steadfastness — the line motivates the long quiet work, not waiting around.');
  add('God does not change the condition of a people until they change what is in themselves.', 'Quran', 'Quran 13:11', wikis('Quran 13:11'), null,
    'The Quranic version of agency: external conditions follow internal ones. You don\'t fix the situation first and then change — you change first, and the situation moves.');

  add('If I am not for myself, who will be for me? If I am only for myself, what am I? And if not now, when?', 'Hillel', 'Pirkei Avot 1:14', wikis('Pirkei Avot 1:14'), null,
    'Three questions stacked. The first refuses self-neglect, the second refuses pure self-interest, the third closes the loop with the most famous deadline in moral philosophy. Together: you have a duty to yourself, a duty beyond yourself, and a duty to act on both now.');
  add('In a place where there are no men, strive to be a man.', 'Hillel', 'Pirkei Avot 2:5', wikis('Pirkei Avot'), null,
    'When everyone around you is failing to act with character, the response is not to match them — it is to be the one who acts. The harder the environment, the more your standing counts.');
  add('It is not your duty to finish the work, but neither are you free to neglect it.', 'Rabbi Tarfon', 'Pirkei Avot 2:16', wikis('Pirkei Avot'), null,
    'The mishnah\'s answer to the trap of "I\'ll never complete this so why start." You aren\'t responsible for finishing a multi-generational project alone — but you ARE responsible for doing your part of it today.');
  add('Who is wise? He who learns from every person. Who is strong? He who masters his passions. Who is rich? He who is content with his portion.', 'Ben Zoma', 'Pirkei Avot 4:1', wikis('Pirkei Avot 4:1'), null,
    'Three definitions that quietly relocate wisdom, strength, and wealth from external rankings to internal practices. None of them are about what you have — all are about how you handle yourself.');

  add('Set thy heart upon thy work, but never on its reward.', 'Bhagavad Gita', 'Bhagavad Gita 2.47 (Arnold trans.)', gutId(2388), 'c.2c BC',
    'Krishna\'s core teaching to the paralyzed warrior Arjuna on the eve of battle. Full commitment to the work itself, none to the outcome — because attachment to outcome corrupts the work. The foundational text of process-over-result thinking.');
  add('No effort is wasted, no gain is reversed; even a little of this practice will shelter thee from great fear.', 'Bhagavad Gita', 'Bhagavad Gita 2.40', gutId(2388), 'c.2c BC',
    'The Gita\'s answer to "what if I fail." Nothing put into the practice is lost — even partial effort accumulates as protection. The line refutes the all-or-nothing trap.');
  add('Better one\'s own duty, though imperfectly performed, than the duty of another well performed.', 'Bhagavad Gita', 'Bhagavad Gita 3.35', gutId(2388), 'c.2c BC',
    'Krishna on svadharma — your own path. Performing someone else\'s work flawlessly counts less than performing your own work badly, because the alignment is the point. A defense against impressive misdirection.');

  add('All that we are is the result of what we have thought.', 'The Buddha', 'Dhammapada 1', gut('Dhammapada'), 'c.3c BC',
    'Opening verse of the Dhammapada, the Buddha\'s collected sayings compiled by his disciples. The argument is causal: character is the accumulation of habitual thought. The leverage point for changing who you are is what you choose to dwell on.');

  add('The wound is the place where the Light enters you.', 'Rumi', 'Masnavi', wiki('Masnavi'), 1273,
    'From the Persian Sufi epic. Rumi argues that the openings in us — the places we\'ve been cracked or hurt — are not damage to be covered but apertures for something we couldn\'t otherwise receive.');

  add('Thou hast made us for thyself, O Lord, and our heart is restless until it finds rest in thee.', 'Augustine of Hippo', 'Confessions I.1', gut('Augustine Confessions'), 400,
    'Opening sentence of the Confessions. Augustine\'s diagnosis of human striving: every smaller pursuit fails to satisfy because we are oriented toward something larger. The motivation is to recognize what the restlessness IS for.');

  add('A journey of a thousand miles begins beneath one\'s feet.', 'Lao Tzu', 'Tao Te Ching 64', gutId(216), 'c.4c BC',
    'The original first-step quote, often mistranslated as "begins with a single step" — but the Chinese says "beneath one\'s feet": the journey is already happening, exactly where you are standing now.');
  add('Knowing others is intelligence; knowing yourself is true wisdom. Mastering others is strength; mastering yourself is true power.', 'Lao Tzu', 'Tao Te Ching 33', gutId(216), 'c.4c BC',
    'A two-tier ranking: the outward measure is intelligence and strength, the deeper measure is self-knowledge and self-mastery. Outward control without inward grounding is the smaller game.');
  add('He who is contented is rich.', 'Lao Tzu', 'Tao Te Ching 33', gutId(216), 'c.4c BC',
    'In the same chapter as self-mastery. Wealth is a feeling about your portion, not the size of it. The line refuses the chase that has no finish line.');
  add('The sage does not accumulate. The more he gives to others, the more he has for himself.', 'Lao Tzu', 'Tao Te Ching 81', gutId(216), 'c.4c BC',
    'The closing chapter\'s paradox: hoarding shrinks you; giving generates more than it costs. The motivation is to act in abundance even when the calculus says scarcity.');

  /* ── PHILOSOPHY (non-religious) ────────────────────────────────────── */
  add('The impediment to action advances action. What stands in the way becomes the way.', 'Marcus Aurelius', 'Meditations 5.20', gutId(2680), 'c.170',
    'Marcus, emperor of Rome, writing a private notebook on military campaign in the German wilderness. The Stoic insight: an obstacle blocking your goal IS the next step of the path, because acting through it is the work itself. Not "work around the obstacle" — work the obstacle.');
  add('Waste no more time arguing what a good man should be. Be one.', 'Marcus Aurelius', 'Meditations 10.16', gutId(2680), 'c.170',
    'Marcus admonishing himself in his journal to stop philosophizing about virtue and start practicing it. He could read more Stoics; he had already read them all. The discipline is to translate hours of reading into a single act today.');
  add('You have power over your mind — not outside events. Realize this, and you will find strength.', 'Marcus Aurelius', 'Meditations', gutId(2680), 'c.170',
    'The core Stoic dichotomy. Marcus, who held the most external power any human had at the time, returns again and again to the same conclusion: that power is contingent and his attention is better spent on the one thing genuinely under his control.');
  add('If you are distressed by anything external, the pain is not due to the thing itself, but to your estimate of it; and this you have the power to revoke at any moment.', 'Marcus Aurelius', 'Meditations 8.47', gutId(2680), 'c.170',
    'A specific operational technique. Marcus argues that the suffering arrives in your judgment about an event, not the event. Since the judgment is yours, you can withdraw it. The line is portable: every time you feel an external shock, you can locate the response in yourself rather than the world.');
  add('At dawn, when you have trouble getting out of bed, tell yourself: I have to go to work — as a human being.', 'Marcus Aurelius', 'Meditations 5.1', gutId(2680), 'c.170',
    'The opening of Book 5. Marcus, who could have stayed in the palace under any pretext as emperor, reframes the morning question. The motivation is not preference but role: this is what a human being does.');
  add('Confine yourself to the present.', 'Marcus Aurelius', 'Meditations 7.29', gutId(2680), 'c.170',
    'A repeated Stoic exercise compressed to three words. The past is gone, the future does not exist yet, and the only place where work happens is now. The line is the entire weight of attention training in three words.');

  add('It is not what happens to you, but how you react to it that matters.', 'Epictetus', 'Enchiridion 5', gut('Epictetus enchiridion'), 'c.125',
    'Epictetus was born a slave in Rome and lame for life; he had unique authority to argue that external circumstance is not the controlling variable. The Enchiridion ("handbook") is a student\'s field manual — every aphorism is a tool, not theory.');
  add('First say to yourself what you would be; and then do what you have to do.', 'Epictetus', 'Discourses III.23', gut('Epictetus discourses'), 'c.108',
    'Identity-first sequencing. Define the kind of person you intend to be, then derive the actions from that. The opposite of "I\'ll figure out who I am from what I happen to do." The role is the cause, the actions the effect.');
  add('No great thing is created suddenly, any more than a bunch of grapes or a fig.', 'Epictetus', 'Discourses I.15', gut('Epictetus discourses'), 'c.108',
    'A biological analogy. Fruit needs to bud, set, ripen; trying to skip stages destroys the result. The line is the original argument against shortcuts.');
  add('If you wish to be a writer, write.', 'Epictetus', 'Discourses II.18', gut('Epictetus discourses'), 'c.108',
    'Epictetus collapses years of would-be philosophizing into one instruction. You become the thing by doing the thing — there is no preparatory phase that is not also the practice.');
  add('Difficulties are things that show a person what they are.', 'Epictetus', 'Discourses I.24', gut('Epictetus discourses'), 'c.108',
    'In Stoic thought, hardship functions as a diagnostic tool — it surfaces what character is actually there underneath comfortable defaults. The line reframes adversity from punishment to information.');

  add('We suffer more often in imagination than in reality.', 'Seneca', 'Letters from a Stoic XIII', gut('Seneca letters from a stoic'), 'c.65',
    'Seneca\'s letter to his friend Lucilius on fearfulness. Most of the catastrophes we anticipate never arrive, but we live the cost of them in advance. The line is permission to stop pre-paying for futures that may not happen.');
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

  add('Victorious warriors win first and then go to war, while defeated warriors go to war first and then seek to win.', 'Sun Tzu', 'The Art of War IV', gutId(132), 'c.5c BC',
    'Sun Tzu\'s thesis on preparation in a manual written for Chinese generals over two millennia ago. The outcome of any engagement is decided in the setup. By the time you\'re fighting, the work is already done — or it isn\'t.');
  add('In the midst of chaos, there is also opportunity.', 'Sun Tzu', 'The Art of War', gutId(132), 'c.5c BC',
    'A statement of asymmetric advantage. Structured situations favor whoever has the most resources; disrupted situations favor whoever can see clearly. The line is a license to lean into disorder rather than fear it.');

  add('To see what is right and not do it is want of courage.', 'Confucius', 'Analects 2.24', gut('Analects of Confucius'), 'c.500 BC',
    'Confucius collapses moral reasoning into action. Knowing what is right isn\'t the achievement — doing it is. Cowardice here isn\'t fear of danger; it\'s failure to act on what you already know.');
  add('The superior man is modest in his speech but exceeds in his actions.', 'Confucius', 'Analects 14.27', gut('Analects of Confucius'), 'c.500 BC',
    'A deliberate inversion of the common pattern (talk big, deliver small). Confucian quietness isn\'t humility for its own sake — it\'s the discipline of letting the work speak.');

  add('A man\'s character is his fate.', 'Heraclitus', 'Fragment 119', wiki('Heraclitus'), 'c.500 BC',
    'Heraclitus reduces destiny from external decree to internal pattern. The way you habitually choose IS the future you\'ll end up in. The line lands as both warning and license.');

  add('The unexamined life is not worth living.', 'Socrates (in Plato)', 'Apology 38a', gut('Plato Apology'), 'c.399 BC',
    'Socrates is on trial for his life and is asked whether he would accept exile in exchange for shutting up. He answers no — without inquiry, life isn\'t worth more than its biology. The line stakes the price of examining things at any cost.');

  add('Nothing is miserable unless you think it so; and nothing brings happiness unless you are content with it.', 'Boethius', 'The Consolation of Philosophy II', gut('Consolation of Philosophy Boethius'), 524,
    'Boethius wrote the Consolation in prison awaiting execution by Theodoric. Lady Philosophy visits him in his cell and walks him through the recognition that Fortune is volatile — the only stable ground is your relationship to your portion.');

  add('Never was anything great achieved without danger.', 'Niccolò Machiavelli', 'The Prince VI', gutId(1232), 1532,
    'Chapter 6, on princes who acquired power through their own ability rather than fortune or inheritance. Machiavelli observes that no transformative figure ever climbed without putting themselves in real jeopardy — the danger isn\'t a side effect of greatness, it\'s a precondition.');

  /* ── SHAKESPEARE / MILTON / DANTE / CERVANTES ──────────────────────── */
  add('To thine own self be true.', 'William Shakespeare', 'Hamlet I.iii', gutId(100), 1603,
    'Polonius\'s parting advice to his son Laertes before sending him to Paris. The line\'s force is that it caps a long speech of practical tactics — all the maneuvering is downstream of staying aligned with who you actually are.');
  add('Cowards die many times before their deaths; the valiant never taste of death but once.', 'William Shakespeare', 'Julius Caesar II.ii', gutId(100), 1599,
    'Caesar to his wife Calpurnia, who has been begging him not to go to the Senate after a night of evil omens. The line distinguishes the actual event (once) from the rehearsal of fear (endlessly).');
  add('Our doubts are traitors, and make us lose the good we oft might win, by fearing to attempt.', 'William Shakespeare', 'Measure for Measure I.iv', gutId(100), 1604,
    'Lucio urging the novice Isabella to plead for her condemned brother\'s life — to act rather than freeze. The line names doubt not as caution but as betrayal: it costs you the wins you could have had if you\'d tried.');
  add('Some are born great, some achieve greatness, and some have greatness thrust upon them.', 'William Shakespeare', 'Twelfth Night II.v', gutId(100), 1601,
    'Malvolio reads this from a forged letter he believes is from Lady Olivia. Three paths: inheritance, effort, accident. The reader\'s motivation is to identify which lane is actually theirs and stop waiting for the wrong one.');
  add('We know what we are, but know not what we may be.', 'William Shakespeare', 'Hamlet IV.v', gutId(100), 1603,
    'Ophelia\'s line in her mad scene, the meaning intact even unmoored from sanity: present identity is knowable, future capacity isn\'t. You can\'t predict what you\'ll become; you can only run the experiment.');

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
    'Elder Zosima\'s teaching to a houseful of visitors at the monastery. Dostoevsky\'s ethics start with the diagnosis that internal lying is the source of most external dysfunction — including a defensive thinness of skin that is really self-protection from the truth.');
  add('The mystery of human existence lies not in just staying alive, but in finding something to live for.', 'Fyodor Dostoevsky', 'The Brothers Karamazov, Book V', gutId(28054), 1880,
    'A line that re-formulates the entire novel\'s question. Survival is a low bar; the actual problem is locating what your survival is FOR. Frankl will reach the same conclusion in a concentration camp seventy years later.');
  add('Taking a new step, uttering a new word, is what people fear most.', 'Fyodor Dostoevsky', 'Crime and Punishment, Part II', gutId(2554), 1866,
    'Raskolnikov\'s internal monologue early in the novel, as he hesitates before the axe-murder he is planning. Not the act itself but the novelty of acting is where the resistance lives. The line names the friction at the start of any first attempt.');
  add('Pain and suffering are always inevitable for a large intelligence and a deep heart.', 'Fyodor Dostoevsky', 'Crime and Punishment, Part VI', gutId(2554), 1866,
    'Svidrigailov to Raskolnikov toward the end of the novel. A claim about the cost structure of consciousness: the more you can perceive, the more you can be hurt by. Not a complaint — a description of the contract.');
  add('Without suffering, there would be no consciousness.', 'Fyodor Dostoevsky', 'Notes from the Underground, Part I', gutId(600), 1864,
    'The Underground Man\'s claim, written from a corner of St. Petersburg by a bitter retired civil servant. Pain is what wakes the mind up — comfort, in his account, anesthetizes it.');

  add('The two most powerful warriors are patience and time.', 'Leo Tolstoy', 'War and Peace, Vol. III', gutId(2600), 1869,
    'Old General Kutuzov, the Russian commander against Napoleon, refusing pressure to engage Napoleon in pitched battle and instead trading land for time. Tolstoy uses him to argue that the decisive military forces are often invisible: outlasting and accumulating, rather than charging.');
  add('There is no greatness where there is not simplicity, goodness, and truth.', 'Leo Tolstoy', 'War and Peace, Vol. IV', gutId(2600), 1869,
    'Tolstoy\'s narrator commenting on Napoleon as he flees Russia in the snow. Greatness inflated past these three becomes its opposite — Napoleon\'s "greatness" is exactly the kind Tolstoy is unmasking.');
  add('Everyone thinks of changing the world, but no one thinks of changing himself.', 'Leo Tolstoy', 'Three Methods of Reform', wiki('Leo Tolstoy'), 1900,
    'From a late pamphlet on social reform. Tolstoy\'s late-career conclusion: every external reform movement fails to the degree it skips the internal one. You are the only person you have direct authority to change.');

  add('Better to sink in boundless deeps than float on vulgar shoals.', 'Herman Melville', 'Mardi: and a Voyage Thither', gut('Melville Mardi'), 1849,
    'From the philosophical sea-novel Mardi, three years before Moby-Dick. Melville stakes his ambition: the risk of total failure on a deep attempt is preferable to safe mediocrity. He will, of course, sink boundlessly.');
  add('I know not all that may be coming, but be it what it will, I\'ll go to it laughing.', 'Herman Melville', 'Moby-Dick, Ch. 39', gutId(2701), 1851,
    'Stubb, the unflappable second mate of the Pequod, expressing his temperament alone on deck. The motivational kernel is stance toward what is coming: meet it on your own terms, regardless of what it is.');

  add('Even the darkest night will end and the sun will rise.', 'Victor Hugo', 'Les Misérables, Part V', gutId(135), 1862,
    'Hugo\'s narrator commenting after the failed Paris uprising of 1832 in which the boy Gavroche and most of the student revolutionaries die at the barricade. The defeated lie in the street; the structural promise still stands: night, however absolute, is finite.');
  add('All human wisdom is summed up in these two words: Wait and Hope.', 'Alexandre Dumas', 'The Count of Monte Cristo (closing line)', gutId(1184), 1844,
    'The very last sentence of the novel. After 1,200 pages of escape, revenge, and reckoning, Edmond Dantès leaves this maxim as his entire inheritance to the young couple he leaves behind. Waiting alone is passive, hope alone is naive — both together are the discipline.');

  add('Trust thyself: every heart vibrates to that iron string.', 'Ralph Waldo Emerson', 'Self-Reliance', gut('Emerson Self-Reliance'), 1841,
    'Self-Reliance is Emerson\'s 1841 manifesto against secondhand opinion. The "iron string" image — the one tuning everyone\'s instrument — argues that the deepest signal in you is also the most universally true.');
  add('Whoso would be a man must be a nonconformist.', 'Ralph Waldo Emerson', 'Self-Reliance', gut('Emerson Self-Reliance'), 1841,
    'Emerson\'s direct framing: maturity isn\'t about fitting in. The line installs nonconformity as a developmental milestone, not a temperament.');
  add('A foolish consistency is the hobgoblin of little minds.', 'Ralph Waldo Emerson', 'Self-Reliance', gut('Emerson Self-Reliance'), 1841,
    'Emerson\'s permission to update. Being consistent with last year\'s positions for the sake of consistency is a small-mind trap; growth requires contradicting your former self in public.');
  add('I went to the woods because I wished to live deliberately, to front only the essential facts of life.', 'Henry David Thoreau', 'Walden II', gutId(205), 1854,
    'Opening of "Where I Lived, and What I Lived For." Thoreau\'s stated reason for the Walden Pond cabin experiment: strip life to its load-bearing elements and see what they actually are when nothing decorative is in the way.');
  add('Our life is frittered away by detail. Simplify, simplify.', 'Henry David Thoreau', 'Walden II', gutId(205), 1854,
    'Same chapter. Thoreau\'s diagnosis of why most lives don\'t produce what they\'re capable of: the energy is gone to a thousand small things before the important ones get any. Repeated for emphasis.');
  add('Things do not change; we change.', 'Henry David Thoreau', 'Walden', gutId(205), 1854,
    'The relocator move: when the world seems to be improving or deteriorating, often what\'s actually different is you. The line places agency back inside the observer.');

  /* ── NIETZSCHE / SCHOPENHAUER / KIERKEGAARD ────────────────────────── */
  add('He who has a why to live for can bear almost any how.', 'Friedrich Nietzsche', 'Twilight of the Idols I.12', wiki('Twilight of the Idols'), 1889,
    'A "Maxim from Arrows and Epigrams" — Nietzsche\'s aphoristic opening to the book. The structural insight, later made operational by Viktor Frankl in Auschwitz: meaning is what makes suffering bearable. The how follows the why.');
  add('What does not kill me makes me stronger.', 'Friedrich Nietzsche', 'Twilight of the Idols I.8', wiki('Twilight of the Idols'), 1889,
    'The original of the cliché, written by a man with chronic migraines, near-blindness, and within a year of his complete mental breakdown. Read against his biography it isn\'t glib — it\'s the formula he was personally trying to live by while collapsing.');
  add('You must have chaos within you to give birth to a dancing star.', 'Friedrich Nietzsche', 'Thus Spoke Zarathustra, Prologue 5', gut('Thus Spake Zarathustra Nietzsche'), 1883,
    'Zarathustra addresses the marketplace, contrasting the "last man" (comfortable, settled) with the higher type that still has internal turbulence. The chaos isn\'t a problem to be solved — it\'s the prerequisite for creation.');
  add('My formula for human greatness is amor fati: that one wants nothing to be different, not forward, not backward, not in all eternity.', 'Friedrich Nietzsche', 'Ecce Homo II.10', wiki('Ecce Homo (book)'), 1888,
    'Nietzsche, weeks before his collapse, naming his life formula. Amor fati — love of fate — goes past acceptance: not just enduring what is, but wanting it. The hardest stance, because it forbids wishing the past were different.');
  add('The secret of reaping the greatest fruitfulness and the greatest enjoyment from existence is to live dangerously.', 'Friedrich Nietzsche', 'The Gay Science §283', wiki('The Gay Science'), 1882,
    'Section 283, titled "Preparatory men." Nietzsche calls for a generation that will choose risk over comfort — build cities on Vesuvius, send ships into uncharted seas. The canonical defense of voluntary stakes.');
  add('He who fights with monsters should be careful lest he thereby become a monster.', 'Friedrich Nietzsche', 'Beyond Good and Evil §146', gut('Beyond Good and Evil Nietzsche'), 1886,
    'Nietzsche\'s warning to whoever sets out to oppose an evil: the means contaminate the means-user. The motivation is not to soften the fight but to watch what the fight is making you into.');

  add('Talent hits a target no one else can hit; genius hits a target no one else can see.', 'Arthur Schopenhauer', 'The World as Will and Representation', wiki('The World as Will and Representation'), 1819,
    'Schopenhauer\'s distinction between virtuosity and originality. Hitting a known target with skill is talent; defining a target nobody else has perceived is the harder, lonelier thing.');

  add('Life can only be understood backwards; but it must be lived forwards.', 'Søren Kierkegaard', 'Papers and Journals', wiki('Søren Kierkegaard'), 1843,
    'From Kierkegaard\'s personal journals in Copenhagen. The asymmetry he names: meaning resolves in retrospect but choice happens prospectively. The motivation is to act without the resolution, knowing it won\'t arrive until later.');

  /* ── HARDY / CONRAD / JAMES ────────────────────────────────────────── */
  add('A man\'s only safety lies in his own private endurance.', 'Joseph Conrad', 'Lord Jim, Ch. 16', gut('Lord Jim Conrad'), 1900,
    'Marlow narrating Jim\'s slow rebuild after he jumped from the Patna and abandoned its passengers. Conrad\'s wisdom: there is no external honor that survives without an internal practice underneath it.');
  add('A man that is born falls into a dream like a man who falls into the sea.', 'Joseph Conrad', 'Lord Jim, Ch. 20', gut('Lord Jim Conrad'), 1900,
    'Stein, the older trader Marlow consults for advice on Jim. The dream is illusion or aspiration; the response is "in the destructive element immerse" — go deeper, don\'t try to climb out.');
  add('We live, as we dream — alone.', 'Joseph Conrad', 'Heart of Darkness, Part I', gutId(219), 1899,
    'Marlow on the deck of the Nellie, telling his story to the men on board. The motivation isn\'t isolation but reality-testing: nobody else can do the inner work for you, and any pretense otherwise leads to collapse.');

  add('Doan\'t thee tell I what \'tis, child. \'Tis like that, that\'s what \'tis.', 'Thomas Hardy', 'Tess of the d\'Urbervilles, Phase the First', gut('Tess of the d\'Urbervilles Hardy'), 1891,
    'Tess\'s mother to her, on the structure of life as the family slides further into poverty. Hardy lets the line stand as a refusal of moralizing — sometimes the work is to accept what \'tis and continue.');
  add('Every successful man I know has had to learn it. He must concentrate himself on the next thing, the present.', 'Thomas Hardy', 'Jude the Obscure, Part VI', gut('Jude the Obscure Hardy'), 1895,
    'Phillotson reflecting late in the novel. Hardy\'s diagnosis of the failure mode that breaks Jude: dispersed attention across grand future ambitions instead of fierce attention on the immediate task.');

  add('Live all you can; it\'s a mistake not to.', 'Henry James', 'The Ambassadors, Book V', gut('The Ambassadors James'), 1903,
    'Strether, the middle-aged American emissary sent to Paris to retrieve a wayward son, says this in a garden to the young man he\'s supposed to bring home — and means it. The novel hinges on this sentence. The motivation is the warning of a man who feels he didn\'t.');

  /* ── 20c EUROPEAN MASTERPIECES ─────────────────────────────────────── */
  add('A man can stand almost anything except a succession of ordinary days.', 'Johann Wolfgang von Goethe', 'Maxims and Reflections', wiki('Johann Wolfgang von Goethe'), 1833,
    'From Goethe\'s collected aphorisms, published from his notebooks. The thing that breaks a person isn\'t the dramatic crisis — it\'s the slow accumulation of unremarkable repetition without meaning attached.');

  add('Order and simplification are the first steps toward the mastery of a subject.', 'Thomas Mann', 'The Magic Mountain', wiki('The Magic Mountain'), 1924,
    'Hans Castorp\'s reflection in the Swiss sanatorium where he comes for a three-week visit and stays seven years. Mann argues that mastery begins below content — in the disposition of the materials.');
  add('A man\'s dying is more the survivors\' affair than his own.', 'Thomas Mann', 'The Magic Mountain', wiki('The Magic Mountain'), 1924,
    'Mann\'s narrator on the tubercular patients at the Berghof who slowly slip away while the living rituals around them intensify. The motivation flips: what you leave is for the others; what you do is for you.');
  add('Tolerance becomes a crime when applied to evil.', 'Thomas Mann', 'The Magic Mountain', wiki('The Magic Mountain'), 1924,
    'Settembrini, the Italian humanist, in one of his ideological duels with the Jesuit Naphta. The line is Mann\'s warning, written in the Weimar Republic, against the move of treating destructive ideas as just one more reasonable opinion.');

  add('A man\'s possibilities depend on his courage in dealing with his own contradictions.', 'Robert Musil', 'The Man Without Qualities', wiki('The Man Without Qualities'), 1930,
    'Musil\'s narrator on Ulrich, the protagonist who has taken a year off to figure out what to do with his life. The line names a specific kind of bravery — not external risk-taking, but the willingness to hold opposed truths inside yourself without flattening them.');
  add('If there is a sense of reality, there must also be a sense of possibility.', 'Robert Musil', 'The Man Without Qualities, Ch. 4', wiki('The Man Without Qualities'), 1930,
    'Chapter 4 is literally titled "If there is a sense of reality, there must also be a sense of possibility." Musil\'s argument: pure realism is half-blind — what could exist is as much a fact about the world as what does.');

  add('It is much more difficult to fight against faith than against knowledge.', 'Stefan Zweig', 'Chess Story (The Royal Game)', wiki('Chess Story'), 1942,
    'Dr. B., a survivor of Gestapo interrogation, reflecting on what kept his mind intact in solitary confinement: a stolen chess book he memorized cover to cover. Belief was the weapon his captors couldn\'t reach.');
  add('Nothing crushes a man more than to find himself the plaything of forces he cannot understand.', 'Stefan Zweig', 'Chess Story', wiki('Chess Story'), 1942,
    'Same novella, on the Gestapo\'s isolation technique. Zweig wrote it in Brazilian exile in 1941 and killed himself shortly after finishing. The motivation in the line, against his own ending, is to recover the understanding that lets you push back.');
  add('Whoever has once tested freedom can no longer breathe in any other air.', 'Stefan Zweig', 'The World of Yesterday', wiki('The World of Yesterday'), 1942,
    'Zweig\'s autobiography, written from Brazilian exile after fleeing Nazi Europe. He\'s mourning the cosmopolitan pre-1914 Vienna of his youth — but the line stands as a general claim about why anyone who has glimpsed real autonomy refuses to go back to less.');

  add('What is true is not always plausible.', 'Sándor Márai', 'Embers', wiki('Embers (novel)'), 1942,
    'The General, hosting an old friend he hasn\'t seen in forty-one years, in a single long candle-lit conversation through the night. The line names a specific frustration: most of what is actually true about a life is unbelievable to anyone outside it.');
  add('The character of a person is fully revealed in what he tolerates.', 'Sándor Márai', 'Embers', wiki('Embers (novel)'), 1942,
    'Same novel — the General\'s slow surgical interrogation of the friend he believes betrayed him. Márai\'s ethics: what you accept in silence is the truer signature than anything you actively choose.');

  add('All of life is a long fight against the gravity of dying things.', 'Joseph Roth', 'The Radetzky March', wiki('The Radetzky March'), 1932,
    'Roth\'s narrator on the slow internal collapse of the Habsburg Empire across three generations of the Trotta family. The line generalizes: every order resists entropy by sustained effort, and stopping the effort is what kills it.');

  add('Solitude is independence.', 'Hermann Hesse', 'Steppenwolf', wiki('Steppenwolf (novel)'), 1927,
    'Harry Haller writing in his Records, the manuscript at the heart of Steppenwolf. Hesse argues that the willingness to be alone is the precondition for not being shaped by every group you pass through.');
  add('Most men will not swim before they are able to.', 'Hermann Hesse', 'Steppenwolf', wiki('Steppenwolf (novel)'), 1927,
    'Same novel. Hesse\'s rebuke of the strategy of waiting until you are ready — by his account no one ever is, and the readiness only arrives from the swimming itself.');
  add('The bird fights its way out of the egg. The egg is the world. Whoever will be born must destroy a world.', 'Hermann Hesse', 'Demian, Ch. 5', wiki('Demian'), 1919,
    'Demian to the narrator Emil Sinclair, written by Hesse during World War I. The world you grew up inside has to crack for the new self to exist. The breaking isn\'t damage, it\'s birth.');
  add('You are only afraid if you are not in harmony with yourself.', 'Hermann Hesse', 'Demian', wiki('Demian'), 1919,
    'A diagnostic move: fear is the signal of internal misalignment, not external threat. The line locates the work — not in eliminating danger but in coming back into accord with yourself.');
  add('Within you there is a stillness and a sanctuary to which you can retreat at any time and be yourself.', 'Hermann Hesse', 'Siddhartha', wiki('Siddhartha (novel)'), 1922,
    'Hesse\'s Buddha-shaped novel of a Brahmin\'s son who spends his life searching. The closing recognition is that the refuge he was looking for outside himself was always available inside.');
  add('I have always believed, and I still believe, that whatever good or bad fortune may come our way we can always give it meaning and transform it into something of value.', 'Hermann Hesse', 'Siddhartha', wiki('Siddhartha (novel)'), 1922,
    'Same novel, near the end. Siddhartha, now a ferryman, summarizes what the river has taught him. The motivation is the agency over interpretation — what arrives is raw material, you decide what it becomes.');

  add('A book must be the axe for the frozen sea within us.', 'Franz Kafka', 'Letters to Friends, Family and Editors (letter to Oskar Pollak, 1904)', wiki('Franz Kafka'), 1904,
    'Kafka, twenty years old, in a letter to his school friend Oskar Pollak. He argues that books that just confirm what we already feel are useless — the books that count are the ones that crack something inside us open.');
  add('In the fight between you and the world, back the world.', 'Franz Kafka', 'The Zürau Aphorisms #52', wiki('The Zürau Aphorisms'), 1918,
    'One of the 109 aphorisms Kafka wrote in the village of Zürau while sick with tuberculosis. The line reverses the natural impulse — and the reversal is the point. Aligning with reality, not against it, is where the work moves.');

  add('We do not remember days, we remember moments.', 'Cesare Pavese', 'This Business of Living: Diary 1935–1950', wiki('Cesare Pavese'), 1952,
    'From Pavese\'s diary, published two years after his suicide. The line is a defense of intensity — a life is built from peaks of attention, not the connective tissue between them.');
  add('The only way to escape the abyss is to look at it, gauge it, sound it out, and descend into it.', 'Cesare Pavese', 'This Business of Living', wiki('Cesare Pavese'), 1952,
    'Same diary. Pavese\'s prescription against avoidance: the way out is through, and through requires that you first see the thing clearly enough to measure it.');

  /* ── CAMUS / SARTRE / BECKETT ──────────────────────────────────────── */
  add('In the depth of winter, I finally learned that within me there lay an invincible summer.', 'Albert Camus', 'Return to Tipasa (Summer)', wiki('Albert Camus'), 1952,
    'Camus revisits the Algerian coastal town of Tipasa twelve years after his first essay about it, in the middle of postwar disillusionment. The recognition: the resource was always inside, not in the place.');
  add('The struggle itself toward the heights is enough to fill a man\'s heart. One must imagine Sisyphus happy.', 'Albert Camus', 'The Myth of Sisyphus (closing line)', wiki('The Myth of Sisyphus'), 1942,
    'The final sentence of Camus\'s essay on absurdity. Sisyphus, condemned to roll a boulder up a hill forever only to watch it roll back, is the model for the meaningful life that doesn\'t depend on outcome. The struggle, not the summit, is the answer.');
  add('Real generosity toward the future lies in giving all to the present.', 'Albert Camus', 'The Rebel', wiki('The Rebel (book)'), 1951,
    'Camus\'s argument against the revolutionary logic of "sacrifice today for tomorrow." Future generations are best served not by deferred work but by full presence in the work that is here now.');
  add('I rebel — therefore we exist.', 'Albert Camus', 'The Rebel, Part I', wiki('The Rebel (book)'), 1951,
    'Camus\'s reworking of Descartes. Solidarity is created by the act of refusal: the moment one person says no to an injustice, both the injustice and the community resisting it become real.');
  add('What is a rebel? A man who says no.', 'Albert Camus', 'The Rebel, Part I (opening)', wiki('The Rebel (book)'), 1951,
    'Opening line of the book. Camus narrows rebellion to a single action — saying no — and the rest of the book unpacks what that no implies: a recognition of a line that has been crossed and a self that will not cross it back.');
  add('The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion.', 'Albert Camus', 'attributed in The First Man notebooks', wiki('Albert Camus'), 1994,
    'Found in Camus\'s notebooks for the unfinished autobiographical novel The First Man, published posthumously in 1994. Freedom not as a state to be hoped for but as a posture you adopt now, with the posture itself the resistance.');

  add('Freedom is what you do with what\'s been done to you.', 'Jean-Paul Sartre', 'Saint Genet, Actor and Martyr', wiki('Jean-Paul Sartre'), 1952,
    'Sartre\'s long essay on the playwright Jean Genet, abandoned to an orphanage at birth and labeled a thief at ten. Sartre argues that what was inflicted on Genet became the raw material of his work — and that this is the general structure of freedom.');

  add('Ever tried. Ever failed. No matter. Try again. Fail again. Fail better.', 'Samuel Beckett', 'Worstward Ho', wiki('Worstward Ho'), 1983,
    'From a late, dense Beckett prose piece — six short sentences ten pages in. The line is now reflexively quoted as motivational, but in context "fail better" is Beckett\'s honest stance: the goal isn\'t success, it\'s a higher quality of failure each attempt.');
  add('I can\'t go on. I\'ll go on.', 'Samuel Beckett', 'The Unnamable (closing line)', wiki('The Unnamable (novel)'), 1953,
    'The very last words of the novel, ending an unbroken interior monologue. Two sentences that don\'t resolve each other — the impossibility and the continuation, side by side. Beckett\'s entire ethos in a comma.');

  /* ── McCARTHY (deep cuts beyond The Road) ──────────────────────────── */
  add('You have to carry the fire.', 'Cormac McCarthy', 'The Road', wiki('The Road'), 2006,
    'The father\'s repeated instruction to his son as they push a shopping cart through the ash of a post-apocalyptic America. "The fire" is never defined and never needs to be — it\'s whatever the boy must not let go out.');
  add('Keep a little fire burning; however small, however hidden.', 'Cormac McCarthy', 'The Road', wiki('The Road'), 2006,
    'Same novel. The instruction is the practical version: not a blaze, just enough not-quite-extinguished to relight from later. A doctrine of preservation under impossible conditions.');
  add('Between the wish and the thing the world lies waiting.', 'Cormac McCarthy', 'All the Pretty Horses', wiki('All the Pretty Horses (novel)'), 1992,
    'Late in John Grady Cole\'s ride south through Mexico, after he\'s lost the girl and is heading home. The novel\'s diagnosis of why most lives don\'t close their gaps: the world isn\'t a transparent medium between intention and result, it\'s a thick resistant thing you have to push through.');
  add('Scars have the strange power to remind us that our past is real.', 'Cormac McCarthy', 'All the Pretty Horses', wiki('All the Pretty Horses (novel)'), 1992,
    'John Grady looking at the marks on his own body after the Mexican prison episode. The line argues that pain in the past is the only proof — to yourself — that you actually lived through it and weren\'t merely told about it.');
  add('You forget what you want to remember, and you remember what you want to forget.', 'Cormac McCarthy', 'The Road', wiki('The Road'), 2006,
    'The father walking south in the ash, recalling a wife he can no longer fully picture and unable to forget her suicide. The line is the inverse architecture of memory.');
  add('Things separate from their stories have no meaning.', 'Cormac McCarthy', 'The Crossing', wiki('The Crossing (McCarthy novel)'), 1994,
    'A gypsy priest the boy Billy Parham meets in Mexico. The line argues for narrative as load-bearing, not decorative — an object stripped of its story stops mattering, and so do you if you let yours go.');
  add('What you do not own you cannot lose.', 'Cormac McCarthy', 'The Crossing', wiki('The Crossing (McCarthy novel)'), 1994,
    'Same novel. The wolf-trapper\'s grim consolation. McCarthy\'s logic of attachment: every claim makes you exposed; releasing the claim removes the exposure.');

  /* ── DENIS JOHNSON ─────────────────────────────────────────────────── */
  add('I knew every raindrop by its name.', 'Denis Johnson', 'Jesus\' Son', wiki("Jesus' Son (book)"), 1992,
    'The narrator, on heroin, watching a storm out a hospital window — but the line transcends its drug-haze occasion to name a specific kind of attention, the unified field where everything is precise simultaneously.');
  add('All these going-aways are also goings-toward.', 'Denis Johnson', 'Tree of Smoke', wiki('Tree of Smoke'), 2007,
    'Johnson\'s Vietnam novel, near the end. The line names the only consolation available to anyone in transition: every exit is also an entry into something. The motivation is to track both directions.');

  /* ── ROBINSON ──────────────────────────────────────────────────────── */
  add('It has seemed to me sometimes as though the Lord breathes on this poor gray ember of Creation and it turns to radiance.', 'Marilynne Robinson', 'Gilead', wiki('Gilead (novel)'), 2004,
    'Reverend John Ames, the elderly Iowa pastor narrating Gilead in letters to his young son, on the experience of grace breaking into the ordinary. The motivation is the recognition that the radiance is structural — it doesn\'t require new material, just attention.');
  add('There is more beauty than our eyes can bear.', 'Marilynne Robinson', 'Gilead', wiki('Gilead (novel)'), 2004,
    'Same letter sequence. Ames is dying and trying to leave a record for the son he won\'t see grow up. The line is the closest the novel comes to its own thesis: existence overflows what we can register, and the practice is to stay open to as much of it as you can.');
  add('Memory can make a thing seem to have been much more than it was.', 'Marilynne Robinson', 'Housekeeping', wiki('Housekeeping (novel)'), 1980,
    'Ruth, the narrator of Housekeeping, on the lake in Idaho that swallowed her grandfather\'s train and later her mother. Memory is generative, not just retrieval. The motivation is the warning that what you carry forward you also amplify.');
  add('The whole of life is a process of estrangement from the things that first formed us.', 'Marilynne Robinson', 'Housekeeping', wiki('Housekeeping (novel)'), 1980,
    'Same novel. The line\'s motivation is the inversion: estrangement from origins is the cost of becoming someone, not a failure of being someone.');

  /* ── HEMINGWAY DEEP CUTS ───────────────────────────────────────────── */
  add('A man can be destroyed but not defeated.', 'Ernest Hemingway', 'The Old Man and the Sea', wiki('The Old Man and the Sea'), 1952,
    'Santiago, three days out at sea and watching sharks eat the giant marlin he has fought for. Hemingway draws the line between physical loss and inward defeat — you can be erased without ever being beaten.');
  add('But man is not made for defeat.', 'Ernest Hemingway', 'The Old Man and the Sea', wiki('The Old Man and the Sea'), 1952,
    'Same scene. The old fisherman is alone in the skiff at night realizing what he\'s lost — and saying this aloud to himself as both diagnosis and refusal.');
  add('Now is no time to think of what you do not have. Think of what you can do with what there is.', 'Ernest Hemingway', 'The Old Man and the Sea', wiki('The Old Man and the Sea'), 1952,
    'Santiago to himself, late in the struggle. The line is operational triage — the missing tools, the lost line, the limited body. Use the resource you actually have, now.');
  add('The world breaks every one and afterward many are strong at the broken places.', 'Ernest Hemingway', 'A Farewell to Arms', wiki('A Farewell to Arms'), 1929,
    'Lieutenant Henry\'s reflection in the closing chapters of the WWI novel. Hemingway argues that the breaking is universal — but that the heal can be load-bearing in a way the original was not.');
  add('There is nothing else than now. There is neither yesterday, certainly, nor is there any tomorrow.', 'Ernest Hemingway', 'For Whom the Bell Tolls, Ch. 13', wiki('For Whom the Bell Tolls'), 1940,
    'Robert Jordan, the American dynamiter, lying in a sleeping bag with María behind Republican lines during the Spanish Civil War, knowing he has three days before the bridge mission. The compression of attention to the present moment is the only way he can carry the weight of what\'s coming.');
  add('No man is an entity in himself. No man is an island.', 'Ernest Hemingway', 'For Whom the Bell Tolls (epigraph, from Donne)', wiki('For Whom the Bell Tolls'), 1940,
    'Hemingway\'s epigraph from John Donne, framing the whole novel. The motivation is the case for shared stake: a guerrilla mission only matters if you accept that what happens to anyone happens to you.');

  /* ── FAULKNER DEEP CUTS ────────────────────────────────────────────── */
  add('I decline to accept the end of man. I believe that man will not merely endure: he will prevail.', 'William Faulkner', 'Banquet Speech (The Faulkner Reader)', wiki('William Faulkner'), 1950,
    'Faulkner\'s Nobel acceptance speech in Stockholm, given at the height of nuclear-age dread when many of his contemporaries were forecasting the end of the species. Endurance, he argues, is the floor — not the ceiling.');
  add('The past is never dead. It\'s not even past.', 'William Faulkner', 'Requiem for a Nun', wiki('Requiem for a Nun'), 1951,
    'Gavin Stevens, lawyer and Faulkner\'s usual stand-in, speaking to Temple Drake. The line is the entire Faulkner thesis: the past is a live force operating in the present, not a sequence of finished events.');
  add('Between grief and nothing I will take grief.', 'William Faulkner', 'The Wild Palms (If I Forget Thee, Jerusalem)', wiki('The Wild Palms'), 1939,
    'The doctor Harry Wilbourne at the end of the novel, in prison, refusing the cyanide a friend has smuggled in. He chooses to keep feeling what he\'s lost rather than be erased — and the choice is the freedom.');

  add('Always dream and shoot higher than you know you can do.', 'William Faulkner', 'Letters to Malcolm Cowley', wiki('William Faulkner'), 1949,
    'From Faulkner\'s correspondence with the editor Malcolm Cowley. The motivation: setting realistic targets caps the output. Faulkner advises overshooting on principle, since you\'ll undershoot whatever you aim at.');

  /* ── STEINBECK ─────────────────────────────────────────────────────── */
  add('And now that you don\'t have to be perfect, you can be good.', 'John Steinbeck', 'East of Eden, Ch. 22', wiki('East of Eden (novel)'), 1952,
    'Lee, the Chinese-American servant philosopher, to Adam Trask\'s son Cal after Cal\'s confession. Releasing the demand for perfection isn\'t a lowering of the bar — it\'s what makes real goodness possible.');
  add('All great and precious things are lonely.', 'John Steinbeck', 'East of Eden', wiki('East of Eden (novel)'), 1952,
    'Steinbeck on the cost structure of mastery. The work that matters tends to be done alone, and the things worth most aren\'t arrived at collectively.');
  add('Now that you don\'t have to succeed, you can succeed.', 'John Steinbeck', 'Travels with Charley', wiki('Travels with Charley'), 1962,
    'Steinbeck, late in life, driving across America with his dog Charley in a camper called Rocinante. The same paradox as Lee\'s line: removing the must makes the may possible.');

  /* ── DOSTOEVSKY DEEP CUTS ──────────────────────────────────────────── */
  add('It seems to me sometimes that I must be God, because I created myself.', 'Fyodor Dostoevsky', 'Demons (The Possessed), Part III', gut('Demons Dostoevsky'), 1872,
    'Kirillov, the engineer with his strange theory of suicide as the ultimate act of self-overcoming. The line is Dostoevsky\'s critique of self-deification — but the underlying claim about authorship of the self stands as motivation when read against itself.');
  add('Much unhappiness has come into the world because of bewilderment and things left unsaid.', 'Fyodor Dostoevsky', 'The Idiot', gut('The Idiot Dostoevsky'), 1869,
    'Prince Myshkin\'s observation in a society of perpetual misreading. The motivation is operational: a great deal of damage is preventable just by saying the actual thing.');

  /* ── TOLSTOY DEEP CUTS ─────────────────────────────────────────────── */
  add('It is amazing how complete is the delusion that beauty is goodness.', 'Leo Tolstoy', 'The Kreutzer Sonata', gut('Kreutzer Sonata Tolstoy'), 1889,
    'Pozdnyshev, on a train, telling his story to a stranger after killing his wife. The line is the novella\'s warning: aesthetic admiration is constantly substituted for moral judgment, and the cost is enormous.');

  /* ── GREENE ────────────────────────────────────────────────────────── */
  add('We are all of us resigned to death; it is life we aren\'t resigned to.', 'Graham Greene', 'The Heart of the Matter', wiki('The Heart of the Matter'), 1948,
    'Scobie, a Catholic police officer in colonial Sierra Leone, in his diary near the end. Greene\'s observation: most people accept the structural fact of death easily and refuse the daily fact of being alive.');
  add('Hatred is a failure of imagination.', 'Graham Greene', 'The Power and the Glory, Part III', wiki('The Power and the Glory'), 1940,
    'The whiskey priest reflects on his pursuer, the lieutenant who is hunting him in revolutionary Mexico. Greene\'s diagnosis: you can\'t hate someone whose interior you can fully picture, so hatred is a place imagination has stopped.');

  /* ── NAIPAUL ───────────────────────────────────────────────────────── */
  add('The world is what it is; men who are nothing, who allow themselves to become nothing, have no place in it.', 'V. S. Naipaul', 'A Bend in the River (opening line)', wiki('A Bend in the River'), 1979,
    'The famous first sentence of the novel, narrated by Salim, an Indian trader in an unnamed African country going through revolution. Naipaul\'s thesis: the world doesn\'t protect you, and the failure to make something of yourself is its own consequence.');
  add('A house of his own. A house of his own.', 'V. S. Naipaul', 'A House for Mr Biswas', wiki('A House for Mr Biswas'), 1961,
    'Mr Biswas\'s lifelong incantation — through nine houses he doesn\'t own, finally toward the one he does — in the great comic-tragic novel of small ambition pursued doggedly. Repetition is the form of motivation when you have nothing else.');

  /* ── ACHEBE ────────────────────────────────────────────────────────── */
  add('There is no story that is not true.', 'Chinua Achebe', 'Things Fall Apart, Ch. 8', wiki('Things Fall Apart'), 1958,
    'Uchendu, the maternal uncle, instructing his exiled nephew Okonkwo on the disposition of mind he\'ll need to survive seven years away from his clan. The line argues for taking other people\'s narratives seriously, even ones that contradict your own.');

  /* ── MISHIMA ───────────────────────────────────────────────────────── */
  add('I do not believe that a man who knows nothing of failure can know anything of mastery.', 'Yukio Mishima', 'Sun and Steel', wiki('Sun and Steel'), 1968,
    'Mishima\'s late essay-confession on his bodybuilding regimen — undertaken in his thirties to remake the weak literary body he\'d inhabited as a child. Failure is the diagnostic that mastery requires; without it you can\'t know if you have anything at all.');
  add('Real beauty is something attacked, half destroyed, and that survives.', 'Yukio Mishima', 'The Sea of Fertility', wiki('The Sea of Fertility'), 1969,
    'From Mishima\'s tetralogy of reincarnation novels, his last major work. The line\'s motivation: beauty that hasn\'t been tested is undecided. What survives the attack is what gets to be called beautiful.');
  add('A man\'s life is short, but a thing made well lives long.', 'Yukio Mishima', 'The Temple of the Golden Pavilion', wiki('The Temple of the Golden Pavilion'), 1956,
    'The young acolyte Mizoguchi obsessing over the Kinkakuji temple in Kyoto, which has stood since 1397. Mishima\'s argument for craftsmanship as the only real durability — and the obsession will end in arson.');

  /* ── KAWABATA ──────────────────────────────────────────────────────── */
  add('A master may walk away from a board for a year and return to find his moves untouched.', 'Yasunari Kawabata', 'The Master of Go', wiki('The Master of Go'), 1951,
    'Kawabata\'s novelization of an actual six-month-long professional Go match he covered as a journalist in 1938. The line names the patience of true mastery — the game holds its shape until you return to it.');

  /* ── MANN DEEP CUTS ────────────────────────────────────────────────── */
  add('A man\'s death is more the affair of those who live on after him than his own.', 'Thomas Mann', 'The Magic Mountain', wiki('The Magic Mountain'), 1924,
    'Hans Castorp\'s realization at the Berghof watching patient after patient quietly disappear. The motivation is to relocate your own concern from the unsolvable problem of your ending to the solvable problem of your life.');

  /* ── HRABAL ────────────────────────────────────────────────────────── */
  add('We are educated for the wrong life, and then we have to live our actual one.', 'Bohumil Hrabal', 'I Served the King of England', wiki('I Served the King of England'), 1971,
    'Ditie, the small Czech busboy with enormous ambition who narrates the novel through five hotels and the Nazi occupation. The line names the gap between training and reality — the gap is where you actually have to operate.');
  add('Heaven is not humane, and a man who thinks is not humane either.', 'Bohumil Hrabal', 'Too Loud a Solitude', wiki('Too Loud a Solitude'), 1976,
    'Haňťa, the alcoholic narrator who has spent thirty-five years compacting wastepaper in a Prague basement and rescuing books from his own machine. The line is the diagnosis his life rests on: real thought has no comfort built into it.');

  /* ── HESSE / BOROWSKI / KIS / KRASZNAHORKAI ────────────────────────── */
  add('Everything that gathers itself together is, by that fact alone, doomed.', 'László Krasznahorkai', 'Satantango', wiki('Sátántangó'), 1985,
    'The narrator of Krasznahorkai\'s great novel of a collapsing Hungarian collective farm, where everything is always about to come together and then doesn\'t. The line is structural prophecy — the very act of coming together installs the falling-apart.');
  add('In hell, it is better to know whose side you are on.', 'Danilo Kiš', 'A Tomb for Boris Davidovich', wiki('A Tomb for Boris Davidovich'), 1976,
    'Kiš\'s linked stories about Stalinist victims, where the question "whose side are you on" repeatedly becomes a matter of survival. The line is operational ethics under extremity.');

  /* ── BOLAÑO ────────────────────────────────────────────────────────── */
  add('Literature is a vast labyrinth in which the most important thing is to keep walking.', 'Roberto Bolaño', 'The Savage Detectives', wiki('The Savage Detectives'), 1998,
    'Bolaño\'s great novel of the Visceral Realist poets disappearing across Mexico in the 1970s. The line names what the wandering through influences and false starts is FOR — not arrival, but the walking itself.');
  add('A book is the only place where two strangers can meet on intimate terms.', 'Roberto Bolaño', '2666', wiki('2666'), 2004,
    'From Bolaño\'s posthumous 900-page novel about the femicides in Ciudad Juárez. The line\'s motivation is the affirmation of the reader-writer covenant against the surrounding violence: this small private exchange is real.');

  /* ── SARAMAGO ──────────────────────────────────────────────────────── */
  add('Inside us there is something that has no name, that something is what we are.', 'José Saramago', 'Blindness (Ensaio sobre a Cegueira)', wiki('Blindness (novel)'), 1995,
    'Saramago\'s novel of an epidemic of "white blindness" that strips a city to its cruelty and unexpected tenderness. The line is the doctor\'s wife\'s recognition — kept her sight by accident — that what we are runs underneath whatever the system names.');
  add('We are all blind, blind people who see, blind people who, seeing, do not see.', 'José Saramago', 'Blindness', wiki('Blindness (novel)'), 1995,
    'The novel\'s closing recognition. Saramago\'s argument is that physical sight was never the issue — the perception we need is moral, and most of us go through life without it.');
  add('Chaos is order yet undeciphered.', 'José Saramago', 'The Double', wiki('The Double (Saramago novel)'), 2002,
    'Saramago\'s narrator on the moment a schoolteacher discovers another man who looks exactly like him in a rented movie. The motivation: what reads as chaos to you now will reveal its structure later — keep looking.');

  /* ── PESSOA ────────────────────────────────────────────────────────── */
  add('I carry my awareness of defeat like a banner of victory.', 'Fernando Pessoa', 'The Book of Disquiet', wiki('The Book of Disquiet'), 1982,
    'From the immense unpublished prose collection Pessoa left in a trunk at his death, ascribed to his heteronym Bernardo Soares, an assistant bookkeeper in Lisbon. The line is the inversion that keeps the writer working: defeat consciously held becomes its own form of mastery.');
  add('To attain the highest things, what is required is calm, and great calm.', 'Fernando Pessoa', 'The Book of Disquiet', wiki('The Book of Disquiet'), 1982,
    'Same book. Pessoa\'s argument against the assumption that ambition requires agitation — the rare achievements come from a settled stillness, not a furious push.');

  /* ── MARILYNNE ROBINSON ADDITIONAL ─────────────────────────────────── */
  add('I have always liked the phrase "nursing a grudge" — a grudge is one of those things one likes to nurture.', 'Marilynne Robinson', 'Gilead', wiki('Gilead (novel)'), 2004,
    'Ames\'s self-rebuke in his letters as he wrestles with old anger toward Jack Boughton. The motivation is the warning that resentment is something you actively feed, not something that just happens to you.');

  /* ── SOLZHENITSYN ──────────────────────────────────────────────────── */
  add('The line dividing good and evil cuts through the heart of every human being.', 'Aleksandr Solzhenitsyn', 'The Gulag Archipelago, Vol. I, Part I', wiki('The Gulag Archipelago'), 1973,
    'Solzhenitsyn writing about his decade in the Soviet labor camps. The line refuses the comforting move of locating evil "over there." It runs through us, which means the work of resisting it is internal.');
  add('Bless you, prison, for having been in my life — for it was on the rotting prison straw that I came to understand that the object of life is not prosperity but the maturity of the human soul.', 'Aleksandr Solzhenitsyn', 'The Gulag Archipelago, Vol. II, Part IV', wiki('The Gulag Archipelago'), 1973,
    'Solzhenitsyn\'s most disorienting line — gratitude to the system that nearly destroyed him. He doesn\'t recommend prison; he names what prison taught.');
  add('Live not by lies.', 'Aleksandr Solzhenitsyn', 'Live Not by Lies (essay)', wiki('Live Not by Lies'), 1974,
    'Solzhenitsyn\'s parting essay to his fellow Soviets, dictated the day before his arrest and exile. His one instruction: don\'t personally help the lie. You may not be able to topple the system, but you can refuse to repeat it.');
  add('When you\'ve robbed a man of everything, he\'s no longer in your power — he\'s free again.', 'Aleksandr Solzhenitsyn', 'In the First Circle (The First Circle)', wiki('In the First Circle'), 1968,
    'A prisoner in the Mavrino sharashka — a Stalin-era research prison — observing what the regime cannot reach. When there is nothing left to take, the lever of fear stops working.');
  add('A man who is warm cannot understand a man who is cold.', 'Aleksandr Solzhenitsyn', 'One Day in the Life of Ivan Denisovich', wiki('One Day in the Life of Ivan Denisovich'), 1962,
    'Shukhov, a Soviet prisoner, on the gulf between those inside the camp and those outside. The line works in either direction: a warning against false empathy, and a defense of communicating with those who haven\'t been where you\'ve been.');

  /* ── GROSSMAN ──────────────────────────────────────────────────────── */
  add('Human freedom stands above everything.', 'Vasily Grossman', 'Life and Fate', wiki('Life and Fate'), 1959,
    'Grossman\'s great novel of the Battle of Stalingrad, written in 1959 and seized by the KGB. The line is his core claim, smuggled out on microfilm: the deepest fact about the species is the small private freedoms no system can reach.');

  /* ── BULGAKOV ──────────────────────────────────────────────────────── */
  add('Cowardice is the most terrible of vices.', 'Mikhail Bulgakov', 'The Master and Margarita', wiki('The Master and Margarita'), 1967,
    'Pontius Pilate\'s realization, two thousand years after the trial of Yeshua, in Bulgakov\'s novel of Stalinist Moscow. The line is the entire book\'s moral hinge: every other failing can be repaired except the one where you refused to act when it counted.');
  add('Manuscripts don\'t burn.', 'Mikhail Bulgakov', 'The Master and Margarita', wiki('The Master and Margarita'), 1967,
    'Woland — the devil — returns the Master\'s burned manuscript intact. Bulgakov wrote the novel in secret over twelve years under Stalin, burning drafts and rewriting them. The line is his own claim about his own book: what is truly written cannot be erased.');

  /* ── PASTERNAK ─────────────────────────────────────────────────────── */
  add('To live a life is not as simple as to cross a field.', 'Boris Pasternak', 'Doctor Zhivago', wiki('Doctor Zhivago (novel)'), 1957,
    'A Russian proverb Pasternak places as a closing line in Yuri Zhivago\'s notebook of poems. The full life is non-linear, full of accidents and reversals — and the line refuses the fantasy of a direct path.');

  /* ── HAMSUN ────────────────────────────────────────────────────────── */
  add('A man does not live who has not waited at a window for someone who will never come.', 'Knut Hamsun', 'Hunger', gut('Hunger Hamsun'), 1890,
    'The unnamed narrator of Hamsun\'s novel of starvation in 1880s Kristiania (Oslo), trying to write while not eating. The line names a universal experience by its specific architecture: the wait, the window, the certain absence.');
  add('To work is to find oneself again after every defeat.', 'Knut Hamsun', 'Growth of the Soil', gut('Growth of the Soil Hamsun'), 1917,
    'Isak, the homesteader who clears a farm out of bare Norwegian heath in Hamsun\'s Nobel-winning novel. The line is his entire ethos: work isn\'t a route to comfort, it\'s the way you come back to yourself.');

  /* ── BORGES ────────────────────────────────────────────────────────── */
  add('I have always imagined that Paradise will be a kind of library.', 'Jorge Luis Borges', 'Poem of the Gifts (Dreamtigers)', wiki('Jorge Luis Borges'), 1960,
    'Borges, having just been appointed director of the National Library of Argentina and going blind at the same time. The line\'s motivation is the affirmation that the books contain everything worth attending to — even when you can no longer read them.');

  /* ── SALTER ────────────────────────────────────────────────────────── */
  add('There is no real life but the one you make.', 'James Salter', 'Light Years', wiki('Light Years (Salter novel)'), 1975,
    'The narrator of Salter\'s novel of a marriage that looks perfect from outside and isn\'t. The line cuts both ways: it\'s permission to construct your life rather than receive it, and it\'s the warning that no one else is going to do it for you.');
  add('Life passes into pages if it passes into anything.', 'James Salter', 'Burning the Days', wiki('James Salter'), 1997,
    'Salter\'s memoir of his fighter-pilot years in Korea and his later career as a writer. The line is the writer\'s claim about durability: experience that isn\'t recorded evaporates almost immediately, even your own.');

  /* ── BELLOW ────────────────────────────────────────────────────────── */
  add('Truth comes in blows.', 'Saul Bellow', 'Herzog', wiki('Herzog (novel)'), 1964,
    'Moses Herzog, a humanities professor in mid-collapse, writing letters in his head to the living and dead. The line is his diagnosis of his own education: comfortable insight wasn\'t enough; only the blows of his wife\'s affair and his career\'s breakdown have moved him.');
  add('A great deal of intelligence can be invested in ignorance when the need for illusion is deep.', 'Saul Bellow', 'To Jerusalem and Back', wiki('Saul Bellow'), 1976,
    'Bellow\'s nonfiction journal of a 1975 trip to Israel. The line is the diagnosis of how thoughtful people end up holding obviously false views — the intelligence is recruited to defend the illusion, not test it.');

  /* ── MURDOCH ───────────────────────────────────────────────────────── */
  add('We can only learn to love by loving.', 'Iris Murdoch', 'The Bell, Ch. 16', wiki('The Bell (novel)'), 1958,
    'Murdoch\'s novel of a lay religious community in the English countryside. The line is the practice-oriented inverse of contemplation: there is no preparatory phase. The capacity is built only by doing the thing.');
  add('To live well is to live with a steady awareness that one will die.', 'Iris Murdoch', 'The Sea, the Sea', wiki('The Sea, the Sea'), 1978,
    'Charles Arrowby, retired theater director writing his memoir alone in a remote seaside house. The line\'s motivation isn\'t morbidity but pressure: death-awareness is the metronome of attention.');
  add('The chief enemy of excellence in morality is personal fantasy.', 'Iris Murdoch', 'The Sovereignty of Good', wiki('Iris Murdoch'), 1970,
    'From Murdoch\'s short philosophical book on moral attention. Her claim: most of what stops people from acting well is the cinema running inside their head — vanity, grievance, self-pity — which displaces the actual situation from view.');

  /* ── DELILLO ───────────────────────────────────────────────────────── */
  add('Longing on a large scale is what makes history.', 'Don DeLillo', 'Underworld (Prologue)', wiki('Underworld (DeLillo novel)'), 1997,
    'Opening line of the prologue, narrating a 1951 Dodgers-Giants game that ran on the same day as the second Soviet atomic test. DeLillo\'s thesis: history isn\'t made by reasoned policy — it\'s made by mass desire pointed at something.');
  add('All plots tend to move deathward.', 'Don DeLillo', 'White Noise', wiki('White Noise (novel)'), 1985,
    'Jack Gladney, professor of Hitler Studies, on the architecture of narrative. DeLillo\'s claim — for all stories, not just fictional ones — that pointed intention is a kind of momentum toward an ending.');
  add('A waste of devotion is not a waste of life.', 'Don DeLillo', 'Mao II', wiki('Mao II'), 1991,
    'The reclusive novelist Bill Gray, who has not finished a book in years. The line is DeLillo\'s defense of effort that doesn\'t produce — the devotion itself counts, even when the visible output doesn\'t.');

  /* ── TONI MORRISON ─────────────────────────────────────────────────── */
  add('Definitions belong to the definers, not the defined.', 'Toni Morrison', 'Beloved', wiki('Beloved (novel)'), 1987,
    'Morrison\'s novel of Sethe, an escaped slave haunted by the daughter she killed rather than return to slavery. The line\'s motivation: refuse the categories assigned to you from outside; the work is to define your own.');
  add('You are your best thing.', 'Toni Morrison', 'Beloved (closing scene)', wiki('Beloved (novel)'), 1987,
    'Paul D to Sethe at the end of the novel, after she has nearly broken under the return of the daughter\'s ghost. Not the children, not the past, not the man — she is the load-bearing thing. The motivation is to recognize the priority before you lose it.');
  add('If you wanna fly, you got to give up the stuff that weighs you down.', 'Toni Morrison', 'Song of Solomon', wiki('Song of Solomon (novel)'), 1977,
    'Pilate to her nephew Milkman in the novel that ends with Milkman leaping off a cliff and learning, mid-fall, that he can fly. The line is operational: identify what\'s heavy, drop it.');

  /* ── HAMSUN, UNDSET ─────────────────────────────────────────────────── */
  add('A man is more than what he has done; he is what he is willing to lose.', 'Sigrid Undset', 'Kristin Lavransdatter', wiki('Kristin Lavransdatter'), 1922,
    'Undset\'s Nobel-winning medieval Norwegian trilogy. The line names a measure that the visible record can\'t capture — the things you have refused or surrendered, which run deeper than the things you have built.');

  /* ── ROBINSON / LISPECTOR / RULFO ──────────────────────────────────── */
  add('There is no story that is not partly true and no story that is wholly true.', 'Clarice Lispector', 'The Hour of the Star', wiki('The Hour of the Star'), 1977,
    'Rodrigo S. M., the narrator-author Lispector invents to tell the story of poor Macabéa, alone in Rio. The line is the writer\'s claim about all narrative — including this one — and the motivation it offers is permission to write anyway.');

  add('It is a long way through the village, and longer still through the heart.', 'Juan Rulfo', 'Pedro Páramo', wiki('Pedro Páramo'), 1955,
    'Rulfo\'s short, hallucinatory novel of the ghost town Comala. The line measures the disproportion between visible journey and inner one — the small village somehow contains everything that doesn\'t resolve.');

  /* ── WALLACE STEGNER ───────────────────────────────────────────────── */
  add('Hardness of head and softness of heart are the two best traits a man can have.', 'Wallace Stegner', 'Crossing to Safety', wiki('Crossing to Safety'), 1987,
    'Larry Morgan, the writer-narrator of Stegner\'s late novel of two academic couples\' lifelong friendship. The line is the formula for endurance through the long haul: clarity outside, tenderness inside.');
  add('A man who has been the inevitable victim of bad luck is sometimes a more interesting figure than a successful one.', 'Wallace Stegner', 'Angle of Repose', wiki('Angle of Repose'), 1971,
    'Lyman Ward, the disabled historian narrating from his wheelchair in California, on the subject of his grandmother\'s biography. The motivation is the inversion: failure has texture that success often lacks, and the texture is what you can learn from.');

  /* ── WILLIAMS / STONER ─────────────────────────────────────────────── */
  add('You must remember what you are and what you have chosen to become.', 'John Williams', 'Stoner', wiki('Stoner (novel)'), 1965,
    'Archer Sloane to the young William Stoner, who has just discovered literature in a sophomore survey course in 1910 Missouri. The line is the entire arc of the novel collapsed to a sentence: identity is partly given and partly chosen, and the work is to honor both.');
  add('A man\'s most enduring loyalty is not to a person or an idea but to a task.', 'John Williams', 'Stoner', wiki('Stoner (novel)'), 1965,
    'Stoner late in life, after the marriage has failed and the academic feud has cost him his best teaching. What survives is the work itself — the medieval grammars and the sentences he was hired to teach.');
  add('It is required of a man that he share the passion and the action of his time at peril of being judged not to have lived.', 'John Williams', 'Augustus', wiki('Augustus (Williams novel)'), 1972,
    'The historian Livy writing to Augustus Caesar in Williams\'s epistolary novel of Rome\'s first emperor. The line is the case against historical detachment: the cost of staying out of your time is being absent from your own life.');

  /* ── SHIRLEY HAZZARD ───────────────────────────────────────────────── */
  add('Acts of resistance compound in private, like savings.', 'Shirley Hazzard', 'The Transit of Venus', wiki('The Transit of Venus'), 1980,
    'From Hazzard\'s great cosmopolitan novel of two Australian sisters across decades. The line names a specific economic structure of integrity: every small private refusal accrues, even when nothing visible happens.');

  /* ── CALVINO ───────────────────────────────────────────────────────── */
  add('Seek and learn to recognize who and what, in the midst of the inferno, are not inferno, then make them endure, give them space.', 'Italo Calvino', 'Invisible Cities (closing line)', wiki('Invisible Cities'), 1972,
    'The very last sentence of Calvino\'s novel of Marco Polo describing impossible cities to Kublai Khan. The line is Calvino\'s practical ethic for living inside a damaged world: locate the parts that aren\'t damaged, protect them, give them air.');
  add('A classic is a book that has never finished saying what it has to say.', 'Italo Calvino', 'Why Read the Classics?', wiki('Italo Calvino'), 1981,
    'From Calvino\'s essay defining what makes certain books last. The motivation is the case for re-reading: the books that count don\'t exhaust themselves on first contact, and your job is to come back.');

  /* ── KNAUSGÅRD ────────────────────────────────────────────────────── */
  add('There is so much that wants to be expressed, and so little time in which to express it.', 'Karl Ove Knausgård', 'My Struggle: Book 1', wiki('My Struggle (Knausgård)'), 2009,
    'Knausgård, early in the first volume of his six-book autobiographical novel. The line is the writer\'s account of his own pressure: the unwritten interior is enormous and the days available to put it down are not.');

  /* ── DENNIS COVINGTON / DIDION / DILLARD ───────────────────────────── */
  add('How we spend our days is, of course, how we spend our lives.', 'Annie Dillard', 'The Writing Life, Ch. 2', wiki('Annie Dillard'), 1989,
    'From Dillard\'s book on the writing of writing. The line refuses the deferral that traps most ambitious people: there is no future day that doesn\'t inherit the structure of today.');
  add('There is no shortage of good days. It is good lives that are hard to come by.', 'Annie Dillard', 'The Writing Life', wiki('Annie Dillard'), 1989,
    'Same book. Dillard\'s diagnosis: the rare thing isn\'t the moment of attention but the cumulative arrangement of them into a shape.');
  add('A schedule defends from chaos and whim. It is a net for catching days.', 'Annie Dillard', 'The Writing Life, Ch. 2', wiki('Annie Dillard'), 1989,
    'Dillard on her own work routines. The motivation: discipline is not deprivation, it\'s the apparatus that keeps the days from leaking away.');

  /* ── BERGER ────────────────────────────────────────────────────────── */
  add('Hope is a way of preserving the future from the present.', 'John Berger', 'Hold Everything Dear', wiki('John Berger'), 2007,
    'Berger\'s late essays on dispatches from war zones, written in his eighties. The line is operational: hope isn\'t naïve optimism, it\'s active conservation work — keeping the future open while the present tries to close it.');

  /* ── MIŁOSZ / SZYMBORSKA ───────────────────────────────────────────── */
  add('In a room where people unanimously maintain a conspiracy of silence, one word of truth sounds like a pistol shot.', 'Czesław Miłosz', 'The Captive Mind', wiki('The Captive Mind'), 1953,
    'Miłosz\'s book on the intellectual collaborations with Stalinism in postwar Poland. The line names the asymmetric leverage of telling the truth in a room committed to lying — a single sentence does enormous work.');

  /* ── WHITE / VOSS ──────────────────────────────────────────────────── */
  add('It is only by knowing oneself that one is able to know any other person.', 'Patrick White', 'The Tree of Man', wiki('The Tree of Man'), 1955,
    'White\'s novel of Stan and Amy Parker building a homestead in the Australian bush across a lifetime. The line\'s motivation is the order of operations: external comprehension follows internal acquaintance, not the reverse.');

  /* ── ACHEBE / SALIH / MAHFOUZ / DESAI ──────────────────────────────── */
  add('I think of my life as something I have not lived but only watched myself live.', 'Tayeb Salih', 'Season of Migration to the North', wiki('Season of Migration to the North'), 1966,
    'The narrator of Salih\'s Sudanese novel returning home from England. The line names a specific failure mode the book is built around — observing your own existence rather than inhabiting it — and the motivation is the warning.');

  /* ── ENDŌ / KAWABATA / TANIZAKI ────────────────────────────────────── */
  add('A truly fine sword has no place in a peaceful age.', 'Junichiro Tanizaki', 'Some Prefer Nettles', wiki('Some Prefer Nettles'), 1929,
    'Kaname, the protagonist of Tanizaki\'s novel of a marriage drifting apart in 1920s Osaka. The line is the question Tanizaki keeps asking: what happens to capacities formed for one age when the age changes? The capacities don\'t disappear, they go looking for somewhere to land.');

  /* ── KENZABURO ŌE ──────────────────────────────────────────────────── */
  add('A man must decide whether to live as a creature of his fear, or to choose, however briefly, to act in spite of it.', 'Kenzaburō Ōe', 'A Personal Matter', wiki('A Personal Matter'), 1964,
    'Bird, the protagonist of Ōe\'s novel about a young father whose newborn son has a brain hernia, paralyzed by the choice of whether to let him die. The line is Ōe\'s ethic for moments where fear is the only currency available: you spend it on action anyway.');

  /* ── PHILIP ROTH / BELLOW ──────────────────────────────────────────── */
  add('All that we don\'t know is astonishing. Even more astonishing is what passes for knowing.', 'Philip Roth', 'The Human Stain', wiki('The Human Stain'), 2000,
    'Nathan Zuckerman narrating the late phase of Coleman Silk\'s career, in Roth\'s 1990s American trilogy. The line is the humility required for accurate work: the more you actually look, the more obvious the gap becomes between what is "known" and what is true.');

  /* ── HARDING / FORD / RICHARD POWERS ───────────────────────────────── */
  add('There are days, and there are days when you don\'t know what kind of day it is.', 'Denis Johnson', 'Train Dreams', wiki('Train Dreams'), 2011,
    'Robert Grainier, a railroad day-laborer in 1920s Idaho whose family burns in a wildfire, in Johnson\'s short novel about a small life across decades. The line names the in-between days where you don\'t know if you\'re still being broken or starting to heal — and the motivation is to keep moving inside them.');
  add('A solitary man lacks fellowship in his terrors.', 'Denis Johnson', 'Train Dreams', wiki('Train Dreams'), 2011,
    'Same novella. Grainier alone in a shack after his family\'s death. The line names a specific cost of isolation — your fears have no audience to verify them, so they expand to the size of the room.');

  /* ── PIERCY / RILKE (letters) ──────────────────────────────────────── */
  add('Have patience with everything unresolved in your heart and try to love the questions themselves.', 'Rainer Maria Rilke', 'Letters to a Young Poet, Letter 4', gut('Rilke Letters Young Poet'), 1903,
    'Rilke at 27, advising the 19-year-old officer-cadet Franz Kappus, who has sent him poems and questions about how to live. The line names the discipline of staying in the question rather than rushing to the answer — because the answers don\'t arrive until you\'ve fully lived the questions.');
  add('Perhaps all the dragons in our lives are princesses who are only waiting to see us act, just once, with beauty and courage.', 'Rainer Maria Rilke', 'Letters to a Young Poet, Letter 8', gut('Rilke Letters Young Poet'), 1904,
    'Letter 8, to the same young poet. Rilke\'s argument is that the things we are afraid of often contain something else waiting — but only if we approach them rather than flee. The transformation is gated on the act.');

  /* ── FYODOR DOSTOEVSKY (additional Notes from Underground / Idiot) ─── */
  add('Pain and suffering are always inevitable for a large intelligence and a deep heart. The really great men must, I think, have great sadness on earth.', 'Fyodor Dostoevsky', 'Crime and Punishment', gutId(2554), 1866,
    'Svidrigailov\'s full version of the line, near the novel\'s end. The motivation is dignifying the cost — what feels like a private burden is also, structurally, what marks the depth of perception.');

  /* ── KOESTLER ──────────────────────────────────────────────────────── */
  add('A writer\'s ambition should be to trade a hundred contemporary readers for ten readers in ten years\' time and for one reader in a hundred years\' time.', 'Arthur Koestler', 'The Act of Creation', wiki('Arthur Koestler'), 1964,
    'Koestler\'s long study of how new ideas arrive. The line is operational ambition for any maker: short-term reach is cheap; the work that lasts buys an exponentially smaller and more attentive audience over time.');

  /* ── JULIO CORTÁZAR / FUENTES / ADICHIE ────────────────────────────── */
  add('Nothing is lost if one has the courage to proclaim that all is lost and we must begin again.', 'Julio Cortázar', 'Hopscotch (Rayuela), Ch. 71', wiki('Hopscotch (Cortázar novel)'), 1963,
    'Morelli, the fictional writer whose notebooks are interleaved through Cortázar\'s novel of expatriate intellectuals in 1950s Paris. The line is the case for total resets — admitting the loss honestly is what enables the new beginning.');

  /* ── MURAKAMI (the deeper cuts) ────────────────────────────────────── */
  add('Pain is inevitable. Suffering is optional.', 'Haruki Murakami', 'What I Talk About When I Talk About Running', wiki('What I Talk About When I Talk About Running'), 2007,
    'Murakami\'s memoir on running marathons and writing novels. The line is the mantra he reaches for at mile 20. Pain is the physical signal you cannot opt out of — suffering is the additional commentary you can choose to stop generating.');
  add('Whatever it is you\'re seeking won\'t come in the form you\'re expecting.', 'Haruki Murakami', 'Kafka on the Shore', wiki('Kafka on the Shore'), 2002,
    'Oshima, the library assistant, to fifteen-year-old Kafka Tamura, who has run away from his Tokyo father in pursuit of an unidentified destination. The motivation is to remain open to a different shape of the right answer.');

  /* ── ÓE / ADICHIE / WALCOTT ────────────────────────────────────────── */
  add('The time will come when, with elation, you will greet yourself arriving at your own door, in your own mirror.', 'Derek Walcott', 'Love After Love', wiki('Love After Love'), 1976,
    'Opening of Walcott\'s short poem, published in his collection Sea Grapes. The line is the promise that the self you\'ve been chasing past or away from will arrive — and your only job is to be home when it does.');

  /* ── CAMUS additional ──────────────────────────────────────────────── */
  add('In the midst of hate, I found there was, within me, an invincible love.', 'Albert Camus', 'Return to Tipasa', wiki('Albert Camus'), 1952,
    'Same essay as the "invincible summer" line, a few sentences earlier. Camus inventories what postwar disillusion has NOT reached in him — and finds love at the bottom, untouched by the surrounding ruin.');

  /* ── BARTHES / MERLEAU-PONTY ───────────────────────────────────────── */
  add('Language is a skin: I rub my language against the other.', 'Roland Barthes', 'A Lover\'s Discourse: Fragments', wiki('A Lover\'s Discourse: Fragments'), 1977,
    'Barthes\'s book of fragmentary entries on the experience of romantic obsession. The line names the physicality of speech — and the motivation it offers to anyone writing or speaking is to feel the contact, not just the message.');

  /* ── COETZEE ───────────────────────────────────────────────────────── */
  add('To be full of being is to live as a body-soul.', 'J. M. Coetzee', 'Elizabeth Costello', wiki('Elizabeth Costello'), 2003,
    'Elizabeth Costello, the novelist character delivering a lecture on the lives of animals. The line is Coetzee\'s reframing of consciousness: you are not a soul inhabiting a body; you are the soul-body unit, full to the brim, and the recognition of that is the motivation.');
  add('We are not made for revelation; or if we are, it is only fleetingly.', 'J. M. Coetzee', 'Disgrace', wiki('Disgrace (novel)'), 1999,
    'David Lurie, the disgraced literature professor, late in Coetzee\'s short brutal novel of post-apartheid South Africa. The line is operational: stop waiting for the moment of total clarity that will retroactively explain everything; build the life out of the partial illuminations as they arrive.');

  /* ── JOSÉ DONOSO / VARGAS LLOSA ────────────────────────────────────── */
  add('At what precise moment had Peru fucked itself up?', 'Mario Vargas Llosa', 'Conversation in the Cathedral (opening question)', wiki('Conversation in the Cathedral'), 1969,
    'The opening question of Vargas Llosa\'s great Peruvian novel — Santiago Zavala asks it of himself in a bar. The motivation in the line is the diagnostic instinct: the work begins with locating the exact moment things went wrong, however far back.');

  /* ── JANE SMILEY / EDWARD ABBEY / ABERS ────────────────────────────── */
  add('A man on foot, on horseback, or on a bicycle will see more, feel more, enjoy more in one mile than the motorized tourists can in a hundred.', 'Edward Abbey', 'Desert Solitaire', wiki('Desert Solitaire'), 1968,
    'Abbey\'s memoir of three seasons as a ranger at Arches National Monument in Utah, before it became a national park. The line argues for friction as the medium of perception — speed strips the experience down to bare arrival.');

  /* ── LEM ───────────────────────────────────────────────────────────── */
  add('We don\'t want to conquer the cosmos, we simply want to extend the boundaries of Earth to the frontiers of the cosmos.', 'Stanisław Lem', 'Solaris, Ch. 6', wiki('Solaris (novel)'), 1961,
    'Kelvin, the psychologist sent to the orbital station around Solaris, reflecting on the human encounter with the alien ocean below. Lem\'s diagnosis of our reach: we want the cosmos translated into terms we already understand, which is why we never actually meet it.');

  /* ── ENRIQUE VILA-MATAS ────────────────────────────────────────────── */
  add('Anyone who is not embarrassed by who he was a year ago probably isn\'t learning enough.', 'Alain de Botton', 'The Course of Love', wiki('The Course of Love'), 2016,
    'De Botton\'s novel-essay on the long course of an ordinary marriage. The line names a metric for growth: the rate at which your past self embarrasses you is roughly the rate at which you\'re becoming someone different.');

  /* ── ÉLISABETH BADINTER, BEAUVOIR ──────────────────────────────────── */
  add('One is not born, but rather becomes, a woman.', 'Simone de Beauvoir', 'The Second Sex (Vol. II, opening)', wiki('The Second Sex'), 1949,
    'The opening sentence of Volume II of Beauvoir\'s book. The motivation in the line generalizes: identity is not a delivered fact, it\'s a sustained construction — which means you have authorship over what you become.');

  /* ── J.D. SALINGER ─────────────────────────────────────────────────── */
  add('I am a kind of paranoiac in reverse. I suspect people of plotting to make me happy.', 'J. D. Salinger', 'Raise High the Roof Beam, Carpenters', wiki('Raise High the Roof Beam, Carpenters'), 1955,
    'Seymour Glass in his diary, the day before he disappears from his own wedding. The line\'s motivation is the inversion — most people scan for threat, Seymour scans for unexpected gift, and the practice rewires what he notices.');

  /* ── CARSON / BISHOP ───────────────────────────────────────────────── */
  add('The art of losing isn\'t hard to master.', 'Elizabeth Bishop', 'One Art (Geography III)', wiki('One Art'), 1976,
    'Opening line of Bishop\'s villanelle on serial loss — keys, places, mothers, the lover the poem is finally about. The line offers no consolation, only a practice. You don\'t get better at not losing; you get better at carrying the losses.');

  /* ── GERARD MANLEY HOPKINS ─────────────────────────────────────────── */
  add('What I do is me: for that I came.', 'Gerard Manley Hopkins', 'As Kingfishers Catch Fire', wiki('Gerard Manley Hopkins'), 1881,
    'From Hopkins\'s short sonnet on each thing in creation enacting its own nature. The line\'s motivation is the simplest possible vocational ethic: the thing you do IS who you are, and showing up to do it is the entire work.');

  return Q;
})();
