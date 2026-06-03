/* =====================================================
   LOGIN PIC 2026 — FINAL COMPLETE SCRIPT
   Fitur:
   - Login melalui Google Apps Script
   - Simpan sessionToken untuk Like dan Komentar
   - Hapus session lama yang tidak lengkap
   - Toggle lihat password
   - Background music + sinkronisasi ikon
   - Simpan preferensi musik
   - Penyesuaian keyboard HP dan tablet
===================================================== */

const API_URL =
  "https://script.google.com/macros/s/AKfycbxukqZ8McVtb8C8GSJpx2E-LAC49XS-DRMRd4DTStycrskzfdRUv9yEZshz9fb4rxI/exec";

document.addEventListener("DOMContentLoaded", () => {
  initLogin();
  initPasswordToggle();
  initBackgroundMusic();
  initMobileKeyboardFix();
});

/* =====================================================
   LOGIN API
===================================================== */

function initLogin(){
  const loginForm =
    document.getElementById("loginForm");

  const usernameInput =
    document.getElementById("username");

  const passwordInput =
    document.getElementById("password");

  const loginBtn =
    document.getElementById("loginBtn");

  const loginMessage =
    document.getElementById("loginMessage");

  if(
    !loginForm ||
    !usernameInput ||
    !passwordInput ||
    !loginBtn ||
    !loginMessage
  ){
    return;
  }

  const existingUser =
    sessionStorage.getItem("picUser");

  const existingToken =
    sessionStorage.getItem("picSessionToken");

  /*
    User hanya diarahkan ke homepage jika data user
    dan token sesi tersedia lengkap.
  */
  if(existingUser && existingToken){
    window.location.replace("index.html");
    return;
  }

  /*
    Bersihkan sesi lama dari versi website sebelumnya
    jika token belum tersedia.
  */
  if(existingUser && !existingToken){
    clearLoginSession();
  }

  loginForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const username =
        usernameInput.value.trim();

      const password =
        passwordInput.value.trim();

      if(!username || !password){
        showMessage(
          "Username/email dan password wajib diisi.",
          "error"
        );

        return;
      }

      setLoading(true);

      showMessage(
        "Sedang memeriksa akun...",
        ""
      );

      try{
        const result = await apiPost({
          action:"login",
          username,
          password
        });

        if(!result.success){
          showMessage(
            result.message ||
            "Username atau password tidak sesuai.",
            "error"
          );

          setLoading(false);

          return;
        }

        /*
          Token wajib tersedia karena dipakai untuk
          Like dan Komentar permanen.
        */
        if(!result.sessionToken){
          showMessage(
            "Token sesi tidak ditemukan. Pastikan Apps Script sudah di-deploy ulang menggunakan versi terbaru.",
            "error"
          );

          setLoading(false);

          return;
        }

        sessionStorage.setItem(
          "picUser",
          JSON.stringify(
            result.user || { username }
          )
        );

        sessionStorage.setItem(
          "picSessionToken",
          result.sessionToken
        );

        showMessage(
          "Login berhasil. Mengalihkan halaman...",
          "success"
        );

        setTimeout(() => {
          window.location.replace("index.html");
        }, 650);

      }catch(error){
        console.error(
          "Login API error:",
          error
        );

        showMessage(
          "Tidak dapat terhubung ke server. Periksa koneksi atau deployment Apps Script.",
          "error"
        );

        setLoading(false);
      }
    }
  );

  /* =====================================================
     API HELPER
  ===================================================== */

  async function apiPost(payload){
    const response = await fetch(
      API_URL,
      {
        method:"POST",
        body:JSON.stringify(payload)
      }
    );

    if(!response.ok){
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    return response.json();
  }

  /* =====================================================
     LOADING BUTTON
  ===================================================== */

  function setLoading(isLoading){
    loginBtn.disabled = isLoading;

    loginBtn.innerHTML = isLoading
      ? `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Memproses...
      `
      : `
        <i class="fa-solid fa-right-to-bracket"></i>
        Masuk
      `;
  }

  /* =====================================================
     MESSAGE
  ===================================================== */

  function showMessage(message, type){
    loginMessage.textContent = message;
    loginMessage.className = "login-message";

    if(type){
      loginMessage.classList.add(type);
    }
  }
}

/* =====================================================
   CLEAR LOGIN SESSION
===================================================== */

function clearLoginSession(){
  sessionStorage.removeItem("picUser");
  sessionStorage.removeItem("picSessionToken");
}

/* =====================================================
   PASSWORD VISIBILITY
===================================================== */

function initPasswordToggle(){
  const passwordInput =
    document.getElementById("password");

  const togglePassword =
    document.getElementById("togglePassword");

  if(!passwordInput || !togglePassword){
    return;
  }

  togglePassword.addEventListener(
    "click",
    () => {
      const isHidden =
        passwordInput.type === "password";

      passwordInput.type =
        isHidden ? "text" : "password";

      togglePassword.innerHTML = isHidden
        ? '<i class="fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';

      togglePassword.setAttribute(
        "aria-label",
        isHidden
          ? "Sembunyikan password"
          : "Lihat password"
      );

      togglePassword.setAttribute(
        "title",
        isHidden
          ? "Sembunyikan password"
          : "Lihat password"
      );
    }
  );
}

/* =====================================================
   BACKGROUND MUSIC — LOGIN PAGE
===================================================== */

function initBackgroundMusic(){
  const bgMusic =
    document.getElementById("bgMusic");

  const musicToggle =
    document.getElementById("musicToggle");

  if(!bgMusic || !musicToggle){
    return;
  }

  const STORAGE_ENABLED =
    "picMusicEnabled";

  const STORAGE_TIME =
    "picMusicTime";

  bgMusic.volume = 0.28;

  /* =====================================================
     BUTTON UI
  ===================================================== */

  function showPlayingButton(){
    musicToggle.classList.add(
      "is-playing"
    );

    musicToggle.classList.remove(
      "is-muted"
    );

    musicToggle.innerHTML =
      '<i class="fa-solid fa-volume-high"></i>';

    musicToggle.setAttribute(
      "aria-label",
      "Matikan musik"
    );

    musicToggle.setAttribute(
      "title",
      "Matikan musik"
    );
  }

  function showMutedButton(){
    musicToggle.classList.remove(
      "is-playing"
    );

    musicToggle.classList.add(
      "is-muted"
    );

    musicToggle.innerHTML =
      '<i class="fa-solid fa-volume-xmark"></i>';

    musicToggle.setAttribute(
      "aria-label",
      "Aktifkan musik"
    );

    musicToggle.setAttribute(
      "title",
      "Aktifkan musik"
    );
  }

  /* =====================================================
     SAVE DAN RESTORE MUSIC POSITION
  ===================================================== */

  function saveCurrentTime(){
    if(
      Number.isFinite(
        bgMusic.currentTime
      )
    ){
      sessionStorage.setItem(
        STORAGE_TIME,
        String(bgMusic.currentTime)
      );
    }
  }

  function restoreCurrentTime(){
    const savedTime = Number(
      sessionStorage.getItem(
        STORAGE_TIME
      ) || 0
    );

    if(
      Number.isFinite(savedTime) &&
      savedTime > 0
    ){
      try{
        bgMusic.currentTime =
          savedTime;
      }catch(error){
        console.log(
          "Musik dimulai dari awal."
        );
      }
    }
  }

  /* =====================================================
     PLAY DAN PAUSE
  ===================================================== */

  async function playMusic(
    savePreference = true
  ){
    try{
      await bgMusic.play();

      if(savePreference){
        sessionStorage.setItem(
          STORAGE_ENABLED,
          "true"
        );
      }

      showPlayingButton();

    }catch(error){
      /*
        Autoplay dapat diblokir oleh browser.
        Jangan simpan status false ketika play otomatis gagal.
        User tetap dapat menyalakan musik secara manual.
      */
      showMutedButton();

      console.log(
        "Autoplay diblokir browser. Tekan ikon suara untuk menyalakan musik."
      );
    }
  }

  function pauseMusic(){
    bgMusic.pause();

    sessionStorage.setItem(
      STORAGE_ENABLED,
      "false"
    );

    saveCurrentTime();

    showMutedButton();
  }

  /* =====================================================
     EVENT MUSIC BUTTON
  ===================================================== */

  musicToggle.addEventListener(
    "click",
    async (event) => {
      event.preventDefault();
      event.stopPropagation();

      if(bgMusic.paused){
        await playMusic(true);
      }else{
        pauseMusic();
      }
    }
  );

  /*
    Sinkronisasi ikon jika musik diputar atau dihentikan
    oleh browser.
  */
  bgMusic.addEventListener(
    "play",
    showPlayingButton
  );

  bgMusic.addEventListener(
    "playing",
    showPlayingButton
  );

  bgMusic.addEventListener(
    "pause",
    showMutedButton
  );

  bgMusic.addEventListener(
    "loadedmetadata",
    restoreCurrentTime
  );

  window.addEventListener(
    "pagehide",
    saveCurrentTime
  );

  window.addEventListener(
    "beforeunload",
    saveCurrentTime
  );

  /*
    Simpan posisi musik secara berkala.
  */
  setInterval(
    saveCurrentTime,
    1500
  );

  /* =====================================================
     STATUS AWAL MUSIK
  ===================================================== */

  const savedPreference =
    sessionStorage.getItem(
      STORAGE_ENABLED
    );

  if(savedPreference === "false"){
    showMutedButton();
    return;
  }

  /*
    Browser tertentu mengizinkan musik langsung berjalan.
    Jika diblokir, tap pertama pada halaman akan mencoba lagi.
  */
  setTimeout(() => {
    playMusic(false);
  }, 300);

  document.addEventListener(
    "pointerdown",
    () => {
      const musicAllowed =
        sessionStorage.getItem(
          STORAGE_ENABLED
        ) !== "false";

      if(
        musicAllowed &&
        bgMusic.paused
      ){
        playMusic(false);
      }
    },
    { once:true }
  );
}

/* =====================================================
   MOBILE KEYBOARD FIX
   Android, iPhone, Tablet, dan iPad
===================================================== */

function initMobileKeyboardFix(){
  const viewport =
    window.visualViewport;

  const inputs =
    document.querySelectorAll(
      "#username, #password"
    );

  if(!viewport || inputs.length === 0){
    return;
  }

  function updateKeyboardState(){
    const keyboardHeight =
      window.innerHeight -
      viewport.height;

    const keyboardIsOpen =
      keyboardHeight > 140;

    document.body.classList.toggle(
      "keyboard-open",
      keyboardIsOpen
    );

    if(keyboardIsOpen){
      const activeInput =
        document.activeElement;

      if(
        activeInput &&
        (
          activeInput.id === "username" ||
          activeInput.id === "password"
        )
      ){
        setTimeout(() => {
          activeInput.scrollIntoView({
            behavior:"smooth",
            block:"center"
          });
        }, 100);
      }
    }
  }

  viewport.addEventListener(
    "resize",
    updateKeyboardState
  );

  viewport.addEventListener(
    "scroll",
    updateKeyboardState
  );

  inputs.forEach((input) => {
    input.addEventListener(
      "focus",
      () => {
        setTimeout(
          updateKeyboardState,
          180
        );
      }
    );

    input.addEventListener(
      "blur",
      () => {
        setTimeout(
          updateKeyboardState,
          180
        );
      }
    );
  });
}