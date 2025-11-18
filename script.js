// --------- STATE & CONSTANTS ---------

const STORAGE_KEY = "shiftTimeBakeryState_v3";

const DEFAULT_STATE = {
  settings: {
    tone: "soft",
    animations: true,
    waterGoal: 4
  },
  shift: {
    start: "09:00",
    end: "17:00",
    reward: ""
  },
  water: {
    date: null,
    count: 0,
    lastSipTs: null
  },
  slacking: {
    breaks: []
  },
  ui: {
    sortMode: "short",
    mood: "ok",
    cooked: false
  }
};

let state = JSON.parse(JSON.stringify(DEFAULT_STATE));

const QUOTES = {
  soft: [
    "Being autistic at work is hard mode. You’re doing more than enough just by existing here.",
    "You are not your productivity. Surviving this shift is already a lot.",
    "You’re not behind in life. You’re just tired and doing your best in a loud world.",
    "It’s okay if your brain wandered today. That’s not failure, that’s coping."
  ],
  dark: [
    "You didn’t choose the grindset. The grindset chose you. You’re allowed to opt out mentally.",
    "Late stage capitalism speedrun: survive today, complain about it later online.",
    "Your brain is a premium limited-edition item. This job is on a free trial.",
    "They’re paying for your time, not your soul. Keep the soul."
  ],
  blunt: [
    "You are not the problem. The environment is not built for your nervous system.",
    "You’re not lazy. You’re overloaded. There’s a difference.",
    "Masking for 8 hours is a full-time job on top of your full-time job.",
    "You are allowed to want more than this. That doesn’t make you ungrateful."
  ]
};

const TIPS = [
  "Micro-break: stare at something at least 5 meters away for 20 seconds. Eyes and brain both reset.",
  "Write down one thing that’s bothering you about work. You don’t have to fix it, just park it.",
  "Change your posture for 30 seconds: roll your shoulders, unclench your jaw, wiggle your toes.",
  "If a task feels impossible, break it into the smallest step you can think of and only commit to that.",
  "Lower your screen brightness a little if you can. Your nervous system will say thank you.",
  "Make a tiny plan for after work: one small nice thing. Your brain likes having something to orbit.",
  "If masking is heavy, reduce it by just 5% for the next 10 minutes. You don’t have to be perfect."
];

const MOOD_MESSAGES = {
  ok: "Nice. Use some of that energy to be kind to Future-You, not just the job.",
  tired: "You’re allowed to coast. 70% effort is still effort.",
  cooked: "Cooked mode: from here on, survival > performance."
};

const REMINDERS = [
  "You are not a machine. You are a person doing their best in weird circumstances.",
  "There is a version of your life after this job. You’re allowed to walk toward it slowly.",
  "Doing less than your theoretical maximum is still valid. You’re not a productivity app.",
  "Your worth is not measured in emails answered or tasks completed."
];

const RANDOM_TOASTS = [
  { icon: "💧", text: "Water reminder: take a sip." },
  { icon: "👁️", text: "Blink slowly and give your eyes a soft focus break." },
  { icon: "🤸", text: "Micro stretch? Shrug, roll your shoulders, wiggle your toes." },
  { icon: "🪑", text: "Sit/stand shuffle if you can. Change the posture, change the vibe." },
  { icon: "💪", text: "You can do it! You’ve survived every previous workday." },
  { icon: "🌤️", text: "This is not forever. Clock time will keep moving even if your brain won’t." }
];

const TOAST_DURATION = 2200;
const RANDOM_TOAST_INTERVAL = 90000;
const RANDOM_TOAST_KICKOFF = 6000;

const UNITS = [
  { label: "Lo-fi tracks (3 min)", minutes: 3 },
  { label: "Tea distractions (5 min)", minutes: 5 },
  { label: "Window-staring loops (90 sec)", minutes: 1.5 },
  { label: "Tiny brain breaks (30 sec)", minutes: 0.5 },
  { label: "Imaginary bakery doodles (7 min)", minutes: 7 },
  { label: "Scrolling sessions (2 min)", minutes: 2 }
];

const DEFAULT_LOCATION = { lat: 59.3293, lon: 18.0686 };
const WEATHER_CODE_EMOJI = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌧️",
  56: "🌧️",
  57: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  66: "🌧️",
  67: "🌧️",
  71: "🌨️",
  73: "🌨️",
  75: "❄️",
  77: "🌨️",
  80: "🌦️",
  81: "🌧️",
  82: "⛈️",
  85: "❄️",
  86: "❄️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️"
};

const WEATHER_CODE_TEXT = {
  0: "clear skies",
  1: "mostly clear",
  2: "partly cloudy",
  3: "cloud blanket",
  45: "foggy vibes",
  48: "foggy vibes",
  51: "light drizzle",
  53: "gentle drizzle",
  55: "steady rain",
  56: "icy drizzle",
  57: "icy drizzle",
  61: "light rain",
  63: "rain showers",
  65: "heavy rain",
  66: "freezing rain",
  67: "freezing rain",
  71: "light snow",
  73: "snow",
  75: "heavy snow",
  77: "snow grains",
  80: "showers",
  81: "showers",
  82: "stormy showers",
  85: "snow bursts",
  86: "snow bursts",
  95: "thunderstorm",
  96: "thunderstorm",
  99: "storm drama"
};

let quoteIndex = 0;
let tipIndex = 0;
let reminderIndex = 0;
let summaryLast = "";
let weatherState = {
  emoji: "--",
  summary: "Peeking outside…",
  today: null,
  tomorrow: null
};
let randomToastTimerId = null;
let randomToastKickoffId = null;
const milestoneFlags = {
  halfway: false,
  finalHour: false,
  breakSoonKey: null
};

// --------- UTIL ---------

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

function formatHM(mins) {
  if (mins == null) return "--";
  const sign = mins < 0 ? "-" : "";
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return sign + m + " min";
  return sign + h + "h " + m + "m";
}

function formatHMS(seconds) {
  if (seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function minutesToTimeString(mins) {
  if (mins == null) return "--:--";
  const wrapped = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDisplayTimeFromMinutes(mins) {
  if (mins == null) return "--:--";
  const wrapped = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
  let h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function formatTimeForDisplay(timeStr) {
  const mins = parseTimeToMinutes(timeStr);
  if (mins == null) return "--:--";
  return formatDisplayTimeFromMinutes(mins);
}

function copingApproxText(mins, cooked) {
  if (mins <= 0) return cooked ? "Clock says done. Brain can leave the building now." : "You’re done. Mentally at least.";

  if (cooked) {
    // extra soft for cooked mode
    if (mins <= 30) return "Cooked mode: just ride out these last few minutes on autopilot.";
    if (mins <= 60) return "Cooked mode: treat this as under an hour of background noise.";
    return "Cooked mode: you’ve already done the important part. Now you’re waiting for the clock to catch up.";
  }

  if (mins < 15) return "Feels like: basically no time at all.";
  if (mins < 30) return "Feels like: less than half an episode.";
  if (mins < 60) return "Feels like: under an hour.";
  if (mins < 90) return "Feels like: a bit more than an hour.";
  if (mins < 180) return "Feels like: a couple of hours-ish.";
  if (mins < 240) return "Feels like: a few hours, but you’ve eaten a chunk of it already.";
  return "Feels like: a handful of hours. Not forever, even if it’s annoying.";
}

function phaseFromPct(pct) {
  if (pct <= 0) return "";
  if (pct < 25) return "You showed up. Hardest part is already done.";
  if (pct < 50) return "You cleared the intro. You’re in the middle chunk now.";
  if (pct < 75) return "You’ve passed halfway. You’re closer to home than to morning.";
  if (pct < 90) return "Last stretch. This is cleanup, not heavy lifting.";
  if (pct < 100) return "Final minutes. You’re basically a ghost in the system.";
  return "Shift complete. Everything else is voluntary suffering.";
}

function todayString() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function resetMilestones() {
  milestoneFlags.halfway = false;
  milestoneFlags.finalHour = false;
  milestoneFlags.breakSoonKey = null;
}

function showToast(message, icon = "✨") {
  const stack = document.getElementById("toast-stack");
  if (!stack) return;
  if (stack.childElementCount >= 3) {
    stack.removeChild(stack.firstElementChild);
  }
  const toast = document.createElement("div");
  toast.className = "toast";
  const text = document.createElement("div");
  text.className = "toast-text";
  const iconSpan = document.createElement("span");
  iconSpan.className = "toast-icon";
  iconSpan.textContent = icon;
  const msgSpan = document.createElement("span");
  msgSpan.textContent = message;
  text.appendChild(iconSpan);
  text.appendChild(msgSpan);
  const progress = document.createElement("div");
  progress.className = "toast-progress";
  progress.style.width = "100%";
  toast.appendChild(text);
  toast.appendChild(progress);
  stack.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add("visible");
    requestAnimationFrame(() => {
      progress.style.width = "0%";
    });
  });
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 350);
  }, TOAST_DURATION);
}

function maybeShowRandomToast() {
  if (typeof document.hidden !== "undefined" && document.hidden) return;
  if (!RANDOM_TOASTS.length) return;
  const note = RANDOM_TOASTS[Math.floor(Math.random() * RANDOM_TOASTS.length)];
  showToast(note.text, note.icon);
}

function startRandomToasts() {
  if (randomToastTimerId) clearInterval(randomToastTimerId);
  if (randomToastKickoffId) clearTimeout(randomToastKickoffId);
  randomToastKickoffId = setTimeout(() => {
    maybeShowRandomToast();
  }, RANDOM_TOAST_KICKOFF);
  randomToastTimerId = setInterval(() => {
    maybeShowRandomToast();
  }, RANDOM_TOAST_INTERVAL);
}

function handleMilestones(info, nextBreak) {
  if (!info || !info.valid) return;
  if (info.pct >= 50 && !milestoneFlags.halfway) {
    showToast("Halfway milestone reached!", "🧭");
    milestoneFlags.halfway = true;
  }
  if (info.remaining <= 60 && info.remaining > 0 && !milestoneFlags.finalHour) {
    showToast("Final hour of suffering begins.", "🔥");
    milestoneFlags.finalHour = true;
  }
  if (nextBreak && nextBreak.diff <= 15) {
    const key = nextBreak.id || `${nextBreak.label}-${nextBreak.time}`;
    if (milestoneFlags.breakSoonKey !== key) {
      showToast("Your tea break is soon!", nextBreak.icon || "☕");
      milestoneFlags.breakSoonKey = key;
    }
  } else if (!nextBreak || nextBreak.diff > 25) {
    milestoneFlags.breakSoonKey = null;
  }
}

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function calcWaterGoal(totalMinutes) {
  const hours = totalMinutes / 60;
  if (hours <= 4) return 3;
  if (hours <= 6) return 4;
  if (hours <= 8) return 5;
  return 6;
}

// --------- STORAGE ---------

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state = { ...state, ...parsed };
  } catch (e) {
    console.warn("Failed to load saved state", e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // ignore
  }
}

// --------- SHIFT INFO ---------

function computeShiftInfo() {
  const startStr = state.shift.start;
  const endStr = state.shift.end;

  const startM = parseTimeToMinutes(startStr);
  const endRaw = parseTimeToMinutes(endStr);

  if (startM == null || endRaw == null) {
    return { valid: false, error: "Please set both shift start and end times." };
  }

  let endM = endRaw;
  if (endM <= startM) {
    endM += 24 * 60; // overnight
  }
  const total = endM - startM;
  if (total <= 0) {
    return {
      valid: false,
      error: "Shift length looks like 0. Manifesting that for you, but cannot calculate it."
    };
  }

  const nowRaw = getCurrentMinutes();
  let nowM = nowRaw;
  if (nowM < startM && endM > 24 * 60) {
    nowM += 24 * 60;
  }

  const elapsed = clamp(nowM - startM, 0, total);
  const remaining = clamp(total - elapsed, 0, total);
  const pct = total === 0 ? 0 : (elapsed / total) * 100;

  // auto water goal derived from shift
  const newGoal = calcWaterGoal(total);
  if (newGoal !== state.settings.waterGoal) {
    state.settings.waterGoal = newGoal;
    saveState();
  }

  return {
    valid: true,
    startM,
    endM,
    total,
    elapsed,
    remaining,
    pct
  };
}

// --------- COMPARISONS ---------

function buildComparisons(total, remaining) {
  const listEl = document.getElementById("comparison-list");
  listEl.innerHTML = "";
  if (total <= 0 || remaining <= 0) {
    return;
  }

  const ratio = remaining / total;
  const lines = [];

  function unitText(label, minutesPer) {
    let count = Math.floor(remaining / minutesPer);
    if (count < 1) count = 1;
    return `${count} ${label}${count === 1 ? "" : "s"}`;
  }

  if (ratio > 0.6) {
    // early shift: chunky cozy stuff
    lines.push(
      "If this were a bakery shift, that’s about " + unitText("cinnamon roll batch", 90) + "."
    );
    lines.push(
      "In art time, that’s roughly " + unitText("long drawing session", 40) + "."
    );
    lines.push(
      "In playlist time, that’s like " + unitText("full cozy playlist", 45) + "."
    );
  } else if (ratio > 0.3) {
    // middle chunk
    lines.push(
      "In anime units, that’s about " + unitText("episode", 24) + "."
    );
    lines.push(
      "That’s like " + unitText("‘I’ll just scroll a bit’ segment", 12) + "."
    );
    lines.push(
      "In bus rides, that’s around " + unitText("short commute", 20) + "."
    );
  } else {
    // last part: tiny, “you’re almost out”
    lines.push(
      "Your shift ends in basically " + unitText("Love, Death & Robots episode", 15) + "."
    );
    lines.push(
      "Or like " + unitText("Starbucks run", 12) + "."
    );
    lines.push(
      "Or just " + unitText("bathroom scroll break", 5) + "."
    );
  }

  lines.forEach((line) => {
    const div = document.createElement("div");
    div.textContent = "• " + line;
    listEl.appendChild(div);
  });
}

// --------- WATER HELPERS ---------

function ensureWaterDate() {
  const today = todayString();
  if (state.water.date !== today) {
    state.water.date = today;
    state.water.count = 0;
    state.water.lastSipTs = null;
  }
}

function minsSince(ts) {
  if (!ts) return null;
  const diffMs = Date.now() - ts;
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / 60000);
}

// --------- WEATHER ---------

function weatherCodeToEmoji(code) {
  return WEATHER_CODE_EMOJI[code] || "🌡️";
}

function weatherCodeToText(code) {
  return WEATHER_CODE_TEXT[code] || "weather doing its thing";
}

function updateWeatherUI() {
  const emojiEl = document.getElementById("weather-emoji");
  if (emojiEl) {
    emojiEl.textContent = weatherState.emoji || "--";
    emojiEl.title = weatherState.summary || "Weather loading";
  }

  const summaryEl = document.getElementById("weather-summary");
  if (summaryEl) summaryEl.textContent = weatherState.summary || "Peeking outside…";

  const todayEl = document.getElementById("weather-today");
  const tomorrowEl = document.getElementById("weather-tomorrow");

  if (todayEl) {
    const today = weatherState.today;
    todayEl.innerHTML = `<span>Today</span><span>${today ? today : "--"}</span>`;
  }
  if (tomorrowEl) {
    const tomorrow = weatherState.tomorrow;
    tomorrowEl.innerHTML = `<span>Tomorrow</span><span>${tomorrow ? tomorrow : "--"}</span>`;
  }
}

function processDailyWeather(daily, index) {
  if (!daily) return null;
  const weatherCodes = daily.weathercode || [];
  const maxArr = daily.temperature_2m_max || [];
  const minArr = daily.temperature_2m_min || [];
  const code = weatherCodes[index];
  const max = maxArr[index];
  const min = minArr[index];
  if (code == null || max == null || min == null) return null;
  const emoji = weatherCodeToEmoji(code);
  const desc = weatherCodeToText(code);
  return `${emoji} ${Math.round(min)}°/${Math.round(max)}°C · ${desc}`;
}

function fetchWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&forecast_days=3&timezone=auto`;
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      const currentWeather = data && data.current_weather ? data.current_weather : null;
      const currentCode = currentWeather ? currentWeather.weathercode : undefined;
      const currentTemp = currentWeather ? currentWeather.temperature : undefined;
      weatherState.emoji = weatherCodeToEmoji(currentCode);
      const tempText = typeof currentTemp === "number" ? `${Math.round(currentTemp)}°C` : "mystery temps";
      weatherState.summary = currentCode
        ? `Now: ${weatherCodeToText(currentCode)} near ${tempText}`
        : "Window vibes unavailable.";
      weatherState.today = processDailyWeather(data.daily, 0);
      weatherState.tomorrow = processDailyWeather(data.daily, 1);
      updateWeatherUI();
    })
    .catch(() => {
      weatherState.summary = "Weather goblins napping. Try again later.";
      updateWeatherUI();
    });
}

function initWeatherWidget() {
  updateWeatherUI();
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeather(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        fetchWeather(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon);
      },
      { timeout: 5000 }
    );
  } else {
    fetchWeather(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon);
  }
}

// --------- RENDER: NOW TAB ---------

function renderNowTab() {
  const countdownMain = document.getElementById("countdown-main");
  const countdownSub = document.getElementById("countdown-sub");
  const progressFill = document.getElementById("progress-fill");
  const progressMeta = document.getElementById("progress-meta");
  const anchorText = document.getElementById("anchor-text");
  const phaseText = document.getElementById("phase-text");
  const errorEl = document.getElementById("error-text");
  const unitsList = document.getElementById("units-list");
  const rewardLine = document.getElementById("reward-line");
  const summaryText = document.getElementById("summary-text");
  const nowWaterStrip = document.getElementById("now-water-strip");

  const info = computeShiftInfo();
  unitsList.innerHTML = "";
  anchorText.textContent = "";
  phaseText.textContent = "";
  errorEl.textContent = "";
  nowWaterStrip.textContent = "";

  if (!info.valid) {
    countdownMain.textContent = "--:--:--";
    countdownSub.textContent = info.error;
    progressFill.style.width = "0%";
    progressMeta.textContent = "Shift: -- | Done: -- | Left: --";
    rewardLine.textContent = "";
    summaryText.textContent = "Set your shift times to see your survival stats.";
    document.getElementById("comparison-list").innerHTML = "";
    renderNowWater(info); // will still show goal 0/0
    renderTimeline(info);
    return;
  }

  const nowRaw = getCurrentMinutes();
  let nowM = nowRaw;
  if (nowM < info.startM && info.endM > 24 * 60) nowM += 24 * 60;
  renderTimeline(info, nowM);

  const secondsTotal = info.total * 60;
  const secondsElapsed = clamp((nowM - info.startM) * 60, 0, secondsTotal);
  const secondsRemaining = clamp(secondsTotal - secondsElapsed, 0, secondsTotal);

  countdownMain.textContent = formatHMS(Math.round(secondsRemaining));
  const approx = copingApproxText(info.remaining, state.ui.cooked);
  countdownSub.textContent = approx;

  const clampedPct = Math.min(100, Math.max(3, info.pct));
  progressFill.style.width = clampedPct + "%";
  progressMeta.textContent =
    `Shift: ${formatHM(info.total)} | Done: ${formatHM(info.elapsed)} | Left: ${formatHM(info.remaining)}`;

  phaseText.textContent = phaseFromPct(info.pct);

  let nextBreak = null;
  if (info.remaining > 0) {
    nextBreak = getUpcomingBreak(info, nowM);
    if (nextBreak) {
      anchorText.textContent = `Next stop: ${nextBreak.icon || "☕"} ${nextBreak.label} in ${formatHM(
        nextBreak.diff
      )} (${formatTimeForDisplay(nextBreak.time)}).`;
    } else {
      const endText = formatDisplayTimeFromMinutes(info.endM);
      anchorText.textContent = `Next stop: 🏁 shift end at ${endText} (${formatHM(info.remaining)}).`;
    }
  } else {
    anchorText.textContent = "You’re free. At least, you should be.";
  }
  handleMilestones(info, nextBreak);

  // water strip
  const goal = state.settings.waterGoal || 0;
  ensureWaterDate();
  const count = state.water.count;
  if (goal > 0) {
    nowWaterStrip.textContent = `Hydration side quest: ${count}/${goal} glasses logged.`;
  } else {
    nowWaterStrip.textContent = "";
  }

  // Units (shifted for cooked mode)
  let unitsSource = UNITS.slice();
  if (state.ui.cooked) {
    // only smallest survival units
    unitsSource.sort((a, b) => a.minutes - b.minutes);
    unitsSource = unitsSource.slice(0, 3);
  } else {
    const sortMode = state.ui.sortMode;
    unitsSource.sort((a, b) => {
      if (sortMode === "short") {
        return a.minutes - b.minutes;
      } else {
        return b.minutes - a.minutes;
      }
    });
  }

  unitsSource.forEach((u) => {
    const count = info.remaining / u.minutes;
    const row = document.createElement("div");
    row.className = "unit-row";

    const label = document.createElement("div");
    label.className = "unit-label";
    if (state.ui.cooked) {
      label.textContent = u.label.replace("Tiny brain breaks", "Tiny survival breaks");
    } else {
      label.textContent = u.label;
    }

    const val = document.createElement("div");
    val.className = "unit-value";
    const displayCount = Math.max(0, Math.round(count));
    val.textContent = displayCount;

    row.appendChild(label);
    row.appendChild(val);
    unitsList.appendChild(row);
  });

  // Reward line
  if (state.shift.reward && info.remaining > 0) {
    rewardLine.innerHTML =
      `Everything you’re doing now is for <strong>${state.shift.reward}</strong>. Time until that: ${formatHM(info.remaining)}.`;
  } else if (info.remaining > 0) {
    rewardLine.textContent =
      "Add one small thing you’ll enjoy after work. Your brain likes having something to orbit.";
  } else {
    rewardLine.textContent = "Today’s shift is done. Future you can collapse now.";
  }

  const pctRounded = Math.round(info.pct);
  summaryLast = `You’ve survived ${pctRounded}% of today’s shift (${formatHM(
    info.elapsed
  )} done, ${formatHM(info.remaining)} left).`;
  summaryText.textContent = summaryLast;

  // comparisons
  buildComparisons(info.total, info.remaining);

  // water mini bar
  renderNowWater(info);
}

function renderNowWater(shiftInfo) {
  ensureWaterDate();
  const goal = state.settings.waterGoal || 0;
  const count = state.water.count;
  const pct = goal > 0 ? Math.max(0, Math.min(100, (count / goal) * 100)) : 0;

  document.getElementById("now-water-count").textContent = count;
  document.getElementById("now-water-goal").textContent = goal;
  document.getElementById("now-water-fill").style.width = pct + "%";
}

function renderTimeline(info, nowM) {
  const metaEl = document.getElementById("timeline-meta");
  const markersEl = document.getElementById("timeline-markers");
  const progressEl = document.getElementById("timeline-progress");
  if (!metaEl || !markersEl || !progressEl) return;
  if (!info || !info.valid) {
    metaEl.textContent = "Add your shift times";
    progressEl.style.width = "0%";
    markersEl.innerHTML = "";
    return;
  }
  const startText = formatDisplayTimeFromMinutes(info.startM);
  const endText = formatDisplayTimeFromMinutes(info.endM);
  metaEl.textContent = `${startText} → ${endText} · ${formatHM(info.total)}`;
  progressEl.style.width = clamp(info.pct, 0, 100) + "%";
  markersEl.innerHTML = "";
  const markers = [
    { position: 0, emoji: "🚪", label: "Clock in" },
    { position: 100, emoji: "🏁", label: "Clock out" }
  ];
  if (info.total > 0) {
    markers.push({ position: 50, emoji: "🧭", label: "Over halfway" });
    if (info.total > 60) {
      const finalPct = ((info.total - 60) / info.total) * 100;
      if (finalPct > 0 && finalPct < 100) {
        markers.push({ position: finalPct, emoji: "🔥", label: "Final hour begins" });
      }
    }
  }
  const shiftStartModulo = info.startM % (24 * 60);
  (state.slacking.breaks || []).forEach((b) => {
    const mins = parseTimeToMinutes(b.time);
    if (mins == null) return;
    let absolute = mins;
    if (info.endM > 24 * 60 && mins < shiftStartModulo) {
      absolute += 24 * 60;
    }
    if (absolute < info.startM || absolute > info.endM) return;
    const pct = ((absolute - info.startM) / info.total) * 100;
    markers.push({ position: pct, emoji: b.icon || "☕", label: b.label || "Break" });
  });
  if (typeof nowM === "number" && info.total > 0) {
    const safeNow = clamp(nowM, info.startM, info.endM);
    const pct = ((safeNow - info.startM) / info.total) * 100;
    markers.push({ position: pct, emoji: "🕒", label: "Now", className: "now" });
  }
  markers.sort((a, b) => a.position - b.position);
  markers.forEach((marker) => {
    const el = document.createElement("div");
    el.className = "timeline-marker" + (marker.className ? " " + marker.className : "");
    el.style.left = clamp(marker.position, 0, 100) + "%";
    const emoji = document.createElement("div");
    emoji.className = "timeline-marker-emoji";
    emoji.textContent = marker.emoji;
    const line = document.createElement("div");
    line.className = "timeline-marker-line";
    const label = document.createElement("div");
    label.textContent = marker.label;
    el.appendChild(emoji);
    el.appendChild(line);
    el.appendChild(label);
    markersEl.appendChild(el);
  });
}

// --------- SLACKING ---------

function normalizeBreaks() {
  if (!state.slacking) state.slacking = { breaks: [] };
  if (!Array.isArray(state.slacking.breaks)) {
    state.slacking.breaks = [];
    return;
  }
  state.slacking.breaks = state.slacking.breaks.map((b, index) => ({
    id: b.id || `legacy-${index}-${Date.now()}`,
    label: b.label || "Unnamed break",
    time: b.time || "",
    icon: b.icon || "☕"
  }));
}

function setSlackingError(msg) {
  const err = document.getElementById("slack-error");
  if (err) err.textContent = msg || "";
}

function renderSlackingWidget() {
  const listEl = document.getElementById("slack-list");
  if (!listEl) return;
  const breaks = state.slacking && state.slacking.breaks ? state.slacking.breaks.slice() : [];
  listEl.innerHTML = "";
  if (breaks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "slack-empty";
    empty.textContent = "No secret breaks yet. Add one above.";
    listEl.appendChild(empty);
    return;
  }

  breaks.sort((a, b) => {
    const aM = parseTimeToMinutes(a.time) ?? 0;
    const bM = parseTimeToMinutes(b.time) ?? 0;
    return aM - bM;
  });

  breaks.forEach((item) => {
    const row = document.createElement("div");
    row.className = "slack-item";
    row.dataset.id = item.id;

    const line = document.createElement("div");
    line.className = "slack-item-line";
    const emoji = document.createElement("div");
    emoji.className = "slack-item-emoji";
    emoji.textContent = item.icon || "☕";
    const label = document.createElement("div");
    label.className = "slack-item-label";
    label.textContent = item.label || "Unnamed break";
    const time = document.createElement("div");
    time.className = "slack-item-time";
    time.textContent = formatTimeForDisplay(item.time);
    line.appendChild(emoji);
    line.appendChild(label);
    line.appendChild(time);

    const actions = document.createElement("div");
    actions.className = "slack-item-actions";

    const shuffleBtn = document.createElement("button");
    shuffleBtn.className = "tiny-icon-btn";
    shuffleBtn.type = "button";
    shuffleBtn.textContent = "🎲";
    shuffleBtn.title = "Shuffle this break a little";
    shuffleBtn.dataset.action = "shuffle";
    shuffleBtn.dataset.id = item.id;

    const removeBtn = document.createElement("button");
    removeBtn.className = "tiny-icon-btn";
    removeBtn.type = "button";
    removeBtn.textContent = "−";
    removeBtn.title = "Remove this break";
    removeBtn.dataset.action = "remove";
    removeBtn.dataset.id = item.id;

    actions.appendChild(shuffleBtn);
    actions.appendChild(removeBtn);

    row.appendChild(line);
    row.appendChild(actions);
    listEl.appendChild(row);
  });
}

function addSlackBreak() {
  const labelInput = document.getElementById("slack-label");
  const timeInput = document.getElementById("slack-time");
  const iconSelect = document.getElementById("slack-icon");
  if (!labelInput || !timeInput) return;
  const label = labelInput.value.trim();
  const time = timeInput.value;
  if (!label || !time) {
    setSlackingError("Need both a label and time for your break.");
    return;
  }
  setSlackingError("");
  const icon = iconSelect ? iconSelect.value || "☕" : "☕";
  const newBreak = {
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    label,
    time,
    icon
  };
  if (!state.slacking) state.slacking = { breaks: [] };
  state.slacking.breaks.push(newBreak);
  labelInput.value = "";
  timeInput.value = "";
  saveState();
  renderSlackingWidget();
  renderNowTab();
}

function removeLastSlackBreak() {
  if (!state.slacking || !state.slacking.breaks || !state.slacking.breaks.length) {
    setSlackingError("No breaks to remove.");
    return;
  }
  setSlackingError("");
  state.slacking.breaks.pop();
  saveState();
  renderSlackingWidget();
  renderNowTab();
}

function removeSlackBreakById(id) {
  if (!state.slacking || !state.slacking.breaks) return;
  state.slacking.breaks = state.slacking.breaks.filter((b) => b.id !== id);
  saveState();
  renderSlackingWidget();
  renderNowTab();
}

function shuffleSlackBreak(id) {
  if (!state.slacking || !state.slacking.breaks) return;
  const item = state.slacking.breaks.find((b) => b.id === id);
  if (!item) return;
  const original = parseTimeToMinutes(item.time);
  if (original == null) return;
  let delta = Math.floor(Math.random() * 7) - 3; // -3..3
  if (delta === 0) delta = 1;
  let newMins = original + delta;
  if (newMins < 0) newMins = 0;
  if (newMins >= 24 * 60) newMins = 24 * 60 - 1;
  item.time = minutesToTimeString(newMins);
  saveState();
  renderSlackingWidget();
  renderNowTab();
}

function getUpcomingBreak(info, nowM) {
  if (!info || !state.slacking || !state.slacking.breaks || !state.slacking.breaks.length) return null;
  const shiftStartModulo = info.startM % (24 * 60);
  let best = null;
  state.slacking.breaks.forEach((b) => {
    const mins = parseTimeToMinutes(b.time);
    if (mins == null) return;
    let absolute = mins;
    if (info.endM > 24 * 60 && mins < shiftStartModulo) {
      absolute += 24 * 60;
    }
    if (absolute < nowM || absolute > info.endM) return;
    const diff = absolute - nowM;
    if (diff < 0) return;
    if (!best || diff < best.diff) {
      best = {
        id: b.id,
        label: b.label,
        time: minutesToTimeString(absolute),
        diff,
        icon: b.icon || "☕"
      };
    }
  });
  return best;
}

// --------- RENDER: SURVIVAL TAB ---------

function pickNextQuote() {
  const tone = state.settings.tone || "soft";
  const pool = QUOTES[tone] || QUOTES.soft;
  if (quoteIndex >= pool.length) quoteIndex = 0;
  const text = pool[quoteIndex++];
  const qEl = document.getElementById("quote-text");
  const metaEl = document.getElementById("quote-meta");
  qEl.textContent = text;
  metaEl.textContent =
    `Tone: ${
      tone === "soft" ? "soft & gentle" : tone === "dark" ? "dark humor" : "blunt but kind"
    }.`;
}

function pickNextTip() {
  if (tipIndex >= TIPS.length) tipIndex = 0;
  const text = TIPS[tipIndex++];
  document.getElementById("tip-text").textContent = text;
}

function renderMood() {
  const mood = state.ui.mood;
  const moodButtons = document.querySelectorAll(".mood-btn");
  moodButtons.forEach((btn) => {
    if (btn.dataset.mood === mood) btn.classList.add("active");
    else btn.classList.remove("active");
  });
  document.getElementById("mood-msg").textContent = MOOD_MESSAGES[mood] || "";
}

function renderWater() {
  ensureWaterDate();
  const count = state.water.count;
  const goal = state.settings.waterGoal || 0;
  const pct = goal > 0 ? Math.max(0, Math.min(100, (count / goal) * 100)) : 0;
  document.getElementById("water-count").textContent = count;
  document.getElementById("water-goal").textContent = goal;
  document.getElementById("water-fill").style.width = pct + "%";

  const metaEl = document.getElementById("water-meta");
  const since = minsSince(state.water.lastSipTs);
  let timeLine = "";

  if (since == null) {
    timeLine = "No sips logged yet today.";
  } else if (since < 45) {
    timeLine = `Last water: ~${since} min ago. Hydrated brain supremacy.`;
  } else {
    timeLine = `It’s been about ${since} min since your last sip. If you can, refill.`;
  }

  let msg;
  if (count === 0) msg = "First sip of the day is always the best. Consider this your sign.";
  else if (goal > 0 && count < goal)
    msg = "Nice. Tiny hydration is still hydration. No guilt if you forget sometimes.";
  else if (goal > 0 && count >= goal)
    msg = "Hydrated legend. Anything beyond this is bonus DLC.";
  else msg = "";

  metaEl.textContent = `${timeLine} ${msg}`.trim();
}

function renderStatusPill() {
  const pill = document.getElementById("status-pill");
  const textEl = document.getElementById("status-text");
  if (state.ui.cooked) {
    pill.querySelector("span").textContent = "🍳";
    textEl.textContent = "Status: cooked";
  } else if (state.ui.mood === "tired") {
    pill.querySelector("span").textContent = "😑";
    textEl.textContent = "Status: tired but here";
  } else if (state.ui.mood === "ok") {
    pill.querySelector("span").textContent = "😌";
    textEl.textContent = "Status: present";
  } else {
    pill.querySelector("span").textContent = "🙂";
    textEl.textContent = "Status: here-ish";
  }
}

function renderCookButton() {
  const cookBtn = document.getElementById("cook-btn");
  if (!cookBtn) return;
  if (state.ui.cooked) {
    cookBtn.innerHTML = "<span>🧊</span><span>Bring me back, I guess</span>";
  } else {
    cookBtn.innerHTML = "<span>🍳</span><span>I’m mentally clocked out</span>";
  }
}

function pickReminder() {
  if (reminderIndex >= REMINDERS.length) reminderIndex = 0;
  const text = REMINDERS[reminderIndex++];
  document.getElementById("reminder-text").textContent = text;
}

// --------- SETTINGS RENDER ---------

function applySettingsToUI() {
  // Tone radios
  const toneRadios = document.querySelectorAll('input[name="tone"]');
  toneRadios.forEach((r) => {
    r.checked = r.value === state.settings.tone;
  });

  // Animations
  document.getElementById("toggle-animations").checked =
    state.settings.animations === false ? true : false;
  if (state.settings.animations === false) {
    document.body.classList.add("no-animations");
  } else {
    document.body.classList.remove("no-animations");
  }

  // Shift inputs
  document.getElementById("start-time").value = state.shift.start;
  document.getElementById("end-time").value = state.shift.end;
  document.getElementById("reward-text").value = state.shift.reward || "";
}

// --------- EVENTS & INIT ---------

function initEvents() {
  // Tabs
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      tabContents.forEach((c) => {
        if (c.id === "tab-" + target) c.classList.add("active");
        else c.classList.remove("active");
      });
    });
  });

  // Recalculate
  document.getElementById("recalc-btn").addEventListener("click", () => {
    const startVal = document.getElementById("start-time").value;
    const endVal = document.getElementById("end-time").value;
    const rewardVal = document.getElementById("reward-text").value.trim();

    state.shift.start = startVal || "09:00";
    state.shift.end = endVal || "17:00";
    state.shift.reward = rewardVal;
    saveState();
    resetMilestones();
    renderNowTab();
    renderWater();
  });

  // water quick-add on Now tab
  document.getElementById("now-water-add-btn").addEventListener("click", () => {
    ensureWaterDate();
    state.water.count += 1;
    state.water.lastSipTs = Date.now();
    saveState();
    renderNowTab();
    renderWater();
  });

  // Sort units
  document.getElementById("sort-short").addEventListener("click", () => {
    state.ui.sortMode = "short";
    document.getElementById("sort-short").classList.add("active");
    document.getElementById("sort-long").classList.remove("active");
    saveState();
    renderNowTab();
  });
  document.getElementById("sort-long").addEventListener("click", () => {
    state.ui.sortMode = "long";
    document.getElementById("sort-long").classList.add("active");
    document.getElementById("sort-short").classList.remove("active");
    saveState();
    renderNowTab();
  });

  // Quotes & tips
  document.getElementById("quote-next-btn").addEventListener("click", () => {
    pickNextQuote();
  });

  document.getElementById("tip-next-btn").addEventListener("click", () => {
    pickNextTip();
  });

  // Mood buttons
  const moodButtons = document.querySelectorAll(".mood-btn");
  moodButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.ui.mood = btn.dataset.mood;
      saveState();
      renderMood();
      renderStatusPill();
      renderNowTab();
    });
  });

  // Water (survival tab)
  document.getElementById("water-add-btn").addEventListener("click", () => {
    ensureWaterDate();
    state.water.count += 1;
    state.water.lastSipTs = Date.now();
    saveState();
    renderWater();
    renderNowTab();
  });

  // Cooked mode
  const cookBtn = document.getElementById("cook-btn");
  cookBtn.addEventListener("click", () => {
    state.ui.cooked = !state.ui.cooked;
    saveState();
    renderStatusPill();
    renderCookButton();
    renderNowTab();
    const modal = document.getElementById("cook-modal");
    if (state.ui.cooked) {
      modal.style.display = "flex";
    } else {
      modal.style.display = "none";
    }
  });
  document.getElementById("cook-dismiss").addEventListener("click", () => {
    document.getElementById("cook-modal").style.display = "none";
  });

  // Slacking inputs
  document.getElementById("slack-add-btn").addEventListener("click", addSlackBreak);
  document.getElementById("slack-remove-btn").addEventListener("click", removeLastSlackBreak);
  document.getElementById("slack-list").addEventListener("click", (e) => {
    const target = e.target;
    if (!target || !target.dataset) return;
    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!action || !id) return;
    if (action === "remove") removeSlackBreakById(id);
    if (action === "shuffle") shuffleSlackBreak(id);
  });

  // Settings: tone
  document.querySelectorAll('input[name="tone"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      state.settings.tone = radio.value;
      saveState();
      pickNextQuote();
    });
  });

  // Settings: animations
  document.getElementById("toggle-animations").addEventListener("change", (e) => {
    const disabled = e.target.checked;
    state.settings.animations = !disabled;
    saveState();
    if (disabled) {
      document.body.classList.add("no-animations");
    } else {
      document.body.classList.remove("no-animations");
    }
  });
}

function init() {
  loadState();

  // Ensure defaults for missing fields
  state = {
    ...DEFAULT_STATE,
    ...state,
    settings: { ...DEFAULT_STATE.settings, ...(state.settings || {}) },
    shift: { ...DEFAULT_STATE.shift, ...(state.shift || {}) },
    water: { ...DEFAULT_STATE.water, ...(state.water || {}) },
    slacking: { ...DEFAULT_STATE.slacking, ...(state.slacking || {}) },
    ui: { ...DEFAULT_STATE.ui, ...(state.ui || {}) }
  };

  normalizeBreaks();

  applySettingsToUI();
  ensureWaterDate();
  initEvents();
  resetMilestones();
  startRandomToasts();

  shuffleArray(REMINDERS);
  shuffleArray(TIPS);

  renderNowTab();
  pickNextQuote();
  pickNextTip();
  renderMood();
  renderWater();
  renderStatusPill();
  renderCookButton();
  renderSlackingWidget();
  pickReminder();
  initWeatherWidget();

  setInterval(() => {
    renderNowTab();
    renderWater(); // keeps “since last sip” and goal in sync
  }, 1000);
}

window.addEventListener("load", init);
