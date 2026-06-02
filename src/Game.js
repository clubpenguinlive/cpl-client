import './patches/patches'

import Boot from '@engine/boot/Boot'
import InterfaceController from '@engine/interface/InterfaceController'
import MemoryManager from '@engine/memory/MemoryManager'
import RuffleController from '@engine/ruffle/RuffleController'
import IframeController from '@engine/iframe/IframeController'
import WorldController from '@engine/world/WorldController'

import Network from '@engine/network/Network'
import registerNinePatchContainerFactory from '@engine/utils/ninepatch/registerNinePatchContainerFactory'
import SoundManager from '@engine/sound/SoundManager'

import game from './data/game'
import './styles/game.css'


export default class Game extends Phaser.Game {

    constructor(config) {
        super(config)

        // Expose the running game instance for verification/automation tooling. The server is
        // authoritative and validates every action, so this handle grants nothing a client
        // couldn't already invoke through the existing scene objects.
        window.game = this

        this.logBanner()

        // Removes focus from active element
        this.canvas.addEventListener('click', () => document.activeElement.blur())

        this.crumbs = config.crumbs
        this.network = new Network(this)

        // howler.js based sound manager
        this.soundManager = new SoundManager(this)

        registerNinePatchContainerFactory()

        // Add initial scenes
        this.scene.add('InterfaceController', InterfaceController)
        this.scene.add('MemoryManager', MemoryManager)
        this.scene.add('RuffleController', RuffleController)
        this.scene.add('IframeController', IframeController)
        this.scene.add('WorldController', WorldController)

        // Start boot
        this.scene.add('Boot', Boot, true)
    }

    logBanner() {
        // Please leave this line here for credit purposes
        console.log('%cYukon Client\nhttps://github.com/wizguin/yukon', 'font-size: 25px;')
        console.log(`Version ${VERSION}`)
    }

}

window.onload = () => {
    new Game(game)
}
