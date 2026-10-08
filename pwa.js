(function () {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").catch(function () {});
    });
  }

  var deferredPrompt = null;
  var btn = document.getElementById("btnInstall");

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (btn) btn.classList.remove("hidden");
  });

  if (btn) {
    btn.addEventListener("click", function () {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function () {
          deferredPrompt = null;
          btn.classList.add("hidden");
        });
        return;
      }
      var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      var msg = isIOS
        ? "Trên iPhone: bấm nút Chia sẻ (□↑) ở dưới Safari → chọn «Thêm vào Màn hình chính»."
        : "Trên Android (Chrome): bấm menu ⋮ góc trên → chọn «Cài đặt ứng dụng» hoặc «Thêm vào màn hình chính».";
      if (window.customAlert) window.customAlert(msg);
      else alert(msg);
    });
    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    var isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    if (!isStandalone) {
      btn.classList.remove("hidden");
    }
    if (isStandalone) btn.classList.add("hidden");
  }
})();
