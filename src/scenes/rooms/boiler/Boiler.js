import RoomScene from '../RoomScene'

import { Button, MoveTo, SimpleButton } from '@components/components'


/* START OF COMPILED CODE */

// Boiler Room, ported from the Yukon CPJourney asset set. Faithful layered art + the boiler machine,
// animated steam, the drawer hover animation, and the door out (to the Night Club / Cave). The
// snowball-secret easter egg and the Archives widget are omitted for now. Boiler frames carry a .png
// suffix and animations are preloaded from boiler-anims.json (played by name).

export default class Boiler extends RoomScene {

    constructor() {
        super("Boiler");

        /** @type {Phaser.GameObjects.Sprite} */
        this.smoke;
        /** @type {Phaser.GameObjects.Sprite} */
        this.drawer1_png;
        /** @type {Phaser.GameObjects.Image[]} */
        this.sort;


        /* START-USER-CTR-CODE */
        this.roomTriggers = {
            'dance': () => this.triggerRoom(120, 934, 507),
            'cave': () => this.triggerRoom(806, 230, 620)
        }

        this.music = 6
        /* END-USER-CTR-CODE */
    }

    /** @returns {void} */
    _preload() {

        this.load.pack("boiler-pack", "assets/media/rooms/boiler/boiler-pack.json");
    }

    /** @returns {void} */
    _create() {

        // bg_png
        const bg_png = this.add.image(760, 485, "boiler", "bg.png");
        bg_png.scaleX = 1.02;
        bg_png.scaleY = 1.02;

        // boiler_board
        const boiler_board = this.add.image(1278, 301, "boiler-board");
        boiler_board.scaleX = 1.05;
        boiler_board.scaleY = 1.05;

        // boiler_door_png
        const boiler_door_png = this.add.image(582, 363, "boiler", "boiler-door.png");
        boiler_door_png.scaleX = 1.02;
        boiler_door_png.scaleY = 1.02;

        // smoke
        const smoke = this.add.sprite(250, 199, "boiler", "smoke0001.png");

        // main (the boiler machine)
        const main = this.add.image(277.2600538928435, 775.0236309168115, "newboiler", "main");
        main.scaleX = 1.0197888558975952;
        main.scaleY = 1.0197888558975952;
        main.setOrigin(0.6937553751717792, 0.8476552498963502);

        // top
        this.add.image(192, 249, "newboiler", "top");

        // copper
        this.add.image(237, 269, "newboiler", "copper");

        // tubes
        this.add.image(95, 755, "newboiler", "tubes");

        // drawer1.png
        const drawer1_png = this.add.sprite(832, 397, "boiler", "drawer1.png0001");

        // lists
        const sort = [main];

        // boiler_door_png (components)
        const boiler_door_pngButton = new Button(boiler_door_png);
        boiler_door_pngButton.spriteName = "boiler-door.png";
        boiler_door_pngButton.pixelPerfect = true;
        const boiler_door_pngMoveTo = new MoveTo(boiler_door_png);
        boiler_door_pngMoveTo.x = 582;
        boiler_door_pngMoveTo.y = 580;

        // drawer1_png (components)
        const drawer1_pngSimpleButton = new SimpleButton(drawer1_png);
        drawer1_pngSimpleButton.hoverCallback = () => this.onDrawerOver();
        drawer1_pngSimpleButton.hoverOutCallback = () => this.onDrawerOut();

        this.smoke = smoke;
        this.drawer1_png = drawer1_png;
        this.sort = sort;

        this.events.emit("scene-awake");
    }


    /* START-USER-CODE */

    create() {
        super.create()
        this.smoke.play("boiler-steam")
    }

    onDrawerOver() {
        this.drawer1_png.play('drawerhover')
    }

    onDrawerOut() {
        this.drawer1_png.play('drawerout')
    }

    /* END-USER-CODE */
}

/* END OF COMPILED CODE */
