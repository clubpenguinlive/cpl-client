/* START OF COMPILED CODE */

import BaseContainer from "../../../../../base/BaseContainer";
import Button from "../../../../../components/Button";
import MailNotification from "./MailNotification";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class MailButton extends BaseContainer {

    constructor(scene, x, y) {
        super(scene, x ?? 0, y ?? 0);

        /** @type {MailNotification} */
        this.notification;


        // button
        const button = scene.add.image(0, 0, "main", "mail-button");
        // mail-button is a trimmed atlas frame: a 90x98 source whose visible envelope
        // content is only 90x73, offset 25px down from the top. setDisplaySize scaled the
        // padded frame, which pushed the envelope ~11px below the icon origin (off the row
        // baseline shared by the three round toolbar icons) and left the base scale != 1 so
        // the hover tweens (which reset to scale 1) resized it. Anchor the origin on the
        // content's centre instead and keep base scale 1: the envelope now sits ~73px tall,
        // centred on the same baseline as the round buttons.
        button.setOrigin(0.5, (25 + 73 / 2) / 98);
        this.add(button);

        // notification
        const notification = new MailNotification(scene, 30, -33);
        notification.visible = false;
        this.add(notification);

        // button (components)
        const buttonButton = new Button(button);
        buttonButton.spriteName = "mail-button";
        buttonButton.callback = () => scene.mail.show();
        buttonButton.activeFrame = false;

        this.notification = notification;

        /* START-USER-CTR-CODE */

        this.lastUnreadCount = 0

        // Hover and press tweens
        button.setInteractive({ useHandCursor: true })
        button.on('pointerover', () => {
            scene.tweens.killTweensOf(button)
            scene.tweens.add({
                targets: button,
                scaleX: 1.08, scaleY: 1.08,
                duration: 100,
                ease: 'Quad.Out'
            })
        })
        button.on('pointerout', () => {
            scene.tweens.killTweensOf(button)
            scene.tweens.add({
                targets: button,
                scaleX: 1, scaleY: 1,
                duration: 120,
                ease: 'Back.Out'
            })
        })
        button.on('pointerdown', () => {
            scene.tweens.killTweensOf(button)
            scene.tweens.add({
                targets: button,
                scaleX: 0.93, scaleY: 0.93,
                duration: 80,
                ease: 'Quad.Out'
            })
        })
        button.on('pointerup', () => {
            scene.tweens.killTweensOf(button)
            scene.tweens.add({
                targets: button,
                scaleX: 1.05, scaleY: 1.05,
                duration: 80,
                ease: 'Quad.Out',
                onComplete: () => {
                    scene.tweens.add({
                        targets: button,
                        scaleX: 1, scaleY: 1,
                        duration: 120,
                        ease: 'Back.Out'
                    })
                }
            })
        })

        /* END-USER-CTR-CODE */
    }


    /* START-USER-CODE */

    updateMailCount() {
        this.notification.updateMailCount()

        const unreadCount = this.world.client.unreadMailCount

        // Only bounce on new mail
        if (unreadCount > this.lastUnreadCount) {
            this.scene.bounce(this)
        }

        this.lastUnreadCount = unreadCount
    }

    /* END-USER-CODE */
}

/* END OF COMPILED CODE */
