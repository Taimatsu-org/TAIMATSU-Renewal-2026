// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
if (typeof SplitText !== "undefined") gsap.registerPlugin(SplitText);
(function () {
  function startLenis() {
    if (typeof Lenis === "undefined") {
      setTimeout(startLenis, 50);
      return;
    }
    if (window.lenis) return;
    window.lenis = new Lenis({
      duration: 1,
      easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      smoothTouch: false,
      touchMultiplier: 1.5,
    });
    gsap.ticker.add((time) => window.lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    if (window.ScrollTrigger) {
      window.lenis.on("scroll", ScrollTrigger.update);
    }
    // Re-measure whenever the page height changes (accordion expand, Finsweet
    // render/filter, late images, pin-spacing). lenis's built-in observer
    // watches <html>, which can miss scrollHeight growth — so its scroll
    // limit gets stuck too short and you can't scroll to the bottom.
    if (typeof ResizeObserver !== "undefined") {
      let resizeT;
      new ResizeObserver(() => {
        clearTimeout(resizeT);
        resizeT = setTimeout(() => {
          if (window.lenis) window.lenis.resize();
        }, 100);
      }).observe(document.body);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startLenis);
  } else {
    startLenis();
  }
})();
// Lenis
function initLenis() {
  if (window.lenis?.start) window.lenis.start();
}
function destroyLenis() {
  if (window.lenis?.destroy) window.lenis.destroy();
}
// UnicornStudio fade in
function initUnicornFadeIn() {
  const container = document.querySelector("[data-us-project]");
  if (!container) return;
  gsap.set(container, { opacity: 0 });
  const observer = new MutationObserver((mutations, obs) => {
    if (container.querySelector("canvas")) {
      setTimeout(
        () =>
          gsap.to(container, { opacity: 1, duration: 0.8, ease: "power2.out" }),
        100,
      );
      obs.disconnect();
    }
  });
  const existing = container.querySelector("canvas");
  if (existing)
    setTimeout(
      () =>
        gsap.to(container, { opacity: 1, duration: 0.8, ease: "power2.out" }),
      100,
    );
  else observer.observe(container, { childList: true, subtree: true });
}
// Navbar colors
function updateNavbarColors(targetNamespace) {
  const navbar = document.querySelector(".navigation");
  if (!navbar) return;
  const ns =
    targetNamespace ||
    document
      .querySelector("[data-barba-namespace]")
      ?.getAttribute("data-barba-namespace");
  if (ns === "home") navbar.classList.add("nav-inverted");
  else navbar.classList.remove("nav-inverted");
  if (typeof updateFlashHoverColors === "function") updateFlashHoverColors(ns);
}
// Split lines
let splitLinesInstance = null,
  splitLinesResizeHandler = null;
function cleanupSplitLines() {
  ScrollTrigger.getAll().forEach((t) => {
    if (t.trigger?.classList?.contains("line")) t.kill();
  });
  if (splitLinesInstance) {
    splitLinesInstance.revert();
    splitLinesInstance = null;
  }
  if (splitLinesResizeHandler) {
    window.removeEventListener("resize", splitLinesResizeHandler);
    splitLinesResizeHandler = null;
  }
}
function initSplitLines() {
  if (!document.querySelector(".split-lines")) return;
  cleanupSplitLines();
  function runSplit() {
    splitLinesInstance = new SplitType(".split-lines", {
      types: "lines, words",
    });
    $(".line").each(function () {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: $(this),
            start: "top center",
            end: "bottom center",
            scrub: 1,
          },
        })
        .from($(this), { "--line-width": "0%", duration: 1 });
    });
  }
  runSplit();
  let w = $(window).innerWidth();
  splitLinesResizeHandler = function () {
    if (w !== $(window).innerWidth()) {
      w = $(window).innerWidth();
      if (splitLinesInstance) splitLinesInstance.revert();
      runSplit();
    }
  };
  window.addEventListener("resize", splitLinesResizeHandler);
}
// Scroll top
function initScrollTop() {
  const btn = document.querySelector(".scroll-top");
  if (btn)
    btn.onclick = () => {
      if (window.lenis) {
        window.lenis.scrollTo(0, { duration: 2.5, lock: true });
      } else {
        gsap.to(window, {
          scrollTo: { y: 0, autoKill: false },
          duration: 2.5,
          ease: "quart.inOut",
        });
      }
    };
}
// URL cleanup
let urlCleanupInitialized = false;
function initWebflowURLCleanup() {
  if (urlCleanupInitialized) return;
  urlCleanupInitialized = true;
  document.addEventListener(
    "click",
    (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link && !link.matches(".w-tab-link") && !link.matches(".toc-link")) {
        const targetId = link.getAttribute("href").substring(1);
        const target = document.getElementById(targetId);
        if (target) {
          e.preventDefault();
          e.stopPropagation();
          if (window.lenis) window.lenis.scrollTo(target);
          else
            gsap.to(window, {
              scrollTo: { y: target, autoKill: true },
              duration: 1,
              ease: "power2.inOut",
            });
          setTimeout(() => {
            if (window.location.hash)
              history.replaceState(null, null, window.location.pathname);
          }, 0);
        }
      }
    },
    true,
  );
  window.addEventListener("hashchange", () => {
    history.replaceState(null, null, window.location.pathname);
  });
  if (window.location.hash)
    history.replaceState(null, null, window.location.pathname);
}
// Flash unreveal
function unreavealFlashElements() {
  return new Promise((resolve) => {
    const els = document.querySelectorAll(
      "[data-flash-reveal][data-flash-initialized]",
    );
    if (!els.length) {
      resolve();
      return;
    }
    els.forEach((el) => {
      const chars = el._splitInstance?.chars || el.querySelectorAll(".char");
      if (!chars?.length) return;
      gsap.timeline().to(chars, {
        autoAlpha: 0,
        duration: 0.6,
        ease: el.dataset.flashEase || "power2.out",
        stagger: {
          each: 0.4 / chars.length,
          from: "random",
          onStart: function () {
            const char = this.targets()[0],
              flashes = Math.floor(Math.random() * 3) + 1;
            if (flashes === 1) return;
            const ftl = gsap.timeline();
            for (let i = 0; i < flashes - 1; i++)
              ftl
                .to(char, { autoAlpha: 0, duration: 0.08, ease: "none" })
                .to(char, { autoAlpha: 1, duration: 0.08, ease: "none" });
          },
        },
      });
    });
    setTimeout(resolve, 500);
  });
}
// Link control
function disableLinks() {
  document.querySelectorAll("a").forEach((l) => {
    if (!l.hasAttribute("data-flash-hover-initialized"))
      l.style.pointerEvents = "none";
  });
}
function enableLinks() {
  document
    .querySelectorAll("a")
    .forEach((l) => (l.style.pointerEvents = "auto"));
}
// Flash reveal
function initFlashReveal() {
  document.querySelectorAll("[data-flash-reveal]").forEach((el) => {
    if (el.hasAttribute("data-flash-initialized")) return;
    el.setAttribute("data-flash-initialized", "true");
    gsap.set(el, { visibility: "hidden" });
    const maxDur = parseFloat(el.dataset.flashDuration) || 1,
      ease = el.dataset.flashEase || "power2.out",
      trigger = el.dataset.flashTrigger || "scroll";
    const split = new SplitText(el, { type: "words,chars" }),
      chars = split.chars;
    el._splitInstance = split;
    gsap.set(el, { visibility: "visible" });
    gsap.set(chars, { autoAlpha: 0 });
    const tl = gsap.timeline({ paused: true });
    const stag = Math.max(0.01, (maxDur - 0.6) / chars.length);
    tl.to(chars, {
      autoAlpha: 1,
      duration: 0.6,
      ease,
      stagger: {
        each: stag,
        from: "random",
        onStart: function () {
          const char = this.targets()[0],
            flashes = Math.floor(Math.random() * 3) + 1;
          if (flashes === 1) return;
          const ftl = gsap.timeline();
          for (let i = 0; i < flashes - 1; i++)
            ftl
              .to(char, { autoAlpha: 1, duration: 0.08, ease: "none" })
              .to(char, { autoAlpha: 0, duration: 0.08, ease: "none" });
        },
      },
    });
    if (trigger === "load") tl.play();
    else
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        onEnter: () => tl.play(),
        once: true,
      });
  });
}
// Color reveal
function initColorReveal() {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined")
    return;
  const CFG = {
    start: "top 80%",
    end: "top 20%",
    colors: { initial: "#d0d0d0", mid: "#EE7800", final: "#000000" },
  };
  function splitChars(el) {
    const existing = el.querySelectorAll(".reveal-char");
    if (existing.length) {
      existing.forEach((c) => {
        c._hasAnimated = false;
        gsap.set(c, { color: CFG.colors.initial });
      });
      return Array.from(existing);
    }
    if (typeof SplitText !== "undefined") {
      const s = new SplitText(el, { type: "chars", charsClass: "reveal-char" });
      el._splitInstance = s;
      s.chars.forEach((c) => gsap.set(c, { color: CFG.colors.initial }));
      return s.chars;
    }
    const txt = el.textContent || el.innerText;
    el.innerHTML = "";
    const chars = [];
    for (let i = 0; i < txt.length; i++) {
      const span = document.createElement("span");
      span.className = "reveal-char";
      span.style.display = "inline-block";
      if (txt[i] === " ") {
        span.innerHTML = "&nbsp;";
        span.style.width = "0.3em";
      } else span.textContent = txt[i];
      span.style.color = CFG.colors.initial;
      chars.push(span);
      el.appendChild(span);
    }
    return chars;
  }
  function animChar(c) {
    if (c._hasAnimated) return;
    gsap.killTweensOf(c);
    c._hasAnimated = true;
    gsap
      .timeline()
      .to(c, { color: CFG.colors.mid, duration: 0.3, ease: "power2.inOut" })
      .to(c, { color: CFG.colors.final, duration: 0.3, ease: "power2.inOut" });
  }
  function resetChar(c) {
    if (!c._hasAnimated) return;
    gsap.killTweensOf(c);
    c._hasAnimated = false;
    gsap.set(c, { color: CFG.colors.initial });
  }
  function createAnim(el) {
    if (el.hasAttribute("data-reveal-init")) return;
    el.setAttribute("data-reveal-init", "true");
    const chars = splitChars(el);
    if (!chars.length) return;
    chars.forEach((c) => (c._hasAnimated = false));
    let lastProg = 0;
    ScrollTrigger.create({
      trigger: el,
      start: CFG.start,
      end: CFG.end,
      onUpdate: (self) => {
        const prog = self.progress,
          down = prog > lastProg;
        if (down)
          chars.forEach((c, i) => {
            if (prog >= i / chars.length && !c._hasAnimated) animChar(c);
          });
        else
          for (let i = chars.length - 1; i >= 0; i--) {
            if (prog < (i + 1) / chars.length && chars[i]._hasAnimated)
              resetChar(chars[i]);
          }
        lastProg = prog;
      },
      onLeaveBack: () =>
        chars.forEach((c) => {
          if (c._hasAnimated) resetChar(c);
        }),
    });
  }
  if (window.Webflow?.env?.("editor")) return;
  document.querySelectorAll("[data-color-reveal]").forEach(createAnim);
}
// Mobile menu
let menuTransitioning = false;
let menuClickBlocker = null;
function blockMenuClick(e) {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  return false;
}
function closeMobileMenu() {
  const btn = document.querySelector(".menu-button.w-nav-button"),
    overlay = document.querySelector(".w-nav-overlay"),
    menu = document.querySelector(".w-nav-menu");
  if (!btn?.classList.contains("w--open")) return;
  menuTransitioning = true;
  btn.addEventListener("click", blockMenuClick, true);
  btn.addEventListener("touchstart", blockMenuClick, true);
  const top = document.querySelector(".menu-icon-top"),
    mid = document.querySelector(".menu-icon-middle"),
    bot = document.querySelector(".menu-icon-bottom");
  const tl = gsap.timeline({
    onComplete: () => {
      btn.classList.remove("w--open");
      if (menu) menu.classList.remove("w--nav-menu-open");
      document.body.style.overflow = "";
      menuTransitioning = false;
    },
  });
  if (top && mid && bot) {
    tl.to(top, { y: -8, rotateZ: 0, duration: 0.2, ease: "power1.inOut" }, 0);
    tl.to(
      mid,
      { opacity: 1, scale: 1, duration: 0.2, ease: "power1.inOut" },
      0,
    );
    tl.to(bot, { y: 8, rotateZ: 0, duration: 0.2, ease: "power1.inOut" }, 0);
  }
  if (overlay)
    tl.to(
      overlay,
      {
        height: 0,
        duration: 0.2,
        ease: "power1.inOut",
        onComplete: () => (overlay.style.display = "none"),
      },
      0,
    );
  if (menu) tl.to(menu, { height: 0, duration: 0.2, ease: "power1.inOut" }, 0);
}
function lockMobileMenu() {
  menuTransitioning = true;
  const btn = document.querySelector(".menu-button.w-nav-button");
  if (btn) {
    btn.addEventListener("click", blockMenuClick, true);
    btn.addEventListener("touchstart", blockMenuClick, true);
  }
}
function unlockMobileMenu() {
  menuTransitioning = false;
  const btn = document.querySelector(".menu-button.w-nav-button");
  if (btn) {
    btn.removeEventListener("click", blockMenuClick, true);
    btn.removeEventListener("touchstart", blockMenuClick, true);
  }
}
// Video hover
function initBrandsVideoHover() {
  document
    .querySelectorAll(".hover_video_wrapper .project-video")
    .forEach((v) => {
      if (v.hasAttribute("data-video-initialized")) return;
      v.setAttribute("data-video-initialized", "true");
      let timeout;
      v.addEventListener("mouseover", () => {
        clearTimeout(timeout);
        v.play();
      });
      v.addEventListener("mouseout", () => {
        timeout = setTimeout(() => v.pause(), 1000);
      });
    });
}
// Best venture
function initBestVentureButton() {
  const btn = document.querySelectorAll(".best-venture-button");
  const trigger = document.querySelector(".best-venture-trigger");
  if (!btn.length || !trigger) return;
  btn.forEach((button) => {
    button.style.display = "none";
    gsap.set(button, { opacity: 0 });
    const st1 = ScrollTrigger.create({
      trigger: ".best-venture-trigger",
      start: "top top",
      onEnter: () => {
        button.style.display = "block";
        gsap.to(button, { opacity: 1, duration: 0.4, ease: "power4.out" });
      },
      onLeaveBack: () => {
        gsap.to(button, {
          opacity: 0,
          duration: 0.4,
          ease: "power4.out",
          onComplete: () => (button.style.display = "none"),
        });
      },
    });
    const st2 = ScrollTrigger.create({
      trigger: ".best-venture-trigger",
      start: "bottom top",
      end: "bottom bottom+=100%",
      onEnter: () => {
        button.style.display = "block";
        gsap.to(button, { opacity: 1, duration: 0.4, ease: "power4.out" });
      },
    });
  });
}
// Brands hero reveal
function initBrandsHeroReveal() {
  if (typeof gsap === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  const imgs = gsap.utils.toArray(".preview-hero .mask-img");
  if (!imgs.length) return;
  ScrollTrigger.create({
    trigger: ".preview-hero",
    start: "top top",
    end: `+=${window.innerHeight * 4}px`,
    pin: true,
    pinSpacing: true,
    scrub: 1,
    onUpdate: (self) => {
      const prog = self.progress,
        total = imgs.length,
        seg = 1 / total;
      imgs.forEach((img, i) => {
        let p = 0;
        if (prog >= i * seg && prog <= (i + 1) * seg)
          p = (prog - i * seg) / seg;
        else if (prog > (i + 1) * seg) p = 1;
        gsap.set(img, {
          maskImage: `linear-gradient(${90 + p * 40}deg, black ${50 - p * 50}%, transparent ${50 - p * 50}%, transparent ${50 + p * 50}%, black ${50 + p * 50}%)`,
        });
      });
    },
  });
}
// CountUp
function initCountUpAnimations() {
  if (typeof countUp === "undefined" || !document.getElementById("number1"))
    return;
  const needsLocale = [20, 21];
  const nums = [
    [1, 2023, { useGrouping: false }],
    [2, 274],
    [3, 5],
    [4, 300],
    [5, 57],
    [6, 43],
    [7, 20],
    [8, 1],
    [9, 79],
    [10, 239],
    [11, 126],
    [12, 1],
    [13, 17],
    [14, 9000, { useGrouping: false }],
    [15, 4.9, { decimalPlaces: 1 }],
    [16, 80],
    [17, 15],
    [18, 5],
    [19, 166],
    [20, 15],
    [21, 12],
    [22, 300],
    [23, 56],
    [24, 9],
  ];
  nums.forEach((n) => {
    let target = n[1];
    if (needsLocale.includes(n[0])) {
      const el = document.getElementById("number" + n[0]);
      if (el) {
        const raw = el.textContent.trim().replace(/,/g, "");
        const fromHTML = parseFloat(raw);
        if (!isNaN(fromHTML)) target = fromHTML;
      }
    }
    new countUp.CountUp("number" + n[0], target, {
      enableScrollSpy: true,
      ...n[2],
    });
  });
}
// Brands button
function initBrandsButtonAnimation() {
  document.querySelectorAll(".project-button").forEach((btn) => {
    if (btn.hasAttribute("data-button-initialized")) return;
    btn.setAttribute("data-button-initialized", "true");
    const left = btn.querySelector(".link-11_underline.has-left-origin"),
      right = btn.querySelector(".link-11_underline.has-right-origin");
    const caretAp = btn.querySelector(".caret-right-ap"),
      caretDis = btn.querySelector(".caret-right");
    let isAnim = false,
      scrollAnim = true;
    if (left && right) {
      gsap.set(left, { scaleX: 0, scaleY: 1 });
      gsap.set(right, { scaleX: 0, scaleY: 1, transformOrigin: "left center" });
      gsap.to(right, {
        scaleX: 1,
        duration: 2,
        ease: "quint.out",
        scrollTrigger: { trigger: btn, start: "top bottom", once: true },
        onComplete: () => {
          gsap.set(right, { transformOrigin: "right center" });
          scrollAnim = false;
        },
      });
    } else {
      scrollAnim = false;
    }
    if (caretAp && caretDis) {
      gsap.set(caretAp, { x: "-100%" });
      gsap.set(caretDis, { x: "0%" });
    }
    btn.addEventListener("mouseenter", () => {
      if (isAnim || scrollAnim) return;
      isAnim = true;
      const tl = gsap.timeline({
        onComplete: () => {
          if (left) gsap.set(left, { scaleX: 0 });
          if (right) gsap.set(right, { scaleX: 1 });
          if (caretAp) gsap.set(caretAp, { x: "-100%" });
          if (caretDis) gsap.set(caretDis, { x: "0%" });
          isAnim = false;
        },
      });
      if (left && right)
        tl.to(
          left,
          { scaleX: 1, duration: 2, ease: "quint.out", delay: 0.2 },
          0,
        ).to(right, { scaleX: 0, duration: 2, ease: "quint.out" }, 0);
      if (caretAp && caretDis)
        tl.to(caretAp, { x: "0%", duration: 1.75, ease: "quint.inOut" }, 0).to(
          caretDis,
          { x: "100%", duration: 1.75, ease: "quint.inOut" },
          0,
        );
    });
  });
  document
    .querySelectorAll(".recruit--grid-block, .exect--card-wrapper")
    .forEach((block) => {
      if (block.hasAttribute("data-button-initialized")) return;
      block.setAttribute("data-button-initialized", "true");
      const caret = block.querySelector(".hover_caret");
      if (!caret) return;
      const caretAp = caret.querySelector(".caret-right-ap"),
        caretDis = caret.querySelector(".caret-right");
      if (!caretAp || !caretDis) return;
      let isAnim = false;
      gsap.set(caretAp, { x: "-100%" });
      gsap.set(caretDis, { x: "0%" });
      block.addEventListener("mouseenter", () => {
        if (isAnim) return;
        isAnim = true;
        gsap
          .timeline({
            onComplete: () => {
              gsap.set(caretAp, { x: "-100%" });
              gsap.set(caretDis, { x: "0%" });
              isAnim = false;
            },
          })
          .to(caretAp, { x: "0%", duration: 1.75, ease: "quint.inOut" }, 0)
          .to(caretDis, { x: "100%", duration: 1.75, ease: "quint.inOut" }, 0);
      });
    });
}
// Card reveal
function initCardReveal() {
  document.querySelectorAll("[data-card-reveal]").forEach((card) => {
    if (card.hasAttribute("data-card-initialized")) return;
    card.setAttribute("data-card-initialized", "true");
    const delay = parseFloat(card.dataset.cardRevealDelay) || 0;
    gsap.set(card, {
      rotateZ: 5,
      clipPath: "polygon(30% 30%, 70% 30%, 70% 70%, 30% 70%)",
    });
    ScrollTrigger.create({
      trigger: card,
      start: "top 100%",
      once: true,
      onEnter: () =>
        gsap.to(card, {
          rotateZ: 0,
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          duration: 2,
          ease: "power4.out",
          delay,
        }),
    });
  });
}
// Mask wipe
function initMaskWipeReveal() {
  document.querySelectorAll("[data-mask-wipe]").forEach((el) => {
    if (el.hasAttribute("data-mask-wipe-initialized")) return;
    el.setAttribute("data-mask-wipe-initialized", "true");
    gsap.set(el, { clipPath: "inset(100% 0% 0% 0%)" });
    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () =>
        gsap.to(el, {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.4,
          delay: 0.3,
          ease: CustomEase.create("smoothReveal", "0.25, 1, 0.35, 1"),
        }),
    });
  });
}
// Recruit SVG animation
let recruitSVGTrigger = null,
  recruitSVGTl = null;
function cleanupRecruitSVG() {
  if (recruitSVGTrigger) {
    recruitSVGTrigger.kill();
    recruitSVGTrigger = null;
  }
  if (recruitSVGTl) {
    recruitSVGTl.kill();
    recruitSVGTl = null;
  }
}
function initRecruitSVG() {
  const m = document.querySelector(".recruit-master"),
    h = document.querySelector(".recruit-helper"),
    t1 = document.querySelector(".recruit-trail-1"),
    t1h = document.querySelector(".recruit-trail-1-helper"),
    t2 = document.querySelector(".recruit-trail-2"),
    t2h = document.querySelector(".recruit-trail-2-helper");
  if (!m || !h) return;
  cleanupRecruitSVG();
  const paths = [m, h, t1, t1h, t2, t2h].filter(Boolean),
    trails = [t1, t1h, t2, t2h].filter(Boolean);
  gsap.set(paths, { drawSVG: 0, visibility: "hidden" });
  const sp = 8,
    d = `0% ${sp}%`,
    e = `${100 - sp}% 100%`,
    ct = gsap.timeline({ paused: true });
  ct.to(m, { drawSVG: d, duration: 0.02, ease: "none" }, 0);
  ct.to(m, { drawSVG: e, duration: 0.96, ease: "none" }, 0.02);
  ct.to(m, { drawSVG: "100% 100%", duration: 0.02, ease: "none" }, 0.98);
  ct.to(h, { drawSVG: d, duration: 0.02, ease: "none" }, 0.98);
  ct.set(m, { drawSVG: d }, 1);
  ct.set(h, { drawSVG: "0% 0%" }, 1);
  if (t1 && t1h) {
    ct.to(t1, { drawSVG: d, duration: 0.02, ease: "none" }, 0.015);
    ct.to(t1, { drawSVG: e, duration: 0.96, ease: "none" }, 0.035);
    ct.to(t1, { drawSVG: "100% 100%", duration: 0.02, ease: "none" }, 0.995);
    ct.to(t1h, { drawSVG: d, duration: 0.02, ease: "none" }, 0.995);
    ct.set(t1, { drawSVG: d }, 1.015);
    ct.set(t1h, { drawSVG: "0% 0%" }, 1.015);
  }
  if (t2 && t2h) {
    ct.to(t2, { drawSVG: d, duration: 0.02, ease: "none" }, 0.03);
    ct.to(t2, { drawSVG: e, duration: 0.96, ease: "none" }, 0.05);
    ct.to(t2, { drawSVG: "100% 100%", duration: 0.02, ease: "none" }, 1.01);
    ct.to(t2h, { drawSVG: d, duration: 0.02, ease: "none" }, 1.01);
    ct.set(t2, { drawSVG: d }, 1.03);
    ct.set(t2h, { drawSVG: "0% 0%" }, 1.03);
  }
  recruitSVGTl = gsap.timeline({ paused: true });
  recruitSVGTl.set(paths, { visibility: "visible" });
  recruitSVGTl.to(ct, { progress: 1, duration: 0.75, ease: "sine.in" });
  recruitSVGTl.to(
    trails,
    { opacity: 0, duration: 0.15, ease: "power2.out" },
    "+=0",
  );
  recruitSVGTl.to(
    [m, h],
    { drawSVG: "0% 100%", duration: 0.3, ease: "power2.out" },
    "<",
  );
  recruitSVGTrigger = ScrollTrigger.create({
    trigger: ".recruit--logo-svg",
    start: "top 50%",
    once: true,
    onEnter: () => recruitSVGTl.play(),
  });
}
// Pie chart
let pieChartInstance = null;
function cleanupPieChart() {
  if (pieChartInstance) {
    pieChartInstance.destroy();
    pieChartInstance = null;
  }
  document
    .querySelector(".chart-wrapper")
    ?.querySelectorAll(".chart-label")
    .forEach((el) => el.remove());
}
function initPieChart() {
  const wrapper = document.querySelector(".chart-wrapper"),
    canvas = document.getElementById("pieChart");
  if (!wrapper || !canvas || typeof Chart === "undefined") return;
  cleanupPieChart();
  if (
    typeof ChartDeferred !== "undefined" &&
    !Chart.registry.plugins.get("deferred")
  )
    Chart.register(ChartDeferred);
  const lang = document.documentElement.lang;
  const labels = lang.startsWith("en")
    ? ["20s", "30s", "40s", "10s"]
    : ["20代", "30代", "40代", "10代"];
  const data = [59, 32, 3, 6],
    colors = ["#e8741f", "#ED9652", "#F2B885", "#F7DAB8"];
  let labelsCreated = false;
  pieChartInstance = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverBackgroundColor: colors,
          hoverOffset: 0,
        },
      ],
    },
    options: {
      cutout: "50%",
      aspectRatio: 1,
      events: [],
      animation: {
        animateRotate: true,
        animateScale: true,
        onComplete: () =>
          gsap.to(".chart-wrapper .chart-label", {
            opacity: 1,
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.1,
          }),
      },
      plugins: {
        deferred: { xOffset: 150, yOffset: "10%", delay: 200 },
        legend: { display: false },
        tooltip: { enabled: false },
      },
    },
    plugins: [
      {
        id: "outsideLabels",
        afterRender: (chart) => {
          if (labelsCreated || !chart.isDatasetVisible(0)) return;
          const meta = chart.getDatasetMeta(0);
          if (!meta.data[0] || meta.data[0].outerRadius === 0) return;
          labelsCreated = true;
          const cx = chart.width / 2,
            cy = chart.height / 2,
            r = meta.data[0].outerRadius,
            gap = window.innerWidth <= 768 ? 50 : 60;
          meta.data.forEach((arc, i) => {
            const mid = (arc.startAngle + arc.endAngle) / 2,
              x = cx + Math.cos(mid) * (r + gap),
              y = cy + Math.sin(mid) * (r + gap);
            const lbl = document.createElement("div");
            lbl.className = "chart-label";
            lbl.innerHTML = `<div class="pie--numbers-container"><div class="pie-numbers-top"><div class="pie-numbers-number">${data[i]}</div><h4 class="pie-numbers--card-heading">%</h4></div><h4 class="pie-numbers--card-heading">${labels[i]}</h4></div>`;
            lbl.style.left = x + "px";
            lbl.style.top = y + "px";
            wrapper.appendChild(lbl);
          });
        },
      },
    ],
  });
}
// Lottie
let lottieInstances = [];
function cleanupLottieInstances() {
  lottieInstances.forEach((a) => {
    try {
      a.destroy();
    } catch (e) {}
  });
  lottieInstances = [];
  document
    .querySelectorAll("[data-lottie-initialized]")
    .forEach((el) => el.removeAttribute("data-lottie-initialized"));
}
function reinitWebflowLottie() {
  const els = document.querySelectorAll('[data-animation-type="lottie"]');
  if (!els.length) return;
  function init() {
    els.forEach((el) => {
      if (el.hasAttribute("data-lottie-initialized")) return;
      const src = el.getAttribute("data-src");
      if (!src) return; // no source — skip WITHOUT clearing (don't break native Lottie)
      el.innerHTML = "";
      el.setAttribute("data-lottie-initialized", "true");
      const anim = lottie.loadAnimation({
        container: el,
        renderer: el.getAttribute("data-renderer") || "svg",
        loop: el.getAttribute("data-loop") === "1",
        autoplay: false,
        path: src,
      });
      lottieInstances.push(anim);
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        onEnter: () => anim.play(),
        once: true,
      });
    });
  }
  if (typeof lottie !== "undefined") init();
  else {
    const s = document.createElement("script");
    s.src =
      "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js";
    s.onload = init;
    document.head.appendChild(s);
  }
}
// Swiper recruit
function initRecruitSwiper() {
  const ns = document
    .querySelector("[data-barba-namespace]")
    ?.getAttribute("data-barba-namespace");
  if (ns !== "recruit") return;
  if (!document.querySelector(".swiper")) return;
  const SPEED = 600;
  let isAnimating = false;
  const swiper2Instances = [];
  document.querySelectorAll(".swiper2").forEach((el) => {
    const instance = new Swiper(el, {
      slidesPerView: 1,
      loop: true,
      speed: SPEED,
      allowTouchMove: false,
      effect: "fade",
      fadeEffect: { crossFade: true },
    });
    swiper2Instances.push(instance);
    instance.on("slideChangeTransitionEnd", () => {
      el.querySelectorAll(".swiper-slide").forEach((slide) => {
        slide.style.pointerEvents = "none";
      });
      el.querySelector(".swiper-slide-active").style.pointerEvents = "auto";
    });
    el.querySelectorAll(".swiper-slide").forEach((slide) => {
      slide.style.pointerEvents = "none";
    });
    el.querySelector(".swiper-slide-active").style.pointerEvents = "auto";
  });
  const swiperEl = document.querySelector(".swiper");
  const swiper = new Swiper(swiperEl, {
    slidesPerView: 3,
    loop: true,
    speed: SPEED,
    spaceBetween: 10,
    allowTouchMove: false,
  });
  swiper.on("slideChange", () => {
    swiper2Instances.forEach((instance) =>
      instance.slideToLoop(swiper.realIndex, SPEED),
    );
  });
  let autoSlideInterval = setInterval(() => {
    if (!isAnimating) {
      isAnimating = true;
      swiperEl.classList.add("is-animating");
      swiper.slideNext(SPEED);
      setTimeout(() => {
        isAnimating = false;
        swiperEl.classList.remove("is-animating");
      }, SPEED + 50);
    }
  }, 5000);
  swiperEl.addEventListener("click", (e) => {
    if (isAnimating) return;
    const clickedSlide = e.target.closest(".swiper-slide");
    if (!clickedSlide) return;
    const allSlides = Array.from(swiperEl.querySelectorAll(".swiper-slide"));
    const activeSlide = swiperEl.querySelector(".swiper-slide-active");
    if (allSlides.indexOf(clickedSlide) - allSlides.indexOf(activeSlide) < 1)
      return;
    isAnimating = true;
    swiperEl.classList.add("is-animating");
    swiper.slideNext(SPEED);
    setTimeout(() => {
      isAnimating = false;
      swiperEl.classList.remove("is-animating");
    }, SPEED + 50);
    clearInterval(autoSlideInterval);
    autoSlideInterval = setInterval(() => {
      if (!isAnimating) {
        isAnimating = true;
        swiperEl.classList.add("is-animating");
        swiper.slideNext(SPEED);
        setTimeout(() => {
          isAnimating = false;
          swiperEl.classList.remove("is-animating");
        }, SPEED + 50);
      }
    }, 5000);
  });
}
// Hero exit
function animateHeroExit() {
  return new Promise((resolve) => {
    const hero = document.querySelector(".hero-heading-home"),
      heroDelay = document.querySelector(".heading-rotation-delay");
    const cap1 = document.querySelector(".hero-caption-first"),
      cap2 = document.querySelector(".hero-caption-second"),
      cap3 = document.querySelector(".hero-caption-third");
    if (!hero && !heroDelay) {
      resolve();
      return;
    }
    if (window.Webflow?.require) {
      const ix2 = window.Webflow.require("ix2");
      if (ix2?.destroy) ix2.destroy();
    }
    const tl = gsap.timeline({ onComplete: resolve });
    const hf = hero?.querySelector(".hero-heading-home-front"),
      hb = hero?.querySelector(".hero-heading-home-back");
    const df = heroDelay?.querySelector(".hero-heading-home-front"),
      db = heroDelay?.querySelector(".hero-heading-home-back");
    if (cap3)
      tl.to(
        cap3,
        { opacity: 0, y: "1em", duration: 0.3, ease: "power2.in" },
        0,
      );
    if (cap2)
      tl.to(
        cap2,
        { opacity: 0, y: "1em", duration: 0.3, ease: "power2.in" },
        0.05,
      );
    if (cap1)
      tl.to(
        cap1,
        { opacity: 0, y: "1em", duration: 0.3, ease: "power2.in" },
        0.1,
      );
    if (heroDelay) {
      tl.to(heroDelay, { opacity: 0, duration: 0.3, ease: "power2.in" }, 0.15);
      if (df)
        tl.to(
          df,
          { rotateX: 0, y: "0%", duration: 0.3, ease: "power2.in" },
          0.15,
        );
      if (db)
        tl.to(
          db,
          { rotateX: -90, y: "100%", duration: 0.3, ease: "power2.in" },
          0.15,
        );
    }
    if (hero) {
      tl.to(hero, { opacity: 0, duration: 0.3, ease: "power2.in" }, 0.25);
      if (hf)
        tl.to(
          hf,
          { rotateX: 0, y: "0%", duration: 0.3, ease: "power2.in" },
          0.25,
        );
      if (hb)
        tl.to(
          hb,
          { rotateX: -90, y: "100%", duration: 0.3, ease: "power2.in" },
          0.25,
        );
    }
  });
}
// Hide hero elements
function hideHeroElements(container) {
  [
    "hero-heading-home",
    "heading-rotation-delay",
    "hero-caption-first",
    "hero-caption-second",
    "hero-caption-third",
  ].forEach((cls) => {
    const el = container.querySelector("." + cls);
    if (el) gsap.set(el, { opacity: 0 });
  });
}
// Reset webflow
function resetWebflow(data) {
  let dom = $(
    new DOMParser().parseFromString(data.next.html, "text/html"),
  ).find("html");
  $("html").attr("data-wf-page", dom.attr("data-wf-page"));
  // Clean up Lottie BEFORE Webflow reinit
  cleanupLottieInstances();
  if (window.Webflow) {
    window.Webflow.destroy();
    window.Webflow.ready();
    window.Webflow.require("ix2").init();
    document.dispatchEvent(new Event("readystatechange"));
  }
  $(".w--current").removeClass("w--current");
  $("a").each(function () {
    if ($(this).attr("href") === window.location.pathname)
      $(this).addClass("w--current");
  });
  cleanupPieChart();
  if (window.ScrollTrigger) ScrollTrigger.getAll().forEach((t) => t.kill());
  gsap.globalTimeline.getChildren().forEach((t) => t.kill());
  document.querySelectorAll("[data-color-reveal]").forEach((el) => {
    if (el.closest('[data-barba="container"]') && el._splitInstance)
      el._splitInstance.revert();
    el.removeAttribute("data-reveal-init");
  });
  document.querySelectorAll("[data-flash-initialized]").forEach((el) => {
    if (el._splitInstance) el._splitInstance.revert();
    el.removeAttribute("data-flash-initialized");
  });
  document.querySelectorAll("[data-card-initialized]").forEach((el) => {
    el.removeAttribute("data-card-initialized");
    gsap.set(el, {
      rotateZ: 5,
      clipPath: "polygon(30% 30%, 70% 30%, 70% 70%, 30% 70%)",
    });
  });
  document.querySelectorAll("[data-mask-wipe-initialized]").forEach((el) => {
    el.removeAttribute("data-mask-wipe-initialized");
    gsap.set(el, { clipPath: "inset(100% 0% 0% 0%)" });
  });
  // if (typeof initLenis === 'function') initLenis();
  if (window.lenis) {
    window.lenis.resize();
    window.lenis.start();
  }
  if (typeof initScrollTop === "function") initScrollTop();
  if (typeof initWebflowURLCleanup === "function") initWebflowURLCleanup();
  if (typeof cleanupSplitLines === "function") cleanupSplitLines();
  if (typeof updateFlashHoverColors === "function") updateFlashHoverColors();
  const ns = document
    .querySelector("[data-barba-namespace]")
    ?.getAttribute("data-barba-namespace");
  if (ns === "home") {
    if (typeof initSplitLines === "function") initSplitLines();
    if (typeof initBrandsVideoHover === "function") initBrandsVideoHover();
    setTimeout(() => {
      if (window.UnicornStudio) {
        if (window.UnicornStudio.destroy) window.UnicornStudio.destroy();
        const c = document.querySelector("[data-us-project]");
        if (c) gsap.set(c, { opacity: 0 });
        const initUS = () => {
          if (window.UnicornStudio.init) {
            UnicornStudio.init();
            initUnicornFadeIn();
          }
        };
        if (window.UnicornStudio.isInitialized) initUS();
        else {
          const checkUS = setInterval(() => {
            if (window.UnicornStudio.isInitialized) {
              clearInterval(checkUS);
              initUS();
            }
          }, 100);
          setTimeout(() => clearInterval(checkUS), 5000);
        }
      }
    }, 200);
    setTimeout(() => {
      if (window.FluidSimulation?.destroy) window.FluidSimulation.destroy();
      window._fluidSimAttempts = 0;
      if (typeof initFluidSimulation === "function") {
        initFluidSimulation();
      }
    }, 200);
  } else if (ns === "company") {
    if (typeof initCountUpAnimations === "function") initCountUpAnimations();
    if (typeof initCompanySwiper === "function") initCompanySwiper();
    if (typeof initDivisionImageSticky === "function")
      initDivisionImageSticky();
  } else if (ns === "brands") {
    if (typeof initBrandsVideoHover === "function") initBrandsVideoHover();
  } else if (ns === "recruit") {
    if (typeof initSplitLinesRecruit === "function") initSplitLinesRecruit();
    if (typeof initRecruitSVG === "function") initRecruitSVG();
    if (typeof initRecruitSwiper === "function") initRecruitSwiper();
  } else if (ns === "numbers") {
    if (typeof initCountUpAnimations === "function") initCountUpAnimations();
    if (typeof initPieChart === "function") initPieChart();
  }
  // barba swapped the DOM — tell Finsweet to re-scan it so the new page's
  // list (filter / pagination / items) re-renders. Only here, never on first
  // load (resetWebflow runs only on barba navigation).
  if (typeof window.reinitFinsweet === "function") window.reinitFinsweet();
  if (typeof window.initPageFromMain === "function") {
    window.initPageFromMain(ns);
  }
  setTimeout(() => {
    if (window.ScrollTrigger) ScrollTrigger.refresh(true);
    const ns2 = document
      .querySelector("[data-barba-namespace]")
      ?.getAttribute("data-barba-namespace");
    if (ns2 === "brands" && typeof initBrandsHeroReveal === "function")
      initBrandsHeroReveal();
    if (typeof initFlashReveal === "function") initFlashReveal();
    if (typeof initCardReveal === "function") initCardReveal();
    if (typeof initColorReveal === "function") initColorReveal();
    if (typeof initMaskWipeReveal === "function") initMaskWipeReveal();
    if (
      (ns2 === "brands" ||
        ns2 === "home" ||
        ns2 === "recruit" ||
        ns2 === "interview-cms") &&
      typeof initBrandsButtonAnimation === "function"
    )
      initBrandsButtonAnimation();
    if (ns2 === "home" && typeof initBestVentureButton === "function")
      initBestVentureButton();
    // re-render Lottie on the new container (its ScrollTriggers survive the
    // kill above because we create them here, after it)
    if (typeof reinitWebflowLottie === "function") reinitWebflowLottie();
  }, 100);
}
// Barba hooks
barba.hooks.before(() => closeMobileMenu());
barba.hooks.afterLeave((data) => {
  if (typeof window.cleanupPageFromMain === "function") {
    window.cleanupPageFromMain(data.current?.namespace);
  }
});
barba.hooks.enter((data) => {
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    visibility: "hidden",
  });
  if (typeof window.prepTabContentReveal === "function") {
    window.prepTabContentReveal(data.next.container);
  }
});
barba.hooks.after((data) => {
  gsap.set(data.next.container, { position: "relative" });
  $(window).scrollTop(0);
  resetWebflow(data);
});
// Barba init
barba.use(barbaPrefetch);
barba.init({
  preventRunning: true,
  timeout: 10000,
  prevent: ({ el }) => {
    return (
      el.hasAttribute("fs-cmsload-element") ||
      el.closest("[fs-cmsload-element]") !== null ||
      el.hasAttribute("fs-list-element") ||
      el.closest("[fs-list-element]") !== null ||
      el.classList.contains("w-pagination-next") ||
      el.classList.contains("w-pagination-previous") ||
      el.closest(".w-pagination-wrapper") !== null
    );
  },
  transitions: [
    {
      name: "to-home-transition",
      to: { namespace: ["home"] },
      async leave(data) {
        if (typeof lockFlashHoverUnderlines === "function")
          lockFlashHoverUnderlines();
        if (typeof lockMobileMenu === "function") lockMobileMenu();
        disableLinks();
        hideHeroElements(data.next.container);
        await unreavealFlashElements();
        await gsap.to(data.current.container, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.inOut",
        });
      },
      async enter(data) {
        gsap.set(data.next.container, { visibility: "visible", opacity: 0 });
        updateNavbarColors("home");
        await gsap.to(data.next.container, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.inOut",
        });
        enableLinks();
        if (typeof unlockFlashHoverUnderlines === "function")
          unlockFlashHoverUnderlines();
        if (typeof unlockMobileMenu === "function") unlockMobileMenu();
      },
    },
    {
      name: "from-home-transition",
      from: { namespace: ["home"] },
      async leave(data) {
        if (typeof lockFlashHoverUnderlines === "function")
          lockFlashHoverUnderlines();
        if (typeof lockMobileMenu === "function") lockMobileMenu();
        disableLinks();
        await Promise.all([animateHeroExit(), unreavealFlashElements()]);
        updateNavbarColors(data.next.namespace);
        await gsap.to(data.current.container, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.inOut",
        });
      },
      async enter(data) {
        gsap.set(data.next.container, { visibility: "visible", opacity: 0 });
        await gsap.to(data.next.container, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.inOut",
        });
        enableLinks();
        if (typeof unlockFlashHoverUnderlines === "function")
          unlockFlashHoverUnderlines();
        if (typeof unlockMobileMenu === "function") unlockMobileMenu();
      },
    },
    {
      name: "default-transition",
      async leave(data) {
        if (typeof lockFlashHoverUnderlines === "function")
          lockFlashHoverUnderlines();
        if (typeof lockMobileMenu === "function") lockMobileMenu();
        disableLinks();
        if (data.next.namespace === "home")
          hideHeroElements(data.next.container);
        updateNavbarColors(data.next.namespace);
        await unreavealFlashElements();
        await gsap.to(data.current.container, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.inOut",
        });
      },
      async enter(data) {
        gsap.set(data.next.container, { visibility: "visible", opacity: 0 });
        await gsap.to(data.next.container, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.inOut",
        });
        enableLinks();
        if (typeof unlockFlashHoverUnderlines === "function")
          unlockFlashHoverUnderlines();
        if (typeof unlockMobileMenu === "function") unlockMobileMenu();
      },
    },
  ],
});
// Init
document.addEventListener("DOMContentLoaded", async () => {
  const ns = document
    .querySelector("[data-barba-namespace]")
    ?.getAttribute("data-barba-namespace");
  const isHome =
    window.location.pathname === "/" || window.location.pathname === "/home";
  initScrollTop();
  initWebflowURLCleanup();
  updateNavbarColors();
  if (typeof initFlashHover === "function") initFlashHover();
  if (isHome && !sessionStorage.getItem("barba-navigated"))
    await initSiteLoader();
  else {
    const loader = document.getElementById("site-loader");
    if (loader) loader.style.display = "none";
    document.documentElement.classList.remove("is-loading");
  }
  // lenis measured the page height while the loader was still up / before
  // images finished, so its scroll limit is too short and the page won't
  // scroll until a manual resize. Re-measure once content has settled.
  const refreshScroll = () => {
    if (window.lenis?.resize) window.lenis.resize();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  };
  refreshScroll();
  window.addEventListener("load", refreshScroll, { once: true });
  if (document.fonts?.ready) document.fonts.ready.then(refreshScroll);
  [300, 800, 1500].forEach((ms) => setTimeout(refreshScroll, ms));
  setTimeout(() => {
    if (ns === "brands" && typeof initBrandsHeroReveal === "function")
      initBrandsHeroReveal();
    initFlashReveal();
    initCardReveal();
    initColorReveal();
    if (typeof initMaskWipeReveal === "function") initMaskWipeReveal();
    if (
      (ns === "brands" ||
        ns === "home" ||
        ns === "recruit" ||
        ns === "interview-cms") &&
      typeof initBrandsButtonAnimation === "function"
    )
      initBrandsButtonAnimation();
    if (
      (ns === "home" || ns === "brands") &&
      typeof initBrandsVideoHover === "function"
    ) {
      initBrandsVideoHover();
      const initUS = () => {
        if (window.UnicornStudio?.init) {
          initUnicornFadeIn();
        }
      };
      if (window.UnicornStudio?.isInitialized) initUS();
      else {
        const checkUS = setInterval(() => {
          if (window.UnicornStudio?.isInitialized) {
            clearInterval(checkUS);
            initUS();
          }
        }, 100);
        setTimeout(() => clearInterval(checkUS), 5000);
      }
    }
    if (ns === "home" && typeof initSplitLines === "function") initSplitLines();
    if (ns === "home" && typeof initBestVentureButton === "function")
      initBestVentureButton();
    if (ns === "recruit") {
      if (typeof initRecruitSVG === "function") initRecruitSVG();
      if (typeof initRecruitSwiper === "function") initRecruitSwiper();
    }
    if (ns === "numbers") {
      if (typeof initCountUpAnimations === "function") initCountUpAnimations();
      if (typeof initPieChart === "function") initPieChart();
    }
    if (ns === "company") {
      if (typeof initDivisionImageSticky === "function")
        initDivisionImageSticky();
    }
    if (typeof window.initPageFromMain === "function") {
      window.initPageFromMain(ns);
    }
    // render Lottie on first load (the only renderer in this codebase — it
    // was defined but never called, so Lottie never got drawn)
    if (typeof reinitWebflowLottie === "function") reinitWebflowLottie();
  }, 100);
});
//swiper init
function initCompanySwiper() {
  if (!document.querySelector(".company-swiper")) return;
  window.companySwiper?.destroy(true, true);
  window.companySwiper = new Swiper(".company-swiper", {
    slidesPerView: "auto",
    slidesPerGroup: 1,
    parallax: true,
    spaceBetween: 20,
    autoplay: {
      delay: 3000,
    },
    loop: true,
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    speed: 1000,
    centeredSlides: true,
    on: {
      init: function () {
        document.querySelector(".company-swiper").style.opacity = "1";
      },
    },
  });
}
window.addEventListener("load", initCompanySwiper);

function initDivisionImageSticky() {
  if (!window.ScrollTrigger) return;

  if (window._divisionImageST) {
    window._divisionImageST.kill();
    window._divisionImageST = null;
  }

  const wrapper = document.querySelector(".our-division-wrapper");
  const image = document.querySelector(".division-image-flame");
  if (!wrapper || !image) return;

  wrapper.style.cssText = "";

  void image.offsetHeight;
  void wrapper.offsetHeight;

  requestAnimationFrame(() => {
    image.style.cssText = "";
    wrapper.style.cssText = "";
    void image.offsetHeight;
    void wrapper.offsetHeight;

    const imgH = image.offsetHeight;
    const wrapH = wrapper.offsetHeight;

    window._divisionImageST = ScrollTrigger.create({
      trigger: wrapper,
      start: "top 0px",
      end: `+=${wrapH - imgH - 100}`,
      pin: image,
      pinSpacing: false,
    });
  });
}
