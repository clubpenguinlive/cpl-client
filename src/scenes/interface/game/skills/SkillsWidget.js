import BaseContainer from '@scenes/base/BaseContainer'


// Makes the progression loop visible: the player's 7 skills with level, XP progress bars, total
// level, the active coin buff per skill (server-validated: +1%/level in gameOver), and gathered
// resources (sold to NPCs for coins). Data comes from the server (get_skills -> skills); the
// client never asserts level/xp.

const SKILLS = [
    { key: 'fishing',    label: 'Fishing',    resource: 'fish' },
    { key: 'mining',     label: 'Mining',     resource: 'ore' },
    { key: 'surfing',    label: 'Surfing',    resource: 'shell' },
    { key: 'cooking',    label: 'Cooking',    resource: null },
    { key: 'hauling',    label: 'Hauling',    resource: 'cargo' },
    { key: 'performing', label: 'Performing', resource: null },
    { key: 'agent',      label: 'Agent',      resource: null }
]

const ROW_X = 300
const ROW_W = 920
const ROW_H = 58
const ROWS_Y = 300
const BAR_X = 560
const BAR_W = 360

export default class SkillsWidget extends BaseContainer {

    constructor(scene) {
        super(scene, 0, 0)

        this.depth = 100
        this.onDataBound = (args) => this.onData(args)

        const block = scene.add.rectangle(0, 0, 1520, 960, 0x000000, 0.5).setOrigin(0, 0)
        block.setInteractive()
        this.add(block)

        this.add(scene.add.rectangle(760, 480, 1060, 780, 0x0e5fa8).setStrokeStyle(8, 0x093f70))
        this.add(scene.add.rectangle(760, 500, 1020, 700, 0xdff1fc))

        this.add(scene.add.text(760, 150, 'MY SKILLS', { fontFamily: 'Burbank Big, Arial', fontSize: '42px', color: '#ffffff' }).setOrigin(0.5))
        this.totalText = scene.add.text(760, 196, '', { fontFamily: 'Arial', fontSize: '20px', color: '#ffd23f' }).setOrigin(0.5)
        this.add(this.totalText)

        const close = scene.add.text(1240, 140, '✕', { fontFamily: 'Arial', fontSize: '34px', color: '#ffffff' }).setOrigin(0.5)
        close.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.onClose())
        this.add(close)

        this.rows = scene.add.container(0, 0)
        this.add(this.rows)
        this.resText = scene.add.text(300, 770, '', { fontFamily: 'Arial', fontSize: '17px', color: '#0e5fa8' }).setOrigin(0, 0.5)
        this.add(this.resText)

        this.network.events.on('skills', this.onDataBound)
        this.network.send('get_skills', {})
    }

    onData(args) {
        this.totalText.setText('Total Level: ' + (args.total || 0))
        this.rows.removeAll(true)

        const skills = args.skills || {}
        SKILLS.forEach((def, i) => {
            const d = skills[def.key] || { level: 1, progress: 0, xp: 0 }
            const y = ROWS_Y + i * ROW_H

            this.rows.add(this.scene.add.rectangle(760, y, ROW_W, ROW_H - 8, 0xffffff).setStrokeStyle(2, 0x9cc6e8))
            this.rows.add(this.scene.add.text(ROW_X + 20, y, def.label, { fontFamily: 'Burbank Big, Arial', fontSize: '22px', color: '#0e5fa8' }).setOrigin(0, 0.5))
            this.rows.add(this.scene.add.text(ROW_X + 200, y, 'Lv ' + d.level, { fontFamily: 'Burbank Big, Arial', fontSize: '22px', color: '#1f8fe0' }).setOrigin(0, 0.5))

            // progress bar
            this.rows.add(this.scene.add.rectangle(BAR_X, y, BAR_W, 18, 0xc9e3f6).setOrigin(0, 0.5))
            this.rows.add(this.scene.add.rectangle(BAR_X, y, Math.max(2, BAR_W * (d.progress || 0)), 18, 0x36b34a).setOrigin(0, 0.5))

            // active coin buff (matches server: +1% coins per level in gameOver)
            this.rows.add(this.scene.add.text(BAR_X + BAR_W + 24, y, '+' + d.level + '% coins', { fontFamily: 'Arial', fontSize: '16px', color: '#f5a800' }).setOrigin(0, 0.5))
        })

        // gathered resources
        const res = args.resources || {}
        const parts = Object.keys(res).filter(k => res[k] > 0).map(k => k + ': ' + res[k])
        this.resText.setText(parts.length ? 'Resources (sell at NPC shops) -  ' + parts.join('   ') : 'Resources: none yet - play minigames to gather!')
    }

    onClose() {
        this.network.events.off('skills', this.onDataBound)
        this.interface.removeWidget(this)
        this.destroy()
    }

}
