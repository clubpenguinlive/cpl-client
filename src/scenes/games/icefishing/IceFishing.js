import GameScene from '@scenes/games/GameScene'


// Native Phaser Ice Fishing minigame (replaces the broken Ruffle/boot.swf fish game). Click the
// fish to catch them before time runs out; on finish it sends game_over -> the server-validated
// gameOver caps coins and awards Fishing XP + fish resources. Custom vector art (no Flash).

const DURATION = 30
const COINS_PER_FISH = 12
const FISH_COLORS = [0xff8a3d, 0x4fc24f, 0x3aa0e0, 0xe05c8a, 0x9a5cc0, 0xffd23f, 0xff5a5a]
const FONT = 'CCComiccrazy'

export default class IceFishing extends GameScene {

    constructor() {
        super('IceFishing')
        this.score = 0
        this.timeLeft = DURATION
        this.fishes = []
        this.over = false
    }

    // no external assets; everything is drawn
    _preload() {}

    // skip music for now (avoids preloading); the loop works without it
    setMusic() {}

    _create() {
        const W = 1520, H = 960

        // water + ice surface
        this.add.rectangle(0, 0, W, H, 0x10497f).setOrigin(0)
        this.add.rectangle(0, 0, W, 150, 0xdff1fc).setOrigin(0)
        this.add.rectangle(0, 150, W, 6, 0xbfe2f5).setOrigin(0)

        this.add.text(W / 2, 58, 'ICE FISHING', { fontFamily: FONT, fontSize: '50px', color: '#15568f' }).setOrigin(0.5)
        this.add.text(W / 2, 108, 'Click the fish to catch them!', { fontFamily: FONT, fontSize: '20px', color: '#3a6a99' }).setOrigin(0.5)

        this.scoreText = this.add.text(44, 30, 'Caught: 0', { fontFamily: FONT, fontSize: '32px', color: '#ffffff', stroke: '#0e3a66', strokeThickness: 6 })
        this.timeText = this.add.text(W - 44, 30, 'Time: ' + DURATION, { fontFamily: FONT, fontSize: '32px', color: '#ffffff', stroke: '#0e3a66', strokeThickness: 6 }).setOrigin(1, 0)

        for (let i = 0; i < 6; i++) this.spawnFish()

        this.timer = this.time.addEvent({ delay: 1000, loop: true, callback: () => this.tick() })
    }

    spawnFish() {
        if (this.over) return
        const y = 230 + Math.random() * 640
        const dir = Math.random() < 0.5 ? 1 : -1
        const startX = dir === 1 ? -70 : 1590
        const color = FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)]
        const duration = 4500 + Math.random() * 5000

        const fish = this.add.container(startX, y)
        const body = this.add.ellipse(0, 0, 72, 42, color)
        const tail = this.add.triangle(0, 0, 0, -20, 0, 20, -26, 0, color).setPosition(-36 * dir, 0)
        const eye = this.add.circle(20 * dir, -7, 6, 0xffffff)
        const pupil = this.add.circle(22 * dir, -7, 3, 0x1a1a1a)
        fish.add([tail, body, eye, pupil])
        fish.setSize(84, 46)
        fish.setInteractive({ useHandCursor: true })
        fish.on('pointerdown', () => this.catchFish(fish))
        fish.caught = false
        this.fishes.push(fish)

        const endX = dir === 1 ? 1640 : -110
        fish.tween = this.tweens.add({
            targets: fish, x: endX, duration: duration,
            onComplete: () => { this.removeFish(fish); this.spawnFish() }
        })
    }

    catchFish(fish) {
        if (this.over || fish.caught) return
        fish.caught = true
        this.score++
        this.scoreText.setText('Caught: ' + this.score)

        const pop = this.add.text(fish.x, fish.y, '+1', { fontFamily: FONT, fontSize: '30px', color: '#ffd23f', stroke: '#5a3a12', strokeThickness: 5 }).setOrigin(0.5)
        this.tweens.add({ targets: pop, y: fish.y - 46, alpha: 0, duration: 650, onComplete: () => pop.destroy() })

        this.removeFish(fish)
        this.spawnFish()
    }

    removeFish(fish) {
        if (fish.tween) fish.tween.stop()
        this.fishes = this.fishes.filter(f => f !== fish)
        fish.destroy()
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
        this.fishes.slice().forEach(f => this.removeFish(f))

        // server validates/caps the coins and awards Fishing XP + fish resources
        this.network.send('game_over', { coins: this.score * COINS_PER_FISH })

        this.add.rectangle(760, 480, 560, 220, 0x0e3a66, 0.85).setStrokeStyle(4, 0xffffff)
        this.add.text(760, 440, 'Nice fishing!', { fontFamily: FONT, fontSize: '40px', color: '#ffffff' }).setOrigin(0.5)
        this.add.text(760, 500, 'You caught ' + this.score + ' fish', { fontFamily: FONT, fontSize: '26px', color: '#ffd23f' }).setOrigin(0.5)

        this.time.delayedCall(2800, () => this.world.client.sendJoinLastRoom())
    }

    stop() {
        if (this.timer) this.timer.remove()
        super.stop()
    }

}
