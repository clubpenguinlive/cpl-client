import BaseContainer from '@scenes/base/BaseContainer'


// Dynamic Penguin Style catalog, styled + paginated to match the classic CP catalog book:
// cream rounded pages, blue binding, gold outlined CCComiccrazy header, CP item cards, and
// page-flip navigation (12 larger items per spread). Data-driven (server weekly rotation);
// buying reuses the server-validated item prompt.

const THUMB_PATH = '/assets/media/clothing/paper/'
const FONT = 'CCComiccrazy'
const COLS = 4
const ROWS = 3
const PER_PAGE = COLS * ROWS
const CELL_W = 250
const CELL_H = 152
const GRID_X = 760 - (COLS * CELL_W) / 2 + CELL_W / 2
const GRID_Y = 348

const C = {
    binding: 0x1c6bb0, bindingDark: 0x12568f, cream: 0xf7eecf, creamLine: 0xd9c290,
    card: 0xfffaf0, cardHover: 0xfff3d6, cardLine: 0xcdb88a,
    gold: '#ffce3d', goldStroke: '#5a3a12', blueText: '#15568f', brown: '#b8791a',
    red: 0xe6584d, redDark: 0xb83b30, btn: 0x2a7fc4, btnDark: 0x12568f, btnOff: 0x9bb6cc
}

export default class DailyCatalog extends BaseContainer {

    constructor(scene) {
        super(scene, 0, 0)

        this.depth = 100
        this.tab = 'today'
        this.page = 0
        this.todayItems = []
        this.classics = []
        this.countdown = 0
        this.bboxCache = {}
        this.onDataBound = (args) => this.onData(args)

        const block = scene.add.rectangle(0, 0, 1520, 960, 0x000000, 0.5).setOrigin(0, 0).setInteractive()
        this.add(block)

        const g = scene.add.graphics()
        g.fillStyle(C.bindingDark, 1).fillRoundedRect(170, 96, 1180, 770, 28)
        g.fillStyle(C.binding, 1).fillRoundedRect(180, 104, 1160, 754, 24)
        g.fillStyle(C.cream, 1).fillRoundedRect(214, 150, 1092, 678, 16)
        g.lineStyle(3, C.creamLine, 1).strokeRoundedRect(214, 150, 1092, 678, 16)
        this.add(g)

        this.titleText = scene.add.text(760, 138, 'PENGUIN STYLE', { fontFamily: FONT, fontSize: '46px', color: C.gold, stroke: C.goldStroke, strokeThickness: 9 }).setOrigin(0.5)
        this.add(this.titleText)
        this.dateText = scene.add.text(760, 188, '', { fontFamily: FONT, fontSize: '17px', color: C.blueText, stroke: '#ffffff', strokeThickness: 3 }).setOrigin(0.5)
        this.add(this.dateText)
        this.countdownText = scene.add.text(760, 210, '', { fontFamily: FONT, fontSize: '14px', color: C.brown, stroke: '#ffffff', strokeThickness: 3 }).setOrigin(0.5)
        this.add(this.countdownText)

        this.coinsText = scene.add.text(1250, 132, '', { fontFamily: FONT, fontSize: '22px', color: C.gold, stroke: C.goldStroke, strokeThickness: 6 }).setOrigin(1, 0.5)
        this.add(this.coinsText)
        const closeBtn = scene.add.graphics()
        closeBtn.fillStyle(C.redDark, 1).fillCircle(1296, 134, 22).fillStyle(C.red, 1).fillCircle(1296, 132, 20)
        this.add(closeBtn)
        this.add(scene.add.text(1296, 130, '✕', { fontFamily: FONT, fontSize: '22px', color: '#ffffff' }).setOrigin(0.5))
        const closeHit = scene.add.circle(1296, 132, 24).setInteractive({ useHandCursor: true })
        closeHit.on('pointerdown', () => this.onClose())
        this.add(closeHit)

        this.todayTab = this.makeTab(600, 262, 'This Week')
        this.todayTab.bg.on('pointerdown', () => this.setTab('today'))
        this.classicsTab = this.makeTab(900, 262, 'Classics')
        this.classicsTab.bg.on('pointerdown', () => this.setTab('classics'))

        this.grid = scene.add.container(0, 0)
        this.add(this.grid)

        // page navigation
        this.prevArrow = this.makeArrow(360, 798, '<', () => this.flip(-1))
        this.nextArrow = this.makeArrow(1160, 798, '>', () => this.flip(1))
        this.pageText = scene.add.text(760, 798, '', { fontFamily: FONT, fontSize: '18px', color: C.blueText, stroke: '#ffffff', strokeThickness: 3 }).setOrigin(0.5)
        this.add(this.pageText)

        this.loadingText = scene.add.text(760, 480, 'Loading...', { fontFamily: FONT, fontSize: '22px', color: C.blueText }).setOrigin(0.5)
        this.add(this.loadingText)

        this.updateCoins()
        this.network.events.on('daily_catalog', this.onDataBound)
        this.network.send('get_daily_catalog', {})
        this.tick = scene.time.addEvent({ delay: 1000, loop: true, callback: () => this.updateCountdown() })
    }

    makeTab(x, y, label) {
        const g = this.scene.add.graphics()
        const draw = (active) => { g.clear(); g.fillStyle(active ? 0xf5a800 : C.btn, 1).fillRoundedRect(x - 120, y - 24, 240, 48, 12); g.lineStyle(3, active ? 0xc77f00 : C.btnDark, 1).strokeRoundedRect(x - 120, y - 24, 240, 48, 12) }
        draw(false)
        this.add(g)
        this.add(this.scene.add.text(x, y - 1, label, { fontFamily: FONT, fontSize: '20px', color: '#ffffff', stroke: '#0e4f8f', strokeThickness: 4 }).setOrigin(0.5))
        const hit = this.scene.add.rectangle(x, y, 240, 48, 0xffffff, 0).setInteractive({ useHandCursor: true })
        this.add(hit)
        return { bg: hit, draw }
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
        draw(true)
        return { draw }
    }

    setTab(tab) {
        this.tab = tab
        this.page = 0
        this.todayTab.draw(tab === 'today')
        this.classicsTab.draw(tab === 'classics')
        this.renderGrid()
    }

    flip(dir) {
        const pages = Math.max(1, Math.ceil(this.activeIds().length / PER_PAGE))
        this.page = Math.max(0, Math.min(pages - 1, this.page + dir))
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

        const all = this.activeIds()
        const pages = Math.max(1, Math.ceil(all.length / PER_PAGE))
        const ids = all.slice(this.page * PER_PAGE, this.page * PER_PAGE + PER_PAGE)
        const items = this.crumbs.items

        ids.forEach((id, i) => {
            const x = GRID_X + (i % COLS) * CELL_W
            const y = GRID_Y + Math.floor(i / COLS) * CELL_H
            const item = items[id] || {}
            const cx = x - CELL_W / 2 + 10, cy = y - CELL_H / 2 + 8, cw = CELL_W - 20, ch = CELL_H - 16

            const card = this.scene.add.graphics()
            const paint = (hover) => { card.clear(); card.fillStyle(hover ? C.cardHover : C.card, 1).fillRoundedRect(cx, cy, cw, ch, 12); card.lineStyle(hover ? 3 : 2, hover ? 0xf5a800 : C.cardLine, 1).strokeRoundedRect(cx, cy, cw, ch, 12) }
            paint(false)
            this.grid.add(card)

            if (this.scene.textures.exists('dc' + id)) {
                const tex = this.scene.textures.get('dc' + id)
                if (!tex.has('trim')) {
                    const bb = this.getBBox('dc' + id)
                    tex.add('trim', 0, bb.x, bb.y, bb.w, bb.h)
                }
                const thumb = this.scene.add.image(x, y - 16, 'dc' + id, 'trim')
                // contain the trimmed item in ~78% of the cell so a pin and a coat both read well
                const scale = Math.min((CELL_W * 0.78) / thumb.width, (CELL_H - 56) / thumb.height, 2.2)
                thumb.setScale(scale)
                this.grid.add(thumb)
            }

            const name = (item.name || '').length > 18 ? item.name.slice(0, 17) + '…' : (item.name || '')
            this.grid.add(this.scene.add.text(x, y + CELL_H / 2 - 34, name, { fontFamily: FONT, fontSize: '12px', color: C.blueText }).setOrigin(0.5))
            this.grid.add(this.scene.add.text(x, y + CELL_H / 2 - 16, (item.cost || 0) + ' coins', { fontFamily: FONT, fontSize: '15px', color: C.brown, stroke: '#ffffff', strokeThickness: 3 }).setOrigin(0.5))

            const hit = this.scene.add.rectangle(x, y, cw, ch, 0xffffff, 0).setInteractive({ useHandCursor: true })
            hit.on('pointerover', () => paint(true))
            hit.on('pointerout', () => paint(false))
            hit.on('pointerdown', () => this.onBuy(id))
            this.grid.add(hit)
        })

        this.pageText.setText('Page ' + (this.page + 1) + ' / ' + pages)
        this.prevArrow.draw(this.page > 0)
        this.nextArrow.draw(this.page < pages - 1)
    }

    // Alpha bounding box of a loaded 600x600 doll sprite, so we can crop away the transparent
    // doll-canvas margins and scale the actual item up to fill the cell. Cached per id.
    getBBox(key) {
        if (this.bboxCache[key]) return this.bboxCache[key]
        const img = this.scene.textures.get(key).getSourceImage()
        const w = img.width, h = img.height
        let bb = { x: 0, y: 0, w: w, h: h }
        try {
            const cv = document.createElement('canvas')
            cv.width = w; cv.height = h
            const ctx = cv.getContext('2d')
            ctx.drawImage(img, 0, 0)
            const data = ctx.getImageData(0, 0, w, h).data
            let minX = w, minY = h, maxX = 0, maxY = 0, found = false
            for (let y = 0; y < h; y += 2) {
                for (let x = 0; x < w; x += 2) {
                    if (data[(y * w + x) * 4 + 3] > 24) {
                        found = true
                        if (x < minX) minX = x
                        if (x > maxX) maxX = x
                        if (y < minY) minY = y
                        if (y > maxY) maxY = y
                    }
                }
            }
            if (found) {
                const pad = 4
                bb = { x: Math.max(0, minX - pad), y: Math.max(0, minY - pad), w: Math.min(w, maxX - minX + pad * 2), h: Math.min(h, maxY - minY + pad * 2) }
            }
        } catch (e) { /* tainted/unsupported -> use full frame */ }
        this.bboxCache[key] = bb
        return bb
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
