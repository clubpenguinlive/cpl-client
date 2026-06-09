/* START OF COMPILED CODE */

import BaseScene from "../../../base/BaseScene";
import Interactive from "../../../components/Interactive";
import Button from "../../../components/Button";
import ShowHint from "../../../components/ShowHint";
import ChatLog from "../chatlog/ChatLog";
import SimpleButton from "../../../components/SimpleButton";
import MailButton from "./buttons/mail/MailButton";
import StampPopup from "../stamps/StampPopup";
import Phone from "../phone/Phone";
import Waddle from "../waddle/Waddle";
import Buddy from "../buddy/Buddy";
import PetCard from "../pet/PetCard";
import PlayerCard from "../playercard/PlayerCard";
import ActionsMenu from "../floating/actions/ActionsMenu";
import EmotesMenu from "../floating/emotes/EmotesMenu";
import Safe from "../floating/safe/Safe";
import Moderator from "../moderator/Moderator";
import Settings from "../settings/Settings";
import Mail from "../mail/Mail";
import Mailbook from "../mailbook/Mailbook";
/* START-USER-IMPORTS */

import TextInput from '@engine/interface/text/TextInput'

import BalloonFactory from '@engine/interface/balloons/BalloonFactory'
import SnowballFactory from '@engine/interface/snowball/SnowballFactory'

/* END-USER-IMPORTS */

export default class Main extends BaseScene {

    constructor() {
        super("Main");

        /** @type {Phaser.GameObjects.Image} */
        this.popup;
        /** @type {Phaser.GameObjects.Text} */
        this.popupText;
        /** @type {Phaser.GameObjects.Container} */
        this.onlinePopup;
        /** @type {ChatLog} */
        this.chatLog;
        /** @type {Phaser.GameObjects.Image} */
        this.crosshair;
        /** @type {Phaser.GameObjects.Sprite} */
        this.phone_button;
        /** @type {Phaser.GameObjects.Image} */
        this.request_button;
        /** @type {MailButton} */
        this.mailButton;
        /** @type {Phaser.GameObjects.Sprite} */
        this.mod_m;
        /** @type {Phone} */
        this.phone;
        /** @type {Waddle} */
        this.waddle;
        /** @type {Buddy} */
        this.buddy;
        /** @type {PetCard} */
        this.petCard;
        /** @type {PlayerCard} */
        this.playerCard;
        /** @type {Phaser.GameObjects.Layer} */
        this.widgetLayer;
        /** @type {ActionsMenu} */
        this.actionsMenu;
        /** @type {EmotesMenu} */
        this.emotesMenu;
        /** @type {Safe} */
        this.safe;
        /** @type {Moderator} */
        this.moderator;
        /** @type {Settings} */
        this.settings;
        /** @type {Mail} */
        this.mail;
        /** @type {Mailbook} */
        this.mailbook;
        /** @type {Array<Settings|Moderator|PlayerCard|PetCard|Buddy|Waddle|Phone>} */
        this.hideOnSleep;


        /* START-USER-CTR-CODE */
        /* END-USER-CTR-CODE */
    }

    /** @returns {void} */
    _create() {

        // dock
        const dock = this.add.image(760, 916, "main", "dock");

        // chat_box
        const chat_box = this.add.image(748, 923, "main", "chat-box");

        // chat_button
        const chat_button = this.add.image(246, 923, "main", "blue-button");

        // chat_icon
        this.add.image(246, 921, "main", "chat-icon");

        // emote_button
        const emote_button = this.add.image(306, 923, "main", "blue-button");

        // emote_icon
        this.add.image(306, 921, "main", "emote-icon");

        // action_button
        const action_button = this.add.image(366, 923, "main", "blue-button");

        // action_icon
        this.add.image(366, 919, "main", "action-icon");

        // snowball_button
        const snowball_button = this.add.image(426, 923, "main", "blue-button");

        // snowball_icon
        this.add.image(426, 922, "main", "snowball-icon");

        // chat_send_button
        const chat_send_button = this.add.image(1026, 923, "main", "blue-button");

        // chat_send_icon
        this.add.image(1026, 921, "main", "chat-icon");

        // player_button
        const player_button = this.add.image(1086, 923, "main", "blue-button");

        // badge_member
        this.add.image(1086, 921, "main", "badge-member");

        // buddies_button
        const buddies_button = this.add.image(1146, 923, "main", "blue-button");

        // buddies_icon
        this.add.image(1146, 921, "main", "buddies-icon");

        // igloo_button
        const igloo_button = this.add.image(1206, 923, "main", "blue-button");

        // igloo_icon
        this.add.image(1206, 921, "main", "igloo-icon");

        // help_button
        const help_button = this.add.image(1266, 923, "main", "blue-button");

        // help_icon
        this.add.image(1266, 921, "main", "help-icon");

        // onlinePopup
        const onlinePopup = this.add.container(1155, 849);
        onlinePopup.visible = false;

        // popup
        const popup = this.add.image(0, 11, "main", "buddy-online");
        onlinePopup.add(popup);

        // popupText
        const popupText = this.add.text(-6, 0, "", {});
        popupText.setOrigin(0.5, 0.5);
        popupText.setStyle({ "align": "center", "color": "#000000", "fixedWidth":380,"fontFamily": "Arial", "fontSize": "24px" });
        onlinePopup.add(popupText);

        // chatLog
        const chatLog = new ChatLog(this, 760, 12);
        this.add.existing(chatLog);

        // crosshair
        const crosshair = this.add.image(0, 1100, "main", "crosshair");
        crosshair.visible = false;

        // map_button
        const map_button = this.add.sprite(96, 880, "main", "map-button");

        // phone_button
        const phone_button = this.add.sprite(96, 757, "main", "phone-button");
        phone_button.setOrigin(0.5, 0.504424778761062);

        // request_button
        const request_button = this.add.image(276, 71, "main", "buddy-button");
        request_button.visible = false;

        // mailButton
        const mailButton = new MailButton(this, 176, 58);
        this.add.existing(mailButton);

        // news_button
        const news_button = this.add.image(76, 70, "main", "news-button");

        // mod_button
        const mod_button = this.add.image(1426, 78, "main", "mod/button");

        // mod_m
        const mod_m = this.add.sprite(1426, 78, "main", "mod/m");

        // widgetLayer
        const widgetLayer = this.add.layer();

        // phone
        const phone = new Phone(this, 285, 401);
        phone.visible = false;
        widgetLayer.add(phone);

        // waddle
        const waddle = new Waddle(this, 1104, 332);
        waddle.visible = false;
        widgetLayer.add(waddle);

        // buddy
        const buddy = new Buddy(this, 1144, 444);
        buddy.visible = false;
        widgetLayer.add(buddy);

        // petCard
        const petCard = new PetCard(this, 484, 444);
        petCard.visible = false;
        widgetLayer.add(petCard);

        // playerCard
        const playerCard = new PlayerCard(this, 444, 444);
        playerCard.visible = false;
        widgetLayer.add(playerCard);

        // actionsMenu
        const actionsMenu = new ActionsMenu(this, 366, 864);
        this.add.existing(actionsMenu);
        actionsMenu.visible = false;

        // emotesMenu
        const emotesMenu = new EmotesMenu(this, 306, 864);
        this.add.existing(emotesMenu);
        emotesMenu.visible = false;

        // safe
        const safe = new Safe(this, 246, 925);
        this.add.existing(safe);
        safe.visible = false;

        // moderator
        const moderator = new Moderator(this, 760, 480);
        this.add.existing(moderator);
        moderator.visible = false;

        // settings
        const settings = new Settings(this, 760, 480);
        this.add.existing(settings);
        settings.visible = false;

        // mail
        const mail = new Mail(this);
        this.add.existing(mail);
        mail.visible = false;

        // mailbook
        const mailbook = new Mailbook(this);
        this.add.existing(mailbook);
        mailbook.visible = false;

        // lists
        const hideOnSleep = [settings, moderator, playerCard, petCard, buddy, waddle, phone];

        // dock (components)
        new Interactive(dock);

        // chat_box (components)
        new Interactive(chat_box);

        // chat_button (components)
        const chat_buttonButton = new Button(chat_button);
        chat_buttonButton.spriteName = "blue-button";
        chat_buttonButton.callback = () => this.safe.visible = true;
        const chat_buttonShowHint = new ShowHint(chat_button);
        chat_buttonShowHint.text = "safe_hint";

        // emote_button (components)
        const emote_buttonButton = new Button(emote_button);
        emote_buttonButton.spriteName = "blue-button";
        emote_buttonButton.callback = () => this.emotesMenu.visible = true;
        const emote_buttonShowHint = new ShowHint(emote_button);
        emote_buttonShowHint.text = "emote_hint";

        // action_button (components)
        const action_buttonButton = new Button(action_button);
        action_buttonButton.spriteName = "blue-button";
        action_buttonButton.callback = () => this.actionsMenu.visible = true;
        const action_buttonShowHint = new ShowHint(action_button);
        action_buttonShowHint.text = "action_hint";

        // snowball_button (components)
        const snowball_buttonButton = new Button(snowball_button);
        snowball_buttonButton.spriteName = "blue-button";
        snowball_buttonButton.callback = () => this.onSnowballClick();
        const snowball_buttonShowHint = new ShowHint(snowball_button);
        snowball_buttonShowHint.text = "throw_hint";

        // chat_send_button (components)
        const chat_send_buttonButton = new Button(chat_send_button);
        chat_send_buttonButton.spriteName = "blue-button";
        chat_send_buttonButton.callback = () => this.onChatSend();
        const chat_send_buttonShowHint = new ShowHint(chat_send_button);
        chat_send_buttonShowHint.text = "send_hint";

        // player_button (components)
        const player_buttonButton = new Button(player_button);
        player_buttonButton.spriteName = "blue-button";
        player_buttonButton.callback = () => this.onPlayerClick();
        const player_buttonShowHint = new ShowHint(player_button);
        player_buttonShowHint.text = "player_hint";

        // buddies_button (components)
        const buddies_buttonButton = new Button(buddies_button);
        buddies_buttonButton.spriteName = "blue-button";
        buddies_buttonButton.callback = () => this.onBuddyClick();
        const buddies_buttonShowHint = new ShowHint(buddies_button);
        buddies_buttonShowHint.text = "buddy_hint";

        // igloo_button (components)
        const igloo_buttonButton = new Button(igloo_button);
        igloo_buttonButton.spriteName = "blue-button";
        igloo_buttonButton.callback = () => this.onIglooClick();
        const igloo_buttonShowHint = new ShowHint(igloo_button);
        igloo_buttonShowHint.text = "home_hint";

        // help_button (components)
        const help_buttonButton = new Button(help_button);
        help_buttonButton.spriteName = "blue-button";
        help_buttonButton.callback = () => this.settings.visible = true;
        const help_buttonShowHint = new ShowHint(help_button);
        help_buttonShowHint.text = "help_hint";

        // crosshair (components)
        const crosshairSimpleButton = new SimpleButton(crosshair);
        crosshairSimpleButton.callback = () => this.onCrosshairClick();

        // map_button (components)
        const map_buttonButton = new Button(map_button);
        map_buttonButton.spriteName = "map-button";
        map_buttonButton.callback = () => this.onMapClick();
        map_buttonButton.activeFrame = false;

        // phone_button (components)
        const phone_buttonButton = new Button(phone_button);
        phone_buttonButton.spriteName = "phone-button";
        phone_buttonButton.callback = () => this.onPhoneClick();
        phone_buttonButton.activeFrame = false;

        // request_button (components)
        const request_buttonButton = new Button(request_button);
        request_buttonButton.spriteName = "buddy-button";
        request_buttonButton.callback = () => this.onRequestClick();
        request_buttonButton.activeFrame = false;

        // news_button (components)
        const news_buttonButton = new Button(news_button);
        news_buttonButton.spriteName = "news-button";
        news_buttonButton.activeFrame = false;
        news_buttonButton.callback = () => this.onSkillsKey();
        // Reskin the (otherwise unused) newspaper as a Skills button. Button reverts the sprite
        // frame on hover/click, so hide the sprite (alpha 0 stays clickable) and overlay a star.
        news_button.setAlpha(0);
        this.addSkillsIcon(76, 70);

        // mod_button (components)
        const mod_buttonSimpleButton = new SimpleButton(mod_button);
        mod_buttonSimpleButton.hoverCallback = () => this.onModOver();
        mod_buttonSimpleButton.hoverOutCallback = () => this.onModOut();
        mod_buttonSimpleButton.callback = () => this.onModClick();

        this.popup = popup;
        this.popupText = popupText;
        this.onlinePopup = onlinePopup;
        this.chatLog = chatLog;
        this.crosshair = crosshair;
        this.phone_button = phone_button;
        this.request_button = request_button;
        this.mailButton = mailButton;
        this.mod_m = mod_m;
        this.phone = phone;
        this.waddle = waddle;
        this.buddy = buddy;
        this.petCard = petCard;
        this.playerCard = playerCard;
        this.widgetLayer = widgetLayer;
        this.actionsMenu = actionsMenu;
        this.emotesMenu = emotesMenu;
        this.safe = safe;
        this.moderator = moderator;
        this.settings = settings;
        this.mail = mail;
        this.mailbook = mailbook;
        this.hideOnSleep = hideOnSleep;

        // Mobile only: enlarge the bottom-toolbar buttons' touch/hit areas so taps register more
        // reliably on a phone. Visual layout is UNCHANGED (the icons stay the same size/place); we
        // only widen the hit zone to fill the inter-button gap and extend it down into the bottom
        // margin. Desktop (fine pointer) keeps the default 56x56 hit area, so it's byte-for-byte
        // unchanged. NOTE: the buttons are only 60px apart, so making them visually thumb-sized
        // needs the reserved toolbar relayout - this is the safe, no-overlap part.
        if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
            for (const btn of [chat_button, emote_button, action_button, snowball_button,
                               chat_send_button, player_button, buddies_button, igloo_button, help_button]) {
                const w = btn.width, h = btn.height
                btn.setInteractive(new Phaser.Geom.Rectangle(-2, -4, w + 4, h + 40), Phaser.Geom.Rectangle.Contains)
            }
        }

        this.events.emit("scene-awake");
    }


    /* START-USER-CODE */

    create() {
        this._create()

        this.events.on('sleep', this.onSleep, this)
        this.events.on('wake', this.onWake, this)

        // Widgets

        this.setupWidgets()

        // Mail

        this.updateMailCount()

        // Factories

        this.balloonFactory = new BalloonFactory(this)
        this.snowballFactory = new SnowballFactory(this.world)

        // Hints

        this.hideOnSleep.push(this.interface.hint)

        // Buddy requests

        this.requests = []

        // Secret agent

        this.showPhone()

        // Chat input

        let style = {
            width: 510,
            height: 50,
            fontFamily: 'Burbank Small',
            fontSize: 24,
            color: '#fff'
        }

        this.chatInput = new TextInput(this, 745, 923, 'text', style, () => this.onChatSend(), 48)
        this.add.existing(this.chatInput)

        // Input

        this.input.keyboard.on('keydown-TAB', (event) => this.onChatKeyDown(event))
        this.input.keyboard.on('keydown-ENTER', (event) => this.onChatKeyDown(event))
        this.input.keyboard.on('keydown-ESC', () => this.onEscapeKey())
        this.input.keyboard.on('keydown-M', () => this.onMapKey())
        this.input.keyboard.on('keydown-P', () => this.onPlayerCardKey())
        this.input.keyboard.on('keydown-K', () => this.onSkillsKey())
        this.input.keyboard.on('keydown-J', () => this.onChallengesKey())

        // Skills (K) + Daily Challenges (J) + Stamp Book (B) openers, top-left. Tappable for mobile too.
        const challengesIcon = this.addChallengesIcon(76, 165)
        challengesIcon.setInteractive({ useHandCursor: true })
        challengesIcon.on('pointerdown', () => this.onChallengesKey())

        this.input.keyboard.on('keydown-B', () => this.onStampsKey())
        const stampIcon = this.addStampIcon(76, 260)
        stampIcon.setInteractive({ useHandCursor: true })
        stampIcon.on('pointerdown', () => this.onStampsKey())

        // Stamp-earned notifications, persistent while in-world.
        this.stampPopup = new StampPopup(this)
        this.add.existing(this.stampPopup)
    }

    onMapKey() {
        // M toggles the island map (the Map widget)
        const widgets = this.interface.widgets
        if (widgets.keyActive('Map')) {
            widgets.getWidget('Map').close()
        } else {
            this.onMapClick()
        }
    }

    addSkillsIcon(x, y) {
        const key = 'cpl-skills-btn'
        if (!this.textures.exists(key)) {
            const g = this.make.graphics({ add: false })
            const cx = 45, cy = 42, r = 36
            g.fillStyle(0x0e406f, 1).fillCircle(cx, cy + 3, r)
            g.fillStyle(0x1c6bb0, 1).fillCircle(cx, cy, r)
            g.fillStyle(0x3f93d4, 0.5).fillEllipse(cx, cy - 12, r * 1.5, r)
            g.lineStyle(5, 0xffffff, 1).strokeCircle(cx, cy, r)
            const pts = this.starPoints(cx, cy, 5, 23, 10.5)
            g.fillStyle(0xffce3d, 1).fillPoints(pts, true)
            g.lineStyle(4, 0x5a3a12, 1).strokePoints(pts, true, true)
            g.generateTexture(key, 90, 84)
            g.destroy()
        }
        const icon = this.add.image(x, y, key)
        icon.setDepth(2)
        return icon
    }

    starPoints(cx, cy, points, outer, inner) {
        const pts = []
        for (let i = 0; i < points * 2; i++) {
            const rad = i % 2 === 0 ? outer : inner
            const a = (Math.PI / points) * i - Math.PI / 2
            pts.push({ x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad })
        }
        return pts
    }

    onSkillsKey() {
        // K toggles the Skills panel
        const widgets = this.interface.widgets
        if (widgets.keyActive('SkillsWidget')) {
            const w = widgets.getWidget('SkillsWidget')
            if (w && w.onClose) w.onClose()
        } else {
            this.interface.loadWidget('SkillsWidget')
        }
    }

    onChallengesKey() {
        // J toggles the Daily Challenges panel
        const widgets = this.interface.widgets
        if (widgets.keyActive('ChallengesPanel')) {
            const w = widgets.getWidget('ChallengesPanel')
            if (w && w.onClose) w.onClose()
        } else {
            this.interface.loadWidget('ChallengesPanel')
        }
    }

    // Top-left opener: blue medallion with a gold check (sibling to the Skills star).
    addChallengesIcon(x, y) {
        const key = 'cpl-challenges-btn'
        if (!this.textures.exists(key)) {
            const g = this.make.graphics({ add: false })
            const cx = 45, cy = 42, r = 36
            g.fillStyle(0x0e406f, 1).fillCircle(cx, cy + 3, r)
            g.fillStyle(0x1c6bb0, 1).fillCircle(cx, cy, r)
            g.fillStyle(0x3f93d4, 0.5).fillEllipse(cx, cy - 12, r * 1.5, r)
            g.lineStyle(5, 0xffffff, 1).strokeCircle(cx, cy, r)
            g.lineStyle(9, 0xffce3d, 1)
            g.beginPath()
            g.moveTo(cx - 17, cy + 1)
            g.lineTo(cx - 5, cy + 15)
            g.lineTo(cx + 18, cy - 16)
            g.strokePath()
            g.generateTexture(key, 90, 84)
            g.destroy()
        }
        const icon = this.add.image(x, y, key)
        icon.setDepth(2)
        return icon
    }

    onStampsKey() {
        // B toggles the Stamp Book
        const widgets = this.interface.widgets
        if (widgets.keyActive('StampBook')) {
            const w = widgets.getWidget('StampBook')
            if (w && w.onClose) w.onClose()
        } else {
            this.interface.loadWidget('StampBook')
        }
    }

    // Top-left opener: blue medallion with a gold postage-stamp.
    addStampIcon(x, y) {
        const key = 'cpl-stamp-btn'
        if (!this.textures.exists(key)) {
            const g = this.make.graphics({ add: false })
            const cx = 45, cy = 42, r = 36
            g.fillStyle(0x0e406f, 1).fillCircle(cx, cy + 3, r)
            g.fillStyle(0x1c6bb0, 1).fillCircle(cx, cy, r)
            g.fillStyle(0x3f93d4, 0.5).fillEllipse(cx, cy - 12, r * 1.5, r)
            g.lineStyle(5, 0xffffff, 1).strokeCircle(cx, cy, r)
            g.fillStyle(0xffce3d, 1).fillRoundedRect(cx - 16, cy - 16, 32, 32, 5)
            g.fillStyle(0x1c6bb0, 1).fillCircle(cx, cy, 8)
            g.generateTexture(key, 90, 84)
            g.destroy()
        }
        const icon = this.add.image(x, y, key)
        icon.setDepth(2)
        return icon
    }

    onPlayerCardKey() {
        // P toggles your own player card
        const id = this.world.client.id
        if (this.playerCard.visible && this.playerCard.id === id) {
            this.playerCard.visible = false
        } else {
            this.playerCard.show(id, this.world.client.username)
        }
    }

    onEscapeKey() {
        // Mirror clicking a menu X button: close the topmost open widget/menu.
        const widgets = this.interface.widgets?.activeWidgetObjects ?? []
        if (widgets.length) {
            this.interface.closeWidgets()
            return
        }

        for (const menu of [this.settings, this.playerCard, this.moderator, this.mail, this.mailbook, this.buddy]) {
            if (menu && menu.visible) {
                menu.visible = false
                return
            }
        }
    }

    onSleep(sys, data) {
        if (data.clearChat) {
            this.chatInput.clearText()
            this.chatLog.clearMessages()
        }

        if (this.chatLog.open) {
            this.chatLog.onTabClick()
        }

        this.stopCrosshair()

        this.interface.prompt.hideAll()

        for (let item of this.hideOnSleep) {
            item.close()
        }
    }

    onWake() {
        this.showPhone()
    }

    setupWidgets() {
        for (let widget of this.widgetLayer.list) {
            widget.floatingLayer = this.widgetLayer
        }
    }

    addToWidgetLayer(widget) {
        this.widgetLayer.add(widget)
        this.setupWidget(widget)
    }

    updateMailCount() {
        this.mailButton?.updateMailCount()
    }

    showPhone() {
        this.phone_button.visible = this.world.client?.isSecretAgent
    }

    onSnowballClick() {
        this.crosshair.visible = true
        this.crosshair.x = Math.round(this.input.x)
        this.crosshair.y = Math.round(this.input.y)
    }

    onCrosshairMove(pointer) {
        this.crosshair.x = Math.round(pointer.x)
        this.crosshair.y = Math.round(pointer.y)
    }

    onCrosshairClick() {
        this.stopCrosshair()
        this.world.client.sendSnowball(this.crosshair.x, this.crosshair.y)
    }

    stopCrosshair() {
        this.crosshair.visible = false
    }

    onChatKeyDown(event) {
        // Prevent default to stop tab switching elements
        event.preventDefault()

        this.chatInput.setFocus()
    }

    onChatSend() {
        let text = this.chatInput.text

        this.chatInput.clearText()

        this.interface.showTextBalloon(this.world.client.id, text)
        this.network.send('send_message', { message: text })
    }

    onPlayerClick() {
        this.interface.showCard(this.world.client.id, this.world.client.penguin.username)
    }

    onBuddyClick() {
        this.buddy.show()
    }

    onIglooClick() {
        this.world.client.sendJoinIgloo(this.world.client.id)
    }

    onRequestClick() {
        let request = this.requests.shift()
        if (this.requests.length < 1) this.request_button.visible = false
        if (!request) return

        if (request.requester) {
            // Show buddy accept prompt
            this.showAccept(request)
        } else {
            // Show buddy request prompt
            this.showRequest(request)
        }
    }

    showAccept(request) {
        let text = `${request.username} is now your buddy!`

        this.interface.prompt.showWindow(text, 'single')
    }

    showRequest(request) {
        let text = `${request.username} has asked to be your buddy.\nDo you accept?`

        this.interface.prompt.showWindow(text, 'dual', () => {
            this.network.send('buddy_accept', { id: request.id })
            this.interface.prompt.window.visible = false

        }, () => {
            this.network.send('buddy_reject', { id: request.id })
            this.interface.prompt.window.visible = false
        })
    }

    addRequest(request) {
        // Prevent duplicate requests
        if (this.requests.some(item => item.id == request.id && !item.requester)) return

        this.requests.push(request)

        this.request_button.visible = true
        this.bounce(this.request_button)
    }

    showOnlinePopup(username) {
        let text = `${username} is online`
        let texture = (text.length > 18) ? 'buddy-online-large' : 'buddy-online'

        this.popupText.text = text
        this.popup.setTexture('main', texture)

        this.onlinePopup.visible = true
        this.bounce(this.onlinePopup, 20)

        // Hide popup after 10 seconds
        this.time.addEvent({
            delay: 10000,
            callback: () => this.onlinePopup.visible = false
        })
    }

    bounce(gameObject, from = -100) {
        if (!gameObject.startY) gameObject.startY = gameObject.y

        this.tweens.add({
            targets: gameObject,
            y: {
                from: gameObject.startY + from,
                to: gameObject.startY
            },
            ease: 'Bounce',
            duration: 200
        })
    }

    onModOver() {
        this.mod_m.play('mod_button')
    }

    onModOut() {
        this.mod_m.stop()
        this.mod_m.setFrame('mod/m')
    }

    onModClick() {
        this.onModOut()
        this.moderator.visible = true
    }

    onPhoneClick() {
        this.phone.show()
    }

    onMapClick() {
        this.interface.loadWidget('Map')
    }

    /* END-USER-CODE */
}

/* END OF COMPILED CODE */
