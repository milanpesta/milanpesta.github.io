(function () {
  'use strict';

  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');
  var themeColor = document.getElementById('theme-color');

  function setTheme(theme, save) {
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }

    if (themeColor) {
      themeColor.setAttribute('content', theme === 'light' ? '#fbfaf7' : '#1e2330');
    }

    if (toggle) {
      var next = theme === 'light' ? 'dark' : 'light';
      toggle.setAttribute('aria-label', 'Switch to ' + next + ' theme');
      toggle.setAttribute('title', 'Switch to ' + next + ' theme');
    }

    if (save) {
      try {
        localStorage.setItem('mp-theme', theme);
      } catch (error) {}
    }
  }

  function currentTheme() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  setTheme(currentTheme(), false);

  if (toggle) {
    toggle.addEventListener('click', function () {
      setTheme(currentTheme() === 'light' ? 'dark' : 'light', true);
    });
  }

  window.addEventListener('storage', function (event) {
    if (event.key === 'mp-theme' && (event.newValue === 'light' || event.newValue === 'dark')) {
      setTheme(event.newValue, false);
    }
  });

  function initHero() {
    var hero = document.querySelector('.hero-copy');
    if (!hero) return;

    var fontReady = document.fonts && document.fonts.load
      ? document.fonts.load('400 1em Fraunces')
      : Promise.resolve();

    var released = false;
    function releaseHero() {
      if (released) return;
      released = true;
      clearTimeout(timeout);
      hero.classList.add('hero-ready');
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      var animation = hero.animate([
        { transform: 'translateY(-2.5rem)' },
        { transform: 'translateY(0)' }
      ], {
        duration: 800,
        easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        fill: 'both'
      });
      animation.onfinish = function () {
        animation.cancel();
      };
    }

    var timeout = setTimeout(releaseHero, 1200);
    fontReady.then(releaseHero).catch(releaseHero);
  }

  function initCvFlow() {
    if (!document.body.classList.contains('cv')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var margin = 8;
    var pending = Array.prototype.slice.call(document.querySelectorAll(
      '.cv main section > h2, .cv main section > h3, .cv .timeline > li, .cv .pubs > li, .cv .more-link-row'
    ));

    // content (minus bottom padding) fully above the margin; taller-than-viewport items count once their top is in
    function fits(item) {
      var r = item.getBoundingClientRect();
      var height = r.height - parseFloat(getComputedStyle(item).paddingBottom);
      return r.top + Math.min(height, window.innerHeight - 2 * margin) <= window.innerHeight - margin;
    }

    function fly(item) {
      item.addEventListener('animationend', function () {
        item.classList.remove('cv-flow-active');
      }, { once: true });
      item.classList.add('cv-flow-active');
    }

    function check(initial) {
      var ready = pending.filter(fits);
      pending = pending.filter(function (item) { return ready.indexOf(item) < 0; });
      ready.forEach(function (item, i) {
        item.classList.remove('cv-flow');
        if (!initial || i === ready.length - 1) fly(item);
      });
      if (!pending.length) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
    }

    function onScroll() { check(false); }

    pending.forEach(function (item) {
      if (!fits(item)) item.classList.add('cv-flow');
    });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    check(true);
  }

  function initParallax() {
    var backdrop = document.querySelector('.research-field-backdrop');
    if (!backdrop) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var imageSpeed = 0.12;
    var max = 0;
    var room = 0;
    var width = 0;

    function measure() {
      max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      var need = Math.ceil(max * imageSpeed);
      if (need > room || window.innerWidth !== width) {
        room = need;
        width = window.innerWidth;
        backdrop.style.setProperty('--parallax-room', room + 'px');
      }
      update();
    }

    // clamped so overscroll bounce doesn't drag the image
    function update() {
      var y = Math.min(Math.max(window.scrollY, 0), max);
      backdrop.style.setProperty('--parallax-y', (-y * imageSpeed).toFixed(1) + 'px');
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    measure();
  }

  initHero();
  initParallax();

  window.addEventListener('pageshow', function () {
    var fontsReady = document.fonts && document.fonts.ready
      ? document.fonts.ready
      : Promise.resolve();

    fontsReady.then(function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(initCvFlow);
      });
    });
  }, { once: true });
})();
