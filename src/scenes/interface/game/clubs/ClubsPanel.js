import BaseContainer from '@scenes/base/BaseContainer'


// Clubs panel: shows the player's current club or a create-club button, plus a top-20 leaderboard.
// Server events: club_leaderboard, club_created, club_joined, club_left (handled by network/Club.js).
// Sends: club_leaderboard, create_club, join_club, leave_club.

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
        this.boards = []

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

        // Current club status area (top half)
        this.statusContainer = scene.add.container(0, 0)
        this.add(this.statusContainer)

        // Leaderboard area (bottom half)
        this.lbContainer = scene.add.container(0, 0)
        this.add(this.lbContainer)

        this.lbHeader = scene.add.text(760, 550, 'TOP CLUBS', { fontFamily: FONT, fontSize: '22px', color: C.blueText }).setOrigin(0.5)
        this.add(this.lbHeader)

        this.lbRows = scene.add.container(0, 0)
        this.add(this.lbRows)

        this.renderStatus()

        // Listen for leaderboard responses; re-render when our club changes
        this.onLbBound = (args) => this.renderLeaderboard(args)
        this.network.events.on('club_leaderboard', this.onLbBound)
        this.network.send('club_leaderboard', {})
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

    renderLeaderboard(args) {
        this.lbRows.removeAll(true)
        const clubs = (args && args.clubs) || []
        const s = this.scene

        clubs.forEach((club, i) => {
            const y = 582 + i * 32
            const rankColor = i === 0 ? '#e8b84b' : i === 1 ? '#aaaaaa' : i === 2 ? '#cd7f32' : C.blueText
            s.add.text(310, y, `${i + 1}.`, { fontFamily: FONT, fontSize: '18px', color: rankColor }).setOrigin(0, 0.5)
            s.add.text(360, y, `[${club.tag}] ${club.name}`, { fontFamily: FONT, fontSize: '18px', color: '#333333' }).setOrigin(0, 0.5)
            s.add.text(1168, y, `${club.xp} XP`, { fontFamily: FONT, fontSize: '18px', color: rankColor }).setOrigin(1, 0.5)

            if (!this.myClub && i > 0) {
                const joinHit = s.add.rectangle(900, y, 120, 28).setInteractive({ useHandCursor: true })
                const joinLbl = s.add.text(900, y, 'Join', { fontFamily: FONT, fontSize: '16px', color: C.blueText }).setOrigin(0.5)
                joinHit.on('pointerdown', () => this.onJoin(club.id, club.name))
                this.lbRows.add([joinHit, joinLbl])
            }

            this.lbRows.add(s.add.text(310, y, '', { fontFamily: FONT })) // spacer
        })

        if (clubs.length === 0) {
            this.lbRows.add(s.add.text(760, 600, 'No clubs yet. Be the first!', { fontFamily: FONT, fontSize: '20px', color: '#888888' }).setOrigin(0.5))
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
            this.network.send('club_leaderboard', {})
        })
    }

    onLeave() {
        this.interface.prompt.showWindow('Are you sure you want to leave your club?', 'dual', () => {
            this.network.send('leave_club', {})
            this.network.events.once('club_left', () => {
                this.renderStatus()
                this.network.send('club_leaderboard', {})
            })
        })
    }

    onJoin(clubId, clubName) {
        this.interface.prompt.showWindow(`Join [${clubName}]?`, 'dual', () => {
            this.network.send('join_club', { clubId })
            this.network.events.once('club_joined', () => {
                this.renderStatus()
                this.network.send('club_leaderboard', {})
            })
        })
    }

    onClose() {
        this.network.events.off('club_leaderboard', this.onLbBound)
        this.visible = false
    }

}
