// ===== Детект Safari (для обхода багов IntersectionObserver) =====
const isSafari = navigator.userAgent.includes('Safari') 
              && !navigator.userAgent.includes('Chrome') 
              && !navigator.userAgent.includes('CriOS');

// ===== Плавный скролл к якорям (easing + отмена при взаимодействии) =====
(function(){
  const links = document.querySelectorAll('a[href^="#"]:not([href="#"])');
  const easeInOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;

  function smoothScrollTo(targetY, duration = 600) {
    const startY = window.pageYOffset;
    const diff = targetY - startY;
    let start;

    const abort = () => cancelAnimationFrame(raf);
    const onUserInput = () => abort();
    window.addEventListener('wheel', onUserInput, {passive:true, once:true});
    window.addEventListener('touchstart', onUserInput, {passive:true, once:true});
    window.addEventListener('keydown', onUserInput, {passive:true, once:true});

    let raf;
    function step(ts) {
      if(!start) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const eased = easeInOutSine(t);
      window.scrollTo(0, startY + diff * eased);
      if(t < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
  }

let __scrollTick;
window.addEventListener('scroll', () => {
  document.body.classList.add('scrolling');
  clearTimeout(__scrollTick);
  __scrollTick = setTimeout(() => document.body.classList.remove('scrolling'), 140);
}, { passive: true });


  links.forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if(!id.startsWith('#')) return;
      const el = document.querySelector(id);
      if(!el) return;
      e.preventDefault();
      const header = document.querySelector('.site-header');
      const offset = (header?.offsetHeight || 0) + 8;
      const y = Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - offset);
      smoothScrollTo(y, 650);
    });
  });
})();

// ===== Reveal-on-scroll (IntersectionObserver) =====
(function(){
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || els.length === 0) {
    // Fallback: если IO нет — показываем сразу (без анимации)
    els.forEach(el => el.classList.add('is-visible'));
    return;
  }

  // FIX: более «мягкие» настройки для iOS/Safari
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if(en.isIntersecting) {
        en.target.classList.add('is-visible');
        obs.unobserve(en.target);
      }
    });
  }, {
    threshold: 0,          // было .12 — на iOS иногда не срабатывало
    rootMargin: '0px'      // было '0px 0px -10% 0px' — могло «проваливать» элементы
  });

  // FIX: небольшая задержка подписки помогает Safari
  const attach = () => els.forEach(el => io.observe(el));
  isSafari ? setTimeout(attach, 100) : attach();
})();

// ===== Видео в hero: автозапуск/пауза в зависимости от видимости =====
(function(){
  const vid = document.querySelector('.hero-video');
  if(!vid) return;

  // Страхуем атрибуты автоплея на iOS
  vid.muted = true;
  vid.playsInline = true;
  vid.autoplay = true;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if(en.isIntersecting) {
        vid.play().catch(()=>{});
      } else {
        vid.pause();
      }
    });
  }, { threshold: 0.25 });
  io.observe(vid);
})();
// === Отложенное раскрытие секций "О компании" и "Технология качества" ===
document.addEventListener('DOMContentLoaded', () => {
  const about   = document.getElementById('about');
  const quality = document.getElementById('quality');
  if (!about || !quality) return;

  // Если JS есть — убираем no-js (в CSS для фолбэка)
  document.documentElement.classList.remove('no-js');

  function revealAboutSections(scrollToAbout = true) {
    [about, quality].forEach(sec => {
      sec.hidden = false;                         // ВАЖНО: снимаем hidden
      sec.classList.add('is-shown');              // запускаем анимацию
      sec.setAttribute('aria-hidden', 'false');
    });
    if (scrollToAbout) {
      setTimeout(() => {
        about.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 30);
    }
  }

  // Кнопка в hero
  const btnMore = document.getElementById('btnMoreAbout');
  if (btnMore) {
    btnMore.addEventListener('click', (e) => {
      e.preventDefault();
      revealAboutSections(true);
      history.pushState(null, '', '#about');
    });
  }

  // Пункт бургер-меню
  document.querySelectorAll('[data-reveal="about"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();                         // перехватываем даже если href="#about"
      revealAboutSections(true);
      history.pushState(null, '', '#about');
      // если у тебя есть функция закрытия меню — вызови её:
      if (typeof closeMenu === 'function') closeMenu();
    });
  });

  // Если пришли сразу с #about — раскрываем автоматически
  if (location.hash === '#about') {
    revealAboutSections(false);
  }
});

// ===== Бургер-меню =====
(function(){
  const burger = document.querySelector('.burger');
  const panel  = document.querySelector('.nav-mobile');
  if(!burger || !panel) return;

  function closeMenu(){
    burger.classList.remove('active');
    panel.classList.remove('open');
  }

  burger.addEventListener('click', (e) => {
    e.stopPropagation();
    burger.classList.toggle('active');
    panel.classList.toggle('open');
  });

  // Закрытие по клику по ссылке, вне панели, и по Esc
  panel.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') closeMenu();
  });
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !burger.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
})();

// Динамическая позиция свечения эффекта при наведении на карточки
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
});

// Рябь по заголовку CTA (необязательно, декоративный эффект)
const press = document.getElementById('cta-questions');
if (press) {
  press.addEventListener('click', (e) => {
    const r = document.createElement('span');
    r.className = 'r';
    const rect = press.getBoundingClientRect();
    r.style.left = (e.clientX - rect.left) + 'px';
    r.style.top  = (e.clientY - rect.top)  + 'px';
    press.appendChild(r);
    setTimeout(() => r.remove(), 600);
  });
}

// ===== Плавный скролл к элементу (для кнопки "вверх") =====
function smoothScrollTo(el) {
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ==== ВЕРТИКАЛЬНЫЙ КАТАЛОГ С АНИМАЦИЯМИ ==== */
let CATALOG_DATA = {};

// 1. Загружаем JSON данных каталога
async function loadCatalogData() {
  try {
    // FIX: отключаем кэш чтобы при локальном тесте/обновлениях данные не залипали
    const res = await fetch('assets/data/catalog.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Ошибка загрузки JSON: ' + res.status);
    CATALOG_DATA = await res.json();
  } catch (err) {
    console.error('Не удалось загрузить каталог:', err);
    // Не падаем — просто оставим пустой каталог
    CATALOG_DATA = {};
  }
}

// 2. Инициализация каталога
async function initCatalog() {
  await loadCatalogData();

  const colorsSection = document.getElementById('colors');
  const catalogSection = document.getElementById('catalog');
  const catalogTitle = document.getElementById('catalogTitle');
  const catalogToneEl = document.getElementById('catalogTone');
  const vlist = document.getElementById('vlist');
  const vlistBack = document.getElementById('vlistBack');

  if (!colorsSection || !catalogSection || !vlist) return;

  // === Рендер слайдов ===
  function renderVertical(tone) {
    const items = CATALOG_DATA[tone] || [];
    vlist.innerHTML = '';

    items.forEach((it, i) => {
      const el = document.createElement('article');
      el.className = 'vslide ' + (i % 2 ? 'vslide--right' : 'vslide--left');

      // HTML карточки с <picture> + lazy + async
      el.innerHTML = `
  <div class="vslide__media">
    <img
      src="${it.img}"
      alt="${it.title || ''}"
      width="${it.w || 1600}"
      height="${it.h || 1200}"
      loading="lazy"
      decoding="async"
      fetchpriority="low"
      sizes="(max-width: 768px) 90vw, 720px"
      style="max-width:100%;height:auto;object-fit:contain;"
    >
  </div>

  <div class="vslide__caption">
    <h3>${it.title || ''}</h3>
    <p>${it.desc || ''}</p>

    <div class="buy-line">
      <span class="buy-label">Купить на:</span>

      <a class="mkt-badge ozon mkt-badge--sm"
         href="${(it.ozon && it.ozon.trim()) || 'https://www.ozon.ru/seller/mechta-265376/products/?miniapp=seller_265376'}"
         target="_blank" rel="noopener">
        <img src="assets/market/ozon-logo.png" alt="Ozon" loading="lazy">
        Ozon
      </a>

      <a class="mkt-badge wb mkt-badge--sm"
         href="${(it.wb && it.wb.trim()) || 'https://www.wildberries.ru/seller/645350'}"
         target="_blank" rel="noopener">
        <img src="assets/market/wb-logo.png" alt="Wildberries" loading="lazy">
        Wildberries
      </a>
    </div>
  </div>`;

      vlist.appendChild(el);
      // После отрисовки карточек: убрать случайные внутренние скроллы, если стили переопределены не везде
      vlist.querySelectorAll('.vslide, .vslide__media, .vslide__caption').forEach(n => {
      n.style.overflowY = 'visible';
      n.style.maxHeight = 'none';
});
    });

    catalogToneEl && (catalogToneEl.textContent = (tone || '').toUpperCase());
    catalogSection.hidden = false;
    catalogSection.setAttribute('aria-hidden', 'false');
    catalogTitle && (catalogTitle.hidden = false);

    // Прокрутка к началу каталога
    catalogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // FIX: задержка перед подпиской IO — помогает Safari не «терять» элементы
    setTimeout(() => {
      initReveal();
      trackLastSlide();
    }, 60);
  }// === Анимация появления слайдов каталога ===
  function initReveal() {
    const slides = vlist.querySelectorAll('.vslide');
    if (!('IntersectionObserver' in window)) {
      slides.forEach(s => s.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          obs.unobserve(en.target);
        }
      });
    }, { 
      threshold: 0,        // FIX: было .15
      rootMargin: '0px'    // FIX: без отрицательных маргинов
    });

    const attach = () => slides.forEach(s => io.observe(s));
    isSafari ? setTimeout(attach, 100) : attach();
  }

  // === Показ кнопки ↑ при достижении последнего слайда ===
  function trackLastSlide() {
    const last = vlist.lastElementChild;
    if (!last || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver((entries) => {
      const en = entries[0];
      vlistBack && vlistBack.classList.toggle('show', !!en?.isIntersecting);
    }, { threshold: 0 });

    isSafari ? setTimeout(() => io.observe(last), 100) : io.observe(last);
  }

  // === Кнопка "вверх" (возврат к цветам) ===
  if (vlistBack) {
    vlistBack.addEventListener('click', () => {
      colorsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // === Клик по карточке цвета (открытие каталога) ===
  document.querySelectorAll('#colors .cards .card[data-tone]').forEach(card => {
    card.addEventListener('click', () => {
      renderVertical(card.dataset.tone);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Инициализация каталога
  initCatalog();

  // ===== Стрелка "вниз" (скролл к каталогу) =====
  const go = document.querySelector('.scroll-down');
  if (go) {
    go.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector('#colors');
      if (target) {
        const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  }
  
});
// === Отложенное раскрытие секций "О компании" и "Технология качества" ===
document.addEventListener('DOMContentLoaded', () => {
  const about   = document.getElementById('about');
  const quality = document.getElementById('quality');
  if (!about || !quality) return;

  // Если JS есть — убираем no-js (в CSS для фолбэка)
  document.documentElement.classList.remove('no-js');

  function revealAboutSections(scrollToAbout = true) {
    [about, quality].forEach(sec => {
      sec.hidden = false;                         // ВАЖНО: снимаем hidden
      sec.classList.add('is-shown');              // запускаем анимацию
      sec.setAttribute('aria-hidden', 'false');
    });
    if (scrollToAbout) {
      setTimeout(() => {
        about.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 30);
    }
  }

  // Кнопка в hero
  const btnMore = document.getElementById('btnMoreAbout');
  if (btnMore) {
    btnMore.addEventListener('click', (e) => {
      e.preventDefault();
      revealAboutSections(true);
      history.pushState(null, '', '#about');
    });
  }

  // Пункт бургер-меню
  document.querySelectorAll('[data-reveal="about"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();                         // перехватываем даже если href="#about"
      revealAboutSections(true);
      history.pushState(null, '', '#about');
      // если у тебя есть функция закрытия меню — вызови её:
      if (typeof closeMenu === 'function') closeMenu();
    });
  });

  // Если пришли сразу с #about — раскрываем автоматически
  if (location.hash === '#about') {
    revealAboutSections(false);
  }
});
/* ===== Сопутствующие товары: данные + рендер ===== */
async function loadAccessoriesData() {
  try {
    const res = await fetch('assets/data/accessories.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('accessories.json not found');
    return await res.json();
  } catch (e) {
    console.error('Не удалось загрузить аксессуары:', e);
    return [];
  }
}

function renderAccessories(items) {
  const wrap = document.getElementById('accList');
  if (!wrap) return;
  wrap.innerHTML = '';

  const frag = document.createDocumentFragment();

  items.forEach(it => {
    const card = document.createElement('article');
    card.className = 'acc-card';
    card.setAttribute('role','listitem');

    // плашка (если есть)
    const badge = it.badge ? 
      `<span class="acc-badge ${it.badgeClass || ''}">${it.badge}</span>` : '';

    // для устранения сдвигов layout указываем width/height (если знаешь реальные — подставь)
    const wh = it.wh || { w: 800, h: 1000 }; // пропорция 4:5 по умолчанию

    card.innerHTML = `
      ${badge}
      <div class="acc-card__media">
        <img src="${it.img}" alt="${it.title || ''}"
             loading="lazy" decoding="async"
             width="${wh.w}" height="${wh.h}">
      </div>
      <div class="acc-card__body">
        <h3 class="acc-card__title">${it.title || ''}</h3>
        <p class="acc-card__desc">${it.desc || ''}</p>

        <div class="buy-line">
          <span class="buy-label">Купить на:</span>
          <a class="mkt-badge ozon mkt-badge--sm"
             href="${(it.ozon && it.ozon.trim()) || 'https://www.ozon.ru/seller/mechta-265376/products/?miniapp=seller_265376'}"
             target="_blank" rel="noopener">
            <img src="assets/market/ozon-logo.png" alt="Ozon" loading="lazy"> Ozon
          </a>
          <a class="mkt-badge wb mkt-badge--sm"
             href="${(it.wb && it.wb.trim()) || 'https://www.wildberries.ru/seller/645350'}"
             target="_blank" rel="noopener">
            <img src="assets/market/wb-logo.png" alt="Wildberries" loading="lazy"> Wildberries
          </a>
        </div>
      </div>`;

    frag.appendChild(card);
  });

  wrap.appendChild(frag);

  // лёгкое появление, если у тебя уже есть reveal — он сработает по классу .reveal на секции
}

/* Инициализация аксессуаров после загрузки DOM */
document.addEventListener('DOMContentLoaded', async () => {
  const data = await loadAccessoriesData();
  renderAccessories(data);
});

