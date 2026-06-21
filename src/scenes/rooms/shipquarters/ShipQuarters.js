
import RoomScene from '../RoomScene'

/* START OF COMPILED CODE */

export default class ShipQuarters extends RoomScene {

    constructor() {
        super("ShipQuarters");

        /** @type {Phaser.GameObjects.Image[]} */
        this.sort;


        /* START-USER-CTR-CODE */
        this.roomTriggers = {
            'shiphold': () => this.triggerRoom(421, 308, 425)
        }
        this.music = '491'
        /* END-USER-CTR-CODE */
    }

    /** @returns {void} */
    _preload() {

        this.load.pack("shipquarters-pack", "assets/media/rooms/shipquarters/shipquarters-pack.json");
    }

    /** @returns {void} */
    _create() {

        // bg
        const bg = this.add.image(771, 509, "shipquarters", "bg");
        bg.setOrigin(0.5, 0.5);

        // right_side
        const right_side = this.add.image(1327, 427, "shipquarters", "right_side");
        right_side.setOrigin(0.5, 0.5);

        // right_map
        const right_map = this.add.image(1224, 371, "shipquarters", "right_map");
        right_map.setOrigin(0.5, 0.5);

        // center
        const center = this.add.image(720, 700, "shipquarters", "center");
        center.setOrigin(0.5, 0.5);

        // left_stairs
        const left_stairs = this.add.image(198, 730, "shipquarters", "left_stairs");
        left_stairs.setOrigin(0.5, 1);

        // right_stairs
        const right_stairs = this.add.image(1318, 730, "shipquarters", "right_stairs");
        right_stairs.setOrigin(0.5, 1);

        // lists
        const sort = [left_stairs, center, right_stairs];

        this.sort = sort;

        this.events.emit("scene-awake");
    }


    /* START-USER-CODE */

    /* END-USER-CODE */
}

/* END OF COMPILED CODE */
