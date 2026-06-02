import BaseContainer from '@scenes/base/BaseContainer'


// "My Skills" panel, styled to match the CP catalog book (cream page, blue binding, gold
// CCComiccrazy header). Each skill is visually distinct (color chip + its own effect phrase),
// shows level, an XP progress bar, and its current bonus. Server is the source of truth.

const FONT = 'CCComiccrazy'

// key, label, chip color, distinct effect phrase, whether it gathers a resource
const SKILLS = [
    { key: 'fishing',    label: 'Fishing',    color: 0x3aa0e0, effect: 'Bigger catches',  res: 'fish' },
    { key: 'mining',     label: 'Mining',     color: 0x9c7038, effect: 'Richer veins',    res: 'ore' },
    { key: 'surfing',    label: 'Surfing',    color: 0x2fb3a0, effect: 'Bigger waves',    res: 'shell' },
    { key: 'cooking',    label: 'Cooking',    color: 0xe07a2a, effect: 'Faster service',  res: null },
    { key: 'hauling',    label: 'Hauling',    color: 0x49c25e, effect: 'Stronger arms',   res: 'cargo' },
    { key: 'performing', label: 'Performing', color: 0x9a5cc0, effect: 'Bigger crowds',   res: null },
    { key: 'agent',      label: 'Agent',      color: 0x444b55, effect: 'Sharper senses',  res: null }
]

const C = {
    binding: 0x1c6bb0, bindingDark: 0x12568f, cream: 0xf7eecf, creamLine: 0xd9c290,
    row: 0xfffaf0, rowLine: 0xcdb88a, track: 0xe2d6b0, trackLine: 0xc9b487,
    fill: 0x49c25e, gold: '#ffce3d', goldStroke: '#5a3a12', blueText: '#15568f',
    brown: '#8a5a12', red: 0xe6584d, redDark: 0xb83b30
}

const PAGE_L = 274, PAGE_R = 1246
const ROW_Y0 = 296, ROW_H = 64
const CARD_X = 300, CARD_W = 920
const NAME_X = CARD_X + 54
const LV_X = CARD_X + 250
const BAR_X = CARD_X + 360, BAR_W = 320
const BUFF_X = BAR_X + BAR_W + 24

export default class SkillsWidget extends BaseContainer {

    constructor(scene) {
        super(scene, 0, 0)

        this.depth = 100
        this.onDataBound = (args) => this.onData(args)

        const block = scene.add.rectangle(0, 0, 1520, 960, 0x000000, 0.5).setOrigin(0, 0).setInteractive()
        this.add(block)

        const g = scene.add.graphics()
        g.fillStyle(C.bindingDark, 1).fillRoundedRect(230, 96, 1060, 770, 28)
        g.fillStyle(C.binding, 1).fillRoundedRect(240, 104, 1040, 754, 24)
        g.fillStyle(C.cream, 1).fillRoundedRect(PAGE_L, 150, PAGE_R - PAGE_L, 678, 16)
        g.lineStyle(3, C.creamLine, 1).strokeRoundedRect(PAGE_L, 150, PAGE_R - PAGE_L, 678, 16)
        this.add(g)

        this.add(scene.add.text(760, 138, 'MY SKILLS', { fontFamily: FONT, fontSize: '46px', color: C.gold, stroke: C.goldStroke, strokeThickness: 9 }).setOrigin(0.5))
        this.totalText = scene.add.text(760, 192, '', { fontFamily: FONT, fontSize: '18px', color: C.blueText, stroke: '#ffffff', strokeThickness: 3 }).setOrigin(0.5)
        this.add(this.totalText)

        const closeBtn = scene.add.graphics()
        closeBtn.fillStyle(C.redDark, 1).fillCircle(1236, 134, 22).fillStyle(C.red, 1).fillCircle(1236, 132, 20)
        this.add(closeBtn)
        this.add(scene.add.text(1236, 130, '✕', { fontFamily: FONT, fontSize: '22px', color: '#ffffff' }).setOrigin(0.5))
        const closeHit = scene.add.circle(1236, 132, 24).setInteractive({ useHandCursor: true })
        closeHit.on('pointerdown', () => this.onClose())
        this.add(closeHit)

        this.rows = scene.add.container(0, 0)
        this.add(this.rows)
        this.resText = scene.add.text(760, 802, '', { fontFamily: FONT, fontSize: '14px', color: C.brown, stroke: '#ffffff', strokeThickness: 3 }).setOrigin(0.5)
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

            const card = this.scene.add.graphics()
            card.fillStyle(C.row, 1).fillRoundedRect(CARD_X, y - 26, CARD_W, 52, 10)
            card.lineStyle(2, C.rowLine, 1).strokeRoundedRect(CARD_X, y - 26, CARD_W, 52, 10)
            // distinct color chip
            card.fillStyle(def.color, 1).fillRoundedRect(CARD_X + 16, y - 14, 26, 28, 6)
            this.rows.add(card)

            this.rows.add(this.scene.add.text(NAME_X, y, def.label, { fontFamily: FONT, fontSize: '20px', color: C.blueText }).setOrigin(0, 0.5))
            this.rows.add(this.scene.add.text(LV_X, y, 'Lv ' + d.level, { fontFamily: FONT, fontSize: '20px', color: C.brown }).setOrigin(0, 0.5))

            // progress bar
            const bar = this.scene.add.graphics()
            bar.fillStyle(C.track, 1).fillRoundedRect(BAR_X, y - 10, BAR_W, 20, 7)
            const w = Math.max(7, BAR_W * (d.progress || 0))
            bar.fillStyle(def.color, 1).fillRoundedRect(BAR_X, y - 10, w, 20, 7)
            bar.lineStyle(2, C.trackLine, 1).strokeRoundedRect(BAR_X, y - 10, BAR_W, 20, 7)
            this.rows.add(bar)

            // distinct buff: effect phrase + the level-scaled bonus (real: +1%/lvl reward, +2%/lvl gather)
            const bonus = def.res ? '+' + (d.level * 2) + '% ' + def.res : '+' + d.level + '% coins'
            this.rows.add(this.scene.add.text(BUFF_X, y - 9, def.effect, { fontFamily: FONT, fontSize: '13px', color: '#3a6a3a' }).setOrigin(0, 0.5))
            this.rows.add(this.scene.add.text(BUFF_X, y + 9, bonus, { fontFamily: FONT, fontSize: '13px', color: C.brown }).setOrigin(0, 0.5))
        })

        const res = args.resources || {}
        const parts = Object.keys(res).filter(k => res[k] > 0).map(k => k + ' x' + res[k])
        this.resText.setText(parts.length ? 'Resources (sell to NPC shops):  ' + parts.join('    ') : 'Play minigames to gather resources and level up your skills!')
    }

    onClose() {
        this.network.events.off('skills', this.onDataBound)
        this.interface.removeWidget(this)
        this.destroy()
    }

}
