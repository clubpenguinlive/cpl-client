export default class TextureTracker {

    // Active game objects mapped to their current texture key
    objectTextures = new Map()

    // Used texture keys mapped to all game objects using them
    textureObjects = new Map()

    track(gameObject) {
        this.setObjectTexture(gameObject, gameObject.texture.key)
    }

    untrack(gameObject) {
        const key = this.objectTextures.get(gameObject)

        this.deleteTextureObject(key, gameObject)

        this.objectTextures.delete(gameObject)
    }

    setObjectTexture(gameObject, key) {
        const prevKey = this.objectTextures.get(gameObject)

        if (prevKey) {
            this.deleteTextureObject(prevKey, gameObject)
        }

        this.objectTextures.set(gameObject, key)

        this.addTextureObject(key, gameObject)

        gameObject.once('destroy', () => this.untrack(gameObject))
    }

    addTextureObject(key, gameObject) {
        if (!this.textureObjects.has(key)) {
            this.textureObjects.set(key, new Set())
        }

        const textureSet = this.textureObjects.get(key)

        textureSet.add(gameObject)
    }

    deleteTextureObject(key, gameObject) {
        const textureSet = this.textureObjects.get(key)

        if (!textureSet) {
            return
        }

        textureSet.delete(gameObject)

        if (textureSet.size === 0) {
            this.textureObjects.delete(key)
        }
    }

    isTextureUsed(key) {
        return this.textureObjects.has(key)
    }

}
