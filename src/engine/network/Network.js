import DataHandler from './DataHandler'

import io from 'socket.io-client'


export default class Network {

    constructor(game) {
        this.game = game

        this.events = new Phaser.Events.EventEmitter()

        this.handler = new DataHandler(this)
        this.client = null

        this.saveUsername = false
        this.savePassword = false
        this.token = null

        // Used to switch back to correct login scene on an error
        this.lastLoginScene = null

        this.worldName
    }

    connectLogin(saveUsername, savePassword, onConnect) {
        this.saveUsername = saveUsername
        this.savePassword = savePassword

        // Use the same connection-lost handling as an in-game connection. A login
        // socket can establish fine and then drop mid-handshake (e.g. a later polling
        // request getting rate-limited after the initial connect succeeded), which
        // fires the disconnect event, not connect_error. Silently reconnecting here
        // left the loading spinner up forever with no recovery path.
        this.connect('Login', () => {
            onConnect()
        }, () => {
            this.onConnectionLost()
        })
    }

    connectGame(world, username, key) {
        // Only create token if save password is checked and space is available
        let createToken = this.savePassword && Object.keys(this.savedPenguins).length <= 6
        let response = { username: username, key: key, createToken: createToken }

        // If a token exists for the user add the token selector to response,
        // so that the token can be deleted/refreshed by the server
        let token = this.getToken(username)

        if (token) {
            response.token = token.split(':')[0]
        }

        this.connect(world, () => {
            this.send('game_auth', response)
            this.worldName = world

        }, () => {
            this.onConnectionLost()
        })
    }

    connect(world, onConnect, onDisconnect) {
        this.disconnect()

        let config = this.game.crumbs.worlds[world]

        this.client = io.connect(config.host, { path: config.path })

        this.client.once('connect', onConnect)
        this.client.once('disconnect', onDisconnect)
        this.client.on('connect_error', () => this.onConnectionLost())
        this.client.on('message', (message) => this.onMessage(message))
    }

    disconnect() {
        if (this.client) {
            this.client.disconnect()
        }
    }

    send(action, args = {}) {
        if (!this.client) {
            return
        }

        if (localStorage.logging == 'true') {
            console.log('Message sending:', action, args)
        }

        this.client.emit('message', { action: action, args: args })
    }

    // Handlers

    onMessage(message) {
        // The server sends this just before kicking a duplicate session so we can explain why.
        if (message.action === 'disconnect_reason') {
            this.disconnectReason = message.args && message.args.reason
            return
        }
        this.handler.handle(message)
    }

    onConnectionLost() {
        this.disconnect()
        this.showConnectionLost(this.disconnectReason)
        this.disconnectReason = null
    }

    // Reason-aware connection-lost dialog with Reconnect (reload to rejoin) + Learn More (status page).
    // Rendered as a DOM overlay so it has two real labelled buttons and works even after the socket dies.
    showConnectionLost(reason) {
        if (document.getElementById('cpl-disconnect')) {
            return
        }

        const duplicate = reason === 'duplicate'
        const title = duplicate ? 'Logged in somewhere else' : 'Connection lost'
        const message = duplicate
            ? 'You logged in from another tab or device. Only one session can be active at a time, so this one was signed out.'
            : 'Your connection to the server was lost. The server may be restarting for an update, or your internet may have dropped.'

        const overlay = document.createElement('div')
        overlay.id = 'cpl-disconnect'
        overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(3,20,45,.74);font-family:Arial,Helvetica,sans-serif'

        const box = document.createElement('div')
        box.style.cssText = 'background:#fff;color:#0a2a43;max-width:460px;width:90%;border-radius:18px;padding:30px 32px;text-align:center;box-shadow:0 18px 44px rgba(0,0,0,.45)'
        const h = document.createElement('h2')
        h.textContent = title
        h.style.cssText = 'color:#0e5fa8;margin:0 0 12px;font-size:26px'
        const p = document.createElement('p')
        p.textContent = message
        p.style.cssText = 'margin:0 0 24px;font-size:16px;line-height:1.55'

        const row = document.createElement('div')
        row.style.cssText = 'display:flex;gap:14px;justify-content:center;flex-wrap:wrap'
        const btn = 'font-family:inherit;font-weight:bold;font-size:17px;padding:13px 26px;border-radius:999px;cursor:pointer;text-decoration:none;border:none;display:inline-block'
        const reconnect = document.createElement('button')
        reconnect.textContent = 'Reconnect'
        reconnect.style.cssText = btn + ';color:#fff;background:linear-gradient(180deg,#41a0e4,#0b58b1);box-shadow:0 4px 0 #083f7e'
        reconnect.addEventListener('click', () => window.location.reload())
        const learn = document.createElement('a')
        learn.textContent = 'Learn More'
        learn.href = 'https://clubpenguinlive.net/status'
        learn.target = '_blank'
        learn.rel = 'noopener'
        learn.style.cssText = btn + ';color:#0e5fa8;background:#e7f3fc;box-shadow:0 4px 0 #c2def2'

        row.appendChild(reconnect)
        row.appendChild(learn)
        box.appendChild(h)
        box.appendChild(p)
        box.appendChild(row)
        overlay.appendChild(box)
        document.body.appendChild(overlay)
    }

    // Saved penguins

    get isSavedPenguins() {
        if (localStorage.getItem('saved_penguins')) {
            return true
        } else {
            return false
        }
    }

    get savedPenguins() {
        let savedPenguins = localStorage.getItem('saved_penguins')

        if (!savedPenguins) {
            return {}
        }

        try {
            return JSON.parse(savedPenguins)
        } catch (error) {
            return {}
        }
    }

    getToken(username) {
        let save = this.savedPenguins[username.toLowerCase()]

        if (save && save.token) {
            return save.token
        } else {
            return null
        }
    }

}
