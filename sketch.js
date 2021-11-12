let faceapi;
let video;
let detections;
let picture

let dims = {x: 640, y: 480}

let layouts = {
  1: [{x: 0, y: 0, w: 1, h: 1}],
  2: [
    {x: 0, y: 0, w: 0.5, h: 1},
    {x: 0.5, y: 0, w: 0.5, h: 1}
  ],
  3: [
    {x: 0, y: 0, w: 0.5, h: 0.5},
    {x: 0.5, y: 0, w: 0.5, h: 0.5},
    {x: 0.25, y: 0.5, w: 0.5, h: 0.5},
  ],
  4: [
    {x: 0, y: 0, w: 0.5, h: 0.5},
    {x: 0.5, y: 0, w: 0.5, h: 0.5},
    {x: 0, y: 0.5, w: 0.5, h: 0.5},
    {x: 0.5, y: 0.5, w: 0.5, h: 0.5},
  ],
}

let previouslyDetected = [
]

// by default all options are set to true
const detection_options = {
    withLandmarks: true,
    withDescriptors: false,
    minConfidence: 0.5,
}


function setup() {
    dims.x = windowWidth
    dims.y = windowHeight
    createCanvas(dims.x, dims.y);

    picture = createImage(dims.x,dims.y)

    // load up your video
    video = createCapture(VIDEO);
    // video.size(width, height);
    video.hide(); // Hide the video element, and just show the canvas
    faceapi = ml5.faceApi(video, detection_options, modelReady)
    textAlign(RIGHT);
}

function modelReady() {
    console.log('ready!', video.size())
    console.log(faceapi)
    faceapi.detect(gotResults)
}

function gotResults(err, result) {
    if (err) {
        console.log(err)
        return
    }
    // console.log(result)
    detections = result;
    console.log('ready!', video.size())

    // background(220);
    background(255);
    fill(0,0,0)
    rect(0,0, dims.x, dims.y)
    // image(video, 0,0, width, height)
    drawBox(detections)
    if (previouslyDetected.length == 0) {
      image(video, 0,0, width, height)
    }
    if (detections) {
      if (detections.length > 0) {
            drawFaceCenters(detections)
        }
    }
    faceapi.detect(gotResults)
}

function drawFaceCenters(detections) {
  for(let i = 0; i < detections.length; i++){
    const alignedRect = detections[i].alignedRect;
    const x = alignedRect._box._x
    const y = alignedRect._box._y
    const boxWidth = alignedRect._box._width
    const boxHeight  = alignedRect._box._height
    const center = { x: x + boxWidth / 2, y: y + boxHeight / 2 }

    fill(255, 0, 0)
    circle(center.x, center.y, 5)
  }
}

function drawBox(detections) {
  const geoms = detections.map(d => {
    const alignedRect = d.alignedRect;
    const x = alignedRect._box._x
    const y = alignedRect._box._y
    const boxWidth = alignedRect._box._width
    const boxHeight  = alignedRect._box._height

    return { x: x + boxWidth / 2, y: y + boxHeight / 2, w: boxWidth, h: boxHeight }
  })

  const incoming = []
  const used = []
  geoms.forEach(d => {
    const prevIndex = previouslyDetected
      .findIndex(prev => {
        return Math.sqrt((d.x - prev.x) * (d.x - prev.x) + (d.y - prev.y) * (d.y - prev.y)) < 50
      })
    if (prevIndex >= 0 && !used.includes(prevIndex)) {
      previouslyDetected[prevIndex] = {
        x: previouslyDetected[prevIndex].x * 0.8 + d.x * 0.2,
        y: previouslyDetected[prevIndex].y * 0.8 + d.y * 0.2,
        w: previouslyDetected[prevIndex].w * 0.8 + d.w * 0.2,
        h: previouslyDetected[prevIndex].h * 0.8 + d.h * 0.2,
        time: Date.now()
      }
      used.push(prevIndex)
    } else {
      incoming.push({
        ...d,
        time: Date.now()
      })
    }
  })
  previouslyDetected = [...previouslyDetected, ...incoming]

  const layout = layouts[Math.min(previouslyDetected.length, Object.keys(layouts).length)]
  previouslyDetected.forEach((d, i) => {
    if (i < layout.length) {
      copyZoomed(d, d.w, d.h, layout[i])
    }
  })

  previouslyDetected = previouslyDetected.filter(d => Date.now() - d.time < 2500)
}

function copyZoomed(c, w, h, dest) {
  let dx = dims.x * dest.x // c.x - w * 2
  let dy = dims.y * dest.y // c.y - h * 2
  let dw = dims.x * dest.w // w * 4
  let dh = dims.y * dest.h // h * 4

  let sh = h * 2
  let sw = dw * sh / dh // h * 2
  let sx = c.x - sw / 2 // w
  let sy = c.y - sh / 2 // h * 1.25
  // let dx = c.x - w * 2
  // let dy = c.y - h * 2
  // let dw = w * 4
  // let dh = h * 4

  picture.copy(video, sx, sy, sw, sh, dx, dy, dw, dh)
  image(picture, 0,0)
}

function drawLandmarks(detections){
    noFill();
    stroke(161, 95, 251)
    strokeWeight(2)

    for(let i = 0; i < detections.length; i++){
        const mouth = detections[i].parts.mouth; 
        const nose = detections[i].parts.nose;
        const leftEye = detections[i].parts.leftEye;
        const rightEye = detections[i].parts.rightEye;
        const rightEyeBrow = detections[i].parts.rightEyeBrow;
        const leftEyeBrow = detections[i].parts.leftEyeBrow;

        drawPart(mouth, true);
        drawPart(nose, false);
        drawPart(leftEye, true);
        drawPart(leftEyeBrow, false);
        drawPart(rightEye, true);
        drawPart(rightEyeBrow, false);

    }

}

function drawPart(feature, closed){
    
    beginShape();
    for(let i = 0; i < feature.length; i++){
        const x = feature[i]._x
        const y = feature[i]._y
        vertex(x, y)
    }
    
    if(closed === true){
        endShape(CLOSE);
    } else {
        endShape();
    }
    
}