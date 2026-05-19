window.FinsweetAttributes ||= [];
window.FinsweetAttributes.push([
  "list",
  (lists) => {
    const ns = document
      .querySelector("[data-barba-namespace]")
      ?.getAttribute("data-barba-namespace");
    if (ns !== "recruit") return;
    setFinsweetFilterValues();
  },
]);

function setFinsweetFilterValues() {
  document
    .querySelectorAll('[fs-list-element="filters"] input[type="radio"]')
    .forEach(function (input) {
      const label = input.closest("label, .w-radio");
      if (!label) return;
      const span = label.querySelector("[fs-list-value]");
      if (span) {
        const v = span.getAttribute("fs-list-value");
        input.value = v;
        input.setAttribute("value", v);
      }
    });
  const allBtn = document.querySelector('.all-radio [fs-list-value="*"]');
  if (allBtn) allBtn.setAttribute("fs-list-value", "");
}

function initRecruitPageFeatures() {
  const ns = document
    .querySelector("[data-barba-namespace]")
    ?.getAttribute("data-barba-namespace");
  if (ns !== "recruit") return;

  // 1. Position accordion
  document
    .querySelectorAll(".position-accordion-trigger")
    .forEach(function (trigger) {
      if (trigger.dataset.accordionInit) return;
      trigger.dataset.accordionInit = "true";
      trigger.addEventListener("click", function (e) {
        e.stopPropagation();
        const clickedItem = trigger.closest(".position-item");
        const clickedWrapper = clickedItem.querySelector(
          ".position-detail-wrapper",
        );
        const clickedIcon = trigger.querySelector(".position-icon-ver");
        const isCurrentlyOpen = clickedItem.classList.contains("is-open");
        document
          .querySelectorAll(".position-item.is-open")
          .forEach(function (openItem) {
            const openWrapper = openItem.querySelector(
              ".position-detail-wrapper",
            );
            const openIcon = openItem.querySelector(".position-icon-ver");
            if (openWrapper) openWrapper.style.height = "0px";
            if (openIcon) openIcon.classList.remove("is-open");
            openItem.classList.remove("is-open");
          });
        if (!isCurrentlyOpen) {
          const innerContent = clickedWrapper.firstElementChild;
          clickedWrapper.style.height = innerContent.scrollHeight + "px";
          clickedItem.classList.add("is-open");
          if (clickedIcon) clickedIcon.classList.add("is-open");
        }
      });
    });

  // 2. Division filter — Close
  document
    .querySelectorAll('input[name="division-filter"]')
    .forEach(function (radio) {
      if (radio.dataset.filterResetInit) return;
      radio.dataset.filterResetInit = "true";
      radio.addEventListener("change", function () {
        document
          .querySelectorAll(".position-item.is-open")
          .forEach(function (item) {
            const wrapper = item.querySelector(".position-detail-wrapper");
            const icon = item.querySelector(".position-icon-ver");
            if (wrapper) wrapper.style.height = "0px";
            if (icon) icon.classList.remove("is-open");
            item.classList.remove("is-open");
          });
      });
    });

  // 3. Finsweet filter values + restart
  setFinsweetFilterValues();
  if (window.FinsweetAttributes?.modules?.list) {
    setTimeout(() => window.FinsweetAttributes.modules.list.restart(), 100);
  }

  // 4. Division description switcher
  const descriptions = document.querySelectorAll(".division-desc");
  const emptyMsg = document.querySelector(".description-empty");
  if (descriptions.length) {
    function update() {
      const checkedRadio = document.querySelector(
        '[fs-list-element="filters"] input[type="radio"]:checked',
      );
      let selectedDivision = null;
      if (checkedRadio) {
        const span = checkedRadio
          .closest("label, .w-radio")
          ?.querySelector("[fs-list-value]");
        selectedDivision = span?.getAttribute("fs-list-value");
      }
      if (!selectedDivision) {
        descriptions.forEach((d) => (d.style.display = "none"));
        if (emptyMsg) emptyMsg.style.display = "";
      } else {
        descriptions.forEach((d) => {
          d.style.display =
            d.getAttribute("data-division") === selectedDivision ? "" : "none";
        });
        if (emptyMsg) emptyMsg.style.display = "none";
      }
    }
    document
      .querySelectorAll('[fs-list-element="filters"] input[type="radio"]')
      .forEach((input) => {
        if (input.dataset.descSwitcherInit) return;
        input.dataset.descSwitcherInit = "true";
        input.addEventListener("change", () => setTimeout(update, 50));
      });
    const clearBtn = document.querySelector('[fs-list-element="clear"]');
    if (clearBtn && !clearBtn.dataset.descSwitcherInit) {
      clearBtn.dataset.descSwitcherInit = "true";
      clearBtn.addEventListener("click", () => setTimeout(update, 50));
    }
    update();
  }

  // 5. Staff Voices Swiper
  if (document.querySelector(".staff-voices-swiper")) {
    if (window.staffVoicesMain) {
      try {
        window.staffVoicesMain.destroy(true, true);
      } catch (e) {}
      window.staffVoicesMain = null;
    }
    if (window.staffVoicesThumbs) {
      try {
        window.staffVoicesThumbs.destroy(true, true);
      } catch (e) {}
      window.staffVoicesThumbs = null;
    }
    if (window._staffVoicesResize) {
      window.removeEventListener("resize", window._staffVoicesResize);
      window._staffVoicesResize = null;
    }

    const SLIDE_DURATION = 5000;
    let isSwitching = false;

    const staffVoicesThumbs = new Swiper(".staff-voices-thumbs", {
      slidesPerView: 4,
      spaceBetween: 16,
      freeMode: true,
      watchSlidesProgress: true,
      slideToClickedSlide: true,
      breakpoints: {
        0: { slidesPerView: "auto", spaceBetween: 12 },
        992: { slidesPerView: 4, spaceBetween: 16 },
      },
    });

    function setupAllPaths() {
      document.querySelectorAll(".thumb-progress svg").forEach((svg) => {
        svg.style.clipPath = "inset(0 100% 0 0)";
      });
    }
    function hideAllLines() {
      document.querySelectorAll(".thumb-progress svg").forEach((svg) => {
        svg.style.clipPath = "inset(0 100% 0 0)";
      });
    }

    let resizeTimer;
    window._staffVoicesResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setupAllPaths, 200);
    };
    window.addEventListener("resize", window._staffVoicesResize);

    const staffVoicesMain = new Swiper(".staff-voices-swiper", {
      slidesPerView: 1,
      effect: "fade",
      fadeEffect: { crossFade: true },
      allowTouchMove: false,
      autoplay: { delay: SLIDE_DURATION, disableOnInteraction: false },
      thumbs: { swiper: staffVoicesThumbs },
      on: {
        init() {
          setupAllPaths();
        },
        autoplayTimeLeft(s, time, progress) {
          if (isSwitching) return;
          const svg = document.querySelector(
            ".staff-voices-thumbs .swiper-slide-thumb-active .thumb-progress svg",
          );
          if (!svg) return;
          svg.style.clipPath = `inset(0 ${progress * 100}% 0 0)`;
        },
        slideChangeTransitionStart() {
          isSwitching = true;
        },
        slideChangeTransitionEnd() {
          hideAllLines();
          isSwitching = false;
          if (window.innerWidth < 992) {
            staffVoicesThumbs.slideTo(staffVoicesMain.activeIndex, 300);
          }
        },
      },
    });

    window.staffVoicesMain = staffVoicesMain;
    window.staffVoicesThumbs = staffVoicesThumbs;
  }
}

document.addEventListener("DOMContentLoaded", initRecruitPageFeatures);

(function attachBarbaHook() {
  if (window.barba) {
    barba.hooks.after(() => setTimeout(initRecruitPageFeatures, 150));
  } else {
    setTimeout(attachBarbaHook, 100);
  }
})();

window._tplCleanup = window._tplCleanup || {};

function cleanupInterviewTemplate() {
  const c = window._tplCleanup;
  if (c.observer) {
    c.observer.disconnect();
    c.observer = null;
  }
  if (c.scrollHandler) {
    window.removeEventListener("scroll", c.scrollHandler);
    c.scrollHandler = null;
  }
  if (c.resizeHandlers) {
    c.resizeHandlers.forEach((fn) => window.removeEventListener("resize", fn));
    c.resizeHandlers = null;
  }
  if (c.loadHandler) {
    window.removeEventListener("load", c.loadHandler);
    c.loadHandler = null;
  }
  if (c.staffVoicesMain) {
    try {
      c.staffVoicesMain.destroy(true, true);
    } catch (e) {}
    c.staffVoicesMain = null;
  }
  if (c.staffVoicesThumbs) {
    try {
      c.staffVoicesThumbs.destroy(true, true);
    } catch (e) {}
    c.staffVoicesThumbs = null;
  }
  window.tocSetHorizontalActive = null;
}

function initInterviewTemplate() {
  const ns = document
    .querySelector("[data-barba-namespace]")
    ?.getAttribute("data-barba-namespace");
  if (ns !== "interview-cms") return;

  cleanupInterviewTemplate();
  window._tplCleanup.resizeHandlers = [];

  // ============================================================
  // Part A · TOC Scroll Spy
  const wrapper = document.querySelector(".toc-wrapper");
  if (wrapper) {
    const track = wrapper.querySelector(".toc-track");
    const onLayer = wrapper.querySelector(".toc-track-on");
    const links = Array.prototype.slice.call(
      wrapper.querySelectorAll(".toc-link"),
    );

    if (track && onLayer && links.length) {
      const X_HEADER = 0.5,
        X_SUB = 12.5,
        BEND = 12,
        CTRL_OFFSET = 1.664,
        CURVE_Y = 3.109;
      const horizontalLinkHrefs = [
        "#09-00",
        "#10-30",
        "#13-00",
        "#15-00",
        "#18-00",
        "#20-00",
      ];

      function xOf(link) {
        return link.getAttribute("data-level") === "header" ? X_HEADER : X_SUB;
      }

      function buildPath() {
        let d = "",
          totalH = 0;
        for (let i = 0; i < links.length; i++) {
          const L = links[i],
            curX = xOf(L);
          const top = L.offsetTop,
            bottom = top + L.offsetHeight;
          const next = links[i + 1],
            nextX = next ? xOf(next) : curX;
          if (i === 0) d += "M " + curX + " " + top;
          d += " L " + curX + " " + bottom;
          if (next && nextX !== curX) {
            const nextTop = next.offsetTop;
            const midY = (bottom + nextTop) / 2;
            const bendStart = midY - BEND / 2;
            const bendEnd = midY + BEND / 2;
            d = d.replace(
              /L \d+(\.\d+)? \d+(\.\d+)?$/,
              "L " + curX + " " + bendStart,
            );
            const dir = nextX > curX ? 1 : -1;
            const p1x = curX + dir * CTRL_OFFSET,
              p1y = bendStart + CURVE_Y;
            d += " Q " + curX + " " + (bendStart + 2) + " " + p1x + " " + p1y;
            const p2x = nextX - dir * CTRL_OFFSET,
              p2y = bendEnd - CURVE_Y;
            d += " L " + p2x + " " + p2y;
            d +=
              " Q " + nextX + " " + (bendEnd - 2) + " " + nextX + " " + bendEnd;
            totalH = nextTop + next.offsetHeight;
          } else {
            totalH = bottom;
          }
        }
        return { d, h: totalH };
      }

      function applyMask() {
        const r = buildPath();
        const svg =
          "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 " +
          r.h +
          "' preserveAspectRatio='xMidYMid meet'><path d='" +
          r.d +
          "' stroke='black' stroke-width='1.5' fill='none' vector-effect='non-scaling-stroke'/></svg>";
        const url = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
        track.style.height = r.h + "px";
        track.style.maskImage = url;
        track.style.webkitMaskImage = url;
        track.style.maskRepeat = "no-repeat";
        track.style.webkitMaskRepeat = "no-repeat";
        track.style.maskSize = "100% 100%";
        track.style.webkitMaskSize = "100% 100%";
        return r.h;
      }

      let TRACK_H = applyMask();

      links.forEach(function (link) {
        const href =
          link.getAttribute("href") || link.getAttribute("data-href") || "";
        if (horizontalLinkHrefs.indexOf(href) !== -1) {
          link.setAttribute("data-href", href);
          link.removeAttribute("href");
          link.style.cursor = "pointer";
        }
      });

      const pairs = [];
      links.forEach(function (link) {
        const href =
          link.getAttribute("href") || link.getAttribute("data-href") || "";
        const id = href.replace("#", "");
        if (horizontalLinkHrefs.indexOf(href) !== -1) return;
        if (href === "#day-to-day") return;
        const sec = id ? document.getElementById(id) : null;
        if (sec) pairs.push({ link: link, section: sec });
      });

      const activeIds = new Set();
      let horizontalActiveHref = null;

      function render() {
        const actives = [];
        pairs.forEach(function (p) {
          if (activeIds.has(p.section.id)) {
            p.link.classList.add("is-active");
            actives.push(p.link);
          } else {
            p.link.classList.remove("is-active");
          }
        });
        horizontalLinkHrefs.forEach(function (href) {
          const link = wrapper.querySelector(
            '.toc-link[href="' +
              href +
              '"], .toc-link[data-href="' +
              href +
              '"]',
          );
          if (!link) return;
          if (href === horizontalActiveHref) {
            link.classList.add("is-active");
            actives.push(link);
          } else {
            link.classList.remove("is-active");
          }
        });
        const dayToDayLink = wrapper.querySelector(
          '.toc-link[href="#day-to-day"], .toc-link[data-href="#day-to-day"]',
        );
        if (dayToDayLink) {
          if (horizontalActiveHref) {
            dayToDayLink.classList.add("is-active");
            actives.push(dayToDayLink);
          } else {
            dayToDayLink.classList.remove("is-active");
          }
        }
        if (actives.length === 0) {
          onLayer.style.top = "0px";
          onLayer.style.bottom = "100%";
          return;
        }
        actives.sort(function (a, b) {
          return a.offsetTop - b.offsetTop;
        });
        const first = actives[0],
          last = actives[actives.length - 1];
        onLayer.style.top = first.offsetTop + "px";
        onLayer.style.bottom =
          TRACK_H - (last.offsetTop + last.offsetHeight) + "px";
      }

      window.tocSetHorizontalActive = function (href) {
        horizontalActiveHref = href;
        render();
      };

      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) activeIds.add(e.target.id);
            else activeIds.delete(e.target.id);
          });
          render();
        },
        { rootMargin: "-15% 0px -15% 0px", threshold: 0 },
      );
      pairs.forEach(function (p) {
        observer.observe(p.section);
      });
      window._tplCleanup.observer = observer;

      links.forEach(function (link) {
        if (link.dataset.tocClickInit) return;
        link.dataset.tocClickInit = "true";
        link.addEventListener(
          "click",
          function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            const href =
              link.getAttribute("href") || link.getAttribute("data-href") || "";
            const horizontalIdx = horizontalLinkHrefs.indexOf(href);
            if (horizontalIdx !== -1) {
              const outer = document.querySelector(
                ".horizontal-scroll-section-outer",
              );
              if (outer) {
                const progress =
                  horizontalIdx / (horizontalLinkHrefs.length - 1);
                const scrollable = outer.offsetHeight - window.innerHeight;
                const targetY = outer.offsetTop + progress * scrollable;
                if (window.gsap) {
                  window.gsap.to(window, {
                    duration: 1,
                    scrollTo: targetY,
                    ease: "power2.inOut",
                  });
                } else {
                  window.scrollTo({ top: targetY, behavior: "smooth" });
                }
              }
              return;
            }
            const id = href.replace("#", "");
            const target = id ? document.getElementById(id) : null;
            if (!target) return;
            const targetY =
              target.getBoundingClientRect().top + window.pageYOffset - 80;
            if (window.gsap) {
              window.gsap.to(window, {
                duration: 1,
                scrollTo: targetY,
                ease: "power2.inOut",
              });
            } else {
              window.scrollTo({ top: targetY, behavior: "smooth" });
            }
          },
          true,
        );
      });

      function recalc() {
        TRACK_H = applyMask();
        render();
      }
      window._tplCleanup.resizeHandlers.push(recalc);
      window._tplCleanup.loadHandler = recalc;
      window.addEventListener("resize", recalc);
      window.addEventListener("load", recalc);
      if (document.fonts?.ready) document.fonts.ready.then(recalc);
      setTimeout(recalc, 500);
      setTimeout(recalc, 1500);
    }
  }

  // ============================================================
  // Part B · Horizontal Pin Scroll
  const outer = document.querySelector(".horizontal-scroll-section-outer");
  const pin = document.querySelector(".horizontal-scroll-section-wrapper");
  const hTrack = document.querySelector(".horizontal-track");

  if (outer && pin && hTrack) {
    const items = hTrack.querySelectorAll(".day-to-day-card");
    if (items.length) {
      const horizontalLinkHrefs = [
        "#09-00",
        "#10-30",
        "#13-00",
        "#15-00",
        "#18-00",
        "#20-00",
      ];
      let lastActiveIdx = -2;
      let ticking = false;

      function update() {
        const rect = outer.getBoundingClientRect();
        const pinRect = pin.getBoundingClientRect();
        const pinHeight = window.innerHeight;
        const scrollable = outer.offsetHeight - pinHeight;
        const progress = Math.max(0, Math.min(1, -rect.top / scrollable));
        const maxTranslate = Math.max(0, hTrack.scrollWidth - pin.offsetWidth);
        const translateX = -progress * maxTranslate;
        hTrack.style.transform = "translate3d(" + translateX + "px, 0, 0)";
        let activeIdx;
        if (pinRect.bottom <= 0 || pinRect.top >= pinHeight) activeIdx = -1;
        else if (progress >= 1) activeIdx = horizontalLinkHrefs.length - 1;
        else if (progress <= 0) activeIdx = 0;
        else
          activeIdx = Math.min(
            horizontalLinkHrefs.length - 1,
            Math.floor(progress * horizontalLinkHrefs.length),
          );
        if (activeIdx !== lastActiveIdx) {
          lastActiveIdx = activeIdx;
          if (window.tocSetHorizontalActive) {
            window.tocSetHorizontalActive(
              activeIdx >= 0 ? horizontalLinkHrefs[activeIdx] : null,
            );
          }
        }
      }

      function onScroll() {
        if (!ticking) {
          window.requestAnimationFrame(function () {
            update();
            ticking = false;
          });
          ticking = true;
        }
      }

      window._tplCleanup.scrollHandler = onScroll;
      window._tplCleanup.resizeHandlers.push(update);
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", update);
      setTimeout(update, 100);
    }
  }

  // ============================================================
  // Part C · Staff Voices Swiper
  if (document.querySelector(".staff-voices-swiper")) {
    const SLIDE_DURATION = 5000;
    let isSwitching = false;

    const staffVoicesThumbs = new Swiper(".staff-voices-thumbs", {
      slidesPerView: 4,
      spaceBetween: 16,
      freeMode: true,
      watchSlidesProgress: true,
      slideToClickedSlide: true,
      breakpoints: {
        0: { slidesPerView: "auto", spaceBetween: 12 },
        992: { slidesPerView: 4, spaceBetween: 16 },
      },
    });

    function setupAllPaths() {
      document.querySelectorAll(".thumb-progress svg").forEach((svg) => {
        svg.style.clipPath = "inset(0 100% 0 0)";
      });
    }
    function hideAllLines() {
      document.querySelectorAll(".thumb-progress svg").forEach((svg) => {
        svg.style.clipPath = "inset(0 100% 0 0)";
      });
    }

    let resizeTimer;
    const staffResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setupAllPaths, 200);
    };
    window.addEventListener("resize", staffResize);
    window._tplCleanup.resizeHandlers.push(staffResize);

    const staffVoicesMain = new Swiper(".staff-voices-swiper", {
      slidesPerView: 1,
      effect: "fade",
      fadeEffect: { crossFade: true },
      allowTouchMove: false,
      autoplay: { delay: SLIDE_DURATION, disableOnInteraction: false },
      thumbs: { swiper: staffVoicesThumbs },
      on: {
        init() {
          setupAllPaths();
        },
        autoplayTimeLeft(s, time, progress) {
          if (isSwitching) return;
          const svg = document.querySelector(
            ".staff-voices-thumbs .swiper-slide-thumb-active .thumb-progress svg",
          );
          if (!svg) return;
          svg.style.clipPath = `inset(0 ${progress * 100}% 0 0)`;
        },
        slideChangeTransitionStart() {
          isSwitching = true;
        },
        slideChangeTransitionEnd() {
          hideAllLines();
          isSwitching = false;
          if (window.innerWidth < 992) {
            staffVoicesThumbs.slideTo(staffVoicesMain.activeIndex, 300);
          }
        },
      },
    });

    window._tplCleanup.staffVoicesMain = staffVoicesMain;
    window._tplCleanup.staffVoicesThumbs = staffVoicesThumbs;
    window.staffVoicesMain = staffVoicesMain;
    window.staffVoicesThumbs = staffVoicesThumbs;
  }
}

document.addEventListener("DOMContentLoaded", initInterviewTemplate);

(function attachBarbaHook() {
  if (window.barba) {
    barba.hooks.before(() => {
      const ns = document
        .querySelector("[data-barba-namespace]")
        ?.getAttribute("data-barba-namespace");
      if (ns === "interview-template") cleanupInterviewTemplate();
    });
    barba.hooks.after(() => setTimeout(initInterviewTemplate, 150));
  } else {
    setTimeout(attachBarbaHook, 100);
  }
})();

// ============================================
// Line Animation
// ============================================
const LINE_SHOW_MARKERS = false;
const LINE_SMOOTH_FACTOR = 0.2;
const LINE_DRAW_SPEED = 1.08;

function cleanupLineAnimation() {
  if (window._lineAnimST) {
    window._lineAnimST.kill();
    window._lineAnimST = null;
  }
  if (window._lineAnimRAF) {
    cancelAnimationFrame(window._lineAnimRAF);
    window._lineAnimRAF = null;
  }
  if (window._lineAnimRO) {
    window._lineAnimRO.disconnect();
    window._lineAnimRO = null;
  }
  if (window._lineAnimSettleTimers) {
    window._lineAnimSettleTimers.forEach((id) => clearTimeout(id));
    window._lineAnimSettleTimers = null;
  }
}

function initLineAnimation() {
  if (!window.ScrollTrigger || !window.gsap) return;

  cleanupLineAnimation();

  const wrapper = document.querySelector(".line-animation-wrapper");
  const svg = document.querySelector(".line-animation-svg");
  const path = document.querySelector(".line-animation-path");
  if (!wrapper || !svg || !path) return;

  function updateWrapperTopPosition() {
    const lockerNumber = document.querySelector(".locker-number");
    if (!lockerNumber) return;

    const wrapperParent = wrapper.offsetParent;
    if (!wrapperParent) return;

    let topInParent = 0;
    let node = lockerNumber;

    while (node && node !== wrapperParent) {
      topInParent += node.offsetTop;
      node = node.offsetParent;
    }

    if (node === wrapperParent) {
      const topPos = topInParent + lockerNumber.offsetHeight + 200;
      wrapper.style.top = `${topPos}px`;
    }
  }

  updateWrapperTopPosition();

  const sections = document.querySelectorAll("[data-line-anchor]");
  if (!sections.length) return;

  let totalPathLen = 0;
  let wrapperHeight = 0;

  function buildPath() {
    const wrapperRect = wrapper.getBoundingClientRect();
    const wrapperTop = wrapperRect.top + window.pageYOffset;
    const wrapperW = wrapper.offsetWidth;
    const wrapperH = wrapper.offsetHeight;
    wrapperHeight = wrapperH;

    const PADDING_X = 24;
    const LEFT_X = PADDING_X;
    const RIGHT_X = wrapperW - PADDING_X;
    const CENTER_X = wrapperW / 2;

    function clampX(x) {
      return Math.max(LEFT_X, Math.min(RIGHT_X, x));
    }

    function getLineX(sec, i) {
      const customX = sec.getAttribute("data-line-x");
      if (customX) {
        const value = customX.trim().toLowerCase();
        if (value === "left") return LEFT_X;
        if (value === "right") return RIGHT_X;
        if (value === "center") return CENTER_X;
        if (value.endsWith("%")) {
          const pct = parseFloat(value);
          if (!isNaN(pct)) return clampX((wrapperW * pct) / 100);
        }
        const px = parseFloat(value);
        if (!isNaN(px)) return clampX(px);
      }

      const align = sec.getAttribute("data-line-anchor");
      if (align === "left") return LEFT_X;
      if (align === "right") return RIGHT_X;
      return i % 2 === 0 ? RIGHT_X : LEFT_X;
    }

    function getBendY(sec, secTop, secHeight) {
      const raw = sec.getAttribute("data-line-y");
      if (!raw) return secTop;
      const align = raw.trim().toLowerCase();
      if (align === "top") return secTop;
      if (align === "center") return secTop + secHeight / 2;
      if (align === "bottom") return secTop + secHeight;
      if (align.endsWith("%"))
        return secTop + secHeight * (parseFloat(align) / 100);
      if (align.startsWith("+") || align.startsWith("-"))
        return secTop + parseFloat(align);
      if (!isNaN(parseFloat(align))) return secTop + parseFloat(align);
      return secTop;
    }

    let d = "";
    const firstLineX = getLineX(sections[0], 0);
    d += `M ${firstLineX} 0`;

    sections.forEach((sec, i) => {
      const secRect = sec.getBoundingClientRect();
      const secTop = secRect.top + window.pageYOffset - wrapperTop;
      const secHeight = secRect.height;
      const bendY = getBendY(sec, secTop, secHeight);
      const lineX = getLineX(sec, i);

      d += ` L ${lineX} ${bendY}`;

      if (i < sections.length - 1) {
        const nextLineX = getLineX(sections[i + 1], i + 1);
        d += ` L ${nextLineX} ${bendY}`;
      }
    });

    const lastLineX = getLineX(
      sections[sections.length - 1],
      sections.length - 1,
    );
    d += ` L ${lastLineX} ${wrapperH}`;

    svg.setAttribute("viewBox", `0 0 ${wrapperW} ${wrapperH}`);
    svg.setAttribute("width", wrapperW);
    svg.setAttribute("height", wrapperH);
    path.setAttribute("d", d);

    totalPathLen = path.getTotalLength();

    path.style.strokeDasharray = totalPathLen;
    path.style.strokeDashoffset = totalPathLen;
  }

  function pathLengthAtY(targetY) {
    if (targetY <= 0) return 0;
    if (targetY >= wrapperHeight) return totalPathLen;

    // Binary search on path length for robust, sub-pixel Y matching.
    let lo = 0;
    let hi = totalPathLen;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      const y = path.getPointAtLength(mid).y;
      if (y < targetY) lo = mid;
      else hi = mid;
    }
    return hi;
  }

  function offsetFromViewportCenter() {
    const targetY =
      window.innerHeight * 0.5 - wrapper.getBoundingClientRect().top;
    const clamped = Math.max(0, Math.min(wrapperHeight, targetY));
    const lengthToDraw = Math.min(
      totalPathLen,
      pathLengthAtY(clamped) * LINE_DRAW_SPEED,
    );
    return totalPathLen - lengthToDraw;
  }

  buildPath();

  let currentOffset = totalPathLen;
  let targetOffset = totalPathLen;

  function smoothTick() {
    const diff = targetOffset - currentOffset;
    if (Math.abs(diff) < 0.5) {
      currentOffset = targetOffset;
    } else {
      currentOffset += diff * LINE_SMOOTH_FACTOR;
    }
    path.style.strokeDashoffset = currentOffset;
    window._lineAnimRAF = requestAnimationFrame(smoothTick);
  }
  smoothTick();

  window._lineAnimST = ScrollTrigger.create({
    trigger: wrapper,
    start: () =>
      window.matchMedia("(max-width: 767px)").matches ? "top 10%" : "top 20%",
    end: "bottom bottom",
    scrub: true,
    markers: LINE_SHOW_MARKERS,
    invalidateOnRefresh: true,
    onRefresh: (self) => {
      updateWrapperTopPosition();
      buildPath();

      if (!self.isActive) {
        targetOffset = self.progress <= 0 ? totalPathLen : 0;
      } else {
        targetOffset = offsetFromViewportCenter();
      }

      // Keep continuity after refresh to avoid sudden "draw all at once" jumps.
      currentOffset = targetOffset;
    },
    onUpdate: (self) => {
      // Keep the line at exact start/end states outside the active range.
      if (!self.isActive) {
        targetOffset = self.progress <= 0 ? totalPathLen : 0;
        return;
      }

      targetOffset = offsetFromViewportCenter();
    },
  });

  ScrollTrigger.refresh();

  // First paint in Webflow can still shift after DOMContentLoaded.
  // Run a few settle refreshes to mimic the "open devtools -> resize" fix.
  window._lineAnimSettleTimers = [0, 120, 360, 800].map((ms) =>
    setTimeout(() => {
      if (window._lineAnimST) window._lineAnimST.refresh();
    }, ms),
  );

  // Keep geometry in sync if fixed-height spacer sections are restyled
  // by interactions, responsive rules, or async class changes.
  if (typeof ResizeObserver !== "undefined") {
    let roTicking = false;
    const ro = new ResizeObserver(() => {
      if (roTicking) return;
      roTicking = true;
      requestAnimationFrame(() => {
        roTicking = false;
        if (window._lineAnimST) window._lineAnimST.refresh();
      });
    });
    ro.observe(wrapper);
    sections.forEach((sec) => ro.observe(sec));
    window._lineAnimRO = ro;
  }

  wrapper.querySelectorAll("img").forEach((img) => {
    if (!img.complete) {
      img.addEventListener(
        "load",
        () => {
          if (window._lineAnimST) window._lineAnimST.refresh();
        },
        { once: true },
      );
    }
  });
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      if (window._lineAnimST) window._lineAnimST.refresh();
    });
  }
  window.addEventListener(
    "load",
    () => {
      if (window._lineAnimST) window._lineAnimST.refresh();
    },
    { once: true },
  );
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(initLineAnimation, 300);
});

(function attachLineBarbaHook() {
  if (window.barba) {
    barba.hooks.before(cleanupLineAnimation);
    barba.hooks.afterEnter(() => {
      setTimeout(initLineAnimation, 400);
    });
  } else {
    setTimeout(attachLineBarbaHook, 100);
  }
})();

window.addEventListener("popstate", () => {
  setTimeout(() => {
    if (window._lineAnimST) window._lineAnimST.refresh();
  }, 500);
});
