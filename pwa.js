(function () {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").catch(function () {});
    });
  }

  var deferredPrompt = null;
  var btn = document.getElementById("btnInstall");

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  function isInAppBrowser() {
    var ua = navigator.userAgent || "";
    return /FBAN|FBAV|Instagram|Line\/|Zalo|MicroMessenger|TikTok/i.test(ua) ||
      (ua.indexOf("Android") > -1 && ua.indexOf("wv") > -1 && ua.indexOf("Chrome") === -1);
  }

  function showGuide() {
    var title = "Cài Gia Phả Họ Nguyễn lên màn hình chính";
    var body;
    if (isInAppBrowser()) {
      body =
        "Anh đang mở trong Zalo/Facebook/app khác — trình duyệt trong app không cho cài.\n\n" +
        "Cách làm:\n" +
        "1. Bấm menu (⋮) trên thanh trình duyệt trong app\n" +
        "2. Chọn «Mở bằng Chrome» hoặc «Mở bằng trình duyệt»\n" +
        "3. Trong Chrome: bấm ⋮ → «Cài đặt ứng dụng» / «Thêm vào màn hình chính»";
    } else if (isIOS()) {
      body =
        "Trên iPhone/iPad dùng Safari:\n\n" +
        "1. Bấm nút Chia sẻ (□↑) ở thanh dưới\n" +
        "2. Kéo xuống chọn «Thêm vào Màn hình chính»\n" +
        "3. Bấm Thêm\n\n" +
        "Lưu ý: phải dùng Safari, không dùng Chrome trên iOS.";
    } else {
      body =
        "Trên Android (Chrome):\n\n" +
        "1. Bấm menu ⋮ góc trên bên phải Chrome\n" +
        "2. Chọn «Cài đặt ứng dụng» hoặc «Thêm vào màn hình chính»\n" +
        "3. Bấm Cài đặt / Thêm\n\n" +
        "Nếu không thấy mục đó: mở link bằng Chrome (không mở trong Zalo), tải lại trang rồi thử lại.";
    }
    if (typeof window.customAlert === "function") {
      window.customAlert(body);
    } else if (window.confirm) {
      alert(title + "\n\n" + body);
    } else {
      alert(body);
    }
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (btn) btn.classList.remove("hidden");
  });

  window.addEventListener("appinstalled", function () {
    deferredPrompt = null;
    if (btn) btn.classList.add("hidden");
  });

  if (btn) {
    btn.addEventListener("click", function () {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function (choice) {
          deferredPrompt = null;
          if (choice && choice.outcome === "accepted") {
            btn.classList.add("hidden");
          } else {
            showGuide();
          }
        });
        return;
      }
      showGuide();
    });
    if (!isStandalone()) {
      btn.classList.remove("hidden");
    } else {
      btn.classList.add("hidden");
    }
  }
})();
