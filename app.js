(() => {
  const STORAGE_KEY = 'pomodoro_state';

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }

  function saveState() {
    const state = {
      workDuration: parseInt($('#workDuration').value, 10) || 25,
      shortBreakDuration: parseInt($('#shortBreakDuration').value, 10) || 5,
      longBreakDuration: parseInt($('#longBreakDuration').value, 10) || 15,
      sessionCount,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  const saved = loadState();

  let currentMode = 'work';
  const workMin = saved?.workDuration ?? 25;
  const shortMin = saved?.shortBreakDuration ?? 5;
  const longMin = saved?.longBreakDuration ?? 15;

  const DURATIONS = {
    work: workMin * 60,
    shortBreak: shortMin * 60,
    longBreak: longMin * 60,
  };

  let timeLeft = DURATIONS.work;
  let totalTime = DURATIONS.work;
  let timerId = null;
  let isRunning = false;
  let sessionCount = saved?.sessionCount ?? 0;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const minutesEl = $('#minutes');
  const secondsEl = $('#seconds');
  const startBtn = $('#startBtn');
  const resetBtn = $('#resetBtn');
  const sessionCountEl = $('#sessionCount');
  const ringProgress = $('.ring-progress');

  const circumference = 2 * Math.PI * 90;

  // Restore input values
  $('#workDuration').value = workMin;
  $('#shortBreakDuration').value = shortMin;
  $('#longBreakDuration').value = longMin;
  sessionCountEl.textContent = sessionCount;

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return [String(m).padStart(2, '0'), String(s).padStart(2, '0')];
  }

  function updateDisplay() {
    const [m, s] = formatTime(timeLeft);
    minutesEl.textContent = m;
    secondsEl.textContent = s;

    const progress = totalTime > 0 ? timeLeft / totalTime : 0;
    ringProgress.style.strokeDashoffset = circumference * (1 - progress);
  }

  function setMode(mode) {
    currentMode = mode;
    clearInterval(timerId);
    timerId = null;
    isRunning = false;

    const durations = {
      work: (parseInt($('#workDuration').value, 10) || 25) * 60,
      shortBreak: (parseInt($('#shortBreakDuration').value, 10) || 5) * 60,
      longBreak: (parseInt($('#longBreakDuration').value, 10) || 15) * 60,
    };

    totalTime = durations[mode];
    timeLeft = totalTime;

    startBtn.textContent = '开始';
    startBtn.classList.remove('paused');

    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.mode === mode));

    saveState();
    updateDisplay();
  }

  function tick() {
    if (timeLeft <= 0) {
      clearInterval(timerId);
      timerId = null;
      isRunning = false;
      startBtn.textContent = '开始';
      startBtn.classList.remove('paused');

      if (currentMode === 'work') {
        sessionCount++;
        sessionCountEl.textContent = sessionCount;
        saveState();
        playBeep();
        setMode(sessionCount % 4 === 0 ? 'longBreak' : 'shortBreak');
      } else {
        playBeep();
        setMode('work');
      }
      return;
    }
    timeLeft--;
    updateDisplay();
  }

  function toggleTimer() {
    if (isRunning) {
      clearInterval(timerId);
      timerId = null;
      isRunning = false;
      startBtn.textContent = '继续';
      startBtn.classList.add('paused');
    } else {
      isRunning = true;
      startBtn.textContent = '暂停';
      startBtn.classList.remove('paused');
      timerId = setInterval(tick, 1000);
    }
  }

  function resetTimer() {
    clearInterval(timerId);
    timerId = null;
    isRunning = false;
    timeLeft = totalTime;
    startBtn.textContent = '开始';
    startBtn.classList.remove('paused');
    saveState();
    updateDisplay();
  }

  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio not available
    }
  }

  // Event listeners
  startBtn.addEventListener('click', toggleTimer);
  resetBtn.addEventListener('click', resetTimer);

  $$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => setMode(tab.dataset.mode));
  });

  // Save on settings change
  ['#workDuration', '#shortBreakDuration', '#longBreakDuration'].forEach((sel) => {
    $(sel).addEventListener('change', saveState);
  });

  // Init
  ringProgress.style.strokeDasharray = circumference;
  updateDisplay();
})();
