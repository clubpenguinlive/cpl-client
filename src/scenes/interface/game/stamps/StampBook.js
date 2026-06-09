import BaseContainer from '@scenes/base/BaseContainer'


// Stamp Book — catalog-book chrome (like SkillsWidget/ChallengesPanel). Group tabs across the top;
// each page shows that group's stamps as earned (gold) or locked (grey) with an earned count. Defs +
// the user's owned set come from the server (`get_stamps` -> `stamps`); the server is the authority.
// Name-based v1 (no stamp icon art yet).

const FONT = 'CCComiccrazy'

const C = {
    binding: 0x1c6bb0, bindingDark: 0x12568f, cream: 0xf7eecf, creamLine: 0xd9c290,
    earned: 0xffe9a8, earnedLine: 0xe0b94a, locked: 0xe7ded0, lockedLine: 0xcdbf9f,
    gold: '#ffce3d', goldStroke: '#5a3a12', blueText: '#15568f', brown: '#8a5a12', grey: '#9a8f73',
    tab: 0xe2d6b0, tabActive: 0xf7eecf, tabLine: 0xc9b487, red: 0xe6584d, redDark: 0xb83b30
}

const GRID_X = 300, GRID_Y0 = 360, COLS = 3, CELL_W = 300, CELL_H = 78, COL_GAP = 12, ROW_GAP = 12

export default class StampBook extends BaseContainer {

    constructor(scene) {
        super(scene, 0, 0)

        this.depth = 100
        this.defs = {}
        this.owned = new Set()
        this.groups = []
        this.activeGroup = null

        const block = scene.add.rectangle(0, 0, 1520, 960, 0x000000, 0.5).setOrigin(0, 0).setInteractive()
        this.add(block)

        const g = scene.add.graphics()
        g.fillStyle(C.bindingDark, 1).fillRoundedRect(230, 96, 1060, 770, 28)
        g.fillStyle(C.binding, 1).fillRoundedRect(240, 104, 1040, 754, 24)
        g.fillStyle(C.cream, 1).fillRoundedRect(274, 150, 972, 678, 16)
        g.lineStyle(3, C.creamLine, 1).strokeRoundedRect(274, 150, 972, 678, 16)
        this.add(g)

        this.add(scene.add.text(760, 196, 'STAMP BOOK', { fontFamily: FONT, fontSize: '44px', color: C.gold, stroke: C.goldStroke, strokeThickness: 9 }).setOrigin(0.5))
        this.count = scene.add.text(760, 244, '', { fontFamily: FONT, fontSize: '17px', color: C.blueText }).setOrigin(0.5)
        this.add(this.count)

        const closeBtn = scene.add.graphics()
        closeBtn.fillStyle(C.redDark, 1).fillCircle(1236, 134, 22).fillStyle(C.red, 1).fillCircle(1236, 132, 20)
        this.add(closeBtn)
        this.add(scene.add.text(1236, 130, '✕', { fontFamily: FONT, fontSize: '22px', color: '#ffffff' }).setOrigin(0.5))
        const closeHit = scene.add.circle(1236, 132, 24).setInteractive({ useHandCursor: true })
        closeHit.on('pointerdown', () => this.onClose())
        this.add(closeHit)

        this.tabs = scene.add.container(0, 0)
        this.add(this.tabs)
        this.grid = scene.add.container(0, 0)
        this.add(this.grid)

        this.onDataBound = (args) => this.onData(args)
        this.network.events.on('stamps', this.onDataBound)
        this.network.send('get_stamps', {})
    }

    onData(args) {
        this.defs = args.definitions || {}
        this.owned = new Set((args.owned || []).map(Number))

        // group the definitions, preserving first-seen group order
        const byGroup = {}
        this.groups = []
        for (const id of Object.keys(this.defs)) {
            const group = this.defs[id].group || 'Other'
            if (!byGroup[group]) { byGroup[group] = []; this.groups.push(group) }
            byGroup[group].push(Number(id))
        }
        this.byGroup = byGroup
        this.activeGroup = this.activeGroup && byGroup[this.activeGroup] ? this.activeGroup : this.groups[0]

        this.renderTabs()
        this.renderGrid()
    }

    renderTabs() {
        this.tabs.removeAll(true)
        const tabW = 174, gap = 10
        const totalW = this.groups.length * tabW + (this.groups.length - 1) * gap
        let x = 760 - totalW / 2

        this.groups.forEach(group => {
            const active = group === this.activeGroup
            const g = this.scene.add.graphics()
            g.fillStyle(active ? C.tabActive : C.tab, 1).fillRoundedRect(x, 280, tabW, 40, 10)
            g.lineStyle(2, C.tabLine, 1).strokeRoundedRect(x, 280, tabW, 40, 10)
            this.tabs.add(g)
            this.tabs.add(this.scene.add.text(x + tabW / 2, 300, group, { fontFamily: FONT, fontSize: '16px', color: active ? C.blueText : C.grey }).setOrigin(0.5))
            const hit = this.scene.add.rectangle(x + tabW / 2, 300, tabW, 40, 0xffffff, 0.001).setInteractive({ useHandCursor: true })
            hit.on('pointerdown', () => { this.activeGroup = group; this.renderTabs(); this.renderGrid() })
            this.tabs.add(hit)
            x += tabW + gap
        })
    }

    renderGrid() {
        this.grid.removeAll(true)
        const ids = this.byGroup[this.activeGroup] || []
        let earnedCount = 0

        ids.forEach((id, i) => {
            const def = this.defs[id]
            const owned = this.owned.has(id)
            if (owned) earnedCount++

            const col = i % COLS, row = Math.floor(i / COLS)
            const x = GRID_X + col * (CELL_W + COL_GAP)
            const y = GRID_Y0 + row * (CELL_H + ROW_GAP)

            const g = this.scene.add.graphics()
            g.fillStyle(owned ? C.earned : C.locked, 1).fillRoundedRect(x, y, CELL_W, CELL_H, 10)
            g.lineStyle(2, owned ? C.earnedLine : C.lockedLine, 1).strokeRoundedRect(x, y, CELL_W, CELL_H, 10)
            // medallion
            g.fillStyle(owned ? 0xffce3d : 0xc8bda3, 1).fillCircle(x + 38, y + CELL_H / 2, 22)
            if (owned) {
                g.lineStyle(5, 0xffffff, 1).beginPath()
                g.moveTo(x + 28, y + CELL_H / 2); g.lineTo(x + 36, y + CELL_H / 2 + 9); g.lineTo(x + 50, y + CELL_H / 2 - 10); g.strokePath()
            }
            this.grid.add(g)

            this.grid.add(this.scene.add.text(x + 72, y + 26, def.name, { fontFamily: FONT, fontSize: '17px', color: owned ? C.blueText : '#9a8f73' }).setOrigin(0, 0.5))
            this.grid.add(this.scene.add.text(x + 72, y + 52, owned ? 'Earned' : 'Locked', { fontFamily: FONT, fontSize: '13px', color: owned ? '#2f8f43' : '#9a8f73' }).setOrigin(0, 0.5))
        })

        const total = Object.keys(this.defs).length
        const totalOwned = this.owned.size
        this.count.setText(this.activeGroup + ': ' + earnedCount + ' / ' + ids.length + '   •   Total ' + totalOwned + ' / ' + total)
    }

    onClose() {
        this.network.events.off('stamps', this.onDataBound)
        this.interface.removeWidget(this)
        this.destroy()
    }

}
