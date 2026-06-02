import BaseScene from '@scenes/base/BaseScene'


// Hosts a real HTML5 minigame (sourced from the community forks, served under /minigames/) inside a
// DOM iframe, and bridges its end-of-game score back into the SAME server-authoritative game_over
// handler used by the rest of the economy. The game posts {type:'cpl_game_over', score} to the top
// window; we validate the message origin (the iframe is same-origin), then send game_over so the
// server caps coins and awards skill XP + resource drops. The client never trusts the raw score
// beyond forwarding it to the server, which clamps it.

export default class IframeController extends BaseScene {

    constructor(key) {
        super(key)

        this.container = null
        this.frame = null
        this.leaveBtn = null
        this.onMessage = null
        this.name = null
        this.music = 0
    }

    create() {
        // DOM container is positioned in game space and scaled with the canvas (same as Ruffle)
        this.container = this.add.dom(760, 480)
        this.container.visible = false
    }

    bootIframe(name, music) {
        this.name = name
        this.music = music || 0

        // defer until after create() so this.container exists (mirrors RuffleController.bootGame)
        this.events.once('update', () => this.boot())
    }

    boot() {
        const iframe = document.createElement('iframe')
        iframe.src = `/minigames/${this.name}/`
        iframe.setAttribute('scrolling', 'no')

        this.container.setElement(iframe, {
            width: '1520px',
            height: '960px',
            border: 'none',
            pointerEvents: 'auto'
        })
        this.frame = iframe

        this.onMessage = (e) => this.handleMessage(e)
        window.addEventListener('message', this.onMessage)

        this.addLeaveButton()

        this.interface.hideLoading()
        this.interface.hideInterface()
        this.stopMusic()
        this.startMusic()

        this.container.visible = true
    }

    addLeaveButton() {
        // a real escape hatch: HTML5 games loop on "Play Again" and have no door back to CP
        const btn = document.createElement('button')
        btn.textContent = '← Leave'
        btn.style.cssText = 'position:fixed;top:14px;left:14px;z-index:99999;padding:8px 16px;'
            + 'font-family:CCComiccrazy,sans-serif;font-size:18px;color:#fff;background:#e6584d;'
            + 'border:3px solid #fff;border-radius:14px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.4)'
        btn.onclick = () => this.leave()
        document.body.appendChild(btn)
        this.leaveBtn = btn
    }

    startMusic() {
        const music = this.music
        if (!music) return

        if (this.cache.audio.exists(music)) {
            return this.playMusic(music)
        }

        this.load.audio(music, `assets/media/music/${music}.mp3`)
        this.load.start()
        this.load.once(`filecomplete-audio-${music}`, () => this.playMusic(music))
    }

    handleMessage(e) {
        // the game iframe is served from our own origin, so a legitimate game_over carries it
        if (e.origin !== window.location.origin) return

        const data = e.data
        if (!data || data.type !== 'cpl_game_over') return

        const coins = parseInt(data.score)
        // server validates + caps; client only forwards
        this.network.send('game_over', { coins: isNaN(coins) ? 0 : coins })

        this.close()
        this.world.client.sendJoinLastRoom()
    }

    leave() {
        this.close()
        this.world.client.sendJoinLastRoom()
    }

    close() {
        if (this.onMessage) {
            window.removeEventListener('message', this.onMessage)
            this.onMessage = null
        }
        if (this.leaveBtn) {
            this.leaveBtn.remove()
            this.leaveBtn = null
        }
        this.frame = null
        this.container?.removeElement()
        if (this.container) this.container.visible = false
        this.stopMusic()
    }

    stop() {
        this.close()
        this.scene.stop()
    }

}
