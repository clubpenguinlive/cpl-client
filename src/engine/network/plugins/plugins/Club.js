import Plugin from '../Plugin'


export default class Club extends Plugin {

    constructor(network) {
        super(network)

        this.events = {
            'club_created': this.onClubCreated,
            'club_joined': this.onClubJoined,
            'club_left': this.onClubLeft,
            'club_update': this.onClubUpdate,
            'club_info': this.onClubInfo
        }
    }

    get client() {
        return this.world.client
    }

    onClubCreated(args) {
        this.client.club = args.club
        this.client.coins = args.coins
        this.refreshOwnTag()
        this.interface.refreshPlayerCard()
        this.interface.updateCatalogCoins()
    }

    onClubJoined(args) {
        this.client.club = args.club
        this.refreshOwnTag()
        this.interface.refreshPlayerCard()
    }

    onClubLeft() {
        this.client.club = null
        this.refreshOwnTag()
        this.interface.refreshPlayerCard()
    }

    onClubUpdate(args) {
        const penguin = this.world.room && this.world.room.penguins[args.id]
        if (!penguin) return

        penguin.club = args.club
        if (penguin.nameTag) {
            penguin.nameTag.setText(penguin.penguinLoader.getNameText(penguin))
        }
    }

    onClubInfo(args) {
        // club_info is forwarded to any listening widget via network.events
    }

    refreshOwnTag() {
        const penguin = this.client.penguin
        if (!penguin || !penguin.nameTag) return
        penguin.club = this.client.club
        penguin.nameTag.setText(penguin.penguinLoader.getNameText(penguin))
    }

}
