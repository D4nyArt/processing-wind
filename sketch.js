// p5.js - Simulación de partículas con color según velocidad del viento (0 a 28)
var num = 361 * 182;
var noiseScale = 100, noiseStrength = 1;
var particles = [];
var particleCount = 40000; // Cantidad de partículas en la simulación

let magnitud = []; // Array con la magnitud del viento en cada punto del grid
let direction = []; // Array con la dirección del viento en cada punto del grid
let windData;

function preload() {
  windData = loadJSON('current-wind-surface-level-gfs-1.0.json');
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
  colorMode(HSB, 360, 255, 255, 255); // Configuración del modo de color HSB (Hue, Saturation, Brightness)
  processWindData(windData);

  // Crear las partículas iniciales
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
}

function draw() {
  background(0, 10); // Fondo negro con transparencia para crear un efecto de estela

  // Actualizar y dibujar todas las partículas
  for (let particle of particles) {
    particle.update();
    particle.display();
  }
}

// Clase Particle para manejar cada partícula individual
class Particle {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = 1;
    this.lifespan = random(100,400); // Vida útil de la partícula
    this.age = 0;
  }

  update() {
    // Obtener la posición en la cuadrícula del campo vectorial
    let gridX = Math.floor(this.pos.x / 3.5);
    let gridY = Math.floor(this.pos.y / 4);
    let index = gridX + gridY * 361;

    if (index >= 0 && index < magnitud.length) {
      // Direccionar la partícula según el vector en el grid
      let angle = direction[index];
      let mag = magnitud[index];

      // Calcular la aceleración en base a la dirección y magnitud
      let force = p5.Vector.fromAngle(angle);
      force.setMag(map(mag, 0, 28.7, 0, 0.5)); // Ajustar la fuerza según la magnitud (0 a 28)
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
      this.reset(); // Resetear si la partícula está fuera del rango del grid
    }
  }

  // Dibujar la partícula con un color basado en la magnitud del viento
  display() {
    let gridX = Math.floor(this.pos.x / 3.5);
    let gridY = Math.floor(this.pos.y / 4);
    let index = gridX + gridY * 361;

    if (index >= 0 && index < magnitud.length) {
      let mag = magnitud[index];
      
      // Mapa de color según la velocidad del viento (0 a 28)
      let colorHue = map(mag, 0, 28, 240, 0); // 240 (azul) a 0 (rojo)
      fill(color(colorHue, 255, 255, 150)); // Usar color HSB con transparencia
      ellipse(this.pos.x, this.pos.y, 0.5); // Dibujar la partícula como un círculo pequeño
    }
  }

  // Resetear la partícula a una nueva posición aleatoria
  reset() {
    this.pos = createVector(random(width), random(height));
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.age = 0;
  }
}