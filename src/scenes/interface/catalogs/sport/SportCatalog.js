import DailyCatalog from '@scenes/interface/catalogs/daily/DailyCatalog'


const FONT = 'CCComiccrazy'

const SELLABLE = [
    { key: 'fish',  label: 'Fish',  price: 8,  color: 0x3aa0e0 },
    { key: 'ore',   label: 'Ore',   price: 10, color: 0x9c7038 },
    { key: 'shell', label: 'Shell', price: 12, color: 0x2fb3a0 },
    { key: 'cargo', label: 'Cargo', price: 6,  color: 0x49c25e }
]
const CHIP_W = 206, CHIP_H = 60, CHIP_GAP = 18, CHIP_Y = 480
const CHIPS_X0 = 760 - (SELLABLE.length * CHIP_W + (SELLABLE.length - 1) * CHIP_GAP) / 2

const C_BLUE = '#15568f', C_BROWN = '#8a5a12', C_ROW = 0xfffaf0, C_TRACK = 0xe2d6b0, C_LINE = 0xcdb88a

export default class SportCatalog extends DailyCatalog {

    constructor(scene) {
        super(scene)
        this.titleText.setText('SPORT SHOP')

        this.tradeTab = this.makeTab(1100, 240, 'Trade-In')
        this.tradeTab.bg.on('pointerdown', () => this.setTab('trade'))

        this.tradePanel = scene.add.container(0, 0)
        this.tradePanel.visible = false
        this.add(this.tradePanel)

        this.flashText = scene.add.text(760, CHIP_Y + 80, '', { fontFamily: FONT, fontSize: '15px', color: '#2f7a3a', stroke: '#ffffff', strokeThickness: 3 }).setOrigin(0.5)
        this.flashText.visible = false
        this.add(this.flashText)

        this.held = {}
        this.resourcesLoaded = false

        this.onSkillsBound = (args) => this.onSkills(args)
        this.onSoldBound = (args) => this.onSold(args)
        this.network.events.on('skills', this.onSkillsBound)
        this.network.events.on('resource_sold', this.onSoldBound)
    }

    getShopArgs() {
        return { shop: 'sport' }
    }

    setTab(tab) {
        const isTradeNow = tab === 'trade'
        const wasTradeActive = this.tab === 'trade'

        // Show/hide catalog UI elements
        this.grid.visible = !isTradeNow
        this.prevArrow && (this.prevArrow.draw && !isTradeNow ? this.prevArrow.draw(this.page > 0) : null)
        this.nextArrow && (this.nextArrow.draw && !isTradeNow ? this.nextArrow.draw(this.page < Math.max(0, Math.ceil(this.activeIds().length / 12) - 1)) : null)
        this.pageText.visible = !isTradeNow
        this.tradePanel.visible = isTradeNow
        this.flashText.visible = isTradeNow

        this.todayTab.draw(tab === 'today')
        this.classicsTab.draw(tab === 'classics')
        this.tradeTab.draw(isTradeNow)

        this.tab = tab

        if (isTradeNow) {
            if (!this.resourcesLoaded) {
                this.network.send('get_skills', {})
            } else {
                this.renderTradeChips()
            }
        } else {
            if (wasTradeActive) this.page = 0
            this.renderGrid()
        }
    }

    onSkills(args) {
        this.held = args.resources || {}
        this.resourcesLoaded = true
        if (this.tab === 'trade') {
            this.renderTradeChips()
        }
    }

    renderTradeChips() {
        this.tradePanel.removeAll(true)

        const label = this.scene.add.text(760, CHIP_Y - 90, 'TRADE-IN COUNTER', { fontFamily: FONT, fontSize: '20px', color: C_BLUE }).setOrigin(0.5)
        this.tradePanel.add(label)
        const sub = this.scene.add.text(760, CHIP_Y - 62, 'Sell gathered resources for coins', { fontFamily: FONT, fontSize: '14px', color: C_BROWN }).setOrigin(0.5)
        this.tradePanel.add(sub)

        SELLABLE.forEach((r, i) => {
            const have = this.held[r.key] || 0
            const x = CHIPS_X0 + i * (CHIP_W + CHIP_GAP)
            const sellable = have > 0

            const g = this.scene.add.graphics()
            g.fillStyle(sellable ? C_ROW : C_TRACK, sellable ? 1 : 0.55).fillRoundedRect(x, CHIP_Y - CHIP_H / 2, CHIP_W, CHIP_H, 10)
            g.lineStyle(2, C_LINE, 1).strokeRoundedRect(x, CHIP_Y - CHIP_H / 2, CHIP_W, CHIP_H, 10)
            g.fillStyle(r.color, sellable ? 1 : 0.5).fillRoundedRect(x + 8, CHIP_Y - CHIP_H / 2 + 8, 16, CHIP_H - 16, 5)
            this.tradePanel.add(g)

            this.tradePanel.add(this.scene.add.text(x + 36, CHIP_Y - 13, r.label + '  x' + have, { fontFamily: FONT, fontSize: '17px', color: sellable ? C_BLUE : '#9a8f73' }).setOrigin(0, 0.5))
            this.tradePanel.add(this.scene.add.text(x + 36, CHIP_Y + 12, sellable ? 'Sell all -> ' + (have * r.price) + 'c' : r.price + 'c each', { fontFamily: FONT, fontSize: '13px', color: sellable ? C_BROWN : '#9a8f73' }).setOrigin(0, 0.5))

            if (sellable) {
                const hit = this.scene.add.rectangle(x + CHIP_W / 2, CHIP_Y, CHIP_W, CHIP_H, 0xffffff, 0.001).setInteractive({ useHandCursor: true })
                hit.on('pointerdown', () => this.sell(r.key, have))
                this.tradePanel.add(hit)
            }
        })
    }

    sell(resource, quantity) {
        this.network.send('sell_resource', { resource, quantity })
    }

    onSold(args) {
        this.held[args.resource] = args.remaining
        this.world.client.coins = args.total
        this.interface.refreshPlayerCard()
        this.updateCoins()
        if (this.tab === 'trade') {
            this.renderTradeChips()
            this.flashText.setText('Sold ' + args.quantity + ' ' + args.resource + ' for ' + args.coins + ' coins!')
            this.scene.tweens.killTweensOf(this.flashText)
            this.flashText.setAlpha(1)
            this.scene.tweens.add({ targets: this.flashText, alpha: 0, delay: 2200, duration: 600 })
        }
    }

    onClose() {
        this.network.events.off('skills', this.onSkillsBound)
        this.network.events.off('resource_sold', this.onSoldBound)
        super.onClose()
    }

}
