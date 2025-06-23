import BaseScene from '@scenes/base/BaseScene'

import AnimTracker from './tracker/AnimTracker'
import TextureTracker from './tracker/TextureTracker'


const cleanupDelay = 10000

export default class MemoryManager extends BaseScene {

    registered = {}

    animTracker = new AnimTracker()
    textureTracker = new TextureTracker()

    create() {
        this.anims.on('add', (_, anim) => this.trackAnim(anim))
        this.anims.on('remove', (_, anim) => this.untrackAnim(anim))

        this.time.addEvent({
            delay: cleanupDelay,
            callback: () => this.cleanup(),
            loop: true
        })
    }

    cleanup() {
        this.collectUsedTextures()

        for (const key in this.registered) {
            this.cleanupCheck(key, this.registered[key])
        }
    }

    trackAnim(anim) {
        this.animTracker.track(anim)
    }

    untrackAnim(anim) {
        this.animTracker.untrack(anim)
    }

    trackGameObject(gameObject) {
        this.textureTracker.track(gameObject)
    }

    cleanupCheck(key, asset) {
        const setStale = !this.textureTracker.isTextureUsed(key)

        if (!setStale) {
            return
        }

        if (asset.stale) {
            asset.unload()
            delete this.registered[key]
        } else {
            asset.stale = true
        }
    }

    register(key, unload = () => this.unloadTexture(key)) {
        if (key in this.registered) {
            this.registered[key].stale = false
            return
        }

        this.registered[key] = {
            stale: false,
            unload
        }
    }

    unloadPack(key) {
        const pack = this.cache.json.get(key)

        if (!pack) {
            return
        }

        for (const configKey in pack) {
            const files = pack[configKey]?.files

            if (Array.isArray(files)) {
                this.unloadPackFiles(files)
            }
        }

        this.unloadJson(key)
    }

    unloadPacks(packs) {
        for (const key of packs) {
            this.unloadPack(key)
        }
    }

    unloadPackFiles(files) {
        for (const file of files) {
            switch (file.type) {
                case 'animation':
                    this.unloadAnimFile(file.key)
                    break

                case 'audio:':
                    break

                case 'json':
                    this.unloadJson(file.key)
                    break

                case 'image':
                case 'multiatlas':
                    this.unloadTexture(file.key)
                    break
            }
        }
    }

    unloadAnimFile(key) {
        const anims = this.cache.json.get(key)?.anims

        if (Array.isArray(anims)) {
            for (const anim of anims) {
                this.anims.remove(anim.key)
            }
        }

        this.unloadJson(key)
    }

    unloadJson(key) {
        this.cache.json.remove(key)
    }

    unloadTexture(key) {
        this.textures.remove(key)
        this.unloadTextureAnims(key)
    }

    unloadTextureAnims(textureKey) {
        const textureAnims = this.animTracker.getTextureAnims(textureKey)

        if (!textureAnims) {
            return
        }

        for (const animKey of textureAnims) {
            this.anims.remove(animKey)
        }
    }

}
