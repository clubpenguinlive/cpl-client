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

// Trade-in counter: sellable resources (price is mirrored for display only; the server is the
// authority and re-clamps both price and quantity against actual holdings in Economy.sellResource).
const SELLABLE = [
    { key: 'fish',  label: 'Fish',  price: 8,  color: 0x3aa0e0 },
    { key: 'ore',   label: 'Ore',   price: 10, color: 0x9c7038 },
    { key: 'shell', label: 'Shell', price: 12, color: 0x2fb3a0 },
    { key: 'cargo', label: 'Cargo', price: 6,  color: 0x49c25e }
]
const CHIP_W = 206, CHIP_H = 60, CHIP_GAP = 18, CHIP_Y = 800
const CHIPS_X0 = 760 - (SELLABLE.length * CHIP_W + (SELLABLE.length - 1) * CHIP_GAP) / 2

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

        this.add(scene.add.text(760, 196, 'MY SKILLS', { fontFamily: FONT, fontSize: '44px', color: C.gold, stroke: C.goldStroke, strokeThickness: 9 }).setOrigin(0.5))

        const closeBtn = scene.add.graphics()
        closeBtn.fillStyle(C.redDark, 1).fillCircle(1236, 134, 22).fillStyle(C.red, 1).fillCircle(1236, 132, 20)
        this.add(closeBtn)
        this.add(scene.add.text(1236, 130, '✕', { fontFamily: FONT, fontSize: '22px', color: '#ffffff' }).setOrigin(0.5))
        const closeHit = scene.add.circle(1236, 132, 24).setInteractive({ useHandCursor: true })
        closeHit.on('pointerdown', () => this.onClose())
        this.add(closeHit)

        this.rows = scene.add.container(0, 0)
        this.add(this.rows)

        // trade-in counter header + clickable resource chips
        this.add(scene.add.text(760, 762, 'TRADE-IN COUNTER', { fontFamily: FONT, fontSize: '17px', color: C.blueText }).setOrigin(0.5))
        this.chips = scene.add.container(0, 0)
        this.add(this.chips)
        this.flash = scene.add.text(760, 838, '', { fontFamily: FONT, fontSize: '15px', color: '#2f7a3a', stroke: '#ffffff', strokeThickness: 3 }).setOrigin(0.5)
        this.add(this.flash)

        this.onSoldBound = (args) => this.onSold(args)
        this.network.events.on('skills', this.onDataBound)
        this.network.events.on('resource_sold', this.onSoldBound)
        this.network.send('get_skills', {})
    }

    onData(args) {
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

        this.held = args.resources || {}
        this.renderChips()
    }

    renderChips() {
        this.chips.removeAll(true)

        SELLABLE.forEach((r, i) => {
            const have = this.held[r.key] || 0
            const x = CHIPS_X0 + i * (CHIP_W + CHIP_GAP)
            const sellable = have > 0

            const g = this.scene.add.graphics()
            g.fillStyle(sellable ? C.row : C.track, sellable ? 1 : 0.55).fillRoundedRect(x, CHIP_Y - CHIP_H / 2, CHIP_W, CHIP_H, 10)
            g.lineStyle(2, C.rowLine, 1).strokeRoundedRect(x, CHIP_Y - CHIP_H / 2, CHIP_W, CHIP_H, 10)
            g.fillStyle(r.color, sellable ? 1 : 0.5).fillRoundedRect(x + 8, CHIP_Y - CHIP_H / 2 + 8, 16, CHIP_H - 16, 5)
            this.chips.add(g)

            this.chips.add(this.scene.add.text(x + 36, CHIP_Y - 13, r.label + '  x' + have, { fontFamily: FONT, fontSize: '17px', color: sellable ? C.blueText : '#9a8f73' }).setOrigin(0, 0.5))
            this.chips.add(this.scene.add.text(x + 36, CHIP_Y + 12, sellable ? 'Sell all -> ' + (have * r.price) + 'c' : r.price + 'c each', { fontFamily: FONT, fontSize: '13px', color: sellable ? '#8a5a12' : '#9a8f73' }).setOrigin(0, 0.5))

            if (sellable) {
                const hit = this.scene.add.rectangle(x + CHIP_W / 2, CHIP_Y, CHIP_W, CHIP_H, 0xffffff, 0.001).setInteractive({ useHandCursor: true })
                hit.on('pointerdown', () => this.sell(r.key, have))
                this.chips.add(hit)
            }
        })
    }

    sell(resource, quantity) {
        // server re-validates price + clamps to real holdings; this is just the trigger
        this.network.send('sell_resource', { resource: resource, quantity: quantity })
    }

    onSold(args) {
        this.held[args.resource] = args.remaining
        // reflect the new coin total in the HUD (sell_resource uses updateCoins, which doesn't push)
        this.world.client.coins = args.total
        this.interface.refreshPlayerCard()
        this.renderChips()
        this.flash.setText('Sold ' + args.quantity + ' ' + args.resource + ' for ' + args.coins + ' coins!')
        this.scene.tweens.killTweensOf(this.flash)
        this.flash.setAlpha(1)
        this.scene.tweens.add({ targets: this.flash, alpha: 0, delay: 2200, duration: 600 })
    }

    onClose() {
        this.network.events.off('skills', this.onDataBound)
        this.network.events.off('resource_sold', this.onSoldBound)
        this.interface.removeWidget(this)
        this.destroy()
    }

}
