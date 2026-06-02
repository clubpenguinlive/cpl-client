import BaseContainer from '@scenes/base/BaseContainer'


// Dynamic Penguin Style catalog. Data-driven (server weekly rotation) but styled to match the
// classic CP catalog book: cream rounded pages, blue binding, the gold outlined CCComiccrazy
// "PENGUIN STYLE" header, CP-styled item cards + buttons. Buying reuses the server-validated
// item prompt. (CP's real catalog is hand-painted page-art; this keeps that look while letting
// the items rotate automatically.)

const THUMB_PATH = '/assets/media/clothing/paper/'
const FONT = 'CCComiccrazy'
const COLS = 7
const CELL_W = 150
const CELL_H = 106
const GRID_X = 760 - (COLS * CELL_W) / 2 + CELL_W / 2
const GRID_Y = 322

// palette (sampled from the CP Penguin Style catalog)
const C = {
    binding: 0x1c6bb0, bindingDark: 0x12568f, cream: 0xf7eecf, creamLine: 0xd9c290,
    card: 0xfffaf0, cardLine: 0xcdb88a, gold: '#ffce3d', goldStroke: '#5a3a12',
    blueText: '#15568f', darkText: '#4a3a1a', red: 0xe6584d, redDark: 0xb83b30
}

export default class DailyCatalog extends BaseContainer {

    constructor(scene) {
        super(scene, 0, 0)

        this.depth = 100
        this.tab = 'today'
        this.todayItems = []
        this.classics = []
        this.countdown = 0
        this.onDataBound = (args) => this.onData(args)

        const block = scene.add.rectangle(0, 0, 1520, 960, 0x000000, 0.5).setOrigin(0, 0).setInteractive()
        this.add(block)

        // book: blue binding + cream page (rounded)
        const g = scene.add.graphics()
        g.fillStyle(C.bindingDark, 1).fillRoundedRect(170, 96, 1180, 770, 28)
        g.fillStyle(C.binding, 1).fillRoundedRect(180, 104, 1160, 754, 24)
        g.fillStyle(C.cream, 1).fillRoundedRect(214, 150, 1092, 678, 16)
        g.lineStyle(3, C.creamLine, 1).strokeRoundedRect(214, 150, 1092, 678, 16)
        this.add(g)

        // gold outlined "PENGUIN STYLE" header (CCComiccrazy, like the real catalog brand)
        this.titleText = scene.add.text(760, 138, 'PENGUIN STYLE', { fontFamily: FONT, fontSize: '46px', color: C.gold, stroke: C.goldStroke, strokeThickness: 9 }).setOrigin(0.5)
        this.add(this.titleText)
        this.dateText = scene.add.text(760, 188, '', { fontFamily: FONT, fontSize: '17px', color: C.blueText, stroke: '#ffffff', strokeThickness: 3 }).setOrigin(0.5)
        this.add(this.dateText)
        this.countdownText = scene.add.text(760, 210, '', { fontFamily: FONT, fontSize: '14px', color: '#b8791a', stroke: '#ffffff', strokeThickness: 3 }).setOrigin(0.5)
        this.add(this.countdownText)

        // coins pill + close
        this.coinsText = scene.add.text(1250, 132, '', { fontFamily: FONT, fontSize: '22px', color: C.gold, stroke: C.goldStroke, strokeThickness: 6 }).setOrigin(1, 0.5)
        this.add(this.coinsText)
        const closeBtn = scene.add.graphics()
        closeBtn.fillStyle(C.redDark, 1).fillCircle(1296, 134, 22).fillStyle(C.red, 1).fillCircle(1296, 132, 20)
        this.add(closeBtn)
        const closeX = scene.add.text(1296, 130, '✕', { fontFamily: FONT, fontSize: '22px', color: '#ffffff' }).setOrigin(0.5)
        closeX.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.onClose())
        this.add(closeX)
        const closeHit = scene.add.circle(1296, 132, 24).setInteractive({ useHandCursor: true })
        closeHit.on('pointerdown', () => this.onClose())
        this.add(closeHit)

        // tabs
        this.todayTab = this.makeTab(600, 262, 'This Week')
        this.todayTab.bg.on('pointerdown', () => this.setTab('today'))
        this.classicsTab = this.makeTab(900, 262, 'Classics')
        this.classicsTab.bg.on('pointerdown', () => this.setTab('classics'))

        this.grid = scene.add.container(0, 0)
        this.add(this.grid)
        this.loadingText = scene.add.text(760, 480, 'Loading...', { fontFamily: FONT, fontSize: '22px', color: C.blueText }).setOrigin(0.5)
        this.add(this.loadingText)

        this.updateCoins()
        this.network.events.on('daily_catalog', this.onDataBound)
        this.network.send('get_daily_catalog', {})
        this.tick = scene.time.addEvent({ delay: 1000, loop: true, callback: () => this.updateCountdown() })
    }

    makeTab(x, y, label) {
        const g = this.scene.add.graphics()
        const draw = (active) => { g.clear(); g.fillStyle(active ? 0xf5a800 : 0x2a7fc4, 1).fillRoundedRect(x - 120, y - 24, 240, 48, 12); g.lineStyle(3, active ? 0xc77f00 : 0x12568f, 1).strokeRoundedRect(x - 120, y - 24, 240, 48, 12) }
        draw(false)
        this.add(g)
        const txt = this.scene.add.text(x, y - 1, label, { fontFamily: FONT, fontSize: '20px', color: '#ffffff', stroke: '#0e4f8f', strokeThickness: 4 }).setOrigin(0.5)
        this.add(txt)
        const hit = this.scene.add.rectangle(x, y, 240, 48, 0xffffff, 0).setInteractive({ useHandCursor: true })
        this.add(hit)
        return { bg: hit, draw }
    }

    setTab(tab) {
        this.tab = tab
        this.todayTab.draw(tab === 'today')
        this.classicsTab.draw(tab === 'classics')
        this.renderGrid()
    }

    onData(args) {
        this.todayItems = args.items || []
        this.classics = args.classics || []
        this.countdown = args.secondsUntilNext || 0
        this.dateText.setText('New styles every Monday' + (args.week ? '   ·   week ' + args.week : ''))
        this.setTab('today')
        this.loadThumbsAndRender()
    }

    activeIds() { return this.tab === 'today' ? this.todayItems : this.classics }

    loadThumbsAndRender() {
        const ids = [...new Set([...this.todayItems, ...this.classics])]
        const toLoad = ids.filter(id => !this.scene.textures.exists('dc' + id))
        if (toLoad.length === 0) { this.renderGrid(); return }
        toLoad.forEach(id => this.scene.load.image('dc' + id, THUMB_PATH + id + '.png'))
        this.scene.load.once('complete', () => this.renderGrid())
        this.scene.load.start()
    }

    renderGrid() {
        if (this.loadingText) { this.loadingText.destroy(); this.loadingText = null }
        this.grid.removeAll(true)
        const ids = this.activeIds()
        const items = this.crumbs.items

        ids.forEach((id, i) => {
            const col = i % COLS
            const row = Math.floor(i / COLS)
            const x = GRID_X + col * CELL_W
            const y = GRID_Y + row * CELL_H
            const item = items[id] || {}

            const card = this.scene.add.graphics()
            card.fillStyle(C.card, 1).fillRoundedRect(x - CELL_W / 2 + 8, y - CELL_H / 2 + 6, CELL_W - 16, CELL_H - 12, 10)
            card.lineStyle(2, C.cardLine, 1).strokeRoundedRect(x - CELL_W / 2 + 8, y - CELL_H / 2 + 6, CELL_W - 16, CELL_H - 12, 10)
            this.grid.add(card)

            if (this.scene.textures.exists('dc' + id)) {
                const thumb = this.scene.add.image(x, y - 14, 'dc' + id)
                const scale = Math.min((CELL_W - 46) / thumb.width, (CELL_H - 60) / thumb.height, 1)
                thumb.setScale(scale)
                this.grid.add(thumb)
            }

            const price = this.scene.add.text(x, y + CELL_H / 2 - 20, (item.cost || 0) + '', { fontFamily: FONT, fontSize: '16px', color: '#b8791a', stroke: '#ffffff', strokeThickness: 3 }).setOrigin(0.5)
            this.grid.add(price)

            const hit = this.scene.add.rectangle(x, y, CELL_W - 16, CELL_H - 12, 0xffffff, 0).setInteractive({ useHandCursor: true })
            hit.on('pointerover', () => { card.clear(); card.fillStyle(0xfff3d6, 1).fillRoundedRect(x - CELL_W / 2 + 8, y - CELL_H / 2 + 6, CELL_W - 16, CELL_H - 12, 10); card.lineStyle(3, 0xf5a800, 1).strokeRoundedRect(x - CELL_W / 2 + 8, y - CELL_H / 2 + 6, CELL_W - 16, CELL_H - 12, 10) })
            hit.on('pointerout', () => { card.clear(); card.fillStyle(C.card, 1).fillRoundedRect(x - CELL_W / 2 + 8, y - CELL_H / 2 + 6, CELL_W - 16, CELL_H - 12, 10); card.lineStyle(2, C.cardLine, 1).strokeRoundedRect(x - CELL_W / 2 + 8, y - CELL_H / 2 + 6, CELL_W - 16, CELL_H - 12, 10) })
            hit.on('pointerdown', () => this.onBuy(id))
            this.grid.add(hit)
        })
    }

    onBuy(id) { this.interface.prompt.showItem(id) }

    updateCoins() {
        const coins = this.world && this.world.client ? this.world.client.coins : null
        this.coinsText.setText((coins != null ? coins : '') + '')
    }

    updateCountdown() {
        if (this.countdown <= 0) return
        this.countdown--
        const d = Math.floor(this.countdown / 86400)
        const h = Math.floor((this.countdown % 86400) / 3600)
        const m = Math.floor((this.countdown % 3600) / 60)
        this.countdownText.setText('Next drop in ' + d + 'd ' + h + 'h ' + m + 'm')
    }

    onClose() {
        this.network.events.off('daily_catalog', this.onDataBound)
        if (this.tick) this.tick.remove()
        this.interface.removeWidget(this)
        this.destroy()
    }

}
