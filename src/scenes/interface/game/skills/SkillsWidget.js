import BaseContainer from '@scenes/base/BaseContainer'


// "My Skills" panel — the progression loop made visible, styled to match the CP catalog book
// (cream rounded page, blue binding, gold outlined CCComiccrazy header, CP fonts). Shows each of
// the 7 skills with level, an XP progress bar, the active coin buff (+1%/level, server-validated),
// total level, and gathered resources. Server is the source of truth (get_skills -> skills).

const FONT = 'CCComiccrazy'

const SKILLS = [
    { key: 'fishing',    label: 'Fishing' },
    { key: 'mining',     label: 'Mining' },
    { key: 'surfing',    label: 'Surfing' },
    { key: 'cooking',    label: 'Cooking' },
    { key: 'hauling',    label: 'Hauling' },
    { key: 'performing', label: 'Performing' },
    { key: 'agent',      label: 'Agent' }
]

const C = {
    binding: 0x1c6bb0, bindingDark: 0x12568f, cream: 0xf7eecf, creamLine: 0xd9c290,
    track: 0xe2d6b0, trackLine: 0xc9b487, fill: 0x49c25e, fillLine: 0x2f8f43,
    gold: '#ffce3d', goldStroke: '#5a3a12', blueText: '#15568f', brown: '#b8791a',
    red: 0xe6584d, redDark: 0xb83b30
}

const ROW_X0 = 270
const ROW_Y0 = 300
const ROW_H = 64
const BAR_X = 600
const BAR_W = 380

export default class SkillsWidget extends BaseContainer {

    constructor(scene) {
        super(scene, 0, 0)

        this.depth = 100
        this.onDataBound = (args) => this.onData(args)

        const block = scene.add.rectangle(0, 0, 1520, 960, 0x000000, 0.5).setOrigin(0, 0).setInteractive()
        this.add(block)

        // book frame (matches the catalog)
        const g = scene.add.graphics()
        g.fillStyle(C.bindingDark, 1).fillRoundedRect(230, 96, 1060, 770, 28)
        g.fillStyle(C.binding, 1).fillRoundedRect(240, 104, 1040, 754, 24)
        g.fillStyle(C.cream, 1).fillRoundedRect(274, 150, 972, 678, 16)
        g.lineStyle(3, C.creamLine, 1).strokeRoundedRect(274, 150, 972, 678, 16)
        this.add(g)

        this.add(scene.add.text(760, 138, 'MY SKILLS', { fontFamily: FONT, fontSize: '46px', color: C.gold, stroke: C.goldStroke, strokeThickness: 9 }).setOrigin(0.5))
        this.totalText = scene.add.text(760, 192, '', { fontFamily: FONT, fontSize: '18px', color: C.blueText, stroke: '#ffffff', strokeThickness: 3 }).setOrigin(0.5)
        this.add(this.totalText)

        // close
        const closeBtn = scene.add.graphics()
        closeBtn.fillStyle(C.redDark, 1).fillCircle(1236, 134, 22).fillStyle(C.red, 1).fillCircle(1236, 132, 20)
        this.add(closeBtn)
        const closeX = scene.add.text(1236, 130, '✕', { fontFamily: FONT, fontSize: '22px', color: '#ffffff' }).setOrigin(0.5)
        this.add(closeX)
        const closeHit = scene.add.circle(1236, 132, 24).setInteractive({ useHandCursor: true })
        closeHit.on('pointerdown', () => this.onClose())
        this.add(closeHit)

        this.rows = scene.add.container(0, 0)
        this.add(this.rows)
        this.resText = scene.add.text(760, 800, '', { fontFamily: FONT, fontSize: '15px', color: C.brown, stroke: '#ffffff', strokeThickness: 3 }).setOrigin(0.5)
        this.add(this.resText)

        this.network.events.on('skills', this.onDataBound)
        this.network.send('get_skills', {})
    }

    onData(args) {
        this.totalText.setText('Total Level  ' + (args.total || 0))
        this.rows.removeAll(true)
        const skills = args.skills || {}

        SKILLS.forEach((def, i) => {
            const d = skills[def.key] || { level: 1, progress: 0 }
            const y = ROW_Y0 + i * ROW_H

            // row card
            const card = this.scene.add.graphics()
            card.fillStyle(0xfffaf0, 1).fillRoundedRect(ROW_X0, y - 26, 980, 52, 10)
            card.lineStyle(2, C.creamLine, 1).strokeRoundedRect(ROW_X0, y - 26, 980, 52, 10)
            this.rows.add(card)

            this.rows.add(this.scene.add.text(ROW_X0 + 24, y, def.label, { fontFamily: FONT, fontSize: '21px', color: C.blueText }).setOrigin(0, 0.5))
            this.rows.add(this.scene.add.text(ROW_X0 + 250, y, 'Lv ' + d.level, { fontFamily: FONT, fontSize: '21px', color: C.brown }).setOrigin(0, 0.5))

            // progress bar (recessed track + rounded green fill)
            const bar = this.scene.add.graphics()
            bar.fillStyle(C.track, 1).fillRoundedRect(BAR_X, y - 11, BAR_W, 22, 8)
            bar.lineStyle(2, C.trackLine, 1).strokeRoundedRect(BAR_X, y - 11, BAR_W, 22, 8)
            const w = Math.max(8, BAR_W * (d.progress || 0))
            bar.fillStyle(C.fill, 1).fillRoundedRect(BAR_X, y - 11, w, 22, 8)
            this.rows.add(bar)

            this.rows.add(this.scene.add.text(BAR_X + BAR_W + 22, y, '+' + d.level + '% coins', { fontFamily: FONT, fontSize: '15px', color: C.brown }).setOrigin(0, 0.5))
        })

        const res = args.resources || {}
        const parts = Object.keys(res).filter(k => res[k] > 0).map(k => k + ' x' + res[k])
        this.resText.setText(parts.length ? 'Resources (sell to NPC shops):  ' + parts.join('    ') : 'Play minigames to gather resources and level up!')
    }

    onClose() {
        this.network.events.off('skills', this.onDataBound)
        this.interface.removeWidget(this)
        this.destroy()
    }

}
