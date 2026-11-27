// ==UserScript==
// @name         Chặn popup Shopee/TikTok Shop trên web đọc truyện
// @namespace    chan-popup-shopee-tiktok
// @version      1.0.0
// @description  Chặn các cú bấm bị cướp sang Shopee, TikTok Shop, Lazada: popup, nút "Close" giả, nút "Chương sau" bị gài link, tab mới tự bật.
// @match        *://*/*
// @exclude      *://*.shopee.vn/*
// @exclude      *://shopee.vn/*
// @exclude      *://*.tiktok.com/*
// @exclude      *://*.lazada.vn/*
// @run-at       document-start
// @inject-into  page
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // ---- 1. Danh sách đích bị chặn (thêm domain vào đây nếu gặp chỗ mới) ----
  const BLOCKED = [
    /(^|\.)shopee\.(vn|com|co\.id|ph|sg|com\.my|co\.th)$/i,
    /(^|\.)shp\.ee$/i,
    /(^|\.)shope\.ee$/i,
    /(^|\.)s\.shopee\./i,
    /(^|\.)tiktok\.com$/i,
    /(^|\.)tiktokv\.com$/i,
    /(^|\.)vt\.tiktok\.com$/i,
    /(^|\.)lazada\.(vn|com)$/i,
    /(^|\.)lzd\.co$/i,
    /(^|\.)tiki\.vn$/i,
    /(^|\.)ti\.ki$/i,
  ];
  // Các scheme mở thẳng app trên điện thoại
  const BLOCKED_SCHEMES = /^(intent|shopeevn|shopee|snssdk\d*|tiktok|lazada|tikivn|market):/i;

  function isBlocked(url) {
    if (!url) return false;
    const s = String(url).trim();
    if (BLOCKED_SCHEMES.test(s)) {
      // intent://...#Intent;package=com.shopee.vn;end → chỉ chặn khi trỏ tới app mua sắm/TikTok
      if (/^intent:/i.test(s)) return /shopee|tiktok|musically|ss\.android|lazada|tiki/i.test(s);
      return true;
    }
    let host;
    try {
      host = new URL(s, location.href).hostname;
    } catch (e) {
      return false;
    }
    if (host === location.hostname) return false;
    return BLOCKED.some((re) => re.test(host));
  }

  // ---- Thông báo nhỏ để biết script đã chặn ----
  let toastTimer;
  function toast(msg) {
    try {
      let el = document.getElementById('__chanpopup_toast');
      if (!el) {
        el = document.createElement('div');
        el.id = '__chanpopup_toast';
        el.style.cssText =
          'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483647;' +
          'background:rgba(20,20,20,.88);color:#fff;font:13px/1.4 system-ui,sans-serif;' +
          'padding:8px 14px;border-radius:20px;pointer-events:none;max-width:90vw;text-align:center';
        (document.body || document.documentElement).appendChild(el);
      }
      el.textContent = '🛡️ ' + msg;
      el.style.display = 'block';
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => (el.style.display = 'none'), 1800);
    } catch (e) {}
  }

  function blockedMsg(url) {
    let host = String(url);
    try {
      host = new URL(url, location.href).hostname || host.split(':')[0];
    } catch (e) {}
    toast('Đã chặn chuyển sang ' + host.slice(0, 40));
  }

  // ---- 2. Chặn window.open (tab mới tự bật) ----
  const fakeWindow = () => {
    const w = {
      closed: false,
      opener: null,
      focus() {},
      blur() {},
      close() { w.closed = true; },
      postMessage() {},
      document: { write() {}, writeln() {}, open() {}, close() {}, body: null },
      location: { href: '', assign() {}, replace() {} },
    };
    return w;
  };
  const realOpen = window.open;
  window.open = function (url, ...rest) {
    // Popunder kiểu mở tab trống rồi gán location sau → cũng chặn
    if (!url || url === 'about:blank' || isBlocked(url)) {
      blockedMsg(url || 'tab mới');
      return fakeWindow();
    }
    return realOpen.call(window, url, ...rest);
  };

  // ---- 3. Chặn bấm vào link Shopee/TikTok (kể cả lớp phủ trong suốt) ----
  function findLink(ev) {
    const path = ev.composedPath ? ev.composedPath() : [ev.target];
    for (const n of path) {
      if (n && n.tagName === 'A' && n.href) return n;
      if (n && n.tagName === 'AREA' && n.href) return n;
    }
    return null;
  }

  function onClick(ev) {
    const a = findLink(ev);
    if (a && isBlocked(a.href)) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      blockedMsg(a.href);
      // Gỡ luôn link bẫy để lần bấm sau đi đúng chỗ
      neutralize(a);
    }
  }
  // Đăng ký ở window + capture để chạy TRƯỚC script quảng cáo
  ['click', 'auxclick', 'mousedown', 'mouseup', 'touchend', 'pointerup'].forEach((t) => {
    window.addEventListener(
      t,
      (ev) => {
        if (t === 'click' || t === 'auxclick') return onClick(ev);
        // Với các event khác chỉ chặn script quảng cáo nghe event, không preventDefault (để cuộn trang bình thường)
        const a = findLink(ev);
        if (a && isBlocked(a.href)) ev.stopImmediatePropagation();
      },
      true
    );
  });

  // Link bị script bấm hộ: a.click() / dispatchEvent
  const realAClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (isBlocked(this.href)) return blockedMsg(this.href);
    return realAClick.call(this);
  };
  const realDispatch = EventTarget.prototype.dispatchEvent;
  EventTarget.prototype.dispatchEvent = function (ev) {
    if (this instanceof HTMLAnchorElement && ev && ev.type === 'click' && isBlocked(this.href)) {
      blockedMsg(this.href);
      return false;
    }
    return realDispatch.call(this, ev);
  };
  const realSubmit = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function () {
    if (isBlocked(this.action)) return blockedMsg(this.action);
    return realSubmit.call(this);
  };

  // ---- 4. Chặn chuyển trang bằng location.href = '...' ----
  // Navigation API (Chrome/Edge/Samsung, Safari & Firefox bản mới)
  if (window.navigation && typeof window.navigation.addEventListener === 'function') {
    window.navigation.addEventListener('navigate', (e) => {
      try {
        if (e.destination && isBlocked(e.destination.url) && e.cancelable) {
          e.preventDefault();
          blockedMsg(e.destination.url);
        }
      } catch (err) {}
    });
  }

  // ---- 5. Dọn link bẫy, iframe quảng cáo, lớp phủ toàn màn hình ----
  function neutralize(a) {
    try {
      a.removeAttribute('href');
      a.removeAttribute('onclick');
      a.style.pointerEvents = 'none';
      // Nếu là lớp phủ to che màn hình → ẩn hẳn
      const r = a.getBoundingClientRect();
      if (r.width * r.height > window.innerWidth * window.innerHeight * 0.3) a.style.display = 'none';
    } catch (e) {}
  }

  function isOverlay(el) {
    try {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'absolute') return false;
      const r = el.getBoundingClientRect();
      return r.width * r.height > window.innerWidth * window.innerHeight * 0.5;
    } catch (e) {
      return false;
    }
  }

  function sweep(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('a[href], area[href]').forEach((a) => {
      if (!isBlocked(a.href)) return;
      // Popup/banner quảng cáo: ẩn khối cha gần nhất đang nổi lên trên trang
      let box = a;
      for (let i = 0; i < 6 && box.parentElement && box.parentElement !== document.body; i++) {
        const cs = getComputedStyle(box.parentElement);
        box = box.parentElement;
        if (cs.position === 'fixed') break;
      }
      // Không ẩn khối chứa link nội bộ của web (vd thanh "Chương trước / Chương sau")
      const hasSiteLinks = [...box.querySelectorAll('a[href]')].some((x) => {
        try { return new URL(x.href).hostname === location.hostname; } catch (e) { return false; }
      });
      if (!hasSiteLinks && (getComputedStyle(box).position === 'fixed' || isOverlay(a))) {
        box.style.setProperty('display', 'none', 'important');
      }
      neutralize(a);
    });
    root.querySelectorAll('iframe[src]').forEach((f) => {
      if (isBlocked(f.src)) f.remove();
    });
  }

  let pending = false;
  const mo = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      sweep(document);
    });
  });
  function start() {
    sweep(document);
    mo.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href', 'src', 'style', 'class'],
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
