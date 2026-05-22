/**
 * Local Cricket Knowledge Engine — CreaseChat
 * Full player profiles, detailed IPL stats, international records, and team info.
 * Used as the primary fallback when Gemini API is not configured.
 */

export function generateCricketFallbackResponse(message: string): string {
  const query = message.toLowerCase().trim();

  // ─── Off-topic detection ────────────────────────────────────────────────────
  const offTopicKeywords = [
    'football', 'soccer', 'basketball', 'tennis', 'hockey', 'baseball',
    'volleyball', 'kabaddi', 'golf', 'badminton', 'swimming', 'chess',
    'politics', 'president', 'prime minister', 'election', 'weather',
    'recipe', 'cooking', 'food', 'code', 'javascript', 'python', 'html',
    'css', 'programming', 'movie', 'song', 'music', 'bollywood',
    'chatgpt', 'openai', 'math', 'science', 'history of india',
  ];
  const isCricketMentioned =
    query.includes('cricket') || query.includes('batsman') ||
    query.includes('bowler') || query.includes('ipl') ||
    query.includes('wicket') || query.includes('over') ||
    query.includes('runs') || query.includes('innings') ||
    query.includes('t20') || query.includes('odi') ||
    query.includes('test match') || query.includes('bcci');

  if (offTopicKeywords.some(k => query.includes(k)) && !isCricketMentioned) {
    return (
      "🏏 I'm **CreaseChat** — strictly a Cricket AI! That topic is outside my crease. " +
      "Ask me about IPL stats, player records, cricket rules, team histories, or match strategies. " +
      "I live and breathe cricket! 🎯"
    );
  }

  // ─── Greetings ───────────────────────────────────────────────────────────────
  if (query.match(/^(hello|hi|hey|greetings|yo|sup|good morning|good afternoon|good evening|namaste)/)) {
    return (
      "🏏 **Welcome to CreaseChat!** I'm your dedicated Cricket AI, powered by Playkers.\n\n" +
      "I can help you with:\n" +
      "• 📊 **Player stats** — IPL & international (Kohli, Rohit, Dhoni, Sachin & 50+ more)\n" +
      "• 🏟️ **IPL teams** — history, trophies, key players\n" +
      "• 📋 **Cricket rules** — LBW, DRS, Duckworth-Lewis, powerplay & more\n" +
      "• 🌍 **World records** — batting, bowling, fielding\n" +
      "• 🏆 **ICC events** — World Cup, Champions Trophy, T20 WC\n\n" +
      "What would you like to know? 🎯"
    );
  }

  if (
    query.includes('who are you') || query.includes('what are you') ||
    query.includes('creasechat') || query.includes('what do you do') ||
    (query.includes('your name') && !query.includes('player'))
  ) {
    return (
      "I'm **CreaseChat** 🏏 — the AI cricket expert built into **Playkers**.\n\n" +
      "I have deep knowledge of cricket across all formats — Test, ODI, T20, and IPL. " +
      "I can give you detailed stats on 50+ players, explain every cricket rule, " +
      "break down team strategies, and discuss historic matches. " +
      "What would you like to explore? 🌟"
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  PLAYER PROFILES — DETAILED IPL + INTERNATIONAL STATS
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Virat Kohli ─────────────────────────────────────────────────────────
  if (query.includes('kohli') || (query.includes('virat') && !query.includes('siraj'))) {
    if (query.includes('ipl') || query.includes('rcb') || query.includes('challengers')) {
      return (
        "📊 **Virat Kohli — IPL Career Stats (RCB, 2008–present)**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 252 |\n" +
        "| Innings | 244 |\n" +
        "| Total Runs | 8,004 |\n" +
        "| Highest Score | 113 |\n" +
        "| Centuries | 8 |\n" +
        "| Half-Centuries | 55 |\n" +
        "| Average | 37.57 |\n" +
        "| Strike Rate | 131.42 |\n" +
        "| Fours | 659 |\n" +
        "| Sixes | 253 |\n\n" +
        "🏆 **Season Highlights:**\n" +
        "• **2016 IPL** — Kohli's best-ever season: **973 runs** in 16 matches, Avg: 81.08, SR: 152.03, 4 centuries & 7 fifties — *still the all-time single-season record!*\n" +
        "• **2024 IPL** — RCB's title-winning season; Kohli scored **741 runs** & won Orange Cap 🧡\n" +
        "• First player to score **8,000 IPL runs**\n" +
        "• **IPL Trophies with RCB**: 1 (2024 🏆)\n" +
        "• Most 50+ scores in IPL history\n\n" +
        "🎯 Kohli plays for **Royal Challengers Bengaluru (RCB)** since the IPL's inception in 2008."
      );
    }
    if (query.includes('odi')) {
      return (
        "📊 **Virat Kohli — ODI Career Stats**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 295 |\n" +
        "| Innings | 280 |\n" +
        "| Total Runs | 13,906 |\n" +
        "| Highest Score | 183 |\n" +
        "| Centuries | 50 |\n" +
        "| Half-Centuries | 72 |\n" +
        "| Average | 58.96 |\n" +
        "| Strike Rate | 93.62 |\n\n" +
        "🌟 **Records:**\n" +
        "• Most ODI centuries ever — **50 hundreds** (surpassed Sachin's 49)\n" +
        "• Fastest to 10,000 / 11,000 / 12,000 / 13,000 ODI runs\n" +
        "• ICC ODI Player of the Year — 2012, 2017, 2018, 2023\n" +
        "• 2011 World Cup winner 🏆"
      );
    }
    if (query.includes('test')) {
      return (
        "📊 **Virat Kohli — Test Career Stats**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 123 |\n" +
        "| Innings | 210 |\n" +
        "| Total Runs | 9,230 |\n" +
        "| Highest Score | 254* |\n" +
        "| Centuries | 30 |\n" +
        "| Half-Centuries | 31 |\n" +
        "| Average | 47.86 |\n\n" +
        "🏏 254* vs South Africa (2019) is his highest Test score.\n" +
        "He is India's most successful Test captain — **40 wins** in 68 matches."
      );
    }
    if (query.includes('t20') || query.includes('twenty20')) {
      return (
        "📊 **Virat Kohli — T20I Career Stats**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 125 |\n" +
        "| Innings | 113 |\n" +
        "| Total Runs | 4,188 |\n" +
        "| Highest Score | 122* |\n" +
        "| Centuries | 1 |\n" +
        "| Half-Centuries | 38 |\n" +
        "| Average | 52.35 |\n" +
        "| Strike Rate | 137.97 |\n\n" +
        "🏆 **2024 T20 World Cup** — Kohli scored **76 in the final** vs South Africa & was Player of the Tournament!\n" +
        "He retired from T20Is after winning the 2024 World Cup."
      );
    }
    return (
      "👑 **Virat Kohli — Complete Career Overview**\n\n" +
      "**Born**: 5 Nov 1988, Delhi | **Role**: Right-hand bat | **Teams**: India, RCB\n\n" +
      "**🏏 International Stats:**\n" +
      "| Format | Matches | Runs | 100s | Avg | SR |\n|---|---|---|---|---|---|\n" +
      "| Tests | 123 | 9,230 | 30 | 47.86 | 57.2 |\n" +
      "| ODIs | 295 | 13,906 | 50 | 58.96 | 93.62 |\n" +
      "| T20Is | 125 | 4,188 | 1 | 52.35 | 137.97 |\n\n" +
      "**🏟️ IPL (RCB):** 252 matches • **8,004 runs** • 8 centuries • Avg 37.57 • SR 131.42\n" +
      "• **2016 IPL**: 973 runs (All-time single-season record 🔥)\n" +
      "• **2024 IPL**: Orange Cap winner, RCB's first title 🏆\n\n" +
      "**🏆 Honours:** 2011 ODI World Cup • 2024 T20 World Cup • ICC Test Player of Year 2018\n" +
      "**📌 Records:** Most ODI centuries (50) • Most IPL runs (8,004) • Fastest to 10k/11k/12k/13k ODI runs\n\n" +
      "*Ask me specifically: 'Kohli IPL stats', 'Kohli ODI stats', 'Kohli Test stats', 'Kohli T20I stats'* 🎯"
    );
  }

  // ─── MS Dhoni ─────────────────────────────────────────────────────────────
  if (query.includes('dhoni') || query.includes('msd') || query.includes('thala') || query.includes('captain cool')) {
    if (query.includes('ipl') || query.includes('csk')) {
      return (
        "📊 **MS Dhoni — IPL Career Stats (CSK)**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 264 |\n" +
        "| Innings | 214 |\n" +
        "| Total Runs | 5,284 |\n" +
        "| Highest Score | 84* |\n" +
        "| Half-Centuries | 24 |\n" +
        "| Average | 39.43 |\n" +
        "| Strike Rate | 135.90 |\n" +
        "| Dismissals (wk) | 182 ct + 42 st = 224 |\n\n" +
        "🏆 **IPL Trophies as Captain (CSK):** 2010, 2011, 2018, 2021, 2023 = **5 titles** 🥇\n\n" +
        "🎯 **CSK Finishes Under MSD:** 13 playoff appearances in 14 seasons\n" +
        "• Famous for ultra-cool last-ball finishes and helicopter shots in death overs\n" +
        "• Most stumpings in IPL history (42)"
      );
    }
    return (
      "👑 **MS Dhoni — Complete Career Overview**\n\n" +
      "**Born**: 7 Jul 1981, Ranchi | **Role**: WK-Bat / Captain | **Retd**: 2020 (Int'l)\n\n" +
      "**🏏 International Stats:**\n" +
      "| Format | Matches | Runs | HS | Avg | SR |\n|---|---|---|---|---|---|\n" +
      "| Tests | 90 | 4,876 | 224* | 38.09 | 59.14 |\n" +
      "| ODIs | 350 | 10,773 | 183* | 50.58 | 87.56 |\n" +
      "| T20Is | 98 | 1,617 | 56 | 37.60 | 126.13 |\n\n" +
      "**🏟️ IPL (CSK):** 264 matches • 5,284 runs • Avg 39.43 • SR 135.90 • **224 dismissals**\n\n" +
      "**🏆 Trophies:**\n" +
      "• ICC T20 World Cup 2007 🥇\n" +
      "• ICC ODI World Cup 2011 🏆 (finished with a six!)\n" +
      "• ICC Champions Trophy 2013 🥇\n" +
      "• IPL: **5 titles** with CSK (2010, 2011, 2018, 2021, 2023)\n\n" +
      "**📌 Records:** First captain to win all 3 ICC trophies • Most stumpings in IPL • Highest ODI score by WK (183*)"
    );
  }

  // ─── Rohit Sharma ─────────────────────────────────────────────────────────
  if (query.includes('rohit') || query.includes('hitman') || (query.includes('sharma') && !query.includes('yadav'))) {
    if (query.includes('ipl') || query.includes('mumbai')) {
      return (
        "📊 **Rohit Sharma — IPL Career Stats (MI)**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 257 |\n" +
        "| Innings | 250 |\n" +
        "| Total Runs | 6,628 |\n" +
        "| Highest Score | 109* |\n" +
        "| Centuries | 2 |\n" +
        "| Half-Centuries | 40 |\n" +
        "| Average | 28.85 |\n" +
        "| Strike Rate | 130.47 |\n\n" +
        "🏆 **IPL Trophies as Captain (MI):** 2013, 2015, 2017, 2019, 2020 = **5 titles** 🥇\n\n" +
        "• All 5 titles won in even/odd years pattern\n" +
        "• Most IPL titles as captain in history"
      );
    }
    return (
      "💥 **Rohit Sharma — Complete Career Overview**\n\n" +
      "**Born**: 30 Apr 1987, Nagpur | **Role**: Right-hand bat / Opener / Captain\n\n" +
      "**🏏 International Stats:**\n" +
      "| Format | Matches | Runs | HS | 100s | Avg | SR |\n|---|---|---|---|---|---|---|\n" +
      "| Tests | 67 | 4,391 | 212 | 12 | 40.66 | 58.98 |\n" +
      "| ODIs | 264 | 10,709 | 264 | 31 | 48.96 | 89.93 |\n" +
      "| T20Is | 159 | 4,231 | 118 | 5 | 32.05 | 140.89 |\n\n" +
      "**🏟️ IPL (MI):** 257 matches • 6,628 runs • 5 titles as captain\n\n" +
      "**📌 Key Records:**\n" +
      "• **3 ODI double-centuries** — no other player has more than one\n" +
      "• Highest ODI score: **264*** vs Sri Lanka (2014)\n" +
      "• 5 IPL titles as MI captain\n" +
      "• 2024 T20 World Cup winner & India's T20I captain\n\n" +
      "**🏆 Honours:** 2011 ODI WC • 2024 T20 WC (as captain) • ICC Test Cricketer of Year 2019"
    );
  }

  // ─── Sachin Tendulkar ─────────────────────────────────────────────────────
  if (query.includes('sachin') || query.includes('tendulkar') || query.includes('master blaster') || query.includes('god of cricket') || query.includes('little master')) {
    if (query.includes('ipl')) {
      return (
        "📊 **Sachin Tendulkar — IPL Career Stats (Mumbai Indians)**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 78 |\n" +
        "| Innings | 78 |\n" +
        "| Total Runs | 2,334 |\n" +
        "| Highest Score | 100* |\n" +
        "| Centuries | 1 |\n" +
        "| Half-Centuries | 13 |\n" +
        "| Average | 34.83 |\n" +
        "| Strike Rate | 119.82 |\n\n" +
        "🏏 Sachin played for Mumbai Indians from IPL 2008 to 2013. He was also the first player to score a T20 century (100* in IPL 2010).\n" +
        "He retired from all forms of cricket in November **2013** before IPL 2014."
      );
    }
    return (
      "🌟 **Sachin Tendulkar — The God of Cricket**\n\n" +
      "**Born**: 24 Apr 1973, Mumbai | **Retired**: Nov 2013 | **Career**: 24 years\n\n" +
      "**🏏 International Stats:**\n" +
      "| Format | Matches | Innings | Runs | HS | 100s | Avg | SR |\n|---|---|---|---|---|---|---|---|\n" +
      "| Tests | 200 | 329 | 15,921 | 248* | 51 | 53.79 | 54.01 |\n" +
      "| ODIs | 463 | 452 | 18,426 | 200* | 49 | 44.83 | 86.24 |\n\n" +
      "**🏟️ IPL (MI):** 78 matches • 2,334 runs • Avg 34.83 • SR 119.82\n\n" +
      "**📌 Unmatchable Records:**\n" +
      "• **Most international runs**: 34,357 across all formats\n" +
      "• **100 international centuries** — 51 in Tests, 49 in ODIs\n" +
      "• **Most ODI appearances**: 463\n" +
      "• First to score **200* in ODIs** (vs South Africa, 2010)\n" +
      "• Only player to play **200 Test matches**\n\n" +
      "**🏆 Honours:** 2011 ODI World Cup 🏆 • Bharat Ratna 2014 • Wisden Cricketer of the Century"
    );
  }

  // ─── Jasprit Bumrah ───────────────────────────────────────────────────────
  if (query.includes('bumrah')) {
    if (query.includes('ipl') || query.includes('mumbai')) {
      return (
        "📊 **Jasprit Bumrah — IPL Career Stats (MI)**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 140 |\n" +
        "| Innings | 140 |\n" +
        "| Wickets | 170 |\n" +
        "| Best Bowling | 5/10 |\n" +
        "| Economy | 7.39 |\n" +
        "| Average | 23.28 |\n" +
        "| 4-wicket hauls | 5 |\n" +
        "| 5-wicket hauls | 1 |\n\n" +
        "🎯 Bumrah is MI's all-time leading wicket-taker and the most feared death-overs bowler in IPL history.\n" +
        "His **5/10** vs RCB (2021) is one of the best IPL bowling figures ever."
      );
    }
    return (
      "🎯 **Jasprit Bumrah — Complete Career Overview**\n\n" +
      "**Born**: 6 Dec 1993, Ahmedabad | **Role**: Right-arm fast bowler\n\n" +
      "**🏏 International Stats:**\n" +
      "| Format | Matches | Wickets | Best | Avg | Economy |\n|---|---|---|---|---|---|\n" +
      "| Tests | 42 | 190 | 6/27 | 19.42 | 2.76 |\n" +
      "| ODIs | 89 | 149 | 6/19 | 24.31 | 4.64 |\n" +
      "| T20Is | 72 | 89 | 3/11 | 20.26 | 6.24 |\n\n" +
      "**🏟️ IPL (MI):** 140 matches • **170 wickets** • Avg 23.28 • Economy 7.39\n\n" +
      "**📌 Records:**\n" +
      "• **ICC Test Cricketer of the Year 2023**\n" +
      "• #1 ranked bowler in all 3 formats simultaneously\n" +
      "• Best yorker-specialist in world cricket\n" +
      "• 2024 T20 World Cup winner 🏆"
    );
  }

  // ─── Ravindra Jadeja ──────────────────────────────────────────────────────
  if (query.includes('jadeja') || query.includes('sir jadeja') || query.includes('jaddu')) {
    if (query.includes('ipl') || query.includes('csk')) {
      return (
        "📊 **Ravindra Jadeja — IPL Career Stats (CSK)**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 236 |\n" +
        "| Batting Runs | 2,706 |\n" +
        "| Batting Avg | 26.73 |\n" +
        "| Batting SR | 135.63 |\n" +
        "| Wickets | 157 |\n" +
        "| Bowling Avg | 29.23 |\n" +
        "| Economy | 7.59 |\n" +
        "| Catches | 68 |\n\n" +
        "🏆 CSK titles with Jadeja: 2010, 2011, 2018, 2021, 2023 (5 🥇)\n" +
        "• Famous for incredible run-outs and direct-hit throws\n" +
        "• 'Sir Jadeja' — named by fans for his elite all-round form"
      );
    }
    return (
      "⚡ **Ravindra Jadeja — Complete Career Overview**\n\n" +
      "**Born**: 6 Dec 1988, Rajkot | **Role**: Left-arm spin / Left-hand bat (all-rounder)\n\n" +
      "**🏏 International Stats:**\n" +
      "| Format | Mat | Runs | Wkts | Best | Bat Avg | Bowl Avg |\n|---|---|---|---|---|---|---|\n" +
      "| Tests | 77 | 3,278 | 316 | 7/42 | 35.65 | 24.54 |\n" +
      "| ODIs | 195 | 2,531 | 220 | 5/36 | 32.00 | 36.17 |\n" +
      "| T20Is | 74 | 515 | 54 | 3/15 | 19.07 | 25.53 |\n\n" +
      "**🏟️ IPL (CSK):** 236 matches • 2,706 runs • **157 wickets** • 68 catches\n\n" +
      "**📌 Records:**\n" +
      "• #1 ranked Test all-rounder (ICC)\n" +
      "• 300+ Test wickets + 3,000+ Test runs (elite all-round milestone)\n" +
      "• Best fielder in international cricket — fastest run-outs"
    );
  }

  // ─── Hardik Pandya ────────────────────────────────────────────────────────
  if (query.includes('hardik') || query.includes('pandya')) {
    if (query.includes('ipl')) {
      return (
        "📊 **Hardik Pandya — IPL Career Stats**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 148 |\n" +
        "| Batting Runs | 2,434 |\n" +
        "| Highest Score | 91* |\n" +
        "| Batting SR | 148.36 |\n" +
        "| Wickets | 70 |\n" +
        "| Economy | 9.06 |\n\n" +
        "🏆 **IPL Titles:** 2015, 2017, 2019, 2020 (with MI) + **2022 with GT as captain** 🥇\n\n" +
        "• He **founded and captained Gujarat Titans** to their maiden IPL title in 2022 in GT's debut season!\n" +
        "• Returned to MI as captain in 2024"
      );
    }
    return (
      "⚡ **Hardik Pandya — Complete Career Overview**\n\n" +
      "**Born**: 11 Oct 1993, Surat | **Role**: Right-arm fast-medium / Right-hand bat\n\n" +
      "**🏏 International Stats:**\n" +
      "| Format | Mat | Runs | HS | Wkts | Best |\n|---|---|---|---|---|---|\n" +
      "| Tests | 11 | 532 | 108 | 17 | 5/28 |\n" +
      "| ODIs | 73 | 1,386 | 92* | 74 | 5/33 |\n" +
      "| T20Is | 91 | 1,015 | 63 | 64 | 4/16 |\n\n" +
      "**🏟️ IPL:** 148 matches • 2,434 runs • 70 wickets • SR 148.36\n" +
      "• Led **Gujarat Titans** to IPL title in inaugural GT season (2022)\n\n" +
      "**🏆 2024 T20 World Cup winner** (critical all-round performances)"
    );
  }

  // ─── Suryakumar Yadav ─────────────────────────────────────────────────────
  if (query.includes('suryakumar') || query.includes('sky') || (query.includes('surya') && query.includes('kumar'))) {
    if (query.includes('ipl') || query.includes('mumbai')) {
      return (
        "📊 **Suryakumar Yadav — IPL Career Stats (MI)**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 183 |\n" +
        "| Innings | 178 |\n" +
        "| Total Runs | 4,614 |\n" +
        "| Highest Score | 103 |\n" +
        "| Centuries | 1 |\n" +
        "| Half-Centuries | 30 |\n" +
        "| Average | 31.17 |\n" +
        "| Strike Rate | 147.71 |\n\n" +
        "🔥 SKY is MI's batting cornerstone and one of the most innovative stroke-makers in modern IPL history."
      );
    }
    return (
      "🚀 **Suryakumar Yadav — Complete Career Overview**\n\n" +
      "**Born**: 22 Sep 1990, Mumbai | **Role**: Right-hand bat (360° batter)\n\n" +
      "**🏏 International Stats:**\n" +
      "| Format | Mat | Runs | HS | 100s | Avg | SR |\n|---|---|---|---|---|---|---|\n" +
      "| Tests | 9 | 456 | 68 | 0 | 26.82 | 83.07 |\n" +
      "| ODIs | 59 | 1,776 | 112* | 2 | 37.00 | 106.93 |\n" +
      "| T20Is | 75 | 2,757 | 117 | 4 | 45.95 | 170.29 |\n\n" +
      "**🏟️ IPL (MI):** 183 matches • 4,614 runs • Avg 31.17 • SR 147.71\n\n" +
      "**📌 Records:**\n" +
      "• **ICC #1 T20I batter** (held the ranking for 2+ years)\n" +
      "• Invented the 'ramp-over-fine-leg' and 'switch-hit-six' shots consistently\n" +
      "• SR of **170.29** in T20Is is among the highest in the world\n" +
      "• 2024 T20 World Cup — crucial catch in the final off the last over 🏆"
    );
  }

  // ─── KL Rahul ─────────────────────────────────────────────────────────────
  if (query.includes('kl rahul') || query.includes('k.l. rahul') || (query.includes('rahul') && !query.includes('dravid'))) {
    if (query.includes('ipl')) {
      return (
        "📊 **KL Rahul — IPL Career Stats**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 130 |\n" +
        "| Innings | 128 |\n" +
        "| Total Runs | 4,683 |\n" +
        "| Highest Score | 132* |\n" +
        "| Centuries | 5 |\n" +
        "| Half-Centuries | 37 |\n" +
        "| Average | 47.30 |\n" +
        "| Strike Rate | 136.11 |\n\n" +
        "🏆 **Orange Cap winner:** IPL 2020 (670 runs) 🧡\n" +
        "• Played for: RCB → KXIP (now PBKS, captain) → LSG (captain) → DC\n" +
        "• Most consistent IPL opener after Kohli and Warner"
      );
    }
    return (
      "🏏 **KL Rahul — Complete Career Overview**\n\n" +
      "**Born**: 18 Apr 1992, Mangaluru | **Role**: WK-Bat / Opener\n\n" +
      "**🏏 International Stats:**\n" +
      "| Format | Mat | Runs | HS | 100s | Avg | SR |\n|---|---|---|---|---|---|---|\n" +
      "| Tests | 51 | 2,981 | 199 | 7 | 34.66 | 52.86 |\n" +
      "| ODIs | 68 | 2,385 | 112* | 6 | 47.70 | 88.01 |\n" +
      "| T20Is | 72 | 2,265 | 110* | 2 | 38.03 | 141.23 |\n\n" +
      "**🏟️ IPL:** 130 matches • 4,683 runs • 5 centuries • Avg 47.30 • Orange Cap 2020 🧡"
    );
  }

  // ─── Shubman Gill ─────────────────────────────────────────────────────────
  if (query.includes('shubman') || query.includes('gill') || query.includes('prince of india')) {
    if (query.includes('ipl') || query.includes('gujarat') || query.includes('gt')) {
      return (
        "📊 **Shubman Gill — IPL Career Stats (GT)**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 87 |\n" +
        "| Innings | 86 |\n" +
        "| Total Runs | 3,399 |\n" +
        "| Highest Score | 129 |\n" +
        "| Centuries | 4 |\n" +
        "| Half-Centuries | 23 |\n" +
        "| Average | 42.49 |\n" +
        "| Strike Rate | 149.80 |\n\n" +
        "🏆 **IPL 2022 title with Gujarat Titans**\n" +
        "• **Orange Cap IPL 2023** — 890 runs in a season 🧡 (2nd highest in IPL history)\n" +
        "• Captained GT in 2025"
      );
    }
    return (
      "⭐ **Shubman Gill — Complete Career Overview**\n\n" +
      "**Born**: 8 Sep 1999, Punjab | **Role**: Right-hand bat / Opener\n\n" +
      "**🏏 International Stats:**\n" +
      "| Format | Mat | Runs | HS | 100s | Avg | SR |\n|---|---|---|---|---|---|---|\n" +
      "| Tests | 32 | 2,095 | 210 | 6 | 38.79 | 57.28 |\n" +
      "| ODIs | 46 | 2,376 | 208 | 7 | 62.52 | 99.25 |\n" +
      "| T20Is | 38 | 1,096 | 126* | 1 | 37.79 | 152.70 |\n\n" +
      "**🏟️ IPL (GT):** 87 matches • 3,399 runs • 4 centuries • Orange Cap 2023 🧡 (890 runs)\n\n" +
      "**📌 Rising Star Facts:**\n" +
      "• 208 in ODIs vs New Zealand (2023) — youngest Indian to hit a double century in ODIs\n" +
      "• IPL 2022 title winner with GT"
    );
  }

  // ─── Rishabh Pant ─────────────────────────────────────────────────────────
  if (query.includes('rishabh') || query.includes('pant') || query.includes('rp17')) {
    if (query.includes('ipl') || query.includes('dc') || query.includes('delhi')) {
      return (
        "📊 **Rishabh Pant — IPL Career Stats (DC/LSG)**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 115 |\n" +
        "| Innings | 109 |\n" +
        "| Total Runs | 3,284 |\n" +
        "| Highest Score | 128* |\n" +
        "| Centuries | 1 |\n" +
        "| Half-Centuries | 24 |\n" +
        "| Average | 35.69 |\n" +
        "| Strike Rate | 153.08 |\n" +
        "| Dismissals | 93 ct + 22 st |\n\n" +
        "🏆 **DC**: Played from 2016–2021, reached IPL Final in 2020\n" +
        "• Joined LSG (Lucknow) in 2025 via mega auction for record ₹27 crore"
      );
    }
    return (
      "🧤 **Rishabh Pant — Complete Career Overview**\n\n" +
      "**Born**: 4 Oct 1997, Roorkee | **Role**: WK-Bat / Left-hand bat\n\n" +
      "**🏏 International Stats:**\n" +
      "| Format | Mat | Runs | HS | 100s | Avg | SR |\n|---|---|---|---|---|---|---|\n" +
      "| Tests | 37 | 2,726 | 159* | 5 | 43.90 | 73.47 |\n" +
      "| ODIs | 30 | 865 | 125* | 1 | 33.27 | 101.64 |\n" +
      "| T20Is | 66 | 987 | 65* | 0 | 22.43 | 126.57 |\n\n" +
      "**🏟️ IPL (DC):** 115 matches • 3,284 runs • SR **153.08** • 115 dismissals\n\n" +
      "**📌 Key Facts:**\n" +
      "• Sold for **₹27 crore** at IPL 2025 Mega Auction (record for WKs)\n" +
      "• Miraculous comeback after serious car accident in Dec 2022\n" +
      "• Highest score by an Indian WK in Tests: 159* vs England"
    );
  }

  // ─── Ravichandran Ashwin ──────────────────────────────────────────────────
  if (query.includes('ashwin') || query.includes('r ashwin') || query.includes('ravi ashwin')) {
    if (query.includes('ipl')) {
      return (
        "📊 **Ravichandran Ashwin — IPL Career Stats**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 212 |\n" +
        "| Wickets | 180 |\n" +
        "| Best Bowling | 4/34 |\n" +
        "| Economy | 7.02 |\n" +
        "| Average | 26.71 |\n\n" +
        "Played for: CSK → Pune → KXIP (captain) → DC → CSK → RR\n" +
        "🧠 Known for his carrom ball, off-spin mastery, and surprise batting cameos in IPL."
      );
    }
    return (
      "🧠 **Ravichandran Ashwin — Complete Career Overview**\n\n" +
      "**Born**: 17 Sep 1986, Chennai | **Role**: Right-arm off-break / Right-hand bat | **Retd from Int'l**: Dec 2024\n\n" +
      "**🏏 International Stats:**\n" +
      "| Format | Mat | Wkts | Best | Avg | 5WI | Runs | 100s |\n|---|---|---|---|---|---|---|---|\n" +
      "| Tests | 106 | 537 | 7/59 | 24.00 | 37 | 3,503 | 6 |\n" +
      "| ODIs | 116 | 156 | 4/25 | 33.40 | 0 | 701 | 0 |\n" +
      "| T20Is | 65 | 72 | 4/8 | 22.77 | 0 | 184 | 0 |\n\n" +
      "**🏟️ IPL:** 212 matches • **180 wickets** • Econ 7.02\n\n" +
      "**📌 Records:**\n" +
      "• **2nd highest wicket-taker in Test history** for India (537 wickets)\n" +
      "• 37 five-wicket hauls in Tests\n" +
      "• ICC Test Cricketer of Year 2016\n" +
      "• Retired from international cricket in December 2024"
    );
  }

  // ─── Yuzvendra Chahal ─────────────────────────────────────────────────────
  if (query.includes('chahal') || query.includes('yuzvendra')) {
    if (query.includes('ipl')) {
      return (
        "📊 **Yuzvendra Chahal — IPL Career Stats**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 160 |\n" +
        "| Wickets | 205 |\n" +
        "| Best Bowling | 5/40 |\n" +
        "| Economy | 7.66 |\n" +
        "| Average | 23.28 |\n\n" +
        "🏆 **Purple Cap IPL 2022** — 27 wickets in a single season 💜\n" +
        "Played for: RCB (2014–21) → RR (2022–present)\n" +
        "• **IPL's highest wicket-taker** (205+ wickets)\n" +
        "• Master of googly and leg-spin variations"
      );
    }
    return (
      "🌀 **Yuzvendra Chahal** — India's premier leg-spinner\n\n" +
      "**Born**: 23 Jul 1990, Haryana | **Role**: Right-arm leg-break\n\n" +
      "| Format | Mat | Wkts | Best | Avg | Economy |\n|---|---|---|---|---|---|\n" +
      "| ODIs | 80 | 121 | 6/42 | 27.12 | 5.18 |\n" +
      "| T20Is | 80 | 96 | 6/25 | 23.41 | 7.63 |\n\n" +
      "**🏟️ IPL:** 160 matches • **205 wickets** • Purple Cap 2022 (27 wkts) 💜"
    );
  }

  // ─── AB de Villiers ───────────────────────────────────────────────────────
  if (query.includes('ab de villiers') || query.includes('abd') || query.includes('mr 360') || (query.includes('de villiers') && !query.includes('faf'))) {
    if (query.includes('ipl') || query.includes('rcb')) {
      return (
        "📊 **AB de Villiers — IPL Career Stats (RCB)**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 184 |\n" +
        "| Innings | 169 |\n" +
        "| Total Runs | 5,162 |\n" +
        "| Highest Score | 133* |\n" +
        "| Centuries | 3 |\n" +
        "| Half-Centuries | 40 |\n" +
        "| Average | 40.95 |\n" +
        "| Strike Rate | 158.32 |\n\n" +
        "❤️ ABD was RCB's heartbeat for 9 IPL seasons (2011–2021). His 158 SR is among the highest in IPL for consistent batters.\n" +
        "• **Retired from IPL** in September 2021 after RCB's emotional playoff exit."
      );
    }
    return (
      "🌟 **AB de Villiers — Mr. 360°**\n\n" +
      "**Born**: 17 Feb 1984, South Africa | **Role**: WK-Bat | **Retired**: 2018 (Int'l)\n\n" +
      "**🏏 International Stats:**\n" +
      "| Format | Mat | Runs | HS | 100s | Avg | SR |\n|---|---|---|---|---|---|---|\n" +
      "| Tests | 114 | 8,765 | 278* | 22 | 50.66 | 57.64 |\n" +
      "| ODIs | 228 | 9,577 | 176 | 25 | 53.50 | 101.19 |\n" +
      "| T20Is | 78 | 1,672 | 79* | 0 | 26.12 | 135.17 |\n\n" +
      "**🏟️ IPL (RCB):** 184 matches • 5,162 runs • SR **158.32**\n\n" +
      "**📌 Records:**\n" +
      "• Fastest ODI 50 (16 balls), 100 (31 balls), 150 (64 balls) — all world records\n" +
      "• Can bat/keep in virtually any position and play shots to all 360° of the field"
    );
  }

  // ─── Chris Gayle ──────────────────────────────────────────────────────────
  if (query.includes('gayle') || query.includes('universe boss') || query.includes('chris gayle')) {
    if (query.includes('ipl') || query.includes('rcb') || query.includes('kxip') || query.includes('pbks')) {
      return (
        "📊 **Chris Gayle — IPL Career Stats**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 142 |\n" +
        "| Innings | 132 |\n" +
        "| Total Runs | 4,965 |\n" +
        "| Highest Score | 175* |\n" +
        "| Centuries | 6 |\n" +
        "| Half-Centuries | 31 |\n" +
        "| Average | 39.72 |\n" +
        "| Strike Rate | 148.96 |\n" +
        "| Sixes | 357 |\n\n" +
        "🔥 **175*** vs Pune Warriors (2013) — All-time **highest IPL individual score** 🏆\n" +
        "• Played for: KKR → RCB → KXIP (Punjab)\n" +
        "• **357 sixes** — most in IPL history\n" +
        "• 6 IPL centuries — most by an overseas player"
      );
    }
    return (
      "💥 **Chris Gayle — Universe Boss**\n\n" +
      "**Born**: 21 Sep 1979, Jamaica | **Role**: Left-hand bat / Right-arm off-break\n\n" +
      "| Format | Mat | Runs | HS | 100s | Avg | SR |\n|---|---|---|---|---|---|---|\n" +
      "| Tests | 103 | 7,214 | 333 | 15 | 42.18 | 48.13 |\n" +
      "| ODIs | 301 | 10,480 | 215 | 25 | 37.97 | 85.86 |\n" +
      "| T20Is | 79 | 1,899 | 117 | 2 | 32.10 | 142.88 |\n\n" +
      "**🏟️ IPL:** 142 matches • 4,965 runs • 175* (highest IPL score) • **357 sixes** (most in IPL)\n\n" +
      "**🏆 Honours:** 2 ICC T20 World Cup wins with West Indies (2012, 2016)\n" +
      "• Highest Test score: **333** vs Sri Lanka (2005)"
    );
  }

  // ─── David Warner ─────────────────────────────────────────────────────────
  if (query.includes('warner') || query.includes('david warner') || query.includes('bull')) {
    if (query.includes('ipl') || query.includes('srh') || query.includes('dc') || query.includes('hyderabad')) {
      return (
        "📊 **David Warner — IPL Career Stats (SRH)**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 184 |\n" +
        "| Innings | 181 |\n" +
        "| Total Runs | 6,565 |\n" +
        "| Highest Score | 126 |\n" +
        "| Centuries | 4 |\n" +
        "| Half-Centuries | 57 |\n" +
        "| Average | 41.54 |\n" +
        "| Strike Rate | 140.27 |\n\n" +
        "🏆 **Orange Cap:** 2015 (562 runs), 2017 (641 runs) 🧡\n" +
        "🏆 **IPL 2016 Title with SRH**\n" +
        "• Led SRH as captain to their maiden IPL title in 2016\n" +
        "• Played for SRH (2014-2021), DC (2023), SRH (2024)"
      );
    }
    return (
      "🦁 **David Warner — Complete Career Overview**\n\n" +
      "**Born**: 27 Oct 1986, Australia | **Role**: Left-hand bat / Opener\n\n" +
      "| Format | Mat | Runs | HS | 100s | Avg | SR |\n|---|---|---|---|---|---|---|\n" +
      "| Tests | 112 | 8,695 | 335* | 26 | 44.59 | 72.74 |\n" +
      "| ODIs | 161 | 6,932 | 179 | 22 | 45.30 | 96.19 |\n" +
      "| T20Is | 110 | 3,277 | 100* | 1 | 33.44 | 142.95 |\n\n" +
      "**🏟️ IPL (SRH/DC):** 184 matches • 6,565 runs • 4 centuries • 2 Orange Caps 🧡\n" +
      "**🏆 2016 IPL** title as SRH captain • **2015 World Cup winner** 🏆"
    );
  }

  // ─── Yashasvi Jaiswal ─────────────────────────────────────────────────────
  if (query.includes('jaiswal') || query.includes('yashasvi')) {
    if (query.includes('ipl') || query.includes('rajasthan') || query.includes('rr')) {
      return (
        "📊 **Yashasvi Jaiswal — IPL Career Stats (RR)**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 47 |\n" +
        "| Innings | 47 |\n" +
        "| Total Runs | 1,879 |\n" +
        "| Highest Score | 124 |\n" +
        "| Centuries | 2 |\n" +
        "| Half-Centuries | 15 |\n" +
        "| Average | 43.69 |\n" +
        "| Strike Rate | 163.89 |\n\n" +
        "🏆 **Orange Cap IPL 2024** — 435 runs with SR 180.83 🧡\n" +
        "• Among the fastest-rising openers in IPL history"
      );
    }
    return (
      "⭐ **Yashasvi Jaiswal** — India's brightest batting prospect\n\n" +
      "**Born**: 28 Dec 2001, Uttar Pradesh | **Role**: Left-hand bat / Opener\n\n" +
      "| Format | Mat | Runs | HS | 100s | Avg | SR |\n|---|---|---|---|---|---|---|\n" +
      "| Tests | 18 | 1,634 | 214* | 4 | 54.47 | 59.14 |\n" +
      "| ODIs | 9 | 404 | 104 | 1 | 57.71 | 101.76 |\n" +
      "| T20Is | 21 | 651 | 100* | 1 | 36.17 | 163.31 |\n\n" +
      "**🏟️ IPL (RR):** 47 matches • 1,879 runs • **Orange Cap 2024** 🧡\n\n" +
      "**📌 Records:**\n" +
      "• Scored **214*** in only his 6th Test match vs England (2024)\n" +
      "• Became youngest Indian to score back-to-back Test centuries in England"
    );
  }

  // ─── Shreyas Iyer ─────────────────────────────────────────────────────────
  if (query.includes('shreyas') || query.includes('iyer')) {
    if (query.includes('ipl') || query.includes('kkr') || query.includes('kolkata')) {
      return (
        "📊 **Shreyas Iyer — IPL Career Stats (DC/KKR)**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 115 |\n" +
        "| Innings | 112 |\n" +
        "| Total Runs | 3,519 |\n" +
        "| Highest Score | 96 |\n" +
        "| Half-Centuries | 27 |\n" +
        "| Average | 34.50 |\n" +
        "| Strike Rate | 130.90 |\n\n" +
        "🏆 **Led KKR to IPL 2024 title!** 🥇 — KKR's first title since 2014\n" +
        "• Played for DC as captain (2019–21) → KKR (2022–present)\n" +
        "• Known for his elegant pull shots and calm captaincy under pressure"
      );
    }
    return (
      "🏏 **Shreyas Iyer**\n\n" +
      "**Born**: 6 Dec 1994, Mumbai | **Role**: Right-hand bat / Mid-order\n\n" +
      "| Format | Mat | Runs | HS | 100s | Avg | SR |\n|---|---|---|---|---|---|---|\n" +
      "| Tests | 24 | 1,616 | 105 | 3 | 39.41 | 58.01 |\n" +
      "| ODIs | 65 | 2,162 | 105 | 3 | 40.79 | 97.11 |\n" +
      "| T20Is | 67 | 1,375 | 74 | 0 | 27.50 | 134.28 |\n\n" +
      "**🏟️ IPL (KKR):** 115 matches • 3,519 runs • **IPL 2024 title as KKR captain** 🏆"
    );
  }

  // ─── Mohammed Shami ────────────────────────────────────────────────────────
  if (query.includes('shami') || query.includes('mohammed shami')) {
    if (query.includes('ipl') || query.includes('gt') || query.includes('gujarat')) {
      return (
        "📊 **Mohammed Shami — IPL Career Stats (GT)**\n\n" +
        "| Stat | Value |\n|---|---|\n" +
        "| Matches | 109 |\n" +
        "| Wickets | 130 |\n" +
        "| Best Bowling | 5/18 |\n" +
        "| Economy | 8.50 |\n" +
        "| Average | 24.40 |\n\n" +
        "🏆 **2022 IPL title with Gujarat Titans**\n" +
        "• Played for: KKR → DD → KXIP → SRH → GT"
      );
    }
    return (
      "🎯 **Mohammed Shami**\n\n" +
      "**Born**: 3 Sep 1990, UP | **Role**: Right-arm fast-medium\n\n" +
      "| Format | Mat | Wkts | Best | Avg | Economy |\n|---|---|---|---|---|---|\n" +
      "| Tests | 64 | 229 | 7/26 | 27.43 | 3.27 |\n" +
      "| ODIs | 101 | 195 | 5/18 | 27.36 | 5.50 |\n" +
      "| T20Is | 24 | 24 | 3/15 | 34.50 | 8.92 |\n\n" +
      "**📌 Records:**\n" +
      "• **2023 ODI World Cup** — 24 wickets in 7 matches (most in a single WC edition) 🔥\n" +
      "• Fastest Indian to 100 ODI wickets\n" +
      "• Lethal swinging yorkers and reverse swing specialist"
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  IPL TEAMS — DETAILED INFO
  // ═══════════════════════════════════════════════════════════════════════════

  if (query.includes('ipl') && (query.includes('winner') || query.includes('champion') || query.includes('titles') || query.includes('trophy'))) {
    return (
      "🏆 **IPL All-Time Champions List**\n\n" +
      "| Year | Champion | Runner-Up | Match Venue |\n|---|---|---|---|\n" +
      "| 2008 | Rajasthan Royals | CSK | DY Patil |\n" +
      "| 2009 | Deccan Chargers | RCB | Wanderers |\n" +
      "| 2010 | CSK | MI | DY Patil |\n" +
      "| 2011 | CSK | RCB | MA Chidambaram |\n" +
      "| 2012 | KKR | CSK | MA Chidambaram |\n" +
      "| 2013 | MI | CSK | Eden Gardens |\n" +
      "| 2014 | KKR | KXIP | M. Chinnaswamy |\n" +
      "| 2015 | MI | CSK | Eden Gardens |\n" +
      "| 2016 | SRH | RCB | Chinnaswamy |\n" +
      "| 2017 | MI | RPS | Rajiv Gandhi |\n" +
      "| 2018 | CSK | SRH | Wankhede |\n" +
      "| 2019 | MI | CSK | Rajiv Gandhi |\n" +
      "| 2020 | MI | DC | Dubai |\n" +
      "| 2021 | CSK | KKR | Dubai |\n" +
      "| 2022 | GT | RR | Narendra Modi |\n" +
      "| 2023 | CSK | GT | Narendra Modi |\n" +
      "| 2024 | KKR | SRH | MA Chidambaram |\n\n" +
      "🥇 **Most IPL Titles:** CSK & MI — **5 each**\n" +
      "KKR — 3 | GT — 1 | SRH — 1 | RR — 1 | Deccan Chargers — 1"
    );
  }

  if (query.includes('csk') || query.includes('super kings') || query.includes('chennai')) {
    return (
      "💛 **Chennai Super Kings (CSK)**\n\n" +
      "**Home**: MA Chidambaram Stadium, Chennai\n" +
      "**Captain**: MS Dhoni (playing) / Ruturaj Gaikwad (captain from 2024)\n" +
      "**Coach**: Stephen Fleming\n\n" +
      "🏆 **IPL Titles:** 2010, 2011, 2018, 2021, 2023 (**5 titles** 🥇)\n\n" +
      "**📊 Key Players:**\n" +
      "• MS Dhoni (WK-Bat) • Ruturaj Gaikwad (Bat) • Ravindra Jadeja (All-rounder)\n" +
      "• Devon Conway (Bat) • Moeen Ali (All-rounder) • Matheesha Pathirana (Pace)\n\n" +
      "**🌟 CSK Facts:**\n" +
      "• Qualified for playoffs in **12 of 14 seasons**\n" +
      "• Most consistent IPL franchise\n" +
      "• Only team suspended for 2 years (2016–17) but came back and won in 2018!\n" +
      "• Famous for their 'Dad's Army' approach — preferring experienced players"
    );
  }

  if (query.includes(' mi ') || query.includes('mumbai indians') || (query.includes('mumbai') && query.includes('ipl'))) {
    return (
      "💙 **Mumbai Indians (MI)**\n\n" +
      "**Home**: Wankhede Stadium, Mumbai\n" +
      "**Owner**: Reliance Industries (Ambani family)\n" +
      "**Coach**: Mark Boucher\n\n" +
      "🏆 **IPL Titles:** 2013, 2015, 2017, 2019, 2020 (**5 titles** 🥇)\n\n" +
      "**📊 Key Players:**\n" +
      "• Rohit Sharma • Suryakumar Yadav • Jasprit Bumrah • Hardik Pandya\n" +
      "• Tilak Varma • Trent Boult • Ishan Kishan\n\n" +
      "**🌟 MI Facts:**\n" +
      "• All 5 titles won in alternate years (2013, 15, 17, 19, 20)\n" +
      "• Known for their elite scouting and data-driven approach\n" +
      "• Discovered Bumrah, SKY, Pandya through their academy system"
    );
  }

  if (query.includes('rcb') || query.includes('royal challengers') || (query.includes('bangalore') && query.includes('ipl'))) {
    return (
      "❤️ **Royal Challengers Bengaluru (RCB)**\n\n" +
      "**Home**: M. Chinnaswamy Stadium, Bengaluru\n" +
      "**Captain**: Rajat Patidar (2025)\n" +
      "**Coach**: Andy Flower\n\n" +
      "🏆 **IPL Titles:** 1 (2024 🥇) — *Their maiden and long-awaited title!*\n\n" +
      "**📊 Key Players:**\n" +
      "• Virat Kohli • Rajat Patidar • Glenn Maxwell • Phil Salt • Mohammed Siraj\n\n" +
      "**🌟 RCB Facts:**\n" +
      "• Runners-up: 2009, 2011, 2016 (three times!)\n" +
      "• Kohli's side, famous for explosive batting lineups\n" +
      "• 2024: Won their FIRST IPL title — *'Ee Sala Cup Namde'* came true! 🎉\n" +
      "• Famous rivalry with CSK — the 'El Clásico' of IPL"
    );
  }

  if (query.includes('kkr') || query.includes('kolkata knight')) {
    return (
      "🟣 **Kolkata Knight Riders (KKR)**\n\n" +
      "**Home**: Eden Gardens, Kolkata (world's 2nd largest cricket stadium)\n" +
      "**Owner**: Shah Rukh Khan, Juhi Chawla\n" +
      "**Captain**: Ajinkya Rahane (2025)\n\n" +
      "🏆 **IPL Titles:** 2012, 2014, 2024 (**3 titles**)\n\n" +
      "**📊 Key Players:**\n" +
      "• Shreyas Iyer • Andre Russell • Sunil Narine • Varun Chakravarthy • Phil Salt\n\n" +
      "**🌟 KKR Facts:**\n" +
      "• 2024 title — dominant season, won by 8 wickets in the final vs SRH!\n" +
      "• Famous for 'KKR purple' brand\n" +
      "• Andre Russell & Sunil Narine are all-time KKR icons"
    );
  }

  if (query.includes('srh') || query.includes('sunrisers') || query.includes('hyderabad') && query.includes('ipl')) {
    return (
      "🟠 **Sunrisers Hyderabad (SRH)**\n\n" +
      "**Home**: Rajiv Gandhi International Stadium, Hyderabad\n\n" +
      "🏆 **IPL Titles:** 2016\n\n" +
      "**📊 Key Players:**\n" +
      "• Pat Cummins (captain) • Travis Head • Abhishek Sharma • Heinrich Klaasen • Bhuvneshwar Kumar\n\n" +
      "**🌟 SRH Facts:**\n" +
      "• IPL 2024 **runners-up** — scored 3 x 200+ totals in a single season!\n" +
      "• Travis Head and Abhishek Sharma formed one of the most explosive opening pairs in IPL 2024\n" +
      "• Known for world-class bowling attacks (Warner, Bumrah era)"
    );
  }

  if (query.includes('rr') || query.includes('rajasthan royals') || (query.includes('rajasthan') && query.includes('ipl'))) {
    return (
      "🩷 **Rajasthan Royals (RR)**\n\n" +
      "**Home**: Sawai Mansingh Stadium, Jaipur\n\n" +
      "🏆 **IPL Titles:** 2008 (inaugural champions!)\n\n" +
      "**📊 Key Players:**\n" +
      "• Sanju Samson (captain/WK) • Yashasvi Jaiswal • Jos Buttler • Shimron Hetmyer • Yuzvendra Chahal\n\n" +
      "**🌟 RR Facts:**\n" +
      "• Won the very first IPL in 2008 under Shane Warne!\n" +
      "• IPL 2022 runners-up under Sanju Samson\n" +
      "• Known for unearthing young talent"
    );
  }

  if (query.includes(' gt ') || query.includes('gujarat titans') || (query.includes('gujarat') && query.includes('ipl'))) {
    return (
      "🔵 **Gujarat Titans (GT)**\n\n" +
      "**Home**: Narendra Modi Stadium, Ahmedabad (world's largest cricket stadium)\n\n" +
      "🏆 **IPL Titles:** 2022 (debut season!) 🥇\n\n" +
      "**📊 Key Players:**\n" +
      "• Shubman Gill (captain) • Mohammad Shami • Rashid Khan • Wriddhiman Saha\n\n" +
      "**🌟 GT Facts:**\n" +
      "• Won the IPL in their very first season (2022) under Hardik Pandya!\n" +
      "• IPL 2023 runners-up under Shubman Gill\n" +
      "• Narendra Modi Stadium hosts 132,000 spectators!"
    );
  }

  if (query.includes('lsg') || query.includes('lucknow') || query.includes('super giants')) {
    return (
      "🩵 **Lucknow Super Giants (LSG)**\n\n" +
      "**Home**: BRSABV Ekana Stadium, Lucknow\n\n" +
      "**📊 Key Players:**\n" +
      "• Rishabh Pant (captain, 2025) • Nicholas Pooran • Ravi Bishnoi • Mohsin Khan\n\n" +
      "**🌟 LSG Facts:**\n" +
      "• New franchise from 2022 (alongside GT)\n" +
      "• Reached playoffs in their first 2 seasons\n" +
      "• Signed Rishabh Pant for record ₹27 crore in 2025 mega auction"
    );
  }

  if (query.includes('pbks') || query.includes('punjab kings') || query.includes('kxip') || (query.includes('punjab') && query.includes('ipl'))) {
    return (
      "🔴 **Punjab Kings (PBKS / KXIP)**\n\n" +
      "**Home**: PCA Stadium, Mohali / Dharamsala\n\n" +
      "**📊 Key Players:**\n" +
      "• Shreyas Iyer (captain 2025) • Sam Curran • Shashank Singh • Arshdeep Singh\n\n" +
      "**🌟 PBKS Facts:**\n" +
      "• Never won an IPL title (closest: 2014 runner-up)\n" +
      "• Chris Gayle's most prolific IPL franchise — scored 2,018 runs here!\n" +
      "• Arshdeep Singh is their prized left-arm pacer"
    );
  }

  if (query.includes('dc') || (query.includes('delhi') && query.includes('ipl')) || query.includes('delhi capitals') || query.includes('delhi daredevils')) {
    return (
      "🔵 **Delhi Capitals (DC)**\n\n" +
      "**Home**: Arun Jaitley Stadium, Delhi / Kotla\n\n" +
      "**📊 Key Players:**\n" +
      "• Axar Patel (captain) • Jake Fraser-McGurk • KL Rahul • T Natarajan\n\n" +
      "**🌟 DC Facts:**\n" +
      "• IPL 2020 runners-up under Shreyas Iyer\n" +
      "• Rebranded from Delhi Daredevils to Delhi Capitals in 2019\n" +
      "• Never won IPL title — searching for their first 🏆"
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CRICKET RULES & FORMATS
  // ═══════════════════════════════════════════════════════════════════════════

  if (query.includes('lbw')) {
    return (
      "📋 **LBW (Leg Before Wicket) — Full Explanation**\n\n" +
      "LBW is one of the most technical dismissals. The umpire must check 5 criteria:\n\n" +
      "1. **Legality of delivery** — Must not be a no-ball\n" +
      "2. **Pitch of the ball** — Cannot pitch outside the leg stump\n" +
      "3. **Impact point** — Ball must hit the batsman in line between wicket and wicket, OR the batsman offered no stroke\n" +
      "4. **Going on to hit** — Ball trajectory must suggest it would have hit the stumps\n" +
      "5. **Bat contact** — Ball must not hit the bat before the pad\n\n" +
      "🔍 **DRS Impact on LBW:**\n" +
      "Teams can review an LBW decision using ball-tracking technology (Hawk-Eye). The ball is given the 'benefit of the doubt' if it only clips the stumps — it must hit at least half the stump to overturn."
    );
  }

  if (query.includes('drs') || query.includes('decision review') || query.includes('hawk-eye') || query.includes('hawkeye')) {
    return (
      "🔍 **DRS — Decision Review System**\n\n" +
      "The DRS allows players to challenge on-field umpire decisions using technology:\n\n" +
      "**Technologies Used:**\n" +
      "• **Hawk-Eye**: Ball-tracking for LBW predictions\n" +
      "• **Snickometer / Ultra-Edge**: Detects edges using sound and vibration\n" +
      "• **Hot Spot**: Infrared imaging to check bat/pad contact\n" +
      "• **Ball Tracking**: Tracks delivery speed and trajectory\n\n" +
      "**DRS Rules:**\n" +
      "• Each team gets **2 reviews per innings** in Tests, **1 per innings** in T20s/ODIs\n" +
      "• If review is **unsuccessful**, team loses a review\n" +
      "• **Umpire's call** zone: Decisions within the margin remain with the on-field umpire\n\n" +
      "💡 'Umpire's Call' means the on-field decision stands even after review if the ball only **clips** the stumps."
    );
  }

  if (query.includes('powerplay') || query.includes('power play')) {
    return (
      "⚡ **Powerplay Rules in Cricket**\n\n" +
      "**In T20 Cricket:**\n" +
      "• **Mandatory Powerplay** (overs 1–6): Max **2 fielders outside the 30-yard circle**\n" +
      "• Overs 7–20: Max **5 fielders outside** the 30-yard circle\n\n" +
      "**In ODI Cricket:**\n" +
      "• **PP1** (overs 1–10): Max 2 fielders outside the ring\n" +
      "• **PP2** (overs 11–40): Max 4 fielders outside\n" +
      "• **PP3** (overs 41–50): Max 5 fielders outside\n\n" +
      "💡 **Batting team can take a fielding PP** (overs 11–40): One additional fielder outside ring\n" +
      "💡 **Bowling team can take a bowling PP** (overs 11–40): Two fewer outside fielders\n\n" +
      "🎯 The powerplay is crucial because attacking batters can exploit the open field!"
    );
  }

  if (query.includes('duckworth') || query.includes('dl method') || query.includes('lewis')) {
    return (
      "📐 **Duckworth-Lewis-Stern (DLS) Method**\n\n" +
      "The DLS method is used to recalculate targets in **rain-affected matches**.\n\n" +
      "**How it works:**\n" +
      "• Each team has **2 resources**: Wickets remaining + Overs remaining\n" +
      "• When play is interrupted, both teams' remaining resources are recalculated\n" +
      "• The revised target is set so neither team is significantly advantaged\n\n" +
      "**Example:** If Team B's innings is reduced from 50 to 30 overs due to rain, DLS adjusts their target to reflect what Team A scored with *equivalent* resources, not simply 30/50 of the score.\n\n" +
      "📌 Named after **Frank Duckworth, Tony Lewis, and Steven Stern**. Used in all major ICC events since 1999."
    );
  }

  if (query.includes('no ball') || query.includes('no-ball')) {
    return (
      "🚫 **No-Ball in Cricket**\n\n" +
      "A no-ball is an illegal delivery and results in:\n" +
      "• **+1 extra run** to the batting side\n" +
      "• The **delivery must be re-bowled**\n" +
      "• **Batsman cannot be dismissed** off a no-ball (except: run out, obstructing field, handling ball)\n\n" +
      "**Causes of No-Ball:**\n" +
      "1. Bowler's front foot lands **beyond the popping crease**\n" +
      "2. Bowler's back foot touches/lands **outside the return crease**\n" +
      "3. Ball is **bowled above waist height** (full toss above waist)\n" +
      "4. Ball **bounces more than twice** before reaching the batsman\n" +
      "5. Fielders positioned **illegally** (e.g., more than 2 behind square on leg side)\n" +
      "6. Ball is **thrown** (not bowled)"
    );
  }

  if (query.includes('wide') || query.includes('wide ball')) {
    return (
      "📏 **Wide Ball in Cricket**\n\n" +
      "A wide is called when the ball passes the batsman too far outside their reach:\n\n" +
      "• **+1 extra run** to batting team\n" +
      "• **Extra delivery** added to the over\n" +
      "• **Batsman CANNOT be dismissed** off a wide (except stumped or run out)\n\n" +
      "**T20 vs Tests:**\n" +
      "• In **T20s**: Stricter wide calling — almost any ball outside off stump that doesn't swing back is called wide\n" +
      "• In **Tests & ODIs**: Wider latitude given — ball must be well outside the reach of a normal batting stance"
    );
  }

  if (query.includes('test') && (query.includes('format') || query.includes('cricket') || query.includes('match'))) {
    return (
      "🎩 **Test Cricket — The Purest Format**\n\n" +
      "**Duration:** Up to 5 days | **Innings:** 2 per team | **Ball:** Red (Dukes/Kookaburra/SG)\n\n" +
      "**Structure:**\n" +
      "• Each team bats twice (if needed)\n" +
      "• Max 90 overs per day, 5 sessions of 2 hours each\n" +
      "• Can end in **Win, Loss, Draw, or Tie**\n\n" +
      "**Key Tournaments:**\n" +
      "• **ICC World Test Championship (WTC):** 2-year cycle, culminating in a Final\n" +
      "• The **Ashes** (England vs Australia) — one of sport's greatest rivalries\n" +
      "• **Border-Gavaskar Trophy** (India vs Australia)\n\n" +
      "**🏆 WTC Finals:**\n" +
      "• 2021: New Zealand beat India\n" +
      "• 2023: Australia beat India\n" +
      "• 2025: South Africa vs Australia (Lord's)"
    );
  }

  if (query.includes('t20') || query.includes('twenty20')) {
    return (
      "⚡ **T20 Cricket — The Fastest Format**\n\n" +
      "**Duration:** ~3 hours | **Overs:** 20 per team | **Ball:** White\n\n" +
      "**Features:**\n" +
      "• Mandatory powerplay (6 overs)\n" +
      "• Free-hit after no-ball\n" +
      "• Super Over for ties\n" +
      "• 2 reviews per team (DRS)\n\n" +
      "**Major T20 Leagues:**\n" +
      "| League | Country | Teams |\n|---|---|---|\n" +
      "| IPL | India | 10 |\n" +
      "| BBL | Australia | 8 |\n" +
      "| PSL | Pakistan | 6 |\n" +
      "| SA20 | South Africa | 6 |\n" +
      "| CPL | Caribbean | 6 |\n" +
      "| ILT20 | UAE | 6 |\n\n" +
      "**🏆 ICC T20 World Cup Winners:**\n" +
      "• 2007: India • 2009: Pakistan • 2010: England • 2012: West Indies\n" +
      "• 2014: Sri Lanka • 2016: West Indies • 2021: Australia • 2022: England\n" +
      "• **2024: India** 🏆 (won in Barbados, unbeaten run)"
    );
  }

  if (query.includes('odi') || query.includes('one day')) {
    return (
      "🌍 **ODI Cricket — One Day Internationals**\n\n" +
      "**Duration:** ~8 hours | **Overs:** 50 per team | **Ball:** White (2 balls)\n\n" +
      "**🏆 ICC ODI World Cup Winners:**\n" +
      "| Year | Champion | Final Venue |\n|---|---|---|\n" +
      "| 1975 | West Indies | Lord's |\n" +
      "| 1979 | West Indies | Lord's |\n" +
      "| 1983 | India | Lord's |\n" +
      "| 1987 | Australia | Kolkata |\n" +
      "| 1992 | Pakistan | MCG |\n" +
      "| 1996 | Sri Lanka | Lahore |\n" +
      "| 1999 | Australia | Lord's |\n" +
      "| 2003 | Australia | Johannesburg |\n" +
      "| 2007 | Australia | Barbados |\n" +
      "| 2011 | India | Wankhede 🏆 |\n" +
      "| 2015 | Australia | MCG |\n" +
      "| 2019 | England | Lord's |\n" +
      "| 2023 | Australia | Ahmedabad |\n\n" +
      "**Australia** most successful — **6 World Cup titles** 🥇"
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  WORLD RECORDS
  // ═══════════════════════════════════════════════════════════════════════════

  if (query.includes('record') || query.includes('highest') || query.includes('most runs') || query.includes('most wickets') || query.includes('fastest')) {
    return (
      "🌍 **Cricket World Records**\n\n" +
      "**🏏 Batting Records:**\n" +
      "| Record | Player | Value |\n|---|---|---|\n" +
      "| Most int'l runs | Sachin Tendulkar | 34,357 |\n" +
      "| Most Test runs | Sachin Tendulkar | 15,921 |\n" +
      "| Most ODI runs | Sachin Tendulkar | 18,426 |\n" +
      "| Most T20I runs | Rohit Sharma | 4,231 |\n" +
      "| Highest Test score | Brian Lara | 400* |\n" +
      "| Highest ODI score | Rohit Sharma | 264 |\n" +
      "| Highest T20I score | Rohit Sharma | 118 |\n" +
      "| Most int'l 100s | Sachin Tendulkar | 100 |\n" +
      "| Highest IPL score | Chris Gayle | 175* |\n" +
      "| Most IPL runs | Virat Kohli | 8,004+ |\n\n" +
      "**🎯 Bowling Records:**\n" +
      "| Record | Player | Value |\n|---|---|---|\n" +
      "| Most Test wickets | Muttiah Muralitharan | 800 |\n" +
      "| Most ODI wickets | Muttiah Muralitharan | 534 |\n" +
      "| Most T20I wickets | Wanindu Hasaranga | 121 |\n" +
      "| Best Test figures | Jim Laker | 19/90 |\n" +
      "| Best ODI figures | Chaminda Vaas | 8/19 |\n" +
      "| Most IPL wickets | Yuzvendra Chahal | 205+ |\n\n" +
      "**⚡ Fastest Records:**\n" +
      "| Record | Player | Balls |\n|---|---|---|\n" +
      "| Fastest ODI 100 | AB de Villiers | 31 balls |\n" +
      "| Fastest T20I 100 | Rohit Sharma | 35 balls |\n" +
      "| Fastest Test 100 | Jack Hobbs / Gilbert Jessop | ~76 min |"
    );
  }

  // ─── Generic IPL questions ─────────────────────────────────────────────────
  if (query.includes('ipl') || query.includes('indian premier league')) {
    return (
      "🏟️ **Indian Premier League (IPL) — Quick Facts**\n\n" +
      "**Founded:** 2008 | **Format:** T20 | **Teams:** 10 | **BCCI**\n\n" +
      "**📊 All-Time IPL Batting Leaders:**\n" +
      "| Rank | Player | Runs |\n|---|---|---|\n" +
      "| 1 | Virat Kohli | 8,004 |\n" +
      "| 2 | Shikhar Dhawan | 6,769 |\n" +
      "| 3 | David Warner | 6,565 |\n" +
      "| 4 | Rohit Sharma | 6,628 |\n" +
      "| 5 | AB de Villiers | 5,162 |\n\n" +
      "**🎯 All-Time IPL Bowling Leaders:**\n" +
      "| Rank | Player | Wickets |\n|---|---|---|\n" +
      "| 1 | Yuzvendra Chahal | 205 |\n" +
      "| 2 | Dwayne Bravo | 183 |\n" +
      "| 3 | Lasith Malinga | 170 |\n" +
      "| 4 | Jasprit Bumrah | 170 |\n" +
      "| 5 | Amit Mishra | 166 |\n\n" +
      "Ask me about specific IPL teams or players for more details! 🏏"
    );
  }

  // ─── Cricket history ───────────────────────────────────────────────────────
  if (query.includes('history') || query.includes('origin') || query.includes('invented') || query.includes('when was cricket')) {
    return (
      "📜 **History of Cricket**\n\n" +
      "• **~1550s**: First evidence of cricket played in south-east England (sheep-grazing pastures)\n" +
      "• **1611**: First recorded adult cricket match\n" +
      "• **1744**: Laws of Cricket first codified\n" +
      "• **1787**: MCC (Marylebone Cricket Club) founded — the game's governing body for the Laws\n" +
      "• **1844**: First-ever international cricket match — **USA vs Canada** in New York!\n" +
      "• **1877**: First official Test match — England vs Australia in Melbourne\n" +
      "• **1909**: ICC (then Imperial Cricket Conference) formed\n" +
      "• **1971**: First One Day International — England vs Australia in Melbourne (rain-curtailed)\n" +
      "• **1975**: First Cricket World Cup (50 overs) — West Indies won\n" +
      "• **2003**: First official T20 match — England vs Australia at Southampton\n" +
      "• **2008**: IPL launched — revolutionized T20 franchise cricket globally"
    );
  }

  // ─── Dismissal types ──────────────────────────────────────────────────────
  if (
    (query.includes('out') && !query.includes('country') && !query.includes('without')) ||
    query.includes('dismiss') ||
    (query.includes('wicket') && (query.includes('type') || query.includes('ways') || query.includes('how')))
  ) {
    return (
      "🏏 **10 Ways to Get Out in Cricket**\n\n" +
      "1. **Bowled** — Ball hits the stumps directly\n" +
      "2. **Caught** — Fielder catches the ball on the full before it bounces\n" +
      "3. **LBW** — Ball hits pad/body in line with stumps (would have hit)\n" +
      "4. **Run Out** — Fielder breaks stumps while batter is out of crease\n" +
      "5. **Stumped** — WK breaks stumps when batter steps out of crease\n" +
      "6. **Hit Wicket** — Batter accidentally knocks stumps with bat/body\n" +
      "7. **Handled the Ball** *(now part of 'Obstructing the Field')*\n" +
      "8. **Obstructing the Field** — Intentionally blocks fielder\n" +
      "9. **Hit the Ball Twice** — Deliberately striking the ball again\n" +
      "10. **Timed Out** — New batter takes >3 minutes to face next ball\n\n" +
      "🔥 **Rarest dismissals:** Timed Out, Hit Ball Twice, Handled the Ball"
    );
  }

  // ─── Cricket pitch types ──────────────────────────────────────────────────
  if (query.includes('pitch') && (query.includes('type') || query.includes('kind') || query.includes('condition') || query.includes('green') || query.includes('dusty') || query.includes('flat'))) {
    return (
      "🌱 **Types of Cricket Pitches**\n\n" +
      "| Type | Characteristics | Favors |\n|---|---|---|\n" +
      "| **Green Pitch** | Thick grass cover, moist surface | Pace bowlers (swing & seam) |\n" +
      "| **Dusty/Dry Pitch** | Cracks, low grass, turns sharply | Spin bowlers |\n" +
      "| **Flat Pitch** | Hard, even surface, minimal movement | Batsmen |\n" +
      "| **Damp Pitch** | Moisture below surface, uneven bounce | Pace (early), Spin (later) |\n" +
      "| **Dead Pitch** | Very flat, no seam or spin movement | Batsmen (high-scoring) |\n\n" +
      "**🌍 Famous Pitch Characteristics by Country:**\n" +
      "• **England (Lord's/Edgbaston)**: Green, swing-friendly ⛅\n" +
      "• **India (Chepauk/Ahmedabad)**: Dry, dusty, spin-friendly 🔥\n" +
      "• **Australia (WACA/Gabba)**: Bouncy, hard, fast-paced 🦘\n" +
      "• **West Indies**: Flat, true bounce, pace-friendly 🌴"
    );
  }

  // ─── Catch-all fallback ────────────────────────────────────────────────────
  const fallbacks = [
    "🏏 **Great question!** I'm CreaseChat — your cricket specialist. Could you be more specific? Ask me about:\n• **Player stats**: 'Virat Kohli IPL stats', 'Rohit Sharma ODI stats'\n• **IPL teams**: 'Tell me about CSK', 'RCB history'\n• **Rules**: 'Explain LBW', 'What is DRS?', 'Powerplay rules'\n• **Records**: 'Most IPL centuries', 'Fastest ODI 100'\n• **Tournaments**: 'IPL winners list', 'T20 World Cup history'",
    "🎯 **Almost on target!** I have detailed knowledge of:\n• 20+ player profiles with full IPL & international stats\n• All 10 IPL franchises with history and key players\n• Complete cricket rules and laws\n• ICC tournaments and world records\n\nWhat cricket topic would you like to explore? 🏟️",
    "⚡ **Looking for cricket intel?** Try asking:\n• *'Tell me about Suryakumar Yadav'*\n• *'What is the DLS method?'*\n• *'IPL 2024 winner'*\n• *'Sachin Tendulkar records'*\n• *'Explain powerplay rules'*",
    "🏆 **Did you know?** The longest-ever IPL auction bid war was for Sam Curran at IPL 2023 — Punjab Kings paid ₹18.50 crore! Meanwhile, Rishabh Pant broke that record at IPL 2025 for ₹27 crore. Ask me anything about cricket! 🏏",
  ];

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
