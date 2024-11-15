var num = 361 * 182;
var noiseScale = 100, noiseStrength = 1;
var particles = [num];

let magnitud = []; // Renamed from `magnitude` to `magnitud`
let direction = [];
let windData;

function preload() {
  windData = loadJSON('current-wind-surface-level-gfs-1.0.json');
}

function processWindData(data) {
  // Handle the JSON data here
  let u_comp_info = data[0];
  let v_comp_info = data[1];
  let u_comp = [], v_comp = [];

  u_comp_info.data.forEach((comp, idx) => {
    u_comp[idx] = comp;
  });

  v_comp_info.data.forEach((comp, idx) => {
    v_comp[idx] = comp;
  });

  for (let i = 0; i < u_comp.length; i++) {
    magnitud[i] = Math.sqrt(u_comp[i] ** 2 + v_comp[i] ** 2);
    direction[i] = Math.atan2(v_comp[i], u_comp[i]);
  }
  // You can initialize particles or perform other setup tasks with the data
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();

  // Process wind data first
  processWindData(windData);

  // Test printing values from global `magnitud` and `direction` arrays
  console.log(magnitud[0], direction[0]);

  for(let i=0; i<361; i++){
    for(let j=0; j<182; j++){
        let location = createVector(i*3.5, j*4); // Starting location
        let angle = direction[i*j]; // 45 degrees in radians
        let mag = magnitud[i*j]; // Length of the vector
        drawVector(location, angle, mag);
    }
  }
}

function drawVector(location, angle, magnitude) {
  // Calculate the endpoint using angle and magnitude
  let endX = location.x + cos(angle) * magnitude;
  let endY = location.y + sin(angle) * magnitude;

  // Draw the line representing the vector
  stroke(0);
  strokeWeight(0.5);
  line(location.x, location.y, endX, endY);

  // Draw an arrowhead
  let arrowSize = 1;
  push();
  translate(endX, endY);
  rotate(angle);
  fill(0);
  noStroke();
  triangle(0, 0, -arrowSize, arrowSize / 2, -arrowSize, -arrowSize / 2);
  pop();
}
