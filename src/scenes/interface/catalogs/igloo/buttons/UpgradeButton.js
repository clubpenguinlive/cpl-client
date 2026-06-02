import BaseImage from '@scenes/base/BaseImage'

import { Button } from '@components/components'


/* START OF COMPILED CODE */

export default class UpgradeButton extends BaseImage {

    constructor(scene, x, y, texture, frame) {
        super(scene, x ?? 0, y ?? 0, texture || "igloocatalog", frame ?? "upgrade");

        /** @type {number} */
        this.igloo = 0;


        this.setOrigin(0, 0);

        // this (components)
        const thisButton = new Button(this);
        thisButton.spriteName = "upgrade";
        thisButton.callback = () => this.onUpgradeClick();

        /* START-USER-CTR-CODE */
        /* END-USER-CTR-CODE */
    }


    /* START-USER-CODE */

    // Only let players buy igloos that actually have art/scene (a `path` in crumbs). The catalog
    // lists several types that were never implemented in this asset set (e.g. Tree House); those
    // would be bought and then fail to load. Block them with a friendly message instead.
    onUpgradeClick() {
        let igloo = this.crumbs.igloos[this.igloo]

        if (!igloo || !igloo.path) {
            return this.interface.prompt.showError('This igloo isn\'t available yet. Check back soon!', 'Okay', () => {})
        }

        this.interface.prompt.showIgloo(this.igloo)
    }

    /* END-USER-CODE */
}

/* END OF COMPILED CODE */
