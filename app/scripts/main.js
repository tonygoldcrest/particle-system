var canvas;
var background;
var stats;
var ctx;
var backgroundCtx;
var particles = [];
var heavyParticles = [];
var config;
var startTime;

var mousedown = false;
var mouseposition;
var isActiveTab = true;


class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    Object.defineProperty(this, 'length', {
      get: function() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
      }
    })
  }

  add(vec2) {
    this.x += vec2.x;
    this.y += vec2.y;

    return this;
  }

  multiply(value) {
    this.x *= value;
    this.y *= value;

    return this;
  }

  subtract(vec2) {
    this.x -= vec2.x;
    this.y -= vec2.y;

    return this;
  }

  normalize(vec2) {
    var x = this.x / this.length,
      y = this.y / this.length;

    this.x = x;
    this.y = y;

    return this;
  }

  static subtract(vec1, vec2) {
    return (new Vector2(vec1.x, vec1.y)).subtract(vec2);
  }

  static normalize(vec) {
    var x = vec.x / vec.length,
      y = vec.y / vec.length;

    return new Vector2(x, y);
  }

}

class Particle {
  constructor(position) {
    this.position = position;
    this.velocity = new Vector2(0, 0);
  }

  addForce(force) {
    this.velocity.add(force);
  }

  move() {
    this.position.add(this.velocity.multiply(1/config.friction));
  }
}

var Config = function () {
  this.particlesCount = 20000;
  this.friction = 1.001;

  this.particlesColor = '#C93756';
  this.backgroundColor = '#000000';
  this.heavyParticlesColor = '#C93756';
  this.heavyParticlesSize = 5;
  
  this.polygonAngleCount = 3;
  this.polygonRadius = 100;

  this.explosionForce = 10;
}

function init() {

  config = new Config();
  var gui = new dat.GUI();

  gui.add(config, 'particlesCount', 100, 100000).onFinishChange(function() {
    particles = [];
    initialSpawn();
  });
  gui.add(config, 'polygonAngleCount', 1, 10).step(1);
  gui.add(config, 'polygonRadius', 100, 500).step(50);
  gui.add(config, 'friction', 1.001, 1.1);
  gui.add(config, 'explosionForce', 1, 20).step(1);
  gui.addColor(config, 'particlesColor');
  gui.addColor(config, 'backgroundColor').onChange(function(value) {
    resetBackground();
    heavyParticles.forEach(function(hp) {
      backgroundCtx.fillStyle = config.heavyParticlesColor;
      backgroundCtx.fillRect(hp.x, hp.y, 5, 5);
    });
  });
  gui.addColor(config, 'heavyParticlesColor');


  canvas = document.getElementById('main-canvas');
  background = document.getElementById('background');
  background.width = canvas.width = window.innerWidth;
  background.height = canvas.height = window.innerHeight;

  ctx = canvas.getContext('2d');
  backgroundCtx = background.getContext('2d');

  resetBackground();

  stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild( stats.dom );

  initialSpawn();

  canvas.addEventListener('mousedown', function (evt) {
    mousedown = true;
    mouseposition = new Vector2(evt.x, evt.y);
  });

  canvas.addEventListener('mousemove', function (evt) {
    mouseposition = new Vector2(evt.x, evt.y);
  });

  document.addEventListener('mouseup', function (evt) {
    mousedown = false;
  });

  document.addEventListener('keypress', function (evt) {
    if (evt.key == 'e') {
      particles = [];
      spawn(50, mouseposition, config.particlesCount);
    } else if (evt.key == 'w') {
      evt.preventDefault();
      spawnHeavy(mouseposition);
    } else if (evt.key == 'g') {
      heavyParticles = [];
      resetBackground();
    } else if (evt.key == 'a') {
      spawn(50, mouseposition, 1000);
    } else if (evt.key == 'r') {
      particles = [];
    } else if (evt.key == 'x') {
      particles.forEach(function (particle) {
        var force = Vector2.subtract(particle.position, mouseposition);
        particle.addForce(force.multiply(1 / force.length).multiply(config.explosionForce));
      });
    } else if (evt.key == 'l') {
      $('#legend').toggle();
    }
  });

  window.addEventListener('focus', function() {
    isActiveTab = true;
  });

  window.addEventListener('blur', function() {
    isActiveTab = false;
  });

  mouseposition = new Vector2(canvas.width/2, canvas.height/2);

  startTime = Date.now();
  animate();
}

function initialSpawn() {
  var radius = 50;
  var center = new Vector2(canvas.width / 2, canvas.height / 2);
  
  spawn(radius, center, config.particlesCount);
}

function spawn(radius, center, count) {
  for(var i = 0; i < count; i++) {
    var r = getRandomNumber(0, radius);
    var phi = getRandomNumber(0, 2*Math.PI);
    var x = r * Math.sin(phi);
    var y = r * Math.cos(phi);

    var particle = new Particle(new Vector2(x + center.x, y + center.y));
    particles.push(particle);
    particle.addForce(Vector2.subtract(particle.position, center).multiply(0.05));
  }
}

function spawnHeavy(center) {
  var num = config.polygonAngleCount;
  var radius = config.polygonRadius;
  if (num > 1) {
    for (var i = 0; i < num; i++ ) {
      var x = center.x + radius*Math.cos((360 / (2 * num))*Math.PI/180 + 2*Math.PI*i/num);
      var y = center.y + radius*Math.sin((360 / (2 * num))*Math.PI/180 + 2*Math.PI*i/num);
      heavyParticles.push(new Vector2(x, y));
      backgroundCtx.fillStyle = config.heavyParticlesColor;
      backgroundCtx.fillRect(x, y, 5, 5);
    }
  } else {
    heavyParticles.push(center);
    backgroundCtx.fillStyle = config.heavyParticlesColor;
    backgroundCtx.fillRect(center.x, center.y, 5, 5);
  }
}

function resetBackground() {
  backgroundCtx.fillStyle = config.backgroundColor;
  backgroundCtx.fillRect(0,0,background.width,background.height);
}

function animate() {
  stats.begin();
  var deltaTime = (Date.now() - startTime) / 1000;
  ctx.clearRect(0,0, canvas.width, canvas.height);

  ctx.fillStyle = config.particlesColor;
  particles.forEach(function(particle) {
    if (mousedown) {
      var length = Math.sqrt(Math.pow(mouseposition.x - particle.position.x, 2) + Math.pow(mouseposition.y - particle.position.y, 2));
      particle.velocity.x += deltaTime * 40 * (1 / length) * (mouseposition.x - particle.position.x);
      particle.velocity.y += deltaTime * 40 * (1 / length) * (mouseposition.y - particle.position.y);
    }

    heavyParticles.forEach(function (hp) {
      var length = Math.sqrt(Math.pow(hp.x - particle.position.x, 2) + Math.pow(hp.y - particle.position.y, 2));
      particle.velocity.x += deltaTime * 40 * (1 / length) * (hp.x - particle.position.x);
      particle.velocity.y += deltaTime * 40 * (1 / length) * (hp.y - particle.position.y);
    });

    if (( particle.position.x >= canvas.width && particle.velocity.x > 0 ) || ( particle.position.x <= 0 && particle.velocity.x < 0 )) particle.velocity.x = -particle.velocity.x;
    if (( particle.position.y >= canvas.height && particle.velocity.y > 0 ) || ( particle.position.y <= 0 && particle.velocity.y < 0 )) particle.velocity.y = -particle.velocity.y;

    particle.move();
    ctx.fillRect(Math.round(particle.position.x), Math.round(particle.position.y), 1, 1);
  });

  stats.end();
  startTime = Date.now();
  if (isActiveTab)
    requestAnimationFrame(animate);
  else {
    setTimeout(animate, 16);
  }
}

function getRandomNumber(min, max) {
  return Math.random()*(max - min) + min;
}
