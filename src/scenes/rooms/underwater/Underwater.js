import RoomScene from '../RoomScene'


/* START OF COMPILED CODE */

// Underwater (the sunken shipwreck below the Hidden Lake), ported from the Yukon CPJourney asset set.
// Faithful layered art; exit back up to the Hidden Lake (814) via the physics 'lake' zone. The
// collectible RoomPin and the trigger-driven fish/jellyfish (need subsystems we don't run) are omitted.

export default class Underwater extends RoomScene {

    constructor() {
        super("Underwater");

        /** @type {Array<Phaser.GameObjects.Image|Phaser.GameObjects.Sprite>} */
        this.sort;


        /* START-USER-CTR-CODE */
        this.roomTriggers = {
            'lake': () => this.triggerRoom(814, 1319, 683)
        }
        this.music = 671
        /* END-USER-CTR-CODE */
    }

    /** @returns {void} */
    _preload() {

        this.load.pack("underwater-room-pack", "assets/media/rooms/underwater/underwater-room-pack.json");
    }

    /** @returns {void} */
    _create() {

        // background
        this.add.image(759, 450, "underwater-room", "background");

        // abovefish
        this.add.image(759, 528, "underwater-room", "abovefish");

        // aboveabovefish
        this.add.image(762, 556, "underwater-room", "aboveabovefish");

        // shellfront
        const shellfront = this.add.image(1300.8171995550035, 616.7922361760972, "underwater-room", "shellfront");
        shellfront.setOrigin(0.490255239219131, 0.4989346355284951);

        // shellback
        const shellback = this.add.image(1422.0872187996006, 651.5016068594249, "underwater-room", "shellback");
        shellback.setOrigin(0.45885249285476537, 0.7323623932907347);

        // anvil
        const anvil = this.add.image(1363.769295413336, 774.461409173328, "underwater-room", "anvil");
        anvil.setOrigin(0.3633487965490357, 0.768563058805364);

        // back
        const back = this.add.image(118.99852752685547, 642.5226798653448, "underwater-room", "back");
        back.setOrigin(0.4405149872066536, 0.7385961008135953);

        // front
        const front = this.add.image(358.2319030761719, 715.4504313266222, "underwater-room", "front");
        front.setOrigin(0.5019040231141575, 0.8629210684074289);

        // wheel
        const wheel = this.add.image(365.06838697194127, 773.1287724971401, "underwater-room", "wheel");
        wheel.setOrigin(0.5608616534589359, 0.8095890543651354);

        // clam
        const clam = this.add.image(625, 784.3920848700204, "underwater-room", "clam");
        clam.setOrigin(0.5, 0.6719089504655913);

        // bush
        const bush = this.add.image(84, 656, "underwater-room", "bush");

        // bushright
        const bushright = this.add.image(1484, 451, "underwater-room", "bushright");

        // foreground
        const foreground = this.add.image(728.1299309670391, 1057.5344346009265, "underwater-room", "foreground");
        foreground.setOrigin(0.5114963527446148, 1.094744648654737);

        // bigthing
        const bigthing = this.add.image(998.077919780723, 682.1430202235706, "underwater-room", "bigthing");
        bigthing.setOrigin(0.3556234510816635, 0.8222085907384583);

        // lists
        const sort = [back, front, wheel, clam, shellback, shellfront, anvil, foreground, bigthing, bush, bushright];

        this.sort = sort;

        this.events.emit("scene-awake");
    }

}

/* END OF COMPILED CODE */
