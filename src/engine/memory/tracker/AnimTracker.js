export default class AnimTracker {

    textureAnims = new Map()

    track(anim) {
        const usedTextures = this.getUsedTextures(anim)

        for (const key of usedTextures) {
            this.addTextureAnim(key, anim.key)
        }
    }

    untrack(anim) {
        const usedTextures = this.getUsedTextures(anim)

        for (const key of usedTextures) {
            this.removeTextureAnim(key, anim.key)
        }
    }

    addTextureAnim(textureKey, animKey) {
        if (!this.textureAnims.has(textureKey)) {
            this.textureAnims.set(textureKey, new Set())
        }

        const textureSet = this.textureAnims.get(textureKey)

        textureSet.add(animKey)
    }

    removeTextureAnim(textureKey, animKey) {
        const textureSet = this.textureAnims.get(textureKey)

        if (!textureSet) {
            return
        }

        textureSet.delete(animKey)

        if (textureSet.size === 0) {
            this.textureAnims.delete(textureKey)
        }
    }

    getUsedTextures(anim) {
        return new Set(anim.frames.map(frame =>
            frame.textureKey
        ))
    }

    getTextureAnims(textureKey) {
        return this.textureAnims.get(textureKey)
    }

}
