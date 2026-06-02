import BaseContainer from '@scenes/base/BaseContainer'


// Dynamic, data-driven catalog widget. Consumes the server's deterministic daily selection
// (get_daily_catalog -> daily_catalog) and renders a grid of clothing items using the per-item
// worn-sprite PNGs as thumbnails. Buying goes through the existing server-validated item prompt.
// This is the model for all future catalogs (no hand-painted pages).

const THUMB_PATH = '/assets/media/clothing/paper/'
const COLS = 7
const CELL_W = 158
const CELL_H = 132
const GRID_X = 760 - (COLS * CELL_W) / 2 + CELL_W / 2
const GRID_Y = 308

export default class DailyCatalog extends BaseContainer {

    constructor(scene) {
        super(scene, 0, 0)

        this.depth = 100
        this.tab = 'today'
        this.todayItems = []
        this.classics = []
        this.countdown = 0
        this.onDataBound = (args) => this.onData(args)

        // dimmed backdrop that blocks clicks behind the modal
        const block = scene.add.rectangle(0, 0, 1520, 960, 0x000000, 0.5).setOrigin(0, 0)
        block.setInteractive()
        this.add(block)

        // panel
        this.add(scene.add.rectangle(760, 480, 1180, 780, 0x0e5fa8).setStrokeStyle(8, 0x093f70))
        this.add(scene.add.rectangle(760, 500, 1140, 700, 0xdff1fc))

        // header
        this.titleText = scene.add.text(760, 150, "PENGUIN STYLE", { fontFamily: 'Burbank Big, Arial', fontSize: '42px', color: '#ffffff' }).setOrigin(0.5)
        this.add(this.titleText)
        this.dateText = scene.add.text(760, 192, '', { fontFamily: 'Arial', fontSize: '18px', color: '#cfe9ff' }).setOrigin(0.5)
        this.add(this.dateText)
        this.countdownText = scene.add.text(760, 214, '', { fontFamily: 'Arial', fontSize: '15px', color: '#ffd23f' }).setOrigin(0.5)
        this.add(this.countdownText)

        // coins (top-right) + close (corner)
        this.coinsText = scene.add.text(1150, 130, '', { fontFamily: 'Burbank Big, Arial', fontSize: '24px', color: '#ffd23f' }).setOrigin(1, 0.5)
        this.add(this.coinsText)
        const close = scene.add.text(1300, 130, '✕', { fontFamily: 'Arial', fontSize: '34px', color: '#ffffff' }).setOrigin(0.5)
        close.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.onClose())
        this.add(close)

        // tabs
        this.todayTab = this.makeTab(610, 250, 'Today')
        this.todayTab.on('pointerdown', () => this.setTab('today'))
        this.classicsTab = this.makeTab(910, 250, 'Classics')
        this.classicsTab.on('pointerdown', () => this.setTab('classics'))

        // grid layer
        this.grid = scene.add.container(0, 0)
        this.add(this.grid)

        this.loadingText = scene.add.text(760, 480, 'Loading catalog...', { fontFamily: 'Arial', fontSize: '24px', color: '#0e5fa8' }).setOrigin(0.5)
        this.add(this.loadingText)

        this.updateCoins()

        // fetch the daily set
        this.network.events.on('daily_catalog', this.onDataBound)
        this.network.send('get_daily_catalog', {})

        // live countdown to rotation
        this.tick = scene.time.addEvent({ delay: 1000, loop: true, callback: () => this.updateCountdown() })
    }

    makeTab(x, y, label) {
        const bg = this.scene.add.rectangle(x, y, 220, 50, 0x1f8fe0).setStrokeStyle(3, 0x093f70)
        bg.setInteractive({ useHandCursor: true })
        bg.label = this.scene.add.text(x, y, label, { fontFamily: 'Burbank Big, Arial', fontSize: '22px', color: '#ffffff' }).setOrigin(0.5)
        this.add(bg)
        this.add(bg.label)
        return bg
    }

    setTab(tab) {
        this.tab = tab
        this.todayTab.fillColor = tab === 'today' ? 0xf5a800 : 0x1f8fe0
        this.classicsTab.fillColor = tab === 'classics' ? 0xf5a800 : 0x1f8fe0
        this.renderGrid()
    }

    onData(args) {
        this.todayItems = args.items || []
        this.classics = args.classics || []
        this.countdown = args.secondsUntilNext || 0
        this.dateText.setText('New styles every Monday' + (args.week ? '  ·  week ' + args.week : ''))
        this.setTab('today')
        this.loadThumbsAndRender()
    }

    activeIds() {
        return this.tab === 'today' ? this.todayItems : this.classics
    }

    loadThumbsAndRender() {
        const ids = [...new Set([...this.todayItems, ...this.classics])]
        const toLoad = ids.filter(id => !this.scene.textures.exists('dc' + id))
        if (toLoad.length === 0) {
            this.renderGrid()
            return
        }
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

            const cellBg = this.scene.add.rectangle(x, y, CELL_W - 14, CELL_H - 14, 0xffffff).setStrokeStyle(2, 0x9cc6e8)
            cellBg.setInteractive({ useHandCursor: true })
            cellBg.on('pointerover', () => cellBg.setStrokeStyle(3, 0xf5a800))
            cellBg.on('pointerout', () => cellBg.setStrokeStyle(2, 0x9cc6e8))
            cellBg.on('pointerdown', () => this.onBuy(id))
            this.grid.add(cellBg)

            if (this.scene.textures.exists('dc' + id)) {
                const thumb = this.scene.add.image(x, y - 16, 'dc' + id)
                const scale = Math.min((CELL_W - 40) / thumb.width, (CELL_H - 50) / thumb.height, 1)
                thumb.setScale(scale)
                this.grid.add(thumb)
            }

            const price = this.scene.add.text(x, y + CELL_H / 2 - 22, (item.cost || 0) + ' coins', { fontFamily: 'Arial', fontSize: '15px', color: '#0e5fa8' }).setOrigin(0.5)
            this.grid.add(price)
        })
    }

    onBuy(id) {
        this.interface.prompt.showItem(id)
    }

    updateCoins() {
        const coins = this.world && this.world.client ? this.world.client.coins : null
        this.coinsText.setText((coins != null ? coins : '') + ' coins')
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
