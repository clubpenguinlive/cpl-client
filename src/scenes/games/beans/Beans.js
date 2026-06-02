import GameScene from '@scenes/games/GameScene'


// Native Phaser hauling minigame (replaces the broken Ruffle game 901). Click the cargo sacks
// moving across the warehouse before time runs out; on finish it sends game_over -> the
// server-validated gameOver caps coins and awards Hauling XP + cargo. Same proven structure as the
// Mine/IceFishing games, themed as a coffee warehouse.

const DURATION = 30
const COINS_PER_CARGO = 12
const SACK_COLORS = [0x8a5a2e, 0x9c6b38, 0x7a4a24, 0xa07a48]
const FONT = 'CCComiccrazy'

export default class Beans extends GameScene {

    constructor() {
        super('Beans')
        this.score = 0
        this.timeLeft = DURATION
        this.sacks = []
        this.over = false
    }

    _preload() {}

    setMusic() {}

    _create() {
        const W = 1520, H = 960

        // warehouse wall + floor band
        this.add.rectangle(0, 0, W, H, 0x3a2a1c).setOrigin(0)
        this.add.rectangle(0, 0, W, 150, 0x5a4330).setOrigin(0)
        this.add.rectangle(0, 150, W, 6, 0x7a5a3e).setOrigin(0)

        this.add.text(W / 2, 58, 'BEAN COUNTERS', { fontFamily: FONT, fontSize: '50px', color: '#ffd23f', stroke: '#3a2410', strokeThickness: 7 }).setOrigin(0.5)
        this.add.text(W / 2, 108, 'Click the cargo to haul it!', { fontFamily: FONT, fontSize: '20px', color: '#e6cfa8' }).setOrigin(0.5)

        this.scoreText = this.add.text(44, 30, 'Cargo: 0', { fontFamily: FONT, fontSize: '32px', color: '#ffffff', stroke: '#3a2410', strokeThickness: 6 })
        this.timeText = this.add.text(W - 44, 30, 'Time: ' + DURATION, { fontFamily: FONT, fontSize: '32px', color: '#ffffff', stroke: '#3a2410', strokeThickness: 6 }).setOrigin(1, 0)

        for (let i = 0; i < 6; i++) this.spawnSack()

        this.timer = this.time.addEvent({ delay: 1000, loop: true, callback: () => this.tick() })
    }

    spawnSack() {
        if (this.over) return
        const y = 230 + Math.random() * 640
        const dir = Math.random() < 0.5 ? 1 : -1
        const startX = dir === 1 ? -70 : 1590
        const color = SACK_COLORS[Math.floor(Math.random() * SACK_COLORS.length)]
        const duration = 4500 + Math.random() * 5000

        const sack = this.add.container(startX, y)
        const body = this.add.ellipse(0, 6, 64, 70, color)
        const tie = this.add.rectangle(0, -28, 26, 16, 0x5a3a1e)
        const bean1 = this.add.ellipse(-10, 8, 12, 16, 0x3a2410)
        const bean2 = this.add.ellipse(12, 18, 12, 16, 0x3a2410)
        sack.add([body, tie, bean1, bean2])
        sack.setSize(70, 80)
        sack.setInteractive({ useHandCursor: true })
        sack.on('pointerdown', () => this.haul(sack))
        sack.hauled = false
        this.sacks.push(sack)

        const endX = dir === 1 ? 1640 : -110
        sack.tween = this.tweens.add({
            targets: sack, x: endX, duration: duration,
            onComplete: () => { this.removeSack(sack); this.spawnSack() }
        })
    }

    haul(sack) {
        if (this.over || sack.hauled) return
        sack.hauled = true
        this.score++
        this.scoreText.setText('Cargo: ' + this.score)

        const pop = this.add.text(sack.x, sack.y, '+1', { fontFamily: FONT, fontSize: '30px', color: '#ffd23f', stroke: '#3a2410', strokeThickness: 5 }).setOrigin(0.5)
        this.tweens.add({ targets: pop, y: sack.y - 46, alpha: 0, duration: 650, onComplete: () => pop.destroy() })

        this.removeSack(sack)
        this.spawnSack()
    }

    removeSack(sack) {
        if (sack.tween) sack.tween.stop()
        this.sacks = this.sacks.filter(s => s !== sack)
        sack.destroy()
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
        this.sacks.slice().forEach(s => this.removeSack(s))

        // server validates/caps the coins and awards Hauling XP + cargo resources
        this.network.send('game_over', { coins: this.score * COINS_PER_CARGO })

        this.add.rectangle(760, 480, 560, 220, 0x3a2410, 0.9).setStrokeStyle(4, 0xffd23f)
        this.add.text(760, 440, 'Nice hauling!', { fontFamily: FONT, fontSize: '40px', color: '#ffffff' }).setOrigin(0.5)
        this.add.text(760, 500, 'You hauled ' + this.score + ' cargo', { fontFamily: FONT, fontSize: '26px', color: '#ffd23f' }).setOrigin(0.5)

        this.time.delayedCall(2800, () => this.world.client.sendJoinLastRoom())
    }

    stop() {
        if (this.timer) this.timer.remove()
        super.stop()
    }

}
