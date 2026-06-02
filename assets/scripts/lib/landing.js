// Front-page landing: gentle snow + Play Now dismiss + PWA install hints.
// External (not inline) so it satisfies the strict CSP script-src 'self'.
(function () {
    var snow = document.getElementById('cpl-snow')
    if (snow) {
        for (var i = 0; i < 55; i++) {
            var f = document.createElement('div')
            f.className = 'snowflake'
            var size = 2 + Math.random() * 5
            f.style.width = f.style.height = size + 'px'
            f.style.left = (Math.random() * 100) + 'vw'
            f.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px')
            f.style.animationDuration = (6 + Math.random() * 9) + 's'
            f.style.animationDelay = (-Math.random() * 12) + 's'
            f.style.opacity = 0.4 + Math.random() * 0.5
            snow.appendChild(f)
        }
    }

    // play.clubpenguinlive.net boots straight to the game START screen. The marketing/hero
    // landing lives separately on clubpenguinlive.net, so there is no second landing here:
    // dismiss the built-in landing immediately on load instead of waiting for a Play click.
    var landing = document.getElementById('cpl-landing')
    if (landing) {
        document.body.classList.add('cpl-launched')
        landing.style.display = 'none'
        window.dispatchEvent(new Event('resize'))   // let Phaser FIT refit to the framed start screen
    }

    // Persistent chrome (CPJourney model): the game stays framed with nav + footer; fullscreen is
    // an explicit toggle. "Go Full Screen" uses the Fullscreen API on the framed game box; exiting
    // returns to the framed view. The resize event lets Phaser FIT refit the canvas either way.
    var fsBtn = document.getElementById('cpl-fullscreen')
    var gameWrap = document.getElementById('game-wrap')
    if (fsBtn && gameWrap) {
        fsBtn.addEventListener('click', function () {
            if (document.fullscreenElement) {
                document.exitFullscreen()
            } else if (gameWrap.requestFullscreen) {
                gameWrap.requestFullscreen().catch(function () {})
            }
        })
        document.addEventListener('fullscreenchange', function () {
            fsBtn.textContent = document.fullscreenElement ? 'Exit Full Screen' : 'Go Full Screen'
            window.dispatchEvent(new Event('resize'))
        })
    }

    // Log Out: forget the saved-penguin tokens (so we don't zero-click straight back in) and reload
    // to the START screen.
    var logoutBtn = document.getElementById('cpl-logout')
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            try { localStorage.removeItem('saved_penguins') } catch (e) {}
            location.reload()
        })
    }
})();

// PWA: register the service worker (enables Android install) + show install hints.
;(function () {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(function () {})
    }

    var banner = document.getElementById('cpl-install')
    if (!banner) return
    var text = banner.querySelector('.cpl-install-text')
    var btn = banner.querySelector('.cpl-install-btn')
    var close = banner.querySelector('.cpl-install-close')

    var dismissed = false
    try { dismissed = localStorage.getItem('cpl-install-dismissed') === '1' } catch (e) {}
    function show() { if (!dismissed) banner.hidden = false }
    function hide() { banner.hidden = true; try { localStorage.setItem('cpl-install-dismissed', '1') } catch (e) {} }
    if (close) close.addEventListener('click', hide)

    var ua = navigator.userAgent || ''
    var isIOS = /iphone|ipad|ipod/i.test(ua)
    var isStandalone = (('standalone' in navigator) && navigator.standalone) ||
        (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
    if (isStandalone) return  // already installed/launched from home screen

    if (isIOS) {
        if (text) text.textContent = 'Tap the Share button, then "Add to Home Screen" to play full-screen.'
        if (btn) btn.hidden = true
        show()
    }

    // Android Chrome: real install prompt
    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault()
        var deferred = e
        if (text) text.textContent = 'Install Club Penguin Live for the full-screen experience.'
        if (btn) {
            btn.hidden = false
            btn.addEventListener('click', function () {
                if (deferred) { deferred.prompt(); deferred = null; hide() }
            })
        }
        show()
    })
})()
