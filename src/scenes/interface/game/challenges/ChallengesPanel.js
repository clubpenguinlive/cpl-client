import BaseContainer from '@scenes/base/BaseContainer'


// "Daily Challenges" panel — same catalog-book chrome as SkillsWidget. Shows today's 3 server-derived
// goals, each with a progress bar and a Claim button once complete, plus a reset countdown. The server
// is the source of truth: progress is read from `daily_challenges`, and claiming sends `claim_challenge`
// (server-validated + idempotent) and reflects the awarded coins.

const FONT = 'CCComiccrazy'

const C = {
    binding: 0x1c6bb0, bindingDark: 0x12568f, cream: 0xf7eecf, creamLine: 0xd9c290,
    row: 0xfffaf0, rowLine: 0xcdb88a, track: 0xe2d6b0, trackLine: 0xc9b487,
    fill: 0x49c25e, gold: '#ffce3d', goldStroke: '#5a3a12', blueText: '#15568f',
    brown: '#8a5a12', green: 0x49c25e, greenDark: 0x2f8f43, red: 0xe6584d, redDark: 0xb83b30
}

const ROW_X = 300, ROW_W = 920, ROW_H = 150
const ROW_Y0 = 322
const TEXT_X = ROW_X + 34
const BAR_X = TEXT_X, BAR_W = 540
const ACT_X = ROW_X + ROW_W - 150   // claim button / status, right side

export default class ChallengesPanel extends BaseContainer {

    constructor(scene) {
        super(scene, 0, 0)

        this.depth = 100
        this.data = []

        const block = scene.add.rectangle(0, 0, 1520, 960, 0x000000, 0.5).setOrigin(0, 0).setInteractive()
        this.add(block)

        const g = scene.add.graphics()
        g.fillStyle(C.bindingDark, 1).fillRoundedRect(230, 96, 1060, 770, 28)
        g.fillStyle(C.binding, 1).fillRoundedRect(240, 104, 1040, 754, 24)
        g.fillStyle(C.cream, 1).fillRoundedRect(274, 150, 972, 678, 16)
        g.lineStyle(3, C.creamLine, 1).strokeRoundedRect(274, 150, 972, 678, 16)
        this.add(g)

        this.add(scene.add.text(760, 196, 'DAILY CHALLENGES', { fontFamily: FONT, fontSize: '44px', color: C.gold, stroke: C.goldStroke, strokeThickness: 9 }).setOrigin(0.5))
        this.add(scene.add.text(760, 248, 'Complete goals to earn bonus coins', { fontFamily: FONT, fontSize: '18px', color: C.blueText }).setOrigin(0.5))

        const closeBtn = scene.add.graphics()
        closeBtn.fillStyle(C.redDark, 1).fillCircle(1236, 134, 22).fillStyle(C.red, 1).fillCircle(1236, 132, 20)
        this.add(closeBtn)
        this.add(scene.add.text(1236, 130, '✕', { fontFamily: FONT, fontSize: '22px', color: '#ffffff' }).setOrigin(0.5))
        const closeHit = scene.add.circle(1236, 132, 24).setInteractive({ useHandCursor: true })
        closeHit.on('pointerdown', () => this.onClose())
        this.add(closeHit)

        this.rows = scene.add.container(0, 0)
        this.add(this.rows)

        this.countdown = scene.add.text(760, 800, '', { fontFamily: FONT, fontSize: '17px', color: C.blueText }).setOrigin(0.5)
        this.add(this.countdown)
        this.flash = scene.add.text(760, 776, '', { fontFamily: FONT, fontSize: '16px', color: '#2f7a3a', stroke: '#ffffff', strokeThickness: 3 }).setOrigin(0.5)
        this.add(this.flash)

        this.onDataBound = (args) => this.onData(args)
        this.onClaimedBound = (args) => this.onClaimed(args)
        this.network.events.on('daily_challenges', this.onDataBound)
        this.network.events.on('challenge_claimed', this.onClaimedBound)
        this.network.send('get_daily_challenges', {})
    }

    onData(args) {
        this.data = args.challenges || []
        this.renderRows()
        this.renderCountdown(args.secondsUntilNext)
    }

    renderRows() {
        this.rows.removeAll(true)

        this.data.forEach((ch, i) => {
            const y = ROW_Y0 + i * ROW_H
            const complete = ch.progress >= ch.target

            const card = this.scene.add.graphics()
            card.fillStyle(C.row, 1).fillRoundedRect(ROW_X, y, ROW_W, ROW_H - 18, 12)
            card.lineStyle(2, C.rowLine, 1).strokeRoundedRect(ROW_X, y, ROW_W, ROW_H - 18, 12)
            this.rows.add(card)

            // goal text + reward
            this.rows.add(this.scene.add.text(TEXT_X, y + 26, ch.text, { fontFamily: FONT, fontSize: '23px', color: C.blueText }).setOrigin(0, 0.5))
            this.rows.add(this.scene.add.text(TEXT_X, y + 58, 'Reward: ' + ch.reward + ' coins', { fontFamily: FONT, fontSize: '15px', color: C.brown }).setOrigin(0, 0.5))

            // progress bar
            const by = y + 98
            const bar = this.scene.add.graphics()
            bar.fillStyle(C.track, 1).fillRoundedRect(BAR_X, by, BAR_W, 22, 8)
            const frac = Math.max(0, Math.min(1, ch.target ? ch.progress / ch.target : 0))
            const w = Math.max(8, BAR_W * frac)
            bar.fillStyle(complete ? C.green : C.binding, 1).fillRoundedRect(BAR_X, by, w, 22, 8)
            bar.lineStyle(2, C.trackLine, 1).strokeRoundedRect(BAR_X, by, BAR_W, 22, 8)
            this.rows.add(bar)
            this.rows.add(this.scene.add.text(BAR_X + BAR_W + 16, by + 11, ch.progress + ' / ' + ch.target, { fontFamily: FONT, fontSize: '17px', color: C.brown }).setOrigin(0, 0.5))

            // right side: Claimed / Claim button / locked
            const cy = y + 56
            if (ch.claimed) {
                this.rows.add(this.scene.add.text(ACT_X + 70, cy, 'CLAIMED', { fontFamily: FONT, fontSize: '20px', color: '#2f8f43' }).setOrigin(0.5))
                this.rows.add(this.scene.add.text(ACT_X + 70, cy + 26, '✓', { fontFamily: FONT, fontSize: '22px', color: '#2f8f43' }).setOrigin(0.5))
            } else if (complete) {
                const btn = this.scene.add.graphics()
                btn.fillStyle(C.greenDark, 1).fillRoundedRect(ACT_X, cy - 26, 140, 52, 12)
                btn.fillStyle(C.green, 1).fillRoundedRect(ACT_X, cy - 28, 140, 52, 12)
                this.rows.add(btn)
                this.rows.add(this.scene.add.text(ACT_X + 70, cy - 2, 'CLAIM', { fontFamily: FONT, fontSize: '22px', color: '#ffffff' }).setOrigin(0.5))
                const hit = this.scene.add.rectangle(ACT_X + 70, cy - 2, 140, 52, 0xffffff, 0.001).setInteractive({ useHandCursor: true })
                hit.on('pointerdown', () => this.claim(ch.id))
                this.rows.add(hit)
            } else {
                this.rows.add(this.scene.add.text(ACT_X + 70, cy, 'In progress', { fontFamily: FONT, fontSize: '16px', color: '#9a8f73' }).setOrigin(0.5))
            }
        })
    }

    renderCountdown(seconds) {
        if (seconds == null) {
            this.countdown.setText('')
            return
        }
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        this.countdown.setText('New challenges in ' + h + 'h ' + m + 'm')
    }

    claim(id) {
        // server re-validates completion + idempotency; this is just the trigger
        this.network.send('claim_challenge', { id: id })
    }

    onClaimed(args) {
        // mark the row claimed locally and re-render; reflect the awarded coins in the HUD
        const ch = this.data.find(c => c.id === args.id)
        if (ch) ch.claimed = true
        this.renderRows()

        this.world.client.coins = args.coins
        this.interface.refreshPlayerCard()

        this.flash.setText('Claimed ' + args.reward + ' coins!')
        this.scene.tweens.killTweensOf(this.flash)
        this.flash.setAlpha(1)
        this.scene.tweens.add({ targets: this.flash, alpha: 0, delay: 2200, duration: 600 })
    }

    onClose() {
        this.network.events.off('daily_challenges', this.onDataBound)
        this.network.events.off('challenge_claimed', this.onClaimedBound)
        this.interface.removeWidget(this)
        this.destroy()
    }

}
