import DailyCatalog from '@scenes/interface/catalogs/daily/DailyCatalog'


export default class SportCatalog extends DailyCatalog {

    constructor(scene) {
        super(scene)
        this.titleText.setText('SPORT SHOP')
    }

    getShopArgs() {
        return { shop: 'sport' }
    }

}
