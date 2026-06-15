/* =====================================================
   PIC 2026 — FINAL SHARED SCRIPT
   Digunakan oleh:
   - index.html
   - 5r.html
   - Epic.html
   - SS.html
===================================================== */

const PIC_API_URL =
  "https://script.google.com/macros/s/AKfycbxukqZ8McVtb8C8GSJpx2E-LAC49XS-DRMRd4DTStycrskzfdRUv9yEZshz9fb4rxI/exec";

document.addEventListener("DOMContentLoaded", () => {
  if (!enforceAuth()) return;

  buildGeneratedGalleries();
  initInfoPopup();
  initPosterModal();
  initPhotoCarousels();
  initLogout();
  initQitFinalistSearch();
  initPlaceholderLinks();
  initRevealAnimation();
  initPageMusic();
  initFinalistEngagement();
});

/* =====================================================
   AUTHENTICATION
===================================================== */

function enforceAuth() {
  const requiresAuth =
    document.body.dataset.auth === "required";

  if (!requiresAuth) return true;

  const currentUser =
    sessionStorage.getItem("picUser");

  const sessionToken =
    sessionStorage.getItem("picSessionToken");

  if (!currentUser || !sessionToken) {
    clearPicSession();
    window.location.replace("login.html");
    return false;
  }

  return true;
}

function clearPicSession() {
  sessionStorage.removeItem("picUser");
  sessionStorage.removeItem("picSessionToken");
}

/* =====================================================
   LOGOUT
===================================================== */

function initLogout() {
  document
    .querySelectorAll("[data-logout]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        if (button.disabled) return;

        button.disabled = true;

        const sessionToken =
          sessionStorage.getItem("picSessionToken");

        try {
          if (sessionToken) {
            await picApiPost(
              {
                action: "logout",
                sessionToken
              },
              false
            );
          }
        } catch (error) {
          console.warn(
            "Logout server tidak dapat diproses:",
            error
          );
        } finally {
          clearPicSession();
          window.location.replace("login.html");
        }
      });
    });
}

/* =====================================================
   GENERATED PHOTO GALLERY
===================================================== */

function buildGeneratedGalleries() {
  document
    .querySelectorAll("[data-gallery-range]")
    .forEach((track) => {
      const start =
        Number(track.dataset.start || 1);

      const end =
        Number(track.dataset.end || start);

      const excludes =
        String(track.dataset.exclude || "")
          .split(",")
          .map((item) => Number(item.trim()))
          .filter(Boolean);

      const label =
        track.dataset.label || "Dokumentasi PIC 2026";

      track.innerHTML = "";

      for (let number = start; number <= end; number += 1) {
        if (excludes.includes(number)) continue;

        const card =
          document.createElement("div");

        card.className = "photo-card";

        card.innerHTML = `
          <img
            src="${number}.png"
            alt="${escapeHTML(label)} ${number}"
            loading="lazy"
            decoding="async"
          />

          <span
            class="photo-gloss"
            aria-hidden="true"
          ></span>
        `;

        track.appendChild(card);
      }
    });
}

/* =====================================================
   PHOTO CAROUSEL
===================================================== */

function initPhotoCarousels() {
  document
    .querySelectorAll(".photo-carousel")
    .forEach((carousel) => {
      const wrap =
        carousel.querySelector(".photo-track-wrap");

      const track =
        carousel.querySelector(".photo-track");

      const prevBtn =
        carousel.querySelector(".photo-prev");

      const nextBtn =
        carousel.querySelector(".photo-next");

      if (!wrap || !track || !prevBtn || !nextBtn) return;

      function getStep() {
        const firstCard =
          track.querySelector(".photo-card");

        const gap =
          parseFloat(getComputedStyle(track).gap) || 16;

        return (firstCard?.offsetWidth || 220) + gap;
      }

      function updateButtons() {
        const maxScroll =
          Math.max(0, wrap.scrollWidth - wrap.clientWidth);

        prevBtn.disabled =
          wrap.scrollLeft <= 2;

        nextBtn.disabled =
          wrap.scrollLeft >= maxScroll - 2;
      }

      function move(direction) {
        wrap.scrollTo({
          left: wrap.scrollLeft + direction * getStep() * 2,
          behavior: "smooth"
        });
      }

      prevBtn.addEventListener("click", () => move(-1));
      nextBtn.addEventListener("click", () => move(1));

      wrap.addEventListener(
        "scroll",
        () => requestAnimationFrame(updateButtons),
        { passive: true }
      );

      window.addEventListener("resize", updateButtons);

      let isDragging = false;
      let startX = 0;
      let startScroll = 0;

      wrap.addEventListener("pointerdown", (event) => {
        isDragging = true;
        startX = event.clientX;
        startScroll = wrap.scrollLeft;

        wrap.setPointerCapture?.(event.pointerId);
      });

      wrap.addEventListener("pointermove", (event) => {
        if (!isDragging) return;

        wrap.scrollLeft =
          startScroll - (event.clientX - startX);
      });

      [
        "pointerup",
        "pointercancel",
        "pointerleave"
      ].forEach((eventName) => {
        wrap.addEventListener(eventName, () => {
          isDragging = false;
          updateButtons();
        });
      });

      updateButtons();
    });
}

/* =====================================================
   INDEX INFORMATION POPUP
   Support:
   - Poster slide
   - Video slide autoplay seperti iklan
   - Video mati saat geser kanan / kiri
===================================================== */

function initInfoPopup() {
  const popup =
    document.getElementById("infoPopup");

  const openBtn =
    document.getElementById("openInfo");

  const closeBtn =
    document.getElementById("infoClose");

  const slider =
    document.getElementById("infoSlider");

  const dotsWrap =
    document.getElementById("infoDots");

  if (!popup || !closeBtn || !slider) return;

  const slides =
    Array.from(
      slider.querySelectorAll(".info-slide")
    );

  const backdrop =
    popup.querySelector("[data-close='true']");

  let currentIndex = 0;
  let scrollTimer = null;

  function stopAllVideos(reset = true) {
    popup
      .querySelectorAll("video")
      .forEach((video) => {
        video.pause();

        if (reset) {
          try {
            video.currentTime = 0;
          } catch (error) {
            console.log("Video tidak bisa di-reset.");
          }
        }
      });
  }

  function playVideoOnActiveSlide() {
    const activeSlide =
      slides[currentIndex];

    if (!activeSlide) return;

    const activeVideo =
      activeSlide.querySelector("video");

    if (!activeVideo) return;

    activeVideo.muted = true;
    activeVideo.playsInline = true;

    try {
      activeVideo.currentTime = 0;
    } catch (error) {
      console.log("Video dimulai dari posisi tersedia.");
    }

    activeVideo
      .play()
      .catch(() => {
        console.log("Autoplay video diblokir browser.");
      });
  }

  function updateDots() {
    dotsWrap
      ?.querySelectorAll(".info-dot")
      .forEach((dot, index) => {
        dot.classList.toggle(
          "active",
          index === currentIndex
        );
      });
  }

  function getClosestSlideIndex() {
    const center =
      slider.getBoundingClientRect().left +
      slider.clientWidth / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    slides.forEach((slide, index) => {
      const rect =
        slide.getBoundingClientRect();

      const distance =
        Math.abs(
          rect.left + rect.width / 2 - center
        );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  function setActiveSlide(index, playVideo = true) {
    if (slides.length === 0) return;

    const nextIndex =
      (index + slides.length) % slides.length;

    if (nextIndex !== currentIndex) {
      stopAllVideos(true);
    }

    currentIndex = nextIndex;

    updateDots();

    if (playVideo) {
      playVideoOnActiveSlide();
    }
  }

  function goToSlide(index, smooth = true) {
    if (slides.length === 0) return;

    stopAllVideos(true);

    currentIndex =
      (index + slides.length) % slides.length;

    slides[currentIndex].scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      inline: "center",
      block: "nearest"
    });

    updateDots();

    setTimeout(
      playVideoOnActiveSlide,
      smooth ? 320 : 80
    );
  }

  function openPopup() {
    popup.removeAttribute("hidden");
    document.body.classList.add("modal-open");

    goToSlide(currentIndex, false);
  }

  function closePopup() {
    stopAllVideos(true);

    popup.setAttribute("hidden", "");
    document.body.classList.remove("modal-open");

    sessionStorage.setItem("picInfoSeen", "true");
  }

  if (dotsWrap) {
    dotsWrap.innerHTML = "";

    slides.forEach((_, index) => {
      const dot =
        document.createElement("button");

      dot.type = "button";

      dot.className =
        `info-dot${index === 0 ? " active" : ""}`;

      dot.setAttribute(
        "aria-label",
        `Lihat informasi ${index + 1}`
      );

      dot.addEventListener("click", () =>
        goToSlide(index)
      );

      dotsWrap.appendChild(dot);
    });
  }

  openBtn?.addEventListener("click", openPopup);
  closeBtn.addEventListener("click", closePopup);
  backdrop?.addEventListener("click", closePopup);

  slider.addEventListener(
    "scroll",
    () => {
      clearTimeout(scrollTimer);

      scrollTimer =
        setTimeout(() => {
          if (popup.hasAttribute("hidden")) return;

          const closestIndex =
            getClosestSlideIndex();

          if (closestIndex !== currentIndex) {
            setActiveSlide(closestIndex, true);
          } else {
            updateDots();
          }
        }, 160);
    },
    { passive: true }
  );

  document.addEventListener("keydown", (event) => {
    if (popup.hasAttribute("hidden")) return;

    if (event.key === "Escape") {
      closePopup();
    }

    if (event.key === "ArrowRight") {
      goToSlide(currentIndex + 1);
    }

    if (event.key === "ArrowLeft") {
      goToSlide(currentIndex - 1);
    }
  });

  if (!sessionStorage.getItem("picInfoSeen")) {
    setTimeout(openPopup, 450);
  }
}

/* =====================================================
   PRE-EVENT POSTER MODAL
===================================================== */

function initPosterModal() {
  const modal =
    document.getElementById("posterModal");

  const modalImage =
    document.getElementById("posterModalImage");

  const modalTitle =
    document.getElementById("posterModalTitle");

  const modalCaption =
    document.getElementById("posterModalCaption");

  const modalLink =
    document.getElementById("posterModalLink");

  const closeBtn =
    document.getElementById("posterModalClose");

  if (!modal || !modalImage || !modalTitle || !closeBtn) {
    return;
  }

  const backdrop =
    modal.querySelector("[data-close='true']");

  const tabButtons =
    modal.querySelectorAll(".epic-tab-btn");

  function setTab(tab) {
    modal.classList.toggle(
      "show-poster",
      tab === "poster"
    );

    modal.classList.toggle(
      "show-caption",
      tab === "caption"
    );

    tabButtons.forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.tab === tab
      );
    });
  }

  function closeModal() {
    modal.setAttribute("hidden", "");
    modalImage.src = "";
    document.body.classList.remove("modal-open");
  }

  document
    .querySelectorAll(".poster-thumb")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const card =
          button.closest(".poster-card");

        const captionTemplate =
          card?.querySelector(".poster-caption-template");

        const link =
          button.dataset.link || "#";

        modalImage.src =
          button.dataset.full ||
          button.querySelector("img")?.src ||
          "";

        modalTitle.textContent =
          button.dataset.title ||
          "Informasi PIC 2026";

        if (modalCaption) {
          modalCaption.innerHTML =
            captionTemplate
              ? captionTemplate.innerHTML
              : "<p>Informasi detail belum tersedia.</p>";
        }

        if (modalLink) {
          modalLink.href = link;

          modalLink.style.display =
            link === "#" ? "none" : "inline-flex";
        }

        setTab("poster");

        modal.removeAttribute("hidden");
        document.body.classList.add("modal-open");
      });
    });

  tabButtons.forEach((button) => {
    button.addEventListener("click", () =>
      setTab(button.dataset.tab || "poster")
    );
  });

  closeBtn.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      !modal.hasAttribute("hidden")
    ) {
      closeModal();
    }
  });
}

/* =====================================================
   QIT FINALIST SEARCH
===================================================== */

function initQitFinalistSearch() {
  const dataElement =
    document.getElementById("qitTeamsData");

  const teamCloud =
    document.getElementById("qitTeamCloud");

  const searchInput =
    document.getElementById("qitSearchInput");

  const teamCount =
    document.getElementById("qitTeamCount");

  const emptyMessage =
    document.getElementById("qitEmptyMessage");

  if (!dataElement || !teamCloud || !searchInput) {
    return;
  }

  let teams = [];

  try {
    teams =
      JSON.parse(dataElement.textContent);
  } catch (error) {
    console.error(
      "Data team QIT tidak valid:",
      error
    );

    return;
  }

  function render(keyword = "") {
    const search =
      keyword.trim().toLowerCase();

    const filteredTeams =
      teams.filter((team) =>
        team.toLowerCase().includes(search)
      );

    teamCloud.innerHTML =
      filteredTeams
        .map(
          (team) => `
            <span
              class="qit-team-pill${search ? " is-match" : ""}"
            >
              ${escapeHTML(team)}
            </span>
          `
        )
        .join("");

    if (teamCount) {
      teamCount.textContent =
        search
          ? `${filteredTeams.length} Ditemukan`
          : `${teams.length} Finalis`;
    }

    emptyMessage?.classList.toggle(
      "show",
      filteredTeams.length === 0
    );
  }

  searchInput.addEventListener("input", () =>
    render(searchInput.value)
  );

  render();
}

/* =====================================================
   PLACEHOLDER FORM LINKS
===================================================== */

function initPlaceholderLinks() {
  document
    .querySelectorAll("[data-placeholder-link]")
    .forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();

        alert(
          "Link form belum dimasukkan. Silakan ganti href pada HTML dengan link Google Form yang sesuai."
        );
      });
    });
}

/* =====================================================
   SCROLL REVEAL
===================================================== */

function initRevealAnimation() {
  const elements =
    document.querySelectorAll(
      ".section, .photo-review-section, .pre-form-section, .pic-story-section, .qit-finalist-premium"
    );

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) =>
      element.classList.add("is-visible")
    );

    return;
  }

  elements.forEach((element) =>
    element.classList.add("reveal")
  );

  const observer =
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08 }
    );

  elements.forEach((element) =>
    observer.observe(element)
  );
}

/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =====================================================
   BACKGROUND MUSIC
===================================================== */

function initPageMusic() {
  const bgMusic =
    document.getElementById("bgMusic");

  const musicToggle =
    document.getElementById("musicToggle");

  if (!bgMusic || !musicToggle) return;

  const STORAGE_ENABLED =
    "picMusicEnabled";

  const STORAGE_TIME =
    "picMusicTime";

  bgMusic.volume = 0.22;

  function showPlayingButton() {
    musicToggle.classList.add("is-playing");
    musicToggle.classList.remove("is-muted");

    musicToggle.innerHTML = `
      <i class="fa-solid fa-volume-high"></i>
      <span class="music-nav-text">Music</span>
    `;

    musicToggle.setAttribute("aria-label", "Matikan musik");
    musicToggle.setAttribute("title", "Matikan musik");
  }

  function showMutedButton() {
    musicToggle.classList.remove("is-playing");
    musicToggle.classList.add("is-muted");

    musicToggle.innerHTML = `
      <i class="fa-solid fa-volume-xmark"></i>
      <span class="music-nav-text">Music</span>
    `;

    musicToggle.setAttribute("aria-label", "Aktifkan musik");
    musicToggle.setAttribute("title", "Aktifkan musik");
  }

  function saveCurrentTime() {
    if (Number.isFinite(bgMusic.currentTime)) {
      sessionStorage.setItem(
        STORAGE_TIME,
        String(bgMusic.currentTime)
      );
    }
  }

  function restoreCurrentTime() {
    const savedTime =
      Number(sessionStorage.getItem(STORAGE_TIME) || 0);

    if (Number.isFinite(savedTime) && savedTime > 0) {
      try {
        bgMusic.currentTime = savedTime;
      } catch (error) {
        console.log("Musik dimulai dari awal.");
      }
    }
  }

  async function playMusic(savePreference = true) {
    try {
      await bgMusic.play();

      if (savePreference) {
        sessionStorage.setItem(STORAGE_ENABLED, "true");
      }

      showPlayingButton();
    } catch (error) {
      showMutedButton();
    }
  }

  function pauseMusic() {
    bgMusic.pause();
    sessionStorage.setItem(STORAGE_ENABLED, "false");
    saveCurrentTime();
    showMutedButton();
  }

  musicToggle.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (bgMusic.paused) {
      await playMusic(true);
    } else {
      pauseMusic();
    }
  });

  bgMusic.addEventListener("play", showPlayingButton);
  bgMusic.addEventListener("playing", showPlayingButton);
  bgMusic.addEventListener("pause", showMutedButton);
  bgMusic.addEventListener("loadedmetadata", restoreCurrentTime);

  window.addEventListener("pagehide", saveCurrentTime);
  window.addEventListener("beforeunload", saveCurrentTime);

  setInterval(saveCurrentTime, 1500);

  const savedPreference =
    sessionStorage.getItem(STORAGE_ENABLED);

  if (savedPreference === "false") {
    showMutedButton();
    return;
  }

  setTimeout(() => playMusic(false), 250);

  document.addEventListener(
    "pointerdown",
    () => {
      const musicAllowed =
        sessionStorage.getItem(STORAGE_ENABLED) !== "false";

      if (musicAllowed && bgMusic.paused) {
        playMusic(false);
      }
    },
    { once: true }
  );
}

/* =====================================================
   API POST
===================================================== */

async function picApiPost(
  payload,
  redirectOnExpiredSession = true
) {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(() => controller.abort(), 15000);

  try {
    const response =
      await fetch(PIC_API_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        signal: controller.signal
      });

    if (!response.ok) {
      throw new Error(
        `Server error HTTP ${response.status}`
      );
    }

    const result =
      await response.json();

    const message =
      String(result.message || "").toLowerCase();

    const sessionExpired =
      !result.success &&
      (
        message.includes("sesi login") ||
        message.includes("session") ||
        message.includes("token")
      );

    if (sessionExpired && redirectOnExpiredSession) {
      clearPicSession();

      alert(
        "Sesi login sudah berakhir. Silakan login kembali."
      );

      window.location.replace("login.html");

      throw new Error("Sesi login berakhir.");
    }

    return result;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "Server terlalu lama merespons. Silakan coba kembali."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/* =====================================================
   FINALIST LIKE AND COMMENT
===================================================== */

function initFinalistEngagement() {
  const cards =
    Array.from(
      document.querySelectorAll(".interactive-finalist")
    );

  if (cards.length === 0) return;

  const sessionToken =
    sessionStorage.getItem("picSessionToken");

  if (!sessionToken) {
    clearPicSession();
    window.location.replace("login.html");
    return;
  }

  const modal =
    document.getElementById("commentModal");

  const modalTitle =
    document.getElementById("commentModalTitle");

  const modalSubtitle =
    document.getElementById("commentModalSubtitle");

  const modalList =
    document.getElementById("commentList");

  const modalForm =
    document.getElementById("commentForm");

  const modalInput =
    document.getElementById("commentInput");

  const modalSubmit =
    document.getElementById("commentSubmit");

  const modalStatus =
    document.getElementById("commentStatus");

  const modalCounter =
    document.getElementById("commentCharCount");

  const modalClose =
    document.getElementById("commentModalClose");

  const modalBackdrop =
    modal?.querySelector("[data-comment-close='true']");

  const commentCache =
    new Map();

  const commentRequests =
    new Map();

  let activeCard = null;

  cards.forEach((card) => {
    ensureEngagementLabels(card);

    card
      .querySelector("[data-like-button]")
      ?.addEventListener("click", () => {
        toggleLikeOptimistically(card);
      });

    card
      .querySelector("[data-comment-button]")
      ?.addEventListener("click", () => {
        openCommentModal(card);
      });
  });

  loadEngagementSummary();

  async function loadEngagementSummary() {
    try {
      const result =
        await picApiPost({
          action: "getEngagementSummary",
          sessionToken,
          itemIds: cards
            .map((card) => card.dataset.itemId)
            .filter(Boolean)
        });

      if (!result.success) {
        throw new Error(
          result.message ||
          "Data engagement tidak dapat dimuat."
        );
      }

      cards.forEach((card) => {
        const summary =
          result.items?.[card.dataset.itemId] ||
          {
            likeCount: 0,
            commentCount: 0,
            likedByCurrentUser: false
          };

        updateLikeButton(
          card,
          summary.likedByCurrentUser,
          summary.likeCount
        );

        updateCommentCount(
          card,
          summary.commentCount
        );
      });
    } catch (error) {
      console.error("Gagal memuat engagement:", error);
    }
  }

  async function toggleLikeOptimistically(card) {
    const button =
      card.querySelector("[data-like-button]");

    const countElement =
      card.querySelector(".like-count");

    if (!button || button.disabled) return;

    const previousLiked =
      button.classList.contains("is-liked");

    const previousCount =
      Number(countElement?.textContent || 0);

    const nextLiked =
      !previousLiked;

    const nextCount =
      Math.max(
        0,
        previousCount + (nextLiked ? 1 : -1)
      );

    updateLikeButton(card, nextLiked, nextCount);

    button.disabled = true;
    button.classList.add("is-loading");
    button.setAttribute("aria-busy", "true");

    try {
      const result =
        await picApiPost({
          action: "toggleLike",
          sessionToken,
          itemId: card.dataset.itemId,
          itemType: card.dataset.itemType
        });

      if (!result.success) {
        throw new Error(
          result.message ||
          "Like tidak dapat disimpan."
        );
      }

      updateLikeButton(
        card,
        result.liked,
        result.likeCount
      );
    } catch (error) {
      updateLikeButton(
        card,
        previousLiked,
        previousCount
      );

      alert(
        error.message ||
        "Like tidak dapat disimpan. Silakan coba kembali."
      );
    } finally {
      button.disabled = false;
      button.classList.remove("is-loading");
      button.removeAttribute("aria-busy");
    }
  }

  function openCommentModal(card) {
    if (
      !modal ||
      !modalList ||
      !modalInput ||
      !modalTitle ||
      !modalSubtitle
    ) {
      alert(
        "Popup komentar belum tersedia pada halaman Main Event."
      );
      return;
    }

    activeCard = card;

    const itemId =
      card.dataset.itemId;

    const itemName =
      card.dataset.itemName || "Finalis";

    modalTitle.textContent =
      `Komentar untuk ${itemName}`;

    modalSubtitle.textContent =
      "Berikan dukungan dan apresiasi terbaikmu.";

    modalInput.value = "";
    updateCharacterCounter();
    showCommentStatus("", "");

    modal.removeAttribute("hidden");
    document.body.classList.add("modal-open");

    const cachedComments =
      commentCache.get(itemId);

    if (cachedComments) {
      renderComments(cachedComments);
      showCommentStatus(
        "Memeriksa komentar terbaru...",
        ""
      );
    } else {
      showCommentLoading();
    }

    setTimeout(() => {
      modalInput.focus();
    }, 120);

    refreshComments(itemId);
  }

  async function refreshComments(itemId) {
    if (commentRequests.has(itemId)) {
      return commentRequests.get(itemId);
    }

    const request =
      loadCommentsFromServer(itemId);

    commentRequests.set(itemId, request);

    try {
      await request;
    } finally {
      commentRequests.delete(itemId);
    }
  }

  async function loadCommentsFromServer(itemId) {
    try {
      const result =
        await picApiPost({
          action: "getComments",
          sessionToken,
          itemId
        });

      if (!result.success) {
        throw new Error(
          result.message ||
          "Komentar tidak dapat dimuat."
        );
      }

      const comments =
        result.comments || [];

      commentCache.set(itemId, comments);

      const relatedCard =
        cards.find(
          (card) => card.dataset.itemId === itemId
        );

      if (relatedCard) {
        updateCommentCount(
          relatedCard,
          result.commentCount
        );
      }

      if (activeCard?.dataset.itemId === itemId) {
        renderComments(comments);
        showCommentStatus("", "");
      }
    } catch (error) {
      console.error("Gagal memuat komentar:", error);

      if (
        !commentCache.has(itemId) &&
        activeCard?.dataset.itemId === itemId
      ) {
        modalList.innerHTML = `
          <div class="comment-empty">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <p>Komentar belum dapat dimuat.</p>
            <span>Silakan coba kembali beberapa saat lagi.</span>
          </div>
        `;
      }

      showCommentStatus(
        "Data terbaru belum dapat dimuat.",
        "error"
      );
    }
  }

  function closeCommentModal() {
    if (!modal) return;

    modal.setAttribute("hidden", "");
    document.body.classList.remove("modal-open");
    activeCard = null;
    showCommentStatus("", "");
  }

  modalClose?.addEventListener("click", closeCommentModal);
  modalBackdrop?.addEventListener("click", closeCommentModal);

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      modal &&
      !modal.hasAttribute("hidden")
    ) {
      closeCommentModal();
    }
  });

  modalForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!activeCard || !modalInput || !modalSubmit) return;

    const comment =
      modalInput.value.trim();

    if (!comment) {
      showCommentStatus(
        "Komentar tidak boleh kosong.",
        "error"
      );
      return;
    }

    if (comment.length > 300) {
      showCommentStatus(
        "Komentar maksimal 300 karakter.",
        "error"
      );
      return;
    }

    const itemId =
      activeCard.dataset.itemId;

    const itemType =
      activeCard.dataset.itemType;

    const currentUserName =
      getCurrentUserName();

    const temporaryId =
      `temporary-${Date.now()}`;

    const optimisticComment = {
      temporaryId,
      timestamp: new Date().toISOString(),
      userName: currentUserName,
      comment
    };

    const previousComments =
      commentCache.get(itemId) || [];

    const optimisticComments = [
      optimisticComment,
      ...previousComments
    ];

    commentCache.set(itemId, optimisticComments);
    renderComments(optimisticComments);
    updateCommentCount(activeCard, optimisticComments.length);

    modalInput.value = "";
    updateCharacterCounter();

    modalSubmit.disabled = true;

    modalSubmit.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin"></i>
      Menyimpan...
    `;

    showCommentStatus("Menyimpan komentar...", "");

    try {
      const result =
        await picApiPost({
          action: "addComment",
          sessionToken,
          itemId,
          itemType,
          comment
        });

      if (!result.success) {
        throw new Error(
          result.message ||
          "Komentar tidak dapat disimpan."
        );
      }

      updateCommentCount(
        activeCard,
        result.commentCount
      );

      showCommentStatus(
        "Komentar berhasil dikirim.",
        "success"
      );

      await refreshComments(itemId);
    } catch (error) {
      const restoredComments =
        (commentCache.get(itemId) || [])
          .filter(
            (item) => item.temporaryId !== temporaryId
          );

      commentCache.set(itemId, restoredComments);
      renderComments(restoredComments);
      updateCommentCount(activeCard, restoredComments.length);

      modalInput.value = comment;
      updateCharacterCounter();

      showCommentStatus(
        error.message ||
        "Komentar gagal disimpan. Silakan coba kembali.",
        "error"
      );
    } finally {
      modalSubmit.disabled = false;

      modalSubmit.innerHTML = `
        <i class="fa-solid fa-paper-plane"></i>
        Kirim
      `;
    }
  });

  modalInput?.addEventListener("input", updateCharacterCounter);

  function showCommentLoading() {
    if (!modalList) return;

    modalList.innerHTML = `
      <div class="comment-loading">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <span>Memuat komentar...</span>
      </div>
    `;
  }

  function updateCharacterCounter() {
    if (!modalInput || !modalCounter) return;

    modalCounter.textContent =
      `${modalInput.value.length}/300`;
  }

  function showCommentStatus(message, type) {
    if (!modalStatus) return;

    modalStatus.textContent = message;
    modalStatus.className = "comment-status";

    if (type) {
      modalStatus.classList.add(type);
    }
  }

  function renderComments(comments) {
    if (!modalList) return;

    if (comments.length === 0) {
      modalList.innerHTML = `
        <div class="comment-empty">
          <i class="fa-regular fa-comments"></i>
          <p>Belum ada komentar.</p>
          <span>Jadilah yang pertama memberikan apresiasi.</span>
        </div>
      `;
      return;
    }

    modalList.innerHTML =
      comments
        .map(
          (item) => `
            <article
              class="comment-item${item.temporaryId ? " is-pending" : ""}"
            >
              <div class="comment-avatar">
                ${getInitial(item.userName)}
              </div>

              <div class="comment-item-body">
                <div class="comment-item-head">
                  <strong>
                    ${escapeHTML(item.userName || "User PIC 2026")}
                  </strong>

                  <time>
                    ${
                      item.temporaryId
                        ? "Menyimpan..."
                        : formatCommentDate(item.timestamp)
                    }
                  </time>
                </div>

                <p>
                  ${escapeHTML(item.comment || "")}
                </p>
              </div>
            </article>
          `
        )
        .join("");
  }

  function getCurrentUserName() {
    try {
      const storedUser =
        JSON.parse(
          sessionStorage.getItem("picUser") || "{}"
        );

      return (
        storedUser.name ||
        storedUser.username ||
        storedUser.email ||
        "User PIC 2026"
      );
    } catch (error) {
      return "User PIC 2026";
    }
  }

  function getInitial(name) {
    return escapeHTML(
      String(name || "U")
        .trim()
        .charAt(0)
        .toUpperCase()
    );
  }

  function formatCommentDate(value) {
    const date =
      new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat(
      "id-ID",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    ).format(date);
  }
}

/* =====================================================
   ENGAGEMENT UI HELPERS
===================================================== */

function ensureEngagementLabels(card) {
  const likeButton =
    card.querySelector("[data-like-button]");

  const commentButton =
    card.querySelector("[data-comment-button]");

  if (
    likeButton &&
    !likeButton.querySelector(".engagement-label")
  ) {
    const label =
      document.createElement("span");

    label.className = "engagement-label";
    label.textContent = "Like";

    likeButton.insertBefore(
      label,
      likeButton.querySelector(".like-count")
    );
  }

  if (
    commentButton &&
    !commentButton.querySelector(".engagement-label")
  ) {
    const label =
      document.createElement("span");

    label.className = "engagement-label";
    label.textContent = "Komentar";

    commentButton.insertBefore(
      label,
      commentButton.querySelector(".comment-count")
    );
  }
}

function updateLikeButton(card, liked, likeCount) {
  const button =
    card.querySelector("[data-like-button]");

  if (!button) return;

  button.classList.toggle("is-liked", Boolean(liked));

  const icon =
    button.querySelector("i");

  const count =
    button.querySelector(".like-count");

  if (icon) {
    icon.className =
      liked
        ? "fa-solid fa-heart"
        : "fa-regular fa-heart";
  }

  if (count) {
    count.textContent =
      String(Number(likeCount) || 0);
  }
}

function updateCommentCount(card, commentCount) {
  const count =
    card.querySelector(".comment-count");

  if (count) {
    count.textContent =
      String(Number(commentCount) || 0);
  }
}