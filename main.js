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
  const recruitContainer = document.querySelector(
    "[data-barba-namespace='recruit']",
  );
  if (recruitContainer && !recruitContainer.dataset.accordionDelegate) {
    recruitContainer.dataset.accordionDelegate = "true";

    const ACCORDION_SCROLL_OFFSET = 100;

    function computeFinalTargetY(clickedItem) {
      let collapseDelta = 0;
      document
        .querySelectorAll(".position-item.is-open")
        .forEach(function (openItem) {
          if (openItem === clickedItem) return;
          const rel = openItem.compareDocumentPosition(clickedItem);
          const isAboveClicked = rel & Node.DOCUMENT_POSITION_FOLLOWING;
          if (!isAboveClicked) return;
          const t = openItem.querySelector(".position-accordion-trigger");
          const closedH = t ? t.getBoundingClientRect().height : 0;
          const openH = openItem.getBoundingClientRect().height;
          collapseDelta += Math.max(0, openH - closedH);
        });
      const currentTop =
        clickedItem.getBoundingClientRect().top + window.pageYOffset;
      return currentTop - collapseDelta - ACCORDION_SCROLL_OFFSET;
    }

    function scrollToY(y) {
      if (window.lenis?.scrollTo) {
        window.lenis.scrollTo(y, { duration: 1 });
      } else if (window.gsap?.to) {
        window.gsap.to(window, {
          duration: 1,
          scrollTo: { y, autoKill: false },
          ease: "power2.inOut",
        });
      } else {
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }

    recruitContainer.addEventListener("click", function (e) {
      const trigger = e.target.closest(".position-accordion-trigger");
      if (!trigger) return;
      e.stopPropagation();
      const clickedItem = trigger.closest(".position-item");
      if (!clickedItem) return;
      const clickedIcon = trigger.querySelector(".position-icon-ver");
      const isCurrentlyOpen = clickedItem.classList.contains("is-open");

      const targetY = !isCurrentlyOpen
        ? computeFinalTargetY(clickedItem)
        : null;

      document
        .querySelectorAll(".position-item.is-open")
        .forEach(function (openItem) {
          const openIcon = openItem.querySelector(".position-icon-ver");
          if (openIcon) openIcon.classList.remove("is-open");
          openItem.classList.remove("is-open");
        });
      if (!isCurrentlyOpen) {
        clickedItem.classList.add("is-open");
        if (clickedIcon) clickedIcon.classList.add("is-open");
        scrollToY(targetY);
      }
    });
  }

  // 2. Division filter — Close + scroll to list top
  const FILTER_SCROLL_OFFSET = 100;
  function scrollToPositionListTop() {
    const listEl =
      document.querySelector('[fs-list-element="list"]') ||
      document.querySelector(".position-list") ||
      document.querySelector(".position-item")?.parentElement;
    if (!listEl) return;
    const targetY =
      listEl.getBoundingClientRect().top +
      window.pageYOffset -
      FILTER_SCROLL_OFFSET;
    if (window.pageYOffset <= targetY) return;
    if (window.lenis?.scrollTo) {
      window.lenis.scrollTo(targetY, { duration: 0.8 });
    } else if (window.gsap?.to) {
      window.gsap.to(window, {
        duration: 0.8,
        scrollTo: { y: targetY, autoKill: false },
        ease: "power2.inOut",
      });
    } else {
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }
  }

  document
    .querySelectorAll('input[name="division-filter"]')
    .forEach(function (radio) {
      if (radio.dataset.filterResetInit) return;
      radio.dataset.filterResetInit = "true";
      radio.addEventListener("change", function () {
        document
          .querySelectorAll(".position-item.is-open")
          .forEach(function (item) {
            const icon = item.querySelector(".position-icon-ver");
            if (icon) icon.classList.remove("is-open");
            item.classList.remove("is-open");
          });
        scrollToPositionListTop();
      });
    });

  const filterClearBtn = document.querySelector('[fs-list-element="clear"]');
  if (filterClearBtn && !filterClearBtn.dataset.filterScrollInit) {
    filterClearBtn.dataset.filterScrollInit = "true";
    filterClearBtn.addEventListener("click", scrollToPositionListTop);
  }

  // 3. Division description switcher
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
        descriptions.forEach((d) => d.classList.remove("is-active"));
        if (emptyMsg) emptyMsg.style.display = "";
      } else {
        descriptions.forEach((d) => {
          d.classList.toggle(
            "is-active",
            d.getAttribute("data-division") === selectedDivision,
          );
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

  // 4. Staff Voices Swiper
  if (document.querySelector(".staff-voices-swiper")) {
    cleanupRecruitSwiper();

    const SLIDE_DURATION = 5000;
    let isSwitching = false;
    let activeThumbSvg = null;

    const staffVoicesThumbs = new Swiper(".staff-voices-thumbs", {
      slidesPerView: 4,
      spaceBetween: 16,
      freeMode: true,
      watchSlidesProgress: true,
      slideToClickedSlide: true,
      observer: true,
      observeParents: true,
      observeSlideChildren: true,
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
    function refreshActiveThumbSvg() {
      activeThumbSvg = document.querySelector(
        ".staff-voices-thumbs .swiper-slide-thumb-active .thumb-progress svg",
      );
    }
    function settleThumbProgress() {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setupAllPaths();
          refreshActiveThumbSvg();
          staffVoicesThumbs.update();
          if (window.staffVoicesMain) window.staffVoicesMain.update();
        });
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
      speed: 1000,
      allowTouchMove: false,
      autoplay: { delay: SLIDE_DURATION, disableOnInteraction: false },
      thumbs: { swiper: staffVoicesThumbs },
      observer: true,
      observeParents: true,
      observeSlideChildren: true,
      on: {
        init() {
          setupAllPaths();
        },
        afterInit() {
          settleThumbProgress();
        },
        imagesReady() {
          settleThumbProgress();
        },
        autoplayTimeLeft(s, time, progress) {
          if (isSwitching || !activeThumbSvg) return;
          activeThumbSvg.style.clipPath = `inset(0 ${progress * 100}% 0 0)`;
        },
        slideChangeTransitionStart() {
          isSwitching = true;
        },
        slideChangeTransitionEnd() {
          hideAllLines();
          isSwitching = false;
          refreshActiveThumbSvg();
          if (window.innerWidth < 992) {
            staffVoicesThumbs.slideTo(staffVoicesMain.activeIndex, 300);
          }
        },
      },
    });

    window.staffVoicesMain = staffVoicesMain;
    window.staffVoicesThumbs = staffVoicesThumbs;

    if (document.fonts?.ready) {
      document.fonts.ready.then(settleThumbProgress);
    }
    window.addEventListener("load", settleThumbProgress, { once: true });
  }
}

function cleanupRecruitSwiper() {
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
}

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
  window.staffVoicesMain = null;
  window.staffVoicesThumbs = null;
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
    let activeThumbSvg = null;

    const staffVoicesThumbs = new Swiper(".staff-voices-thumbs", {
      slidesPerView: 4,
      spaceBetween: 16,
      freeMode: true,
      watchSlidesProgress: true,
      slideToClickedSlide: true,
      observer: true,
      observeParents: true,
      observeSlideChildren: true,
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
    function refreshActiveThumbSvg() {
      activeThumbSvg = document.querySelector(
        ".staff-voices-thumbs .swiper-slide-thumb-active .thumb-progress svg",
      );
    }
    function settleThumbProgress() {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setupAllPaths();
          refreshActiveThumbSvg();
          staffVoicesThumbs.update();
          if (window.staffVoicesMain) window.staffVoicesMain.update();
        });
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
      speed: 1000,
      allowTouchMove: false,
      autoplay: { delay: SLIDE_DURATION, disableOnInteraction: false },
      thumbs: { swiper: staffVoicesThumbs },
      observer: true,
      observeParents: true,
      observeSlideChildren: true,
      on: {
        init() {
          setupAllPaths();
        },
        afterInit() {
          settleThumbProgress();
        },
        imagesReady() {
          settleThumbProgress();
        },
        autoplayTimeLeft(s, time, progress) {
          if (isSwitching || !activeThumbSvg) return;
          activeThumbSvg.style.clipPath = `inset(0 ${progress * 100}% 0 0)`;
        },
        slideChangeTransitionStart() {
          isSwitching = true;
        },
        slideChangeTransitionEnd() {
          hideAllLines();
          isSwitching = false;
          refreshActiveThumbSvg();
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

    if (document.fonts?.ready) {
      document.fonts.ready.then(settleThumbProgress);
    }
    window.addEventListener("load", settleThumbProgress, { once: true });
  }
}

// ============================================
// Line Animation
// ============================================
const LINE_SHOW_MARKERS = false;
const LINE_SMOOTH_FACTOR = 0.2;
const LINE_DRAW_SPEED = 1.05;

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
  let pathSegments = [];

  function buildPath() {
    const savedTransforms = [];
    sections.forEach((sec) => {
      [sec, sec.parentElement].forEach((el) => {
        if (el && el.style && el.style.transform) {
          savedTransforms.push({ el, value: el.style.transform });
          el.style.transform = "";
        }
      });
    });

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

    function resolveLineYValue(sec) {
      const w = window.innerWidth;
      const base = sec.getAttribute("data-line-y");
      const mobile = sec.getAttribute("data-line-y-mobile");
      const tablet = sec.getAttribute("data-line-y-tablet");
      const desktop = sec.getAttribute("data-line-y-desktop");

      if (w <= 767) return mobile || base;
      if (w <= 991) return tablet || base;
      return desktop || base;
    }

    function getBendY(sec, secTop, secHeight) {
      const raw = resolveLineYValue(sec);
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
    const pts = [];
    const firstLineX = getLineX(sections[0], 0);
    d += `M ${firstLineX} 0`;
    pts.push({ x: firstLineX, y: 0 });

    sections.forEach((sec, i) => {
      const secRect = sec.getBoundingClientRect();
      const secTop = secRect.top + window.pageYOffset - wrapperTop;
      const secHeight = secRect.height;
      const bendY = getBendY(sec, secTop, secHeight);
      const lineX = getLineX(sec, i);

      d += ` L ${lineX} ${bendY}`;
      pts.push({ x: lineX, y: bendY });

      if (i < sections.length - 1) {
        const nextLineX = getLineX(sections[i + 1], i + 1);
        d += ` L ${nextLineX} ${bendY}`;
        pts.push({ x: nextLineX, y: bendY });
      }
    });

    const lastLineX = getLineX(
      sections[sections.length - 1],
      sections.length - 1,
    );
    d += ` L ${lastLineX} ${wrapperH}`;
    pts.push({ x: lastLineX, y: wrapperH });

    svg.setAttribute("viewBox", `0 0 ${wrapperW} ${wrapperH}`);
    svg.setAttribute("width", wrapperW);
    svg.setAttribute("height", wrapperH);
    path.setAttribute("d", d);

    pathSegments = [];
    totalPathLen = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      pathSegments.push({
        y1: a.y,
        y2: b.y,
        lenStart: totalPathLen,
        len,
        horizontal: a.y === b.y,
      });
      totalPathLen += len;
    }

    path.style.strokeDasharray = totalPathLen;
    path.style.strokeDashoffset = totalPathLen;

    savedTransforms.forEach(({ el, value }) => {
      el.style.transform = value;
    });
  }

  function pathLengthAtY(targetY) {
    if (targetY <= 0) return 0;
    if (targetY >= wrapperHeight) return totalPathLen;

    for (let i = 0; i < pathSegments.length; i++) {
      const seg = pathSegments[i];
      if (seg.y2 < targetY) continue;
      if (seg.horizontal) return seg.lenStart;
      return seg.lenStart + seg.len * ((targetY - seg.y1) / (seg.y2 - seg.y1));
    }
    return totalPathLen;
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
    window._lineAnimRAF = null;
    const diff = targetOffset - currentOffset;
    if (Math.abs(diff) < 0.5) {
      currentOffset = targetOffset;
      path.style.strokeDashoffset = currentOffset;
      return;
    }
    currentOffset += diff * LINE_SMOOTH_FACTOR;
    path.style.strokeDashoffset = currentOffset;
    window._lineAnimRAF = requestAnimationFrame(smoothTick);
  }

  function scheduleTick() {
    if (window._lineAnimRAF) return;
    window._lineAnimRAF = requestAnimationFrame(smoothTick);
  }

  path.style.strokeDashoffset = currentOffset;

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

      currentOffset = targetOffset;
      path.style.strokeDashoffset = currentOffset;
    },
    onUpdate: (self) => {
      if (!self.isActive) {
        targetOffset = self.progress <= 0 ? totalPathLen : 0;
      } else {
        targetOffset = offsetFromViewportCenter();
      }
      scheduleTick();
    },
  });

  ScrollTrigger.refresh();

  window._lineAnimSettleTimers = [0, 120, 360, 800, 1500, 2500].map((ms) =>
    setTimeout(() => {
      if (window._lineAnimST) window._lineAnimST.refresh();
    }, ms),
  );

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

  window.addEventListener(
    "scroll",
    () => {
      setTimeout(() => {
        if (window._lineAnimST) window._lineAnimST.refresh();
      }, 80);
    },
    { once: true, passive: true },
  );
}

function initTabFromURL() {
  const params = new URLSearchParams(window.location.search);
  const tabId = params.get("tab");
  if (!tabId) return;
  const tabLink = document.querySelector(`.w-tab-link[data-tab-id="${tabId}"]`);
  if (!tabLink) return;
  tabLink.click();
  const url = new URL(window.location);
  url.searchParams.delete("tab");
  history.replaceState(
    null,
    null,
    url.pathname + (url.search === "?" ? "" : url.search),
  );
}

function initJoinedYearLabel() {
  const currentYear = new Date().getFullYear();
  document.querySelectorAll(".joined-year").forEach((yearEl) => {
    const joinedYear = parseInt(yearEl.textContent.trim(), 10);
    const card = yearEl.closest(".div-block-16, .blog-item-intro");
    const classJoinedEl = card?.querySelector(".class-joined");
    if (!classJoinedEl) return;
    classJoinedEl.textContent =
      joinedYear === currentYear ? "/joined" : "/class of";
  });
}

function hideFlashRevealIn(container) {
  container.querySelectorAll("[data-flash-reveal]").forEach(function (el) {
    if (el._splitInstance) {
      el._splitInstance.revert();
      el._splitInstance = null;
    }
    el.removeAttribute("data-flash-initialized");
    gsap.set(el, { visibility: "hidden" });
  });
}

function playFlashRevealIn(container) {
  container.querySelectorAll("[data-flash-reveal]").forEach(function (el) {
    var maxDur = parseFloat(el.dataset.flashDuration) || 1;
    var ease = el.dataset.flashEase || "power2.out";
    var split = new SplitText(el, { type: "words,chars" });
    var chars = split.chars;
    el._splitInstance = split;
    el.setAttribute("data-flash-initialized", "true");
    gsap.set(el, { visibility: "visible" });
    gsap.set(chars, { autoAlpha: 0 });
    var stag = Math.max(0.01, (maxDur - 0.6) / chars.length);
    gsap.to(chars, {
      autoAlpha: 1,
      duration: 0.6,
      ease: ease,
      stagger: {
        each: stag,
        from: "random",
        onStart: function () {
          var char = this.targets()[0];
          var flashes = Math.floor(Math.random() * 3) + 1;
          if (flashes === 1) return;
          var ftl = gsap.timeline();
          for (var i = 0; i < flashes - 1; i++) {
            ftl
              .to(char, { autoAlpha: 1, duration: 0.08, ease: "none" })
              .to(char, { autoAlpha: 0, duration: 0.08, ease: "none" });
          }
        },
      },
    });
  });
}

function initTabFlashReveal() {
  document.querySelectorAll(".w-tab-link").forEach(function (tabLink) {
    if (tabLink.dataset.tabAnimInit) return;
    tabLink.dataset.tabAnimInit = "true";
    tabLink.addEventListener("click", function () {
      var tabId = tabLink.getAttribute("data-w-tab");

      var targetPane = tabId
        ? document.querySelector('.w-tab-pane[data-w-tab="' + tabId + '"]')
        : null;
      if (targetPane) hideFlashRevealIn(targetPane);

      var targetHeading = tabId
        ? document.querySelector('[data-tab-for="' + tabId + '"]')
        : null;
      if (targetHeading) hideFlashRevealIn(targetHeading);

      setTimeout(function () {
        var activePane = document.querySelector(".w-tab-pane.w--tab-active");
        if (activePane) playFlashRevealIn(activePane);

        var activeHeading = document.querySelector("[data-tab-for].is-active");
        if (activeHeading) playFlashRevealIn(activeHeading);
      }, 300);
    });
  });
}

function applyTabHeadingState() {
  const headings = document.querySelectorAll("[data-tab-for]");
  if (!headings.length) return;

  let tabId = null;
  const currentLink = document.querySelector(".w-tab-link.w--current");
  if (currentLink) {
    tabId = currentLink.getAttribute("data-w-tab");
  }
  if (!tabId) {
    const activePane = document.querySelector(".w-tab-pane.w--tab-active");
    if (activePane) tabId = activePane.getAttribute("data-w-tab");
  }
  if (!tabId) {
    const firstLink = document.querySelector(".w-tab-link");
    if (firstLink) tabId = firstLink.getAttribute("data-w-tab");
  }

  if (!tabId) {
    headings.forEach((el, i) => {
      const active = i === 0;
      el.classList.toggle("is-active", active);
      el.style.display = active ? "" : "none";
    });
    return;
  }

  headings.forEach((el) => {
    const active = el.dataset.tabFor === tabId;
    el.classList.toggle("is-active", active);
    el.style.display = active ? "" : "none";
  });
}

function initTabHeading() {
  const headings = document.querySelectorAll("[data-tab-for]");
  if (!headings.length) return;

  document.querySelectorAll(".w-tab-link").forEach((link) => {
    if (link.dataset.tabHeadingInit) return;
    link.dataset.tabHeadingInit = "true";
    link.addEventListener("click", () => {
      const tabId = link.getAttribute("data-w-tab");
      headings.forEach((el) => {
        const active = el.dataset.tabFor === tabId;
        el.classList.toggle("is-active", active);
        el.style.display = active ? "" : "none";
      });
    });
  });

  applyTabHeadingState();
}

function initTabsFallback() {
  if (!document.querySelector("[data-tab-for]")) return;
  document.querySelectorAll(".w-tabs").forEach((widget) => {
    const links = [...widget.querySelectorAll(".w-tab-link")];
    const panes = [...widget.querySelectorAll(".w-tab-pane")];
    if (!links.length) return;

    const activateTab = (link) => {
      const targetId = link.getAttribute("data-w-tab");
      links.forEach((l) => l.classList.remove("w--current"));
      link.classList.add("w--current");
      panes.forEach((p) => {
        p.classList.toggle(
          "w--tab-active",
          p.getAttribute("data-w-tab") === targetId,
        );
      });
      applyTabHeadingState();
    };

    if (!widget.querySelector(".w-tab-link.w--current")) {
      activateTab(links[0]);
    }

    links.forEach((link) => {
      if (link.dataset.tabFallback) return;
      link.dataset.tabFallback = "true";
      link.addEventListener("click", () => activateTab(link));
    });
  });
}

// ============================================
// Tab Content Reveal
// ============================================
function prepTabContentReveal(root) {
  if (!window.gsap) return;
  const scope = root || document;
  scope.querySelectorAll(".w-tabs").forEach(function (widget) {
    const pane = widget.querySelector(".w-tab-pane.w--tab-active");
    if (pane) window.gsap.set(pane, { autoAlpha: 0, y: "2rem" });
  });
}

function playTabContentReveal(pane) {
  if (!pane || !window.gsap) return;
  window.gsap.killTweensOf(pane);
  window.gsap.fromTo(
    pane,
    { autoAlpha: 0, y: "2rem" },
    {
      autoAlpha: 1,
      y: "0rem",
      duration: 0.3,
      ease: "power2.inOut",
      overwrite: "auto",
      clearProps: "transform,opacity,visibility",
    },
  );
}

function initTabContentReveal() {
  document.querySelectorAll(".w-tabs").forEach(function (widget) {
    widget.querySelectorAll(".w-tab-link").forEach(function (link) {
      if (link.dataset.tabRevealInit) return;
      link.dataset.tabRevealInit = "true";
      link.addEventListener("click", function () {
        const tabId = link.getAttribute("data-w-tab");
        const targetPane = tabId
          ? widget.querySelector('.w-tab-pane[data-w-tab="' + tabId + '"]')
          : null;
        if (targetPane && window.gsap) {
          window.gsap.killTweensOf(targetPane);
          window.gsap.set(targetPane, { autoAlpha: 0, y: "2rem" });
        }
        setTimeout(function () {
          playTabContentReveal(
            targetPane || widget.querySelector(".w-tab-pane.w--tab-active"),
          );
        }, 50);
      });
    });
    playTabContentReveal(widget.querySelector(".w-tab-pane.w--tab-active"));
  });
}

// ============================================
// Company Page — Division SVG Color Effect
// ============================================
let _companyObserver = null;

function cleanupCompanyPage() {
  if (_companyObserver) {
    _companyObserver.disconnect();
    _companyObserver = null;
  }
}

function initCompanyPage() {
  cleanupCompanyPage();

  const sections = document.querySelectorAll(".each-division");
  const shapes = [
    ...document.querySelectorAll(".interaction-wrapper"),
  ].reverse();
  if (!sections.length || !shapes.length) return;

  _companyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const index = [...sections].indexOf(entry.target);
        if (index === -1) return;
        if (entry.isIntersecting) {
          shapes[index].classList.add("is-active");
          shapes.forEach((s, i) => {
            s.style.zIndex = i === index ? "10" : "0";
          });
        } else {
          shapes[index].classList.remove("is-active");
        }
      });
    },
    { threshold: 0.5 },
  );

  sections.forEach((s) => _companyObserver.observe(s));
}

// ============================================
// Localization Switcher
// ============================================

function cleanupLocalizationState() {
  const wrapper = document.querySelector(".localization-wrapper");
  if (!wrapper) return;
  wrapper.classList.remove("switching", "to-left");
  document.querySelectorAll(".localization-link").forEach((link) => {
    link.classList.remove("target");
  });
}

function initLocalizationSwitcher() {
  document.querySelectorAll(".localization-link").forEach((link) => {
    if (!link.hasAttribute("data-barba-prevent")) {
      link.setAttribute("data-barba-prevent", "self");
    }
  });

  document.querySelectorAll(".localization-link").forEach((link) => {
    if (link.dataset.localeInit) return;
    link.dataset.localeInit = "true";

    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (!href) return;
      try {
        const getLocale = (path) => {
          const m = path.match(/^\/([a-z]{2})(\/|$)/);
          return m ? m[1] : "default";
        };
        const linkPath = new URL(href, window.location.href).pathname;
        if (getLocale(linkPath) === getLocale(window.location.pathname)) {
          e.preventDefault();
          return;
        }
      } catch (_) {}

      if (window.innerWidth < 768) {
        return;
      }

      e.preventDefault();

      const wrapper = document.querySelector(".localization-wrapper");

      if (wrapper) {
        wrapper.classList.remove("switching", "to-left");
        void wrapper.offsetWidth;
      }
      document.querySelectorAll(".localization-link").forEach((l) => {
        l.classList.remove("target");
      });
      let goLeft = false;
      const currentLink = document.querySelector(
        ".localization-link.w--current",
      );
      if (currentLink) {
        const targetRect = this.getBoundingClientRect();
        const currentRect = currentLink.getBoundingClientRect();
        goLeft = targetRect.left < currentRect.left;
      } else {
        const allLinks = [...document.querySelectorAll(".localization-link")];
        goLeft = allLinks.indexOf(this) === 0;
      }

      if (wrapper && goLeft) wrapper.classList.add("to-left");
      this.classList.add("target");
      if (wrapper) wrapper.classList.add("switching");

      setTimeout(() => {
        window.location.href = href;
      }, 200);
    });
  });
}

function restoreLocalizationCurrent() {
  const getLocale = (path) => {
    const m = path.match(/^\/([a-z]{2})(\/|$)/);
    return m ? m[1] : "default";
  };
  const currentLocale = getLocale(window.location.pathname);
  document.querySelectorAll(".localization-link").forEach((link) => {
    try {
      const linkPath = new URL(
        link.getAttribute("href") || "",
        window.location.href,
      ).pathname;
      const isMatch = getLocale(linkPath) === currentLocale;
      link.classList.toggle("w--current", isMatch);
    } catch (_) {}
  });
}

// ============================================
// Border Glow & Shiny Button
// ============================================
function initBorderGlow() {
  document.querySelectorAll(".border-glow-card").forEach(function (card) {
    if (card.dataset.glowInit) return;
    card.dataset.glowInit = "1";
    card.addEventListener("pointermove", function (e) {
      const r = card.getBoundingClientRect();
      const cx = r.width / 2;
      const cy = r.height / 2;
      const dx = e.clientX - r.left - cx;
      const dy = e.clientY - r.top - cy;
      let kx = Infinity;
      let ky = Infinity;
      if (dx !== 0) kx = cx / Math.abs(dx);
      if (dy !== 0) ky = cy / Math.abs(dy);
      const edge = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
      let angle = 0;
      if (dx !== 0 || dy !== 0) {
        angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        if (angle < 0) angle += 360;
      }
      card.style.setProperty("--edge-proximity", (edge * 100).toFixed(3));
      card.style.setProperty("--cursor-angle", angle.toFixed(3) + "deg");
    });
    card.addEventListener("pointerleave", function () {
      card.style.setProperty("--edge-proximity", "0");
    });
  });
}

function initShinyBtn() {
  if (!window.gsap) return;
  document.querySelectorAll(".shiny-btn-wrapper").forEach(function (box) {
    if (box.dataset.shinyInit) return;
    box.dataset.shinyInit = "1";
    const arrows = box.querySelectorAll(".animation");
    if (!arrows.length) return;
    let animating = false;
    box.addEventListener("mouseenter", function () {
      if (animating) return;
      animating = true;
      window.gsap.to(arrows, {
        xPercent: "+=100",
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: function () {
          window.gsap.set(arrows, { xPercent: "-=100" });
          animating = false;
        },
      });
    });
  });
}

// ============================================
// Finsweet List Restart
// ============================================
function restartFinsweetList() {
  setFinsweetFilterValues();
  const restart = window.FinsweetAttributes?.modules?.list?.restart;
  if (typeof restart === "function") restart();
}

// ============================================
// Exports
// ============================================
Object.assign(window, {
  setFinsweetFilterValues,
  restartFinsweetList,
  initRecruitPageFeatures,
  cleanupRecruitSwiper,
  initInterviewTemplate,
  cleanupInterviewTemplate,
  initLineAnimation,
  cleanupLineAnimation,
  initTabFromURL,
  initJoinedYearLabel,
  initTabFlashReveal,
  applyTabHeadingState,
  initTabHeading,
  initTabsFallback,
  initTabContentReveal,
  prepTabContentReveal,
  initCompanyPage,
  cleanupCompanyPage,
  initLocalizationSwitcher,
  cleanupLocalizationState,
  restoreLocalizationCurrent,
  initBorderGlow,
  initShinyBtn,
});

window.initPageFromMain = function (ns) {
  if (ns === "recruit") initRecruitPageFeatures();
  else if (ns === "interview-cms") initInterviewTemplate();
  else if (ns === "company") initCompanyPage();

  initLineAnimation();
  initJoinedYearLabel();
  initTabFromURL();
  initTabFlashReveal();
  initTabsFallback();
  initTabHeading();
  initTabContentReveal();
  applyTabHeadingState();
  initLocalizationSwitcher();
  restoreLocalizationCurrent();
  initBorderGlow();
  initShinyBtn();
  restartFinsweetList();
};

window.cleanupPageFromMain = function (prevNs) {
  cleanupLineAnimation();
  cleanupLocalizationState();
  if (prevNs === "recruit") cleanupRecruitSwiper();
  else if (prevNs === "interview-cms") cleanupInterviewTemplate();
  else if (prevNs === "company") cleanupCompanyPage();
};
