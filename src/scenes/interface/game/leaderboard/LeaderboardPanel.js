import BaseContainer from '@scenes/base/BaseContainer'


const FONT = 'CCComiccrazy'

const C = {
    binding: 0x1c6bb0, bindingDark: 0x12568f, cream: 0xf7eecf, creamLine: 0xd9c290,
    row: 0xfffaf0, rowHover: 0xfff3d6, rowLine: 0xcdb88a,
    gold: '#ffce3d', goldStroke: '#5a3a12', blueText: '#15568f', brown: '#b8791a',
    red: 0xe6584d, redDark: 0xb83b30, btn: 0x2a7fc4, btnDark: 0x12568f, btnOff: 0x9bb6cc,
    tabActive: 0xf5a800, tabActiveDark: 0xc77f00
}

// Penguin colors from CP color IDs 1-15
const PENGUIN_COLORS = {
    1: 0x3366cc, 2: 0x33cccc, 3: 0x33cc66, 4: 0x993399, 5: 0xff0000,
    6: 0xff9900, 7: 0xffff00, 8: 0x996633, 9: 0xff99ff, 10: 0x000000,
    11: 0xffffff, 12: 0xaa5500, 13: 0xff6633, 14: 0xcc99ff, 15: 0x66ff33
}

const TABS = [
    { key: 'coins',   label: 'Richest',  unit: 'coins' },
    { key: 'stamps',  label: 'Stamps',   unit: 'stamps' },
    { key: 'fishing', label: 'Fisher',   unit: 'XP' },
    { key: 'mining',  label: 'Miner',    unit: 'XP' },
    { key: 'surfing', label: 'Surfer',   unit: 'XP' },
    { key: 'hauling', label: 'Hauler',   unit: 'XP' }
]

const PER_PAGE = 15
const ROW_H = 34
const ROW_X = 290, ROW_W = 940
const ROW_Y0 = 286
const TAB_Y = 244
const TAB_W = 148, TAB_GAP = 8

export default class LeaderboardPanel extends BaseContainer {

    constructor(scene) {
        super(scene, 0, 0)

        this.depth = 100
        this.category = 'coins'
        this.rows = []
        this.page = 0
        this.onDataBound = (args) => this.onData(args)

        const block = scene.add.rectangle(0, 0, 1520, 960, 0x000000, 0.5).setOrigin(0, 0).setInteractive()
        this.add(block)

        const g = scene.add.graphics()
        g.fillStyle(C.bindingDark, 1).fillRoundedRect(230, 96, 1060, 770, 28)
        g.fillStyle(C.binding, 1).fillRoundedRect(240, 104, 1040, 754, 24)
        g.fillStyle(C.cream, 1).fillRoundedRect(274, 150, 972, 678, 16)
        g.lineStyle(3, C.creamLine, 1).strokeRoundedRect(274, 150, 972, 678, 16)
        this.add(g)

        this.add(scene.add.text(760, 196, 'LEADERBOARD', { fontFamily: FONT, fontSize: '44px', color: C.gold, stroke: C.goldStroke, strokeThickness: 9 }).setOrigin(0.5))

        const closeBtn = scene.add.graphics()
        closeBtn.fillStyle(C.redDark, 1).fillCircle(1236, 134, 22).fillStyle(C.red, 1).fillCircle(1236, 132, 20)
        this.add(closeBtn)
        this.add(scene.add.text(1236, 130, '✕', { fontFamily: FONT, fontSize: '22px', color: '#ffffff' }).setOrigin(0.5))
        const closeHit = scene.add.circle(1236, 132, 24).setInteractive({ useHandCursor: true })
        closeHit.on('pointerdown', () => this.onClose())
        this.add(closeHit)

        // Tabs
        const tabTotalW = TABS.length * TAB_W + (TABS.length - 1) * TAB_GAP
        const tabStartX = 760 - tabTotalW / 2 + TAB_W / 2
        this.tabGraphics = []
        TABS.forEach((tab, i) => {
            const x = tabStartX + i * (TAB_W + TAB_GAP)
            const g = scene.add.graphics()
            this.add(g)
            const draw = (active) => {
                g.clear()
                const color = active ? C.tabActive : C.btn
                const colorDark = active ? C.tabActiveDark : C.btnDark
                g.fillStyle(colorDark, 1).fillRoundedRect(x - TAB_W / 2, TAB_Y - 18, TAB_W, 36, 10)
                g.fillStyle(color, 1).fillRoundedRect(x - TAB_W / 2, TAB_Y - 20, TAB_W, 36, 10)
            }
            draw(tab.key === this.category)
            this.tabGraphics.push(draw)
            const txt = scene.add.text(x, TAB_Y - 3, tab.label, { fontFamily: FONT, fontSize: '18px', color: '#ffffff', stroke: '#0e4f8f', strokeThickness: 4 }).setOrigin(0.5)
            this.add(txt)
            const hit = scene.add.rectangle(x, TAB_Y, TAB_W, 36, 0xffffff, 0).setInteractive({ useHandCursor: true })
            hit.on('pointerdown', () => this.switchTab(tab.key))
            this.add(hit)
        })

        this.listContainer = scene.add.container(0, 0)
        this.add(this.listContainer)

        this.loadingText = scene.add.text(760, 520, 'Loading...', { fontFamily: FONT, fontSize: '22px', color: C.blueText }).setOrigin(0.5)
        this.add(this.loadingText)

        this.prevArrow = this.makeArrow(360, 806, '<', () => this.flip(-1))
        this.nextArrow = this.makeArrow(1160, 806, '>', () => this.flip(1))
        this.pageText = scene.add.text(760, 806, '', { fontFamily: FONT, fontSize: '18px', color: C.blueText, stroke: '#ffffff', strokeThickness: 3 }).setOrigin(0.5)
        this.add(this.pageText)

        this.network.events.on('leaderboard', this.onDataBound)
        this.network.send('get_leaderboard', { category: this.category })
    }

    makeArrow(x, y, glyph, cb) {
        const g = this.scene.add.graphics()
        this.add(g)
        const txt = this.scene.add.text(x, y - 2, glyph, { fontFamily: FONT, fontSize: '26px', color: '#ffffff', stroke: '#0e4f8f', strokeThickness: 4 }).setOrigin(0.5)
        this.add(txt)
        const hit = this.scene.add.circle(x, y, 26).setInteractive({ useHandCursor: true })
        hit.on('pointerdown', () => { if (!g.disabled) cb() })
        this.add(hit)
        const draw = (enabled) => { g.disabled = !enabled; g.clear(); g.fillStyle(C.btnDark, 1).fillCircle(x, y + 2, 24); g.fillStyle(enabled ? C.btn : C.btnOff, 1).fillCircle(x, y, 22); txt.setAlpha(enabled ? 1 : 0.5) }
        draw(false)
        return { draw }
    }

    switchTab(category) {
        if (category === this.category) return
        this.category = category
        this.page = 0
        this.rows = []

        TABS.forEach((tab, i) => this.tabGraphics[i](tab.key === category))

        if (this.loadingText) this.loadingText.setVisible(true)
        this.listContainer.removeAll(true)
        this.pageText.setText('')
        this.prevArrow.draw(false)
        this.nextArrow.draw(false)

        this.network.send('get_leaderboard', { category })
    }

    onData(args) {
        if (args.category !== this.category) return
        if (this.loadingText) { this.loadingText.setVisible(false) }
        this.rows = args.rows || []
        this.page = 0
        this.renderRows()
    }

    renderRows() {
        this.listContainer.removeAll(true)

        const myId = this.world && this.world.client ? this.world.client.id : null
        const allRows = this.rows
        const pages = Math.max(1, Math.ceil(allRows.length / PER_PAGE))
        const slice = allRows.slice(this.page * PER_PAGE, this.page * PER_PAGE + PER_PAGE)
        const unit = (TABS.find(t => t.key === this.category) || {}).unit || ''

        if (slice.length === 0) {
            this.listContainer.add(
                this.scene.add.text(760, 520, 'No data yet', { fontFamily: FONT, fontSize: '22px', color: C.blueText }).setOrigin(0.5)
            )
        }

        slice.forEach((row, i) => {
            const rank = this.page * PER_PAGE + i + 1
            const y = ROW_Y0 + i * ROW_H
            const isMe = row.id === myId

            const card = this.scene.add.graphics()
            const paint = (hover) => {
                card.clear()
                const fill = isMe ? (hover ? 0xfff3a0 : 0xfffad0) : (hover ? C.rowHover : C.row)
                card.fillStyle(fill, 1).fillRoundedRect(ROW_X, y - ROW_H / 2 + 2, ROW_W, ROW_H - 4, 8)
                card.lineStyle(hover ? 2 : 1, hover ? 0xf5a800 : C.rowLine, 1).strokeRoundedRect(ROW_X, y - ROW_H / 2 + 2, ROW_W, ROW_H - 4, 8)
            }
            paint(false)
            this.listContainer.add(card)

            // Rank
            const rankColor = rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : C.blueText
            this.listContainer.add(
                this.scene.add.text(ROW_X + 36, y, '#' + rank, { fontFamily: FONT, fontSize: '15px', color: rankColor, stroke: '#ffffff', strokeThickness: 2 }).setOrigin(0.5)
            )

            // Color dot
            const penguinColor = PENGUIN_COLORS[row.color] || 0x3366cc
            const dot = this.scene.add.graphics()
            dot.fillStyle(0x000000, 0.2).fillCircle(ROW_X + 68, y + 1, 12)
            dot.fillStyle(penguinColor, 1).fillCircle(ROW_X + 68, y - 1, 11)
            this.listContainer.add(dot)

            // Username
            const nameStyle = { fontFamily: FONT, fontSize: '16px', color: isMe ? '#1a8f2a' : C.blueText }
            this.listContainer.add(
                this.scene.add.text(ROW_X + 90, y, row.username, nameStyle).setOrigin(0, 0.5)
            )

            // Value
            const val = parseInt(row.value) || 0
            const valStr = val.toLocaleString() + ' ' + unit
            this.listContainer.add(
                this.scene.add.text(ROW_X + ROW_W - 16, y, valStr, { fontFamily: FONT, fontSize: '15px', color: C.brown, stroke: '#ffffff', strokeThickness: 2 }).setOrigin(1, 0.5)
            )

            const hit = this.scene.add.rectangle(ROW_X + ROW_W / 2, y, ROW_W, ROW_H - 4, 0xffffff, 0).setInteractive({ useHandCursor: true })
            hit.on('pointerover', () => paint(true))
            hit.on('pointerout', () => paint(false))
            this.listContainer.add(hit)
        })

        this.pageText.setText('Page ' + (this.page + 1) + ' / ' + pages)
        this.prevArrow.draw(this.page > 0)
        this.nextArrow.draw(this.page < pages - 1)
    }

    flip(dir) {
        const pages = Math.max(1, Math.ceil(this.rows.length / PER_PAGE))
        this.page = Math.max(0, Math.min(pages - 1, this.page + dir))
        this.renderRows()
    }

    onClose() {
        this.network.events.off('leaderboard', this.onDataBound)
        this.interface.removeWidget(this)
        this.destroy()
    }

}
