import BaseContainer from '@scenes/base/BaseContainer'


// Slide-in notification when the server awards a stamp (`stamp_earned`). Persistent while in-world
// (created by Main), queues so multiple awards show one after another. Name-based (no stamp icon art
// yet) — a gold medallion + "STAMP EARNED!" + the stamp name.

const FONT = 'CCComiccrazy'

export default class StampPopup extends BaseContainer {

    constructor(scene) {
        super(scene, 760, -70)

        this.depth = 200
        this.queue = []
        this.busy = false

        const g = scene.add.graphics()
        g.fillStyle(0x12568f, 1).fillRoundedRect(-220, -44, 440, 88, 16)
        g.fillStyle(0x1c6bb0, 1).fillRoundedRect(-214, -38, 428, 76, 12)
        g.lineStyle(3, 0xffce3d, 1).strokeRoundedRect(-220, -44, 440, 88, 16)
        // gold medallion + white check, left
        g.fillStyle(0xffce3d, 1).fillCircle(-168, 0, 26)
        g.lineStyle(6, 0xffffff, 1).beginPath()
        g.moveTo(-180, 0); g.lineTo(-170, 11); g.lineTo(-154, -12); g.strokePath()
        this.add(g)

        this.add(scene.add.text(-128, -15, 'STAMP EARNED!', { fontFamily: FONT, fontSize: '17px', color: '#ffce3d', stroke: '#5a3a12', strokeThickness: 4 }).setOrigin(0, 0.5))
        this.nameText = scene.add.text(-128, 15, '', { fontFamily: FONT, fontSize: '21px', color: '#ffffff' }).setOrigin(0, 0.5)
        this.add(this.nameText)

        this.setVisible(false)

        this.onEarnedBound = (args) => this.enqueue(args)
        this.network.events.on('stamp_earned', this.onEarnedBound)
        scene.events.once('shutdown', () => this.network.events.off('stamp_earned', this.onEarnedBound))
    }

    enqueue(args) {
        this.queue.push((args && args.name) || 'New stamp')
        if (!this.busy) {
            this.next()
        }
    }

    next() {
        if (this.queue.length === 0) {
            this.busy = false
            return
        }

        this.busy = true
        this.nameText.setText(this.queue.shift())
        this.setVisible(true)
        this.y = -70

        this.scene.tweens.add({
            targets: this, y: 72, duration: 450, ease: 'Back.Out',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: this, y: -70, delay: 2200, duration: 350, ease: 'Back.In',
                    onComplete: () => { this.setVisible(false); this.next() }
                })
            }
        })
    }

}
