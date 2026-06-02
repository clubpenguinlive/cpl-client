import GameScene from '@scenes/games/GameScene'


// Native Phaser surfing minigame (replaces the broken Ruffle game 912). Click the seashells
// riding the waves before time runs out; on finish it sends game_over -> the server-validated
// gameOver caps coins and awards Surfing XP + shells. Same proven structure as the Mine/IceFishing
// games, themed as a beach.

const DURATION = 30
const COINS_PER_SHELL = 18
const SHELL_COLORS = [0xf3d6c0, 0xf6c9d6, 0xfbe6c0, 0xd9e6f3, 0xf0d0e8]
const FONT = 'CCComiccrazy'

export default class Waves extends GameScene {

    constructor() {
        super('Waves')
        this.score = 0
        this.timeLeft = DURATION
        this.shells = []
        this.over = false
    }

    _preload() {}

    setMusic() {}

    _create() {
        const W = 1520, H = 960

        // sky + ocean
        this.add.rectangle(0, 0, W, H, 0x1a7fb5).setOrigin(0)
        this.add.rectangle(0, 0, W, 150, 0x8fd0ec).setOrigin(0)
        this.add.rectangle(0, 150, W, 6, 0xbfe6f5).setOrigin(0)

        this.add.text(W / 2, 58, "CATCHIN' WAVES", { fontFamily: FONT, fontSize: '50px', color: '#ffffff', stroke: '#0e5a86', strokeThickness: 7 }).setOrigin(0.5)
        this.add.text(W / 2, 108, 'Click the shells to collect them!', { fontFamily: FONT, fontSize: '20px', color: '#dff1fc' }).setOrigin(0.5)

        this.scoreText = this.add.text(44, 30, 'Shells: 0', { fontFamily: FONT, fontSize: '32px', color: '#ffffff', stroke: '#0e3a66', strokeThickness: 6 })
        this.timeText = this.add.text(W - 44, 30, 'Time: ' + DURATION, { fontFamily: FONT, fontSize: '32px', color: '#ffffff', stroke: '#0e3a66', strokeThickness: 6 }).setOrigin(1, 0)

        for (let i = 0; i < 6; i++) this.spawnShell()

        this.timer = this.time.addEvent({ delay: 1000, loop: true, callback: () => this.tick() })
    }

    spawnShell() {
        if (this.over) return
        const y = 230 + Math.random() * 640
        const dir = Math.random() < 0.5 ? 1 : -1
        const startX = dir === 1 ? -70 : 1590
        const color = SHELL_COLORS[Math.floor(Math.random() * SHELL_COLORS.length)]
        const duration = 4200 + Math.random() * 5000

        const shell = this.add.container(startX, y)
        const fan = this.add.ellipse(0, 6, 70, 50, color)
        const ridge1 = this.add.triangle(0, 0, 0, 28, -22, -22, 0, -26, 0xffffff).setAlpha(0.35)
        const ridge2 = this.add.triangle(0, 0, 0, 28, 22, -22, 0, -26, 0xffffff).setAlpha(0.35)
        const hinge = this.add.circle(0, 26, 8, color).setStrokeStyle(2, 0xffffff)
        shell.add([fan, ridge1, ridge2, hinge])
        shell.setSize(74, 56)
        shell.setInteractive({ useHandCursor: true })
        shell.on('pointerdown', () => this.collect(shell))
        shell.taken = false
        this.shells.push(shell)

        const endX = dir === 1 ? 1640 : -110
        shell.tween = this.tweens.add({
            targets: shell, x: endX, duration: duration,
            onComplete: () => { this.removeShell(shell); this.spawnShell() }
        })
    }

    collect(shell) {
        if (this.over || shell.taken) return
        shell.taken = true
        this.score++
        this.scoreText.setText('Shells: ' + this.score)

        const pop = this.add.text(shell.x, shell.y, '+1', { fontFamily: FONT, fontSize: '30px', color: '#ffffff', stroke: '#0e5a86', strokeThickness: 5 }).setOrigin(0.5)
        this.tweens.add({ targets: pop, y: shell.y - 46, alpha: 0, duration: 650, onComplete: () => pop.destroy() })

        this.removeShell(shell)
        this.spawnShell()
    }

    removeShell(shell) {
        if (shell.tween) shell.tween.stop()
        this.shells = this.shells.filter(s => s !== shell)
        shell.destroy()
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
        this.shells.slice().forEach(s => this.removeShell(s))

        // server validates/caps the coins and awards Surfing XP + shell resources
        this.network.send('game_over', { coins: this.score * COINS_PER_SHELL })

        this.add.rectangle(760, 480, 560, 220, 0x0e5a86, 0.88).setStrokeStyle(4, 0xffffff)
        this.add.text(760, 440, 'Surfs up!', { fontFamily: FONT, fontSize: '40px', color: '#ffffff' }).setOrigin(0.5)
        this.add.text(760, 500, 'You collected ' + this.score + ' shells', { fontFamily: FONT, fontSize: '26px', color: '#ffe6a8' }).setOrigin(0.5)

        this.time.delayedCall(2800, () => this.world.client.sendJoinLastRoom())
    }

    stop() {
        if (this.timer) this.timer.remove()
        super.stop()
    }

}
