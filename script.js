(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const state = {
    step: 1,
    clicks: 0,
    tricks: 0,
    startTime: Date.now(),
    municipalityResets: 0,
    buttonSwaps: 0,
    captchaFailures: 0,
    captchaAnswer: 11,
    fileAccepted: false,
    selectedFile: "",
    uploadAttempts: 0,
    progressRestarts: 0,
    calm: false,
    audioContext: null,
    soundLevel: 0.08,
    finalizing: false,
    videoPlayer: null,
    videoReady: false,
    videoActivated: false,
    videoX: 18,
    videoY: 62,
    videoVx: 112,
    videoVy: 86,
    videoFrame: 0,
    videoLastFrame: 0,
    videoLastDirectionChange: 0,
    videoVolume: 78,
    teacherX: 340,
    teacherY: 82,
    teacherVx: -126,
    teacherVy: 104,
    teacherLastDirectionChange: 0,
    teacherLastCollision: 0,
    adIndex: 0,
    adTimer: 0,
    flashAttempts: 0,
    flashWaits: 0,
    flashPassed: false,
    queueAttempts: 0,
    queuePassed: false,
    kepAttempts: 0,
    kepPassed: false,
    slotAttempts: 0,
    slotPassed: false,
    paymentAttempts: 0,
    paymentPassed: false,
    printAttempts: 0,
    printerRetries: 0,
    printerPassed: false,
    chaosTimer: 0,
    chaosBusy: false,
    chaosIndex: 0,
    navClicks: 0,
    pointerX: window.innerWidth / 2,
    pointerY: window.innerHeight / 2
  };

  document.addEventListener("click", () => { state.clicks += 1; });
  document.addEventListener("pointerdown", () => activateTrollVideo(), { capture: true });
  document.addEventListener("keydown", () => activateTrollVideo(), { once: true });

  function toast(message, duration = 3600) {
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = message;
    $("#toastContainer").append(node);
    window.setTimeout(() => node.remove(), duration);
  }

  function showMessage(id, message, type = "error") {
    const box = $(id);
    box.textContent = message;
    box.className = `inline-message show ${type}`;
  }

  function clearMessage(id) {
    const box = $(id);
    box.textContent = "";
    box.className = "inline-message";
  }

  function closeModal(id) {
    $(id).classList.add("hidden");
  }

  function openModal(id) {
    $(id).classList.remove("hidden");
    const focusable = $(`${id} button`);
    if (focusable) focusable.focus();
  }

  function beep(frequency = 500, duration = 0.09) {
    if (!state.audioContext) return;
    const oscillator = state.audioContext.createOscillator();
    const gain = state.audioContext.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = "square";
    gain.gain.value = Math.min(state.soundLevel, 0.18);
    oscillator.connect(gain);
    gain.connect(state.audioContext.destination);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.001, state.audioContext.currentTime + duration);
    oscillator.stop(state.audioContext.currentTime + duration);
  }

  function loadLocalVideo() {
    if (state.videoPlayer) return;
    const player = $("#localVideoPlayer");
    state.videoPlayer = player;
    state.videoReady = true;
    player.volume = state.videoVolume / 100;
    player.addEventListener("pause", () => {
      if (state.videoActivated && !state.calm) window.setTimeout(() => playTrollVideo(), 450);
    });
    player.addEventListener("error", () => {
      $("#videoStatus").textContent = "Грешка при културата. Кликнете пак.";
      toast("Локалното административно видео отказа. Опитваме пак при следващия клик.");
    });
    $("#videoStatus").textContent = "Културната програма е задължителна.";
  }

  function playTrollVideo() {
    if (!state.videoReady || !state.videoPlayer || state.calm) return;
    state.videoPlayer.muted = false;
    state.videoPlayer.volume = state.videoVolume / 100;
    const playRequest = state.videoPlayer.play();
    if (playRequest && typeof playRequest.catch === "function") {
      playRequest.catch(() => {
        $("#videoStatus").textContent = "Нужен е още един административен клик.";
      });
    } else {
      $("#videoStatus").textContent = "Нужен е още един административен клик.";
    }
  }

  function pauseTrollVideo() {
    if (!state.videoReady || !state.videoPlayer) return;
    state.videoPlayer.pause();
    state.videoPlayer.muted = true;
  }

  function activateTrollVideo() {
    if (state.calm) return;
    const video = $("#trollVideo");
    const teacher = $("#teacherFace");
    video.classList.remove("hidden");
    teacher.classList.remove("hidden");
    if (!state.videoActivated) {
      state.videoActivated = true;
      video.style.left = "0";
      video.style.top = "0";
      teacher.style.left = "0";
      teacher.style.top = "0";
      state.teacherX = Math.max(8, window.innerWidth - teacher.offsetWidth - 28);
      state.teacherY = Math.max(38, window.innerHeight - teacher.offsetHeight - 28);
      teacher.style.transform = `translate(${state.teacherX}px, ${state.teacherY}px)`;
      loadLocalVideo();
      startVideoMotion();
      startFakeAds();
      scheduleChaos();
      toast("Стартирана е задължителната културна програма.");
    }
    playTrollVideo();
  }

  function startVideoMotion() {
    if (state.videoFrame) return;
    state.videoLastFrame = performance.now();
    state.videoLastDirectionChange = state.videoLastFrame;
    state.teacherLastDirectionChange = state.videoLastFrame;
    state.videoFrame = requestAnimationFrame(moveVideoFrame);
  }

  function moveVideoFrame(now) {
    const video = $("#trollVideo");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elapsed = Math.min((now - state.videoLastFrame) / 1000, 0.04);
    state.videoLastFrame = now;

    if (!state.calm && state.videoActivated && !reducedMotion) {
      const maxX = Math.max(8, window.innerWidth - video.offsetWidth - 8);
      const maxY = Math.max(38, window.innerHeight - video.offsetHeight - 56);
      state.videoX += state.videoVx * elapsed;
      state.videoY += state.videoVy * elapsed;

      if (state.videoX <= 8 || state.videoX >= maxX) {
        state.videoX = Math.max(8, Math.min(maxX, state.videoX));
        state.videoVx *= -1;
        video.classList.toggle("video-angry");
      }
      if (state.videoY <= 38 || state.videoY >= maxY) {
        state.videoY = Math.max(38, Math.min(maxY, state.videoY));
        state.videoVy *= -1;
        video.classList.toggle("video-angry");
      }

      if (now - state.videoLastDirectionChange > 7200) {
        const speed = 92 + Math.random() * 75;
        const angle = Math.random() * Math.PI * 2;
        state.videoVx = Math.cos(angle) * speed;
        state.videoVy = Math.sin(angle) * speed;
        state.videoLastDirectionChange = now;
        $("#videoStatus").textContent = Math.random() > 0.5 ? "Търсим най-неудобния ъгъл..." : "Не затваряйте. Ние също не можем.";
      }
      video.style.transform = `translate(${state.videoX}px, ${state.videoY}px)`;

      moveTeacherFrame(now, elapsed, video);
    }
    state.videoFrame = requestAnimationFrame(moveVideoFrame);
  }

  function moveTeacherFrame(now, elapsed, video) {
    const teacher = $("#teacherFace");
    const maxX = Math.max(8, window.innerWidth - teacher.offsetWidth - 8);
    const maxY = Math.max(38, window.innerHeight - teacher.offsetHeight - 56);
    state.teacherX += state.teacherVx * elapsed;
    state.teacherY += state.teacherVy * elapsed;

    if (state.teacherX <= 8 || state.teacherX >= maxX) {
      state.teacherX = Math.max(8, Math.min(maxX, state.teacherX));
      state.teacherVx *= -1;
      teacher.classList.toggle("teacher-angry");
    }
    if (state.teacherY <= 38 || state.teacherY >= maxY) {
      state.teacherY = Math.max(38, Math.min(maxY, state.teacherY));
      state.teacherVy *= -1;
      teacher.classList.toggle("teacher-angry");
    }

    if (now - state.teacherLastDirectionChange > 5800) {
      const speed = 105 + Math.random() * 78;
      const angle = Math.random() * Math.PI * 2;
      state.teacherVx = Math.cos(angle) * speed;
      state.teacherVy = Math.sin(angle) * speed;
      state.teacherLastDirectionChange = now;
      $("#teacherStatus").textContent = Math.random() > 0.5 ? "Следи дали преписвате от общината..." : "Погледът е служебен и не се изключва.";
    }

    const overlapsVideo =
      state.teacherX < state.videoX + video.offsetWidth &&
      state.teacherX + teacher.offsetWidth > state.videoX &&
      state.teacherY < state.videoY + video.offsetHeight &&
      state.teacherY + teacher.offsetHeight > state.videoY;
    if (overlapsVideo && now - state.teacherLastCollision > 500) {
      state.teacherVx *= -1;
      state.teacherVy *= -1;
      state.videoVx *= -1;
      state.videoVy *= -1;
      state.teacherLastCollision = now;
      $("#teacherStatus").textContent = "Сблъсък със задължителната култура.";
    }

    teacher.style.transform = `translate(${state.teacherX}px, ${state.teacherY}px)`;
  }

  function teleportVideo() {
    const video = $("#trollVideo");
    const maxX = Math.max(8, window.innerWidth - video.offsetWidth - 8);
    const maxY = Math.max(38, window.innerHeight - video.offsetHeight - 56);
    state.videoX = 8 + Math.random() * Math.max(1, maxX - 8);
    state.videoY = 38 + Math.random() * Math.max(1, maxY - 38);
    video.style.transform = `translate(${state.videoX}px, ${state.videoY}px)`;
  }

  function teleportTeacher() {
    const teacher = $("#teacherFace");
    const maxX = Math.max(8, window.innerWidth - teacher.offsetWidth - 8);
    const maxY = Math.max(38, window.innerHeight - teacher.offsetHeight - 56);
    state.teacherX = 8 + Math.random() * Math.max(1, maxX - 8);
    state.teacherY = 38 + Math.random() * Math.max(1, maxY - 38);
    teacher.style.transform = `translate(${state.teacherX}px, ${state.teacherY}px)`;
  }

  const fakeAds = [
    { emoji: "👩‍💼", headline: "ЖЕНА ОТ ГИШЕ 7 Е НА 200 М ОТ ВАС", copy: "Иска да Ви покаже непоискан образец 14-Б.", cta: "ВИЖ ФОРМУЛЯРА" },
    { emoji: "🖨️", headline: "КСЕРОКС ГИШЕ 7", copy: "Копираме документите, преди да ги донесете.", cta: "ПЕЧАТАЙ СЕГА!" },
    { emoji: "🥐", headline: "БАНИЧКА ПО ЕВРОПРОЕКТ", copy: "70% тесто, 30% устойчиво развитие.", cta: "КАНДИДАТСТВАЙ" },
    { emoji: "📠", headline: "ИНТЕРНЕТ 2010+", copy: "До 56 килобита в административно време.", cta: "СВЪРЖИ МЕ" },
    { emoji: "🔴", headline: "ПЕЧАТ & СИН ООД", copy: "Заверяваме незавереното с три мокри печата.", cta: "ЗАВЕРИ" },
    { emoji: "⌛", headline: "КУРС ПО ЧАКАНЕ", copy: "Диплома след 14 работни месеца.", cta: "ЗАПИШИ СЕ" },
    { emoji: "⭐", headline: "ГИШЕ 7 PREMIUM", copy: "Пропусни опашката и влез в друга.", cta: "НАДГРАДИ" },
    { emoji: "👩", headline: "МИСТЕРИОЗНА ЖЕНА Е НА 187 М", copy: "Знае един общински трик, който деловодството мрази.", cta: "ПОКАЖИ ТРИКА" },
    { emoji: "👵", headline: "ЖЕНА ОТ НАНАГОРНИЩЕ Е НАБЛИЗО", copy: "Не е ясно коя, но банерът настоява да заверите копие.", cta: "ЗАВЕРИ СЕГА" }
  ];

  function renderFakeAd() {
    const ad = fakeAds[state.adIndex % fakeAds.length];
    $("#adPopupEmoji").textContent = ad.emoji;
    $("#adPopupHeadline").textContent = ad.headline;
    $("#adPopupCopy").textContent = ad.copy;
    $("#fakeAdCta").textContent = ad.cta;
    $("#adTickerText").textContent = `${ad.headline} — ${ad.copy}`;
  }

  function rotateFakeAd() {
    if (state.calm || !state.videoActivated) return;
    state.adIndex = (state.adIndex + 1) % fakeAds.length;
    renderFakeAd();
    state.adTimer = window.setTimeout(rotateFakeAd, 6500);
  }

  function startFakeAds() {
    $("#fakeAdPopup").classList.remove("hidden");
    $("#adTicker").classList.remove("hidden");
    renderFakeAd();
    window.clearTimeout(state.adTimer);
    state.adTimer = window.setTimeout(rotateFakeAd, 6500);
  }

  function updateClock() {
    const now = new Date();
    $("#digitalClock").textContent = now.toLocaleTimeString("bg-BG", { hour12: false });
  }
  updateClock();
  window.setInterval(updateClock, 1000);

  let sessionSeconds = 59;
  let sessionTicks = 0;
  window.setInterval(() => {
    if (state.calm || $("#successPanel").classList.contains("hidden") === false) return;
    sessionTicks += 1;
    if (sessionTicks === 18) {
      sessionSeconds = 252;
      toast("Сесията Ви беше удължена назад.");
      state.tricks += 1;
    } else if (sessionSeconds > 0) {
      sessionSeconds -= 1;
    } else {
      sessionSeconds = 59;
      toast("Сесията изтече, но автоматично не изтече.");
    }
    const minutes = String(Math.floor(sessionSeconds / 60)).padStart(2, "0");
    const seconds = String(sessionSeconds % 60).padStart(2, "0");
    $("#sessionTimer").textContent = `${minutes}:${seconds}`;
  }, 1000);

  function setStep(nextStep) {
    state.step = Math.max(1, Math.min(11, nextStep));
    $$(".form-step").forEach((panel) => panel.classList.toggle("active", Number(panel.dataset.step) === state.step));
    $$("[data-step-indicator]").forEach((indicator) => {
      const value = Number(indicator.dataset.stepIndicator);
      indicator.classList.toggle("active", value === state.step);
      indicator.classList.toggle("done", value < state.step);
    });
    document.body.className = document.body.className.replace(/chaos-\d+/g, "").trim();
    if (!state.calm) document.body.classList.add(`chaos-${state.step}`);
    $("#application").scrollIntoView({ behavior: state.calm ? "auto" : "smooth", block: "start" });
    beep(320 + state.step * 70);
  }

  $("#updateLater").addEventListener("click", () => {
    closeModal("#updateModal");
    toast("Обновяването е отложено за 31.09.2010 г.");
  });
  $("#updateNow").addEventListener("click", () => {
    state.tricks += 1;
    $("#updateNow").textContent = "Няма връзка";
    toast("Грешка 200: операцията завърши неуспешно успешно.");
    window.setTimeout(() => closeModal("#updateModal"), 900);
  });
  $$("#updateModal .fake-close").forEach((button) => button.addEventListener("click", () => {
    state.tricks += 1;
    button.textContent = "?";
    toast("Бутонът за затваряне е затворен.");
  }));

  $("#fontSmall").addEventListener("click", () => {
    const value = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--font-size"), 10) || 13;
    document.documentElement.style.setProperty("--font-size", `${Math.max(10, value - 1)}px`);
  });
  $("#fontLarge").addEventListener("click", () => {
    const value = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--font-size"), 10) || 13;
    document.documentElement.style.setProperty("--font-size", `${Math.min(18, value + 1)}px`);
  });
  $("#contrastButton").addEventListener("click", () => document.body.classList.toggle("high-contrast"));

  $("#soundButton").addEventListener("click", async () => {
    activateTrollVideo();
    if (!state.audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        toast("Аудио помощта не поддържа Вашия браузър от бъдещето.");
        return;
      }
      state.audioContext = new AudioContextClass();
      await state.audioContext.resume();
      $("#soundButton").textContent = "♫ Намали звука";
      toast("Аудио помощта е включена. Беше по-разумно да не я включвате.");
      beep(620, 0.12);
      return;
    }
    state.soundLevel = Math.min(0.18, state.soundLevel + 0.03);
    state.videoVolume = Math.min(100, state.videoVolume + 8);
    if (state.videoReady) state.videoPlayer.volume = state.videoVolume / 100;
    state.tricks += 1;
    $("#soundButton").textContent = `♫ Намален на ${state.videoVolume}%`;
    beep(760, 0.1);
    toast("Звукът беше намален нагоре.");
  });

  $("#fakeVideoClose").addEventListener("click", (event) => {
    event.stopPropagation();
    const video = $("#trollVideo");
    state.tricks += 1;
    video.classList.add("video-squash");
    $("#videoStatus").textContent = "Затваряне: отказано от администратора.";
    toast("Видеото беше затворено неуспешно.");
    window.setTimeout(() => {
      teleportVideo();
      video.classList.remove("video-squash");
      playTrollVideo();
    }, 420);
  });

  $("#fakeTeacherClose").addEventListener("click", (event) => {
    event.stopPropagation();
    const teacher = $("#teacherFace");
    state.tricks += 1;
    teacher.classList.add("teacher-squash");
    $("#teacherStatus").textContent = "Отсъствието не е разрешено.";
    toast("Учителят беше затворен неуспешно.");
    window.setTimeout(() => {
      teleportTeacher();
      teacher.classList.remove("teacher-squash");
    }, 420);
  });

  function clickFakeAd(message) {
    state.tricks += 1;
    state.adIndex = (state.adIndex + 1) % fakeAds.length;
    renderFakeAd();
    toast(message);
    beep(710, 0.08);
  }

  $("#fakeAdClose").addEventListener("click", () => {
    $("#fakeAdPopup").classList.toggle("ad-left");
    clickFakeAd("Рекламата беше затворена и заменена с по-подходяща.");
  });
  $("#fakeAdCta").addEventListener("click", () => clickFakeAd("Офертата изтече преди 14 работни дни."));
  $("#adTickerButton").addEventListener("click", () => clickFakeAd("Научихте по-малко. Благодарим!"));

  $("#searchButton").addEventListener("click", () => {
    const field = $("#siteSearch");
    field.value = field.value === "търси..." ? "Намерени 0 от 1 резултата" : "търси...";
    toast("Търсенето приключи, преди да започне.");
  });

  const portalDestinations = ["application", "aboutSection", "newsSection", "servicesSection", "contactsSection", "siteMapSection"];
  $$('[data-section]').forEach((button) => button.addEventListener("click", () => {
    state.navClicks += 1;
    let destination = button.dataset.section;
    const shouldMisroute = !state.calm && state.navClicks % 3 === 0;
    if (shouldMisroute) {
      const alternatives = portalDestinations.filter((id) => id !== destination);
      destination = alternatives[Math.floor(Math.random() * alternatives.length)];
      state.tricks += 1;
      toast("Навигацията Ви насочи към по-подходящ неподходящ раздел.");
    }
    if (destination === "home") {
      window.scrollTo({ top: 0, behavior: state.calm ? "auto" : "smooth" });
      return;
    }
    const target = $(`#${destination}`);
    if (target) target.scrollIntoView({ behavior: state.calm ? "auto" : "smooth", block: "start" });
  }));

  function scheduleChaos() {
    window.clearTimeout(state.chaosTimer);
    if (state.calm || !state.videoActivated) return;
    const delay = 12000 + Math.floor(Math.random() * 6001);
    state.chaosTimer = window.setTimeout(() => {
      if (!state.calm && !state.chaosBusy) runChaosEffect();
      scheduleChaos();
    }, delay);
  }

  function finishChaosAfter(callback, duration) {
    window.setTimeout(() => {
      callback();
      state.chaosBusy = false;
    }, duration);
  }

  function runChaosEffect() {
    if (state.calm || state.chaosBusy) return;
    state.chaosBusy = true;
    state.tricks += 1;
    const effect = state.chaosIndex % 9;
    state.chaosIndex += 1;

    if (effect === 0) {
      const errors = [
        ["Възникна неизвестна известна грешка.", "Страницата отговори, но отговорът не беше съгласен."],
        ["Операцията приключи успешно неуспешно.", "Натиснете OK, за да отмените отмяната."],
        ["Недостатъчно чакане.", "Моля, изчакайте още малко, за да започнете да чакате."]
      ];
      const error = errors[Math.floor(Math.random() * errors.length)];
      $("#chaosDialogTitle").textContent = "Microsoft Internet Explorer";
      $("#chaosDialogHeading").textContent = error[0];
      $("#chaosDialogText").textContent = error[1];
      openModal("#chaosDialog");
      finishChaosAfter(() => closeModal("#chaosDialog"), 4800);
      return;
    }

    if (effect === 1) {
      document.body.classList.add("screen-shake");
      toast("Стабилността на портала се калибрира.");
      finishChaosAfter(() => document.body.classList.remove("screen-shake"), 550);
      return;
    }

    if (effect === 2) {
      const panels = $$(".portal-panel, .old-box");
      const panel = panels[Math.floor(Math.random() * panels.length)];
      panel.classList.add("chaos-flip");
      toast("Избраният раздел беше огледално заверен.");
      finishChaosAfter(() => panel.classList.remove("chaos-flip"), 2400);
      return;
    }

    if (effect === 3) {
      const originalTitle = document.title;
      document.title = "⚠ СЕСИЯТА Е ПОЧТИ ИЗТЕКЛА ⚠";
      $("#videoStatus").textContent = "Системата променя заглавието без основание...";
      finishChaosAfter(() => { document.title = originalTitle; }, 4200);
      return;
    }

    if (effect === 4) {
      spawnCursorClones();
      toast("Курсорът Ви беше размножен за по-бързо обслужване.");
      finishChaosAfter(() => $$(".cursor-clone").forEach((node) => node.remove()), 2300);
      return;
    }

    if (effect === 5) {
      $("#cookiePanel").classList.remove("hidden");
      finishChaosAfter(() => $("#cookiePanel").classList.add("hidden"), 6500);
      return;
    }

    if (effect === 6) {
      $("#chaosBanner").classList.remove("hidden");
      finishChaosAfter(() => $("#chaosBanner").classList.add("hidden"), 3600);
      return;
    }

    const systemFailures = effect === 7
      ? ["Internet Explorer (Not Responding)", "The program is waiting for the website to respond.", "Уебсайтът чака браузъра, а браузърът чака Вас."]
      : ["Printer Spooler Service", "Printer not found successfully.", "Добавете несъществуващ принтер и опитайте да отпечатате електронната услуга."];
    $("#chaosDialogTitle").textContent = systemFailures[0];
    $("#chaosDialogHeading").textContent = systemFailures[1];
    $("#chaosDialogText").textContent = systemFailures[2];
    openModal("#chaosDialog");
    finishChaosAfter(() => closeModal("#chaosDialog"), 4800);
  }

  function spawnCursorClones() {
    for (let index = 0; index < 14; index += 1) {
      const clone = document.createElement("span");
      clone.className = "cursor-clone";
      clone.textContent = "➤";
      clone.style.left = `${state.pointerX}px`;
      clone.style.top = `${state.pointerY}px`;
      clone.style.setProperty("--dx", `${Math.round(Math.random() * 180 - 90)}px`);
      clone.style.setProperty("--dy", `${Math.round(Math.random() * 150 - 75)}px`);
      document.body.append(clone);
    }
  }

  function dismissChaosDialog() {
    closeModal("#chaosDialog");
    toast("Грешката беше потвърдена и ще бъде повторена.");
  }
  $("#chaosDialogClose").addEventListener("click", dismissChaosDialog);
  $("#chaosDialogOk").addEventListener("click", dismissChaosDialog);
  $("#acceptCookies").addEventListener("click", () => {
    $("#cookiePanel").classList.add("hidden");
    toast("Приети са и бисквитките, които отказахте.");
  });
  $("#rejectCookies").addEventListener("click", () => {
    $("#cookiePanel").classList.add("hidden");
    toast("Отказът е приет като съгласие.");
  });

  $("#municipality").addEventListener("change", (event) => {
    if (!state.calm && event.target.value && state.municipalityResets === 0) {
      state.municipalityResets += 1;
      state.tricks += 1;
      window.setTimeout(() => {
        event.target.value = "";
        toast("Списъкът с общини беше актуализиран. Моля, изберете отново.");
      }, 650);
    }
  });

  const swapButtons = () => {
    if (state.calm || state.buttonSwaps >= 3) return;
    state.buttonSwaps += 1;
    state.tricks += 1;
    $("#firstActions").classList.toggle("swapped");
  };
  $("#step1Next").addEventListener("mouseenter", swapButtons);
  $("#clearForm").addEventListener("mouseenter", swapButtons);

  $("#clearForm").addEventListener("click", () => {
    if (!window.confirm("Сигурни ли сте, че не сте сигурни, че искате да изчистите?")) {
      toast("Отказът от изчистване беше изчистен.");
      return;
    }
    $("#fullName").value = "";
    $("#contactField").value = "";
    showMessage("#step1Message", "Формулярът е частично изчистен. Пълното изчистване е платена услуга.");
  });

  $("#step1Next").addEventListener("click", () => {
    const municipality = $("#municipality").value;
    const name = $("#fullName").value.trim();
    if (!municipality || !name) {
      showMessage("#step1Message", "Задължителното незадължително поле не е попълнено. Проверете всички полета, включително попълнените.");
      return;
    }
    clearMessage("#step1Message");
    setStep(2);
  });

  $("#checkAll").addEventListener("click", () => {
    $$(".declaration").forEach((checkbox) => { checkbox.checked = checkbox.id !== "decl7"; });
    state.tricks += 1;
    showMessage("#step2Message", "Готово! Маркирани са всички видими декларации.", "success");
  });

  $("#step2Next").addEventListener("click", () => {
    const missing = $$(".declaration").filter((checkbox) => !checkbox.checked);
    if (missing.length) {
      showMessage("#step2Message", `Остават ${missing.length} немаркирани декларации. Една от тях вероятно се крие.`);
      missing[0].closest("label").scrollIntoView({ behavior: "smooth", block: "center" });
      missing[0].focus();
      return;
    }
    clearMessage("#step2Message");
    setStep(3);
  });

  $$(".back-step").forEach((button) => button.addEventListener("click", () => {
    if (!state.calm && button.textContent.includes("следващото")) {
      state.tricks += 1;
      setStep(state.step + 1);
    } else {
      setStep(state.step - 1);
    }
  }));

  function animateMiniProgress(callback) {
    const wrap = $("#uploadProgress");
    const bar = $("span", wrap);
    const label = $("b", wrap);
    wrap.classList.remove("hidden");
    let progress = 0;
    const timer = window.setInterval(() => {
      progress += 7;
      const shown = Math.min(progress, 100);
      bar.style.width = `${shown}%`;
      label.textContent = `${shown}%`;
      if (progress >= 100) {
        window.clearInterval(timer);
        window.setTimeout(() => callback(), 250);
      }
    }, 45);
  }

  $("#documentFile").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    state.uploadAttempts += 1;
    state.selectedFile = file.name;
    $("#fileName").textContent = file.name;
    animateMiniProgress(() => {
      if (!state.calm && state.uploadAttempts === 1) {
        state.tricks += 1;
        state.fileAccepted = false;
        showMessage("#step3Message", "Файлът е PDF, но не е достатъчно PDF. Изберете същия файл още веднъж или използвайте служебния.");
      } else {
        state.fileAccepted = true;
        showMessage("#step3Message", "Файлът беше приет въпреки техническите изисквания.", "success");
      }
    });
  });

  $("#generateDocument").addEventListener("click", () => {
    $("#generateDocument").disabled = true;
    animateMiniProgress(() => {
      state.fileAccepted = true;
      state.selectedFile = "УДОСТОВЕРЕНИЕ_БЕЗ_Ъ_И_Ь.pdf";
      $("#fileName").textContent = state.selectedFile;
      $("#generateDocument").disabled = false;
      showMessage("#step3Message", "Генериран е файл с размер приблизително точно 1.37 MB.", "success");
    });
  });

  $("#step3Next").addEventListener("click", () => {
    if (!state.fileAccepted) {
      showMessage("#step3Message", "Задължителният незадължителен документ липсва или присъства неправилно.");
      return;
    }
    setStep(4);
  });

  function refreshCaptcha() {
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 7) + 1;
    state.captchaAnswer = a + b;
    $("#captchaCode").textContent = `${a} + ${b} = ?`;
    $("#captchaInput").value = "";
  }
  $("#refreshCaptcha").addEventListener("click", () => {
    refreshCaptcha();
    state.tricks += 1;
    $("#contactField").value = "полето беше освежено заедно с CAPTCHA";
    toast("Кодът и едно несвързано поле бяха обновени.");
  });

  $("#step4Next").addEventListener("click", () => {
    const answer = Number($("#captchaInput").value.trim());
    if (answer !== state.captchaAnswer) {
      showMessage("#step4Message", "Невалиден код. Верният код вече е друг.");
      refreshCaptcha();
      return;
    }
    if (!state.calm && state.captchaFailures === 0) {
      state.captchaFailures += 1;
      state.tricks += 1;
      $("#contactField").value = "автоматично коригирано погрешно";
      showMessage("#step4Message", "Кодът е верен, което е подозрително. Моля, докажете отново, че не сте робот.");
      refreshCaptcha();
      return;
    }
    $("#summaryMunicipality").textContent = $("#municipality").value;
    $("#summaryName").textContent = $("#fullName").value;
    $("#summaryFile").textContent = state.selectedFile;
    setStep(5);
  });

  function finishFlashCheck() {
    state.flashPassed = true;
    state.tricks += 1;
    closeModal("#flashCrashModal");
    $("#flashPluginBox").classList.remove("not-responding");
    $("#flashProgress span").style.width = "100%";
    $("#flashProgress b").textContent = "100% (не отговаря успешно)";
    $("#runFlashCheck").disabled = false;
    $("#runFlashCheck").textContent = "FLASH Е УСПЕШНО НЕРАБОТЕЩ";
    $("#step5Next").disabled = false;
    showMessage("#step5Message", "Проверката приключи: Adobe Flash Player не работи точно както се очаква.", "success");
  }

  $("#runFlashCheck").addEventListener("click", () => {
    if (state.flashPassed) {
      toast("Flash вече е сертифицирано повреден.");
      return;
    }
    state.flashAttempts += 1;
    state.flashWaits = 0;
    const button = $("#runFlashCheck");
    const progress = $("#flashProgress");
    const bar = $("span", progress);
    const label = $("b", progress);
    button.disabled = true;
    button.textContent = "ЗАРЕЖДАНЕ НА НЕЗАРЕДИМОТО...";
    progress.classList.remove("hidden");
    bar.style.width = "0%";
    label.textContent = "0%";
    let value = 0;
    const timer = window.setInterval(() => {
      value += 9;
      const shown = Math.min(value, 67);
      bar.style.width = `${shown}%`;
      label.textContent = `${shown}%`;
      if (value >= 67) {
        window.clearInterval(timer);
        $("#flashPluginBox").classList.add("not-responding");
        $("#flashCrashTitle").textContent = "Adobe Flash Player (Not Responding)";
        $("#flashCrashText").textContent = "If you close the program, you might lose information. Ако чакате, също.";
        $("#waitForFlash").textContent = "Wait for the program to respond";
        openModal("#flashCrashModal");
      }
    }, 90);
  });

  $("#waitForFlash").addEventListener("click", () => {
    state.flashWaits += 1;
    state.tricks += 1;
    if (state.flashWaits < 2) {
      $("#flashCrashTitle").textContent = "Adobe Flash Player (Still Not Responding)";
      $("#flashCrashText").textContent = "Windows is checking whether the program is still not responding. Моля, почакайте още веднъж.";
      $("#waitForFlash").textContent = "Wait even longer";
      return;
    }
    finishFlashCheck();
  });

  $("#endFlash").addEventListener("click", () => {
    state.tricks += 1;
    closeModal("#flashCrashModal");
    $("#flashPluginBox").classList.remove("not-responding");
    $("#flashProgress span").style.width = "0%";
    $("#flashProgress b").textContent = "0%";
    $("#runFlashCheck").disabled = false;
    $("#runFlashCheck").textContent = "СТАРТИРАЙ FLASH ОТНОВО";
    showMessage("#step5Message", "Затворихте програмата, но проверката остана незавършена. Стартирайте я отново.");
  });

  $("#flashCrashClose").addEventListener("click", () => {
    state.tricks += 1;
    $("#flashCrashClose").textContent = "?";
    $("#flashCrashText").textContent = "The close button is not responding. Изберете чакане или затваряне.";
  });

  $("#step5Next").addEventListener("click", () => {
    if (!state.flashPassed) {
      showMessage("#step5Message", "Първо трябва да докажете, че Flash не работи.");
      return;
    }
    setStep(6);
  });

  $("#takeQueueNumber").addEventListener("click", () => {
    if (state.queuePassed) {
      toast("Вече имате номер. Вторият номер е на съседното гише.");
      return;
    }
    state.queueAttempts += 1;
    const firstAttempt = state.queueAttempts === 1;
    const button = $("#takeQueueNumber");
    let peopleAhead = firstAttempt ? 5 : 3;
    $("#personalQueueNumber").textContent = firstAttempt ? "A-8471" : "B-404";
    $("#currentQueueNumber").textContent = firstAttempt ? "A-000" : "B-401";
    $("#queueStatus").textContent = `Пред Вас има ${peopleAhead} граждани и един служител.`;
    button.disabled = true;
    button.textContent = "МОЛЯ, ЧАКАЙТЕ ПРАВИ";
    const timer = window.setInterval(() => {
      peopleAhead -= 1;
      $("#currentQueueNumber").textContent = firstAttempt ? `A-00${5 - peopleAhead}` : `B-40${4 - peopleAhead}`;
      $("#queueStatus").textContent = `Пред Вас остават ${Math.max(0, peopleAhead)} граждани и все същият служител.`;
      if (peopleAhead > 0) return;
      window.clearInterval(timer);
      state.tricks += 1;
      if (firstAttempt) {
        $("#personalQueueNumber").textContent = "ПРОПУСНАТ";
        $("#queueStatus").textContent = "Номерът Ви беше извикан без звук преди малко.";
        button.disabled = false;
        button.textContent = "ВЗЕМИ ПОВТОРЕН НОМЕР";
        showMessage("#step6Message", "Опашката Ви пропусна. Изтеглете нов електронен хартиен номер.");
        return;
      }
      state.queuePassed = true;
      $("#personalQueueNumber").textContent = "B-404 ✓";
      $("#queueStatus").textContent = "Гише 7 Ви повика, но служителят е в почивка. Това се брои.";
      button.textContent = "НОМЕРЪТ Е ПРИЕТ";
      $("#step6Next").disabled = false;
      showMessage("#step6Message", "Виртуалното чакане приключи физически успешно.", "success");
    }, 650);
  });

  $("#step6Next").addEventListener("click", () => {
    if (!state.queuePassed) {
      showMessage("#step6Message", "Не можете да продължите, преди да бъдете пропуснати поне веднъж.");
      return;
    }
    setStep(7);
  });

  $("#verifyKep").addEventListener("click", () => {
    const pin = $("#kepPin").value.trim();
    if (pin !== "0000") {
      showMessage("#step7Message", "Невалиден учебен ПИН. Валидният е изписан точно над полето, но порталът не носи отговорност.");
      $("#kepStatus").textContent = "Грешка 0x0000: ПИН-ът не е достатъчно нулев.";
      beep(170, 0.16);
      return;
    }
    if (state.kepPassed) {
      toast("Сертификатът вече е проверен. Повторната проверка е в отделно заявление.");
      return;
    }
    state.kepAttempts += 1;
    state.tricks += 1;
    if (state.kepAttempts === 1) {
      $("#kepStatus").textContent = "Сертификатът е валиден, но часовникът на четеца е в 2010 г.";
      showMessage("#step7Message", "Проверката неуспешна: подписът е прекалено електронен. Натиснете същия бутон пак.");
      return;
    }
    if (state.kepAttempts === 2) {
      $("#kepStatus").textContent = "Драйверът откри КЕП, но КЕП не откри драйвера.";
      showMessage("#step7Message", "Проверката пак е неуспешна. Извадете мислено устройството и опитайте за трети път.");
      return;
    }
    state.kepPassed = true;
    $("#kepStatus").textContent = "Сертификат: валиден до вчера, приет днес по изключение.";
    $("#verifyKep").textContent = "КЕПЪТ Е ПРИБЛИЗИТЕЛНО ВАЛИДЕН";
    $("#step7Next").disabled = false;
    showMessage("#step7Message", "Квалифицираният подпис е неквалифицирано приет.", "success");
  });

  $("#step7Next").addEventListener("click", () => {
    if (!state.kepPassed) {
      showMessage("#step7Message", "Нужно е да проверите КЕП поне три пъти с ПИН 0000.");
      return;
    }
    setStep(8);
  });

  $("#reserveSlot").addEventListener("click", () => {
    if (!$("#serviceSlot").value) {
      showMessage("#step8Message", "Изберете несвободен час, за да проверим дали случайно е свободен.");
      return;
    }
    if (state.slotPassed) {
      toast("Вече имате час. Часът няма минути, които да върнем.");
      return;
    }
    state.slotAttempts += 1;
    state.tricks += 1;
    if (state.slotAttempts === 1) {
      $("#slotStatus").textContent = "Часът беше зает от Вас, но на друго гише.";
      showMessage("#step8Message", "Резервацията изтече, докато я резервирахте. Потвърдете КЕП отново и се върнете.");
      toast("Системата Ви върна една стъпка по административна необходимост.");
      window.setTimeout(() => setStep(7), 900);
      return;
    }
    state.slotPassed = true;
    $("#slotStatus").textContent = "Запазено: втората сряда след първия четвъртък, 10:03 ч.";
    $("#reserveSlot").textContent = "ЧАСЪТ Е НЕСВОБОДНО ЗАПАЗЕН";
    $("#step8Next").disabled = false;
    showMessage("#step8Message", "Получихте 60-секунден приемен час с 14-месечно предизвестие.", "success");
  });

  $("#step8Next").addEventListener("click", () => {
    if (!state.slotPassed) {
      showMessage("#step8Message", "Не сте запазили час за електронното гише.");
      return;
    }
    setStep(9);
  });

  $("#fakePay").addEventListener("click", () => {
    if (state.paymentPassed) {
      toast("Таксата вече е платена. Връщане на административни точки не се допуска.");
      return;
    }
    state.paymentAttempts += 1;
    state.tricks += 1;
    if (state.paymentAttempts === 1) {
      $("#paymentStatus").textContent = `Опити за плащане: ${state.paymentAttempts}. Левове вече не се приемат.`;
      showMessage("#step9Message", "Плащането е отказано: системата очаква евро, но показва левове.");
      return;
    }
    if (state.paymentAttempts === 2) {
      $("#paymentStatus").textContent = `Опити за плащане: ${state.paymentAttempts}. Евро още не се приемат.`;
      showMessage("#step9Message", "Плащането е отказано: системата очаква левове, но вече поиска евро.");
      return;
    }
    state.paymentPassed = true;
    $("#paymentStatus").textContent = `Опити за плащане: ${state.paymentAttempts}. Платено с 8471 административни точки.`;
    $("#fakePay").textContent = "ПЛАТЕНО БЕЗ ПАРИ";
    $("#step9Next").disabled = false;
    showMessage("#step9Message", "Безплатната такса е платена успешно без платежно средство.", "success");
  });

  $("#step9Next").addEventListener("click", () => {
    if (!state.paymentPassed) {
      showMessage("#step9Message", "Безплатната услуга не може да продължи преди платена такса.");
      return;
    }
    setStep(10);
  });

  $("#printApplication").addEventListener("click", () => {
    if (state.printerPassed) {
      toast("Документът вече е отпечатан. Четвъртото копие се заявява на място.");
      return;
    }
    state.printAttempts += 1;
    state.tricks += 1;
    if (state.printAttempts === 1) {
      $("#printerModalTitle").textContent = "Add Printer Wizard (Not Responding)";
      $("#printerModalText").textContent = "Windows cannot find the printer that the portal insists is connected.";
      $("#printerStatus").textContent = "Състояние: търси принтер на гише 7...";
      openModal("#printerModal");
      showMessage("#step10Message", "Печатът не започна, защото принтерът не съществува. Убедете Windows в обратното.");
      return;
    }
    if (state.printAttempts === 2) {
      $("#printerModalTitle").textContent = "HP DeskJet 404 — Paper Jam";
      $("#printerModalText").textContent = "Paper jam in tray 0. The selected printer has no tray 0 and no paper.";
      $("#printerStatus").textContent = "Състояние: виртуална хартия е заседнала физически.";
      openModal("#printerModal");
      showMessage("#step10Message", "Открито е засядане без хартия. Затворете съветника и печатайте пак.");
      return;
    }
    state.printerPassed = true;
    $("#printerStatus").textContent = "Състояние: 3 от 2 копия са отпечатани в PDF принтер без PDF.";
    $("#printApplication").textContent = "РАЗПЕЧАТАНО ЕЛЕКТРОННО";
    $("#step10Next").disabled = false;
    showMessage("#step10Message", "Печатът завърши. Мокрият електронен печат е достатъчно сух.", "success");
  });

  $("#printerRetry").addEventListener("click", () => {
    state.printerRetries += 1;
    state.tricks += 1;
    if (state.printerRetries === 1) {
      $("#printerModalTitle").textContent = "Searching for printer... (Not Responding)";
      $("#printerModalText").textContent = "The print spooler is waiting for the printer to invent itself. Натиснете пак.";
      $("#printerRetry").textContent = "Try more again";
      return;
    }
    closeModal("#printerModal");
    $("#printerRetry").textContent = "Try again";
    showMessage("#step10Message", "Повторното търсене намери същия липсващ принтер. Стартирайте печата отново.");
  });

  $("#addPrinter").addEventListener("click", () => {
    state.tricks += 1;
    closeModal("#printerModal");
    $("#printerStatus").textContent = "Добавен: HP DeskJet 404 (въображаем, офлайн, по подразбиране).";
    toast("Въображаемият принтер беше добавен реално неуспешно.");
  });

  $("#printerModalClose").addEventListener("click", () => {
    state.tricks += 1;
    $("#printerModalClose").textContent = "?";
    $("#printerModalText").textContent = "The close button is waiting for the printer. Изберете някой от другите неправилни бутони.";
  });

  $("#step10Next").addEventListener("click", () => {
    if (!state.printerPassed) {
      showMessage("#step10Message", "Не може да сканирате документ, който още не е разпечатан виртуално.");
      return;
    }
    setStep(11);
  });

  function runFinalProgress(secondPass = false) {
    state.finalizing = true;
    openModal("#progressModal");
    let progress = 0;
    const bar = $("#bigProgressBar");
    const label = $("#bigProgressPercent");
    const text = $("#progressText");
    bar.style.width = "0%";
    label.textContent = "0%";
    text.textContent = secondPass ? "Възстановяване на вече изгубения напредък..." : "Подписване на неподписаното...";
    const timer = window.setInterval(() => {
      progress += progress < 85 ? 5 : 2;
      if (progress >= 99 && !secondPass) {
        window.clearInterval(timer);
        label.textContent = "99%";
        bar.style.width = "99%";
        state.progressRestarts += 1;
        state.tricks += 1;
        text.textContent = "Оптимизиране на чакането... започваме отначало.";
        window.setTimeout(() => {
          closeModal("#progressModal");
          openModal("#sessionModal");
        }, 750);
        return;
      }
      if (progress >= 100) {
        window.clearInterval(timer);
        bar.style.width = "100%";
        label.textContent = "100% (предварително)";
        window.setTimeout(completeApplication, 500);
        return;
      }
      bar.style.width = `${progress}%`;
      label.textContent = `${progress}%`;
    }, 65);
  }

  $("#submitApplication").addEventListener("click", () => {
    if (!$("#finalConsent").checked) {
      showMessage("#step11Message", "Трябва да потвърдите непотвърдените данни, преди да ги потвърдите.");
      return;
    }
    if (!state.finalizing) runFinalProgress(state.calm);
  });

  $("#sessionContinue").addEventListener("click", () => {
    closeModal("#sessionModal");
    runFinalProgress(true);
  });
  $("#sessionRestart").addEventListener("click", () => {
    closeModal("#sessionModal");
    state.finalizing = false;
    setStep(4);
    toast("Върнахме Ви почти в началото, както поискахте без да искате.");
  });
  $$("#sessionModal .fake-close").forEach((button) => button.addEventListener("click", () => {
    button.textContent = "↻";
    toast("Този прозорец не участва в затварянето.");
  }));

  function completeApplication() {
    closeModal("#progressModal");
    state.finalizing = false;
    $("#municipalForm").classList.add("hidden");
    $(".steps").classList.add("hidden");
    $("#successPanel").classList.remove("hidden");
    const number = `ДН-${String(Math.floor(Math.random() * 999999)).padStart(6, "0")}/2010`;
    $("#incomingNumber").textContent = number;
    $("#incomingNumber").classList.remove("hidden");
    $("#numberGone").classList.add("hidden");
    $("#restoreNumber").classList.add("hidden");
    toast("Поздравления! Само още една последна последна стъпка.");
    window.setTimeout(() => {
      if (state.calm) return;
      $("#incomingNumber").classList.add("hidden");
      $("#numberGone").classList.remove("hidden");
      $("#restoreNumber").classList.remove("hidden");
      state.tricks += 1;
    }, 2000);
  }

  $("#restoreNumber").addEventListener("click", () => {
    $("#incomingNumber").classList.remove("hidden");
    $("#numberGone").classList.add("hidden");
    $("#restoreNumber").classList.add("hidden");
    toast("Номерът е възстановен. Запишете го върху електронен лист хартия.");
  });

  $("#finishButton").addEventListener("click", () => {
    const elapsed = Math.max(1, Math.round((Date.now() - state.startTime) / 1000));
    $("#statsGrid").innerHTML = `
      <div class="stat"><strong>${state.clicks}</strong><span>натискания</span></div>
      <div class="stat"><strong>${state.tricks}</strong><span>административни номера</span></div>
      <div class="stat"><strong>${elapsed}s</strong><span>изгубено време</span></div>
    `;
    state.calm = true;
    window.clearTimeout(state.chaosTimer);
    window.clearTimeout(state.adTimer);
    document.body.classList.add("victory-mode", "calm");
    pauseTrollVideo();
    openModal("#rewardModal");
  });

  $("#closeReward").addEventListener("click", () => {
    closeModal("#rewardModal");
    document.body.classList.remove("victory-mode");
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast("Сайтът вече е временно нормален. Това е скритата награда.");
  });

  function fleeSurvey() {
    if (state.calm) return;
    const x = Math.floor(Math.random() * 85) - 42;
    const y = Math.floor(Math.random() * 42) - 20;
    $("#surveyNo").style.transform = `translate(${x}px, ${y}px)`;
    state.tricks += 1;
  }
  $("#surveyNo").addEventListener("mouseenter", fleeSurvey);
  $("#surveyNo").addEventListener("focus", fleeSurvey);
  $("#surveyNo").addEventListener("click", () => {
    $("#surveyResult").textContent = "Вашият отговор „ДА“ беше записан.";
  });
  $("#surveyYes").addEventListener("click", () => {
    $("#surveyResult").textContent = "Благодарим! Знаехме си.";
  });

  $("#chatButton").addEventListener("click", () => {
    $("#chatButton").textContent = "Операторът напусна чата";
    toast("Вие сте № 4 281 в опашката. Пред Вас има 4 282 души.");
  });

  $$('[data-popup]').forEach((button) => button.addEventListener("click", () => {
    const messages = {
      taxes: "Нямате задължения, но проверката струва едно задължение.",
      queue: "Вашият номер е 000. В момента се обслужва номер -001.",
      map: "Картата е налична само на хартиена карта на гише 7.",
      winner: "Поздравления! Спечелихте право да попълните още един формуляр.",
      reader: "PDF Reader 6 изисква PDF Reader 5, който изисква дискета.",
      toolbar: "Лентата за браузъра беше инсталирана мислено.",
      birth: "Услугата е временно неродена.",
      address: "Бъдещият Ви адрес все още не отговаря.",
      tree: "Първо приложете снимка на липсващото дърво.",
      stamp: "Заверката се заверява само след презаверяване.",
      email: "Съобщението не беше изпратено успешно. Благодарим!"
    };
    toast(messages[button.dataset.popup] || "Услугата е преместена в несъществуващ раздел.");
  }));

  let trailTick = 0;
  document.addEventListener("pointermove", (event) => {
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (state.videoActivated && !state.calm && !reducedMotion) {
      const rect = $("#trollVideo").getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const awayX = centerX - event.clientX;
      const awayY = centerY - event.clientY;
      const distance = Math.hypot(awayX, awayY);
      if (distance < 135 && distance > 0) {
        state.videoVx = (awayX / distance) * 165;
        state.videoVy = (awayY / distance) * 165;
        $("#videoStatus").textContent = "Не ме докосвайте, това е служебен екран!";
      }

      const teacherRect = $("#teacherFace").getBoundingClientRect();
      const teacherCenterX = teacherRect.left + teacherRect.width / 2;
      const teacherCenterY = teacherRect.top + teacherRect.height / 2;
      const teacherAwayX = teacherCenterX - event.clientX;
      const teacherAwayY = teacherCenterY - event.clientY;
      const teacherDistance = Math.hypot(teacherAwayX, teacherAwayY);
      if (teacherDistance < 125 && teacherDistance > 0) {
        state.teacherVx = (teacherAwayX / teacherDistance) * 178;
        state.teacherVy = (teacherAwayY / teacherDistance) * 178;
        $("#teacherStatus").textContent = "Не пипайте дежурния учител!";
      }
    }
    if (state.calm || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    trailTick += 1;
    if (trailTick % 8 !== 0) return;
    const dot = document.createElement("span");
    dot.className = "cursor-trail";
    dot.style.left = `${event.clientX - 3}px`;
    dot.style.top = `${event.clientY - 3}px`;
    document.body.append(dot);
    window.setTimeout(() => dot.remove(), 700);
  });

  const visitor = 8471 + Math.floor(Math.random() * 29);
  $("#visitorCounter").textContent = String(visitor).padStart(6, "0");
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && state.videoActivated && !state.calm) playTrollVideo();
  });
  refreshCaptcha();
})();
