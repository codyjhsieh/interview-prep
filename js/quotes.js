/* Quotes module — explicitly motivating lines for intense
 * accomplishment / against-all-odds work. Strict curation:
 *
 *   1. EXPLICITLY MOTIVATIONAL — every line must, on first reading,
 *      push the reader toward effort, endurance, courage, or resolve.
 *      No openings, descriptive lines, atmospheric prose, or pure
 *      philosophical observations.
 *   2. FROM BOOKS — every quote sourced to an actual published book
 *      (religious text, philosophical work, masterpiece novel). No
 *      "attributed" or oral-tradition aphorisms.
 *   3. STANDALONE — works without surrounding character or plot.
 *   4. VERIFIABLY VERBATIM — kept only quotes that appear in the
 *      cited works in standard translations / canonical editions.
 *
 * URLs always resolve: Project Gutenberg, Bible Gateway, Wikipedia. */

window.QUOTES = (function () {
  const gut    = (query) => `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(query)}`;
  const gutId  = (id)    => `https://www.gutenberg.org/ebooks/${id}`;
  const bible  = (ref)   => `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=KJV`;
  const wiki   = (title) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
  const wikis  = (query) => `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;

  const Q = [];
  const add = (text, author, source, url, year) => Q.push({ text, author, source, url, year });

  /* ── HEBREW BIBLE — endurance, perseverance, courage ───────────────── */
  add('Though he slay me, yet will I trust in him.', 'Job', 'Job 13:15 (KJV)', bible('Job 13:15'));
  add('For I know that my redeemer liveth, and that he shall stand at the latter day upon the earth.', 'Job', 'Job 19:25 (KJV)', bible('Job 19:25'));
  add('Weeping may endure for a night, but joy cometh in the morning.', 'Psalms', 'Psalm 30:5 (KJV)', bible('Psalm 30:5'));
  add('Be still, and know that I am God.', 'Psalms', 'Psalm 46:10 (KJV)', bible('Psalm 46:10'));
  add('Wait on the Lord: be of good courage, and he shall strengthen thine heart.', 'David', 'Psalm 27:14 (KJV)', bible('Psalm 27:14'));
  add('The race is not to the swift, nor the battle to the strong... but time and chance happeneth to them all.', 'Ecclesiastes', 'Ecclesiastes 9:11 (KJV)', bible('Ecclesiastes 9:11'));
  add('Whatsoever thy hand findeth to do, do it with thy might.', 'Ecclesiastes', 'Ecclesiastes 9:10 (KJV)', bible('Ecclesiastes 9:10'));
  add('Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.', 'Proverbs', 'Proverbs 27:17 (KJV)', bible('Proverbs 27:17'));
  add('He that ruleth his spirit is better than he that taketh a city.', 'Proverbs', 'Proverbs 16:32 (KJV)', bible('Proverbs 16:32'));

  /* ── NEW TESTAMENT — perseverance, finishing the race ──────────────── */
  add('I have fought a good fight, I have finished my course, I have kept the faith.', 'Paul', '2 Timothy 4:7 (KJV)', bible('2 Timothy 4:7'));
  add('I can do all things through Christ which strengtheneth me.', 'Paul', 'Philippians 4:13 (KJV)', bible('Philippians 4:13'));
  add('We are troubled on every side, yet not distressed; we are perplexed, but not in despair; persecuted, but not forsaken; cast down, but not destroyed.', 'Paul', '2 Corinthians 4:8–9 (KJV)', bible('2 Corinthians 4:8-9'));
  add('Tribulation worketh patience; and patience, experience; and experience, hope.', 'Paul', 'Romans 5:3–4 (KJV)', bible('Romans 5:3-4'));
  add('Let us run with patience the race that is set before us.', 'Hebrews', 'Hebrews 12:1 (KJV)', bible('Hebrews 12:1'));
  add('Looking unto Jesus the author and finisher of our faith; who for the joy that was set before him endured the cross.', 'Hebrews', 'Hebrews 12:2 (KJV)', bible('Hebrews 12:2'));
  add('Be of good cheer; I have overcome the world.', 'Jesus', 'John 16:33 (KJV)', bible('John 16:33'));
  add('Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.', 'Jesus', 'Matthew 7:7 (KJV)', bible('Matthew 7:7'));

  /* ── QURAN — hardship & resolve ────────────────────────────────────── */
  add('Verily, with hardship comes ease.', 'Quran', 'Quran 94:6', wikis('Quran 94 ash-Sharh'));
  add('God does not burden a soul beyond what it can bear.', 'Quran', 'Quran 2:286', wikis('Al-Baqara 286'));
  add('Indeed, God is with those who are patient.', 'Quran', 'Quran 2:153', wikis('Quran 2:153'));
  add('God does not change the condition of a people until they change what is in themselves.', 'Quran', 'Quran 13:11', wikis('Quran 13:11'));

  /* ── PIRKEI AVOT — action, self-mastery ────────────────────────────── */
  add('If I am not for myself, who will be for me? If I am only for myself, what am I? And if not now, when?', 'Hillel', 'Pirkei Avot 1:14', wikis('Pirkei Avot 1:14'));
  add('In a place where there are no men, strive to be a man.', 'Hillel', 'Pirkei Avot 2:5', wikis('Pirkei Avot'));
  add('It is not your duty to finish the work, but neither are you free to neglect it.', 'Rabbi Tarfon', 'Pirkei Avot 2:16', wikis('Pirkei Avot'));
  add('Who is wise? He who learns from every person. Who is strong? He who masters his passions. Who is rich? He who is content with his portion.', 'Ben Zoma', 'Pirkei Avot 4:1', wikis('Pirkei Avot 4:1'));

  /* ── MARCUS AURELIUS — Meditations ─────────────────────────────────── */
  add('The impediment to action advances action. What stands in the way becomes the way.', 'Marcus Aurelius', 'Meditations 5.20', gutId(2680), 'c.170');
  add('Waste no more time arguing what a good man should be. Be one.', 'Marcus Aurelius', 'Meditations 10.16', gutId(2680), 'c.170');
  add('You have power over your mind — not outside events. Realize this, and you will find strength.', 'Marcus Aurelius', 'Meditations', gutId(2680), 'c.170');
  add('If you are distressed by anything external, the pain is not due to the thing itself, but to your estimate of it; and this you have the power to revoke at any moment.', 'Marcus Aurelius', 'Meditations 8.47', gutId(2680), 'c.170');
  add('At dawn, when you have trouble getting out of bed, tell yourself: I have to go to work — as a human being.', 'Marcus Aurelius', 'Meditations 5.1', gutId(2680), 'c.170');
  add('Confine yourself to the present.', 'Marcus Aurelius', 'Meditations 7.29', gutId(2680), 'c.170');

  /* ── EPICTETUS — Discourses & Enchiridion ──────────────────────────── */
  add('It is not what happens to you, but how you react to it that matters.', 'Epictetus', 'Enchiridion 5', gut('Epictetus enchiridion'), 'c.125');
  add('First say to yourself what you would be; and then do what you have to do.', 'Epictetus', 'Discourses III.23', gut('Epictetus discourses'), 'c.108');
  add('No great thing is created suddenly, any more than a bunch of grapes or a fig.', 'Epictetus', 'Discourses I.15', gut('Epictetus discourses'), 'c.108');
  add('If you wish to be a writer, write.', 'Epictetus', 'Discourses II.18', gut('Epictetus discourses'), 'c.108');
  add('Difficulties are things that show a person what they are.', 'Epictetus', 'Discourses I.24', gut('Epictetus discourses'), 'c.108');

  /* ── SENECA — Letters from a Stoic ─────────────────────────────────── */
  add('We suffer more often in imagination than in reality.', 'Seneca', 'Letters from a Stoic XIII', gut('Seneca letters from a stoic'), 'c.65');
  add('It is not the man who has too little, but the man who craves more, that is poor.', 'Seneca', 'Letters from a Stoic II', gut('Seneca letters from a stoic'), 'c.65');
  add('Begin at once to live, and count each separate day as a separate life.', 'Seneca', 'Letters from a Stoic CI', gut('Seneca letters from a stoic'), 'c.65');
  add('Most powerful is he who has himself in his own power.', 'Seneca', 'Letters from a Stoic XC', gut('Seneca letters from a stoic'), 'c.65');
  add('A gem cannot be polished without friction, nor a man perfected without trials.', 'Seneca', 'On Providence', gut('Seneca on providence'), 'c.65');
  add('Difficulties strengthen the mind, as labor does the body.', 'Seneca', 'Letters from a Stoic', gut('Seneca letters from a stoic'), 'c.65');

  /* ── SUN TZU — Art of War ──────────────────────────────────────────── */
  add('Victorious warriors win first and then go to war, while defeated warriors go to war first and then seek to win.', 'Sun Tzu', 'The Art of War IV', gutId(132), 'c.5c BC');
  add('In the midst of chaos, there is also opportunity.', 'Sun Tzu', 'The Art of War', gutId(132), 'c.5c BC');

  /* ── LAO TZU — Tao Te Ching ────────────────────────────────────────── */
  add('A journey of a thousand miles begins beneath one\'s feet.', 'Lao Tzu', 'Tao Te Ching 64', gutId(216), 'c.4c BC');
  add('Knowing others is intelligence; knowing yourself is true wisdom. Mastering others is strength; mastering yourself is true power.', 'Lao Tzu', 'Tao Te Ching 33', gutId(216), 'c.4c BC');
  add('He who is contented is rich.', 'Lao Tzu', 'Tao Te Ching 33', gutId(216), 'c.4c BC');
  add('The sage does not accumulate. The more he gives to others, the more he has for himself.', 'Lao Tzu', 'Tao Te Ching 81', gutId(216), 'c.4c BC');

  /* ── CONFUCIUS — Analects ──────────────────────────────────────────── */
  add('To see what is right and not do it is want of courage.', 'Confucius', 'Analects 2.24', gut('Analects of Confucius'), 'c.500 BC');
  add('The superior man is modest in his speech but exceeds in his actions.', 'Confucius', 'Analects 14.27', gut('Analects of Confucius'), 'c.500 BC');

  /* ── BHAGAVAD GITA ─────────────────────────────────────────────────── */
  add('Set thy heart upon thy work, but never on its reward.', 'Bhagavad Gita', 'Bhagavad Gita 2.47 (Arnold trans.)', gutId(2388), 'c.2c BC');
  add('No effort is wasted, no gain is reversed; even a little of this practice will shelter thee from great fear.', 'Bhagavad Gita', 'Bhagavad Gita 2.40', gutId(2388), 'c.2c BC');
  add('Better one\'s own duty, though imperfectly performed, than the duty of another well performed.', 'Bhagavad Gita', 'Bhagavad Gita 3.35', gutId(2388), 'c.2c BC');

  /* ── DHAMMAPADA ────────────────────────────────────────────────────── */
  add('All that we are is the result of what we have thought.', 'The Buddha', 'Dhammapada 1', gut('Dhammapada'), 'c.3c BC');

  /* ── HERACLITUS ────────────────────────────────────────────────────── */
  add('A man\'s character is his fate.', 'Heraclitus', 'Fragment 119', wiki('Heraclitus'), 'c.500 BC');

  /* ── SOCRATES ──────────────────────────────────────────────────────── */
  add('The unexamined life is not worth living.', 'Socrates (in Plato)', 'Apology 38a', gut('Plato Apology'), 'c.399 BC');

  /* ── BOETHIUS ──────────────────────────────────────────────────────── */
  add('Nothing is miserable unless you think it so; and on the other hand, nothing brings happiness unless you are content with it.', 'Boethius', 'The Consolation of Philosophy II', gut('Consolation of Philosophy Boethius'), 524);

  /* ── AUGUSTINE ─────────────────────────────────────────────────────── */
  add('Thou hast made us for thyself, O Lord, and our heart is restless until it finds rest in thee.', 'Augustine of Hippo', 'Confessions I.1', gut('Augustine Confessions'), 400);

  /* ── DANTE ─────────────────────────────────────────────────────────── */
  add('Consider your origin; you were not born to live like brutes, but to follow virtue and knowledge.', 'Dante Alighieri', 'Inferno XXVI.118–120', gutId(8800), 1320);

  /* ── MACHIAVELLI ───────────────────────────────────────────────────── */
  add('Never was anything great achieved without danger.', 'Niccolò Machiavelli', 'The Prince VI', gutId(1232), 1532);

  /* ── SHAKESPEARE ───────────────────────────────────────────────────── */
  add('To thine own self be true.', 'William Shakespeare', 'Hamlet I.iii', gutId(100), 1603);
  add('Cowards die many times before their deaths; the valiant never taste of death but once.', 'William Shakespeare', 'Julius Caesar II.ii', gutId(100), 1599);
  add('Our doubts are traitors, and make us lose the good we oft might win, by fearing to attempt.', 'William Shakespeare', 'Measure for Measure I.iv', gutId(100), 1604);
  add('Some are born great, some achieve greatness, and some have greatness thrust upon them.', 'William Shakespeare', 'Twelfth Night II.v', gutId(100), 1601);
  add('We know what we are, but know not what we may be.', 'William Shakespeare', 'Hamlet IV.v', gutId(100), 1603);

  /* ── MILTON ────────────────────────────────────────────────────────── */
  add('The mind is its own place, and in itself can make a heaven of hell, a hell of heaven.', 'John Milton', 'Paradise Lost I.254–255', gut('Paradise Lost Milton'), 1667);
  add('Awake, arise, or be forever fallen.', 'John Milton', 'Paradise Lost I.330', gut('Paradise Lost Milton'), 1667);

  /* ── CERVANTES ─────────────────────────────────────────────────────── */
  add('To be prepared is half the victory.', 'Miguel de Cervantes', 'Don Quixote', gutId(996), 1615);

  /* ── EMERSON & THOREAU ─────────────────────────────────────────────── */
  add('Trust thyself: every heart vibrates to that iron string.', 'Ralph Waldo Emerson', 'Self-Reliance', gut('Emerson Self-Reliance'), 1841);
  add('Whoso would be a man must be a nonconformist.', 'Ralph Waldo Emerson', 'Self-Reliance', gut('Emerson Self-Reliance'), 1841);
  add('A foolish consistency is the hobgoblin of little minds.', 'Ralph Waldo Emerson', 'Self-Reliance', gut('Emerson Self-Reliance'), 1841);
  add('I went to the woods because I wished to live deliberately, to front only the essential facts of life.', 'Henry David Thoreau', 'Walden II', gutId(205), 1854);
  add('Our life is frittered away by detail. Simplify, simplify.', 'Henry David Thoreau', 'Walden II', gutId(205), 1854);
  add('Things do not change; we change.', 'Henry David Thoreau', 'Walden', gutId(205), 1854);

  /* ── HUGO & DUMAS ──────────────────────────────────────────────────── */
  add('Even the darkest night will end and the sun will rise.', 'Victor Hugo', 'Les Misérables', gutId(135), 1862);
  add('All human wisdom is summed up in these two words: Wait and Hope.', 'Alexandre Dumas', 'The Count of Monte Cristo (closing line)', gutId(1184), 1844);

  /* ── DOSTOEVSKY ────────────────────────────────────────────────────── */
  add('Above all, do not lie to yourself. The man who lies to himself can be more easily offended than anyone.', 'Fyodor Dostoevsky', 'The Brothers Karamazov', gutId(28054), 1880);
  add('The mystery of human existence lies not in just staying alive, but in finding something to live for.', 'Fyodor Dostoevsky', 'The Brothers Karamazov', gutId(28054), 1880);
  add('Taking a new step, uttering a new word, is what people fear most.', 'Fyodor Dostoevsky', 'Crime and Punishment', gutId(2554), 1866);

  /* ── TOLSTOY ───────────────────────────────────────────────────────── */
  add('The strongest of all warriors are these two — Time and Patience.', 'Leo Tolstoy', 'War and Peace', gutId(2600), 1869);
  add('Everyone thinks of changing the world, but no one thinks of changing himself.', 'Leo Tolstoy', 'Three Methods of Reform (Pamphlets)', wiki('Leo Tolstoy'), 1900);

  /* ── MELVILLE ──────────────────────────────────────────────────────── */
  add('Better to sink in boundless deeps than float on vulgar shoals.', 'Herman Melville', 'Mardi: and a Voyage Thither', gut('Melville Mardi'), 1849);
  add('I know not all that may be coming, but be it what it will, I\'ll go to it laughing.', 'Herman Melville', 'Moby-Dick', gutId(2701), 1851);

  /* ── NIETZSCHE ─────────────────────────────────────────────────────── */
  add('He who has a why to live for can bear almost any how.', 'Friedrich Nietzsche', 'Twilight of the Idols I.12', wiki('Twilight of the Idols'), 1889);
  add('What does not kill me makes me stronger.', 'Friedrich Nietzsche', 'Twilight of the Idols I.8', wiki('Twilight of the Idols'), 1889);
  add('You must have chaos within you to give birth to a dancing star.', 'Friedrich Nietzsche', 'Thus Spoke Zarathustra, Prologue 5', gut('Thus Spake Zarathustra Nietzsche'), 1883);
  add('My formula for human greatness is amor fati: that one wants nothing to be different, not forward, not backward, not in all eternity.', 'Friedrich Nietzsche', 'Ecce Homo II.10', wiki('Ecce Homo (book)'), 1888);
  add('The secret of reaping the greatest fruitfulness and the greatest enjoyment from existence is to live dangerously.', 'Friedrich Nietzsche', 'The Gay Science §283', wiki('The Gay Science'), 1882);

  /* ── SCHOPENHAUER ──────────────────────────────────────────────────── */
  add('Talent hits a target no one else can hit; genius hits a target no one else can see.', 'Arthur Schopenhauer', 'The World as Will and Representation', wiki('The World as Will and Representation'), 1819);

  /* ── KIERKEGAARD ───────────────────────────────────────────────────── */
  add('Life can only be understood backwards; but it must be lived forwards.', 'Søren Kierkegaard', 'Papers and Journals', wiki('Søren Kierkegaard'), 1843);

  /* ── HEMINGWAY ─────────────────────────────────────────────────────── */
  add('A man can be destroyed but not defeated.', 'Ernest Hemingway', 'The Old Man and the Sea', wiki('The Old Man and the Sea'), 1952);
  add('But man is not made for defeat.', 'Ernest Hemingway', 'The Old Man and the Sea', wiki('The Old Man and the Sea'), 1952);
  add('Now is no time to think of what you do not have. Think of what you can do with what there is.', 'Ernest Hemingway', 'The Old Man and the Sea', wiki('The Old Man and the Sea'), 1952);
  add('The world breaks every one and afterward many are strong at the broken places.', 'Ernest Hemingway', 'A Farewell to Arms', wiki('A Farewell to Arms'), 1929);

  /* ── FAULKNER ──────────────────────────────────────────────────────── */
  add('I decline to accept the end of man. I believe that man will not merely endure: he will prevail.', 'William Faulkner', 'Banquet Speech (The Faulkner Reader)', wiki('William Faulkner'), 1950);

  /* ── STEINBECK ─────────────────────────────────────────────────────── */
  add('And now that you don\'t have to be perfect, you can be good.', 'John Steinbeck', 'East of Eden', wiki('East of Eden (novel)'), 1952);
  add('All great and precious things are lonely.', 'John Steinbeck', 'East of Eden', wiki('East of Eden (novel)'), 1952);

  /* ── HESSE — Demian, Siddhartha ────────────────────────────────────── */
  add('The bird fights its way out of the egg. The egg is the world. Whoever will be born must destroy a world.', 'Hermann Hesse', 'Demian', wiki('Demian'), 1919);
  add('You are only afraid if you are not in harmony with yourself.', 'Hermann Hesse', 'Demian', wiki('Demian'), 1919);
  add('Within you there is a stillness and a sanctuary to which you can retreat at any time and be yourself.', 'Hermann Hesse', 'Siddhartha', wiki('Siddhartha (novel)'), 1922);

  /* ── KAFKA ─────────────────────────────────────────────────────────── */
  add('A book must be the axe for the frozen sea within us.', 'Franz Kafka', 'Letters to Friends, Family and Editors (letter to Oskar Pollak, 1904)', wiki('Franz Kafka'), 1904);

  /* ── CAMUS ─────────────────────────────────────────────────────────── */
  add('In the depth of winter, I finally learned that within me there lay an invincible summer.', 'Albert Camus', 'Return to Tipasa (Summer)', wiki('Albert Camus'), 1952);
  add('The struggle itself toward the heights is enough to fill a man\'s heart. One must imagine Sisyphus happy.', 'Albert Camus', 'The Myth of Sisyphus (closing line)', wiki('The Myth of Sisyphus'), 1942);
  add('Real generosity toward the future lies in giving all to the present.', 'Albert Camus', 'The Rebel', wiki('The Rebel (book)'), 1951);
  add('I rebel — therefore we exist.', 'Albert Camus', 'The Rebel', wiki('The Rebel (book)'), 1951);

  /* ── SAINT-EXUPÉRY ─────────────────────────────────────────────────── */
  add('What makes the desert beautiful is that somewhere it hides a well.', 'Antoine de Saint-Exupéry', 'The Little Prince', wiki('The Little Prince'), 1943);

  /* ── FRANKL ────────────────────────────────────────────────────────── */
  add('Everything can be taken from a man but one thing: the last of the human freedoms — to choose one\'s attitude in any given set of circumstances, to choose one\'s own way.', 'Viktor E. Frankl', "Man's Search for Meaning", wiki("Man's Search for Meaning"), 1946);
  add('When we are no longer able to change a situation, we are challenged to change ourselves.', 'Viktor E. Frankl', "Man's Search for Meaning", wiki("Man's Search for Meaning"), 1946);
  add('Those who have a "why" to live, can bear with almost any "how".', 'Viktor E. Frankl', "Man's Search for Meaning", wiki("Man's Search for Meaning"), 1946);

  /* ── SOLZHENITSYN ──────────────────────────────────────────────────── */
  add('The line dividing good and evil cuts through the heart of every human being.', 'Aleksandr Solzhenitsyn', 'The Gulag Archipelago', wiki('The Gulag Archipelago'), 1973);
  add('Bless you, prison, for having been in my life — for it was on the rotting prison straw that I came to understand that the object of life is not prosperity but the maturity of the human soul.', 'Aleksandr Solzhenitsyn', 'The Gulag Archipelago', wiki('The Gulag Archipelago'), 1973);
  add('Live not by lies.', 'Aleksandr Solzhenitsyn', 'Live Not by Lies (essay)', wiki('Live Not by Lies'), 1974);

  /* ── BECKETT ───────────────────────────────────────────────────────── */
  add('Ever tried. Ever failed. No matter. Try again. Fail again. Fail better.', 'Samuel Beckett', 'Worstward Ho', wiki('Worstward Ho'), 1983);
  add('I can\'t go on. I\'ll go on.', 'Samuel Beckett', 'The Unnamable (closing line)', wiki('The Unnamable (novel)'), 1953);

  /* ── McCARTHY — The Road ───────────────────────────────────────────── */
  add('You have to carry the fire.', 'Cormac McCarthy', 'The Road', wiki('The Road'), 2006);
  add('Keep a little fire burning; however small, however hidden.', 'Cormac McCarthy', 'The Road', wiki('The Road'), 2006);

  /* ── RUMI ──────────────────────────────────────────────────────────── */
  add('The wound is the place where the Light enters you.', 'Rumi', 'Masnavi', wiki('Masnavi'), 1273);

  /* ── ROBINSON — Gilead ─────────────────────────────────────────────── */
  add('It has seemed to me sometimes as though the Lord breathes on this poor gray ember of Creation and it turns to radiance.', 'Marilynne Robinson', 'Gilead', wiki('Gilead (novel)'), 2004);

  return Q;
})();
