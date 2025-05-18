import BaseLoader from './BaseLoader'

import SecretFramesLoader from './SecretFramesLoader'

import adjustRedemptionItem from '@engine/world/penguin/frames/adjustRedemptionItem'


export default class ClothingLoader extends BaseLoader {

    constructor(scene) {
        super(scene)

        this.maxParallelDownloads = 6

        this.baseURL = '/assets/media/clothing/sprites/'
        this.keyPrefix = 'clothing/sprites/'

        this.framesLoader = new SecretFramesLoader(scene)
    }

    loadItem(item, slot, callback) {
        const key = this.getKey(item)

        if (this.checkComplete('json', key, () => {
            this.onFileComplete(item, key, slot, callback)
        })) {
            return
        }

        this.multiatlas(key, `${item}.json`)
    }

    onFileComplete(item, key, slot, callback) {
        if (!this.textureExists(key)) {
            return
        }

        this.memory.register(key)

        const check = adjustRedemptionItem(item)

        // Checks secret frames
        const secretFrames = this.crumbs.itemsToFrames[check]

        if (secretFrames) {
            return this.loadSecretFrames(secretFrames, slot, item, callback)
        }

        callback(slot, item)
    }

    loadSecretFrames(secretFrames, slot, item, callback) {
        this.framesLoader.loadFrames(item, secretFrames, () => {
            callback(slot, item)
        })
    }

}
