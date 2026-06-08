import fonts from './fonts'

import SoundFileFactory from '@engine/sound/SoundFileFactory'


if (!localStorage.getItem('webgl')) {
    localStorage.setItem('webgl', 'true')
}

const width = 1520
const height = 960

const game = {
    type: (localStorage.getItem('webgl') == 'true')
        ? Phaser.WEBGL
        : Phaser.CANVAS,

    transparent: true,
    roundPixels: true,

    render: {
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false
    },

    input: {
        mouse: {
            preventDefaultMove: false
        }
    },

    scale: {
        width: width,
        height: height,
        // No `max` cap: let FIT scale the canvas UP past the native 1520x960 to fill larger displays
        // (e.g. 1440p) rather than pinning it at native and leaving dead space. Aspect stays locked
        // (FIT); the trade is mild softening of the raster art when upscaled beyond native.
        parent: 'game',
        mode: Phaser.Scale.FIT,
        autoRound: true,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    dom: {
        createContainer: true
    },

    physics: {
        default: 'matter',
        matter: {
            debug: {
                renderFill: false,
                renderLine: false,
                showInternalEdges: true
            },
            gravity: false
        }
    },

    audio: {
        // Default Phaser audio systems not needed
        noAudio: true
    },

    crumbs: {
        fonts: fonts,
        frameColor: 0x2e3440,
        iglooIdOffset: 2000
    },

    callbacks: {
        preBoot: () => {
            // Override default Phaser audio loader, loads audio for howler.js instead
            Phaser.Loader.FileTypesManager.register('audio', function(key, urls, _, xhrSettings) {
                return SoundFileFactory.create(this, key, urls, xhrSettings)
            })
        },
        postBoot: (game) => {
            const refit = () => game.scale.refresh()
            // Re-fit the canvas when the tab regains focus or moves to another screen (avoids scale/WebGL glitches)
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    refit()
                }
            })
            // Rotation refit. iOS reports stale viewport dimensions for a beat after orientationchange,
            // so FIT scales against the old (smaller) size and the canvas comes back too small until a
            // reload. visualViewport 'resize' fires once the new viewport has actually settled (the
            // reliable signal on iOS); delayed refits after orientationchange back it up elsewhere.
            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', refit)
            }
            window.addEventListener('orientationchange', () => {
                refit()
                ;[120, 350, 700].forEach((d) => setTimeout(refit, d))
            })
        }
    }
}

export default game
