import BaseContainer from '@scenes/base/BaseContainer'


// Help / FAQ panel — same catalog-book chrome as StampBook/ChallengesPanel/ClubsPanel.
// Purely static content: no server round trip, nothing to keep in sync. Explains the four
// top-left HUD icons (what they open, how to open them) plus a one-line explainer for the
// three progression systems. Opened via the new top-left "?" icon or the H key (see Main.js
// onHelpKey/addHelpIcon) -- NOT the bottom-right "?" toolbar button, which already opens the
// account Settings panel (help_hint crumb string is "Edit Account"); repurposing that would
// have broken an existing, unrelated feature.

const FONT = 'CCComiccrazy'

const C = {
    binding: 0x1c6bb0, bindingDark: 0x12568f, cream: 0xf7eecf, creamLine: 0xd9c290,
    row: 0xfffaf0, rowLine: 0xcdb88a,
    gold: '#ffce3d', goldStroke: '#5a3a12', blueText: '#15568f', brown: '#8a5a12',
    red: 0xe6584d, redDark: 0xb83b30
}

const ROW_X = 300, ROW_W = 920, ROW_H = 108, ROW_GAP = 14
const ROW_Y0 = 302
const ICON_X = ROW_X + 44
const TEXT_X = ROW_X + 104

// One entry per top-left HUD icon, in left-to-right order. `icon` is either an atlas frame
// (from the always-loaded "main" atlas) or a texture key generated at runtime by Main.js --
// those textures are guaranteed to exist by the time a player can open this panel, since
// Main.js draws the live HUD icons on scene create.
const ROWS = [
    {
        icon: { atlas: 'main', frame: 'mail-button' },
        scale: 0.82,
        header: 'MAIL — click the envelope, top-left',
        desc: 'Read the postcards and messages other penguins have sent you.'
    },
    {
        icon: { key: 'cpl-challenges-btn' },
        scale: 0.78,
        header: 'DAILY CHALLENGES — click the checkmark icon, or press J',
        desc: 'Short in-game tasks that refresh throughout the day. Finish them for bonus coins.'
    },
    {
        icon: { key: 'cpl-stamp-btn' },
        scale: 0.78,
        header: 'STAMP BOOK — click the gold icon, or press B',
        desc: 'Your collection of stamps, earned by playing games, exploring the island, and hitting other milestones. Sorted into categories.'
    },
    {
        icon: { key: 'cpl-clubs-btn' },
        scale: 0.78,
        header: 'CLUBS — click the purple icon, or press N',
        desc: 'Team up with other penguins. Everyone in a club shares one XP pool and wears a club nametag.'
    }
]

export default class HelpPanel extends BaseContainer {

    constructor(scene) {
        super(scene, 0, 0)

        this.depth = 100

        const block = scene.add.rectangle(0, 0, 1520, 960, 0x000000, 0.5).setOrigin(0, 0).setInteractive()
        this.add(block)

        const g = scene.add.graphics()
        g.fillStyle(C.bindingDark, 1).fillRoundedRect(230, 96, 1060, 770, 28)
        g.fillStyle(C.binding, 1).fillRoundedRect(240, 104, 1040, 754, 24)
        g.fillStyle(C.cream, 1).fillRoundedRect(274, 150, 972, 678, 16)
        g.lineStyle(3, C.creamLine, 1).strokeRoundedRect(274, 150, 972, 678, 16)
        this.add(g)

        this.add(scene.add.text(760, 196, 'HELP', { fontFamily: FONT, fontSize: '44px', color: C.gold, stroke: C.goldStroke, strokeThickness: 9 }).setOrigin(0.5))
        this.add(scene.add.text(760, 244, 'A quick guide to your toolbar icons', { fontFamily: FONT, fontSize: '18px', color: C.blueText }).setOrigin(0.5))

        const closeBtn = scene.add.graphics()
        closeBtn.fillStyle(C.redDark, 1).fillCircle(1236, 134, 22).fillStyle(C.red, 1).fillCircle(1236, 132, 20)
        this.add(closeBtn)
        this.add(scene.add.text(1236, 130, '✕', { fontFamily: FONT, fontSize: '22px', color: '#ffffff' }).setOrigin(0.5))
        const closeHit = scene.add.circle(1236, 132, 24).setInteractive({ useHandCursor: true })
        closeHit.on('pointerdown', () => this.onClose())
        this.add(closeHit)

        this.rows = scene.add.container(0, 0)
        this.add(this.rows)

        this.renderRows()
    }

    renderRows() {
        this.rows.removeAll(true)

        ROWS.forEach((row, i) => {
            const y = ROW_Y0 + i * (ROW_H + ROW_GAP)

            const card = this.scene.add.graphics()
            card.fillStyle(C.row, 1).fillRoundedRect(ROW_X, y, ROW_W, ROW_H, 12)
            card.lineStyle(2, C.rowLine, 1).strokeRoundedRect(ROW_X, y, ROW_W, ROW_H, 12)
            this.rows.add(card)

            const icon = row.icon.atlas
                ? this.scene.add.image(ICON_X, y + ROW_H / 2, row.icon.atlas, row.icon.frame)
                : this.scene.add.image(ICON_X, y + ROW_H / 2, row.icon.key)
            icon.setScale(row.scale)
            this.rows.add(icon)

            this.rows.add(this.scene.add.text(TEXT_X, y + 34, row.header, {
                fontFamily: FONT, fontSize: '19px', color: C.blueText, wordWrap: { width: ROW_W - 130 }
            }).setOrigin(0, 0.5))
            this.rows.add(this.scene.add.text(TEXT_X, y + 72, row.desc, {
                fontFamily: FONT, fontSize: '15px', color: C.brown, wordWrap: { width: ROW_W - 130 }
            }).setOrigin(0, 0.5))
        })
    }

    onClose() {
        this.interface.removeWidget(this)
        this.destroy()
    }

}
