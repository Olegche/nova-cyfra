// Lead form submission
  // ⚠️ Заміни на реальний URL твого задеплоєного Cloudflare Worker
  const ENDPOINT_URL = 'https://nova-cyfra.develop-olegch.workers.dev';
  const leadForm = document.getElementById('leadForm');
  const leadStatus = document.getElementById('leadStatus');
  const COOLDOWN_MS = 60 * 1000; // 60 секунд між відправками з цього браузера

  function getRemainingCooldown() {
    const last = parseInt(localStorage.getItem('leadFormLastSubmit') || '0', 10);
    const remaining = COOLDOWN_MS - (Date.now() - last);
    return remaining > 0 ? remaining : 0;
  }

  // --- Метадані про відвідувача (пристрій, джерело, перший/повторний візит) ---
  function detectDevice() {
    const ua = navigator.userAgent;
    if (/tablet|ipad/i.test(ua)) return 'Планшет';
    if (/mobile|android|iphone/i.test(ua)) return 'Мобільний';
    return 'Десктоп';
  }

  function detectOS() {
    const ua = navigator.userAgent;
    if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
    if (/android/i.test(ua)) return 'Android';
    if (/windows/i.test(ua)) return 'Windows';
    if (/mac os x/i.test(ua)) return 'macOS';
    if (/linux/i.test(ua)) return 'Linux';
    return 'Невідомо';
  }

  function detectBrowser() {
    const ua = navigator.userAgent;
    if (/edg\//i.test(ua)) return 'Edge';
    if (/opr\//i.test(ua) || /opera/i.test(ua)) return 'Opera';
    if (/chrome|crios/i.test(ua) && !/edg\//i.test(ua)) return 'Chrome';
    if (/firefox|fxios/i.test(ua)) return 'Firefox';
    if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) return 'Safari';
    return 'Невідомо';
  }

  function getSource() {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    if (utmSource) return utmSource;
    if (!document.referrer) return 'Прямий перехід';
    try {
      const refHost = new URL(document.referrer).hostname;
      if (refHost.includes(window.location.hostname)) return 'Прямий перехід';
      return refHost;
    } catch {
      return 'Прямий перехід';
    }
  }

  function isFirstVisit() {
    const visited = localStorage.getItem('novaTsyfraVisited');
    if (!visited) {
      localStorage.setItem('novaTsyfraVisited', '1');
      return true;
    }
    return false;
  }
  // Фіксуємо статус візиту одразу при завантаженні сторінки (а не при відправці форми),
  // щоб коректно визначити "перший раз" незалежно від того, чи заповнить людина форму
  const visitorIsFirstTime = isFirstVisit();

  // --- Валідація полів ---
  const nameInput = document.getElementById('leadName');
  const phoneInput = document.getElementById('leadPhone');
  const messageInput = document.getElementById('leadMessage');
  const nameError = document.getElementById('leadNameError');
  const phoneError = document.getElementById('leadPhoneError');
  const messageError = document.getElementById('leadMessageError');

  const NAME_RE = /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ'’\- ]{2,60}$/;

  // Нормалізує телефон до формату +380XXXXXXXXX, повертає null якщо невалідний
  function normalizePhone(raw) {
    const digits = raw.replace(/[^\d+]/g, '');
    let d = digits.replace(/\+/g, '');
    if (d.startsWith('380') && d.length === 12) return '+' + d;
    if (d.startsWith('0') && d.length === 10) return '+38' + d;
    if (d.startsWith('80') && d.length === 11) return '+3' + d;
    return null;
  }

  function setFieldState(input, errorEl, message) {
    if (message) {
      input.classList.add('invalid');
      input.classList.remove('valid');
      errorEl.textContent = message;
      return false;
    } else {
      input.classList.remove('invalid');
      input.classList.add('valid');
      errorEl.textContent = '';
      return true;
    }
  }

  function validateName() {
    const v = nameInput.value.trim();
    if (!v) return setFieldState(nameInput, nameError, "Вкажіть ім'я");
    if (!NAME_RE.test(v)) return setFieldState(nameInput, nameError, 'Тільки літери, мінімум 2 символи');
    return setFieldState(nameInput, nameError, '');
  }

  function validatePhone() {
    const v = phoneInput.value.trim();
    if (!v) return setFieldState(phoneInput, phoneError, 'Вкажіть телефон');
    if (!normalizePhone(v)) return setFieldState(phoneInput, phoneError, 'Формат: +380 XX XXX XX XX або 0XX XXX XX XX');
    return setFieldState(phoneInput, phoneError, '');
  }

  function validateMessage() {
    const v = messageInput.value.trim();
    if (v.length > 500) return setFieldState(messageInput, messageError, 'Максимум 500 символів');
    return setFieldState(messageInput, messageError, '');
  }

  if (nameInput) {
    nameInput.addEventListener('blur', validateName);
    nameInput.addEventListener('input', () => { if (nameInput.classList.contains('invalid')) validateName(); });
    phoneInput.addEventListener('blur', validatePhone);
    phoneInput.addEventListener('input', () => { if (phoneInput.classList.contains('invalid')) validatePhone(); });
    messageInput.addEventListener('input', validateMessage);
  }

  if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const cooldown = getRemainingCooldown();
      if (cooldown > 0) {
        leadStatus.textContent = `Зачекайте ще ${Math.ceil(cooldown / 1000)} сек. перед повторною відправкою.`;
        return;
      }

      const isNameValid = validateName();
      const isPhoneValid = validatePhone();
      const isMessageValid = validateMessage();
      if (!isNameValid || !isPhoneValid || !isMessageValid) {
        leadStatus.textContent = 'Перевірте поля, позначені червоним.';
        (!isNameValid ? nameInput : !isPhoneValid ? phoneInput : messageInput).focus();
        return;
      }

      const submitBtn = leadForm.querySelector('button[type="submit"]');
      const payload = {
        name: nameInput.value.trim(),
        phone: normalizePhone(phoneInput.value.trim()),
        message: messageInput.value.trim(),
        device: detectDevice(),
        os: detectOS(),
        browser: detectBrowser(),
        source: getSource(),
        firstVisit: visitorIsFirstTime,
      };
      submitBtn.disabled = true;
      leadStatus.textContent = 'Надсилаємо…';
      try {
        const res = await fetch(ENDPOINT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.ok) {
          leadStatus.textContent = 'Дякуємо! Ми зв\'яжемось найближчим часом.';
          localStorage.setItem('leadFormLastSubmit', Date.now().toString());
          leadForm.reset();
          [nameInput, phoneInput, messageInput].forEach(el => el.classList.remove('valid', 'invalid'));
        } else {
          leadStatus.textContent = data.error || 'Щось пішло не так. Спробуйте ще раз.';
        }
      } catch (err) {
        leadStatus.textContent = 'Помилка з\'єднання. Спробуйте пізніше або напишіть у Telegram.';
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // Theme toggle — always starts in light mode; dark only via manual click
  const html = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const THEME_COLORS = {
    light: { bg: '#F6F8FB', ink: '#12213E' },
    dark:  { bg: '#0B1220', ink: '#EAF0FA' }
  };
  function setTheme(theme){
    html.setAttribute('data-theme', theme);
    themeToggle.setAttribute('aria-pressed', theme === 'dark');
    const c = THEME_COLORS[theme];
    html.style.backgroundColor = c.bg;
    document.body.style.backgroundColor = c.bg;
    document.body.style.color = c.ink;
  }
  setTheme('light');
  themeToggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(next);
  });

  // Mobile menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const navList = document.getElementById('navList');
  menuToggle.addEventListener('click', () => {
    const open = navList.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', open);
  });

  // "After" checklist reveal (respects reduced motion)
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const orderList = document.getElementById('orderList');
  if (orderList) {
    const items = orderList.querySelectorAll('.order-item');
    if (prefersReduced) {
      items.forEach(item => item.classList.add('show'));
    } else {
      const orderObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            items.forEach((item, i) => {
              setTimeout(() => item.classList.add('show'), i * 120);
            });
            orderObserver.disconnect();
          }
        });
      }, { threshold: 0.3 });
      orderObserver.observe(orderList);
    }
  }

  // Scroll reveal
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (prefersReduced) {
    revealEls.forEach(el => el.classList.add('in-view'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => revealObserver.observe(el));
  }