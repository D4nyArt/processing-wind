//https://www.openprocessing.org/sketch/157576

var num = 361*182;
var noiseScale=100, noiseStrength=1;
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

  processWindData(windData);

  for (let i=0; i<361; i++) {
    for(let j=0; j<182; j++){
      //x value start slightly outside the right of canvas, z value how close to viewer
      var loc = createVector(i, j, 1) ;
      var angle = createVector(cos(direction[i*j]), sin(direction[i*j])); //any value to initialize
      var dir = createVector(cos(direction[i*j]), sin(direction[i*j]));
      var speed = magnitud[i*j];
      particles[i]= new Particle(loc, dir, speed, angle);
      
      /*let location = createVector(i*3.5, j*4); // Starting location
      let angle = direction[i*j]; // 45 degrees in radians
      let mag = magnitud[i*j]; // Length of the vector
      drawVector(location, angle, mag);*/
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
function draw() {
  // background(0);
  fill(0, 10);
  noStroke();
  rect(0, 0, width, height);
  for (let i=0; i<particles.length; i++) {
    particles[i].run();
  }
}

class Particle{
  constructor(_loc,_dir,_speed, _angle){
    this.loc = _loc;
    this.dir = _dir;
    this.speed = _speed;
    this.angle = _angle
  }
  run() {
    this.move();
    this.checkEdges();
    this.update();
  }
  move(){
    let angle = this.angle
    this.dir.y = sin(angle);
    var vel = this.dir.copy();
    var d =1;  //direction change 
    vel.mult(this.speed*d); //vel = vel * (speed*d)
    this.loc.add(vel); //loc = loc + vel
  }
  checkEdges(){
    //float distance = dist(width/2, height/2, loc.x, loc.y);
    //if (distance>150) {
    if (this.loc.x<0 || this.loc.x>width || this.loc.y<0 || this.loc.y>height) {    
      this.loc.x = random(width*1.2);
      this.loc.y = random(height);
    }
  }
  update(){
    fill(255);
    ellipse(this.loc.x, this.loc.y, this.loc.z);
  }
}