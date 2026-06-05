// On-screen touch controls for the classic CP Flash minigames that are keyboard-driven.
//
// The Flash games run in Ruffle and were designed for arrow keys + space. Ruffle does not
// synthesize touch -> keyboard, so on a phone these games have no controls. This mounts a
// fixed-position DOM D-pad (+ optional action button) over the Ruffle player and dispatches
// synthetic KeyboardEvents at it. Only shown on coarse-pointer (touch) devices; desktop is
// untouched. Pointer-driven Flash games (Bean Counters, Puffle Roundup, Hydro Hopper, Ice
// Fishing) work on touch already and get no overlay.
//
// VERIFY ON A REAL TOUCH DEVICE: synthetic key injection into Ruffle cannot be tested headlessly.
// If a game does not respond, Ruffle may be reading the event from a different target; widen the
// dispatch targets in _emit() (e.g. document) or adjust the key fields. The key/code/keyCode are
// all set because different AVM paths read different ones.

const KEYS = {
    up:    { key: 'ArrowUp',    code: 'ArrowUp',    keyCode: 38 },
    down:  { key: 'ArrowDown',  code: 'ArrowDown',  keyCode: 40 },
    left:  { key: 'ArrowLeft',  code: 'ArrowLeft',  keyCode: 37 },
    right: { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
    space: { key: ' ',          code: 'Space',      keyCode: 32 }
}

const GLYPH = { up: '▲', down: '▼', left: '◀', right: '▶' }

// game.key (from crumbs.games) -> control layout. `dpad` = which arrows to show; `action` = an
// extra button mapped to a key. Keyboard games only; pointer games are intentionally absent.
const LAYOUTS = {
    astro:   { dpad: ['left', 'right'],                action: { dir: 'space', label: 'FIRE' } }, // Astro Barrier
    mine:    { dpad: ['up', 'down', 'left', 'right'] },                                            // Cart Surfer
    jetpack: { dpad: ['up', 'down', 'left', 'right'] },                                            // Jet Pack Adventure
    thinice: { dpad: ['up', 'down', 'left', 'right'] },                                            // Thin Ice
    waves:   { dpad: ['up', 'down', 'left', 'right'], action: { dir: 'space', label: 'TRICK' } },  // Catchin' Waves
    sub:     { dpad: ['up', 'down', 'left', 'right'], action: { dir: 'space', label: 'GRAB' } }     // Aqua Grabber
}

const POS = { up: [67, 0], left: [0, 67], right: [134, 67], down: [67, 134] }

export default class TouchControls {

    // Only mount for a keyboard game on a touch device.
    static supports(gameKey) {
        return !!LAYOUTS[gameKey]
            && typeof window !== 'undefined'
            && window.matchMedia
            && window.matchMedia('(pointer: coarse)').matches
    }

    constructor(target, gameKey) {
        this.target = target            // the Ruffle player element to dispatch keys at
        this.layout = LAYOUTS[gameKey]
        this.held = new Set()           // dirs currently pressed (released on destroy)
        this.root = null
    }

    mount() {
        if (!this.layout || this.root) return

        const root = document.createElement('div')
        root.className = 'ruffle-touch-controls'
        root.style.cssText = 'position:fixed;inset:0;z-index:99998;pointer-events:none;'
            + 'touch-action:none;-webkit-user-select:none;user-select:none'

        // D-pad, bottom-left
        const pad = document.createElement('div')
        pad.style.cssText = 'position:absolute;width:198px;height:198px;pointer-events:none;'
            + 'left:max(16px,env(safe-area-inset-left));bottom:max(16px,env(safe-area-inset-bottom))'
        for (const dir of this.layout.dpad) {
            const [x, y] = POS[dir]
            pad.appendChild(this._button(GLYPH[dir], dir, `left:${x}px;top:${y}px;width:64px;height:64px;font-size:24px`))
        }
        root.appendChild(pad)

        // action button, bottom-right
        if (this.layout.action) {
            const a = this.layout.action
            root.appendChild(this._button(a.label, a.dir,
                'right:max(20px,env(safe-area-inset-right));bottom:max(34px,env(safe-area-inset-bottom));'
                + 'width:92px;height:92px;font-size:17px;font-family:CCComiccrazy,sans-serif'))
        }

        document.body.appendChild(root)
        this.root = root
    }

    _button(label, dir, extraCss) {
        const b = document.createElement('button')
        b.textContent = label
        b.style.cssText = 'position:absolute;pointer-events:auto;touch-action:none;color:#fff;'
            + 'background:rgba(21,86,143,.82);border:3px solid #fff;border-radius:16px;'
            + 'box-shadow:0 2px 6px rgba(0,0,0,.4);display:flex;align-items:center;'
            + 'justify-content:center;line-height:1;font-family:Arial,sans-serif;'
            + 'font-weight:bold;padding:0;' + extraCss

        const press = (e) => {
            e.preventDefault()
            this._down(dir)
            b.style.background = 'rgba(230,88,77,.92)'
        }
        const release = (e) => {
            e.preventDefault()
            this._up(dir)
            b.style.background = 'rgba(21,86,143,.82)'
        }
        b.addEventListener('pointerdown', press)
        b.addEventListener('pointerup', release)
        b.addEventListener('pointerleave', release)
        b.addEventListener('pointercancel', release)
        return b
    }

    _down(dir) {
        if (this.held.has(dir)) return
        this.held.add(dir)
        this._emit('keydown', dir)
    }

    _up(dir) {
        if (!this.held.has(dir)) return
        this.held.delete(dir)
        this._emit('keyup', dir)
    }

    _emit(type, dir) {
        const k = KEYS[dir]
        if (!k || !this.target) return
        // a KeyboardEvent can only be dispatched once, so build a fresh one per target
        const targets = [this.target, this.target.shadowRoot?.querySelector('canvas'), this.target.querySelector?.('canvas')]
        for (const t of targets) {
            if (!t) continue
            const ev = new KeyboardEvent(type, { key: k.key, code: k.code, bubbles: true, cancelable: true, view: window })
            // keyCode/which are legacy and ignored by the constructor; some AVM paths still read them
            Object.defineProperty(ev, 'keyCode', { get: () => k.keyCode })
            Object.defineProperty(ev, 'which', { get: () => k.keyCode })
            t.dispatchEvent(ev)
        }
    }

    destroy() {
        // release anything still held so a key can't stick down after the overlay is gone
        for (const dir of [...this.held]) this._up(dir)
        if (this.root) { this.root.remove(); this.root = null }
        this.target = null
    }

}
