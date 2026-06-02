function onSubmit(event) {
    event.preventDefault()

    let request = new XMLHttpRequest()

    request.onreadystatechange = () => handleResponse(request)

    let formData = new FormData(event.target)

    request.open('POST', '/create/scripts/php/create.php')
    request.send(formData)
}

function handleResponse(request) {
    if (request.readyState !== XMLHttpRequest.DONE || request.status !== 200) {
        return
    }

    let response = JSON.parse(request.responseText)

    if (!response) {
        return
    }

    updateFeedback(response)

    if (response.success) {
        showSuccess()
    } else {
        turnstile.reset()
    }
}

function updateFeedback(feedback) {
    let groups = document.querySelectorAll('.form-group')

    for (let group of groups) {
        setFeedback(group, feedback[group.id.replace('-group', '')])
    }
}

function setFeedback(group, message = null) {
    let input = group.querySelector('input')
    let feedback = group.querySelector('.feedback')

    if (input) {
        if (message) {
            input.classList.add('invalid')
        } else {
            input.classList.remove('invalid')
        }
    }

    if (feedback) {
        feedback.innerText = message || ''
    }
}

function showSuccess() {
    updateModal(
        'Account Created',
        '<p>Your account has been successfully created.</p>',
        'Play Now',
        () => window.location.href = '/'
    )
}

function updateModal(title, content, button, onclick) {
    document.getElementById('modal-title').innerHTML = title
    document.getElementById('modal-content').innerHTML = content

    let modalButton = document.getElementById('modal-button')

    modalButton.innerHTML = button
    modalButton.onclick = onclick

    // Replay fade animation
    let element = document.getElementById('modal')
    element.classList.remove('fade')

    // trigger a DOM reflow
    void element.offsetWidth

    element.classList.add('fade')
}

// Live penguin preview using the real CP penguin art (CPJourney-2 "create" atlas):
// the body silhouette is tint-filled with the chosen colour, the outline drawn on top.
const PENG_BODY = { x: 1403, y: 434, w: 323, h: 385 }
const PENG_OUTLINE = { x: 1291, y: 1469, w: 380, h: 472 }
let pengAtlas = null
let pengColor = '#003366'

function renderPenguin() {
    let canvas = document.getElementById('peng-preview')
    if (!canvas || !pengAtlas) return

    let ctx = canvas.getContext('2d')
    let s = canvas.width / PENG_OUTLINE.w           // scale outline to fill the canvas width
    let ocx = canvas.width / 2, ocy = canvas.height / 2
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // tint-filled body on an offscreen canvas (replace all opaque pixels with the colour)
    let bc = document.createElement('canvas')
    bc.width = PENG_BODY.w; bc.height = PENG_BODY.h
    let bx = bc.getContext('2d')
    bx.drawImage(pengAtlas, PENG_BODY.x, PENG_BODY.y, PENG_BODY.w, PENG_BODY.h, 0, 0, PENG_BODY.w, PENG_BODY.h)
    bx.globalCompositeOperation = 'source-in'
    bx.fillStyle = pengColor
    bx.fillRect(0, 0, PENG_BODY.w, PENG_BODY.h)

    // body is positioned (1, -40) from the outline centre in the source art
    ctx.drawImage(bc, 0, 0, PENG_BODY.w, PENG_BODY.h,
        ocx + 1 * s - PENG_BODY.w * s / 2, ocy - 40 * s - PENG_BODY.h * s / 2, PENG_BODY.w * s, PENG_BODY.h * s)
    // outline on top (centred)
    ctx.drawImage(pengAtlas, PENG_OUTLINE.x, PENG_OUTLINE.y, PENG_OUTLINE.w, PENG_OUTLINE.h,
        ocx - PENG_OUTLINE.w * s / 2, ocy - PENG_OUTLINE.h * s / 2, PENG_OUTLINE.w * s, PENG_OUTLINE.h * s)
}

function setPreviewColor(swatch) {
    pengColor = getComputedStyle(swatch).backgroundColor
    renderPenguin()
}

window.onload = function() {
    document.getElementById('modal-form').addEventListener('submit', onSubmit)

    let swatches = document.querySelectorAll('.swatch')
    let colorInput = document.querySelector('input[name="color"]')

    swatches.forEach(swatch => swatch.addEventListener('click', () => {
        swatches.forEach(other => other.classList.remove('selected'))
        swatch.classList.add('selected')
        if (colorInput) colorInput.value = swatch.dataset.color
        setPreviewColor(swatch)
    }))

    let selected = document.querySelector('.swatch.selected') || swatches[0]
    if (selected) pengColor = getComputedStyle(selected).backgroundColor

    pengAtlas = new Image()
    pengAtlas.onload = renderPenguin
    pengAtlas.src = 'penguin.webp?v=cpl5'
}
