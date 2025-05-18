export default class BaseLoader extends Phaser.Loader.LoaderPlugin {

    constructor(scene) {
        super(scene)

        this.on('loaderror', this.onLoadError, this)
    }

    get crumbs() {
        return this.scene.crumbs
    }

    get network() {
        return this.scene.network
    }

    get interface() {
        return this.scene.interface
    }

    get world() {
        return this.scene.world
    }

    get memory() {
        return this.scene.memory
    }

    getKey(...args) {
        let key = args.join('')
        let prefix = this.keyPrefix || ''

        return `${prefix}${key}`
    }

    getKeyId(key) {
        let split = key.split('/')
        let last = split[split.length - 1]

        return parseInt(last)
    }

    onLoadError() {

    }

    checkComplete(type, key, callback = () => {}) {
        if (this.textureExists(key)) {
            callback()
            return true
        }

        let event = `filecomplete-${type}-${key}`

        this.once(event, () =>
            callback()
        )

        return false
    }

    textureExists(key) {
        return this.scene.textures.exists(key)
    }

    jsonExists(key) {
        return this.scene.cache.json.exists(key)
    }

    audioExists(key) {
        return this.scene.cache.audio.exists(key)
    }

}
