import RoomScene from '../RoomScene'

import { Animation, Button, HoverAnimation, MoveTo, ShowHint } from '@components/components'


/* START OF COMPILED CODE */

// Faithful Pizza Parlor room ported from the Yukon CPJourney asset set: layered sprites
// (depth-sorted via this.sort so penguins pass behind tables/counter), ambient animations
// (candle flames, oven steam + fire), and interactive objects (the door opens on hover and
// walks you out to the Plaza, the cash register hops and the recipe book flips on hover).
// The pizza-serving job (Cooking) is deferred; this is the room itself.

export default class Pizza extends RoomScene {

    constructor() {
        super("Pizza");

        /** @type {Phaser.GameObjects.Sprite} */
        this.book;
        /** @type {Phaser.GameObjects.Rectangle} */
        this.rectangle_1;
        /** @type {Array<Phaser.GameObjects.Image|Phaser.GameObjects.Container|Phaser.GameObjects.Sprite>} */
        this.sort;


        /* START-USER-CTR-CODE */
        this.roomTriggers = {
            'plaza': () => this.triggerRoom(300, 1130, 550),
            'pizzatron': () => this.triggerGame(910)
        }

        this.music = '20'
        /* END-USER-CTR-CODE */
    }

    /** @returns {void} */
    _preload() {

        this.load.pack("pizza-pack", "assets/media/rooms/pizza/pizza-pack.json");
    }

    /** @returns {void} */
    _create() {

        // bg
        const bg = this.add.image(760, 483, "pizza", "bg");
        bg.scaleX = 1.02;
        bg.scaleY = 1.02;

        // bead_door
        const bead_door = this.add.image(385, 241, "pizza", "bead-door");
        bead_door.scaleX = 1.02;
        bead_door.scaleY = 1.02;

        // piano
        const piano = this.add.image(1270.6137794715412, 447.7720125239132, "pizza", "piano");
        piano.setOrigin(0.1497106693675879, 0.6223623642170768);

        // door
        const door = this.add.image(837, 265, "pizza", "door");
        door.scaleX = 1.02;
        door.scaleY = 1.02;

        // pizza_pan
        const pizza_pan = this.add.image(187, 515, "pizza", "pizza-pan");
        pizza_pan.scaleX = 1.02;
        pizza_pan.scaleY = 1.02;

        // oven
        const oven = this.add.image(110, 457, "pizza", "oven");
        oven.scaleX = 1.02;
        oven.scaleY = 1.02;

        // foreground
        const foreground = this.add.image(111.99999999999999, 957.6951746992214, "pizza", "foreground");
        foreground.scaleX = 1.02;
        foreground.scaleY = 1.02;
        foreground.setOrigin(0.49999999999999994, 0.9387919485387388);

        // chair1
        const chair1 = this.add.image(414, 609, "pizza", "chair1");
        chair1.scaleX = 1.02;
        chair1.scaleY = 1.02;

        // chair2
        const chair2 = this.add.image(577, 609, "pizza", "chair2");
        chair2.scaleX = 1.02;
        chair2.scaleY = 1.02;

        // _table1
        const _table1 = this.add.container(494, 664);

        // table1
        const table1 = this.add.image(0, 0, "pizza", "table1");
        table1.scaleX = 1.02;
        table1.scaleY = 1.02;
        _table1.add(table1);

        // candle1
        const candle1 = this.add.sprite(5, -84, "pizza", "candle-fire10001");
        candle1.scaleX = 0.5;
        candle1.scaleY = 0.5;
        candle1.setOrigin(0.47076955921284025, 0.587907045214686);
        _table1.add(candle1);

        // chair3
        const chair3 = this.add.image(677, 719, "pizza", "chair3");
        chair3.scaleX = 1.02;
        chair3.scaleY = 1.02;

        // chair4
        const chair4 = this.add.image(840, 719, "pizza", "chair4");

        // _table2
        const _table2 = this.add.container(763, 775);

        // table2
        const table2 = this.add.image(0, 0, "pizza", "table2");
        table2.scaleX = 1.02;
        table2.scaleY = 1.02;
        _table2.add(table2);

        // candle2
        const candle2 = this.add.sprite(-4, -79, "pizza", "candle-fire10001");
        candle2.scaleX = 0.5;
        candle2.scaleY = 0.5;
        candle2.setOrigin(0.6150868770874695, 0.7592143525247391);
        candle2.flipX = true;
        _table2.add(candle2);

        // chair5
        const chair5 = this.add.image(987, 687, "pizza", "chair5");
        chair5.scaleX = 1.02;
        chair5.scaleY = 1.02;

        // chair6
        const chair6 = this.add.image(1159, 687, "pizza", "chair6");
        chair6.scaleX = 1.02;
        chair6.scaleY = 1.02;

        // _table3
        const _table3 = this.add.container(1071, 735);

        // table3
        const table3 = this.add.image(0, 0, "pizza", "table3");
        table3.scaleX = 1.02;
        table3.scaleY = 1.02;
        _table3.add(table3);

        // candle3
        const candle3 = this.add.sprite(-3, -79, "pizza", "candle-fire10001");
        candle3.scaleX = 0.5;
        candle3.scaleY = 0.5;
        candle3.setOrigin(0.5104570836561227, 0.7739893594080658);
        _table3.add(candle3);

        // steam
        const steam = this.add.sprite(43, 165, "pizza", "smoke0001");

        // fire
        const fire = this.add.sprite(110, 770, "pizza", "fire0001");
        fire.scaleX = 1.02;
        fire.scaleY = 1.02;

        // counter
        const counter = this.add.container(528, 452.57060422547306);

        // big_table
        const big_table = this.add.image(0, -19.570604225473062, "pizza", "big-table");
        big_table.scaleX = 1.02;
        big_table.scaleY = 1.02;
        counter.add(big_table);

        // book
        const book = this.add.sprite(60, -103, "pizza", "book-hover0001");
        book.scaleX = 1.02;
        book.scaleY = 1.02;
        book.setOrigin(0.4675991955393792, 0.5591682638128761);
        counter.add(book);

        // register
        const register = this.add.sprite(-65, -87, "pizza", "register0001");
        register.scaleX = 1.02;
        register.scaleY = 1.02;
        register.setOrigin(0.5, 0.883859601400003);
        counter.add(register);

        // sign
        this.add.image(381, 32, "pizza", "sign");

        // rectangle_1 (book hover zone)
        const rectangle_1 = this.add.rectangle(593, 361, 140, 40);
        rectangle_1.scaleY = 1.00001;
        rectangle_1.visible = false;
        rectangle_1.fillColor = 65535;
        rectangle_1.fillAlpha = 0.5;

        // rectangle_2 (register hover zone)
        const rectangle_2 = this.add.rectangle(463, 331, 110, 100);
        rectangle_2.scaleY = 1.00001;
        rectangle_2.visible = false;
        rectangle_2.fillColor = 65535;
        rectangle_2.fillAlpha = 0.5;

        // lists
        const sort = [piano, chair1, chair2, chair3, chair4, chair5, chair6, counter, _table3, _table2, _table1, foreground];

        // bead_door (components)
        const bead_doorButton = new Button(bead_door);
        bead_doorButton.spriteName = "bead-door";
        bead_doorButton.pixelPerfect = true;
        const bead_doorShowHint = new ShowHint(bead_door);
        bead_doorShowHint.text = "Pizzatron 3000";
        const bead_doorMoveTo = new MoveTo(bead_door);
        bead_doorMoveTo.x = 384;
        bead_doorMoveTo.y = 405;

        // door (components)
        const doorButton = new Button(door);
        doorButton.spriteName = "door";
        doorButton.pixelPerfect = true;
        const doorMoveTo = new MoveTo(door);
        doorMoveTo.x = 837;
        doorMoveTo.y = 450;

        // candle1 (components)
        const candle1Animation = new Animation(candle1);
        candle1Animation.key = "candle-fire1";
        candle1Animation.end = 14;

        // candle2 (components)
        const candle2Animation = new Animation(candle2);
        candle2Animation.key = "candle-fire1";
        candle2Animation.end = 14;

        // candle3 (components)
        const candle3Animation = new Animation(candle3);
        candle3Animation.key = "candle-fire1";
        candle3Animation.end = 14;

        // steam (components)
        const steamAnimation = new Animation(steam);
        steamAnimation.key = "smoke";
        steamAnimation.end = 5;

        // fire (components)
        const fireAnimation = new Animation(fire);
        fireAnimation.key = "fire";
        fireAnimation.end = 8;

        // book (components)
        const bookHoverAnimation = new HoverAnimation(book);
        bookHoverAnimation.key = "book-hover";
        bookHoverAnimation.end = 16;
        bookHoverAnimation.hoverZone = rectangle_1;

        // register (components)
        const registerHoverAnimation = new HoverAnimation(register);
        registerHoverAnimation.key = "register";
        registerHoverAnimation.checkpoints = "22";
        registerHoverAnimation.end = 42;
        registerHoverAnimation.hoverZone = rectangle_2;

        this.book = book;
        this.rectangle_1 = rectangle_1;
        this.sort = sort;

        this.events.emit("scene-awake");
    }

}

/* END OF COMPILED CODE */
