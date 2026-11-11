(function () {
  'use strict';

  var cfg = window.KALENDARIA || {};
  var THEME_KEY = 'kalendaria:landing-theme';
  var root = document.documentElement;

  /* ---------- Utilidades ---------- */
  function $(selector, scope) { return (scope || document).querySelector(selector); }
  function $all(selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); }
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function capitalize(value) { return value.charAt(0).toLocaleUpperCase('es') + value.slice(1); }
  function safeStorage(action) { try { return action(); } catch (error) { return null; } }

  var toastTimer;
  function toast(message) {
    var node = $('#toast');
    node.textContent = message;
    node.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { node.classList.remove('is-visible'); }, 2200);
  }

  /* ---------- Configuración (descarga, versión, enlaces) ---------- */
  function applyConfig() {
    $all('[data-version]').forEach(function (n) { n.textContent = cfg.version || ''; });
    $all('[data-min-android]').forEach(function (n) { n.textContent = cfg.minAndroid || '8.0'; });

    if (cfg.apkSize && $('[data-size]')) {
      $('[data-row="size"]').hidden = false;
      $('[data-size]').textContent = cfg.apkSize;
    }
    if (cfg.sha256 && $('[data-hash]')) {
      $('[data-row="hash"]').hidden = false;
      $('[data-hash]').textContent = cfg.sha256;
    }

    var hasApk = Boolean(cfg.apkUrl);
    $all('[data-apk-link]').forEach(function (link) {
      if (hasApk) {
        link.setAttribute('href', cfg.apkUrl);
        link.setAttribute('download', 'kalendaria.apk');
        link.setAttribute('rel', 'noopener');
      } else {
        link.setAttribute('aria-disabled', 'true');
        link.setAttribute('tabindex', '-1');
        link.removeAttribute('href');
      }
    });
    if (!hasApk) {
      $all('[data-apk-label]').forEach(function (n) { n.textContent = 'Disponible muy pronto'; });
    }

    var hasPlay = Boolean(cfg.playStoreUrl);
    var playLink = $('[data-play-link]');
    var playSoon = $('[data-play-soon]');
    if (hasPlay && playLink && playSoon) {
      playLink.hidden = false;
      playLink.setAttribute('href', cfg.playStoreUrl);
      playLink.setAttribute('rel', 'noopener');
      playSoon.hidden = true;
    }

    $all('[data-link]').forEach(function (link) {
      var url = cfg[link.getAttribute('data-link') + 'Url'];
      if (url) { link.setAttribute('href', url); } else { link.hidden = true; }
    });
    var year = $('#year');
    if (year) year.textContent = new Date().getFullYear();

    var contact = $('[data-contact]');
    if (contact && cfg.contactEmail) {
      contact.setAttribute('href', 'mailto:' + cfg.contactEmail);
      contact.textContent = cfg.contactEmail;
    }
  }

  function copyWithFallback(value) {
    var area = el('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (error) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  function setupCopyHash() {
    var button = $('#copy-hash');
    if (!button) return;
    button.addEventListener('click', function () {
      var value = cfg.sha256 || '';
      if (!value) return;
      var done = function () { toast('Huella copiada'); };
      var fail = function () { toast(copyWithFallback(value) ? 'Huella copiada' : 'No se pudo copiar'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done, fail);
      } else {
        fail();
      }
    });
  }

  /* ---------- Tema: claro / oscuro / sistema ---------- */
  function currentPreference() {
    var saved = safeStorage(function () { return localStorage.getItem(THEME_KEY); });
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  }
  function applyPreference(preference) {
    if (preference === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', preference);
    $all('[data-theme-option]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-theme-option') === preference));
    });
  }
  function setupTheme() {
    applyPreference(currentPreference());
    $all('[data-theme-option]').forEach(function (button) {
      button.addEventListener('click', function () {
        var preference = button.getAttribute('data-theme-option');
        safeStorage(function () {
          if (preference === 'system') localStorage.removeItem(THEME_KEY);
          else localStorage.setItem(THEME_KEY, preference);
        });
        applyPreference(preference);
      });
    });
  }

  /* ---------- Demo del calendario (datos de ejemplo, semana desde lunes) ---------- */
  var CATEGORY_LABELS = { reunion: 'Reunión', pendiente: 'Pendiente', trabajo: 'Trabajo', personal: 'Personal', otro: 'Otro' };
  var SAMPLE = [
    ['Reunión de equipo', 'reunion', 'Revisar objetivos de la semana.'],
    ['Enviar informe mensual', 'pendiente', 'Antes de las 17:00.'],
    ['Preparar presentación', 'trabajo', ''],
    ['Cena con la familia', 'personal', 'Reservar mesa para cuatro.'],
    ['Llamar al proveedor', 'pendiente', ''],
    ['Cita médica', 'personal', 'Llevar análisis.'],
    ['Revisión de presupuesto', 'trabajo', 'Con finanzas.'],
    ['Renovar suscripción', 'otro', ''],
    ['Reunión con cliente', 'reunion', 'Sala B.'],
  ];
  var today = new Date();
  var view = new Date(today.getFullYear(), today.getMonth(), 1);
  var selected = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  function keyOf(date) { return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate(); }

  // Determinista por fecha: la misma fecha siempre muestra las mismas actividades de ejemplo.
  function activitiesFor(date) {
    var seed = keyOf(date) % 97;
    var count = [0, 0, 1, 0, 2, 0, 1, 3, 0, 1, 0, 2][seed % 12];
    var list = [];
    for (var i = 0; i < count; i += 1) list.push(SAMPLE[(seed + i * 4) % SAMPLE.length]);
    return list;
  }

  function sameDay(a, b) { return keyOf(a) === keyOf(b); }

  function renderCalendar() {
    var title = capitalize(new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(view).replace(' de ', ' '));
    $('#demo-title').textContent = title;

    var first = new Date(view.getFullYear(), view.getMonth(), 1);
    var offset = (first.getDay() + 6) % 7; // lunes = 0
    var start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
    var grid = $('#demo-days');
    grid.textContent = '';

    for (var i = 0; i < 42; i += 1) {
      var date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      var list = activitiesFor(date);
      var button = el('button', 'day');
      button.type = 'button';
      if (date.getMonth() !== view.getMonth()) button.classList.add('is-out');
      if (sameDay(date, today)) button.classList.add('is-today');
      if (sameDay(date, selected)) {
        button.classList.add('is-selected');
        button.setAttribute('aria-pressed', 'true');
      } else {
        button.setAttribute('aria-pressed', 'false');
      }

      var spoken = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(date);
      button.setAttribute('aria-label', list.length ? spoken + ', ' + list.length + (list.length === 1 ? ' actividad' : ' actividades') : spoken);
      button.appendChild(el('span', '', String(date.getDate())));

      var dots = el('span', 'day-dots');
      var shown = list.slice(0, 3);
      shown.forEach(function (item) { dots.appendChild(el('i', 'dot cat-' + item[1])); });
      if (list.length > 3) dots.appendChild(el('span', 'small', '+' + (list.length - 3)));
      button.appendChild(dots);

      (function (chosen) {
        button.addEventListener('click', function () {
          selected = chosen;
          if (chosen.getMonth() !== view.getMonth()) view = new Date(chosen.getFullYear(), chosen.getMonth(), 1);
          renderCalendar();
        });
      })(date);

      grid.appendChild(button);
    }
    renderDetail();
  }

  function renderDetail() {
    var box = $('#demo-detail');
    box.textContent = '';
    var heading = capitalize(new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(selected));
    var list = activitiesFor(selected);

    box.appendChild(el('p', 'h3', heading));
    box.appendChild(el('p', 'caption muted', list.length === 1 ? '1 actividad' : list.length + ' actividades'));

    if (list.length === 0) {
      var empty = el('div', 'empty');
      empty.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>';
      empty.appendChild(el('p', 'caption', 'No hay actividades para este día'));
      box.appendChild(empty);
      return;
    }

    list.forEach(function (item) {
      var card = el('article', 'act-card cat-' + item[1]);
      card.appendChild(el('div', 'act-bar'));
      var body = el('div', 'act-body');
      body.appendChild(el('p', 'body-strong', item[0]));
      if (item[2]) body.appendChild(el('p', 'caption muted', item[2]));
      body.appendChild(el('span', 'badge small', CATEGORY_LABELS[item[1]]));
      card.appendChild(body);
      box.appendChild(card);
    });
  }

  function setupDemo() {
    $('#demo-prev').addEventListener('click', function () {
      view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
      renderCalendar();
    });
    $('#demo-next').addEventListener('click', function () {
      view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
      renderCalendar();
    });
    renderCalendar();
  }

  /* ---------- Cabecera, navegación activa y entrada de secciones ---------- */
  function setupScroll() {
    var header = $('#header');
    if (header) {
      var onScroll = function () { header.classList.toggle('is-stuck', window.scrollY > 8); };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    var links = $all('.nav a');
    if ('IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            link.setAttribute('aria-current', String(link.getAttribute('href') === '#' + entry.target.id));
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      links.forEach(function (link) {
        var target = $(link.getAttribute('href'));
        if (target) spy.observe(target);
      });

      var reveal = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add('is-in'); reveal.unobserve(entry.target); }
        });
      }, { threshold: 0.12 });
      $all('.reveal').forEach(function (node) { reveal.observe(node); });
    } else {
      $all('.reveal').forEach(function (node) { node.classList.add('is-in'); });
    }
  }

  applyConfig();
  setupCopyHash();
  setupTheme();
  if ($('#demo')) setupDemo();
  setupScroll();
})();
