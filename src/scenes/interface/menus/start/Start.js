import BaseScene from '@scenes/base/BaseScene'

import { Button, SimpleButton } from '@components/components'


/* START OF COMPILED CODE */

export default class Start extends BaseScene {

    constructor() {
        super("Start");

        /* START-USER-CTR-CODE */
        /* END-USER-CTR-CODE */
    }

    /** @returns {void} */
    create() {

        // bg
        const bg = this.add.image(0, 0, "load", "bg");
        bg.setOrigin(0, 0);

        // startscreen
        this.add.image(760, 420, "start", "startscreen");

        // CPL billboard (cover 1520x960, cropping sides; menu bar drawn on top)
        const cplBillboard = this.add.image(760, 480, "cpl_billboard");
        cplBillboard.setScale(Math.max(1520 / cplBillboard.width, 960 / cplBillboard.height));

        // bottom
        this.add.image(760, 766, "start", "bottom");

        // blog-text
        this.add.image(364, 884, "start", "blog-text");

        // blogButton
        const blogButton = this.add.image(364, 812, "start", "blog");

        // createButton
        const createButton = this.add.image(1115, 777, "start", "create-button");

        // memberButton -- hidden: this is a free server, no "Become a Member" upsell.
        const memberButton = this.add.image(1115, 861, "start", "member-button");
        memberButton.visible = false;

        // penguin_1
        this.add.image(1281, 771, "start", "penguin-1");

        // penguin_2
        this.add.image(1274, 855, "start", "penguin-2");

        // startButton
        const startButton = this.add.sprite(760, 826, "start", "start-button");

        // startText
        this.add.image(760, 826, "start", "start-text");

        // logo
        this.add.image(760, 682, "start", "logo");

        // blogButton (components)
        const blogButtonSimpleButton = new SimpleButton(blogButton);
        blogButtonSimpleButton.callback = () => this.onBlogClick();

        // createButton (components)
        const createButtonButton = new Button(createButton);
        createButtonButton.spriteName = "create-button";
        createButtonButton.callback = () => this.onCreateClick();
        createButtonButton.activeFrame = false;

        // memberButton (components)
        const memberButtonButton = new Button(memberButton);
        memberButtonButton.spriteName = "member-button";
        memberButtonButton.activeFrame = false;

        // startButton (components)
        const startButtonButton = new Button(startButton);
        startButtonButton.spriteName = "start-button";
        startButtonButton.callback = () => this.onStartClick();

        this.events.emit("scene-awake");

        // Zero-click auto-login: if this device has a saved penguin with a persistent
        // token, log straight into the world without showing the start/login screens.
        this.tryAutoLogin()
    }

    /* START-USER-CODE */

    onBlogClick() {

    }

    onStartClick() {
        if (this.network.isSavedPenguins) return this.scene.start('PenguinSelect')

        this.scene.start('Login')
    }

    // Returns true if it kicked off an auto-login (or routed to the picker).
    tryAutoLogin() {
        if (!this.network.isSavedPenguins) return false

        let withToken = Object.values(this.network.savedPenguins).filter(p => p && p.token)
        if (withToken.length === 0) return false

        // More than one remembered penguin: let the player choose (picker fallback).
        if (withToken.length > 1) {
            this.scene.start('PenguinSelect')
            return true
        }

        let penguin = withToken[0]
        let token = this.network.getToken(penguin.username)
        if (!token) return false

        // No prior login scene; a failed/expired token falls back to the Login screen.
        this.network.lastLoginScene = null
        this.interface.showLoading(`Logging in ${penguin.username}`)
        this.network.connectLogin(true, true, () => {
            this.network.send('token_login', { username: penguin.username, token: token })
        })

        // Stop the Start scene so its (now hidden) START / Create buttons can't be
        // clicked through to log the player out once they are in the world.
        this.scene.stop()

        return true
    }

    onCreateClick() {
        window.location.href = '/create'
    }

    /* END-USER-CODE */
}

/* END OF COMPILED CODE */
