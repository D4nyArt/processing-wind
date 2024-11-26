// p5.js - Simulación de partículas con mapa de fondo y zoom dinámico

// Variables principales
let num = 361 * 182; // Número de puntos en el grid global (361 x 182)
let particles = []; // Array que almacena las partículas de la simulación
let particleCount = 100000; // Cantidad base de partículas

var noiseScale = 500, noiseStrength = 1; // Configuración para efectos de ruido (no usados explícitamente)

let magnitud = []; // Array que almacena la magnitud del viento en cada punto del grid
let direction = []; // Array que almacena la dirección del viento en cada punto del grid
let windData; // Variable para almacenar los datos del viento
let mapaMundi; // Imagen de fondo del mapa mundial

let zoomScale = 1; // Nivel de zoom inicial

// Carga de datos y recursos antes de iniciar el programa
function preload() {
  windData = loadJSON('current-wind-surface-level-gfs-1.0.json'); // Datos del viento en formato JSON
  mapaMundi = loadImage('mapamundi.png'); // Imagen del mapa mundial (debe estar en el proyecto)
}

// Procesar los datos del viento para calcular magnitudes y direcciones
function processWindData(data) {
  // Datos de componentes u (horizontal) y v (vertical)
  let u_comp_info = data[0];
  let v_comp_info = data[1];
  let u_comp = [], v_comp = [];

  // Extraer los datos de cada componente
  u_comp_info.data.forEach((comp, idx) => {
    u_comp[idx] = comp;
  });

  v_comp_info.data.forEach((comp, idx) => {
    v_comp[idx] = comp;
  });

  // Calcular magnitud y dirección del viento en cada punto
  for (let i = 0; i < u_comp.length; i++) {
    magnitud[i] = Math.sqrt(u_comp[i] ** 2 + v_comp[i] ** 2); // Magnitud = sqrt(u^2 + v^2)
    let direct = Math.atan2(v_comp[i], u_comp[i]) + Math.PI; // Dirección en radianes (ajustada entre 0 y 2*PI)
    direction[i] = direct % (2 * Math.PI); // Normalización del ángulo
  }
}

// Configuración inicial del lienzo
function setup() {
  createCanvas(windowWidth, windowHeight); // Crear el lienzo del tamaño de la ventana
  noStroke(); // Sin bordes para las partículas
  colorMode(HSB, 360, 255, 255, 255); // Modo de color HSB con transparencia
  processWindData(windData); // Procesar los datos del viento
}

// Bucle principal para dibujar en cada frame
function draw() {
  background(0, 0, 0, 10); // Fondo negro con transparencia
  scale(zoomScale); // Escalar según el nivel de zoom
  image(mapaMundi, 0, 0, width, height); // Dibujar el mapa de fondo

  // Ajustar la cantidad de partículas según el zoom
  let desiredParticleCount = int(particleCount * zoomScale * zoomScale);
  adjustParticleCount(desiredParticleCount);

  // Actualizar y dibujar todas las partículas
  for (let particle of particles) {
    particle.update(); // Actualizar estado
    particle.display(); // Dibujar en pantalla
  }
}

// Ajustar la cantidad de partículas según el nivel de zoom
function adjustParticleCount(desiredCount) {
  if (particles.length < desiredCount) {
    let countToAdd = desiredCount - particles.length; // Número de partículas a añadir
    for (let i = 0; i < countToAdd; i++) {
      particles.push(new Particle()); // Crear nuevas partículas
    }
  } else if (particles.length > desiredCount) {
    particles.splice(desiredCount, particles.length - desiredCount); // Eliminar partículas sobrantes
  }
}

// Detectar el desplazamiento del ratón para hacer zoom
function mouseWheel(event) {
  zoomScale += event.delta * 0.001; // Ajustar el nivel de zoom
  zoomScale = constrain(zoomScale, 0.5, 5); // Restringir entre 0.5x y 5x
}

// Convertir coordenadas de latitud y longitud a posiciones en píxeles
function latLonToXY(lat, lon) {
  let x = map(lon, -180, 180, 0, width); // Convertir longitud a posición x
  let y = map(lat, -85, 85, height, 0); // Convertir latitud a posición y
  return createVector(x, y); // Devolver como vector
}

// Interpolar correctamente entre dos ángulos
function lerpAngle(a0, a1, t) {
  let max = TWO_PI; // Máximo valor angular
  let da = (a1 - a0) % max; // Diferencia angular
  da = ((2 * da) % max) - da; // Ajustar al rango -PI a PI
  return (a0 + da * t) % max; // Devolver el ángulo interpolado
}

// Obtener el vector interpolado (magnitud y dirección) para una posición
function getInterpolatedVector(x, y) {
  let gridX = (x / zoomScale) * (360 / width); // Escalar la posición x al grid
  let gridY = (y / zoomScale) * (181 / height); // Escalar la posición y al grid

  let x0 = Math.floor(gridX), y0 = Math.floor(gridY); // Índices del grid inferior
  let x1 = x0 + 1, y1 = y0 + 1; // Índices del grid superior

  let tx = gridX - x0, ty = gridY - y0; // Fracción de interpolación

  let idx00 = x0 + y0 * 361; // Índices del grid para interpolar
  let idx10 = x1 + y0 * 361;
  let idx01 = x0 + y1 * 361;
  let idx11 = x1 + y1 * 361;

  // Comprobar que los índices están dentro de los límites
  if (idx00 >= 0 && idx11 < magnitud.length) {
    let mag0 = lerp(magnitud[idx00], magnitud[idx10], tx);
    let mag1 = lerp(magnitud[idx01], magnitud[idx11], tx);
    let mag = lerp(mag0, mag1, ty); // Interpolación bilineal de magnitudes

    let angle0 = lerpAngle(direction[idx00], direction[idx10], tx);
    let angle1 = lerpAngle(direction[idx01], direction[idx11], tx);
    let angle = lerpAngle(angle0, angle1, ty); // Interpolación bilineal de ángulos

    return { mag, angle }; // Vector interpolado
  } else {
    return { mag: 0, angle: 0 }; // Fuera de rango
  }
}

// Clase Particle para manejar cada partícula individualmente
class Particle {
  constructor() {
    this.reset(); // Inicializar posición y propiedades
  }

  update() {
    // Obtener el vector de viento interpolado en la posición actual
    let vector = getInterpolatedVector(this.pos.x, this.pos.y);
    let angle = vector.angle; // Dirección del viento
    let mag = vector.mag; // Magnitud del viento

    if (mag > 0) {
      // Calcular la fuerza del viento y aplicarla
      let force = p5.Vector.fromAngle(angle);
      force.setMag(map(mag, 0, 28.7, 0, 0.5)); // Escalar la magnitud
      this.acc.add(force);

      // Actualizar velocidad y posición
      this.vel.add(this.acc);
      this.vel.limit(this.maxSpeed); // Limitar la velocidad máxima
      this.pos.add(this.vel);
      this.acc.mult(0); // Reiniciar aceleración

      // Envejecer la partícula y resetear si supera su vida útil
      this.age++;
      if (this.age > this.lifespan) {
        this.reset();
      }
    } else {
      this.reset(); // Resetear si está fuera del rango válido
    }
  }

  display() {
    let particleSize = 2 / zoomScale; // Ajustar tamaño según zoom
    particleSize = constrain(particleSize, 0.5, 5); // Limitar tamaño

    let mag = getInterpolatedVector(this.pos.x, this.pos.y).mag; // Obtener magnitud
    let colorHue = map(mag, 0, 28, 0, 240); // Escalar de rojo (0) a azul (240)
    fill(colorHue, 255, 255, 150); // Color HSB con transparencia
    ellipse(this.pos.x, this.pos.y, particleSize); // Dibujar partícula
  }

  reset() {
    // Generar nueva posición aleatoria dentro del área visible
    let visibleWidth = width / zoomScale; 
    let visibleHeight = height / zoomScale;
    this.pos = createVector(random(0, visibleWidth), random(0, visibleHeight));
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = 2; // Velocidad máxima de la partícula
    this.lifespan = random(100, 400); // Tiempo de vida de la partícula
    this.age = 0; // Reiniciar la edad
  }
}
