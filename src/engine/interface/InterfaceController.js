import BaseScene from '@scenes/base/BaseScene'

import drawFrame from './frame/drawFrame'
import Hint from '@scenes/interface/game/hint/Hint'
import PromptController from './prompt/PromptController'
import WidgetManager from './widget/WidgetManager'
import PaperDollLoader from '@engine/loaders/PaperDollLoader'


const Status = Phaser.Scenes

export default class InterfaceController extends BaseScene {

    goingToSleep = new Set()

    create() {
        this.hint = new Hint(this, 0, 0)
        this.add.existing(this.hint)

        this.prompt = new PromptController(this)

        this.widgets = new WidgetManager(this)
        this.add.existing(this.widgets)

        drawFrame(this)

        // Last scene interacted with
        this.lastScene

        this.paperDollLoader = new PaperDollLoader(this)
    }

    get loading() {
        return this.scene.get('Load')
    }

    get main() {
        return this.scene.get('Main')
    }

    get iglooEdit() {
        return this.scene.get('IglooEdit')
    }

    showLoading(text = '', showBar = false) {
        if (this.scene.isActive(this.loading)) {
            this.loading.setContent(text, showBar)

        } else {
            this.hideInterface()
            this.runScene(this.loading, { text, showBar })
        }
    }

    showInterface() {
        this.hideLoading()
        this.runScene(this.main)
    }

    showIglooEdit() {
        this.runScene(this.iglooEdit)
    }

    hideLoading() {
        this.sleepScene(this.loading)
    }

    hideInterface(clearChat = true) {
        this.closeWidgets()

        this.sleepScene(this.main, { clearChat })
    }

    hideIglooEdit() {
        this.sleepScene(this.iglooEdit)
    }

    runScene(scene, data = {}) {
        if (!scene) return

        const status = this.scene.getStatus(scene)

        if (status < Status.START) {
            this.scene.launch(scene, data)
        } else {
            this.scene.wake(scene, data)
        }

        this.bringToTop(scene)
    }

    sleepScene(scene, data = {}) {
        if (!scene) return

        const status = this.scene.getStatus(scene)

        if (status !== Status.CREATING && status !== Status.RUNNING) {
            return
        }

        // Prevent sleep from being queued multiple times
        if (this.goingToSleep.has(scene)) {
            return
        }

        // A Scene still finishing its own create() can't be trusted to complete a sleep
        // transition cleanly. Wait for it to actually finish booting, then retry once it
        // is RUNNING, rather than putting a half-created Scene to sleep.
        if (status === Status.CREATING) {
            scene.events.once('create', () => this.sleepScene(scene, data))
            return
        }

        this.goingToSleep.add(scene)

        this.armSleepWatchdog(scene, data)

        this.scene.sleep(scene, data)
    }

    // Phaser's Scene Manager queues scene.sleep() for its next internal update and
    // silently drops it, with no 'sleep' event, if the Scene's status has drifted away
    // from CREATING/RUNNING by the time that queued op actually runs. Without a
    // safety net, goingToSleep would wedge permanently on that Scene and every future
    // hideLoading()/sleepScene() call for it would silently no-op for the rest of the
    // session (the classic stuck-loading-spinner bug). Force-clear the guard and retry
    // if 'sleep' hasn't fired shortly after we asked for it.
    armSleepWatchdog(scene, data) {
        const onSleep = () => {
            clearTimeout(watchdog)
            this.goingToSleep.delete(scene)
        }

        scene.events.once('sleep', onSleep)

        const watchdog = setTimeout(() => {
            scene.events.off('sleep', onSleep)
            this.goingToSleep.delete(scene)

            // Re-run the full check: the Scene may already be sleeping (nothing left
            // to do) or may be sleepable again now, in which case this retries cleanly.
            this.sleepScene(scene, data)
        }, 2000)
    }

    bringToTop(scene = null) {
        if (scene) {
            this.scene.bringToTop(scene)
        }

        // Keeps InterfaceController scene always on top
        this.scene.bringToTop()

        this.input.setDefaultCursor('default')
    }

    showEmoteBalloon(id, emote) {
        this.main.balloonFactory.showEmoteBalloon(id, emote)
    }

    showTextBalloon(id, text, addToLog = true) {
        this.main.balloonFactory.showTextBalloon(id, text, addToLog)
    }

    showTourMessage(id, roomId) {
        if (!(roomId in this.crumbs.rooms)) {
            return
        }

        const roomName = this.crumbs.rooms[roomId].key.toLowerCase()
        const message = this.crumbs.tour_messages[roomName]

        if (message) {
            this.showTextBalloon(id, message, false)
        }
    }

    showCard(playerId, username) {
        this.main.playerCard.show(playerId, username)
    }

    /**
     * Refreshes buddy list and player card to reflect changes from the server.
     */
    updateBuddies() {
        if (this.main.scene.isActive()) {
            this.main.playerCard.updateButtons()
            this.main.buddy.showPage()
        }
    }

    refreshPlayerCard() {
        if (this.main.playerCard.visible && this.main.playerCard.id === this.world.client.id) {
            this.main.playerCard.setCoins(this.world.client.coins)
        }
    }

    loadWidget(key, floatingLayer = null) {
        this.widgets.loadWidget(key, floatingLayer)
    }

    removeWidget(widget) {
        this.widgets.removeWidget(widget)
    }

    closeWidgets() {
        this.widgets?.closeWidgets()
    }

    unloadWidgets() {
        this.widgets.unloadWidgets()
    }

    updateCatalogCoins(coins) {
        const books = this.widgets.findWidget(widget => widget.isBook)

        books.forEach(book => {
            if (book.coins) {
                book.setCoins(coins)
            }
        })
    }

    getColor(id) {
        return this.crumbs.colors[id - 1] || this.crumbs.colors[0]
    }

    resetCursor(scene = this) {
        if (!this.lastScene) {
            this.lastScene = scene
            return
        }

        if (this.lastScene == scene) {
            return
        }

        this.lastScene.input._over[0].forEach(gameObject => {
            if (gameObject.input && gameObject.input.enabled) {
                gameObject.emit('pointerout')
            }
        })

        const currentlyOver = scene.input._temp[0]

        // Only reset cursor if currently over has no cursor
        if (!currentlyOver || (currentlyOver.input && !currentlyOver.input.cursor)) {
            scene.input.setDefaultCursor('default')
        }

        this.lastScene.input._over[0] = []

        this.lastScene = scene
    }

}
