import BaseScene from '@scenes/base/BaseScene'

import RuffleShim from '@engine/ruffle/RuffleShim'


// Faithful port of cpj2's Flash subsystem so the original CP minigame SWFs (Ice Fishing, Cart
// Surfer, Catchin' Waves, Bean Counters, Astro Barrier, etc.) load + play via Ruffle. The cpj2
// boot loader (boot_cpj2.swf) talks to JS through window.ruffle (the RuffleShim); the classic-game
// keys are implemented against our client, the cpj2-only keys (Card-Jitsu / dancing / stamps /
// puffles / party) are safe no-op stubs. All payouts route through the server-authoritative
// game_over cap (a Ruffle-emulated SWF score is never trusted beyond forwarding it).

const basePath = 'assets/media/flash/'

export default class RuffleController extends BaseScene {

    // keys boot_cpj2 may call via ExternalInterface (matches cpj2's contract)
    keys = [
        'addEventListener', 'addItemToMyInventory', 'buyInventory', 'CardJitsuDownloadedAnimation',
        'closeWidget', 'getCurrentServerRoomId', 'getGamesPath', 'getMyPlayer', 'getMyPlayerHex',
        'getMyPlayerId', 'getMyPlayerNickname', 'getPath', 'getPlayerObjectById', 'getPuffleColor',
        'isItemInMyInventory', 'isItemOnMyPlayer', 'isMyPlayerMember', 'loadCardJitsuWorld',
        'playerWearingItem', 'sendDancingPacket', 'sendEndMidwayGame', 'sendGameEvent', 'sendGameOver',
        'stampEarnedAltLoader', 'stampEarnedCpj', 'stampIsOwnedByMe', 'startMusicById', 'stopMusic'
    ]

    privateKeys = [
        'sendGameOver', 'onLoadComplete', 'onWidgetLoadComplete', 'startGameMusic', 'getFrameColor',
        'sendGameOverAltLoader', 'removeEventListeners', 'getLocalizedFrame', 'sendJoinLastRoom'
    ]

    constructor(key) {
        super(key)

        this.player = null
        this.container = null
        this.path = ''
        this.music = 0
        this.gameName = null
        this.eventListeners = []

        // window.ruffle = the shim, which forwards each key to this controller
        this.shim = new RuffleShim(this)
    }

    get client() {
        return this.world.client
    }

    // our equipped-items + color object (what the Yukon penguin exposes to a game)
    get clientObject() {
        return this.client.penguin.items.flat
    }

    create() {
        window.RufflePlayer = window.RufflePlayer || {}
        window.RufflePlayer.config = { wmode: 'transparent' }

        this.playerStyle = { width: '100%', height: '100%', pointerEvents: 'auto' }

        this.container = this.add.dom(760, 480)
        this.container.visible = false

        this.gameEvents = new EventTarget()
    }

    update() {
        if (this.interface.prompt.isPromptVisible) {
            this.sendToBack()
        } else {
            this.resetDepth()
        }
    }

    // RoomManager passes the game crumb object: { key, path, music, use_alt_loader }
    bootGame(game) {
        this.path = `games/${game.key}/bootstrap.swf`
        this.music = game.music || 0
        this.gameName = game.key

        // defer until after create() so this.container exists
        this.events.once('update', () => this.boot(game.use_alt_loader))
    }

    boot(useAltLoader = false) {
        const ruffle = window.RufflePlayer.newest()

        this.player = ruffle.createPlayer()
        this.container.setElement(this.player, this.playerStyle)

        this.player.load({
            url: `${basePath}${useAltLoader ? 'boot_as3' : 'boot_cpj2'}.swf`,
            allowScriptAccess: true,
            menu: false,
            contextMenu: 'off',
            scale: 'noborder',
            autoplay: 'on',
            warnOnUnsupportedContent: false,
            logLevel: localStorage.logging === 'true' ? 'info' : 'error'
        })
    }

    // Render a CP room SWF (from the archive) directly via Ruffle. Art-only (no live penguins yet);
    // a Leave button returns to the previous room.
    bootRoom(path, mute = false) {
        // defer until create() ran (container exists) when triggered from a fresh room
        if (!this.container) {
            this.events.once('update', () => this.bootRoom(path, mute))
            return
        }

        const ruffle = window.RufflePlayer.newest()

        this.player = ruffle.createPlayer()
        this.container.setElement(this.player, this.playerStyle)

        this.player.load({
            url: path,
            allowScriptAccess: true,
            menu: false,
            contextMenu: 'off',
            scale: 'noborder',
            autoplay: 'on',
            warnOnUnsupportedContent: false,
            splashScreen: false,
            logLevel: localStorage.logging === 'true' ? 'info' : 'error'
        })

        try { this.player.volume = mute ? 0 : 0.7 } catch (e) {}
        this.interface.hideLoading()
        this.interface.hideInterface()
        this.container.visible = true

        this.addLeaveButton()
    }

    addLeaveButton() {
        if (this.leaveBtn) return
        const btn = document.createElement('button')
        btn.textContent = '← Leave'
        btn.style.cssText = 'position:fixed;top:14px;left:14px;z-index:99999;padding:8px 16px;'
            + 'font-family:CCComiccrazy,sans-serif;font-size:18px;color:#fff;background:#e6584d;'
            + 'border:3px solid #fff;border-radius:14px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.4)'
        btn.onclick = () => this.leaveRoom()
        document.body.appendChild(btn)
        this.leaveBtn = btn
    }

    leaveRoom() {
        // Flash room is an overlay; the real room (e.g. Plaza) is still active underneath.
        // Just hide the overlay + restore the HUD - no navigation.
        if (this.leaveBtn) { this.leaveBtn.remove(); this.leaveBtn = null }
        this.removePlayer()
        this.resetDepth()
        this.stopMusic()
        if (this.container) this.container.visible = false
        this.interface.showInterface()
    }

    /* ===== classic-game ExternalInterface (implemented against our client) ===== */

    getKeys() {
        return this.keys
    }

    getPath() {
        return `${basePath}${this.path}`
    }

    getGamesPath() {
        return `${basePath}games/`
    }

    getFrameColor() {
        return this.crumbs.frameColor
    }

    getMyPlayer() {
        return this.clientObject
    }

    getMyPlayerHex() {
        return this.world.getColor(this.clientObject.color)
    }

    getMyPlayerId() {
        return this.client.id
    }

    getMyPlayerNickname() {
        return this.client.penguin?.username ?? 'Penguin'
    }

    getPlayerObjectById([id]) {
        if (id === this.client.id) {
            return this.clientObject
        }
        return this.clientObject
    }

    isItemOnMyPlayer([id]) {
        return Object.values(this.clientObject).includes(id)
    }

    playerWearingItem([id]) {
        return Object.values(this.clientObject).includes(id)
    }

    isItemInMyInventory() {
        return false
    }

    isMyPlayerMember() {
        return true
    }

    getCurrentServerRoomId() {
        return this.world.room?.id ?? 0
    }

    buyInventory([itemId]) {
        this.interface.prompt.showItem(itemId)
    }

    onLoadComplete() {
        this.interface.hideLoading()
        this.interface.hideInterface()
        this.stopMusic()
        this.container.visible = true
    }

    // SERVER-AUTHORITATIVE: forward the (untrusted) SWF score to game_over; the server caps it.
    sendGameOver(obj) {
        let coins = (obj && Object.prototype.hasOwnProperty.call(obj, 'coins')) ? obj.coins : obj
        if (isNaN(coins)) coins = 0

        this.network.send('game_over', { coins: coins, game: this.gameName || 'null' })
        this.sendToBack()
    }

    sendGameOverAltLoader(obj) {
        let coins = Array.isArray(obj) ? obj[0] : obj
        if (isNaN(coins)) coins = 0
        this.network.send('game_over', { coins: coins, game: this.gameName || 'null' })
        this.sendToBack()
    }

    startMusicById(id) {
        this.startGameMusic(Array.isArray(id) ? id[0] : id)
    }

    startGameMusic(customMusic = false) {
        const music = customMusic || this.music
        if (!music) return

        if (this.cache.audio.exists(music)) {
            return this.playMusic(music)
        }
        this.load.audio(music, `assets/media/music/${music}.mp3`)
        this.load.start()
        this.load.once(`filecomplete-audio-${music}`, () => this.playMusic(music))
    }

    addEventListener(...args) {
        this.eventListeners.push([...args])
        this.gameEvents.addEventListener(...args)
    }

    removeEventListeners() {
        this.eventListeners.forEach(args => this.gameEvents.removeEventListener(...args))
        this.eventListeners = []
    }

    sendGameEvent(obj) {
        if (!obj?.event) return
        this.gameEvents.dispatchEvent(new CustomEvent(obj.event, { detail: obj.args }))
    }

    sendJoinLastRoom() {
        this.close()
        this.world.client.sendJoinLastRoom()
    }

    getLocalizedFrame() {
        return 1
    }

    /* ===== cpj2-only keys: safe no-op stubs (classic games don't use these) ===== */

    addItemToMyInventory() {}
    closeWidget() {}
    onWidgetLoadComplete() {}
    getPuffleColor() { return 'blue' }
    loadCardJitsuWorld() {}
    CardJitsuDownloadedAnimation() {}
    sendDancingPacket() {}
    sendEndMidwayGame() {}
    stampIsOwnedByMe() { return false }
    stampEarnedCpj() {}
    stampEarnedAltLoader() {}

    /* ===== lifecycle ===== */

    close() {
        this.gameName = null
        if (this.leaveBtn) { this.leaveBtn.remove(); this.leaveBtn = null }
        this.removePlayer()
        this.resetDepth()
        this.stopMusic()
        if (this.container) this.container.visible = false
        this.removeEventListeners()
    }

    stop() {
        this.events.off('update')
        this.path = null
        this.music = null
        this.removePlayer()
        this.resetDepth()
        this.stopMusic()
        this.removeEventListeners()
        this.scene.stop()
    }

    removePlayer() {
        this.player?.remove()
        this.player = null
    }

    resetDepth() {
        this.game.domContainer.style.zIndex = 'auto'
    }

    sendToBack() {
        this.game.domContainer.style.zIndex = -10
    }

}
