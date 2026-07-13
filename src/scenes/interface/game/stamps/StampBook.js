import BaseContainer from '@scenes/base/BaseContainer'


// Stamp Book — catalog-book chrome (like SkillsWidget/ChallengesPanel). Group tabs across the top;
// each page shows that group's stamps as earned (gold) or locked (grey) with an earned count. Defs +
// the user's owned set come from the server (`get_stamps` -> `stamps`); the server is the authority.

const FONT = 'CCComiccrazy'

const C = {
    binding: 0x1c6bb0, bindingDark: 0x12568f, cream: 0xf7eecf, creamLine: 0xd9c290,
    earned: 0xffe9a8, earnedLine: 0xe0b94a, locked: 0xe7ded0, lockedLine: 0xcdbf9f,
    gold: '#ffce3d', goldStroke: '#5a3a12', blueText: '#15568f', brown: '#8a5a12', grey: '#9a8f73',
    tab: 0xe2d6b0, tabActive: 0xf7eecf, tabLine: 0xc9b487, red: 0xe6584d, redDark: 0xb83b30
}

// Per-group accent color + simple medallion symbol drawn with Graphics.
const GROUP_STYLE = {
    'Activities':  { accent: 0xe8820a, symbol: 'star'     },
    'Card-Jitsu':  { accent: 0xcc2020, symbol: 'diamond'  },
    'Eco':         { accent: 0x2a9a3a, symbol: 'triangle' },
    'Exploration': { accent: 0x1a6bbf, symbol: 'compass'  },
    'Challenges':  { accent: 0x8820c0, symbol: 'bolt'     },
    'Stamps':      { accent: 0xe06020, symbol: 'mail'     },
    'Social':      { accent: 0xe83060, symbol: 'heart'    },
    'Igloo':       { accent: 0x4070d0, symbol: 'house'    },
    'Missions':    { accent: 0x507030, symbol: 'shield'   },
    'Puffles':     { accent: 0xc030c0, symbol: 'paw'      },
    'Legend':      { accent: 0xc09000, symbol: 'crown'    },
    'Mascots':     { accent: 0x20a0c0, symbol: 'sparkle'  },
}

const GRID_X = 300, GRID_Y0 = 360, COLS = 3, CELL_W = 300, CELL_H = 78, COL_GAP = 12, ROW_GAP = 12
const GRID_ROWS_PER_PAGE = 5   // max rows visible before pagination kicks in (5 rows * 90px = 450px, fits in 468px of cream area)
const STAMPS_PER_PAGE = COLS * GRID_ROWS_PER_PAGE

const TAB_PAGE_SIZE = 6   // how many group tabs to show at once

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

        this.tabPage = 0
        this.gridPage = 0

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
        if (!this.activeGroup || !byGroup[this.activeGroup]) {
            this.activeGroup = this.groups[0]
            this.tabPage = 0
        }
        this.gridPage = 0

        this.renderTabs()
        this.renderGrid()
    }

    renderTabs() {
        this.tabs.removeAll(true)

        // Show TAB_PAGE_SIZE tabs at a time with prev/next arrows so the row fits the modal width.
        // Content area runs x=274 to x=1246 (972px wide). Arrow buttons take 32px each side.
        const tabAreaX = 290, tabAreaW = 940
        const arrowW = 32
        const tabCount = Math.min(TAB_PAGE_SIZE, this.groups.length)
        const usableW = tabAreaW - arrowW * 2
        const tabW = Math.floor((usableW - (tabCount - 1) * 8) / tabCount)
        const gap = 8

        const totalPages = Math.ceil(this.groups.length / TAB_PAGE_SIZE)
        const hasMultiPage = totalPages > 1

        // Keep tabPage in range
        this.tabPage = Math.max(0, Math.min(totalPages - 1, this.tabPage))

        // ensure the active group is visible on the current tab page
        const activeIdx = this.groups.indexOf(this.activeGroup)
        if (activeIdx >= 0) {
            const activePage = Math.floor(activeIdx / TAB_PAGE_SIZE)
            if (activePage !== this.tabPage) this.tabPage = activePage
        }

        const slice = this.groups.slice(this.tabPage * TAB_PAGE_SIZE, this.tabPage * TAB_PAGE_SIZE + TAB_PAGE_SIZE)
        let x = tabAreaX + arrowW + (usableW - (slice.length * tabW + (slice.length - 1) * gap)) / 2

        // Prev arrow
        if (hasMultiPage) {
            const canPrev = this.tabPage > 0
            const ag = this.scene.add.graphics()
            ag.fillStyle(canPrev ? 0x2a7fc4 : 0x9bb6cc, 1).fillCircle(tabAreaX + 14, 300, 14)
            this.tabs.add(ag)
            const atxt = this.scene.add.text(tabAreaX + 14, 298, '<', { fontFamily: FONT, fontSize: '18px', color: '#fff' }).setOrigin(0.5)
            this.tabs.add(atxt)
            if (canPrev) {
                const hit = this.scene.add.circle(tabAreaX + 14, 300, 14, 0xffffff, 0.001).setInteractive({ useHandCursor: true })
                hit.on('pointerdown', () => { this.tabPage--; this.renderTabs() })
                this.tabs.add(hit)
            }

            const canNext = this.tabPage < totalPages - 1
            const bg = this.scene.add.graphics()
            bg.fillStyle(canNext ? 0x2a7fc4 : 0x9bb6cc, 1).fillCircle(tabAreaX + tabAreaW - 14, 300, 14)
            this.tabs.add(bg)
            const btxt = this.scene.add.text(tabAreaX + tabAreaW - 14, 298, '>', { fontFamily: FONT, fontSize: '18px', color: '#fff' }).setOrigin(0.5)
            this.tabs.add(btxt)
            if (canNext) {
                const hit2 = this.scene.add.circle(tabAreaX + tabAreaW - 14, 300, 14, 0xffffff, 0.001).setInteractive({ useHandCursor: true })
                hit2.on('pointerdown', () => { this.tabPage++; this.renderTabs() })
                this.tabs.add(hit2)
            }
        }

        slice.forEach(group => {
            const active = group === this.activeGroup
            const accent = (GROUP_STYLE[group] || {}).accent
            const g = this.scene.add.graphics()
            g.fillStyle(active ? C.tabActive : C.tab, 1).fillRoundedRect(x, 280, tabW, 40, 10)
            g.lineStyle(2, active && accent ? accent : C.tabLine, 1).strokeRoundedRect(x, 280, tabW, 40, 10)
            if (active && accent) {
                g.fillStyle(accent, 1).fillRoundedRect(x, 316, tabW, 4, 2)
            }
            this.tabs.add(g)
            this.tabs.add(this.scene.add.text(x + tabW / 2, 300, group, { fontFamily: FONT, fontSize: '15px', color: active ? C.blueText : C.grey }).setOrigin(0.5))
            const hit = this.scene.add.rectangle(x + tabW / 2, 300, tabW, 40, 0xffffff, 0.001).setInteractive({ useHandCursor: true })
            hit.on('pointerdown', () => { this.activeGroup = group; this.gridPage = 0; this.renderTabs(); this.renderGrid() })
            this.tabs.add(hit)
            x += tabW + gap
        })
    }

    renderGrid() {
        this.grid.removeAll(true)
        const ids = this.byGroup[this.activeGroup] || []
        const style = GROUP_STYLE[this.activeGroup] || {}
        const accent = style.accent || 0xffce3d
        let earnedCount = 0

        // Count total earned for this group before slicing
        for (const id of ids) { if (this.owned.has(id)) earnedCount++ }

        const totalGridPages = Math.max(1, Math.ceil(ids.length / STAMPS_PER_PAGE))
        this.gridPage = Math.max(0, Math.min(totalGridPages - 1, this.gridPage))

        const slice = ids.slice(this.gridPage * STAMPS_PER_PAGE, this.gridPage * STAMPS_PER_PAGE + STAMPS_PER_PAGE)

        slice.forEach((id, i) => {
            const def = this.defs[id]
            const owned = this.owned.has(id)

            const col = i % COLS, row = Math.floor(i / COLS)
            const x = GRID_X + col * (CELL_W + COL_GAP)
            const y = GRID_Y0 + row * (CELL_H + ROW_GAP)

            const g = this.scene.add.graphics()
            g.fillStyle(owned ? C.earned : C.locked, 1).fillRoundedRect(x, y, CELL_W, CELL_H, 10)
            g.lineStyle(2, owned ? C.earnedLine : C.lockedLine, 1).strokeRoundedRect(x, y, CELL_W, CELL_H, 10)
            // accent bar on left edge
            if (owned) g.fillStyle(accent, 1).fillRoundedRect(x, y + 8, 4, CELL_H - 16, 2)
            // medallion circle
            const mColor = owned ? accent : 0xc8bda3
            g.fillStyle(mColor, 1).fillCircle(x + 38, y + CELL_H / 2, 22)
            g.fillStyle(0xffffff, owned ? 0.25 : 0.12).fillCircle(x + 33, y + CELL_H / 2 - 7, 9)
            this.grid.add(g)

            // symbol drawn in medallion
            if (style.symbol) {
                this.drawSymbol(this.grid, style.symbol, x + 38, y + CELL_H / 2, owned ? 0xffffff : 0x9a8f73)
            }

            // Keep the name + status pair tight around the card's vertical centre so the
            // medallion (drawn at y + CELL_H / 2) reads as centred with its labels. Spreading
            // the two lines to the card edges made the icon look low against the name.
            const mid = y + CELL_H / 2
            this.grid.add(this.scene.add.text(x + 72, mid - 9, def.name, { fontFamily: FONT, fontSize: '17px', color: owned ? C.blueText : '#9a8f73' }).setOrigin(0, 0.5))
            this.grid.add(this.scene.add.text(x + 72, mid + 9, owned ? 'Earned' : 'Locked', { fontFamily: FONT, fontSize: '13px', color: owned ? '#2f8f43' : '#9a8f73' }).setOrigin(0, 0.5))
        })

        // Grid pagination controls (prev/next page), shown below the grid
        if (totalGridPages > 1) {
            const CTRL_Y = GRID_Y0 + GRID_ROWS_PER_PAGE * (CELL_H + ROW_GAP) + 10
            const canPrev = this.gridPage > 0
            const canNext = this.gridPage < totalGridPages - 1

            const pgPrev = this.scene.add.graphics()
            pgPrev.fillStyle(canPrev ? 0x2a7fc4 : 0x9bb6cc, 1).fillCircle(360, CTRL_Y, 22)
            this.grid.add(pgPrev)
            this.grid.add(this.scene.add.text(360, CTRL_Y - 2, '<', { fontFamily: FONT, fontSize: '22px', color: '#fff' }).setOrigin(0.5))
            if (canPrev) {
                const h = this.scene.add.circle(360, CTRL_Y, 22, 0xffffff, 0.001).setInteractive({ useHandCursor: true })
                h.on('pointerdown', () => { this.gridPage--; this.renderGrid() })
                this.grid.add(h)
            }

            this.grid.add(this.scene.add.text(760, CTRL_Y - 2, 'Page ' + (this.gridPage + 1) + ' / ' + totalGridPages, { fontFamily: FONT, fontSize: '18px', color: C.blueText }).setOrigin(0.5))

            const pgNext = this.scene.add.graphics()
            pgNext.fillStyle(canNext ? 0x2a7fc4 : 0x9bb6cc, 1).fillCircle(1160, CTRL_Y, 22)
            this.grid.add(pgNext)
            this.grid.add(this.scene.add.text(1160, CTRL_Y - 2, '>', { fontFamily: FONT, fontSize: '22px', color: '#fff' }).setOrigin(0.5))
            if (canNext) {
                const h2 = this.scene.add.circle(1160, CTRL_Y, 22, 0xffffff, 0.001).setInteractive({ useHandCursor: true })
                h2.on('pointerdown', () => { this.gridPage++; this.renderGrid() })
                this.grid.add(h2)
            }
        }

        const total = Object.keys(this.defs).length
        const totalOwned = this.owned.size
        this.count.setText(this.activeGroup + ': ' + earnedCount + ' / ' + ids.length + '   •   Total ' + totalOwned + ' / ' + total)
    }

    // Draw a small symbol at (cx, cy) using Phaser Graphics, added to container.
    drawSymbol(container, symbol, cx, cy, color) {
        const g = this.scene.add.graphics()
        g.fillStyle(color, 1)
        g.lineStyle(2.5, color, 1)

        switch (symbol) {
            case 'star': {
                const pts = this._starPoints(cx, cy, 5, 13, 6)
                g.fillPoints(pts, true)
                break
            }
            case 'diamond': {
                g.fillTriangle(cx, cy - 13, cx + 9, cy, cx, cy + 13)
                g.fillTriangle(cx, cy - 13, cx - 9, cy, cx, cy + 13)
                break
            }
            case 'triangle': {
                g.fillTriangle(cx, cy - 13, cx + 12, cy + 8, cx - 12, cy + 8)
                break
            }
            case 'compass': {
                g.fillRect(cx - 2, cy - 13, 4, 26)
                g.fillRect(cx - 13, cy - 2, 26, 4)
                g.fillStyle(color, 0.5).fillCircle(cx, cy, 5)
                break
            }
            case 'bolt': {
                const bpts = [{ x: cx + 4, y: cy - 13 }, { x: cx - 4, y: cy - 2 }, { x: cx + 3, y: cy - 2 }, { x: cx - 4, y: cy + 13 }, { x: cx + 5, y: cy + 1 }, { x: cx - 2, y: cy + 1 }]
                g.fillPoints(bpts, true)
                break
            }
            case 'mail': {
                g.strokeRect(cx - 12, cy - 8, 24, 17)
                g.beginPath().moveTo(cx - 12, cy - 8).lineTo(cx, cy + 1).lineTo(cx + 12, cy - 8).strokePath()
                break
            }
            case 'heart': {
                g.fillCircle(cx - 6, cy - 5, 7)
                g.fillCircle(cx + 6, cy - 5, 7)
                g.fillTriangle(cx - 13, cy - 2, cx + 13, cy - 2, cx, cy + 13)
                break
            }
            case 'house': {
                g.fillTriangle(cx, cy - 13, cx - 13, cy, cx + 13, cy)
                g.fillRect(cx - 10, cy, 20, 13)
                g.fillStyle(color, 0.4).fillRect(cx - 4, cy + 4, 8, 9)
                break
            }
            case 'shield': {
                const spts = [{ x: cx, y: cy - 13 }, { x: cx + 11, y: cy - 8 }, { x: cx + 11, y: cy + 2 }, { x: cx, y: cy + 13 }, { x: cx - 11, y: cy + 2 }, { x: cx - 11, y: cy - 8 }]
                g.fillPoints(spts, true)
                break
            }
            case 'paw': {
                g.fillCircle(cx, cy + 5, 8)
                g.fillCircle(cx - 9, cy - 2, 4)
                g.fillCircle(cx + 9, cy - 2, 4)
                g.fillCircle(cx, cy - 10, 4)
                break
            }
            case 'crown': {
                const cpts = [{ x: cx - 12, y: cy + 7 }, { x: cx - 12, y: cy - 5 }, { x: cx - 6, y: cy + 2 }, { x: cx, y: cy - 13 }, { x: cx + 6, y: cy + 2 }, { x: cx + 12, y: cy - 5 }, { x: cx + 12, y: cy + 7 }]
                g.fillPoints(cpts, true)
                break
            }
            case 'sparkle': {
                const spts2 = this._starPoints(cx, cy, 4, 13, 4)
                g.fillPoints(spts2, true)
                break
            }
        }
        container.add(g)
    }

    _starPoints(cx, cy, points, outer, inner) {
        const pts = []
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points - Math.PI / 2
            const r = i % 2 === 0 ? outer : inner
            pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r })
        }
        return pts
    }

    onClose() {
        this.network.events.off('stamps', this.onDataBound)
        this.interface.removeWidget(this)
        this.destroy()
    }

}
