import BaseScene from '@scenes/base/BaseScene'

import ClientController from './penguin/ClientController'
import ClothingLoader from '@engine/loaders/ClothingLoader'
import PenguinFactory from './penguin/PenguinFactory'
import RoomManager from './room/RoomManager'


export default class WorldController extends BaseScene {

    constructor(key) {
        super(key)

        this.client = null

        this.rooms = null
        this.penguinFactory = null
        this.clothingLoader = null

        this.lastRoom = null

        this.secretFramesCache = {}

        this.worldTimeZone = 'America/Los_Angeles'
    }

    get room() {
        return this.rooms.room
    }

    create() {
        this.rooms = new RoomManager(this)
        this.penguinFactory = new PenguinFactory(this)
        this.clothingLoader = new ClothingLoader(this)
    }

    setClient(args) {
        this.client = new ClientController(this, args)
    }

    joinRoom(roomId, users) {
        this.enterFullscreen()
        this.updateLastRoom()
        this.rooms.joinRoom(roomId, users)
    }

    joinIgloo(args) {
        this.enterFullscreen()
        this.updateLastRoom()
        this.rooms.joinIgloo(args)
    }

    joinGameRoom(gameId) {
        this.enterFullscreen()
        this.updateLastRoom()
        this.rooms.joinGameRoom(gameId)
    }

    // Once the player is actually in a world, hide the website chrome and let the
    // canvas fill the viewport. The start/login screen stays framed with the nav visible.
    enterFullscreen() {
        if (typeof document === 'undefined') {
            return
        }

        // Idempotent class add, but refit on EVERY room join. A later room that didn't refit
        // renders letterboxed/framed even though cpl-playing is set. The deferred refresh
        // covers the first-join race where the CSS size change hasn't flushed yet.
        document.body.classList.add('cpl-playing')
        this.scale.refresh()
        setTimeout(() => this.scale.refresh(), 60)
    }

    updateLastRoom() {
        if (this.room?.id in this.crumbs.rooms) {
            this.lastRoom = this.room.id
        }
    }

    createPenguins(penguins, room) {
        return this.penguinFactory.createPenguins(penguins, room)
    }

    addPenguin(user) {
        // If room isn't ready then user gets added into waiting array
        if (!this.room.isReady && !this.room.getWaiting(user.id)) {
            return this.room.waiting.push(user)
        }

        if (!(user.id in this.room.penguins)) {
            const penguin = this.penguinFactory.createPenguin(user, this.room)

            this.room.addPenguin(user.id, penguin)
        }
    }

    removePenguin(id) {
        if (!this.room.isReady) {
            return this.room.removeWaiting(id)
        }

        this.room.removePenguin(id)
    }

    getRelationship(id) {
        if (id == this.client.id) return 'player'

        if (this.isBuddy(id)) {
            return this.isOnline(id) ? 'online' : 'offline'
        }

        if (this.isIgnore(id)) return 'ignore'

        return 'none'
    }

    isBuddy(id) {
        const buddiesFlat = this.client.buddies.map(buddy => buddy.id)

        return buddiesFlat.includes(id)
    }

    isIgnore(id) {
        const ignoresFlat = this.client.ignores.map(ignore => ignore.id)

        return ignoresFlat.includes(id)
    }

    isOnline(id) {
        const buddy = this.client.buddies.find(obj => obj.id == id)

        return buddy.online
    }

    isClientUsername(username) {
        return username.toLowerCase() === this.client.penguin.username.toLowerCase()
    }

    getColor(id) {
        return this.interface.getColor(id)
    }

    getWorldTime() {
        return new Date(new Date().toLocaleString('en-US', { timeZone: this.worldTimeZone }))
    }

}
