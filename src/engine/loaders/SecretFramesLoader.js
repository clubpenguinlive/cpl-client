import BaseLoader from './BaseLoader'


export default class SecretFramesLoader extends BaseLoader {

    constructor(scene) {
        super(scene)

        this.baseURL = '/assets/media/penguin/actions/'
        this.keyPrefix = 'secret_frames/'

        // Track current loading items
        this.currentItems = {}
    }

    loadFrames(itemId, frames, callback) {
        if (itemId in this.currentItems) {
            this.addItemCallback(itemId, callback)
            return
        }

        this.trackItem(itemId, frames.length, callback)

        for (let frame of frames) {
            this.loadFrame(frame, itemId)
        }

        this.start()
    }

    loadFrame(frame, itemId) {
        const key = this.getKey(frame)

        if (this.checkComplete('json', key, () => {
            this.onFrameComplete(itemId)
        })) {
            return
        }

        this.multiatlas(key, `${frame}.json`)
    }

    onFrameComplete(itemId) {
        this.currentItems[itemId].remaining--

        if (this.currentItems[itemId].remaining < 1) {
            // All frames loaded for item
            this.runCallbacks(itemId)

            delete this.currentItems[itemId]
        }
    }

    trackItem(itemId, framesCount, callback) {
        this.currentItems[itemId] = {
            remaining: framesCount,
            callbacks: [callback]
        }
    }

    addItemCallback(itemId, callback) {
        if (!(itemId in this.currentItems)) {
            return
        }

        this.currentItems[itemId].callbacks.push(callback)
    }

    runCallbacks(itemId) {
        for (const callback of this.currentItems[itemId].callbacks) {
            callback()
        }
    }

}
