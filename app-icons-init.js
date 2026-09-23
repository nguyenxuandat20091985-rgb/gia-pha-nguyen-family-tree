(function(){
  if (!window.APP_ICONS) return;
  var logo = document.getElementById('appLogo');
  if (logo) logo.src = APP_ICONS.logo;
  var fav = document.getElementById('appFavicon');
  if (fav) fav.href = APP_ICONS.fav;
  var apple = document.getElementById('appAppleIcon');
  if (apple) apple.href = APP_ICONS.icon192;
})();
