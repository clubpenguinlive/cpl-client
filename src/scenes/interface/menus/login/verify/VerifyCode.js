import BaseScene from '@scenes/base/BaseScene'

import { Button, SimpleButton } from '@components/components'
import TextInput from '@engine/interface/text/TextInput'


// Lightweight email-code step shown after a password login on a new/untrusted device.
// The player types the 6-digit code we emailed; on success this completes the login and
// (because save prefs are carried forward) the device gets a token so future visits skip it.
export default class VerifyCode extends BaseScene {

    constructor() {
        super('VerifyCode')

        this.username = null
        this.email = null
        this.codeInput = null
    }

    create(data) {
        data = data || {}

        // On a retry the scene is restarted without data, so fall back to the stashed values.
        let pending = this.network.pendingVerify || {}
        this.username = data.username || pending.username
        this.email = data.email || pending.email

        this.network.lastLoginScene = 'VerifyCode'

        // bg
        const bg = this.add.image(0, 1, 'load', 'bg')
        bg.setOrigin(0, 0)

        // title
        const title = this.add.text(760, 235, 'Check your email', {})
        title.setOrigin(0.5, 0.5)
        title.setStyle({ align: 'center', color: '#000000ff', fontFamily: 'Arial Narrow', fontSize: '42px' })

        // subtitle
        const sub = this.add.text(760, 295, `Enter the 6-digit code we sent to\n${this.email || 'your email'}`, {})
        sub.setOrigin(0.5, 0.5)
        sub.setAlign('center')
        sub.setStyle({ align: 'center', color: '#000000ff', fontFamily: 'Arial Narrow', fontSize: '28px' })

        // code input box
        this.add.image(760, 385, 'login', 'input')

        // verify button
        const verifyButton = this.add.sprite(760, 495, 'login', 'login-button')
        const verifyText = this.add.text(760, 495, 'Verify', {})
        verifyText.setOrigin(0.5, 0.5)
        verifyText.setStyle({ align: 'center', color: '#ffffffff', fontFamily: 'Arial Narrow', fontSize: '38px' })

        // back button
        const backButton = this.add.sprite(760, 620, 'login', 'small-button')
        const backText = this.add.text(760, 620, 'Back', {})
        backText.setOrigin(0.5, 0.5)
        backText.setStyle({ align: 'center', color: '#ffffffff', fontFamily: 'Arial Narrow', fontSize: '30px' })

        // components
        const verifyButtonButton = new Button(verifyButton)
        verifyButtonButton.spriteName = 'login-button'
        verifyButtonButton.callback = () => this.onSubmit()

        const backButtonButton = new SimpleButton(backButton)
        backButtonButton.callback = () => this.onBackClick()

        // code input (overlaid DOM field)
        let style = {
            width: 380,
            height: 53,
            padding: '0 6px 0 6px',
            filter: 'none',
            fontFamily: 'Arial',
            fontSize: 35,
            color: '#000',
            textAlign: 'center',
            letterSpacing: '8px'
        }

        this.codeInput = new TextInput(this, 760, 386, 'text', style, () => this.onSubmit(), 6, false)
        this.codeInput.node.setAttribute('inputmode', 'numeric')
        this.add.existing(this.codeInput)

        this.input.keyboard.on('keydown-ENTER', () => this.onSubmit())
    }

    onSubmit() {
        // Enter fires both the scene keydown handler and the TextInput's own callback;
        // guard against a double submit (two verify_code -> two logins -> mismatched token).
        if (this.submitting) {
            return
        }

        let code = (this.codeInput.text || '').trim()
        if (code.length !== 6) {
            return
        }

        this.submitting = true
        this.interface.showLoading('Verifying')
        this.scene.stop()

        // Carry save prefs forward so a token is minted on success and this device is trusted next time.
        this.network.connectLogin(true, true, () => {
            this.network.send('verify_code', { username: this.username, code: code })
        })
    }

    onBackClick() {
        this.network.pendingVerify = null
        this.network.disconnect()
        this.scene.start('Login')
    }

}
