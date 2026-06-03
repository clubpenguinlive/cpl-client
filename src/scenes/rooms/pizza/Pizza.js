import RoomScene from '../RoomScene'


// Full Phaser Pizza Parlor: authentic room art (extracted from the archive SWF) as the background,
// with the standard RoomScene engine providing penguins / movement / multiplayer. The orange
// double-door (top-centre) exits back to the Plaza.

export default class Pizza extends RoomScene {

    constructor() {
        super('Pizza')

        /* START-USER-CTR-CODE */
        this.music = '1'
        /* END-USER-CTR-CODE */
    }

    _preload() {
        this.load.image('pizza-bg', 'assets/media/rooms/pizza/bg.png')
    }

    _create() {
        const bg = this.add.image(0, 0, 'pizza-bg')
        bg.setOrigin(0, 0)

        // exit door (orange double-door, top-centre) -> Plaza
        const door = this.add.zone(835, 210, 190, 260).setInteractive({ useHandCursor: true })
        door.on('pointerdown', () => this.triggerRoom(300, 582, 588))

        this.events.emit('scene-awake')
    }

}
