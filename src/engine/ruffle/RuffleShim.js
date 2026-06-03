// ExternalInterface bridge between the Flash boot loader (boot_cpj2.swf) and the RuffleController.
// Ported from cpj2-client. boot_cpj2 calls window.ruffle.<key>(...) via Ruffle's ExternalInterface;
// the shim forwards each registered key to the controller. (cpj2's optional caller-stack check was
// commented out there, so it's omitted here.)
export default class RuffleShim {

    #controller

    constructor(controller) {
        this.#controller = controller
        window.ruffle = this

        const keys = [...controller.getKeys(), ...controller.privateKeys]

        for (const func of keys) {
            this[func] = (...args) => this.#controller[func](...args)
        }
    }

    getKeys() {
        return this.#controller.getKeys()
    }

}
