  // Lead form submission
  // ⚠️ Заміни на реальний URL твого задеплоєного Cloudflare Worker
  const ENDPOINT_URL = 'https://nova-cyfra.develop-olegch.workers.dev';
  const leadForm = document.getElementById('leadForm');
  const leadStatus = document.getElementById('leadStatus');
  if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = leadForm.querySelector('button[type="submit"]');
      const payload = {
        name: document.getElementById('leadName').value.trim(),
        phone: document.getElementById('leadPhone').value.trim(),
        message: document.getElementById('leadMessage').value.trim(),
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
