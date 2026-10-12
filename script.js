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
    finalizing: false
  };

  document.addEventListener("click", () => { state.clicks += 1; });

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
    state.step = Math.max(1, Math.min(5, nextStep));
    $$(".form-step").forEach((panel) => panel.classList.toggle("active", Number(panel.dataset.step) === state.step));
    $$("[data-step-indicator]").forEach((indicator) => {
      const value = Number(indicator.dataset.stepIndicator);
      indicator.classList.toggle("active", value === state.step);
      indicator.classList.toggle("done", value < state.step);
    });
    document.body.className = document.body.className.replace(/chaos-\d/g, "").trim();
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
    state.tricks += 1;
    $("#soundButton").textContent = `♫ Намален на ${Math.round(state.soundLevel * 500)}%`;
    beep(760, 0.1);
    toast("Звукът беше намален нагоре.");
  });

  $("#panicButton").addEventListener("click", () => {
    state.calm = !state.calm;
    document.body.classList.toggle("calm", state.calm);
    $("#panicButton").textContent = state.calm ? "ВЪРНИ ДОСАДАТА" : "АВАРИЕН ИЗХОД";
    if (state.calm) {
      $$(".modal-layer").forEach((modal) => modal.classList.add("hidden"));
      $("#surveyNo").style.transform = "none";
      toast("Безопасен режим: движенията и капаните са спрени.");
    } else {
      toast("Досадният режим отново е активен. Защо?");
    }
  });

  $("#searchButton").addEventListener("click", () => {
    const field = $("#siteSearch");
    field.value = field.value === "търси..." ? "Намерени 0 от 1 резултата" : "търси...";
    toast("Търсенето приключи, преди да започне.");
  });

  $$('[data-wrong-nav]').forEach((button) => button.addEventListener("click", () => {
    const destination = button.dataset.wrongNav;
    state.tricks += 1;
    if (destination === "footer") $("#footer").scrollIntoView({ behavior: "smooth" });
    else if (destination === "forward") setStep(state.step + 1);
    else if (destination === "news") $("#application").scrollIntoView({ behavior: "smooth" });
    else if (destination === "contacts") $("#news").scrollIntoView({ behavior: "smooth" });
    else toast("Разделът е преместен на мястото, на което вече се намирате.");
  }));

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
      showMessage("#step5Message", "Трябва да потвърдите непотвърдените данни, преди да ги потвърдите.");
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
    document.body.classList.add("victory-mode", "calm");
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
      map: "Картата е налична само на хартиена карта на гише 7."
    };
    toast(messages[button.dataset.popup]);
  }));

  let trailTick = 0;
  document.addEventListener("pointermove", (event) => {
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
  refreshCaptcha();
})();
