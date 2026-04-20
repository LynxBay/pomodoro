(() => {
  const DURATIONS = {
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  let currentMode = 'work';
  let timeLeft = DURATIONS.work;
  let totalTime = DURATIONS.work;
  let timerId = null;
  let isRunning = false;
  let sessionCount = 0;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const minutesEl = $('#minutes');
  const secondsEl = $('#seconds');
  const startBtn = $('#startBtn');
  const resetBtn = $('#resetBtn');
  const sessionCountEl = $('#sessionCount');
  const ringProgress = $('.ring-progress');

  const circumference = 2 * Math.PI * 90;

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return [String(m).padStart(2, '0'), String(s).padStart(2, '0')];
  }

  const MODE_LABELS = {
    work: '专注',
    shortBreak: '短休息',
    longBreak: '长休息',
  };
  const BASE_TITLE = document.title;

  function updateTitle() {
    const [m, s] = formatTime(timeLeft);
    const label = MODE_LABELS[currentMode];
    document.title = `${m}:${s} - ${label} | ${BASE_TITLE}`;
  }

  function resetTitle() {
    document.title = BASE_TITLE;
  }

  function updateDisplay() {
    const [m, s] = formatTime(timeLeft);
    minutesEl.textContent = m;
    secondsEl.textContent = s;

    const progress = totalTime > 0 ? timeLeft / totalTime : 0;
    ringProgress.style.strokeDashoffset = circumference * (1 - progress);

    updateTitle();
  }

  function setMode(mode) {
    currentMode = mode;
    clearInterval(timerId);
    timerId = null;
    isRunning = false;

    const workMin = parseInt($('#workDuration').value, 10) || 25;
    const shortMin = parseInt($('#shortBreakDuration').value, 10) || 5;
    const longMin = parseInt($('#longBreakDuration').value, 10) || 15;

    const durations = {
      work: workMin * 60,
      shortBreak: shortMin * 60,
      longBreak: longMin * 60,
    };

    totalTime = durations[mode];
    timeLeft = totalTime;

    startBtn.textContent = '开始';
    startBtn.classList.remove('paused');

    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.mode === mode));

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
        playBeep();
        sendNotification('番茄钟', '专注结束！休息一下吧');
        // Auto-switch to break
        setMode(sessionCount % 4 === 0 ? 'longBreak' : 'shortBreak');
      } else {
        playBeep();
        sendNotification('番茄钟', '休息结束！开始专注吧');
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
    updateDisplay();
  }

  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  function sendNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }

  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      osc.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio not available
    }
  }

  // Event listeners
  startBtn.addEventListener('click', () => {
    requestNotificationPermission();
    toggleTimer();
  });
  resetBtn.addEventListener('click', resetTimer);

  $$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => setMode(tab.dataset.mode));
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') {
      e.preventDefault();
      requestNotificationPermission();
      toggleTimer();
    } else if (e.code === 'KeyR') {
      e.preventDefault();
      resetTimer();
    }
  });

  // Init
  ringProgress.style.strokeDasharray = circumference;
  updateDisplay();
})();
