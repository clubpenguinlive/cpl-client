import BaseContainer from '@scenes/base/BaseContainer'


// Clubs panel: shows the player's current club or a create-club button.
// Server events: club_created, club_joined, club_left (handled by network/Club.js).
// Sends: create_club, join_club, leave_club.

const FONT = 'CCComiccrazy'

const C = {
    binding: 0x1c6bb0, bindingDark: 0x12568f, cream: 0xf7eecf, creamLine: 0xd9c290,
    row: 0xfffaf0, rowLine: 0xcdb88a,
    gold: '#ffce3d', goldStroke: '#5a3a12', blueText: '#15568f',
    green: 0x3cb55e, greenDark: 0x2a7f43, red: 0xe6584d, redDark: 0xb83b30,
    purple: 0x7b5ea7
}


export default class ClubsPanel extends BaseContainer {

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

        this.add(scene.add.text(760, 196, 'CLUBS', { fontFamily: FONT, fontSize: '52px', color: C.gold, stroke: C.goldStroke, strokeThickness: 9 }).setOrigin(0.5))

        const closeBtn = scene.add.graphics()
        closeBtn.fillStyle(C.redDark, 1).fillCircle(1236, 134, 22).fillStyle(C.red, 1).fillCircle(1236, 132, 20)
        this.add(closeBtn)
        this.add(scene.add.text(1236, 130, '✕', { fontFamily: FONT, fontSize: '22px', color: '#ffffff' }).setOrigin(0.5))
        const closeHit = scene.add.circle(1236, 132, 24).setInteractive({ useHandCursor: true })
        closeHit.on('pointerdown', () => this.onClose())
        this.add(closeHit)

        // Current club status area
        this.statusContainer = scene.add.container(0, 0)
        this.add(this.statusContainer)

        this.renderStatus()
    }

    get myClub() {
        return this.world.client.club
    }

    renderStatus() {
        this.statusContainer.removeAll(true)

        const s = this.scene

        if (this.myClub) {
            // Club tag + name display
            s.add.text(760, 278, `[${this.myClub.tag}] ${this.myClub.name}`, { fontFamily: FONT, fontSize: '32px', color: C.blueText }).setOrigin(0.5)

            s.add.text(760, 326, `Your role: ${this.myClub.role}`, { fontFamily: FONT, fontSize: '20px', color: '#444444' }).setOrigin(0.5)
            s.add.text(760, 360, `Club XP: ${this.myClub.xp}`, { fontFamily: FONT, fontSize: '20px', color: '#444444' }).setOrigin(0.5)
            s.add.text(760, 396, 'Members earn XP together by playing games. You earn 1% of every coin gain.', {
                fontFamily: FONT, fontSize: '16px', color: '#666666', align: 'center', wordWrap: { width: 800 }
            }).setOrigin(0.5)

            // Leave button
            const leaveBg = s.add.graphics()
            leaveBg.fillStyle(C.redDark, 1).fillRoundedRect(660, 436, 200, 54, 12)
            leaveBg.fillStyle(C.red, 1).fillRoundedRect(662, 434, 196, 50, 10)
            const leaveLbl = s.add.text(760, 460, 'Leave Club', { fontFamily: FONT, fontSize: '22px', color: '#ffffff' }).setOrigin(0.5)
            const leaveHit = s.add.rectangle(760, 460, 200, 54).setInteractive({ useHandCursor: true })
            leaveHit.on('pointerdown', () => this.onLeave())

            this.statusContainer.add([leaveBg, leaveLbl, leaveHit])

        } else {
            this.statusContainer.add(s.add.text(760, 278, 'You are not in a club.', { fontFamily: FONT, fontSize: '24px', color: '#666666' }).setOrigin(0.5))
            this.statusContainer.add(s.add.text(760, 322, 'Create a club for 500 coins, or join an existing one.', {
                fontFamily: FONT, fontSize: '18px', color: '#666666', align: 'center', wordWrap: { width: 800 }
            }).setOrigin(0.5))

            // Create button
            const createBg = s.add.graphics()
            createBg.fillStyle(C.greenDark, 1).fillRoundedRect(620, 362, 280, 54, 12)
            createBg.fillStyle(C.green, 1).fillRoundedRect(622, 360, 276, 50, 10)
            const createLbl = s.add.text(760, 386, 'Create Club (500 coins)', { fontFamily: FONT, fontSize: '20px', color: '#ffffff' }).setOrigin(0.5)
            const createHit = s.add.rectangle(760, 386, 280, 54).setInteractive({ useHandCursor: true })
            createHit.on('pointerdown', () => this.onCreateClub())

            this.statusContainer.add([createBg, createLbl, createHit])
        }
    }

    onCreateClub() {
        const name = window.prompt('Club name (2-32 letters, numbers, spaces):')
        if (!name || name.trim().length < 2) return
        const tag = window.prompt('Club tag (2-4 uppercase letters/numbers, shown in chat):')
        if (!tag || tag.trim().length < 2) return
        this.network.send('create_club', { name: name.trim(), tag: tag.trim().toUpperCase() })

        // Wait for confirmation and re-render
        this.network.events.once('club_created', () => {
            this.renderStatus()
        })
    }

    onLeave() {
        this.interface.prompt.showWindow('Are you sure you want to leave your club?', 'dual', () => {
            this.network.send('leave_club', {})
            this.network.events.once('club_left', () => {
                this.renderStatus()
            })
        })
    }

    onJoin(clubId, clubName) {
        this.interface.prompt.showWindow(`Join [${clubName}]?`, 'dual', () => {
            this.network.send('join_club', { clubId })
            this.network.events.once('club_joined', () => {
                this.renderStatus()
            })
        })
    }

    onClose() {
        this.visible = false
    }

}
