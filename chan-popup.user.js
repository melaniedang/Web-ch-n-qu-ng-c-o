// ==UserScript==
// @name         Chặn popup Shopee/TikTok Shop trên web đọc truyện
// @namespace    chan-popup-shopee-tiktok
// @version      1.5.0
// @description  Chặn các cú bấm bị cướp sang Shopee, TikTok Shop, Lazada: popup, nút "Close" giả, nút "Chương sau" bị gài link, tab mới tự bật, hình nổi (bóng, vợt...) đè lên truyện.
// @updateURL    https://raw.githubusercontent.com/melaniedang/Web-ch-n-qu-ng-c-o/claude/block-mobile-ad-popups-yujame/chan-popup.user.js
// @downloadURL  https://raw.githubusercontent.com/melaniedang/Web-ch-n-qu-ng-c-o/claude/block-mobile-ad-popups-yujame/chan-popup.user.js
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
    return BLOCKED.some((re) => re.test(host)) || GAMBLING.test(host);
  }

  // Web cá độ / nhà cái (hay đổi domain: new88tanthu.online, f8bet19.city...)
  const GAMBLING = /(new88|f8bet|789bet|jun88|hi88|shbet|kubet|ku\d{2,}|8kbet|mb66|okvip|f168|qq88|nhatvip|go88|sunwin|hitclub|b52|rikvip|fb88|w88|fun88|m88|188bet|12bet|vn88|bk8|fi88|ae888|33win|nohu|sv388|win55|j88|tf88|bet88|v9bet|da88|man88|xoso66|onbet|mu88|zbet|five88|lucky88|loto188|net88|abc8|sky88|vipwin|xx88|good88|u888|nbet|bet\d{2,}|casino|nhacai|nha-cai|keonhacai|taixiu|tai-xiu|xocdia|xoc-dia|danhbai|gamebai|game-bai|banca|ban-ca)/i;

  // So sánh "cùng một web" (sangchanhteam.com = www.sangchanhteam.com = cdn.sangchanhteam.com)
  const SLD = /\.(com|net|org|edu|gov|ac|co|info|biz|name|pro|int|health)\.[a-z]{2}$/i;
  function siteOf(host) {
    const parts = String(host).toLowerCase().split('.');
    return parts.slice(SLD.test(host) ? -3 : -2).join('.');
  }
  function isCrossSite(url) {
    const raw = String(url || '').trim();
    if (!raw) return false;
    let u;
    try { u = new URL(raw, location.href); } catch (e) { return false; }
    if (u.protocol === 'javascript:' || u.protocol === 'about:' || u.protocol === 'blob:' || u.protocol === 'data:') return false;
    if (!/^https?:$/.test(u.protocol)) return true; // intent://, shopee://, tiktok://...
    return siteOf(u.hostname) !== siteOf(location.hostname);
  }
  const noHash = (u) => { try { const x = new URL(u, location.href); x.hash = ''; return x.href; } catch (e) { return String(u); } };
  // Link bạn TỰ bấm (chạm thật vào link thật) → cho đi. Còn lại → chặn.
  let lastTrusted = null;
  let allowOnce = null;
  function trustedNav(url) {
    return !!lastTrusted && Date.now() - lastTrusted.t < 5000 && noHash(lastTrusted.url) === noHash(url);
  }


  // ---- 0. Chặn mạng quảng cáo (Google AdSense/Ad Manager, banner dính đầu/cuối trang...) ----
  const AD_NET = /(googlesyndication|doubleclick|googleadservices|adtrafficquality|adservice\.google|googletagservices|amazon-adsystem|taboola|outbrain|mgid\.com|adnxs|criteo|popads|propellerads|adsterra|exoclick|onclicka|hilltopads|admicro|adtima|eclick\.vn|ambientplatform|vliplatform|clickadu|monetag|a-ads\.com|browpotware|aj1559\.online|highperformanceformat|profitablecpmrate|effectivegatecpm|realizationnewestfangs|pemsrv|tsyndicate|juicyads|trafficjunky|adcash|richads|galaksion|hilltopads|bidgear|vidoomy|zeropark)/i;

  // Nhận diện chung cho mạng quảng cáo "đổi domain liên tục" (popunder, hình nổi...)
  const SAFE_CDN = /(^|\.)(googletagmanager\.com|google-analytics\.com|gstatic\.com|google\.com|recaptcha\.net|cloudflare\.com|cdnjs\.cloudflare\.com|jsdelivr\.net|unpkg\.com|jquery\.com|bootstrapcdn\.com|fontawesome\.com|facebook\.net|youtube\.com|ytimg\.com|disqus\.com|disquscdn\.com|wp\.com|gravatar\.com|hcaptcha\.com|challenges\.cloudflare\.com)$/i;
  const JUNK_TLD = /\.(online|xyz|top|site|click|icu|pro|space|fun|store|cfd|sbs|lol|quest|rest|bond|cyou|monster|buzz|live|website|world|today|life|work|link|best|bid|win|loan|racing|cam|surf|autos|boats|homes|motorcycles|beauty|hair|makeup|skin|mom|yachts)$/i;
  function isAdScript(n) {
    const src = n.getAttribute('src') || '';
    if (!src) return false;
    if (AD_NET.test(src)) return true;
    let u;
    try { u = new URL(src, location.href); } catch (e) { return false; }
    const host = u.hostname;
    if (!host || host === location.hostname || host.endsWith('.' + location.hostname.replace(/^www\./, ''))) return false;
    if (SAFE_CDN.test(host)) return false;
    // Dấu hiệu điển hình của script popunder: tắt Rocket Loader của Cloudflare
    if (n.getAttribute('data-cfasync') === 'false') return true;
    // Domain rác: đuôi lạ, hoặc tên kiểu "aj1559", "x7k2.top"
    if (JUNK_TLD.test(host)) return true;
    if (/^[a-z]{1,3}\d{3,}\./i.test(host)) return true;
    return false;
  }
  const AD_CSS = [
    'ins.adsbygoogle', '.adsbygoogle', '[data-anchor-status]', '[data-ad-slot]', '[data-ad-client]',
    'iframe[id^="aswift_"]', 'iframe[id^="google_ads_iframe"]', '[id^="google_ads_iframe"]',
    '[id^="div-gpt-ad"]', 'div[id^="gpt_unit_"]', 'iframe[src*="googlesyndication"]',
    'iframe[src*="doubleclick"]', 'iframe[src*="amazon-adsystem"]', '.google-auto-placed',
    '[id^="google_vignette"]', 'iframe[name="googlefcPresent"]',
  ].join(',') + '{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important}' +
    // Google anchor ad đẩy trang xuống bằng padding → trả lại
    'html[style*="padding-top"],html[style*="padding-bottom"]{padding-top:0!important;padding-bottom:0!important}';
  function addCSS() {
    const host = document.head || document.documentElement;
    if (!host || document.getElementById('__chanpopup_css')) return;
    const st = document.createElement('style');
    st.id = '__chanpopup_css';
    st.textContent = AD_CSS;
    host.appendChild(st);
  }
  addCSS();

  function killScript(n) {
    if (n && n.tagName === 'SCRIPT' && isAdScript(n)) {
      n.type = 'javascript/blocked';
      n.removeAttribute('src');
      return true;
    }
    if (n && n.tagName === 'IFRAME' && n.src && AD_NET.test(n.src)) {
      n.removeAttribute('src');
      return true;
    }
    // Iframe của web khác: không cho tự mở tab / chuyển cả trang đi
    if (n && n.tagName === 'IFRAME' && !n.hasAttribute('sandbox') && n.getAttribute('src') && isCrossSite(n.src)) {
      const SB = 'allow-scripts allow-same-origin allow-forms allow-presentation';
      if (n.isConnected && n.parentNode) {
        // iframe đã nằm trong trang → thay bằng bản sao có sandbox ngay từ đầu
        const c = n.cloneNode(true);
        c.setAttribute('sandbox', SB);
        n.parentNode.replaceChild(c, n);
      } else {
        n.setAttribute('sandbox', SB);
      }
    }
    return false;
  }
  // Script quảng cáo chèn động
  ['appendChild', 'insertBefore'].forEach((fn) => {
    const real = Node.prototype[fn];
    Node.prototype[fn] = function (node, ...rest) {
      killScript(node);
      return real.call(this, node, ...rest);
    };
  });
  // Script quảng cáo có sẵn trong HTML: chặn trước khi trình duyệt chạy
  new MutationObserver((muts) => {
    for (const m of muts) for (const n of m.addedNodes) {
      killScript(n);
      if (n.tagName === 'HEAD' || n.tagName === 'HTML') addCSS();
    }
  }).observe(document, { childList: true, subtree: true });

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
    // Lỡ chặn nhầm link bạn muốn mở → nút "Vẫn mở" (không hiện với Shopee/TikTok/cá độ)
    try {
      if (!/^https?:/i.test(new URL(url, location.href).protocol) || isBlocked(url)) return;
      const el = document.getElementById('__chanpopup_toast');
      const btn = document.createElement('button');
      btn.textContent = 'Vẫn mở';
      btn.style.cssText = 'margin-left:10px;pointer-events:auto;background:#fff;color:#111;border:0;border-radius:12px;padding:3px 10px;font:inherit;font-weight:600';
      btn.addEventListener('click', (ev) => {
        if (!ev.isTrusted) return;
        ev.stopImmediatePropagation();
        allowOnce = url;
        location.href = url;
      }, true);
      el.style.pointerEvents = 'auto';
      el.appendChild(btn);
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { el.style.display = 'none'; el.style.pointerEvents = 'none'; }, 4000);
    } catch (e) {}
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
    const ok = url && allowOnce && noHash(url) === noHash(allowOnce);
    if (!ok && (!url || url === 'about:blank' || isBlocked(url) || isCrossSite(url))) {
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
    if (!a) return;
    // Link sang web khác nằm trong khung nổi/lớp phủ = bẫy quảng cáo
    const trap = isBlocked(a.href) || (isCrossSite(a.href) && (!ev.isTrusted || !!floatingRoot(a)));
    if (!trap) {
      if (ev.isTrusted && isCrossSite(a.href)) lastTrusted = { url: a.href, t: Date.now() };
      return;
    }
    {
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
    if (isBlocked(this.href) || isCrossSite(this.href)) return blockedMsg(this.href);
    return realAClick.call(this);
  };
  const realDispatch = EventTarget.prototype.dispatchEvent;
  EventTarget.prototype.dispatchEvent = function (ev) {
    if (this instanceof HTMLAnchorElement && ev && ev.type === 'click' && (isBlocked(this.href) || isCrossSite(this.href))) {
      blockedMsg(this.href);
      return false;
    }
    return realDispatch.call(this, ev);
  };
  const realSubmit = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function () {
    if (isBlocked(this.action) || isCrossSite(this.action)) return blockedMsg(this.action);
    return realSubmit.call(this);
  };

  // ---- 4. Chặn chuyển trang bằng location.href = '...' ----
  // Navigation API (Chrome/Edge/Samsung, Safari & Firefox bản mới)
  if (window.navigation && typeof window.navigation.addEventListener === 'function') {
    window.navigation.addEventListener('navigate', (e) => {
      try {
        const url = e.destination && e.destination.url;
        if (!url || !e.cancelable) return;
        if (allowOnce && noHash(url) === noHash(allowOnce)) { allowOnce = null; return; }
        if (isBlocked(url) || (isCrossSite(url) && !trustedNav(url))) {
          e.preventDefault();
          blockedMsg(url);
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


  // ---- 6. Ẩn "vật thể nổi" (quả bóng, cây vợt...) đè lên màn hình ----
  // Quảng cáo kiểu này không có link Shopee trong HTML (link nằm trong JS),
  // nên nhận diện bằng hình dạng: nổi trên trang + chỉ có hình + không có chữ/link của web.
  const SAFE_TAGS = /^(HTML|BODY|HEADER|NAV|MAIN|ARTICLE|FOOTER)$/;
  function sameSite(href) {
    try { return new URL(href, location.href).hostname === location.hostname; } catch (e) { return false; }
  }
  function floatingRoot(el) {
    // Tìm tổ tiên cao nhất đang "nổi" (fixed/sticky, hoặc absolute có z-index cao)
    let found = null;
    for (let n = el; n && n.nodeType === 1 && !SAFE_TAGS.test(n.tagName); n = n.parentElement) {
      const cs = getComputedStyle(n);
      const z = parseInt(cs.zIndex, 10) || 0;
      if (cs.position === 'fixed' || cs.position === 'sticky' || (cs.position === 'absolute' && z >= 50)) found = n;
    }
    return found;
  }
  // Popup lừa đảo giả làm ô xác minh / đăng nhập / "bấm Cho phép"
  const SCAM_TEXT = /(xác minh (rằng )?bạn là người|tôi là con người|tôi không phải (là )?(người máy|robot)|bạn có phải là robot|i'?m not a robot|verify (that )?you are (a )?human|are you a robot|press allow|click allow|nhấn (nút )?["“]?cho phép|bấm (nút )?["“]?cho phép|để xác nhận bạn không phải)/i;
  function isScamPopup(el) {
    const t = (el.innerText || el.textContent || '').slice(0, 2000);
    return SCAM_TEXT.test(t);
  }
  function looksLikeAd(el) {
    if (el.id === '__chanpopup_toast') return false;
    if (isScamPopup(el)) return true;
    // Giữ lại thanh menu, nút chuyển chương, ô tìm kiếm... của web
    if (el.matches('a[href]') && sameSite(el.getAttribute('href'))) return false;
    if ([...el.querySelectorAll('a[href]')].some((a) => sameSite(a.getAttribute('href') || a.href))) return false;
    if (el.querySelector('input,select,textarea')) return false;
    const text = (el.innerText || '').replace(/[\s×✕xX]/g, '');
    if (text.length > 25) return false;
    const imgs = el.querySelectorAll('img').length;
    if (imgs > 3) return false; // khung chứa ảnh truyện
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return false;
    const vArea = window.innerWidth * window.innerHeight;
    const hasVisual =
      imgs > 0 || el.querySelector('svg,canvas,video,iframe,picture') ||
      /url\(/.test(getComputedStyle(el).backgroundImage) ||
      [...el.querySelectorAll('*')].some((c) => /url\(/.test(getComputedStyle(c).backgroundImage));
    // Lớp phủ trong suốt to (bẫy chạm) hoặc hình nổi nhỏ/vừa
    if (!hasVisual) return r.width * r.height > vArea * 0.5 && text.length === 0;
    return r.width * r.height < vArea * 0.6;
  }
  let hiddenCount = 0;
  function hideFloaters() {
    if (!document.body) return;
    // Popup lừa đảo nằm trong iframe quảng cáo → ẩn cả khung
    if (window !== window.top && isScamPopup(document.body)) {
      document.documentElement.style.setProperty('display', 'none', 'important');
      return;
    }
    const W = window.innerWidth, H = window.innerHeight;
    const seen = new Set();
    const roots = new Set();
    for (let ix = 0; ix <= 6; ix++) {
      for (let iy = 0; iy <= 10; iy++) {
        const x = Math.min(W - 2, Math.max(2, (W * ix) / 6));
        const y = Math.min(H - 2, Math.max(2, (H * iy) / 10));
        const top = document.elementFromPoint(x, y);
        if (!top || seen.has(top)) continue;
        seen.add(top);
        const root = floatingRoot(top);
        if (!root || roots.has(root)) continue;
        roots.add(root);
        if (looksLikeAd(root)) {
          root.style.setProperty('display', 'none', 'important');
          hiddenCount++;
          if (hiddenCount <= 3) toast('Đã ẩn quảng cáo nổi');
        }
      }
    }
  }
  let floatTimer = null;
  function scheduleFloaters() {
    if (floatTimer) return;
    floatTimer = setTimeout(() => { floatTimer = null; try { hideFloaters(); } catch (e) {} }, 250);
  }
  window.addEventListener('scroll', scheduleFloaters, { passive: true });
  window.addEventListener('resize', scheduleFloaters);
  setInterval(scheduleFloaters, 1200);

  let pending = false;
  const mo = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      sweep(document);
      scheduleFloaters();
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
