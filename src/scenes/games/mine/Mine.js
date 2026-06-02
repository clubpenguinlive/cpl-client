import GameScene from '@scenes/games/GameScene'


// Native Phaser mining minigame (replaces the broken Ruffle/bootstrap.swf mine game, game 905).
// Click the ore chunks drifting through the cavern before time runs out; on finish it sends
// game_over -> the server-validated gameOver caps coins and awards Mining XP + ore. Same proven
// structure as IceFishing (custom vector art, click-to-collect), themed as a mine.

const DURATION = 30
const COINS_PER_ORE = 14
const GEM_COLORS = [0x8e5cd0, 0x49c25e, 0xffd23f, 0xe05c5c, 0x4fb6e0, 0xff9a3d]
const FONT = 'CCComiccrazy'

export default class Mine extends GameScene {

    constructor() {
        super('Mine')
        this.score = 0
        this.timeLeft = DURATION
        this.chunks = []
        this.over = false
    }

    _preload() {}

    setMusic() {}

    _create() {
        const W = 1520, H = 960

        // cavern + rock ceiling
        this.add.rectangle(0, 0, W, H, 0x2e1f14).setOrigin(0)
        this.add.rectangle(0, 0, W, 150, 0x4a3220).setOrigin(0)
        this.add.rectangle(0, 150, W, 6, 0x6b4a2e).setOrigin(0)

        this.add.text(W / 2, 58, 'THE MINE', { fontFamily: FONT, fontSize: '50px', color: '#ffd23f', stroke: '#5a3a12', strokeThickness: 7 }).setOrigin(0.5)
        this.add.text(W / 2, 108, 'Click the ore to mine it!', { fontFamily: FONT, fontSize: '20px', color: '#e0c79a' }).setOrigin(0.5)

        this.scoreText = this.add.text(44, 30, 'Ore: 0', { fontFamily: FONT, fontSize: '32px', color: '#ffffff', stroke: '#3a2410', strokeThickness: 6 })
        this.timeText = this.add.text(W - 44, 30, 'Time: ' + DURATION, { fontFamily: FONT, fontSize: '32px', color: '#ffffff', stroke: '#3a2410', strokeThickness: 6 }).setOrigin(1, 0)

        for (let i = 0; i < 6; i++) this.spawnChunk()

        this.timer = this.time.addEvent({ delay: 1000, loop: true, callback: () => this.tick() })
    }

    spawnChunk() {
        if (this.over) return
        const y = 230 + Math.random() * 640
        const dir = Math.random() < 0.5 ? 1 : -1
        const startX = dir === 1 ? -70 : 1590
        const gem = GEM_COLORS[Math.floor(Math.random() * GEM_COLORS.length)]
        const duration = 4500 + Math.random() * 5000

        const chunk = this.add.container(startX, y)
        const rock = this.add.ellipse(0, 0, 76, 58, 0x6b6b6b)
        const rockHi = this.add.ellipse(-10, -10, 40, 26, 0x8a8a8a)
        const facet = this.add.triangle(0, 0, 0, -18, -16, 10, 16, 10, gem)
        const sparkle = this.add.circle(8, -8, 4, 0xffffff)
        chunk.add([rock, rockHi, facet, sparkle])
        chunk.setSize(80, 60)
        chunk.setInteractive({ useHandCursor: true })
        chunk.on('pointerdown', () => this.mine(chunk))
        chunk.mined = false
        this.chunks.push(chunk)

        const endX = dir === 1 ? 1640 : -110
        chunk.tween = this.tweens.add({
            targets: chunk, x: endX, duration: duration,
            onComplete: () => { this.removeChunk(chunk); this.spawnChunk() }
        })
    }

    mine(chunk) {
        if (this.over || chunk.mined) return
        chunk.mined = true
        this.score++
        this.scoreText.setText('Ore: ' + this.score)

        const pop = this.add.text(chunk.x, chunk.y, '+1', { fontFamily: FONT, fontSize: '30px', color: '#ffd23f', stroke: '#5a3a12', strokeThickness: 5 }).setOrigin(0.5)
        this.tweens.add({ targets: pop, y: chunk.y - 46, alpha: 0, duration: 650, onComplete: () => pop.destroy() })

        this.removeChunk(chunk)
        this.spawnChunk()
    }

    removeChunk(chunk) {
        if (chunk.tween) chunk.tween.stop()
        this.chunks = this.chunks.filter(c => c !== chunk)
        chunk.destroy()
    }

    tick() {
        this.timeLeft--
        this.timeText.setText('Time: ' + Math.max(0, this.timeLeft))
        if (this.timeLeft <= 0) this.endGame()
    }

    endGame() {
        if (this.over) return
        this.over = true
        if (this.timer) this.timer.remove()
        this.chunks.slice().forEach(c => this.removeChunk(c))

        // server validates/caps the coins and awards Mining XP + ore resources
        this.network.send('game_over', { coins: this.score * COINS_PER_ORE })

        this.add.rectangle(760, 480, 560, 220, 0x3a2410, 0.88).setStrokeStyle(4, 0xffd23f)
        this.add.text(760, 440, 'Good haul!', { fontFamily: FONT, fontSize: '40px', color: '#ffffff' }).setOrigin(0.5)
        this.add.text(760, 500, 'You mined ' + this.score + ' ore', { fontFamily: FONT, fontSize: '26px', color: '#ffd23f' }).setOrigin(0.5)

        this.time.delayedCall(2800, () => this.world.client.sendJoinLastRoom())
    }

    stop() {
        if (this.timer) this.timer.remove()
        super.stop()
    }

}
