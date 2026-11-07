/*
 * Innoventure Content Studio - draft generator.
 * Pure functions, no dependencies. Works in the browser and in Node.
 * RULES: never invent facts. Anything not supplied becomes a [VERIFY: ...] marker.
 */
(function (root) {
  'use strict';

  var DEFAULT_TOPIC = 'building innovation and problem-solving skills in school students';
  var DEFAULT_MESSAGE = 'Every student can learn to think creatively and solve problems';
  var DEFAULT_ACTIVITY = 'a paper cup and three paper clips';

  var AUD = {
    leaders: {
      label: 'School leaders',
      hook: 'Schools talk a lot about future-ready students. The harder question is how to build that readiness into everyday school life.',
      points: [
        ['Start small and repeat', 'Short, regular problem-solving routines are easier to sustain than one-off events.'],
        ['Support your teachers', 'Give staff simple, ready-to-use classroom prompts rather than another heavy programme.'],
        ['Listen to student voice', 'Ask students what they tried, what they learned and what they would change.']
      ],
      why: 'For school development, the aim is to make creative problem-solving a habit that lasts across the year.',
      question: 'What is one way your school gives students space to solve real problems?'
    },
    teachers: {
      label: 'Teachers',
      hook: 'Think of the most engaged moment in your last lesson. Chances are students were working something out, not copying it down.',
      points: [
        ['Open with a question', 'Start a lesson with "How might we...?" and let students suggest ideas before you teach.'],
        ['Allow imperfect first attempts', 'Students learn to think critically when they can test an idea, see what happens and improve it.'],
        ['Reflect out loud', 'Two minutes at the end on "What did we try? What would we change?" turns activity into learning.']
      ],
      why: 'These are small classroom moves that fit into the lessons you already teach.',
      question: 'Which quick activity gets your students thinking creatively?'
    },
    parents: {
      label: 'Parents',
      hook: 'Curious children ask "why?" and "what if?". Those questions are where creativity and problem-solving begin.',
      points: [
        ["Ask 'What if?'", 'Turn everyday moments into thinking games, like "What if the bus could fly?"'],
        ['Let them try first', 'Before giving the answer, ask "What do you think we could do?"'],
        ['Celebrate the effort', 'Mistakes are part of learning. Praise ideas and effort, not only results.']
      ],
      why: 'Habits like these can support a child\'s confidence and everyday thinking skills.',
      question: 'What creative idea has your child come up with recently? (No names or photos needed.)'
    },
    children: {
      label: 'Children',
      hook: 'Did you ever have a big idea and wonder if it could really work?',
      points: [
        ["Ask 'What if?'", 'Great ideas start with a question.'],
        ['Try your idea', 'Build it, draw it or test it. Then see what happens!'],
        ['Mistakes are okay', 'If it falls down, that is great. You just learned something. Try again!']
      ],
      why: 'Everyone can be a creative thinker and problem-solver.',
      question: 'What will you invent or try today?'
    }
  };

  // Alternative wording so newsletter / video do not repeat LinkedIn / Instagram sentences.
  var ALT = {
    leaders:  ['Build a routine: a few minutes of problem-solving each week is easier to keep going than a single big event.',
               'Equip staff with short prompts they can drop into any subject.',
               'Invite students to share what they tried and what they would do differently.'],
    teachers: ['Pose a challenge first, then let students suggest ways to tackle it before you explain.',
               'Let pupils test a half-formed idea; seeing what works builds sharper thinking.',
               'Finish with a quick look back: what was tried, and what could be better next time?'],
    parents:  ['Everyday moments, like a bus ride or a walk, can become little thinking games.',
               'Pause before giving the answer and ask what your child thinks could work.',
               'When something goes wrong, talk about what to change. Effort and ideas deserve praise.'],
    children: ['Every big invention began with someone wondering.',
               'Make it, sketch it or test it, and watch what happens.',
               'A tumble is a clue. Change one thing and go again.']
  };
  var HOOK = {
    leaders:  'What if one small weekly habit could change how students tackle problems?',
    teachers: 'Here is a ten-second classroom move worth trying.',
    parents:  'One simple question can help a curious child think creatively.',
    children: 'Ready for a tiny challenge?'
  };

  var IGH = {
    leaders:  'Strong school culture grows from small habits repeated often.',
    teachers: 'Imagine a classroom where ideas get tested, not just answered.',
    parents:  'Questions like \'what if?\' are often where creativity starts.',
    children: 'Big ideas can start with one tiny question.'
  };

  var TONES = {
    warm:         { emoji: 1, close: 'Every small step counts, and we are glad you are part of it.', sign: 'Warm regards,' },
    professional: { emoji: 0, close: 'We welcome your thoughts and look forward to continuing the conversation.', sign: 'Kind regards,' },
    playful:      { emoji: 2, close: 'Go on, give it a try and see what happens!', sign: 'Happy thinking,' },
    inspiring:    { emoji: 1, close: 'Imagine what students can build when we give them room to think.', sign: 'With best wishes,' }
  };

  var OBJ = {
    AWARENESS: 'AWARENESS',
    ENGAGEMENT: 'ENGAGEMENT',
    REGISTRATION: 'REGISTRATION',
    'EVENT PROMOTION': 'EVENT PROMOTION',
    'LEAD GENERATION': 'LEAD GENERATION'
  };

  function clean(s) { return (s == null ? '' : String(s)).trim(); }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

  function pickAud(selected, priority) {
    for (var i = 0; i < priority.length; i++) if (selected.indexOf(priority[i]) !== -1) return priority[i];
    return selected[0];
  }

  function e(tone, level1, level2) {
    if (tone.emoji === 0) return '';
    if (tone.emoji === 2 && level2) return ' ' + level2;
    return level1 ? ' ' + level1 : '';
  }

  function hashtags(base, campaign, extra) {
    var tags = ['#Innoventure'].concat(base || []).concat(extra || []);
    if (campaign) {
      var camel = campaign.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean)
        .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join('');
      if (camel) tags.push('#' + camel);
    }
    return uniq(tags).join(' ');
  }

  function generate(input) {
    var flags = [];
    var assumptions = [];
    function need(v, label) {
      if (v) return v;
      if (flags.indexOf(label) === -1) flags.push(label);
      return '[VERIFY: ' + label + ']';
    }

    var selected = (input.audiences || []).filter(function (a) { return AUD[a]; });
    if (!selected.length) {
      selected = ['teachers', 'parents'];
      assumptions.push('No audience selected: assumed teachers and parents.');
    }
    var toneKey = TONES[input.tone] ? input.tone : 'warm';
    if (!TONES[input.tone]) assumptions.push('No tone selected: assumed warm.');
    var tone = TONES[toneKey];
    var objective = OBJ[input.objective] || 'AWARENESS';
    if (!OBJ[input.objective]) assumptions.push('No objective selected: assumed AWARENESS.');

    var topic = clean(input.topic);
    if (!topic) { topic = DEFAULT_TOPIC; assumptions.push('No topic supplied: used Innoventure\'s stated themes.'); }
    var message = clean(input.keyMessage);
    if (!message) { message = DEFAULT_MESSAGE; assumptions.push('No key message supplied: used a generic one.'); }
    var campaignRaw = clean(input.campaign);
    var campaign = need(campaignRaw, 'campaign name');
    var description = clean(input.description);
    var details = clean(input.eventDetails);
    var link = need(clean(input.link), 'CTA link');
    var handle = clean(input.handle) || '[VERIFY: Instagram/LinkedIn handle]';
    if (!clean(input.handle)) flags.push('social handle');
    var activity = clean(input.activity) || DEFAULT_ACTIVITY;
    if (!clean(input.activity)) assumptions.push('Sample hands-on activity used in the video drafts (' + DEFAULT_ACTIVITY + '). Replace with one that suits your campaign and age group.');

    var progLine = description
      ? description
      : need('', 'programme/campaign description');
    var needsDetails = (objective === 'REGISTRATION' || objective === 'EVENT PROMOTION');
    var detailsLine = details ? details : (needsDetails ? need('', 'dates, venue, eligibility, fees and registration steps') : '');

    var tags = ['#CriticalThinking', '#ProblemSolving', '#CreativeLearning'];

    function cta(platform, aud) {
      var q = AUD[aud].question;
      switch (objective) {
        case 'REGISTRATION':
          return platform === 'newsletter' ? 'Register here: ' + link :
                 platform === 'shorts' ? 'Want to take part? Registration details are linked below.' :
                 platform === 'instagram' ? 'Ready to join? Tap the link in bio to register.' :
                 'Registration is open. Details and sign-up: ' + link;
        case 'EVENT PROMOTION':
          return platform === 'newsletter' ? 'Save the date and find the details: ' + link :
                 platform === 'shorts' ? 'Save the date! Event details are linked below.' :
                 platform === 'instagram' ? 'Save the date! Event details are in the link in bio.' :
                 'Save the date and see the event details: ' + link;
        case 'LEAD GENERATION':
          return platform === 'newsletter' ? 'Interested in exploring this for your school or child? Get in touch: ' + link :
                 platform === 'shorts' ? 'Curious to know more? Tap the link below to get in touch.' :
                 platform === 'instagram' ? 'Want to know more? Message us or use the link in bio.' :
                 'Interested in exploring this at your school? Start a conversation with us: ' + link;
        case 'ENGAGEMENT':
          return platform === 'newsletter' ? 'Just reply to this email and tell us: ' + q :
                 platform === 'shorts' ? 'Drop your answer below: ' + q :
                 platform === 'instagram' ? 'Tell us in the comments: ' + q :
                 q + ' Share in the comments.';
        default:
          return platform === 'newsletter' ? 'Find out more: ' + link :
                 platform === 'shorts' ? 'Follow for more, and find out more at the link below.' :
                 platform === 'instagram' ? 'Follow us and tap the link in bio to learn more.' :
                 'Learn more about our work: ' + link;
      }
    }

    /* ---------------- LinkedIn ---------------- */
    var la = pickAud(selected, ['leaders', 'teachers', 'parents', 'children']);
    if (la === 'children') la = selected.indexOf('teachers') !== -1 ? 'teachers' : 'leaders';
    var L = AUD[la];
    var linkedin = [
      L.hook, '',
      'A practical starting point: give students real problems, not only right answers. Our takeaway: ' + message.charAt(0).toLowerCase() + message.slice(1) + '.',
      '',
      '1. ' + L.points[0][0] + '. ' + L.points[0][1],
      '2. ' + L.points[1][0] + '. ' + L.points[1][1],
      '3. ' + L.points[2][0] + '. ' + L.points[2][1],
      '',
      L.why,
      '',
      'At Innoventure, our focus is innovation, creativity, critical thinking and problem-solving among school students' + (clean(input.topic) ? ', and this work connects to ' + topic : '') + '.',
      '',
      'About ' + campaign + ': ' + progLine,
      detailsLine ? detailsLine : '',
      '',
      cta('linkedin', la),
      '',
      hashtags(tags, campaignRaw, ['#EducationLeadership', '#FutureReadyLearning'])
    ].filter(function (x, i, a) { return !(x === '' && a[i - 1] === ''); }).join('\n');

    /* ---------------- Instagram ---------------- */
    var ia = pickAud(selected, ['parents', 'children', 'teachers', 'leaders']);
    var I = AUD[ia];
    var ca = selected.indexOf('children') !== -1 ? 'children' : ia;
    var C = AUD[ca];
    var caption = [
      IGH[ia] + e(tone, '🌱', '🌟🚀'),
      '',
      'Swipe for three simple ideas' + e(tone, '👉', '👉👉') + ' ' + message + '.',
      '',
      'Spotlight on ' + campaign + ': ' + progLine,
      detailsLine ? detailsLine : '',
      '',
      cta('instagram', ia),
      '',
      hashtags(tags, campaignRaw, ['#SchoolStudents', ia === 'parents' ? '#ParentingTips' : '#LearningThroughPlay'])
    ].filter(function (x, i, a) { return !(x === '' && a[i - 1] === ''); }).join('\n');

    var carousel = [
      'Slide 1 (cover): "3 ideas to grow a little problem-solver"' + e(tone, '🧠', '🧠✨') + '\n  Visual: bright background, simple lightbulb icon.',
      'Slide 2: "' + I.points[0][0] + '"\n  Text: ' + I.points[0][1],
      'Slide 3: "' + I.points[1][0] + '"\n  Text: ' + I.points[1][1],
      'Slide 4: "' + I.points[2][0] + '"\n  Text: ' + I.points[2][1],
      'Slide 5 (CTA): "' + message + '"\n  Text: ' + cta('instagram', ia) + ' ' + handle
    ].join('\n\n');

    var reel = [
      'Concept: a 20-second "Can you solve it?" challenge for children. Hands-only or illustrated visuals. No identifiable children.',
      'Age range: ' + (clean(input.ageRange) || need('', 'child age range')),
      '',
      '0-3s   Visual: hands hold ' + activity + '.',
      '       Voice: "' + IGH[ca] + ' Try this!"',
      '3-10s  Visual: quick shots of building and testing.',
      '       Voice: "Step one: ' + C.points[0][0] + '"',
      '10-16s Visual: it wobbles, hands adjust and retry.',
      '       Voice: "Step two: ' + C.points[2][0] + '"',
      '16-20s Visual: finished creation, text on screen.',
      '       Voice: "' + C.question + '" + "Follow for more!"'
    ].join('\n');

    var instagram = ['=== CAPTION ===', caption, '', '=== CAROUSEL (5 SLIDES) ===', carousel, '', '=== REEL CONCEPT / SCRIPT ===', reel, '', '=== CTA ===', cta('instagram', ia)].join('\n');

    /* ---------------- YouTube Shorts ---------------- */
    var sa = pickAud(selected, ['children', 'parents', 'teachers', 'leaders']);
    var S = AUD[sa];
    var title = (sa === 'children' ? 'Can You Solve This Tiny Challenge?' : sa === 'parents' ? 'One Question That Builds Creative Kids' : 'A 30-Second Idea for Creative Thinking') + ' | Innoventure';
    var hookLine = sa === 'children' ? 'Look at this: ' + activity + '. Can YOU make something awesome?' : HOOK[sa];
    var script = [
      '[0-3s]   HOOK: "' + hookLine + '"',
      '[3-13s]  "Tip one: ' + S.points[0][0] + '. ' + ALT[sa][0].split('.')[0] + '."',
      '[13-23s] "Tip two: ' + S.points[1][0] + '. ' + ALT[sa][1].split('.')[0] + '."',
      '[23-33s] "Tip three: ' + S.points[2][0] + '. ' + ALT[sa][2].split('.')[0] + '."',
      '[33-43s] "Remember: ' + message.charAt(0).toLowerCase() + message.slice(1) + '. That is the spirit of Innoventure: creativity, critical thinking and problem-solving."',
      '[43-50s] CTA: "' + cta('shorts', sa) + '"'
    ].join('\n');
    var scenes = [
      'Scene 1 (0-3s): tight overhead shot of ' + activity + ' on a bright table; bold text "Can you solve it?"',
      'Scene 2 (3-13s): cartoon thought bubbles pop up with ideas; hands start to build.',
      'Scene 3 (13-23s): hands test the idea; a gentle wobble or fall, fun sound effect.',
      'Scene 4 (23-33s): hands adjust and retry; on-screen text with the tip.',
      'Scene 5 (33-43s): finished creation held to camera; text: "' + message + '".',
      'Scene 6 (43-50s): approved Innoventure logo [VERIFY: logo file] and "Follow for more".'
    ].join('\n');
    var shortsDesc = [
      'A quick idea on creativity and problem-solving for ' + AUD[sa].label.toLowerCase() + '.',
      'More about ' + campaign + ': ' + progLine,
      detailsLine ? detailsLine : '',
      cta('shorts', sa) + ' ' + link,
      '',
      hashtags(['#Shorts', '#CreativeThinking', '#ProblemSolving'], campaignRaw, [sa === 'children' ? '#KidsChallenge' : '#LearningTips'])
    ].filter(function (x, i, a) { return !(x === '' && a[i - 1] === ''); }).join('\n');
    var shorts = ['=== TITLE ===', title, '', '=== 3-SECOND HOOK ===', hookLine, '', '=== SCRIPT (about 50 seconds) ===', script, '', '=== SCENE-BY-SCENE VISUALS ===', scenes, '', '=== DESCRIPTION ===', shortsDesc, '', '=== CTA ===', cta('shorts', sa),
      '', 'Safety: hands-only or animation; supervise any hands-on activity; no children\'s faces or personal details unless consent is verified. [VERIFY: consent policy]'].join('\n');

    /* ---------------- Newsletter ---------------- */
    var subject = selected.length > 1 ? 'Small questions, big thinkers: ideas to try this week' :
      sa === 'parents' ? 'Three ways to grow a curious, confident thinker' : 'Three ideas to bring creative problem-solving into your week';
    var preview = 'Simple ideas to build creativity and critical thinking in students.';
    var sections = selected.map(function (k) {
      var A = AUD[k];
      return '### For ' + A.label.toLowerCase() + '\n' +
        '- **' + A.points[0][0] + '.** ' + ALT[k][0] + '\n' +
        '- **' + A.points[1][0] + '.** ' + ALT[k][1] + '\n' +
        '- **' + A.points[2][0] + '.** ' + ALT[k][2];
    }).join('\n\n');
    var newsletter = [
      'SUBJECT: ' + subject,
      'PREVIEW TEXT: ' + preview,
      '',
      '## Growing Thinkers, One Question at a Time',
      '',
      'Hello [FIRST NAME],',
      '',
      'Every young person is curious. The challenge, for families and schools alike, is keeping that curiosity alive and helping it grow into confident thinking. The belief behind this issue: ' + message.charAt(0).toLowerCase() + message.slice(1) + '.',
      '',
      'Innoventure focuses on innovation, creativity, critical thinking and problem-solving among school students. Here are a few ideas that fit into daily routines.',
      '',
      sections,
      '',
      '### About ' + campaign,
      progLine,
      detailsLine ? detailsLine : '',
      '',
      tone.close,
      '',
      'CTA: ' + cta('newsletter', pickAud(selected, ['parents', 'teachers', 'leaders', 'children'])),
      '',
      tone.sign,
      '[SENDER NAME]',
      '[ROLE], Innoventure',
      '[VERIFY: footer, unsubscribe link and postal address]'
    ].filter(function (x, i, a) { return !(x === '' && a[i - 1] === ''); }).join('\n');
    flags.push('sender name and email footer/unsubscribe');
    flags.push('approved logo and video music licence');

    var drafts = { linkedin: linkedin, instagram: instagram, shorts: shorts, newsletter: newsletter };
    return {
      drafts: drafts,
      flags: uniq(flags),
      assumptions: assumptions,
      warnings: checkSafety(input, drafts),
      status: 'DRAFT - requires human review. Nothing is published automatically.'
    };
  }

  /* ---------------- Safety checks ---------------- */
  var RISKY = [
    [/guarantee[ds]?\b/i, 'Contains "guarantee" - avoid guarantees.'],
    [/\b100\s?%/i, 'Contains "100%" - avoid absolute claims.'],
    [/\b(proven|scientifically proven|ensures? success|will definitely|always works)\b/i, 'Contains an absolute or unproven claim.'],
    [/\b(best|number one|no\.?\s?1|top-ranked|leading)\b.*\b(school|programme|program|platform)\b/i, 'Contains a superlative/ranking claim - needs evidence.'],
    [/\baward[- ]?winning\b|\bawarded\b/i, 'Mentions an award - verify before using.'],
    [/\b(testimonial|parents say|students say|teachers say)\b/i, 'Implies a testimonial - only use verified, consented quotes.'],
    [/\b\d{1,3}\s?%/i, 'Contains a percentage - verify the source.']
  ];
  var PRIVATE = [
    [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, 'Contains an email address - confirm it is a business address, not personal.'],
    [/(\+?\d[\d\s-]{8,}\d)/, 'Contains a phone-like number - confirm it is a business number.'],
    [/\b(my|his|her)\s+(son|daughter|child)\b|\bstudent named\b|\bchild named\b/i, 'May reference a specific child - remove personal information about children.']
  ];

  function checkSafety(input, drafts) {
    var out = [];
    var inputText = [input.topic, input.campaign, input.description, input.keyMessage, input.eventDetails, input.activity].map(clean).join('\n');
    RISKY.concat(PRIVATE).forEach(function (r) {
      if (r[0].test(inputText)) out.push({ level: 'review', where: 'Your brief', msg: r[1] });
    });
    Object.keys(drafts).forEach(function (k) {
      RISKY.forEach(function (r) {
        if (r[0].test(drafts[k]) && !r[0].test(inputText)) out.push({ level: 'review', where: k, msg: r[1] });
      });
    });
    // duplicate-text check across platforms
    var seen = {};
    Object.keys(drafts).forEach(function (k) {
      drafts[k].split(/(?<=[.!?])\s+|\n/).forEach(function (s) {
        var t = s.trim();
        if (t.length < 45 || /^\[VERIFY/.test(t) || /^(Slide|Scene|Voice|Visual)/.test(t)) return;
        (seen[t] = seen[t] || []).push(k);
      });
    });
    Object.keys(seen).forEach(function (t) {
      var plats = uniq(seen[t]);
      if (plats.length > 1) out.push({ level: 'review', where: plats.join(' + '), msg: 'Same sentence appears on multiple platforms: "' + t.slice(0, 70) + '..."' });
    });
    return out;
  }

  var api = { generate: generate, checkSafety: checkSafety, AUD: AUD, TONES: TONES, OBJ: OBJ };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.InnoGen = api;
})(typeof window !== 'undefined' ? window : globalThis);
