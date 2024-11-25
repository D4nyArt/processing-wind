var num = 361 * 182;
var noiseScale = 100, noiseStrength = 1;
let gridSize = 10; // Tamaño de cada celda de agrupación

let magnitud = [];
let direction = [];
let windData;
let particles = [];

class Particle {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.speed = random(0.5, 0.7);
    this.lifespan = random(300, 600); // Lifespan in frames
  }

  update() {
    let λ = map(this.position.x, 0, width, 0, 360);
    let φ = map(this.position.y, 0, height, 0, 181);

    let [u, v, mag, angle] = interpolate(λ, φ);
    let velocity = createVector(cos(angle), sin(angle)).mult(this.speed);
    this.position.add(velocity);

    // Decrease lifespan
    this.lifespan--;

    // Reset position if out of bounds or lifespan expired
    if (
      this.position.x > width ||
      this.position.x < 0 ||
      this.position.y > height ||
      this.position.y < 0 ||
      this.lifespan <= 0
    ) {
      this.position.x = random(width);
      this.position.y = random(height);
      this.lifespan = random(300, 600); // Reset lifespan
    }
  }

  show() {
    fill(0);
    noStroke();
    ellipse(this.position.x, this.position.y, 2, 2);
  }
}

function preload() {
  windData = loadJSON('current-wind-surface-level-gfs-1.0.json');
}

function processWindData(data) {
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
    let direct = Math.atan2(v_comp[i], u_comp[i]) + Math.PI;
    direction[i] = direct % (2 * Math.PI);
  }
}

function bilinearInterpolateVector(x, y, g00, g10, g01, g11) {
  let rx = 1 - x;
  let ry = 1 - y;

  // Interpolate u and v components
  let u = rx * ry * g00[0] + x * ry * g10[0] + rx * y * g01[0] + x * y * g11[0];
  let v = rx * ry * g00[1] + x * ry * g10[1] + rx * y * g01[1] + x * y * g11[1];

  // Calculate magnitude and direction
  let magnitude = Math.sqrt(u ** 2 + v ** 2);
  let angle = Math.atan2(v, u);

  return [u, v, magnitude, angle];
}

function interpolate(λ, φ) {
  // Determine grid indices
  let i = Math.floor(λ);
  let j = Math.floor(φ);
  let x = λ - i;
  let y = φ - j;

  // Wrap around the grid if needed
  let i1 = (i + 1) % 361;
  let j1 = (j + 1) % 182;

  // Get wind data at the four corners
  let g00 = [cos(direction[j * 361 + i]) * magnitud[j * 361 + i],
             sin(direction[j * 361 + i]) * magnitud[j * 361 + i]];
  let g10 = [cos(direction[j * 361 + i1]) * magnitud[j * 361 + i1],
             sin(direction[j * 361 + i1]) * magnitud[j * 361 + i1]];
  let g01 = [cos(direction[j1 * 361 + i]) * magnitud[j1 * 361 + i],
             sin(direction[j1 * 361 + i]) * magnitud[j1 * 361 + i]];
  let g11 = [cos(direction[j1 * 361 + i1]) * magnitud[j1 * 361 + i1],
             sin(direction[j1 * 361 + i1]) * magnitud[j1 * 361 + i1]];

  // Perform bilinear interpolation
  return bilinearInterpolateVector(x, y, g00, g10, g01, g11);
}
function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();

  // Process wind data first
  processWindData(windData);

  // Initialize particles
  for (let i = 0; i < 20000; i++) {
    particles.push(new Particle(random(width), random(height)));
  }
}

function draw() {
  background(255, 10); // Use a translucent background for trail effect

  // Update and display particles
  for (let particle of particles) {
    particle.update();
    particle.show();
  }
}
