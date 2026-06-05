// Maps a room's internal key to the prefix its localized strings are stored under.
//
// Convention: a room's strings are keyed by the lowercased room key (e.g. key "Town" -> load_town,
// town_find). A few rooms were added or renamed with a key that no longer matches their original
// string prefix - their art/key is e.g. "HiddenLake" / "Lighthouse" but the strings still live
// under "lake" / "light". Without this remap the UI builds a key that misses (load_HiddenLake,
// hiddenlake_find) and getString falls back to printing the raw key to the player.
//
// New rooms should just add load_<lowercasekey> / <lowercasekey>_find strings and need no entry here.
const OVERRIDES = {
    hiddenlake: 'lake',
    lighthouse: 'light'
}

export default function roomStringKey(key) {
    const lower = (key || '').toLowerCase()
    return OVERRIDES[lower] || lower
}
