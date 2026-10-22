/* Deutschheft — A1 course content.
   Vocabulary, gender rules, grammar skills, lessons, sentence banks and writing tasks.
   Loaded before engine.js; exposes globalThis.DH_CONTENT. */
(function (root) {
  "use strict";

  // ---------- small HTML helpers for lessons ----------
  const say = (t, label) => `<span class="say" role="button" tabindex="0" data-say="${t}">${label || t}</span>`;
  const g = (art, word) => `<span class="g g-${art}">${art} ${word}</span>`;
  const exl = (pairs) =>
    `<ul class="exl">${pairs.map(([de, en]) => `<li>${say(de)}<span class="en">${en}</span></li>`).join("")}</ul>`;
  const tbl = (head, rows, cls = "") =>
    `<div class="tbl-wrap"><table class="tbl ${cls}"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows
      .map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${c}</th>` : `<td>${c}</td>`)).join("")}</tr>`)
      .join("")}</tbody></table></div>`;
  // Satzklammer diagram: labels per column, rows of cells; column roles: "v" verb slot, "e" end slot
  const brk = (labels, roles, rows) =>
    `<div class="tbl-wrap"><table class="brk"><thead><tr>${labels
      .map((l, i) => `<th class="r-${roles[i] || "x"}">${l}</th>`)
      .join("")}</tr></thead><tbody>${rows
      .map((r) => `<tr>${r.map((c, i) => `<td class="r-${roles[i] || "x"}">${c}</td>`).join("")}</tr>`)
      .join("")}</tbody></table></div>`;
  const tip = (h) => `<div class="tip"><span class="tip-k">Tip</span><div>${h}</div></div>`;
  const warn = (h) => `<div class="warn"><span class="tip-k">Watch out</span><div>${h}</div></div>`;

  // ---------- vocabulary ----------
  // t: n noun, v verb, w word (adjective/adverb/function word), p phrase
  // Nouns: pl uses dictionary plural codes: "-e", "¨-e", "-er", "¨-er", "-n", "-en", "-nen", "-s", "-se", "-", "¨",
  //        "/" (no plural), "pl" (plural-only), "=Form" (irregular, spelled out)
  // c: categories, r: gender rule, b: base noun for compounds, m: mass noun, wk: weak (n-declension) noun
  // Verbs: k stem change, f all six forms when irregular, imp [du, ihr, Sie] imperative when irregular, c a complement for drills
  const V = [];
  const N = (u, de, pl, en, c, o = {}) => V.push(Object.assign({ t: "n", u, de, pl, en, c }, o));
  const Vb = (u, de, en, o = {}) => V.push(Object.assign({ t: "v", u, de, en }, o));
  const W = (u, de, en, o = {}) => V.push(Object.assign({ t: "w", u, de, en }, o));
  const P = (u, de, en, o = {}) => V.push(Object.assign({ t: "p", u, de, en }, o));

  // Unit 1 — Hallo!
  P(1, "Hallo!", "Hello!", { note: "Works any time of day. Friendly but fine with almost anyone.", ex: ["Hallo, ich bin Tom!", "Hi, I'm Tom!"] });
  P(1, "Guten Morgen!", "Good morning!", { note: "Until about 10–11 am. Guten because der Morgen is masculine.", ex: ["Guten Morgen, Frau Schmidt!", "Good morning, Mrs Schmidt!"] });
  P(1, "Guten Tag!", "Hello! / Good day! (polite)", { note: "The standard polite greeting during the day: shops, offices, strangers.", ex: ["Guten Tag! Mein Name ist Weber.", "Hello! My name is Weber."] });
  P(1, "Guten Abend!", "Good evening!", { note: "From about 6 pm.", ex: ["Guten Abend! Wie geht es Ihnen?", "Good evening! How are you?"] });
  P(1, "Gute Nacht!", "Good night!", { note: "Only when going to bed or leaving late at night. Gute (not Guten) because die Nacht is feminine.", ex: ["Gute Nacht und schlaf gut!", "Good night and sleep well!"] });
  P(1, "Tschüss!", "Bye!", { alt: ["Tschüs!"], note: "Informal. With strangers and officials say Auf Wiedersehen.", ex: ["Tschüss, bis morgen!", "Bye, see you tomorrow!"] });
  P(1, "Auf Wiedersehen!", "Goodbye! (polite)", { note: "Literally 'until seeing again'. On the phone: Auf Wiederhören.", ex: ["Danke und auf Wiedersehen!", "Thank you and goodbye!"] });
  P(1, "Bis später!", "See you later!", { ex: ["Tschüss, Anna! Bis später!", "Bye, Anna! See you later!"] });
  P(1, "Wie geht's?", "How are you? (informal)", { alt: ["Wie geht es dir?", "Wie gehts?"], note: "Short for Wie geht es dir? — literally 'How does it go (for you)?'", ex: ["Hallo, Paul! Wie geht's?", "Hi, Paul! How are you?"] });
  P(1, "Wie geht es Ihnen?", "How are you? (polite)", { note: "Ihnen with a capital I is the polite 'you'.", ex: ["Guten Tag, Herr Weber! Wie geht es Ihnen?", "Hello, Mr Weber! How are you?"] });
  P(1, "Mir geht es gut.", "I'm doing well.", { alt: ["Mir geht's gut.", "Mir gehts gut."], note: "Literally 'To me it goes well'. Don't say Ich bin gut — that means 'I am good (at something)'.", ex: ["Danke, mir geht es gut. Und dir?", "Thanks, I'm doing well. And you?"] });
  P(1, "Danke!", "Thank you!", { alt: ["Danke schön!", "Dankeschön!", "Vielen Dank!"], ex: ["Danke für die Blumen!", "Thank you for the flowers!"] });
  P(1, "Bitte!", "Please! / You're welcome!", { note: "Bitte does three jobs: please, you're welcome, and 'here you go'.", ex: ["Ein Wasser, bitte!", "A water, please!"] });
  P(1, "Entschuldigung!", "Excuse me! / Sorry!", { note: "Use it to get attention (Entschuldigung, wo ist…?) and to apologise.", ex: ["Entschuldigung, wie spät ist es?", "Excuse me, what time is it?"] });
  P(1, "Ich verstehe nicht.", "I don't understand.", { alt: ["Ich verstehe das nicht."], ex: ["Entschuldigung, ich verstehe nicht.", "Sorry, I don't understand."] });
  P(1, "Noch einmal, bitte.", "Once more, please.", { alt: ["Noch mal, bitte.", "Nochmal, bitte."], ex: ["Wie bitte? Noch einmal, bitte.", "Pardon? Once more, please."] });
  W(1, "ja", "yes", { ex: ["Ja, ich komme aus Spanien.", "Yes, I'm from Spain."] });
  W(1, "nein", "no", { ex: ["Nein, danke.", "No, thank you."] });
  W(1, "gut", "good, well", { ex: ["Das ist gut.", "That is good."] });
  W(1, "schlecht", "bad", { ex: ["Mir geht es schlecht.", "I'm not well."] });
  W(1, "müde", "tired", { ex: ["Ich bin sehr müde.", "I am very tired."] });
  W(1, "krank", "ill, sick", { ex: ["Bist du krank?", "Are you ill?"] });
  N(1, "der Name", "-n", "name", "abs", { r: "ex-e", wk: 1, ex: ["Mein Name ist Lena.", "My name is Lena."] });
  N(1, "der Herr", "-en", "Mr / gentleman", "person", { r: "sex", wk: 1, ex: ["Guten Tag, Herr Weber!", "Hello, Mr Weber!"] });
  N(1, "die Frau", "-en", "Mrs / woman / wife", "person", { r: "sex", ex: ["Das ist Frau Schmidt.", "This is Mrs Schmidt."], note: "Also 'woman' and 'wife': meine Frau = my wife." });
  Vb(1, "sein", "to be", { f: ["bin", "bist", "ist", "sind", "seid", "sind"], imp: ["sei", "seid", "seien"], pp: "gewesen", aux: "s", c: "müde", ex: ["Wir sind in Berlin.", "We are in Berlin."] });

  // Unit 2 — Ich & du
  Vb(2, "heißen", "to be called", { pp: "geheißen", np: 1, c: "Müller", ex: ["Ich heiße Lena.", "My name is Lena."] });
  Vb(2, "kommen", "to come", { pp: "gekommen", aux: "s", c: "aus Spanien", ex: ["Ich komme aus Kanada.", "I come from Canada."] });
  Vb(2, "wohnen", "to live (reside)", { pp: "gewohnt", c: "in Berlin", ex: ["Wir wohnen in Hamburg.", "We live in Hamburg."], note: "wohnen = live somewhere. leben = be alive, live in general." });
  Vb(2, "lernen", "to learn, to study", { pp: "gelernt", c: "Deutsch", ex: ["Ich lerne jeden Tag Deutsch.", "I study German every day."] });
  Vb(2, "arbeiten", "to work", { pp: "gearbeitet", c: "heute", ex: ["Er arbeitet in München.", "He works in Munich."] });
  Vb(2, "machen", "to do, to make", { pp: "gemacht", c: "Sport", ex: ["Was machst du?", "What are you doing?"] });
  Vb(2, "spielen", "to play", { pp: "gespielt", c: "Fußball", ex: ["Wir spielen Karten.", "We are playing cards."] });
  Vb(2, "hören", "to hear, to listen to", { pp: "gehört", c: "Musik", ex: ["Ich höre gern Musik.", "I like listening to music."] });
  Vb(2, "studieren", "to study (at university)", { pp: "studiert", c: "Medizin", note: "Only for university. For school subjects or vocabulary use lernen.", ex: ["Meine Schwester studiert Medizin in Wien.", "My sister studies medicine in Vienna."] });
  Vb(2, "reisen", "to travel", { pp: "gereist", aux: "s", c: "gern", ex: ["Reist du gern?", "Do you like travelling?"] });
  Vb(2, "tanzen", "to dance", { pp: "getanzt", c: "gut", ex: ["Sie tanzt sehr gut.", "She dances very well."] });
  Vb(2, "kochen", "to cook", { pp: "gekocht", c: "gern", ex: ["Mein Vater kocht gern.", "My father likes cooking."] });
  Vb(2, "haben", "to have", { f: ["habe", "hast", "hat", "haben", "habt", "haben"], pp: "gehabt", c: "Zeit", ex: ["Hast du Zeit?", "Do you have time?"] });
  Vb(2, "sagen", "to say", { pp: "gesagt", c: "Hallo", ex: ["Was sagst du?", "What are you saying?"] });
  Vb(2, "fragen", "to ask", { pp: "gefragt", c: "den Lehrer", ex: ["Ich frage den Lehrer.", "I ask the teacher."] });
  Vb(2, "verstehen", "to understand", { pp: "verstanden", c: "das nicht", ex: ["Verstehst du das?", "Do you understand that?"] });
  Vb(2, "finden", "to find; to think (opinion)", { pp: "gefunden", c: "den Film gut", note: "Ich finde das gut = I think that's good.", ex: ["Ich finde den Schlüssel nicht.", "I can't find the key."] });
  Vb(2, "warten", "to wait", { pp: "gewartet", c: "auf den Bus", ex: ["Wir warten auf den Bus.", "We are waiting for the bus."] });
  N(2, "das Land", "¨-er", "country", "place", { ex: ["Deutschland ist ein Land in Europa.", "Germany is a country in Europe."] });
  N(2, "die Stadt", "¨-e", "city, town", "place in", { ex: ["Berlin ist eine große Stadt.", "Berlin is a big city."] });
  N(2, "die Sprache", "-n", "language", "abs", { r: "e", ex: ["Ich spreche zwei Sprachen.", "I speak two languages."] });
  N(2, "der Beruf", "-e", "job, profession", "abs", { ex: ["Was sind Sie von Beruf?", "What do you do for a living?"] });
  N(2, "die Arbeit", "-en", "work", "abs", { m: 1, ex: ["Die Arbeit ist interessant.", "The work is interesting."] });
  N(2, "die Adresse", "-n", "address", "abs", { r: "e", ex: ["Wie ist deine Adresse?", "What's your address?"] });
  N(2, "die Telefonnummer", "-n", "phone number", "abs", { r: "comp", b: "die Nummer", ex: ["Wie ist deine Telefonnummer?", "What's your phone number?"] });
  N(2, "das Hobby", "-s", "hobby", "abs", { note: "Loanwords from English usually take -s in the plural.", ex: ["Mein Hobby ist Kochen.", "My hobby is cooking."] });
  N(2, "der Lehrer", "-", "teacher (male)", "person", { r: "er", ex: ["Der Lehrer ist sehr nett.", "The teacher is very nice."] });
  N(2, "die Lehrerin", "-nen", "teacher (female)", "person", { r: "in", ex: ["Unsere Lehrerin kommt aus Österreich.", "Our teacher is from Austria."] });
  N(2, "der Student", "-en", "student (male)", "person", { r: "ent", wk: 1, ex: ["Paul ist Student in Berlin.", "Paul is a student in Berlin."] });
  N(2, "die Studentin", "-nen", "student (female)", "person", { r: "in", ex: ["Ich bin Studentin.", "I'm a student."] });
  N(2, "der Freund", "-e", "friend / boyfriend", "person", { r: "sex", ex: ["Das ist mein Freund Tom.", "This is my friend Tom."] });
  N(2, "die Freundin", "-nen", "friend (female) / girlfriend", "person", { r: "in", ex: ["Das ist meine Freundin Lisa.", "This is my friend Lisa."] });
  W(2, "Deutsch", "German (language)", { note: "Languages are written with a capital letter: Ich lerne Deutsch.", ex: ["Sprichst du Deutsch?", "Do you speak German?"] });
  W(2, "Englisch", "English (language)", { ex: ["Sprechen Sie Englisch?", "Do you speak English?"] });
  W(2, "und", "and", { ex: ["Ich wohne in Berlin und arbeite in Potsdam.", "I live in Berlin and work in Potsdam."] });
  W(2, "aber", "but", { ex: ["Ich bin müde, aber glücklich.", "I'm tired but happy."] });
  W(2, "oder", "or", { ex: ["Kaffee oder Tee?", "Coffee or tea?"] });
  W(2, "auch", "also, too", { ex: ["Ich komme auch.", "I'm coming too."] });
  W(2, "sehr", "very", { ex: ["Das ist sehr gut.", "That is very good."] });
  W(2, "gern", "gladly; like to (+ verb)", { alt: ["gerne"], note: "gern after the verb means you like doing it: Ich koche gern = I like cooking.", ex: ["Ich tanze gern.", "I like dancing."] });
  P(2, "Wie heißt du?", "What's your name? (informal)", { ex: ["Hallo! Wie heißt du? — Ich heiße Mia.", "Hi! What's your name? — I'm Mia."] });
  P(2, "Wie heißen Sie?", "What's your name? (polite)", { ex: ["Guten Tag! Wie heißen Sie? — Ich heiße Weber.", "Hello! What's your name? — My name is Weber."] });
  P(2, "Woher kommst du?", "Where are you from? (informal)", { ex: ["Woher kommst du? — Ich komme aus Italien.", "Where are you from? — I'm from Italy."] });
  P(2, "Freut mich!", "Nice to meet you!", { note: "Short for Es freut mich — 'it pleases me'.", ex: ["Ich bin Tom. — Freut mich! Ich bin Anna.", "I'm Tom. — Nice to meet you! I'm Anna."] });

  // Unit 3 — Der, die, das
  N(3, "der Tisch", "-e", "table", "home thing", { ex: ["Der Tisch ist neu.", "The table is new."] });
  N(3, "der Stuhl", "¨-e", "chair", "home thing", { ex: ["Wir brauchen vier Stühle.", "We need four chairs."] });
  N(3, "das Bett", "-en", "bed", "home thing", { ex: ["Das Bett ist zu klein.", "The bed is too small."] });
  N(3, "die Lampe", "-n", "lamp", "home thing", { r: "e", ex: ["Ich kaufe eine Lampe.", "I'm buying a lamp."] });
  N(3, "das Fenster", "-", "window", "home", { ex: ["Das Fenster ist offen.", "The window is open."] });
  N(3, "die Tür", "-en", "door", "home", { ex: ["Die Tür ist offen.", "The door is open."] });
  N(3, "das Haus", "¨-er", "house", "home place", { ex: ["Das Haus ist alt und schön.", "The house is old and beautiful."] });
  N(3, "die Wohnung", "-en", "flat, apartment", "home place in", { r: "ung", ex: ["Die Wohnung hat drei Zimmer.", "The flat has three rooms."] });
  N(3, "das Zimmer", "-", "room", "home place in", { ex: ["Mein Zimmer ist klein, aber schön.", "My room is small but nice."] });
  N(3, "die Küche", "-n", "kitchen", "home place in", { r: "e", ex: ["Die Küche ist sehr groß.", "The kitchen is very big."] });
  N(3, "das Bad", "¨-er", "bathroom; bath", "home place in", { ex: ["Das Bad ist neu.", "The bathroom is new."] });
  N(3, "der Schrank", "¨-e", "cupboard, wardrobe", "home thing", { ex: ["Der Schrank ist zu groß.", "The wardrobe is too big."] });
  N(3, "das Sofa", "-s", "sofa", "home thing", { ex: ["Das Sofa ist alt, aber bequem.", "The sofa is old but comfortable."] });
  N(3, "der Computer", "-", "computer", "thing", { r: "er", ex: ["Mein Computer ist kaputt.", "My computer is broken."] });
  N(3, "das Handy", "-s", "mobile phone", "thing", { note: "A German-made 'English' word — English speakers don't call a phone a handy!", ex: ["Wo ist mein Handy?", "Where is my phone?"] });
  N(3, "das Buch", "¨-er", "book", "thing", { ex: ["Das Buch ist sehr gut.", "The book is very good."] });
  N(3, "der Stift", "-e", "pen, pencil", "thing", { ex: ["Hast du einen Stift?", "Do you have a pen?"] });
  N(3, "die Tasche", "-n", "bag", "thing", { r: "e", ex: ["Meine Tasche ist schwer.", "My bag is heavy."] });
  N(3, "der Schlüssel", "-", "key", "thing", { ex: ["Ich suche den Schlüssel.", "I'm looking for the key."] });
  N(3, "die Uhr", "-en", "clock, watch; o'clock", "thing", { ex: ["Es ist drei Uhr.", "It's three o'clock."] });
  N(3, "das Auto", "-s", "car", "thing trans", { r: "o", ex: ["Das Auto ist teuer.", "The car is expensive."] });
  N(3, "die Zeitung", "-en", "newspaper", "thing", { r: "ung", ex: ["Mein Vater liest die Zeitung.", "My father is reading the newspaper."] });
  N(3, "das Bild", "-er", "picture", "thing home", { ex: ["Das Bild ist sehr schön.", "The picture is very nice."] });
  N(3, "die Blume", "-n", "flower", "thing", { r: "e", ex: ["Die Blume ist rot.", "The flower is red."] });
  N(3, "das Mädchen", "-", "girl", "person", { r: "chen", note: "Grammar beats biology: -chen makes every noun neuter, so the pronoun is es.", ex: ["Das Mädchen heißt Emma.", "The girl is called Emma."] });
  N(3, "das Geld", "/", "money", "thing", { m: 1, ex: ["Ich habe kein Geld.", "I have no money."] });
  N(3, "das Geschenk", "-e", "present, gift", "thing", { r: "ge", ex: ["Das Geschenk ist für dich.", "The present is for you."] });
  N(3, "der Fernseher", "-", "TV (set)", "home thing", { r: "er", ex: ["Der Fernseher ist neu.", "The TV is new."] });
  W(3, "groß", "big, tall", { ex: ["Die Wohnung ist groß.", "The flat is big."] });
  W(3, "klein", "small, little", { ex: ["Die Wohnung ist klein.", "The flat is small."] });
  W(3, "neu", "new", { ex: ["Ist das Auto neu?", "Is the car new?"] });
  W(3, "alt", "old", { ex: ["Wie alt bist du?", "How old are you?"] });
  W(3, "schön", "beautiful, nice", { ex: ["Das Wetter ist schön.", "The weather is nice."] });
  W(3, "teuer", "expensive", { ex: ["Das Hotel ist sehr teuer.", "The hotel is very expensive."] });
  W(3, "billig", "cheap", { ex: ["Das Brot ist hier billig.", "The bread is cheap here."] });
  W(3, "kaputt", "broken", { ex: ["Die Lampe ist kaputt.", "The lamp is broken."] });
  Vb(3, "öffnen", "to open", { pp: "geöffnet", c: "das Fenster", ex: ["Kannst du das Fenster öffnen?", "Can you open the window?"] });
  Vb(3, "brauchen", "to need", { pp: "gebraucht", c: "einen Stift", ex: ["Ich brauche einen Stift.", "I need a pen."] });
  Vb(3, "suchen", "to look for, to search", { pp: "gesucht", c: "den Schlüssel", ex: ["Ich suche meine Brille.", "I'm looking for my glasses."] });
  Vb(3, "kosten", "to cost", { pp: "gekostet", nc: 1, np: 1, ex: ["Das Buch kostet zehn Euro.", "The book costs ten euros."] });
  Vb(3, "schreiben", "to write", { pp: "geschrieben", c: "eine E-Mail", ex: ["Ich schreibe eine E-Mail.", "I'm writing an e-mail."] });
  P(3, "Was ist das?", "What is that?", { ex: ["Was ist das? — Das ist ein Wecker.", "What is that? — It's an alarm clock."] });

  // Unit 4 — Familie
  N(4, "die Familie", "-n", "family", "fam", { r: "ie", ex: ["Meine Familie ist groß.", "My family is big."] });
  N(4, "die Mutter", "¨", "mother", "fam person", { r: "sex", ex: ["Meine Mutter heißt Maria.", "My mother is called Maria."] });
  N(4, "der Vater", "¨", "father", "fam person", { r: "sex", ex: ["Mein Vater arbeitet in Hamburg.", "My father works in Hamburg."] });
  N(4, "die Eltern", "pl", "parents", "fam", { r: "pl", ex: ["Meine Eltern wohnen in München.", "My parents live in Munich."] });
  N(4, "der Bruder", "¨", "brother", "fam person", { r: "sex", ex: ["Ich habe einen Bruder.", "I have a brother."] });
  N(4, "die Schwester", "-n", "sister", "fam person", { r: "sex", ex: ["Meine Schwester ist zwölf Jahre alt.", "My sister is twelve years old."] });
  N(4, "die Geschwister", "pl", "siblings", "fam", { r: "pl", ex: ["Hast du Geschwister?", "Do you have siblings?"] });
  N(4, "der Sohn", "¨-e", "son", "fam person", { r: "sex", ex: ["Unser Sohn spielt gern Fußball.", "Our son likes playing football."] });
  N(4, "die Tochter", "¨", "daughter", "fam person", { r: "sex", ex: ["Ihre Tochter studiert in München.", "Her daughter studies in Munich."] });
  N(4, "das Kind", "-er", "child", "fam person", { note: "Neuter, like das Baby. The pronoun is es.", ex: ["Das Kind spielt.", "The child is playing."] });
  N(4, "der Mann", "¨-er", "man; husband", "person fam", { r: "sex", ex: ["Der Mann dort ist mein Onkel.", "The man over there is my uncle."] });
  N(4, "der Junge", "-n", "boy", "person", { r: "sex", wk: 1, note: "Ends in -e but masculine: natural gender wins.", ex: ["Der Junge spielt im Park.", "The boy is playing in the park."] });
  N(4, "die Oma", "-s", "grandma", "fam person", { r: "sex", ex: ["Meine Oma wohnt in Köln.", "My grandma lives in Cologne."] });
  N(4, "der Opa", "-s", "grandpa", "fam person", { r: "sex", ex: ["Mein Opa ist 80 Jahre alt.", "My grandpa is 80 years old."] });
  N(4, "die Großeltern", "pl", "grandparents", "fam", { r: "pl", ex: ["Meine Großeltern wohnen auf dem Land.", "My grandparents live in the country."] });
  N(4, "der Onkel", "-", "uncle", "fam person", { r: "sex", ex: ["Mein Onkel hat einen Hund.", "My uncle has a dog."] });
  N(4, "die Tante", "-n", "aunt", "fam person", { r: "sex", ex: ["Meine Tante kommt am Sonntag.", "My aunt is coming on Sunday."] });
  N(4, "der Hund", "-e", "dog", "animal", { ex: ["Der Hund heißt Bello.", "The dog is called Bello."] });
  N(4, "die Katze", "-n", "cat", "animal", { r: "e", ex: ["Die Katze schläft auf dem Sofa.", "The cat is sleeping on the sofa."] });
  N(4, "das Baby", "-s", "baby", "fam person", { ex: ["Das Baby schläft.", "The baby is sleeping."] });
  W(4, "verheiratet", "married", { ex: ["Bist du verheiratet?", "Are you married?"] });
  W(4, "ledig", "single (not married)", { ex: ["Ich bin ledig.", "I'm single."] });
  W(4, "jung", "young", { ex: ["Meine Eltern sind noch jung.", "My parents are still young."] });
  W(4, "nett", "nice, kind", { ex: ["Deine Schwester ist sehr nett.", "Your sister is very nice."] });
  W(4, "lieb", "sweet, dear, kind", { ex: ["Unser Hund ist sehr lieb.", "Our dog is very sweet."] });
  Vb(4, "kennen", "to know (a person, place)", { pp: "gekannt", c: "die Stadt gut", note: "kennen = be familiar with someone or something. For facts use wissen.", ex: ["Kennst du Paul?", "Do you know Paul?"] });
  Vb(4, "wissen", "to know (a fact)", { f: ["weiß", "weißt", "weiß", "wissen", "wisst", "wissen"], pp: "gewusst", c: "das nicht", ex: ["Ich weiß es nicht.", "I don't know."] });
  Vb(4, "besuchen", "to visit", { pp: "besucht", c: "die Oma", ex: ["Am Sonntag besuche ich meine Oma.", "On Sunday I visit my grandma."] });
  Vb(4, "lieben", "to love", { pp: "geliebt", c: "Musik", ex: ["Ich liebe dich.", "I love you."] });
  P(4, "Hast du Geschwister?", "Do you have brothers or sisters?", { ex: ["Hast du Geschwister? — Ja, eine Schwester.", "Do you have siblings? — Yes, a sister."] });
  P(4, "Ich habe einen Bruder.", "I have a brother.", { note: "einen — the article changes after haben (accusative, Unit 5).", ex: ["Ich habe einen Bruder. Er heißt Max.", "I have a brother. His name is Max."] });

  // Unit 5 — Essen & Trinken
  N(5, "das Brot", "-e", "bread", "food", { ex: ["Ich kaufe ein Brot.", "I'm buying a loaf of bread."] });
  N(5, "das Brötchen", "-", "bread roll", "food cafe eat", { r: "chen", note: "The classic German breakfast. In Bavaria and Austria: die Semmel.", ex: ["Zum Frühstück esse ich ein Brötchen.", "For breakfast I eat a bread roll."] });
  N(5, "der Käse", "-", "cheese", "food", { r: "ex-e", m: 1, ex: ["Der Käse kommt aus der Schweiz.", "The cheese is from Switzerland."] });
  N(5, "die Butter", "/", "butter", "food", { m: 1, ex: ["Ich esse Brot mit Butter.", "I eat bread and butter."] });
  N(5, "die Milch", "/", "milk", "drink", { m: 1, ex: ["Trinkst du Kaffee mit Milch?", "Do you drink coffee with milk?"] });
  N(5, "der Kaffee", "-s", "coffee", "drink cafe", { note: "In Germany the stress is usually on the first syllable: KAF-fee.", ex: ["Ich trinke keinen Kaffee.", "I don't drink coffee."] });
  N(5, "der Tee", "-s", "tea", "drink cafe", { ex: ["Ich trinke am Abend Tee.", "I drink tea in the evening."] });
  N(5, "das Wasser", "/", "water", "drink cafe", { ex: ["Ein Wasser, bitte.", "A water, please."] });
  N(5, "der Saft", "¨-e", "juice", "drink cafe", { ex: ["Ich trinke gern Saft.", "I like drinking juice."] });
  N(5, "das Bier", "-e", "beer", "drink cafe", { r: "ex-alc", ex: ["Ein Bier, bitte!", "A beer, please!"] });
  N(5, "der Wein", "-e", "wine", "drink cafe", { r: "alc", ex: ["Möchtest du ein Glas Wein?", "Would you like a glass of wine?"] });
  N(5, "der Apfel", "¨", "apple", "food eat", { ex: ["Ich esse einen Apfel.", "I'm eating an apple."] });
  N(5, "die Banane", "-n", "banana", "food eat", { r: "e", ex: ["Ich esse eine Banane.", "I'm eating a banana."] });
  N(5, "die Tomate", "-n", "tomato", "food eat", { r: "e", ex: ["Die Tomate ist sehr frisch.", "The tomato is very fresh."] });
  N(5, "die Kartoffel", "-n", "potato", "food", { ex: ["Ich koche Kartoffeln.", "I'm cooking potatoes."] });
  N(5, "das Ei", "-er", "egg", "food eat", { r: "ex-ei", ex: ["Zum Frühstück esse ich ein Ei.", "I have an egg for breakfast."] });
  N(5, "das Fleisch", "/", "meat", "food", { m: 1, ex: ["Ich esse kein Fleisch.", "I don't eat meat."] });
  N(5, "der Fisch", "-e", "fish", "food animal", { ex: ["Ich esse gern Fisch.", "I like eating fish."] });
  N(5, "das Gemüse", "/", "vegetables", "food", { r: "ge", m: 1, note: "Singular in German, even though English says 'vegetables': Das Gemüse ist frisch.", ex: ["Das Gemüse ist frisch.", "The vegetables are fresh."] });
  N(5, "das Obst", "/", "fruit", "food", { m: 1, note: "A collective noun for all fruit. One piece of fruit: die Frucht.", ex: ["Ich esse jeden Tag Obst.", "I eat fruit every day."] });
  N(5, "der Kuchen", "-", "cake", "food cafe", { ex: ["Der Kuchen ist lecker!", "The cake is delicious!"] });
  N(5, "die Suppe", "-n", "soup", "food cafe eat", { r: "e", ex: ["Die Suppe ist zu heiß.", "The soup is too hot."] });
  N(5, "der Salat", "-e", "salad; lettuce", "food cafe eat", { ex: ["Ich nehme einen Salat.", "I'll have a salad."] });
  N(5, "die Pizza", "-s", "pizza", "food cafe eat", { px: 1, note: "Plural die Pizzas or die Pizzen — both are correct.", ex: ["Wir bestellen eine Pizza.", "We're ordering a pizza."] });
  N(5, "der Reis", "/", "rice", "food", { m: 1, ex: ["Wir essen Reis mit Gemüse.", "We're eating rice with vegetables."] });
  N(5, "die Schokolade", "-n", "chocolate", "food", { r: "e", ex: ["Die Schokolade ist sehr süß.", "The chocolate is very sweet."] });
  N(5, "der Zucker", "/", "sugar", "food", { m: 1, ex: ["Kaffee mit Zucker, bitte.", "Coffee with sugar, please."] });
  N(5, "das Frühstück", "-e", "breakfast", "food", { r: "comp", b: "das Stück", m: 1, ex: ["Das Frühstück ist um acht Uhr.", "Breakfast is at eight o'clock."] });
  N(5, "das Mittagessen", "-", "lunch", "food", { r: "comp", b: "das Essen", m: 1, ex: ["Was gibt es zum Mittagessen?", "What's for lunch?"] });
  N(5, "das Abendessen", "-", "dinner, supper", "food", { r: "comp", b: "das Essen", m: 1, ex: ["Das Abendessen ist fertig!", "Dinner is ready!"] });
  N(5, "der Hunger", "/", "hunger", "abs", { m: 1, ex: ["Ich habe Hunger.", "I'm hungry."] });
  N(5, "der Durst", "/", "thirst", "abs", { m: 1, ex: ["Ich habe Durst.", "I'm thirsty."] });
  N(5, "das Restaurant", "-s", "restaurant", "place in", { ex: ["Das Restaurant ist sehr gut.", "The restaurant is very good."] });
  N(5, "die Rechnung", "-en", "bill, check", "thing", { r: "ung", ex: ["Die Rechnung, bitte!", "The bill, please!"] });
  N(5, "die Speisekarte", "-n", "menu", "thing", { r: "comp", b: "die Karte", ex: ["Kann ich die Speisekarte haben?", "Can I have the menu?"] });
  W(5, "lecker", "tasty, delicious", { ex: ["Die Pizza ist sehr lecker!", "The pizza is really tasty!"] });
  W(5, "süß", "sweet", { ex: ["Der Kuchen ist sehr süß.", "The cake is very sweet."] });
  W(5, "frisch", "fresh", { ex: ["Das Brot ist frisch.", "The bread is fresh."] });
  W(5, "kalt", "cold", { ex: ["Das Bier ist kalt.", "The beer is cold."] });
  W(5, "warm", "warm", { ex: ["Heute ist es warm.", "It's warm today."] });
  W(5, "heiß", "hot", { ex: ["Vorsicht, der Tee ist heiß!", "Careful, the tea is hot!"] });
  Vb(5, "essen", "to eat", { k: "e>i", pp: "gegessen", c: "gern Fisch", ex: ["Was isst du gern?", "What do you like to eat?"] });
  Vb(5, "trinken", "to drink", { pp: "getrunken", c: "Kaffee", ex: ["Was trinkst du?", "What are you drinking?"] });
  Vb(5, "kaufen", "to buy", { pp: "gekauft", c: "Brot", ex: ["Wir kaufen Brot und Milch.", "We're buying bread and milk."] });
  Vb(5, "möchten", "would like", { k: "mod", f: ["möchte", "möchtest", "möchte", "möchten", "möchtet", "möchten"], c: "einen Tee", note: "The polite way to ask for things. ich and er/sie/es are the same: ich möchte, er möchte.", ex: ["Ich möchte einen Kaffee, bitte.", "I'd like a coffee, please."] });
  Vb(5, "mögen", "to like", { k: "mod", f: ["mag", "magst", "mag", "mögen", "mögt", "mögen"], pp: "gemocht", c: "keinen Fisch", ex: ["Magst du Schokolade?", "Do you like chocolate?"] });
  Vb(5, "nehmen", "to take; to have (order)", { k: "e>i", f: ["nehme", "nimmst", "nimmt", "nehmen", "nehmt", "nehmen"], imp: ["nimm", "nehmt", "nehmen"], pp: "genommen", c: "die Suppe", note: "Irregular spelling: du nimmst, er nimmt (double m, no h).", ex: ["Ich nehme die Suppe.", "I'll have the soup."] });
  Vb(5, "bestellen", "to order", { pp: "bestellt", c: "eine Pizza", ex: ["Ich bestelle eine Pizza.", "I'm ordering a pizza."] });
  Vb(5, "bezahlen", "to pay", { pp: "bezahlt", c: "mit Karte", ex: ["Kann ich mit Karte bezahlen?", "Can I pay by card?"] });
  Vb(5, "frühstücken", "to have breakfast", { pp: "gefrühstückt", c: "um acht Uhr", ex: ["Wir frühstücken um acht Uhr.", "We have breakfast at eight o'clock."] });
  P(5, "Guten Appetit!", "Enjoy your meal!", { ex: ["Das Essen ist fertig. Guten Appetit!", "The food is ready. Enjoy your meal!"] });
  P(5, "Was kostet das?", "How much is that?", { ex: ["Entschuldigung, was kostet das?", "Excuse me, how much is this?"] });
  P(5, "Zahlen, bitte!", "The bill, please!", { alt: ["Die Rechnung, bitte!"], ex: ["Entschuldigung! Zahlen, bitte!", "Excuse me! The bill, please!"] });
  P(5, "Ich hätte gern einen Kaffee.", "I'd like a coffee, please. (polite)", { alt: ["Ich möchte einen Kaffee."], note: "Ich hätte gern… is the most polite way to order.", ex: ["Ich hätte gern einen Kaffee und ein Stück Kuchen.", "I'd like a coffee and a piece of cake."] });
  P(5, "Ich habe Hunger.", "I'm hungry.", { note: "Literally 'I have hunger'. Thirsty: Ich habe Durst.", ex: ["Ich habe Hunger. Gibt es Pizza?", "I'm hungry. Is there any pizza?"] });
  P(5, "Ich bin satt.", "I'm full.", { ex: ["Danke, ich bin satt.", "Thanks, I'm full."] });

  // Unit 6 — Zahlen & Zeit
  N(6, "der Montag", "-e", "Monday", "time", { r: "day", ex: ["Am Montag habe ich Deutsch.", "On Monday I have German."] });
  N(6, "der Dienstag", "-e", "Tuesday", "time", { r: "day", ex: ["Am Dienstag habe ich Sport.", "On Tuesday I have sport."] });
  N(6, "der Mittwoch", "-e", "Wednesday", "time", { r: "day", note: "Literally 'mid-week'.", ex: ["Am Mittwoch arbeite ich zu Hause.", "On Wednesday I work from home."] });
  N(6, "der Donnerstag", "-e", "Thursday", "time", { r: "day", note: "Donner = thunder: Thor's day, same as English.", ex: ["Der Kurs ist am Donnerstag.", "The course is on Thursday."] });
  N(6, "der Freitag", "-e", "Friday", "time", { r: "day", ex: ["Am Freitag gehen wir ins Kino.", "On Friday we're going to the cinema."] });
  N(6, "der Samstag", "-e", "Saturday", "time", { r: "day", note: "In northern Germany also der Sonnabend.", ex: ["Am Samstag kaufe ich ein.", "On Saturday I go shopping."] });
  N(6, "der Sonntag", "-e", "Sunday", "time", { r: "day", ex: ["Am Sonntag ist der Supermarkt zu.", "On Sunday the supermarket is closed."] });
  N(6, "die Woche", "-n", "week", "time", { r: "e", ex: ["Die Woche hat sieben Tage.", "A week has seven days."] });
  N(6, "das Wochenende", "-n", "weekend", "time", { r: "comp", b: "das Ende", note: "Ends in -e but neuter: the last part, das Ende, decides.", ex: ["Was machst du am Wochenende?", "What are you doing at the weekend?"] });
  N(6, "der Tag", "-e", "day", "time", { ex: ["Ich lerne jeden Tag Deutsch.", "I learn German every day."] });
  N(6, "der Monat", "-e", "month", "time", { ex: ["Der Kurs dauert einen Monat.", "The course lasts a month."] });
  N(6, "das Jahr", "-e", "year", "time", { ex: ["Ich bin 30 Jahre alt.", "I'm 30 years old."] });
  N(6, "die Stunde", "-n", "hour; lesson", "time", { r: "e", ex: ["Der Film dauert zwei Stunden.", "The film lasts two hours."] });
  N(6, "die Minute", "-n", "minute", "time", { r: "e", ex: ["Der Bus kommt in fünf Minuten.", "The bus is coming in five minutes."] });
  N(6, "der Morgen", "-", "morning", "time", { r: "daytime", note: "der Morgen = morning; morgen (lowercase) = tomorrow.", ex: ["Am Morgen trinke ich Kaffee.", "In the morning I drink coffee."] });
  N(6, "der Mittag", "-e", "noon, midday", "time", { r: "daytime", ex: ["Wir essen am Mittag zusammen.", "We eat together at midday."] });
  N(6, "der Abend", "-e", "evening", "time", { r: "daytime", ex: ["Am Abend koche ich.", "In the evening I cook."] });
  N(6, "die Nacht", "¨-e", "night", "time", { r: "ex-daytime", ex: ["Die Nacht ist kalt.", "The night is cold."] });
  N(6, "die Zeit", "-en", "time", "abs", { m: 1, ex: ["Ich habe keine Zeit.", "I don't have time."] });
  N(6, "der Termin", "-e", "appointment", "abs", { ex: ["Ich habe morgen einen Termin.", "I have an appointment tomorrow."] });
  N(6, "der Geburtstag", "-e", "birthday", "time", { r: "comp", b: "der Tag", ex: ["Wann hast du Geburtstag?", "When is your birthday?"] });
  W(6, "heute", "today", { ex: ["Heute ist Montag.", "Today is Monday."] });
  W(6, "morgen", "tomorrow", { note: "morgen früh = tomorrow morning. der Morgen (capital M) = the morning.", ex: ["Morgen habe ich frei.", "Tomorrow I'm off."] });
  W(6, "gestern", "yesterday", { ex: ["Gestern war ich krank.", "Yesterday I was ill."] });
  W(6, "jetzt", "now", { ex: ["Ich habe jetzt keine Zeit.", "I don't have time now."] });
  W(6, "später", "later", { ex: ["Ich rufe dich später an.", "I'll call you later."] });
  W(6, "bald", "soon", { ex: ["Bis bald!", "See you soon!"] });
  W(6, "immer", "always", { ex: ["Er ist immer müde.", "He's always tired."] });
  W(6, "oft", "often", { ex: ["Ich gehe oft ins Kino.", "I often go to the cinema."] });
  W(6, "manchmal", "sometimes", { ex: ["Manchmal koche ich.", "Sometimes I cook."] });
  W(6, "nie", "never", { ex: ["Ich trinke nie Kaffee.", "I never drink coffee."] });
  W(6, "früh", "early", { ex: ["Ich stehe früh auf.", "I get up early."] });
  W(6, "spät", "late", { ex: ["Es ist schon spät.", "It's already late."] });
  P(6, "Wie spät ist es?", "What time is it?", { alt: ["Wie viel Uhr ist es?"], note: "Literally 'How late is it?'", ex: ["Wie spät ist es? — Es ist halb drei.", "What time is it? — It's half past two."] });
  P(6, "Um wie viel Uhr?", "At what time?", { ex: ["Um wie viel Uhr kommst du? — Um acht.", "What time are you coming? — At eight."] });
  P(6, "Wie alt bist du?", "How old are you?", { ex: ["Wie alt bist du? — Ich bin 25.", "How old are you? — I'm 25."] });
  P(6, "am Montag", "on Monday", { note: "am = an dem. Days and parts of the day use am: am Abend, am Wochenende.", ex: ["Am Montag habe ich einen Kurs.", "On Monday I have a class."] });
  N(6, "der Januar", "-e", "January", "time", { r: "month", px: 1, ex: ["Im Januar ist es kalt.", "It's cold in January."] });
  N(6, "der Februar", "-e", "February", "time", { r: "month", px: 1, ex: ["Der Februar hat 28 Tage.", "February has 28 days."] });
  N(6, "der März", "-e", "March", "time", { r: "month", px: 1, ex: ["Mein Geburtstag ist im März.", "My birthday is in March."] });
  N(6, "der April", "-e", "April", "time", { r: "month", px: 1, ex: ["Im April regnet es oft.", "It often rains in April."] });
  N(6, "der Mai", "-e", "May", "time", { r: "month", px: 1, ex: ["Der erste Mai ist ein Feiertag.", "The first of May is a public holiday."] });
  N(6, "der Juni", "-s", "June", "time", { r: "month", px: 1, ex: ["Im Juni fahren wir ans Meer.", "In June we're going to the seaside."] });
  N(6, "der Juli", "-s", "July", "time", { r: "month", px: 1, ex: ["Im Juli ist es heiß.", "It's hot in July."] });
  N(6, "der August", "-e", "August", "time", { r: "month", px: 1, ex: ["Im August habe ich Urlaub.", "I'm on holiday in August."] });
  N(6, "der September", "-", "September", "time", { r: "month", px: 1, ex: ["Im September fängt die Schule an.", "School starts in September."] });
  N(6, "der Oktober", "-", "October", "time", { r: "month", px: 1, ex: ["Im Oktober ist das Wetter oft schlecht.", "In October the weather is often bad."] });
  N(6, "der November", "-", "November", "time", { r: "month", px: 1, ex: ["Der November ist grau und kalt.", "November is grey and cold."] });
  N(6, "der Dezember", "-", "December", "time", { r: "month", px: 1, ex: ["Im Dezember feiern wir Weihnachten.", "In December we celebrate Christmas."] });
  P(6, "Welches Datum ist heute?", "What's the date today?", { alt: ["Der Wievielte ist heute?"], ex: ["Welches Datum ist heute? — Der dritte Mai.", "What's the date today? — The third of May."] });

  // Unit 7 — Alltag
  Vb(7, "sprechen", "to speak", { k: "e>i", pp: "gesprochen", c: "Deutsch", ex: ["Sprichst du Englisch?", "Do you speak English?"] });
  Vb(7, "lesen", "to read", { k: "e>ie", pp: "gelesen", c: "die Zeitung", ex: ["Ich lese gern Bücher.", "I like reading books."] });
  Vb(7, "sehen", "to see", { k: "e>ie", pp: "gesehen", c: "einen Film", ex: ["Siehst du den Bus?", "Do you see the bus?"] });
  Vb(7, "schlafen", "to sleep", { k: "a>ä", pp: "geschlafen", c: "lange", ex: ["Am Sonntag schläft Paul lange.", "On Sunday Paul sleeps late."] });
  Vb(7, "fahren", "to drive, to go (by vehicle)", { k: "a>ä", pp: "gefahren", aux: "s", c: "nach Berlin", ex: ["Er fährt mit dem Bus.", "He goes by bus."] });
  Vb(7, "laufen", "to run, to walk", { k: "au>äu", pp: "gelaufen", aux: "s", c: "schnell", ex: ["Ich laufe jeden Morgen im Park.", "I run in the park every morning."] });
  Vb(7, "treffen", "to meet", { k: "e>i", pp: "getroffen", c: "Freunde", ex: ["Am Abend treffe ich Freunde.", "In the evening I'm meeting friends."] });
  Vb(7, "helfen", "to help", { k: "e>i", pp: "geholfen", c: "gern", ex: ["Kannst du mir helfen?", "Can you help me?"] });
  Vb(7, "geben", "to give", { k: "e>i", pp: "gegeben", c: "dem Kind das Buch", ex: ["Gibst du mir das Buch?", "Will you give me the book?"] });
  Vb(7, "vergessen", "to forget", { k: "e>i", pp: "vergessen", c: "den Schlüssel", ex: ["Ich vergesse immer den Schlüssel.", "I always forget the key."] });
  Vb(7, "gehen", "to go (on foot)", { pp: "gegangen", aux: "s", c: "nach Hause", ex: ["Wir gehen nach Hause.", "We're going home."] });
  Vb(7, "duschen", "to shower", { pp: "geduscht", c: "am Morgen", ex: ["Ich dusche am Morgen.", "I shower in the morning."] });
  Vb(7, "aufstehen", "to get up", { sep: "auf", pp: "aufgestanden", aux: "s", c: "um sieben Uhr", ex: ["Ich stehe um sieben Uhr auf.", "I get up at seven."] });
  Vb(7, "einkaufen", "to go shopping", { sep: "ein", pp: "eingekauft", c: "im Supermarkt", ex: ["Ich kaufe im Supermarkt ein.", "I do the shopping at the supermarket."] });
  Vb(7, "anrufen", "to call (phone)", { sep: "an", pp: "angerufen", c: "meine Mutter", ex: ["Ich rufe dich morgen an.", "I'll call you tomorrow."] });
  Vb(7, "fernsehen", "to watch TV", { sep: "fern", k: "e>ie", pp: "ferngesehen", c: "am Abend", ex: ["Am Abend sehe ich fern.", "In the evening I watch TV."] });
  Vb(7, "anfangen", "to begin, to start", { sep: "an", k: "a>ä", pp: "angefangen", c: "um neun Uhr", ex: ["Der Kurs fängt um neun Uhr an.", "The course starts at nine."] });
  Vb(7, "aufräumen", "to tidy up", { sep: "auf", pp: "aufgeräumt", c: "das Zimmer", ex: ["Ich räume mein Zimmer auf.", "I'm tidying up my room."] });
  Vb(7, "mitkommen", "to come along", { sep: "mit", pp: "mitgekommen", aux: "s", c: "heute", ex: ["Kommst du mit?", "Are you coming along?"] });
  N(7, "die Schule", "-n", "school", "place in", { r: "e", ex: ["Die Schule fängt um acht Uhr an.", "School starts at eight o'clock."] });
  N(7, "der Kurs", "-e", "course, class", "abs", { ex: ["Der Kurs ist sehr gut.", "The course is very good."] });
  N(7, "die Hausaufgabe", "-n", "homework (task)", "abs", { r: "comp", b: "die Aufgabe", note: "Usually plural: Hausaufgaben machen = to do homework.", ex: ["Ich mache die Hausaufgaben.", "I'm doing my homework."] });
  N(7, "der Wecker", "-", "alarm clock", "thing home", { r: "er", ex: ["Der Wecker klingelt um sechs Uhr.", "The alarm clock rings at six."] });
  N(7, "die Pause", "-n", "break", "abs", { r: "e", ex: ["Wir machen eine Pause.", "We're taking a break."] });
  N(7, "die Dusche", "-n", "shower", "home", { r: "e", ex: ["Die Dusche ist kaputt.", "The shower is broken."] });
  W(7, "zuerst", "first, at first", { ex: ["Zuerst frühstücke ich.", "First I have breakfast."] });
  W(7, "dann", "then", { ex: ["Dann frühstücke ich.", "Then I have breakfast."] });
  W(7, "danach", "after that, afterwards", { ex: ["Danach gehe ich zur Arbeit.", "After that I go to work."] });
  W(7, "zusammen", "together", { ex: ["Wir kochen zusammen.", "We cook together."] });
  W(7, "allein", "alone", { ex: ["Ich wohne allein.", "I live alone."] });
  P(7, "Ich habe keine Zeit.", "I don't have time.", { ex: ["Tut mir leid, ich habe keine Zeit.", "Sorry, I don't have time."] });
  P(7, "Bis morgen!", "See you tomorrow!", { ex: ["Tschüss, Anna! Bis morgen!", "Bye, Anna! See you tomorrow!"] });

  // Unit 8 — In der Stadt
  N(8, "der Bahnhof", "¨-e", "train station", "place zu", { r: "comp", b: "der Hof", ex: ["Der Bahnhof ist nicht weit.", "The station isn't far."] });
  N(8, "der Bus", "-se", "bus", "trans", { ex: ["Ich fahre mit dem Bus.", "I go by bus."] });
  N(8, "die U-Bahn", "-en", "underground, subway", "trans", { r: "comp", b: "die Bahn", ex: ["Ich fahre mit der U-Bahn.", "I take the underground."] });
  N(8, "der Zug", "¨-e", "train", "trans", { ex: ["Der Zug ist pünktlich.", "The train is on time."] });
  N(8, "das Fahrrad", "¨-er", "bicycle", "trans", { r: "comp", b: "das Rad", ex: ["Ich fahre mit dem Fahrrad zur Arbeit.", "I cycle to work."] });
  N(8, "das Taxi", "-s", "taxi", "trans", { ex: ["Wir nehmen ein Taxi.", "We're taking a taxi."] });
  N(8, "die Straße", "-n", "street", "place", { r: "e", ex: ["Die Straße ist sehr lang.", "The street is very long."] });
  N(8, "der Platz", "¨-e", "square; seat, space", "place", { ex: ["Ist der Platz frei?", "Is this seat free?"] });
  N(8, "die Post", "/", "post office; mail", "place zu", { ex: ["Ich gehe zur Post.", "I'm going to the post office."] });
  N(8, "die Bank", "-en", "bank", "place zu", { note: "Plural die Banken = banks; die Bänke = benches.", ex: ["Wo ist hier eine Bank?", "Where's a bank around here?"] });
  N(8, "die Apotheke", "-n", "pharmacy", "place zu in", { r: "e", ex: ["Die Apotheke ist dort links.", "The pharmacy is over there on the left."] });
  N(8, "der Supermarkt", "¨-e", "supermarket", "place zu in", { r: "comp", b: "der Markt", ex: ["Der Supermarkt ist hier rechts.", "The supermarket is here on the right."] });
  N(8, "das Kino", "-s", "cinema", "place in", { r: "o", ex: ["Wir gehen ins Kino.", "We're going to the cinema."] });
  N(8, "das Museum", "=Museen", "museum", "place in", { r: "um", ex: ["Das Museum ist am Montag zu.", "The museum is closed on Monday."] });
  N(8, "das Hotel", "-s", "hotel", "place in", { ex: ["Das Hotel ist im Zentrum.", "The hotel is in the centre."] });
  N(8, "das Krankenhaus", "¨-er", "hospital", "place in", { r: "comp", b: "das Haus", note: "Literally 'sick house'.", ex: ["Wo ist das Krankenhaus?", "Where is the hospital?"] });
  N(8, "der Park", "-s", "park", "place in", { ex: ["Der Park ist sehr schön.", "The park is very nice."] });
  N(8, "das Café", "-s", "café", "place in", { ex: ["Das Café ist am Sonntag offen.", "The café is open on Sunday."] });
  N(8, "die Bäckerei", "-en", "bakery", "place zu in", { r: "ei", ex: ["Ich kaufe Brötchen in der Bäckerei.", "I buy bread rolls at the bakery."] });
  N(8, "der Arzt", "¨-e", "doctor (male)", "person zu", { r: "sex", ex: ["Ich muss zum Arzt.", "I have to go to the doctor."] });
  N(8, "die Ärztin", "-nen", "doctor (female)", "person", { r: "in", ex: ["Die Ärztin ist sehr nett.", "The doctor is very nice."] });
  N(8, "der Flughafen", "¨", "airport", "place zu", { r: "comp", b: "der Hafen", note: "Literally 'flight harbour'.", ex: ["Der Flughafen ist weit.", "The airport is far."] });
  N(8, "die Haltestelle", "-n", "stop (bus, tram)", "place zu", { r: "comp", b: "die Stelle", ex: ["Die Haltestelle ist dort.", "The stop is over there."] });
  N(8, "die Fahrkarte", "-n", "ticket (travel)", "thing", { r: "comp", b: "die Karte", ex: ["Ich brauche eine Fahrkarte.", "I need a ticket."] });
  N(8, "das Zentrum", "=Zentren", "centre (of town)", "place in", { r: "um", ex: ["Ich wohne im Zentrum.", "I live in the centre."] });
  W(8, "links", "left, on the left", { ex: ["Gehen Sie hier links.", "Turn left here."] });
  W(8, "rechts", "right, on the right", { ex: ["Die Post ist rechts.", "The post office is on the right."] });
  W(8, "geradeaus", "straight ahead", { ex: ["Gehen Sie immer geradeaus.", "Keep going straight ahead."] });
  W(8, "hier", "here", { ex: ["Wohnst du hier?", "Do you live here?"] });
  W(8, "dort", "there", { ex: ["Dort ist der Bahnhof.", "The station is over there."] });
  W(8, "weit", "far", { ex: ["Ist das weit?", "Is it far?"] });
  W(8, "nah", "near, close", { ex: ["Der Park ist ganz nah.", "The park is very close."] });
  Vb(8, "zeigen", "to show", { pp: "gezeigt", c: "den Weg", ex: ["Kannst du mir den Weg zeigen?", "Can you show me the way?"] });
  Vb(8, "ankommen", "to arrive", { sep: "an", pp: "angekommen", aux: "s", c: "um acht Uhr", ex: ["Wann kommst du in Berlin an?", "When do you arrive in Berlin?"] });
  P(8, "Wo ist der Bahnhof?", "Where is the train station?", { ex: ["Entschuldigung, wo ist der Bahnhof?", "Excuse me, where is the station?"] });
  P(8, "Wie komme ich zum Bahnhof?", "How do I get to the station?", { ex: ["Wie komme ich zum Bahnhof? — Gehen Sie geradeaus.", "How do I get to the station? — Go straight ahead."] });
  P(8, "zu Fuß", "on foot", { note: "No mit here: Ich gehe zu Fuß = I walk.", ex: ["Ich gehe zu Fuß zur Arbeit.", "I walk to work."] });
  P(8, "Gibt es hier eine Apotheke?", "Is there a pharmacy here?", { note: "es gibt = there is / there are. It's followed by the accusative: Gibt es hier einen Supermarkt?", ex: ["Entschuldigung, gibt es hier eine Apotheke? — Ja, dort links.", "Excuse me, is there a pharmacy here? — Yes, over there on the left."] });

  // Unit 9 — Können & müssen
  Vb(9, "können", "can, to be able to", { k: "mod", f: ["kann", "kannst", "kann", "können", "könnt", "können"], c: "gut schwimmen", ex: ["Ich kann gut schwimmen.", "I can swim well."] });
  Vb(9, "müssen", "must, to have to", { k: "mod", f: ["muss", "musst", "muss", "müssen", "müsst", "müssen"], c: "heute arbeiten", ex: ["Ich muss heute arbeiten.", "I have to work today."] });
  Vb(9, "wollen", "to want (to)", { k: "mod", f: ["will", "willst", "will", "wollen", "wollt", "wollen"], c: "Deutsch lernen", note: "Careful: ich will = I want (not 'I will').", ex: ["Wir wollen am Samstag ins Kino gehen.", "We want to go to the cinema on Saturday."] });
  Vb(9, "dürfen", "may, to be allowed to", { k: "mod", f: ["darf", "darfst", "darf", "dürfen", "dürft", "dürfen"], c: "hier spielen", ex: ["Darf ich das Fenster öffnen?", "May I open the window?"] });
  Vb(9, "sollen", "should, to be supposed to", { k: "mod", f: ["soll", "sollst", "soll", "sollen", "sollt", "sollen"], c: "mehr schlafen", ex: ["Du sollst mehr Wasser trinken.", "You should drink more water."] });
  Vb(9, "schwimmen", "to swim", { pp: "geschwommen", aux: "s", c: "gern", ex: ["Wir schwimmen gern im Meer.", "We like swimming in the sea."] });
  Vb(9, "singen", "to sing", { pp: "gesungen", c: "gern", ex: ["Sie singt sehr schön.", "She sings beautifully."] });
  Vb(9, "fotografieren", "to take photos", { pp: "fotografiert", c: "gern", ex: ["Im Urlaub fotografiere ich viel.", "On holiday I take lots of photos."] });
  N(9, "der Sport", "/", "sport(s)", "leisure", { m: 1, ex: ["Ich mache viel Sport.", "I do a lot of sport."] });
  N(9, "der Fußball", "¨-e", "football, soccer", "leisure thing", { r: "comp", b: "der Ball", ex: ["Am Samstag spielen wir Fußball.", "On Saturday we play football."] });
  N(9, "die Musik", "/", "music", "leisure", { r: "ik", m: 1, ex: ["Ich mache gern Musik.", "I like making music."] });
  N(9, "das Konzert", "-e", "concert", "leisure", { ex: ["Das Konzert fängt um acht Uhr an.", "The concert starts at eight."] });
  N(9, "der Film", "-e", "film, movie", "leisure", { ex: ["Der Film ist super.", "The film is great."] });
  N(9, "das Spiel", "-e", "game; match", "leisure", { ex: ["Das Spiel ist um drei Uhr.", "The match is at three."] });
  N(9, "das Wetter", "/", "weather", "abs", { m: 1, ex: ["Wie ist das Wetter?", "What's the weather like?"] });
  N(9, "die Sonne", "-n", "sun", "abs", { r: "e", ex: ["Die Sonne scheint.", "The sun is shining."] });
  N(9, "der Regen", "/", "rain", "abs", { r: "weather", m: 1, ex: ["Ich mag keinen Regen.", "I don't like rain."] });
  N(9, "der Schnee", "/", "snow", "abs", { r: "weather", m: 1, ex: ["Im Winter gibt es viel Schnee.", "In winter there's a lot of snow."] });
  N(9, "die Freizeit", "/", "free time", "abs", { r: "comp", b: "die Zeit", m: 1, ex: ["In meiner Freizeit lese ich gern.", "In my free time I like reading."] });
  N(9, "die Lust", "/", "desire (to do something)", "abs", { m: 1, note: "Lust haben = to feel like (doing) something.", ex: ["Hast du Lust auf Pizza?", "Do you fancy pizza?"] });
  W(9, "schnell", "fast, quick", { ex: ["Der Zug ist sehr schnell.", "The train is very fast."] });
  W(9, "langsam", "slow", { ex: ["Sprechen Sie bitte langsam.", "Please speak slowly."] });
  W(9, "leicht", "easy; light", { ex: ["Die Übung ist leicht.", "The exercise is easy."] });
  W(9, "schwer", "difficult; heavy", { ex: ["Deutsch ist nicht so schwer.", "German isn't that hard."] });
  W(9, "wichtig", "important", { ex: ["Das ist sehr wichtig.", "That's very important."] });
  W(9, "frei", "free", { ex: ["Am Freitag habe ich frei.", "I'm off on Friday."] });
  W(9, "lange", "(for) a long time", { ex: ["Wir warten schon lange.", "We've been waiting for a long time."] });
  P(9, "Ich habe keine Lust.", "I don't feel like it.", { ex: ["Kino? Nein, ich habe keine Lust.", "Cinema? No, I don't feel like it."] });
  P(9, "Hast du Zeit?", "Do you have time?", { ex: ["Hast du Zeit? Wir gehen ins Café.", "Do you have time? We're going to the café."] });
  P(9, "Das macht Spaß!", "That's fun!", { ex: ["Tanzen? Das macht Spaß!", "Dancing? That's fun!"] });
  P(9, "Es regnet.", "It's raining.", { ex: ["Es regnet. Wir bleiben zu Hause.", "It's raining. We're staying at home."] });

  // Unit 10 — Fragen & Verneinung
  W(10, "wer", "who", { ex: ["Wer ist das?", "Who is that?"] });
  W(10, "was", "what", { ex: ["Was machst du heute?", "What are you doing today?"] });
  W(10, "wo", "where", { ex: ["Wo wohnst du?", "Where do you live?"] });
  W(10, "woher", "where from", { ex: ["Woher kommst du?", "Where are you from?"] });
  W(10, "wohin", "where to", { ex: ["Wohin fährst du?", "Where are you going?"] });
  W(10, "wann", "when", { ex: ["Wann kommst du?", "When are you coming?"] });
  W(10, "wie", "how", { ex: ["Wie findest du das Buch?", "What do you think of the book?"] });
  W(10, "wie viel", "how much", { ex: ["Wie viel kostet das?", "How much does that cost?"] });
  W(10, "wie viele", "how many", { ex: ["Wie viele Kinder hast du?", "How many children do you have?"] });
  W(10, "warum", "why", { ex: ["Warum lernst du Deutsch?", "Why are you learning German?"] });
  W(10, "nicht", "not", { ex: ["Ich komme heute nicht.", "I'm not coming today."] });
  W(10, "kein", "no, not a, not any", { ex: ["Ich habe kein Auto.", "I don't have a car."] });
  W(10, "vielleicht", "maybe, perhaps", { ex: ["Vielleicht komme ich morgen.", "Maybe I'll come tomorrow."] });
  W(10, "natürlich", "of course", { ex: ["Natürlich helfe ich dir.", "Of course I'll help you."] });
  W(10, "leider", "unfortunately", { ex: ["Ich habe leider keine Zeit.", "Unfortunately I don't have time."] });
  W(10, "wirklich", "really", { ex: ["Das ist wirklich gut!", "That's really good!"] });
  W(10, "doch", "yes (to a negative question)", { note: "Kommst du nicht? — Doch! = Yes, I am (coming)!", ex: ["Kommst du nicht? — Doch!", "Aren't you coming? — Yes, I am!"] });
  W(10, "denn", "because", { note: "denn links two sentences and doesn't change the word order: …, denn ich bin krank.", ex: ["Ich bleibe zu Hause, denn ich bin krank.", "I'm staying at home because I'm ill."] });
  Vb(10, "antworten", "to answer", { pp: "geantwortet", c: "schnell", ex: ["Bitte antworten Sie schnell.", "Please answer quickly."] });
  Vb(10, "glauben", "to believe, to think", { pp: "geglaubt", c: "das nicht", ex: ["Ich glaube, das ist richtig.", "I think that's right."] });
  Vb(10, "erklären", "to explain", { pp: "erklärt", c: "die Grammatik", ex: ["Kannst du mir das erklären?", "Can you explain that to me?"] });
  P(10, "Wie bitte?", "Pardon? / Sorry? (didn't hear)", { ex: ["Wie bitte? Ich verstehe nicht.", "Pardon? I don't understand."] });
  P(10, "Was bedeutet das?", "What does that mean?", { ex: ["Was bedeutet das auf Englisch?", "What does that mean in English?"] });
  P(10, "Wie sagt man das auf Deutsch?", "How do you say that in German?", { ex: ["Wie sagt man das auf Deutsch? — Das ist ein Wecker.", "How do you say that in German? — That's an alarm clock."] });
  P(10, "Ich weiß es nicht.", "I don't know.", { alt: ["Ich weiß nicht."], ex: ["Wo ist Paul? — Ich weiß es nicht.", "Where's Paul? — I don't know."] });

  // Unit 11 — Gestern
  Vb(11, "fliegen", "to fly", { pp: "geflogen", aux: "s", c: "nach Rom", ex: ["Im Sommer fliegen wir nach Spanien.", "In summer we're flying to Spain."] });
  Vb(11, "bleiben", "to stay", { pp: "geblieben", aux: "s", c: "zu Hause", note: "Perfekt with sein even though you don't move: Ich bin zu Hause geblieben.", ex: ["Heute bleibe ich zu Hause.", "Today I'm staying at home."] });
  Vb(11, "erzählen", "to tell (a story)", { pp: "erzählt", c: "eine Geschichte", ex: ["Opa erzählt eine Geschichte.", "Grandpa is telling a story."] });
  N(11, "der Urlaub", "-e", "holiday, vacation", "abs", { ex: ["Wie war dein Urlaub?", "How was your holiday?"] });
  N(11, "die Reise", "-n", "trip, journey", "abs", { r: "e", ex: ["Die Reise war sehr schön.", "The trip was very nice."] });
  N(11, "das Meer", "-e", "sea", "place", { ex: ["Das Meer ist warm.", "The sea is warm."] });
  N(11, "der Strand", "¨-e", "beach", "place", { ex: ["Wir waren jeden Tag am Strand.", "We were on the beach every day."] });
  N(11, "der Berg", "-e", "mountain", "place", { ex: ["Der Berg ist sehr hoch.", "The mountain is very high."] });
  N(11, "das Foto", "-s", "photo", "thing", { r: "o", ex: ["Das Foto ist schön!", "The photo is lovely!"] });
  N(11, "die Party", "-s", "party", "abs", { ex: ["Die Party war toll!", "The party was great!"] });
  W(11, "schon", "already", { ex: ["Ich habe schon gegessen.", "I've already eaten."] });
  W(11, "noch nicht", "not yet", { ex: ["Ich habe noch nicht gegessen.", "I haven't eaten yet."] });
  W(11, "vorgestern", "the day before yesterday", { ex: ["Vorgestern war ich im Kino.", "The day before yesterday I was at the cinema."] });
  P(11, "letzte Woche", "last week", { ex: ["Letzte Woche war ich krank.", "Last week I was ill."] });
  P(11, "Was hast du am Wochenende gemacht?", "What did you do at the weekend?", { ex: ["Was hast du am Wochenende gemacht? — Ich habe Fußball gespielt.", "What did you do at the weekend? — I played football."] });
  P(11, "Wie war dein Urlaub?", "How was your holiday?", { note: "war = was. For sein Germans use war, not ist gewesen.", ex: ["Wie war dein Urlaub? — Super!", "How was your holiday? — Great!"] });
  P(11, "Ich war in Spanien.", "I was in Spain.", { ex: ["Ich war in Spanien. Es war sehr warm.", "I was in Spain. It was very warm."] });
  P(11, "Das war toll!", "That was great!", { ex: ["Danke für den Abend. Das war toll!", "Thanks for the evening. That was great!"] });

  // Unit 12 — Einkaufen
  N(12, "die Kleidung", "/", "clothes, clothing", "abs", { r: "ung", m: 1, note: "A singular word for all your clothes: Die Kleidung ist hier billig.", ex: ["Im Kaufhaus gibt es Kleidung.", "There are clothes in the department store."] });
  N(12, "die Hose", "-n", "trousers, pants", "thing clothes", { r: "e", note: "Singular in German: eine Hose = one pair of trousers.", ex: ["Ich suche eine Hose.", "I'm looking for trousers."] });
  N(12, "das Hemd", "-en", "shirt", "thing clothes", { ex: ["Das Hemd ist zu klein.", "The shirt is too small."] });
  N(12, "die Bluse", "-n", "blouse", "thing clothes", { r: "e", ex: ["Die Bluse gefällt mir.", "I like the blouse."] });
  N(12, "das T-Shirt", "-s", "T-shirt", "thing clothes", { ex: ["Im Sommer trage ich ein T-Shirt.", "In summer I wear a T-shirt."] });
  N(12, "der Pullover", "-", "jumper, sweater", "thing clothes", { note: "Ends in -er but isn't a person or a machine: just learn der Pullover.", ex: ["Der Pullover ist schön warm.", "The jumper is nice and warm."] });
  N(12, "die Jacke", "-n", "jacket", "thing clothes", { r: "e", ex: ["Ich brauche eine Jacke.", "I need a jacket."] });
  N(12, "der Mantel", "¨", "coat", "thing clothes", { ex: ["Der Mantel ist zu teuer.", "The coat is too expensive."] });
  N(12, "das Kleid", "-er", "dress", "thing clothes", { ex: ["Das Kleid ist rot.", "The dress is red."] });
  N(12, "der Rock", "¨-e", "skirt", "thing clothes", { ex: ["Der Rock ist zu kurz.", "The skirt is too short."] });
  N(12, "der Schuh", "-e", "shoe", "thing clothes", { ex: ["Die Schuhe sind neu.", "The shoes are new."] });
  N(12, "die Socke", "-n", "sock", "thing clothes", { r: "e", ex: ["Wo sind meine Socken?", "Where are my socks?"] });
  N(12, "die Mütze", "-n", "woolly hat, cap", "thing clothes", { r: "e", ex: ["Im Winter trage ich eine Mütze.", "In winter I wear a woolly hat."] });
  N(12, "die Brille", "-n", "glasses", "thing", { r: "e", note: "Singular in German: eine Brille = a pair of glasses.", ex: ["Wo ist meine Brille?", "Where are my glasses?"] });
  N(12, "der Regenschirm", "-e", "umbrella", "thing", { r: "comp", b: "der Schirm", ex: ["Es regnet. Hast du einen Regenschirm?", "It's raining. Do you have an umbrella?"] });
  N(12, "die Größe", "-n", "size", "abs", { r: "e", ex: ["Die Hose gibt es auch in Größe M.", "The trousers also come in size M."] });
  N(12, "die Farbe", "-n", "colour", "abs", { r: "e", ex: ["Welche Farbe hat dein Auto?", "What colour is your car?"] });
  N(12, "das Kaufhaus", "¨-er", "department store", "place zu in", { r: "comp", b: "das Haus", ex: ["Das Kaufhaus ist im Zentrum.", "The department store is in the centre."] });
  N(12, "die Kasse", "-n", "checkout, till", "place zu", { r: "e", ex: ["Bitte zahlen Sie an der Kasse.", "Please pay at the checkout."] });
  N(12, "der Preis", "-e", "price", "abs", { ex: ["Der Preis ist gut.", "The price is good."] });
  N(12, "das Angebot", "-e", "special offer", "abs", { ex: ["Die Schuhe sind im Angebot.", "The shoes are on special offer."] });
  W(12, "rot", "red", { ex: ["Das Auto ist rot.", "The car is red."] });
  W(12, "blau", "blue", { ex: ["Der Himmel ist blau.", "The sky is blue."] });
  W(12, "grün", "green", { ex: ["Die Jacke ist grün.", "The jacket is green."] });
  W(12, "gelb", "yellow", { ex: ["Die Banane ist gelb.", "The banana is yellow."] });
  W(12, "schwarz", "black", { ex: ["Ich trinke den Kaffee schwarz.", "I drink my coffee black."] });
  W(12, "weiß", "white", { ex: ["Im Winter ist alles weiß.", "In winter everything is white."] });
  W(12, "grau", "grey", { ex: ["Der Pullover ist grau.", "The jumper is grey."] });
  W(12, "braun", "brown", { ex: ["Mein Hund ist braun.", "My dog is brown."] });
  W(12, "bunt", "colourful", { ex: ["Das Kleid ist sehr bunt.", "The dress is very colourful."] });
  W(12, "lang", "long", { ex: ["Der Rock ist zu lang.", "The skirt is too long."] });
  W(12, "kurz", "short", { ex: ["Der Film ist kurz.", "The film is short."] });
  W(12, "für", "for", { note: "Always followed by the accusative: für meinen Bruder.", ex: ["Das Geschenk ist für meine Mutter.", "The present is for my mother."] });
  W(12, "ohne", "without", { note: "Always followed by the accusative: ohne meinen Schlüssel.", ex: ["Ich trinke Kaffee ohne Zucker.", "I drink coffee without sugar."] });
  Vb(12, "tragen", "to wear; to carry", { k: "a>ä", pp: "getragen", c: "eine Brille", ex: ["Er trägt heute ein Hemd.", "He's wearing a shirt today."] });
  Vb(12, "anziehen", "to put on (clothes)", { sep: "an", pp: "angezogen", c: "eine Jacke", ex: ["Ich ziehe eine Jacke an.", "I'm putting on a jacket."] });
  Vb(12, "anprobieren", "to try on", { sep: "an", pp: "anprobiert", c: "die Hose", ex: ["Kann ich die Schuhe anprobieren?", "Can I try on the shoes?"] });
  Vb(12, "gefallen", "to be liked by (Das gefällt mir = I like it)", { k: "a>ä", pp: "gefallen", nc: 1, np: 1, note: "The thing you like is the subject and the person is in the dative: Die Jacke gefällt mir.", ex: ["Das Kleid gefällt mir.", "I like the dress."] });
  P(12, "Kann ich Ihnen helfen?", "Can I help you?", { ex: ["Guten Tag! Kann ich Ihnen helfen? — Ja, ich suche eine Jacke.", "Hello! Can I help you? — Yes, I'm looking for a jacket."] });
  P(12, "Welche Größe haben Sie?", "What size are you?", { ex: ["Welche Größe haben Sie? — Größe 38.", "What size are you? — Size 38."] });
  P(12, "Kann ich das anprobieren?", "Can I try this on?", { ex: ["Kann ich das anprobieren? — Ja, natürlich.", "Can I try this on? — Yes, of course."] });
  P(12, "Das gefällt mir.", "I like it.", { note: "Literally 'That pleases me'. The thing you like is the subject.", ex: ["Die Farbe ist schön. Das gefällt mir.", "The colour is nice. I like it."] });
  P(12, "Das nehme ich.", "I'll take it.", { ex: ["Die Jacke kostet 50 Euro? Das nehme ich.", "The jacket costs 50 euros? I'll take it."] });
  P(12, "zu groß", "too big", { note: "zu before an adjective means 'too'. That's a different job from zu = to (zum Arzt).", ex: ["Die Schuhe sind zu groß.", "The shoes are too big."] });

  // Unit 13 — Gesundheit
  N(13, "der Körper", "-", "body", "body", { ex: ["Sport ist gut für den Körper.", "Sport is good for the body."] });
  N(13, "der Kopf", "¨-e", "head", "body", { ex: ["Ich habe Fieber und mein Kopf ist heiß.", "I have a temperature and my head is hot."] });
  N(13, "der Bauch", "¨-e", "belly, stomach", "body", { ex: ["Das Baby schläft auf dem Bauch.", "The baby sleeps on its tummy."] });
  N(13, "der Rücken", "-", "back", "body", { ex: ["Der Rücken tut mir weh.", "My back hurts."] });
  N(13, "der Arm", "-e", "arm", "body", { ex: ["Er trägt die Tasche unter dem Arm.", "He's carrying the bag under his arm."] });
  N(13, "das Bein", "-e", "leg", "body", { ex: ["Ich habe Schmerzen im Bein.", "I have a pain in my leg."] });
  N(13, "die Hand", "¨-e", "hand", "body", { ex: ["Meine Hand ist kalt.", "My hand is cold."] });
  N(13, "der Fuß", "¨-e", "foot", "body", { ex: ["Der Schuh ist zu klein für meinen Fuß.", "The shoe is too small for my foot."] });
  N(13, "das Auge", "-n", "eye", "body", { r: "ex-e", ex: ["Sie hat blaue Augen.", "She has blue eyes."] });
  N(13, "das Ohr", "-en", "ear", "body", { ex: ["Mein Ohr tut weh.", "My ear hurts."] });
  N(13, "die Nase", "-n", "nose", "body", { r: "e", ex: ["Meine Nase ist rot.", "My nose is red."] });
  N(13, "der Mund", "¨-er", "mouth", "body", { ex: ["Mach bitte den Mund auf.", "Please open your mouth."] });
  N(13, "der Zahn", "¨-e", "tooth", "body", { ex: ["Der Zahn tut sehr weh.", "The tooth hurts a lot."] });
  N(13, "der Hals", "¨-e", "neck; throat", "body", { ex: ["Mein Hals tut weh.", "My throat hurts."] });
  N(13, "die Kopfschmerzen", "pl", "headache", "abs", { r: "pl", note: "Plural in German: Ich habe Kopfschmerzen. Same pattern: Bauchschmerzen, Halsschmerzen.", ex: ["Ich habe Kopfschmerzen.", "I have a headache."] });
  N(13, "das Fieber", "/", "fever, temperature", "abs", { m: 1, ex: ["Das Kind hat Fieber.", "The child has a temperature."] });
  N(13, "die Erkältung", "-en", "cold (illness)", "abs", { r: "ung", ex: ["Ich habe eine Erkältung.", "I have a cold."] });
  N(13, "die Tablette", "-n", "tablet, pill", "thing", { r: "e", ex: ["Nehmen Sie eine Tablette am Morgen.", "Take one tablet in the morning."] });
  N(13, "das Medikament", "-e", "medicine", "thing", { r: "ment", ex: ["Das Medikament gibt es in der Apotheke.", "You can get the medicine at the pharmacy."] });
  N(13, "das Rezept", "-e", "prescription; recipe", "thing", { ex: ["Die Ärztin schreibt ein Rezept.", "The doctor writes a prescription."] });
  N(13, "die Praxis", "=Praxen", "doctor's surgery, practice", "place zu in", { ex: ["Die Praxis ist am Mittwoch zu.", "The surgery is closed on Wednesday."] });
  N(13, "die Gesundheit", "/", "health", "abs", { r: "heit", m: 1, note: "Gesundheit! is also what you say when someone sneezes.", ex: ["Gesundheit ist wichtig.", "Health is important."] });
  W(13, "gesund", "healthy", { ex: ["Gemüse ist gesund.", "Vegetables are healthy."] });
  W(13, "erkältet", "having a cold", { ex: ["Ich bin erkältet.", "I have a cold."] });
  W(13, "leise", "quiet, quietly", { ex: ["Sprich bitte leise!", "Please speak quietly!"] });
  W(13, "laut", "loud, loudly", { ex: ["Die Musik ist zu laut.", "The music is too loud."] });
  Vb(13, "wehtun", "to hurt", { sep: "weh", pp: "wehgetan", nc: 1, np: 1, note: "The body part is the subject and the person is in the dative: Mir tut der Kopf weh. Several things: Mir tun die Füße weh.", ex: ["Mein Bein tut weh.", "My leg hurts."] });
  Vb(13, "liegen", "to lie (be lying down)", { pp: "gelegen", c: "im Bett", ex: ["Ich liege im Bett.", "I'm lying in bed."] });
  Vb(13, "gehören", "to belong to", { pp: "gehört", nc: 1, np: 1, note: "Takes the dative: Das Buch gehört mir = The book is mine.", ex: ["Das Buch gehört mir.", "The book is mine."] });
  Vb(13, "danken", "to thank", { pp: "gedankt", c: "dem Arzt", note: "Takes the dative: Ich danke dir.", ex: ["Ich danke dir!", "Thank you!"] });
  P(13, "Was fehlt Ihnen?", "What's the matter? (doctor, polite)", { ex: ["Was fehlt Ihnen? — Ich habe Fieber.", "What's the matter? — I have a temperature."] });
  P(13, "Mir tut der Kopf weh.", "My head hurts.", { alt: ["Mein Kopf tut weh."], note: "Literally 'To me the head hurts'. mir is the dative of ich.", ex: ["Mir tut der Kopf weh. Ich bleibe zu Hause.", "My head hurts. I'm staying at home."] });
  P(13, "Ich habe Fieber.", "I have a temperature.", { ex: ["Ich habe Fieber und Kopfschmerzen.", "I have a temperature and a headache."] });
  P(13, "Gute Besserung!", "Get well soon!", { ex: ["Du bist krank? Gute Besserung!", "You're ill? Get well soon!"] });
  P(13, "Ich brauche einen Termin.", "I need an appointment.", { ex: ["Guten Tag, ich brauche einen Termin beim Arzt.", "Hello, I need an appointment with the doctor."] });

  // ---------- extra nouns for "guess the gender" drills (never studied as cards) ----------
  const DEMO = [
    ["die Freiheit", "freedom", "heit"], ["die Schönheit", "beauty", "heit"], ["die Möglichkeit", "possibility", "keit"],
    ["die Süßigkeit", "sweet, candy", "keit"], ["die Freundschaft", "friendship", "schaft"], ["die Mannschaft", "team", "schaft"],
    ["die Information", "information", "ion"], ["die Situation", "situation", "ion"], ["die Universität", "university", "taet"],
    ["die Qualität", "quality", "taet"], ["die Politik", "politics", "ik"], ["die Physik", "physics", "ik"],
    ["die Polizei", "police", "ei"], ["die Metzgerei", "butcher's shop", "ei"], ["die Biologie", "biology", "ie"],
    ["die Fotografie", "photography", "ie"], ["die Übung", "exercise", "ung"], ["die Meinung", "opinion", "ung"],
    ["die Zeichnung", "drawing", "ung"], ["die Köchin", "cook (female)", "in"], ["die Verkäuferin", "shop assistant (female)", "in"],
    ["das Häuschen", "little house", "chen"], ["das Kätzchen", "kitten", "chen"], ["das Büchlein", "little book", "lein"],
    ["das Studium", "(university) studies", "um"], ["das Datum", "date", "um"], ["das Instrument", "instrument", "ment"],
    ["das Dokument", "document", "ment"], ["das Experiment", "experiment", "ment"], ["das Radio", "radio", "o"],
    ["das Büro", "office", "o"], ["das Konto", "bank account", "o"], ["das Gebäude", "building", "ge"],
    ["das Gespräch", "conversation", "ge"], ["das Getränk", "drink", "ge"], ["das Gepäck", "luggage", "ge"],
    ["das Lesen", "reading", "inf"], ["das Schwimmen", "swimming", "inf"], ["das Kochen", "cooking", "inf"],
    ["der Frühling", "spring", "ling"], ["der Lehrling", "apprentice", "ling"], ["der Schmetterling", "butterfly", "ling"],
    ["der Tourismus", "tourism", "ismus"], ["der Optimismus", "optimism", "ismus"], ["der Motor", "engine", "or"],
    ["der Doktor", "doctor (title)", "or"],
    ["der Herbst", "autumn", "season"], ["der Winter", "winter", "season"], ["der Sommer", "summer", "season"],
    ["der Wind", "wind", "weather"], ["der Nebel", "fog", "weather"], ["der Wodka", "vodka", "alc"], ["der Sekt", "sparkling wine", "alc"],
    ["der Fahrer", "driver", "er"], ["der Bäcker", "baker", "er"], ["der Spieler", "player", "er"],
    ["der Präsident", "president", "ent"], ["der Patient", "patient", "ent"],
    ["das Schlafzimmer", "bedroom", "comp", "das Zimmer"], ["das Wohnzimmer", "living room", "comp", "das Zimmer"],
    ["die Haustür", "front door", "comp", "die Tür"], ["der Küchentisch", "kitchen table", "comp", "der Tisch"],
    ["das Kinderbuch", "children's book", "comp", "das Buch"], ["die Handtasche", "handbag", "comp", "die Tasche"],
    ["der Hausschlüssel", "house key", "comp", "der Schlüssel"], ["der Apfelsaft", "apple juice", "comp", "der Saft"],
    ["die Kaffeetasse", "coffee cup", "comp", "die Tasse"], ["das Kinderzimmer", "children's room", "comp", "das Zimmer"],
  ].map(([de, en, r, b]) => ({ t: "n", de, en, r, b, demo: 1 }));

  // ---------- gender rules ----------
  const RULES = {
    ung: { g: "die", tag: "-ung", text: "Nouns ending in <b>-ung</b> are always feminine.", ex: "die Wohnung, die Zeitung, die Übung" },
    heit: { g: "die", tag: "-heit", text: "Nouns ending in <b>-heit</b> are always feminine.", ex: "die Freiheit, die Gesundheit" },
    keit: { g: "die", tag: "-keit", text: "Nouns ending in <b>-keit</b> are always feminine.", ex: "die Möglichkeit" },
    schaft: { g: "die", tag: "-schaft", text: "Nouns ending in <b>-schaft</b> are always feminine.", ex: "die Freundschaft, die Mannschaft" },
    ion: { g: "die", tag: "-ion", text: "Nouns ending in <b>-ion</b> are always feminine.", ex: "die Information, die Situation" },
    taet: { g: "die", tag: "-tät", text: "Nouns ending in <b>-tät</b> are always feminine.", ex: "die Universität, die Qualität" },
    ik: { g: "die", tag: "-ik", text: "Nouns ending in <b>-ik</b> are (almost always) feminine.", ex: "die Musik, die Politik" },
    ei: { g: "die", tag: "-ei", text: "The suffix <b>-ei</b>, often a shop or an activity, is feminine.", ex: "die Bäckerei, die Polizei" },
    ie: { g: "die", tag: "-ie", text: "Nouns ending in <b>-ie</b> are feminine.", ex: "die Familie, die Biologie" },
    in: { g: "die", tag: "-in", text: "<b>-in</b> turns a person into a woman, so it's always feminine.", ex: "die Lehrerin, die Ärztin" },
    e: { g: "die", tag: "-e", text: "About 90% of nouns ending in <b>-e</b> are feminine.", ex: "die Lampe, die Tasche, die Katze" },
    chen: { g: "das", tag: "-chen", text: "<b>-chen</b> means 'small' and is always neuter, even for people.", ex: "das Mädchen, das Brötchen" },
    lein: { g: "das", tag: "-lein", text: "<b>-lein</b> means 'small' and is always neuter.", ex: "das Büchlein" },
    um: { g: "das", tag: "-um", text: "Latin words ending in <b>-um</b> are neuter.", ex: "das Museum, das Zentrum" },
    ment: { g: "das", tag: "-ment", text: "Nouns ending in <b>-ment</b> are usually neuter.", ex: "das Instrument, das Dokument" },
    o: { g: "das", tag: "-o", text: "Nouns ending in <b>-o</b> are usually neuter.", ex: "das Auto, das Kino, das Büro" },
    ge: { g: "das", tag: "Ge-", text: "Many nouns starting with <b>Ge-</b> are neuter.", ex: "das Geschenk, das Gemüse" },
    inf: { g: "das", tag: "verb as noun", text: "A verb used as a noun is always neuter.", ex: "das Essen, das Schwimmen" },
    day: { g: "der", tag: "days", text: "All days of the week are masculine.", ex: "der Montag, der Freitag" },
    month: { g: "der", tag: "months", text: "All months are masculine.", ex: "der Januar, der Juli" },
    season: { g: "der", tag: "seasons", text: "All seasons are masculine.", ex: "der Sommer, der Winter" },
    daytime: { g: "der", tag: "times of day", text: "Times of day are masculine (except die Nacht).", ex: "der Morgen, der Abend" },
    er: { g: "der", tag: "-er person/machine", text: "Nouns in <b>-er</b> that name a person or a machine are usually masculine.", ex: "der Lehrer, der Computer" },
    ent: { g: "der", tag: "-ent person", text: "People ending in <b>-ent</b> are masculine.", ex: "der Student, der Präsident" },
    ling: { g: "der", tag: "-ling", text: "Nouns ending in <b>-ling</b> are always masculine.", ex: "der Frühling, der Lehrling" },
    ismus: { g: "der", tag: "-ismus", text: "Nouns ending in <b>-ismus</b> are always masculine.", ex: "der Tourismus" },
    or: { g: "der", tag: "-or", text: "Nouns ending in <b>-or</b> are usually masculine.", ex: "der Motor, der Doktor" },
    alc: { g: "der", tag: "alcohol", text: "Alcoholic drinks are masculine, except das Bier.", ex: "der Wein, der Wodka" },
    weather: { g: "der", tag: "weather", text: "Weather words like rain, snow and wind are masculine.", ex: "der Regen, der Schnee" },
    sex: { g: null, tag: "people", text: "For people, the grammatical gender usually follows natural gender.", ex: "der Vater, die Mutter" },
    comp: { g: null, tag: "compound", text: "In a compound noun, the <b>last part</b> decides the gender.", ex: "das Haus + die Tür = die Haustür" },
    pl: { g: "die", tag: "plural only", text: "This noun only exists in the plural, and the plural article is always die.", ex: "die Eltern, die Leute" },
    "ex-e": { g: null, tag: "exception", text: "Ends in -e but is <b>not</b> feminine: one of the exceptions to learn by heart.", ex: "der Name, der Käse, das Ende" },
    "ex-alc": { g: "das", tag: "exception", text: "Alcoholic drinks are usually der, but <b>das Bier</b> is the famous exception.", ex: "der Wein, das Bier" },
    "ex-daytime": { g: "die", tag: "exception", text: "Times of day are masculine, except <b>die Nacht</b>.", ex: "der Abend, die Nacht" },
    "ex-ei": { g: "das", tag: "exception", text: "Not the -ei suffix: das Ei is a short word on its own, and it's neuter.", ex: "das Ei, but die Bäckerei" },
  };

  // ---------- grammar skills (each is one SRS card that generates fresh exercises) ----------
  const SKILLS = [
    { id: "sein", u: 1, title: "sein: bin, bist, ist", concepts: ["sein"], a: "sein",
      sum: `sein (to be) is irregular — learn the six forms as a chant: <b>bin, bist, ist — sind, seid, sind</b>.` +
        tbl(["", "sein"], [["ich", "bin"], ["du", "bist"], ["er / sie / es", "ist"], ["wir", "sind"], ["ihr", "seid"], ["sie / Sie", "sind"]]) },
    { id: "pron", u: 1, title: "Personal pronouns", concepts: ["pron"], a: "pron",
      sum: `Replace a noun with the pronoun that matches it: a man or a der-word → <b>er</b>, a woman or a die-word → <b>sie</b>, a das-word → <b>es</b>, several → <b>sie</b>. Groups: you + me = <b>wir</b>, you + someone (informal) = <b>ihr</b>.` },
    { id: "conj", u: 2, title: "Present tense endings", concepts: ["conj:reg", "conj:et", "conj:s"], a: "conj",
      sum: `Stem + ending: wohn|en → ich wohn<mark>e</mark>, du wohn<mark>st</mark>, er wohn<mark>t</mark>, wir wohn<mark>en</mark>, ihr wohn<mark>t</mark>, sie wohn<mark>en</mark>. Chant: <b>e – st – t – en – t – en</b>. Stems ending in -t/-d add an -e- (du arbeit<mark>est</mark>); stems ending in s/ß/z just add -t for du (du heiß<mark>t</mark>).` },
    { id: "haben", u: 2, title: "haben: habe, hast, hat", concepts: ["haben"], a: "haben",
      sum: `haben is regular except for du and er/sie/es, where the b disappears: <b>du hast, er hat</b>.` +
        tbl(["", "haben"], [["ich", "habe"], ["du", "<mark>hast</mark>"], ["er / sie / es", "<mark>hat</mark>"], ["wir", "haben"], ["ihr", "habt"], ["sie / Sie", "haben"]]) },
    { id: "gender", u: 3, title: "Guess the gender from the ending", concepts: ["gender"], a: "rules",
      sum: `Endings predict the gender: <b>-ung, -heit, -keit, -ion, -tät, -e</b> → ${g("die", "…")}; <b>-chen, -lein, -um, -o, -ment</b> → ${g("das", "…")}; <b>days, seasons, -er people, -ling, -ismus</b> → ${g("der", "…")}. In a compound, the last part decides.` },
    { id: "plural", u: 3, title: "Plural forms", concepts: ["plural"], a: "plural",
      sum: `The plural article is always <b>die</b>. Endings follow tendencies: feminine → -n/-en (Lampe → Lampen); masculine → often -e, maybe with umlaut (Stuhl → Stühle); short neuter → often ¨-er (Buch → Bücher); -er/-el/-en → no change (Zimmer → Zimmer); loanwords and -o/-a/-y → -s (Autos).` },
    { id: "ein", u: 3, title: "ein, eine, kein", concepts: ["ein"], a: "ein",
      sum: `a/an: <b>ein</b> for der and das nouns, <b>eine</b> for die nouns. kein (no / not a) works the same with a k: kein Tisch, keine Lampe, kein Buch.` },
    { id: "poss", u: 4, title: "Possessives: mein, dein, sein…", concepts: ["poss"], a: "poss",
      sum: `The owner picks the word (ich → mein, du → dein, er → sein, sie → ihr, wir → unser, ihr → euer, sie → ihr). The noun picks the ending: der/das → no ending, die/plural → <b>-e</b>: mein Bruder, mein<mark>e</mark> Schwester.` },
    { id: "acc", u: 5, title: "Accusative: den, einen, keinen", concepts: ["acc"], a: "acc-table",
      sum: `The direct object (what you have, buy, eat, see…) is in the accusative. <b>Only masculine nouns change</b>: der → <mark>den</mark>, ein → <mark>einen</mark>, kein → <mark>keinen</mark>. Feminine, neuter and plural stay the same. After sein (Das ist…) there's no accusative.` },
    { id: "moechten", u: 5, title: "möchten and mögen", concepts: ["conj:modal"], a: "moechten",
      sum: `ich möchte = I would like (polite request); ich mag = I like. For both, ich and er/sie/es are identical and have no -t: <b>ich möchte, er möchte; ich mag, er mag</b>.` },
    { id: "num", u: 6, title: "Numbers", concepts: ["num"], a: "num-tens",
      sum: `21–99: the ones come first, joined with und: 47 = <b>sieben·und·vierzig</b>. Watch for <b>eins → einund-</b>, <b>sechzehn, siebzehn, sechzig, siebzig</b> (shortened) and <b>dreißig</b> (with ß).` },
    { id: "time", u: 6, title: "Telling the time", concepts: ["time"], a: "time",
      sum: `Informal time counts toward the next hour: 8:30 = <b>halb neun</b> ('half to nine'). 8:15 = Viertel nach acht, 8:45 = Viertel vor neun, 8:25 = fünf vor halb neun.` },
    { id: "dates", u: 6, title: "Dates: am ersten Mai", concepts: ["dates"], a: "dates",
      sum: `Dates use ordinal numbers: 1 to 19 add <b>-t</b>, from 20 on add <b>-st</b>. Irregular: <b>erste, dritte, siebte, achte</b>. The date is … = der dritt<mark>e</mark> Mai; on … = am dritt<mark>en</mark> Mai.` },
    { id: "v2", u: 6, title: "Verb in position 2", concepts: ["v2"], a: "v2",
      sum: `In a statement the conjugated verb is always element number 2. If you start with a time or place, the subject moves behind the verb: <b>Morgen fahre ich</b> nach Berlin (not Morgen ich fahre).` },
    { id: "stem", u: 7, title: "Stem-changing verbs", concepts: ["conj:stem"], a: "stem",
      sum: `Some verbs change their vowel — <b>only for du and er/sie/es</b>: e→i (sprechen → du sprichst), e→ie (sehen → er sieht), a→ä (fahren → du fährst), au→äu (laufen → er läuft). wir, ihr, sie stay regular.` },
    { id: "sep", u: 7, title: "Separable verbs", concepts: ["sep"], a: "sep",
      sum: `aufstehen, einkaufen, anrufen…: the verb goes to position 2, the prefix jumps to the very end: Ich <b>stehe</b> um sieben Uhr <b>auf</b>.` },
    { id: "dat", u: 8, title: "Dative: mit dem, zum, im", concepts: ["dat"], a: "dat-table",
      sum: `After mit, zu, bei, von, aus, nach (and in for 'where?') use the dative: der/das → <mark>dem</mark>, die → <mark>der</mark>. Short forms: zu dem = <b>zum</b>, zu der = <b>zur</b>, in dem = <b>im</b>.` },
    { id: "esgibt", u: 8, title: "es gibt + accusative", concepts: ["esgibt"], a: "esgibt",
      sum: `<b>es gibt</b> = there is, there are. It never changes, and what exists is in the accusative: es gibt <mark>einen</mark> Park, eine Bank, ein Kino, <mark>keinen</mark> Supermarkt.` },
    { id: "modal", u: 9, title: "Modal verbs", concepts: ["conj:modal", "modal-order"], a: "modal-order",
      sum: `können, müssen, wollen, dürfen, sollen: the modal is conjugated in position 2 (ich kann, du kannst, er kann) and the main verb goes to the end in the infinitive: Ich <b>kann</b> gut <b>schwimmen</b>.` },
    { id: "wq", u: 10, title: "Question words", concepts: ["wq"], a: "wq",
      sum: `The answer tells you the question word: a place → wo, an origin (aus…) → woher, a destination (nach…) → wohin, a time → wann, a person → wer, a thing → was, a price → wie viel.` },
    { id: "qorder", u: 10, title: "Question word order", concepts: ["q-order"], a: "q-order",
      sum: `W-question: W-word + verb + subject (Wo wohnst du?). Yes/no question: the verb comes first (Wohnst du in Berlin?).` },
    { id: "neg", u: 10, title: "nicht or kein?", concepts: ["neg"], a: "neg",
      sum: `<b>kein</b> negates a noun with ein or no article (Ich habe kein Auto, Ich trinke keinen Kaffee). <b>nicht</b> negates everything else: verbs, adjectives, names, nouns with der/die/das or mein.` },
    { id: "konj", u: 10, title: "und, aber, oder, denn", concepts: ["konj"], a: "konj",
      sum: `<b>und</b> (and), <b>aber</b> (but), <b>oder</b> (or) and <b>denn</b> (because) link two sentences. They sit in position 0, so the word order after them stays normal: Ich bleibe zu Hause, denn <b>ich bin</b> krank.` },
    { id: "aux", u: 11, title: "Perfekt: haben or sein?", concepts: ["aux"], a: "aux",
      sum: `Most verbs use <b>haben</b>. Use <b>sein</b> for moving from A to B (gehen, fahren, fliegen, kommen), changing state (aufstehen) and for sein and bleiben.` },
    { id: "pp", u: 11, title: "Past participles", concepts: ["pp"], a: "pp",
      sum: `Regular: <b>ge-…-t</b> (gemacht). Irregular: <b>ge-…-en</b> (gegessen). -ieren and be-/ver-/er- verbs: no ge- (studiert, bezahlt). Separable: ge in the middle (eingekauft).` },
    { id: "perforder", u: 11, title: "Perfekt word order", concepts: ["perf-order"], a: "perf-order",
      sum: `haben/sein goes to position 2, the participle to the very end: Ich <b>habe</b> gestern Pizza <b>gegessen</b>.` },
    { id: "praet", u: 11, title: "war and hatte", concepts: ["praet"], a: "war",
      sum: `For sein and haben Germans use the simple past: <b>ich war, du warst, er war</b>; <b>ich hatte, du hattest, er hatte</b>. ich and er/sie/es are the same.` +
        tbl(["", "sein", "haben"], [["ich", "war", "hatte"], ["du", "warst", "hattest"], ["er / sie / es", "war", "hatte"], ["wir", "waren", "hatten"], ["ihr", "wart", "hattet"], ["sie / Sie", "waren", "hatten"]]) },
    { id: "fuerohne", u: 12, title: "für and ohne + accusative", concepts: ["akkprep"], a: "fuer-ohne",
      sum: `<b>für</b> (for) and <b>ohne</b> (without) always take the accusative. Only masculine nouns change: für <mark>meinen</mark> Bruder, für meine Schwester, ohne <mark>den</mark> Schlüssel.` },
    { id: "imp", u: 13, title: "Imperative: Komm! Kommen Sie!", concepts: ["imp"], a: "imp",
      sum: `du: the du-form without du and -st (du kommst → <b>Komm!</b>, du nimmst → <b>Nimm!</b>, but du fährst → <b>Fahr!</b>). ihr: the ihr-form (<b>Kommt!</b>). Sie: infinitive + Sie (<b>Kommen Sie!</b>). sein: Sei! Seid! Seien Sie!` },
    { id: "perspron", u: 13, title: "mich, dich, mir, dir", concepts: ["perspron"], a: "perspron",
      sum: `Pronouns change with the case. Accusative: <b>mich, dich, ihn, sie, uns, euch, Sie</b>. Dative: <b>mir, dir, ihm, ihr, uns, euch, Ihnen</b>. Dative after helfen, gefallen, gehören, danken, wehtun and after mit, zu, bei, von, aus.` },
  ];

  // ---------- concepts (what the weak-spot tracker measures) ----------
  const CONCEPTS = {
    sein: { label: "sein (bin, bist, ist…)", u: 1, a: "sein" },
    pron: { label: "Personal pronouns", u: 1, a: "pron" },
    "conj:reg": { label: "Present tense endings", u: 2, a: "conj" },
    "conj:et": { label: "Extra -e- (du arbeitest)", u: 2, a: "conj-et" },
    "conj:s": { label: "s/ß/z stems (du heißt)", u: 2, a: "conj-s" },
    haben: { label: "haben (habe, hast, hat)", u: 2, a: "haben" },
    gender: { label: "Noun genders (der/die/das)", u: 3, a: "gender" },
    plural: { label: "Plural forms", u: 3, a: "plural" },
    ein: { label: "ein / eine / kein", u: 3, a: "ein" },
    cap: { label: "Capital letters on nouns", u: 3, a: "gender" },
    umlaut: { label: "Umlauts (ä, ö, ü) and ß", u: 1, a: "sounds" },
    poss: { label: "Possessives (mein, dein…)", u: 4, a: "poss" },
    acc: { label: "Accusative (den, einen)", u: 5, a: "acc-table" },
    "conj:modal": { label: "möchten, mögen & modal forms", u: 9, a: "modal-conj" },
    num: { label: "Numbers", u: 6, a: "num-tens" },
    time: { label: "Telling the time", u: 6, a: "time" },
    v2: { label: "Verb in position 2", u: 6, a: "v2" },
    "conj:stem": { label: "Stem-changing verbs", u: 7, a: "stem" },
    sep: { label: "Separable verbs", u: 7, a: "sep" },
    dat: { label: "Dative (mit dem, zum, im)", u: 8, a: "dat-table" },
    "modal-order": { label: "Modal + infinitive at the end", u: 9, a: "modal-order" },
    wq: { label: "Question words", u: 10, a: "wq" },
    "q-order": { label: "Question word order", u: 10, a: "q-order" },
    neg: { label: "nicht or kein", u: 10, a: "neg" },
    aux: { label: "Perfekt: haben or sein", u: 11, a: "aux" },
    pp: { label: "Past participles", u: 11, a: "pp" },
    "perf-order": { label: "Perfekt word order", u: 11, a: "perf-order" },
    dates: { label: "Dates (am ersten Mai)", u: 6, a: "dates" },
    esgibt: { label: "es gibt + accusative", u: 8, a: "esgibt" },
    konj: { label: "und, aber, oder, denn", u: 10, a: "konj" },
    praet: { label: "war and hatte", u: 11, a: "war" },
    akkprep: { label: "für / ohne + accusative", u: 12, a: "fuer-ohne" },
    imp: { label: "Imperative (Komm! Kommen Sie!)", u: 13, a: "imp" },
    perspron: { label: "Pronouns: mich, mir, dich, dir…", u: 13, a: "perspron" },
  };
  for (const [code, rule] of Object.entries(RULES)) {
    CONCEPTS["gr:" + code] = { label: "Gender rule: " + rule.tag, u: 3, a: "rules", rule: code };
  }

  // ---------- sentence banks ----------
  // Word-order drills: [English, chunks joined by |, punctuation, hint]
  const ORDER = {
    v2: [
      ["Today I'm working at home.", "Heute|arbeite|ich|zu Hause", "."],
      ["On Monday I have a German course.", "Am Montag|habe|ich|einen Deutschkurs", "."],
      ["Tomorrow we're going to Berlin.", "Morgen|fahren|wir|nach Berlin", "."],
      ["In the evening I watch a film.", "Am Abend|sehe|ich|einen Film", "."],
      ["At seven o'clock I drink coffee.", "Um sieben Uhr|trinke|ich|Kaffee", "."],
      ["Now I'm learning German.", "Jetzt|lerne|ich|Deutsch", "."],
      ["At the weekend Anna plays football.", "Am Wochenende|spielt|Anna|Fußball", "."],
      ["Sometimes my brother cooks.", "Manchmal|kocht|mein Bruder", "."],
      ["Today the weather is nice.", "Heute|ist|das Wetter|schön", "."],
      ["My sister lives in Berlin.", "In Berlin|wohnt|meine Schwester", "."],
      ["Later we're eating pizza.", "Später|essen|wir|Pizza", "."],
      ["We're learning German today.", "Wir|lernen|heute|Deutsch", "."],
      ["Paul is coming home tomorrow.", "Paul|kommt|morgen|nach Hause", "."],
    ],
    sep: [
      ["I get up at seven o'clock.", "Ich|stehe|um sieben Uhr|auf", "."],
      ["When do you get up?", "Wann|stehst|du|auf", "?"],
      ["On Saturday we go shopping.", "Am Samstag|kaufen|wir|ein", "."],
      ["Anna calls her mother.", "Anna|ruft|ihre Mutter|an", "."],
      ["In the evening he watches TV.", "Am Abend|sieht|er|fern", "."],
      ["The course starts at nine o'clock.", "Der Kurs|fängt|um neun Uhr|an", "."],
      ["Today I'm tidying up my room.", "Heute|räume|ich|mein Zimmer|auf", "."],
      ["Are you coming along?", "Kommst|du|mit", "?"],
      ["The train arrives at eight o'clock.", "Der Zug|kommt|um acht Uhr|an", "."],
      ["Today I'm calling Paul.", "Heute|rufe|ich|Paul|an", "."],
      ["Tomorrow we're tidying up the kitchen.", "Morgen|räumen|wir|die Küche|auf", "."],
    ],
    "modal-order": [
      ["I can swim well.", "Ich|kann|gut|schwimmen", "."],
      ["You have to work today.", "Du|musst|heute|arbeiten", "."],
      ["We want to learn German.", "Wir|wollen|Deutsch|lernen", "."],
      ["Can you come along?", "Kannst|du|mitkommen", "?"],
      ["The children are allowed to play here.", "Hier|dürfen|die Kinder|spielen", "."],
      ["Tomorrow I have to get up early.", "Morgen|muss|ich|früh|aufstehen", "."],
      ["Anna wants to buy a car.", "Anna|will|ein Auto|kaufen", "."],
      ["I would like to order a pizza.", "Ich|möchte|eine Pizza|bestellen", "."],
      ["You should drink more water.", "Du|sollst|mehr Wasser|trinken", "."],
      ["Can you help me?", "Kannst|du|mir|helfen", "?"],
      ["On Sunday I want to sleep for a long time.", "Am Sonntag|will|ich|lange|schlafen", "."],
    ],
    "q-order": [
      ["Where do you live?", "Wo|wohnst|du", "?"],
      ["Do you live in Berlin?", "Wohnst|du|in Berlin", "?"],
      ["What are you learning?", "Was|lernst|du", "?"],
      ["Are you tired?", "Bist|du|müde", "?"],
      ["Where does Anna come from?", "Woher|kommt|Anna", "?"],
      ["When does the course start?", "Wann|fängt|der Kurs|an", "?"],
      ["Do you have time today?", "Hast|du|heute|Zeit", "?"],
      ["How much does the book cost?", "Wie viel|kostet|das Buch", "?"],
      ["Why are you learning German?", "Warum|lernst|du|Deutsch", "?"],
      ["Do you speak English?", "Sprichst|du|Englisch", "?"],
      ["Where are you going?", "Wohin|gehst|du", "?"],
      ["Is Paul coming along?", "Kommt|Paul|mit", "?"],
    ],
    "perf-order": [
      ["I ate pizza yesterday.", "Ich|habe|gestern|Pizza|gegessen", "."],
      ["Yesterday we went to Berlin.", "Gestern|sind|wir|nach Berlin|gefahren", "."],
      ["Did you buy bread?", "Hast|du|Brot|gekauft", "?"],
      ["Anna watched a film.", "Anna|hat|einen Film|gesehen", "."],
      ["At the weekend I played football.", "Am Wochenende|habe|ich|Fußball|gespielt", "."],
      ["I got up at six o'clock.", "Ich|bin|um sechs Uhr|aufgestanden", "."],
      ["What did you do?", "Was|hast|du|gemacht", "?"],
      ["We stayed at home.", "Wir|sind|zu Hause|geblieben", "."],
      ["Last week I flew to Rome.", "Letzte Woche|bin|ich|nach Rom|geflogen", "."],
      ["Paul has learned a lot.", "Paul|hat|viel|gelernt", "."],
      ["I called my mother.", "Ich|habe|meine Mutter|angerufen", "."],
    ],
  };

  // W-question drills: [question with ___, answer, correct W-word, what the answer gives]
  const WQ = [
    ["___ wohnst du?", "In Hamburg.", "Wo", "a place (in Hamburg)"],
    ["___ kommst du?", "Aus Spanien.", "Woher", "an origin (aus …)"],
    ["___ fährst du?", "Nach Berlin.", "Wohin", "a destination (nach …)"],
    ["___ ist das?", "Das ist mein Bruder.", "Wer", "a person"],
    ["___ ist das?", "Das ist ein Handy.", "Was", "a thing"],
    ["___ kommst du?", "Morgen.", "Wann", "a time"],
    ["___ geht es dir?", "Gut, danke.", "Wie", "a manner (how)"],
    ["___ kostet das?", "Zehn Euro.", "Wie viel", "a price"],
    ["___ heißt du?", "Lena.", "Wie", "a name (Wie heißt du?)"],
    ["___ alt bist du?", "Fünfundzwanzig.", "Wie", "an age (Wie alt…?)"],
    ["___ machst du heute?", "Ich koche.", "Was", "an activity (a thing you do)"],
    ["___ spielt Fußball?", "Paul.", "Wer", "a person"],
    ["___ Kinder hast du?", "Zwei.", "Wie viele", "a number of countable things"],
    ["___ ist der Bahnhof?", "Dort links.", "Wo", "a place"],
    ["___ gehst du?", "Ins Kino.", "Wohin", "a destination (ins Kino)"],
    ["___ fängt der Film an?", "Um acht.", "Wann", "a time"],
    ["___ lernst du Deutsch?", "Für meine Arbeit.", "Warum", "a reason"],
    ["___ Uhr ist es?", "Drei Uhr.", "Wie viel", "a time (Wie viel Uhr?)"],
  ];

  // Imperative drills: [verb, rest of the sentence, English instruction]. A separable prefix is added at the end.
  const IMP = [
    ["öffnen", "das Fenster", "open the window"], ["trinken", "viel Wasser", "drink lots of water"], ["schlafen", "gut", "sleep well"],
    ["bleiben", "heute im Bett", "stay in bed today"], ["sprechen", "bitte langsam", "please speak slowly"], ["lesen", "den Text", "read the text"],
    ["fahren", "langsam", "drive slowly"], ["helfen", "mir bitte", "please help me"], ["vergessen", "den Schlüssel nicht", "don't forget the key"],
    ["aufstehen", "jetzt", "get up now"], ["anrufen", "mich morgen", "call me tomorrow"], ["mitkommen", "doch", "come along"],
    ["warten", "hier", "wait here"], ["gehen", "geradeaus", "go straight ahead"], ["essen", "mehr Gemüse", "eat more vegetables"],
    ["sein", "bitte leise", "please be quiet"], ["machen", "die Hausaufgaben", "do the homework"], ["nehmen", "eine Tablette", "take a tablet"],
    ["arbeiten", "nicht so viel", "don't work so much"], ["aufräumen", "das Zimmer", "tidy up the room"],
  ];

  // Linking-word drills: [first sentence, linking word, second sentence as subject|verb|rest, English]
  const KONJ = [
    ["Ich bleibe heute im Bett,", "denn", "ich|bin|krank", "I'm staying in bed today because I'm ill."],
    ["Ich trinke keinen Kaffee,", "aber", "ich|trinke|gern Tee", "I don't drink coffee, but I like drinking tea."],
    ["Anna lernt Deutsch,", "denn", "sie|wohnt|in Berlin", "Anna is learning German because she lives in Berlin."],
    ["Das Hotel ist schön,", "aber", "es|ist|sehr teuer", "The hotel is nice, but it's very expensive."],
    ["Wir fahren mit dem Bus,", "denn", "wir|haben|kein Auto", "We go by bus because we don't have a car."],
    ["Ich möchte gern kommen,", "aber", "ich|habe|leider keine Zeit", "I'd love to come, but unfortunately I don't have time."],
    ["Paul ist müde,", "denn", "er|hat|lange gearbeitet", "Paul is tired because he worked for a long time."],
    ["Ich habe einen Bruder", "und", "er|wohnt|in Köln", "I have a brother and he lives in Cologne."],
    ["Am Samstag gehen wir ins Kino", "oder", "wir|bleiben|zu Hause", "On Saturday we'll go to the cinema or we'll stay at home."],
    ["Ich koche", "und", "mein Mann|macht|den Salat", "I cook and my husband makes the salad."],
    ["Meine Wohnung ist klein,", "aber", "sie|ist|sehr schön", "My flat is small, but it's very nice."],
    ["Ich esse nichts,", "denn", "ich|habe|keinen Hunger", "I'm not eating anything because I'm not hungry."],
    ["Du kannst mich anrufen", "oder", "du|schreibst|eine E-Mail", "You can call me or you can write an e-mail."],
  ];

  // Writing tasks for the Claude writing coach, one per unit
  const WRITE = [
    { u: 1, task: "Greet a new colleague politely, ask how they are, and say how you are." },
    { u: 2, task: "Introduce yourself in 4–5 sentences: your name, where you come from, where you live, what you do, and something you like doing (gern)." },
    { u: 3, task: "Describe your room. What's in it? Use der/die/das, ein/eine and adjectives like groß, klein, neu, alt." },
    { u: 4, task: "Describe your family: who they are, their names, where they live. Use mein / meine." },
    { u: 5, task: "You're in a café. Order something to eat and drink, and ask what it costs. Then say what you like and don't like to eat." },
    { u: 6, task: "Describe your Monday. When do you do things? Start some sentences with the time (Um acht Uhr …)." },
    { u: 7, task: "Describe your morning routine with zuerst, dann, danach. Use at least two separable verbs (aufstehen, einkaufen…)." },
    { u: 8, task: "Explain how you get to work or school and which places are near your home (mit dem…, zum…, im…)." },
    { u: 9, task: "What can you do well? What do you want to do this weekend? What do you have to do this week? Use können, wollen, müssen." },
    { u: 10, task: "Write five questions for a new classmate: three W-questions and two yes/no questions." },
    { u: 11, task: "What did you do last weekend? Write 4–5 sentences in the Perfekt." },
    { u: 12, task: "You're buying clothes. Write a short dialogue with the shop assistant: what you're looking for, the colour and size, the price, and whether you take it." },
    { u: 13, task: "You're ill. Write a short message to your teacher: what hurts, how you feel and that you're staying at home. Then give a sick friend two tips (Trink viel Tee! …)." },
  ];

  // ---------- units & lessons ----------
  const UNITS = [
    {
      u: 1, de: "Hallo!", en: "Greetings and sein", min: 4,
      lesson: [
        { id: "greet", h: "Hello and goodbye", html:
          `<p>German has two ways to say 'you'. Use <b>du</b> with friends, family, children and people your age in casual settings. Use <b>Sie</b> (always with a capital S) with strangers, shop staff, officials and anyone you'd call Mr or Mrs.</p>` +
          tbl(["", "informal (du)", "polite (Sie)"], [
            ["Hello", say("Hallo!"), say("Guten Tag!")],
            ["Bye", say("Tschüss!"), say("Auf Wiedersehen!")],
            ["How are you?", say("Wie geht's?"), say("Wie geht es Ihnen?")],
          ]) +
          `<p>By time of day: ${say("Guten Morgen!")} (until about 11), ${say("Guten Tag!")}, ${say("Guten Abend!")} (from about 6 pm), and ${say("Gute Nacht!")} only when someone goes to bed.</p>` +
          tip(`Why <b>Guten</b> Morgen but <b>Gute</b> Nacht? Morgen, Tag and Abend are masculine (der), Nacht is feminine (die). The greeting is short for 'I wish you a good day', so the masculine ones get the accusative ending -en. You'll understand this fully in Unit 5.`) },
        { id: "pron", h: "Personal pronouns", html:
          tbl(["German", "English"], [
            ["ich", "I"], ["du", "you (one person, informal)"], ["er", "he; it (der-words)"], ["sie", "she; it (die-words)"],
            ["es", "it (das-words)"], ["wir", "we"], ["ihr", "you (several people, informal)"], ["sie", "they"], ["Sie", "you (polite, one or many)"],
          ]) +
          warn(`<b>sie</b>, <b>sie</b> and <b>Sie</b> look alike. The verb tells you which one it is: ${say("sie ist")} = she is, ${say("sie sind")} = they are, ${say("Sie sind")} = you are (polite).`) +
          `<p>Things use er, sie or es according to their gender: ${g("der", "Tisch")} → er, ${g("die", "Lampe")} → sie, ${g("das", "Buch")} → es. All of them translate as 'it'.</p>` },
        { id: "sein", h: "sein — to be", html:
          `<p>sein is irregular, just like English 'to be' (am, are, is). Learn the six forms as a chant: <b>bin, bist, ist — sind, seid, sind</b>.</p>` +
          tbl(["", "sein", "English"], [
            ["ich", "<mark>bin</mark>", "I am"], ["du", "<mark>bist</mark>", "you are"], ["er / sie / es", "<mark>ist</mark>", "he / she / it is"],
            ["wir", "<mark>sind</mark>", "we are"], ["ihr", "<mark>seid</mark>", "you (all) are"], ["sie / Sie", "<mark>sind</mark>", "they are / you are"],
          ]) +
          exl([["Ich bin müde.", "I'm tired."], ["Bist du krank?", "Are you ill?"], ["Wir sind in Berlin.", "We're in Berlin."], ["Ihr seid sehr nett.", "You (all) are very nice."]]) +
          tip(`<b>ihr seid</b> ends in -d. Don't mix it up with <b>seit</b> (since), which sounds the same.`) },
        { id: "wiegehts", h: "How are you?", html:
          `<p>${say("Wie geht's?")} literally means 'How goes it?'. The usual answer is ${say("Mir geht es gut.")}, literally 'To me it goes well'.</p>` +
          warn(`Don't answer <i>Ich bin gut</i>. It sounds like 'I am good (at something)'. Say <b>Mir geht's gut</b>, or just <b>Gut, danke!</b>`) +
          exl([["Sehr gut, danke!", "Very well, thanks!"], ["Es geht.", "So-so."], ["Nicht so gut.", "Not so good."], ["Und dir?", "And you? (informal)"], ["Und Ihnen?", "And you? (polite)"]]) },
        { id: "sounds", h: "Sounds and letters", html:
          tbl(["Letters", "Sounds like", "Example"], [
            ["ä", "e in 'bed'", say("Käse")], ["ö", "say 'e' with rounded lips", say("schön")], ["ü", "say 'ee' with rounded lips", say("müde")],
            ["ß", "a sharp s (called Eszett)", say("heißen")], ["ei", "'eye'", say("nein")], ["ie", "'ee'", say("wie")],
            ["eu, äu", "'oy'", say("neu")], ["w", "English v", say("wo")], ["v", "English f", say("Vater")], ["z", "ts", say("Zimmer")],
            ["j", "English y", say("ja")], ["sch", "sh", say("schlecht")], ["ch after a, o, u", "throaty, like Scottish 'loch'", say("Buch")], ["ch after e, i", "a soft hiss", say("ich")],
          ]) +
          tip(`ei or ie? Say the <b>second</b> letter: ei → 'i' (eye), ie → 'e' (ee). So mein rhymes with 'mine' and wie sounds like 'vee'.`) +
          `<p>No umlaut keys? Type <b>ae, oe, ue</b> and <b>ss</b>, which Germans also use, or tap the letter buttons under every answer box.</p>` },
      ],
    },
    {
      u: 2, de: "Ich & du", en: "Introducing yourself, present tense", min: 6,
      lesson: [
        { id: "intro", h: "Introducing yourself", html:
          exl([["Ich heiße Lena.", "My name is Lena."], ["Ich komme aus Kanada.", "I come from Canada."], ["Ich wohne in Berlin.", "I live in Berlin."],
            ["Ich bin Studentin.", "I'm a student."], ["Ich lerne Deutsch.", "I'm learning German."], ["Ich spiele gern Tennis.", "I like playing tennis."]]) +
          warn(`No article for jobs: <b>Ich bin Lehrer</b>, not <i>Ich bin ein Lehrer</i>.`) +
          `<p>German has one present tense for both 'I live' and 'I am living': Ich wohne in Berlin.</p>` },
        { id: "conj", h: "Present tense: stem + ending", html:
          `<p>Every verb's dictionary form (the infinitive) ends in <b>-en</b> or <b>-n</b>. Remove it to get the stem: wohn|en → wohn. Then add the ending for the person.</p>` +
          tbl(["", "wohnen", "lernen"], [
            ["ich", "wohn<mark>e</mark>", "lern<mark>e</mark>"], ["du", "wohn<mark>st</mark>", "lern<mark>st</mark>"], ["er / sie / es", "wohn<mark>t</mark>", "lern<mark>t</mark>"],
            ["wir", "wohn<mark>en</mark>", "lern<mark>en</mark>"], ["ihr", "wohn<mark>t</mark>", "lern<mark>t</mark>"], ["sie / Sie", "wohn<mark>en</mark>", "lern<mark>en</mark>"],
          ]) +
          tip(`Chant the endings: <b>e – st – t – en – t – en</b>. wir, sie and Sie always look like the infinitive.`) +
          `<p>English has one ending (he live<b>s</b>). German has five, so the ending tells you who does the action.</p>` },
        { id: "conj-et", h: "Extra -e- after t and d", html:
          `<p>If the stem ends in <b>-t</b> or <b>-d</b> (arbeit-, find-, wart-), put an extra <b>-e-</b> before -st and -t so you can pronounce it.</p>` +
          tbl(["", "arbeiten", "finden"], [
            ["ich", "arbeite", "finde"], ["du", "arbeit<mark>est</mark>", "find<mark>est</mark>"], ["er / sie / es", "arbeit<mark>et</mark>", "find<mark>et</mark>"],
            ["wir", "arbeiten", "finden"], ["ihr", "arbeit<mark>et</mark>", "find<mark>et</mark>"], ["sie / Sie", "arbeiten", "finden"],
          ]) +
          `<p>The same happens with some stems ending in a consonant + n: ${say("öffnen")} → du öffnest, er öffnet.</p>` },
        { id: "conj-s", h: "Stems ending in s, ß, z", html:
          `<p>When the stem already ends in an s-sound (heiß-, tanz-, reis-), the du-form only adds <b>-t</b>: ${say("du heißt")}, ${say("du tanzt")}, ${say("du reist")} — never <i>heißst</i>.</p>` +
          tbl(["", "heißen", "tanzen"], [
            ["ich", "heiße", "tanze"], ["du", "heiß<mark>t</mark>", "tanz<mark>t</mark>"], ["er / sie / es", "heißt", "tanzt"],
            ["wir", "heißen", "tanzen"], ["ihr", "heißt", "tanzt"], ["sie / Sie", "heißen", "tanzen"],
          ]) },
        { id: "haben", h: "haben — to have", html:
          tbl(["", "haben"], [["ich", "habe"], ["du", "<mark>hast</mark>"], ["er / sie / es", "<mark>hat</mark>"], ["wir", "haben"], ["ihr", "habt"], ["sie / Sie", "haben"]]) +
          `<p>Only du and er/sie/es are irregular: the b disappears.</p>` +
          exl([["Ich habe Zeit.", "I have time."], ["Hast du ein Handy?", "Do you have a mobile phone?"], ["Anna hat einen Hund.", "Anna has a dog."]]) },
        { id: "gern", h: "What you like doing: gern", html:
          `<p>Put <b>gern</b> after the verb to say you like doing something. Add nicht for the opposite.</p>` +
          exl([["Ich koche gern.", "I like cooking."], ["Spielst du gern Fußball?", "Do you like playing football?"], ["Ich arbeite nicht gern.", "I don't like working."]]) },
        { id: "v2preview", h: "The verb is always second", html:
          `<p>In a German statement the conjugated verb sits in position 2. You'll practise this properly in Unit 6.</p>` +
          brk(["Position 1", "Verb", "Rest"], ["x", "v", "x"], [["Ich", "wohne", "in Berlin."], ["In Berlin", "wohne", "ich."]]) },
      ],
    },
    {
      u: 3, de: "Der, die, das", en: "Nouns, gender and plural", min: 7,
      lesson: [
        { id: "gender", h: "Every noun has a gender", html:
          `<p>German nouns are masculine (<b>der</b>), feminine (<b>die</b>) or neuter (<b>das</b>). It's grammar, not meaning: a table is der, a lamp is die, a girl is das. The article changes other words in the sentence, so it matters.</p>` +
          `<p>This app colours nouns the way many German textbooks do: ${g("der", "Tisch")} ${g("die", "Lampe")} ${g("das", "Buch")}. Picture the colour with the word.</p>` +
          warn(`Always learn a noun together with its article: <b>der Tisch</b>, never just Tisch. And every noun starts with a capital letter, wherever it is in the sentence.`) },
        { id: "rules", h: "Endings that tell you the gender", html:
          `<p>No rule covers every noun, but endings get you a long way. These are the reliable ones:</p>` +
          tbl(["Gender", "Endings and groups", "Examples"], [
            [g("die", ""), "-ung, -heit, -keit, -schaft, -ion, -tät, -ik, -ei, -in (women), most -e", "die Wohnung, die Freiheit, die Information, die Lampe"],
            [g("das", ""), "-chen, -lein, -um, -ment, -o, often Ge-, verbs used as nouns", "das Mädchen, das Museum, das Auto, das Essen"],
            [g("der", ""), "days, months, seasons, times of day, -er (people, machines), -ent (people), -ling, -ismus, -or, alcohol", "der Montag, der Lehrer, der Frühling, der Wein"],
          ]) +
          tip(`Try it: die Freiheit (freedom), das Häuschen (little house), der Frühling (spring). You can get them right without ever having seen them. The gender drill in this app shows you new words like these on purpose.`) +
          warn(`Famous exceptions: <b>das Bier</b> (alcohol is usually der), <b>die Nacht</b> (times of day are usually der), <b>der Name</b>, <b>der Käse</b> and <b>der Junge</b> (end in -e, but not feminine).`) },
        { id: "compound", h: "Compound nouns: the last part decides", html:
          `<p>German glues nouns together. The gender always comes from the <b>last</b> noun.</p>` +
          exl([["das Haus + die Tür → die Haustür", "front door"], ["die Küche + der Tisch → der Küchentisch", "kitchen table"], ["die Woche + das Ende → das Wochenende", "weekend"]]) },
        { id: "plural", h: "Plural: the article is always die", html:
          `<p>Every plural noun takes <b>die</b>. The ending is less predictable, so dictionaries write it as a short code. This app uses the same code:</p>` +
          tbl(["Code", "Singular", "Plural"], [
            ["-e", "der Tisch", "die Tisch<mark>e</mark>"], ["¨-e", "der Stuhl", "die St<mark>ü</mark>hl<mark>e</mark>"], ["-er", "das Bild", "die Bild<mark>er</mark>"],
            ["¨-er", "das Buch", "die B<mark>ü</mark>ch<mark>er</mark>"], ["-n", "die Lampe", "die Lampe<mark>n</mark>"], ["-en", "die Tür", "die Tür<mark>en</mark>"],
            ["-nen", "die Lehrerin", "die Lehrerin<mark>nen</mark>"], ["-s", "das Auto", "die Auto<mark>s</mark>"], ["-", "das Zimmer", "die Zimmer"], ["¨", "der Vater", "die V<mark>ä</mark>ter"],
          ]) +
          `<p>¨ means the vowel gets an umlaut (a→ä, o→ö, u→ü, au→äu). Tendencies that help:</p>` +
          `<ul><li>Feminine nouns: almost always <b>-n / -en</b> (Lampe → Lampen).</li><li>Masculine nouns: often <b>-e</b>, sometimes with umlaut (Stuhl → Stühle).</li><li>Short neuter nouns: often <b>¨-er</b> (Haus → Häuser).</li><li>Masculine and neuter nouns ending in -er, -el, -en: usually <b>no change</b> (das Zimmer → die Zimmer).</li><li>Loanwords and words ending in -a, -o, -y: <b>-s</b> (Hobbys, Autos).</li></ul>` },
        { id: "ein", h: "ein, eine, kein", html:
          tbl(["", "der", "die", "das", "plural"], [
            ["a / an", "ein Tisch", "ein<mark>e</mark> Lampe", "ein Buch", "– Bücher"],
            ["no / not a", "kein Tisch", "kein<mark>e</mark> Lampe", "kein Buch", "kein<mark>e</mark> Bücher"],
          ]) +
          `<p>kein works exactly like ein, with a k in front. The plural has no word for 'a', but kein has a plural: keine Bücher.</p>` +
          exl([["Das ist ein Stuhl.", "That's a chair."], ["Ist das eine Uhr?", "Is that a clock?"], ["Nein, das ist keine Uhr. Das ist ein Handy.", "No, that's not a clock. It's a phone."]]) },
        { id: "pronthings", h: "'it' is er, sie or es", html:
          `<p>When you refer back to a thing, use the pronoun that matches its gender:</p>` +
          exl([["Der Tisch ist neu. → Er ist neu.", "The table is new. → It is new."], ["Die Lampe ist alt. → Sie ist alt.", "The lamp is old. → It is old."], ["Das Buch ist gut. → Es ist gut.", "The book is good. → It is good."]]) },
      ],
    },
    {
      u: 4, de: "Familie", en: "Family and possessives", min: 5,
      lesson: [
        { id: "family", h: "Family words", html:
          `<p>People mostly follow natural gender: ${g("der", "Vater")} ${g("die", "Mutter")} ${g("der", "Bruder")} ${g("die", "Schwester")}. Watch out for ${g("das", "Kind")}, ${g("das", "Baby")} and ${g("das", "Mädchen")}: all neuter.</p>` +
          `<p><b>die Eltern</b> (parents) and <b>die Geschwister</b> (siblings) only exist in the plural.</p>` },
        { id: "poss", h: "my, your, his: possessive articles", html:
          `<p>Two steps: the <b>owner</b> picks the word, the <b>noun</b> picks the ending (exactly like ein / eine).</p>` +
          tbl(["Owner", "der / das noun", "die / plural noun"], [
            ["ich → my", "mein Bruder", "mein<mark>e</mark> Schwester"], ["du → your", "dein Bruder", "dein<mark>e</mark> Schwester"],
            ["er / es → his, its", "sein Bruder", "sein<mark>e</mark> Schwester"], ["sie → her", "ihr Bruder", "ihr<mark>e</mark> Schwester"],
            ["wir → our", "unser Bruder", "unser<mark>e</mark> Schwester"], ["ihr → your (all)", "euer Bruder", "eur<mark>e</mark> Schwester"],
            ["sie → their", "ihr Bruder", "ihr<mark>e</mark> Schwester"], ["Sie → your (polite)", "Ihr Bruder", "Ihr<mark>e</mark> Schwester"],
          ]) +
          tip(`Anna's brother = <b>ihr</b> Bruder: ihr because Anna is a woman, no ending because it's der Bruder. Paul's sister = <b>seine</b> Schwester.`) +
          warn(`euer drops an e when an ending is added: <b>eure</b> Mutter, not euere.`) },
        { id: "ihr", h: "ihr has four meanings", html:
          exl([["Ihr seid nett.", "You (all) are nice."], ["Das ist ihr Vater.", "That's her father."], ["Das ist ihr Haus.", "That's their house."], ["Ist das Ihr Auto?", "Is that your car? (polite)"]]) +
          `<p>Context and the capital letter tell them apart.</p>` },
        { id: "kennen", h: "kennen or wissen?", html:
          `<p>Both mean 'to know'. <b>kennen</b> = be familiar with a person, place or thing: ${say("Ich kenne Paul.")} <b>wissen</b> = know a fact: ${say("Ich weiß, wo er wohnt.")}</p>` +
          tbl(["", "wissen"], [["ich", "<mark>weiß</mark>"], ["du", "<mark>weißt</mark>"], ["er / sie / es", "<mark>weiß</mark>"], ["wir", "wissen"], ["ihr", "wisst"], ["sie / Sie", "wissen"]]) +
          `<p>wissen is irregular in the singular: ich weiß and er weiß have no ending.</p>` },
        { id: "talk", h: "Talking about your family", html:
          exl([["Ich habe einen Bruder und eine Schwester.", "I have a brother and a sister."], ["Hast du Geschwister?", "Do you have siblings?"],
            ["Meine Eltern wohnen in München.", "My parents live in Munich."], ["Mein Opa ist 80 Jahre alt.", "My grandpa is 80."], ["Ich habe keine Kinder.", "I don't have children."]]) +
          `<p>Notice <b>einen</b> Bruder: the article changes after haben. That's the accusative, coming up next.</p>` },
      ],
    },
    {
      u: 5, de: "Essen & Trinken", en: "Food, drink and the accusative", min: 7,
      lesson: [
        { id: "acc", h: "Subject and object", html:
          `<p>The <b>nominative</b> is the subject: who does the action. The <b>accusative</b> is the direct object: what or who the action happens to. English only shows this with pronouns (he sees <i>him</i>). German shows it with articles.</p>` +
          brk(["Subject (Nominativ)", "Verb", "Object (Akkusativ)"], ["x", "v", "e"], [["Der Mann", "kauft", "den Apfel."], ["Ich", "habe", "einen Bruder."]]) },
        { id: "acc-table", h: "Only masculine changes", html:
          tbl(["", "der (m)", "die (f)", "das (n)", "plural"], [
            ["Nominativ", "der · ein · kein", "die · eine · keine", "das · ein · kein", "die · – · keine"],
            ["Akkusativ", "<mark>den</mark> · <mark>einen</mark> · <mark>keinen</mark>", "die · eine · keine", "das · ein · kein", "die · – · keine"],
          ]) +
          `<p>That's the big secret: in the accusative <b>only masculine nouns change</b>. der → den, ein → einen, kein → keinen, mein → meinen. Everything else stays the same.</p>` +
          tip(`Masculine + accusative = an extra <b>-n</b>: de<b>n</b>, eine<b>n</b>, keine<b>n</b>, meine<b>n</b>.`) },
        { id: "acc-verbs", h: "Verbs with an object", html:
          `<p>Most verbs with a 'what?' object take the accusative: haben, kaufen, essen, trinken, möchten, nehmen, brauchen, suchen, sehen, bestellen, mögen. Ask: Ich kaufe — was? → <b>einen</b> Apfel.</p>` +
          exl([["Ich esse einen Apfel.", "I'm eating an apple."], ["Wir brauchen einen Tisch.", "We need a table."], ["Siehst du den Bus?", "Do you see the bus?"], ["Es gibt einen Park.", "There is a park."]]) +
          warn(`<b>sein</b> never takes the accusative: Das ist <b>ein</b> Apfel (not einen). Both sides of 'is' are nominative.`) },
        { id: "moechten", h: "möchten and mögen", html:
          `<p>${say("Ich möchte …")} = I would like … (polite, for requests). ${say("Ich mag …")} = I like … (in general).</p>` +
          tbl(["", "möchten", "mögen"], [
            ["ich", "<mark>möchte</mark>", "<mark>mag</mark>"], ["du", "möchtest", "magst"], ["er / sie / es", "<mark>möchte</mark>", "<mark>mag</mark>"],
            ["wir", "möchten", "mögen"], ["ihr", "möchtet", "mögt"], ["sie / Sie", "möchten", "mögen"],
          ]) +
          `<p>ich and er/sie/es have the same form, with no -t.</p>` +
          exl([["Ich möchte einen Kaffee, bitte.", "I'd like a coffee, please."], ["Ich mag keinen Fisch.", "I don't like fish."], ["Magst du Schokolade?", "Do you like chocolate?"]]) },
        { id: "cafe", h: "In the café", html:
          exl([["Was möchten Sie?", "What would you like?"], ["Ich hätte gern einen Kaffee und ein Stück Kuchen.", "I'd like a coffee and a piece of cake."],
            ["Zahlen, bitte!", "The bill, please!"], ["Zusammen oder getrennt?", "Together or separately?"], ["Zusammen. Was kostet das?", "Together. How much is it?"], ["Acht Euro fünfzig.", "Eight euros fifty."]]) +
          `<p>German waiters ask <b>Zusammen oder getrennt?</b> when you pay: one bill or separate bills.</p>` +
          `<p>Hungry? ${say("Ich habe Hunger.")} Literally 'I have hunger'. Thirsty: ${say("Ich habe Durst.")}</p>` },
        { id: "stem-essen", h: "essen and nehmen change inside", html:
          `<p>${say("du isst")}, ${say("er isst")}; ${say("du nimmst")}, ${say("er nimmt")}. These are stem-changing verbs; Unit 7 explains the pattern.</p>` },
      ],
    },
    {
      u: 6, de: "Zahlen & Zeit", en: "Numbers, time, dates and word order", min: 8,
      lesson: [
        { id: "num", h: "Numbers 0–20", html:
          tbl(["", "", "", ""], [
            ["0 " + say("null"), "1 " + say("eins"), "2 " + say("zwei"), "3 " + say("drei")],
            ["4 " + say("vier"), "5 " + say("fünf"), "6 " + say("sechs"), "7 " + say("sieben")],
            ["8 " + say("acht"), "9 " + say("neun"), "10 " + say("zehn"), "11 " + say("elf")],
            ["12 " + say("zwölf"), "13 " + say("dreizehn"), "14 " + say("vierzehn"), "15 " + say("fünfzehn")],
            ["16 " + say("sechzehn"), "17 " + say("siebzehn"), "18 " + say("achtzehn"), "19 " + say("neunzehn")],
          ], "nums") +
          warn(`<b>sechzehn</b> and <b>siebzehn</b> lose letters: not sechszehn, not siebenzehn.`) },
        { id: "num-tens", h: "21–99: ones first", html:
          `<p>German says 'one-and-twenty', like the old English rhyme 'four-and-twenty blackbirds': ${say("einundzwanzig")} = 21, ${say("siebenundvierzig")} = 47.</p>` +
          tbl(["Tens", "", ""], [
            ["20 " + say("zwanzig"), "30 " + say("dreißig"), "40 " + say("vierzig")],
            ["50 " + say("fünfzig"), "60 " + say("sechzig"), "70 " + say("siebzig")],
            ["80 " + say("achtzig"), "90 " + say("neunzig"), "100 " + say("hundert")],
          ]) +
          warn(`30 is <b>dreißig</b> with ß, not -zig. 1 loses its s before und: <b>einundzwanzig</b>.`) +
          tip(`Writing down a number you hear? Write the second digit first: 'sieben-und…' → _7, then '…vierzig' → 47. The whole number is one word: 365 = dreihundertfünfundsechzig.`) },
        { id: "time", h: "Telling the time", html:
          `<p><b>Official</b> time (timetables, radio) counts minutes after the hour: 8:30 = ${say("acht Uhr dreißig")}. <b>Everyday</b> time uses Viertel (quarter) and halb (half):</p>` +
          tbl(["Time", "Everyday German"], [
            ["8:00", say("acht Uhr")], ["8:05", say("fünf nach acht")], ["8:15", say("Viertel nach acht")], ["8:25", say("fünf vor halb neun")],
            ["8:30", "<mark>" + say("halb neun") + "</mark>"], ["8:35", say("fünf nach halb neun")], ["8:45", say("Viertel vor neun")], ["8:50", say("zehn vor neun")],
          ]) +
          warn(`<b>halb neun</b> is 8:30, not 9:30! German thinks 'half (of the way) to nine'.`) +
          exl([["Wie spät ist es?", "What time is it?"], ["Es ist halb drei.", "It's half past two."], ["Um wie viel Uhr?", "At what time?"], ["Um acht.", "At eight."]]) },
        { id: "days", h: "Days and parts of the day", html:
          `<p>All days, months and seasons are masculine. 'On Monday' = <b>am Montag</b> (am = an dem). 'In the morning / evening' = <b>am Morgen</b>, <b>am Abend</b>, but 'at night' = <b>in der Nacht</b>.</p>` +
          exl([["Montag, Dienstag, Mittwoch", "Monday, Tuesday, Wednesday"], ["Donnerstag, Freitag", "Thursday, Friday"], ["Samstag, Sonntag", "Saturday, Sunday"], ["morgen früh", "tomorrow morning"]]) },
        { id: "dates", h: "Dates: der erste, am ersten", html:
          `<p>The months: ${["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"].map((m) => say(m)).join(", ")}. All of them are masculine. 'In May' = <b>im Mai</b>.</p>` +
          `<p>Dates use ordinal numbers (first, second, third). In writing they get a full stop: <b>3.</b> = dritte. From 1 to 19 add <b>-t</b>, from 20 on add <b>-st</b>, then the ending.</p>` +
          tbl(["", "The date is …", "On …"], [
            ["1.", "der <mark>erste</mark>", "am <mark>ersten</mark>"], ["2.", "der zweite", "am zweiten"], ["3.", "der <mark>dritte</mark>", "am <mark>dritten</mark>"],
            ["4.", "der vierte", "am vierten"], ["7.", "der <mark>siebte</mark>", "am <mark>siebten</mark>"], ["8.", "der achte", "am achten"],
            ["19.", "der neunzehnte", "am neunzehnten"], ["20.", "der zwanzig<mark>ste</mark>", "am zwanzig<mark>sten</mark>"], ["31.", "der einunddreißigste", "am einunddreißigsten"],
          ]) +
          warn(`Irregular: <b>erste</b> (not einste), <b>dritte</b> (not dreite), <b>siebte</b> (not siebente) and <b>achte</b> with one t.`) +
          `<p>After <b>der</b> the ending is <b>-e</b>. After <b>am</b> (on) it's <b>-en</b>.</p>` +
          exl([["Heute ist der dritte Oktober.", "Today is the third of October."], ["Mein Geburtstag ist am ersten Mai.", "My birthday is on the first of May."],
            ["Wann hast du Geburtstag? — Am zwanzigsten Juni.", "When is your birthday? — On the twentieth of June."], ["Im Juli habe ich Urlaub.", "I'm on holiday in July."]]) },
        { id: "v2", h: "The verb stays in position 2", html:
          `<p>This is the most important word-order rule in German. In a statement the conjugated verb is always the <b>second element</b>. Position 1 can be the subject, but also a time, a place or an object. Then the subject moves behind the verb.</p>` +
          brk(["Position 1", "Verb", "Rest"], ["x", "v", "x"], [["Ich", "fahre", "morgen nach Berlin."], ["Morgen", "fahre", "ich nach Berlin."], ["Nach Berlin", "fahre", "ich morgen."], ["Am Montag um acht Uhr", "habe", "ich einen Kurs."]]) +
          warn(`English says 'Tomorrow I drive'. German must say 'Tomorrow drive I': <b>Morgen fahre ich</b>. <i>Morgen ich fahre</i> is the classic mistake.`) +
          `<p>Position 1 can be several words (Am Montag um acht Uhr). und, aber and oder don't count: they sit before position 1. ${say("Ich bin müde, aber heute habe ich Zeit.")}</p>` },
        { id: "age", h: "Age", html: exl([["Wie alt bist du?", "How old are you?"], ["Ich bin 25 Jahre alt.", "I'm 25 years old."], ["Ich bin 25.", "I'm 25."]]) },
      ],
    },
    {
      u: 7, de: "Alltag", en: "Daily routine: vowel changes and separable verbs", min: 6,
      lesson: [
        { id: "stem", h: "Verbs that change their vowel", html:
          `<p>Some common verbs change the vowel of the stem, <b>but only for du and er/sie/es</b>. Everything else is regular.</p>` +
          tbl(["Change", "du", "er / sie / es", "Also"], [
            ["e → i", "spr<mark>i</mark>chst", "spr<mark>i</mark>cht", "essen, geben, helfen, nehmen, treffen, vergessen"],
            ["e → ie", "s<mark>ie</mark>hst", "s<mark>ie</mark>ht", "lesen, fernsehen"],
            ["a → ä", "f<mark>ä</mark>hrst", "f<mark>ä</mark>hrt", "schlafen, anfangen"],
            ["au → äu", "l<mark>äu</mark>fst", "l<mark>äu</mark>ft", ""],
          ]) +
          tbl(["", "fahren"], [["ich", "fahre"], ["du", "<mark>fährst</mark>"], ["er / sie / es", "<mark>fährt</mark>"], ["wir", "fahren"], ["ihr", "fahrt"], ["sie / Sie", "fahren"]]) +
          tip(`Dictionaries mark these: fahren (du fährst, er fährt). Learn the er-form together with the verb.`) },
        { id: "sep", h: "Separable verbs: the prefix jumps to the end", html:
          `<p>Verbs like <b>aufstehen</b> (to get up) have a stressed prefix. In a sentence the verb splits: the conjugated part goes to position 2, the prefix goes to the very end.</p>` +
          brk(["Position 1", "Verb", "Middle", "End"], ["x", "v", "x", "e"], [
            ["Ich", "stehe", "um sieben Uhr", "auf."], ["Wir", "kaufen", "im Supermarkt", "ein."], ["Ich", "rufe", "meine Mutter", "an."],
            ["Er", "sieht", "am Abend", "fern."], ["Der Kurs", "fängt", "um neun Uhr", "an."],
          ]) +
          `<p>Germans call this the <b>Satzklammer</b> (sentence bracket): the verb opens the bracket, the prefix closes it. Common separable prefixes: an-, auf-, aus-, ein-, mit-, fern-, zu-, zurück-.</p>` +
          tip(`In the infinitive the verb stays in one piece, for example after a modal verb: Ich muss früh <b>aufstehen</b>.`) },
        { id: "routine", h: "Describing a routine", html:
          `<p>zuerst, dann and danach take position 1, so the verb comes straight after them:</p>` +
          exl([["Zuerst stehe ich auf.", "First I get up."], ["Dann dusche ich.", "Then I have a shower."], ["Danach frühstücke ich.", "After that I have breakfast."], ["Um acht Uhr fahre ich zur Arbeit.", "At eight I go to work."]]) },
      ],
    },
    {
      u: 8, de: "In der Stadt", en: "Places, transport, the dative and es gibt", min: 7,
      lesson: [
        { id: "dat", h: "The dative", html:
          `<p>Certain prepositions are always followed by the <b>dative</b> case. The most common at A1: <b>mit</b> (with, by), <b>zu</b> (to), <b>bei</b> (at someone's place), <b>von</b> (from, of), <b>aus</b> (out of, from), <b>nach</b> (to cities, countries, home; after).</p>` +
          tip(`German students sing <b>aus, bei, mit, nach, seit, von, zu</b> to the tune of the Blue Danube waltz. All of them always take the dative.`) },
        { id: "dat-table", h: "Dative articles", html:
          tbl(["", "der (m)", "die (f)", "das (n)", "plural"], [
            ["the", "<mark>dem</mark>", "<mark>der</mark>", "<mark>dem</mark>", "den (+n)"], ["a", "einem", "einer", "einem", "–"], ["my", "meinem", "meiner", "meinem", "meinen"],
          ]) +
          tip(`Masculine and neuter → <b>-m</b> (dem, einem). Feminine → <b>-r</b> (der, einer).`) +
          warn(`die becomes <b>der</b> in the dative: mit der U-Bahn. That der is not masculine!`) },
        { id: "dat-contr", h: "Short forms", html:
          tbl(["Long", "Short", "Example"], [
            ["zu dem", "<mark>zum</mark>", say("Ich gehe zum Bahnhof.")], ["zu der", "<mark>zur</mark>", say("Ich gehe zur Post.")], ["in dem", "<mark>im</mark>", say("Ich bin im Kino.")],
            ["bei dem", "<mark>beim</mark>", say("Er ist beim Arzt.")], ["von dem", "<mark>vom</mark>", say("Ich komme vom Bahnhof.")],
          ]) },
        { id: "dat-where", h: "Where are you? in + dative", html:
          `<p>To say where something is (wo?), <b>in</b> takes the dative: ${say("Ich bin im Park.")} ${say("Sie ist in der Schule.")}</p>` +
          `<p>Going somewhere (wohin?) uses in + accusative: ${say("Wir gehen ins Kino.")} You'll meet that properly at A2; for now learn <b>ins Kino</b> as a phrase.</p>` },
        { id: "transport", h: "Getting around", html:
          `<p>Transport uses <b>mit + dative</b>: mit dem Bus, mit dem Zug, mit der U-Bahn, mit dem Fahrrad, mit dem Auto. On foot = <b>zu Fuß</b>.</p>` +
          exl([["Entschuldigung, wie komme ich zum Bahnhof?", "Excuse me, how do I get to the station?"], ["Gehen Sie geradeaus und dann links.", "Go straight ahead and then left."], ["Ist das weit?", "Is it far?"], ["Nein, das ist nah.", "No, it's close."]]) },
        { id: "nach", h: "nach or zu?", html:
          `<p><b>nach</b> for cities, countries and home: nach Berlin, nach Spanien, nach Hause. <b>zu</b> for people and places in town: zum Arzt, zur Bank, zu meiner Oma.</p>` },
        { id: "esgibt", h: "es gibt: there is, there are", html:
          `<p><b>es gibt</b> means 'there is' or 'there are'. It never changes, whether there's one thing or many. The thing that exists is the object, so it's in the <b>accusative</b>.</p>` +
          exl([["Hier gibt es einen Park.", "There's a park here."], ["Gibt es hier eine Apotheke?", "Is there a pharmacy here?"],
            ["In meiner Straße gibt es ein Café.", "There's a café in my street."], ["Nein, hier gibt es keinen Supermarkt.", "No, there's no supermarket here."]]) +
          tip(`As always in the accusative, only masculine nouns change: es gibt <b>einen</b> Park, <b>keinen</b> Bahnhof. Feminine and neuter stay the same: eine Bank, ein Kino.`) +
          warn(`es gibt only says that something exists. To say where it is, use sein: ${say("Wo ist die Post?")} ${say("Die Post ist dort links.")}`) },
      ],
    },
    {
      u: 9, de: "Können & müssen", en: "Modal verbs, free time and weather", min: 6,
      lesson: [
        { id: "modal", h: "What modal verbs do", html:
          tbl(["Modal", "Meaning"], [["können", "can, to be able to"], ["müssen", "must, to have to"], ["wollen", "to want to"], ["dürfen", "may, to be allowed to"], ["sollen", "should, to be supposed to"], ["möchten", "would like to"]]) +
          warn(`<b>ich will</b> means 'I want', not 'I will'.`) },
        { id: "modal-conj", h: "How they conjugate", html:
          tbl(["", "können", "müssen", "wollen", "dürfen"], [
            ["ich", "<mark>kann</mark>", "<mark>muss</mark>", "<mark>will</mark>", "<mark>darf</mark>"], ["du", "kannst", "musst", "willst", "darfst"],
            ["er / sie / es", "<mark>kann</mark>", "<mark>muss</mark>", "<mark>will</mark>", "<mark>darf</mark>"], ["wir", "können", "müssen", "wollen", "dürfen"],
            ["ihr", "könnt", "müsst", "wollt", "dürft"], ["sie / Sie", "können", "müssen", "wollen", "dürfen"],
          ]) +
          `<p>Two patterns: the singular often has a different vowel (können → kann), and ich = er/sie/es with no ending (ich kann, er kann).</p>` },
        { id: "modal-order", h: "The infinitive goes to the end", html:
          `<p>The modal verb is conjugated in position 2. The main verb stays in the infinitive and goes to the very end: the same bracket as with separable verbs.</p>` +
          brk(["Position 1", "Modal", "Middle", "End"], ["x", "v", "x", "e"], [["Ich", "kann", "gut", "schwimmen."], ["Morgen", "muss", "ich früh", "aufstehen."], ["Wir", "wollen", "Deutsch", "lernen."], ["Kannst", "du", "mir", "helfen?"]]) +
          warn(`English 'I can swim well' becomes 'I can well swim': <b>Ich kann gut schwimmen.</b>`) },
        { id: "muessen-nicht", h: "False friend: muss nicht", html:
          `<p><b>nicht müssen</b> = don't have to: ${say("Du musst nicht kommen.")} (You don't have to come.) For 'must not' use <b>nicht dürfen</b>: ${say("Du darfst nicht kommen.")} (You're not allowed to come.)</p>` },
        { id: "freizeit", h: "Free time and weather", html:
          exl([["Was machst du in deiner Freizeit?", "What do you do in your free time?"], ["Ich höre Musik und mache Sport.", "I listen to music and do sport."], ["Hast du Lust?", "Do you feel like it?"],
            ["Das macht Spaß!", "That's fun!"], ["Es regnet.", "It's raining."], ["Die Sonne scheint.", "The sun is shining."]]) },
      ],
    },
    {
      u: 10, de: "Fragen & Nein", en: "Questions, negation and linking words", min: 7,
      lesson: [
        { id: "wq", h: "W-questions", html:
          `<p>W-word in position 1, verb in position 2, then the subject. Each W-word expects a certain kind of answer:</p>` +
          tbl(["Word", "Meaning", "Answer gives", "Example"], [
            ["wer", "who", "a person", say("Wer ist das?")], ["was", "what", "a thing, an activity", say("Was machst du?")],
            ["wo", "where", "a place", say("Wo wohnst du?")], ["woher", "where from", "an origin (aus …)", say("Woher kommst du?")],
            ["wohin", "where to", "a destination (nach …, zu …)", say("Wohin fährst du?")], ["wann", "when", "a time", say("Wann kommst du?")],
            ["wie", "how", "a manner, a name, an age", say("Wie heißt du?")], ["wie viel", "how much", "an amount, a price", say("Wie viel kostet das?")],
            ["wie viele", "how many", "a number of things", say("Wie viele Kinder hast du?")], ["warum", "why", "a reason", say("Warum lernst du Deutsch?")],
          ]) +
          tip(`wo / woher / wohin = where / from where / to where. The answer gives it away: <b>in</b> → wo, <b>aus</b> → woher, <b>nach</b> or <b>zu</b> → wohin.`) },
        { id: "q-order", h: "Yes/no questions: verb first", html:
          `<p>No W-word? Then the verb takes position 1.</p>` +
          brk(["Verb", "Subject", "Rest"], ["v", "x", "x"], [["Wohnst", "du", "in Berlin?"], ["Hast", "du", "heute Zeit?"], ["Kommt", "Paul", "mit?"]]) +
          `<p>Separable prefixes still go to the end: Kommt Paul <b>mit</b>?</p>` },
        { id: "doch", h: "ja, nein, doch", html:
          `<p>To say 'yes' to a negative question, use <b>doch</b>: ${say("Kommst du nicht? — Doch!")} (Aren't you coming? — Yes, I am!)</p>` },
        { id: "neg", h: "nicht or kein?", html:
          `<p><b>kein</b> negates a noun that would otherwise have <b>ein</b> or <b>no article</b>. <b>nicht</b> negates everything else.</p>` +
          tbl(["Positive", "Negative", "Why"], [
            ["Ich habe ein Auto.", "Ich habe <mark>kein</mark> Auto.", "ein → kein"], ["Ich trinke Kaffee.", "Ich trinke <mark>keinen</mark> Kaffee.", "no article → kein (masculine accusative: keinen)"],
            ["Das ist der Bus.", "Das ist <mark>nicht</mark> der Bus.", "der/die/das → nicht"], ["Das ist mein Handy.", "Das ist <mark>nicht</mark> mein Handy.", "mein → nicht"],
            ["Ich bin müde.", "Ich bin <mark>nicht</mark> müde.", "adjective → nicht"], ["Ich komme.", "Ich komme <mark>nicht</mark>.", "verb → nicht"],
          ]) +
          `<p>kein takes the same endings as ein: <b>keinen</b> for masculine nouns in the accusative, <b>keine</b> for feminine and plural.</p>` },
        { id: "nicht-pos", h: "Where does nicht go?", html:
          `<p>nicht usually goes to the end of the sentence, but <b>before</b> adjectives, places and the part you want to negate, and before a separable prefix.</p>` +
          exl([["Ich komme heute nicht.", "I'm not coming today."], ["Das ist nicht gut.", "That's not good."], ["Ich wohne nicht in Berlin.", "I don't live in Berlin."], ["Er kommt nicht mit.", "He isn't coming along."]]) },
        { id: "konj", h: "Linking sentences: und, aber, oder, denn", html:
          tbl(["Word", "Meaning", "Example"], [
            ["und", "and", say("Ich koche und mein Mann macht den Salat.")], ["aber", "but", say("Das Hotel ist schön, aber es ist teuer.")],
            ["oder", "or", say("Wir gehen ins Kino oder wir bleiben zu Hause.")], ["denn", "because", say("Ich bleibe zu Hause, denn ich bin krank.")],
          ]) +
          `<p>These four words sit in <b>position 0</b>. They link the two sentences but don't count, so the second sentence keeps its normal order: position 1, then the verb.</p>` +
          brk(["Position 0", "Position 1", "Verb", "Rest"], ["x", "x", "v", "x"], [["denn", "ich", "bin", "krank."], ["aber", "es", "ist", "teuer."], ["aber", "heute", "habe", "ich Zeit."]]) +
          warn(`Keep the verb in position 2 after denn: <b>denn ich bin krank</b>, not <i>denn ich krank bin</i>. That end position belongs to weil, another word for 'because' that comes at A2.`) +
          tip(`Put a comma before aber and denn. Before und and oder you usually don't need one.`) },
      ],
    },
    {
      u: 11, de: "Gestern", en: "Talking about the past (Perfekt)", min: 7,
      lesson: [
        { id: "perf", h: "The Perfekt", html:
          `<p>In spoken German you talk about the past with the <b>Perfekt</b>: <b>haben</b> or <b>sein</b> in position 2 plus the past participle at the end. It covers English 'I ate', 'I have eaten' and 'I was eating'.</p>` +
          brk(["Position 1", "haben / sein", "Middle", "End"], ["x", "v", "x", "e"], [["Ich", "habe", "gestern Pizza", "gegessen."], ["Wir", "sind", "nach Berlin", "gefahren."]]) },
        { id: "pp", h: "Building the participle", html:
          tbl(["Type", "Pattern", "Examples"], [
            ["Regular", "ge + stem + <mark>t</mark>", "machen → gemacht, kaufen → gekauft, arbeiten → gearbeitet"],
            ["Irregular", "ge + stem + <mark>en</mark>, often with a new vowel", "essen → gegessen, trinken → getrunken, schreiben → geschrieben"],
            ["-ieren", "no ge-", "studieren → studiert, fotografieren → fotografiert"],
            ["be-, ver-, er-", "no ge-", "bezahlen → bezahlt, verstehen → verstanden, erklären → erklärt"],
            ["Separable", "ge in the middle", "einkaufen → ein<mark>ge</mark>kauft, aufstehen → auf<mark>ge</mark>standen"],
          ]) +
          tip(`Irregular participles have to be learned, like 'eat – ate – eaten'. Every verb card in this app shows its participle.`) },
        { id: "aux", h: "haben or sein?", html:
          `<p>Most verbs use <b>haben</b>. Use <b>sein</b> for:</p><ul><li>moving from A to B: gehen, fahren, fliegen, kommen, laufen</li><li>a change of state: aufstehen (from lying to standing)</li><li>sein and bleiben themselves</li></ul>` +
          exl([["Ich habe gegessen.", "I ate."], ["Ich bin gefahren.", "I drove / went."], ["Ich bin zu Hause geblieben.", "I stayed at home."]]) +
          tip(`Ask: did I move from one place to another, or change state? Then sein. Otherwise haben.`) },
        { id: "war", h: "war and hatte", html:
          `<p>For sein and haben, Germans usually use the simple past instead: <b>ich war</b> (I was) and <b>ich hatte</b> (I had).</p>` +
          tbl(["", "sein", "haben"], [["ich", "war", "hatte"], ["du", "warst", "hattest"], ["er / sie / es", "war", "hatte"], ["wir", "waren", "hatten"], ["ihr", "wart", "hattet"], ["sie / Sie", "waren", "hatten"]]) +
          exl([["Ich war in Spanien.", "I was in Spain."], ["Wie war dein Urlaub?", "How was your holiday?"], ["Ich hatte keine Zeit.", "I didn't have time."]]) },
        { id: "perf-order", h: "Word order in the Perfekt", html:
          `<p>Same bracket as modal verbs: haben/sein in position 2, participle at the very end. Time words can start the sentence.</p>` +
          brk(["Position 1", "haben / sein", "Middle", "End"], ["x", "v", "x", "e"], [["Gestern", "habe", "ich Fußball", "gespielt."], ["Hast", "du", "Brot", "gekauft?"], ["Was", "hast", "du am Wochenende", "gemacht?"]]) },
      ],
    },
    {
      u: 12, de: "Einkaufen", en: "Clothes, colours, shopping and für / ohne", min: 6,
      lesson: [
        { id: "clothes", h: "Clothes", html:
          `<p>Most clothes follow rules you already know. Words ending in -e are feminine: ${g("die", "Jacke")} ${g("die", "Bluse")} ${g("die", "Mütze")}. Learn the others with their colour: ${g("der", "Rock")} ${g("der", "Mantel")} ${g("der", "Pullover")} ${g("das", "Hemd")} ${g("das", "Kleid")} ${g("das", "T-Shirt")}.</p>` +
          warn(`<b>die Hose</b> (trousers) and <b>die Brille</b> (glasses) are singular in German: eine Hose = one pair of trousers, so <b>die Hose ist</b> zu lang.`) +
          `<p>To wear is ${say("tragen")} (du trägst, er trägt). To put on is ${say("anziehen")}, a separable verb: ${say("Ich ziehe eine Jacke an.")}</p>` },
        { id: "colours", h: "Colours", html:
          tbl(["", "", ""], [
            [say("rot") + " red", say("blau") + " blue", say("grün") + " green"], [say("gelb") + " yellow", say("schwarz") + " black", say("weiß") + " white"],
            [say("grau") + " grey", say("braun") + " brown", say("bunt") + " colourful"],
          ], "nums") +
          `<p>After sein a colour has no ending: ${say("Die Jacke ist blau.")} ${say("Die Schuhe sind schwarz.")} In front of a noun it gets an ending (eine blaue Jacke). You'll practise that at A2.</p>` +
          tip(`In a shop: ${say("Haben Sie die Jacke auch in Blau?")} After in, the colour is used as a noun, so it gets a capital letter.`) },
        { id: "shop", h: "In the shop", html:
          exl([["Kann ich Ihnen helfen?", "Can I help you?"], ["Ich suche eine Hose.", "I'm looking for trousers."], ["Welche Größe haben Sie? — Größe 40.", "What size are you? — Size 40."],
            ["Kann ich das anprobieren?", "Can I try this on?"], ["Die Hose ist zu klein. Haben Sie die Hose auch in 42?", "The trousers are too small. Do you have them in a 42?"],
            ["Was kostet der Pullover? — 39 Euro.", "How much is the jumper? — 39 euros."], ["Der Pullover gefällt mir. Ich nehme ihn.", "I like the jumper. I'll take it."]]) +
          tip(`<b>zu</b> + adjective = too: zu groß, zu teuer. And 'it' follows the gender in the accusative: der Pullover → ich nehme <b>ihn</b>, die Hose → ich nehme <b>sie</b>, das Hemd → ich nehme <b>es</b>.`) +
          `<p>${say("Das gefällt mir.")} means 'I like it'. Literally it's 'That pleases me': the thing is the subject and the person is <b>mir</b>. Unit 13 explains mir and dir.</p>` },
        { id: "fuer-ohne", h: "für and ohne: always accusative", html:
          `<p><b>für</b> (for) and <b>ohne</b> (without) are always followed by the accusative. As always, only masculine nouns change.</p>` +
          tbl(["", "der (m)", "die (f)", "das (n)", "plural"], [
            ["für", "für <mark>meinen</mark> Bruder", "für meine Schwester", "für mein Kind", "für meine Eltern"],
            ["ohne", "ohne <mark>den</mark> Schlüssel", "ohne die Jacke", "ohne das Handy", "ohne die Kinder"],
          ]) +
          exl([["Das Geschenk ist für meinen Vater.", "The present is for my father."], ["Ich gehe nie ohne meinen Regenschirm aus dem Haus.", "I never leave the house without my umbrella."], ["Ich trinke Kaffee ohne Milch.", "I drink coffee without milk."]]) +
          tip(`You already know another accusative preposition: <b>um</b>, as in um acht Uhr. The dative prepositions (mit, zu, bei…) are a separate group: mit <b>dem</b> Bus, but für <b>den</b> Bus.`) },
      ],
    },
    {
      u: 13, de: "Gesundheit", en: "Body, health, the imperative and mir / dir", min: 8,
      lesson: [
        { id: "body", h: "The body", html:
          tbl(["der", "die", "das"], [
            [g("der", "Kopf"), g("die", "Hand"), g("das", "Bein")], [g("der", "Bauch"), g("die", "Nase"), g("das", "Auge")], [g("der", "Rücken"), "", g("das", "Ohr")],
            [g("der", "Arm"), "", ""], [g("der", "Fuß"), "", ""], [g("der", "Hals"), "", ""], [g("der", "Mund"), "", ""], [g("der", "Zahn"), "", ""],
          ]) +
          `<p>Most body parts are masculine. Plurals you'll need often: die Augen, die Ohren, die Hände, die Füße, die Zähne.</p>` },
        { id: "doctor", h: "At the doctor's", html:
          `<p>Two ways to say what hurts:</p>` +
          exl([["Ich habe Kopfschmerzen.", "I have a headache."], ["Mir tut der Kopf weh.", "My head hurts."], ["Mir tun die Füße weh.", "My feet hurt."]]) +
          tip(`Schmerzen (pains) glues onto the body part: Kopfschmerzen, Bauchschmerzen, Rückenschmerzen, Halsschmerzen. With wehtun, use <b>tut</b> for one thing and <b>tun</b> for several.`) +
          exl([["Was fehlt Ihnen?", "What's the matter?"], ["Ich habe Fieber und bin erkältet.", "I have a temperature and a cold."], ["Ich brauche einen Termin.", "I need an appointment."], ["Gute Besserung!", "Get well soon!"]]) },
        { id: "imp", h: "Telling people what to do", html:
          `<p>The imperative has three forms, one for each kind of 'you'. The verb comes first.</p>` +
          tbl(["", "du", "ihr", "Sie"], [
            ["kommen", "<mark>Komm!</mark>", "Kommt!", "Kommen Sie!"], ["warten", "<mark>Warte!</mark>", "Wartet!", "Warten Sie!"], ["nehmen", "<mark>Nimm!</mark>", "Nehmt!", "Nehmen Sie!"],
            ["fahren", "<mark>Fahr!</mark>", "Fahrt!", "Fahren Sie!"], ["aufstehen", "<mark>Steh</mark> auf!", "Steht auf!", "Stehen Sie auf!"],
          ]) +
          `<ul><li><b>du</b>: take the du-form and drop du and the -st: du kommst → <b>Komm!</b> If the stem ends in -t, -d or a consonant + n, add -e: <b>Warte!</b> <b>Öffne!</b></li>` +
          `<li>Verbs that change e → i keep the change: du nimmst → <b>Nimm!</b>, du liest → <b>Lies!</b> Verbs with a → ä lose the umlaut: du fährst → <b>Fahr!</b></li>` +
          `<li><b>ihr</b>: the ihr-form without ihr: <b>Kommt!</b></li><li><b>Sie</b>: the infinitive, then Sie: <b>Kommen Sie!</b></li></ul>` +
          warn(`sein is irregular: <b>Sei</b> leise! <b>Seid</b> leise! <b>Seien Sie</b> leise!`) +
          tip(`Add <b>bitte</b> to sound friendly: Komm bitte! A separable prefix still goes to the end: Ruf mich bitte an!`) },
        { id: "perspron", h: "mich, dich, mir, dir", html:
          `<p>Pronouns change with the case, just like articles. You already know some: ${say("Wie geht es dir?")} ${say("Ich liebe dich.")}</p>` +
          tbl(["Nominativ", "Akkusativ", "Dativ"], [
            ["ich", "<mark>mich</mark>", "<mark>mir</mark>"], ["du", "<mark>dich</mark>", "<mark>dir</mark>"], ["er", "<mark>ihn</mark>", "<mark>ihm</mark>"], ["sie (she)", "sie", "<mark>ihr</mark>"],
            ["es", "es", "<mark>ihm</mark>"], ["wir", "uns", "uns"], ["ihr", "euch", "euch"], ["sie (they) / Sie", "sie / Sie", "<mark>ihnen / Ihnen</mark>"],
          ]) +
          `<p><b>Accusative</b> after most verbs with an object, and after für and ohne: ${say("Ich rufe dich an.")} ${say("Das ist für dich.")}</p>` +
          `<p><b>Dative</b> after mit, zu, bei, von and aus, and after a few verbs: helfen (${say("Kannst du mir helfen?")}), gefallen (${say("Das gefällt mir.")}), gehören (${say("Das gehört mir.")}), danken (${say("Ich danke dir.")}) and wehtun (${say("Mir tut der Kopf weh.")}).</p>` +
          tip(`ich → mich → mir, du → dich → dir: the accusative ends in -ch, the dative in -r.`) },
      ],
    },
  ];

  root.DH_CONTENT = { V, DEMO, RULES, SKILLS, CONCEPTS, ORDER, WQ, IMP, KONJ, WRITE, UNITS };
})(typeof window !== "undefined" ? window : globalThis);
