// Lead form submission
  // ⚠️ Заміни на реальний URL твого задеплоєного Cloudflare Worker
  const ENDPOINT_URL = 'https://nova-cyfra.develop-olegch.workers.dev';
  const leadForm = document.getElementById('leadForm');
  const leadStatus = document.getElementById('leadStatus');

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