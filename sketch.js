// p5.js - Simulación de partículas con mapa de fondo y zoom dinámico
let num = 361 * 182;
let particles = [];
let particleCount = 10000; // Cantidad base de partículas en la simulación

var noiseScale = 500, noiseStrength = 1;

let magnitud = []; // Array con la magnitud del viento en cada punto del grid
let direction = []; // Array con la dirección del viento en cada punto del grid
let windData;
let mapaMundi;

let zoomScale = 1;
let useInterpolation = false; // Toggle para usar interpolación bilineal

function preload() {
  windData = loadJSON('current-wind-surface-level-gfs-1.0.json');
  mapaMundi = loadImage('mapa2.png'); // Asegúrate de tener este archivo
}

function processWindData(data) {
  // Procesar los datos JSON del viento
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

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  colorMode(HSB, 360, 255, 255, 255);
  processWindData(windData);

  // Crear las partículas iniciales
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
}

function draw() {
  background(0, 10); // Fondo negro con transparencia para crear un efecto de estela
  scale(zoomScale);
  image(mapaMundi, 0, 0, width, height);

  // Ajustar la cantidad de partículas según el zoom
  let desiredParticleCount = int(particleCount * zoomScale * zoomScale);
  adjustParticleCount(desiredParticleCount);

  // Actualizar y dibujar todas las partículas
  for (let particle of particles) {
    particle.update();
    particle.display();
  }
}

// Función para ajustar la cantidad de partículas según el zoom
function adjustParticleCount(desiredCount) {
  if (particles.length < desiredCount) {
    let countToAdd = desiredCount - particles.length;
    for (let i = 0; i < countToAdd; i++) {
      particles.push(new Particle());
    }
  } else if (particles.length > desiredCount) {
    particles.splice(desiredCount, particles.length - desiredCount);
  }
}

// Función de zoom con la rueda del ratón
function mouseWheel(event) {
  zoomScale += event.delta * 0.002;
  zoomScale = constrain(zoomScale, 0.5, 5);
}

// Función para interpolar ángulos correctamente
function lerpAngle(a0, a1, t) {
  let max = TWO_PI;
  let da = (a1 - a0) % max;
  da = ((2 * da) % max) - da;
  return (a0 + da * t) % max;
}

// Función para obtener el vector interpolado
function getInterpolatedVector(x, y) {
  let gridX = (x / zoomScale) * (360 / width);
  let gridY = (y / zoomScale) * (181 / height);

  let x0 = Math.floor(gridX);
  let y0 = Math.floor(gridY);
  let x1 = x0 + 1;
  let y1 = y0 + 1;

  let tx = gridX - x0;
  let ty = gridY - y0;

  let idx00 = x0 + y0 * 361;
  let idx10 = x1 + y0 * 361;
  let idx01 = x0 + y1 * 361;
  let idx11 = x1 + y1 * 361;

  // Verificar que los índices estén dentro de los límites
  if (idx00 >= 0 && idx11 < magnitud.length) {
    let angle00 = direction[idx00];
    let mag00 = magnitud[idx00];
    let angle10 = direction[idx10];
    let mag10 = magnitud[idx10];
    let angle01 = direction[idx01];
    let mag01 = magnitud[idx01];
    let angle11 = direction[idx11];
    let mag11 = magnitud[idx11];

    // Interpolación bilineal de magnitudes
    let mag0 = lerp(mag00, mag10, tx);
    let mag1 = lerp(mag01, mag11, tx);
    let mag = lerp(mag0, mag1, ty);

    // Interpolación bilineal de ángulos
    let angle0 = lerpAngle(angle00, angle10, tx);
    let angle1 = lerpAngle(angle01, angle11, tx);
    let angle = lerpAngle(angle0, angle1, ty);

    return { mag, angle };
  } else {
    // Valores por defecto si está fuera de los límites
    return { mag: 0, angle: 0 };
  }
}

// Clase Particle para manejar cada partícula individual
class Particle {
  constructor() {
    this.reset();
  }

  update() {
    let angle, mag;
    if (useInterpolation) {
      // Usar interpolación bilineal
      let vector = getInterpolatedVector(this.pos.x, this.pos.y);
      angle = vector.angle;
      mag = vector.mag;
    } else {
      // Usar vector del grid sin interpolación
      let gridX = Math.floor((this.pos.x / zoomScale) * (360 / width));
      let gridY = Math.floor((this.pos.y / zoomScale) * (181 / height));
      let index = gridX + gridY * 361;
      if (index >= 0 && index < magnitud.length) {
        angle = direction[index];
        mag = magnitud[index];
      } else {
        angle = 0;
        mag = 0;
      }
    }

    if (mag > 0) {
      // Calcular la aceleración basada en la dirección y magnitud
      let force = p5.Vector.fromAngle(angle);
      force.setMag(map(mag, 0, 28.7, 0, 0.5));
      this.acc.add(force);

      // Actualizar velocidad y posición
      this.vel.add(this.acc);
      this.vel.limit(this.maxSpeed);
      this.pos.add(this.vel);
      this.acc.mult(0);

      // Envejecer la partícula
      this.age++;
      if (this.age > this.lifespan) {
        this.reset();
      }
    } else {
      this.reset(); // Resetear si está fuera del rango
    }
  }

  display() {
    // Ajustar el tamaño de la partícula según el zoom
    let particleSize = 2 / zoomScale;
    particleSize = constrain(particleSize, 0.5, 5); // Limitar el tamaño

    // Dibujar la partícula
    let mag;
    if (useInterpolation) {
      mag = getInterpolatedVector(this.pos.x, this.pos.y).mag;
    } else {
      let gridX = Math.floor((this.pos.x / zoomScale) * (360 / width));
      let gridY = Math.floor((this.pos.y / zoomScale) * (181 / height));
      let index = gridX + gridY * 361;
      mag = magnitud[index] || 0;
    }

    let colorHue = map(mag, 0, 28, 0, 240); // 240 (azul) a 0 (rojo)
    fill(colorHue, 255, 255, 150); // Color HSB con transparencia 
    ellipse(this.pos.x, this.pos.y, 2);
  }

  reset() {
    // Calcular el tamaño del área visible
    let visibleWidth = width / zoomScale;
    let visibleHeight = height / zoomScale;

    // Generar una nueva posición aleatoria dentro del área visible
    let x = random(0, visibleWidth);
    let y = random(0, visibleHeight);
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = 2;
    this.lifespan = random(100, 400);
    this.age = 0;
  }
}