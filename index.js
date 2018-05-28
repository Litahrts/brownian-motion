"use strict";

import * as THREE from 'three';
// import OrbitControls from 'three-orbit-controls';
let OrbitControls = require('three-orbit-controls')(THREE);
import WindowResize from 'three-window-resize';

let camera, controls, scene, renderer;
let container, stats, GUI, gui, spotLight;

let DIMENSIONS = 120;

const SPHERE_RADIUS = 2;
const SPHERE_MASS = 2.0;
let amountOfSpheres = 500;
let balls = [];

const EYE_CANDY_RADIUS = 8;
const EYE_CANDY_MASS = 8.0;
let amountOfEyeCandies = 50;
let eyeCandies = [];

let ballsSpeed = 2;
let eyesSpeed = 1;

let animation;

let initGraphics = () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    //CAMERA
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = DIMENSIONS * 2.5;

    //CONTROLS THE CAMERA
    controls = new OrbitControls(camera, container);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.enableRotate = true;
    controls.addEventListener('change', render);

    //SCENE
    scene = new THREE.Scene();
    let ambient = new THREE.AmbientLight( 0xccffff, 0.4 );
    scene.add( ambient );
    // scene.add(createCube());

    spotLight = new THREE.SpotLight( 0xffffff );
    spotLight.position.set( 0, 500, 0 );

    spotLight.castShadow = true;

    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;

    spotLight.shadow.camera.near = 500;
    spotLight.shadow.camera.far = 4000;
    spotLight.shadow.camera.fov = 30;
    spotLight.intensity = 1.32;
    spotLight.angle = 0.8;
    spotLight.penumbra = 1;
    spotLight.decay = 1;

    scene.add( spotLight );

    var spotLightHelper = new THREE.SpotLightHelper( spotLight );
    // scene.add( spotLightHelper );
    scene.add( createPlane() );

    for(let i = 0; i < amountOfSpheres; i++) {
        scene.add(createSphere());
    }
    for(let k = 0; k < amountOfEyeCandies; k++) {
        scene.add(eyeCandy());
    }

    //RENDERER
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    //EVENTS
    WindowResize(renderer, camera);
    THREEx.FullScreen.bindKey({ //only works on chrome and firefox
        charCode: 'm'.charCodeAt(0)
    });

    //KEYBOARD EVENTS
    document.addEventListener('keydown', keyboardEvents, false);

    container.appendChild(renderer.domElement);
    stats = new Stats();
    container.appendChild(stats.dom);

    //GUI
    displayGUI();
    // buildGui();
};

// Creating a cube with a set dimension
let createCube = () => {
    let geometry = new THREE.CubeGeometry(DIMENSIONS, DIMENSIONS, DIMENSIONS);
    let material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        opacity: 0.3,
        transparent: true
    });
    let mesh = new THREE.Mesh(geometry, material);
    return new THREE.BoxHelper(mesh);
};
// Create plane
let createPlane = () => {

    let texture = new THREE.TextureLoader().load("./src/images/diplom.jpg" );

    let material = new THREE.MeshPhongMaterial( { map: texture } );
    let geometry = new THREE.PlaneBufferGeometry( 2500, 2000 );
    let mesh = new THREE.Mesh( geometry, material );
    mesh.position.set( 0, -DIMENSIONS - 30, 0 );
    mesh.rotation.x = - Math.PI * 0.5;
    mesh.receiveShadow = true;

    return mesh;
};

//Creates a sphere with a random position and a random velocity with a set radius
let createSphere = () => {
    let geometry = new THREE.SphereGeometry(SPHERE_RADIUS, 32, 32);
    let material = new THREE.MeshPhongMaterial({
        color: 0xb11717,
        dithering: true
    });
    let mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.position.set((Math.random() - 0.5) * (DIMENSIONS - geometry.parameters.radius * 2),
        (Math.random() - 0.5) * (DIMENSIONS - geometry.parameters.radius * 2),
        (Math.random() - 0.5) * (DIMENSIONS - geometry.parameters.radius * 2));
    mesh.velocity = new THREE.Vector3((Math.random() * ballsSpeed) - 1, (Math.random() * ballsSpeed) - 1, (Math.random() * ballsSpeed) - 1);

    balls.push(mesh);
    return mesh;
};

//Creates a big sphere with a random position and a random velocity with a set radius
let eyeCandy = () => {
    let geometry = new THREE.SphereGeometry(EYE_CANDY_RADIUS, 32, 32);
    let material = new THREE.MeshPhongMaterial({
        color: 0x07498
    });
    let mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;

    mesh.position.set((Math.random() - 0.5) * (DIMENSIONS - geometry.parameters.radius * 2),
        (Math.random() - 0.5) * (DIMENSIONS - geometry.parameters.radius * 2),
        (Math.random() - 0.5) * (DIMENSIONS - geometry.parameters.radius * 2));
    mesh.velocity = new THREE.Vector3(eyesSpeed, eyesSpeed, eyesSpeed);

    eyeCandies.push(mesh);
    return mesh;
};

//Check to see if the position of the ball doesn't go past the wall and also check to see if it's velocity is less than or greater than 0 so it doesn't spike past and get stuck by the edge of the wall
let checkWallBoundaries = (current) => {
    if(current.position.x >= DIMENSIONS / 2 - current.geometry.parameters.radius && current.velocity.x > 0 || current.position.x <= -DIMENSIONS / 2 + current.geometry.parameters.radius && current.velocity.x < 0)
        current.velocity.setX(-current.velocity.x);

    if(current.position.y >= DIMENSIONS / 2 - current.geometry.parameters.radius && current.velocity.y > 0 || current.position.y <= -DIMENSIONS / 2 + current.geometry.parameters.radius && current.velocity.y < 0)
        current.velocity.setY(-current.velocity.y);

    if(current.position.z >= DIMENSIONS / 2 - current.geometry.parameters.radius && current.velocity.z > 0 || current.position.z <= -DIMENSIONS / 2 + current.geometry.parameters.radius && current.velocity.z < 0)
        current.velocity.setZ(-current.velocity.z);
};

//Check to see if the spheres distance is less than both their radius combined which indicates they intersected
let intersects = (sphere, other) => {
    let x1 = sphere.position.x;
    let x2 = other.position.x;

    let y1 = sphere.position.y;
    let y2 = other.position.y;

    let z1 = sphere.position.z;
    let z2 = other.position.z;

    if ((x1 - x2) >= (sphere.geometry.parameters.radius + other.geometry.parameters.radius) || (y1 - y2) >= (sphere.geometry.parameters.radius + other.geometry.parameters.radius) || (z1 - z2) >= (sphere.geometry.parameters.radius + other.geometry.parameters.radius))
        return false;

    let distance = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) + (z1 - z2) * (z1 - z2));

    return (distance < (sphere.geometry.parameters.radius + other.geometry.parameters.radius));
};

//Look for any collisions between spheres and if there is apply elastic collision
let checkSphereCollision = (current) => {
    for(let i = current + 1; i < balls.length; i++) {
        if(intersects(balls[current], balls[i])) {
            //Used elastic collision formula
            //v1 = (v1*(m1-m2))/(m1+m2) + (2*v2*m2)/(m1+m2)
            //v2 = (2*v1*m1)/(m1+m2) - (v2*(m1-m2))/(m1+m2)
            let bVelx = (2 * SPHERE_MASS * balls[i].velocity.x) / (SPHERE_MASS + SPHERE_MASS);
            let bVely = (2 * SPHERE_MASS * balls[i].velocity.y) / (SPHERE_MASS + SPHERE_MASS);
            let bVelz = (2 * SPHERE_MASS * balls[i].velocity.z) / (SPHERE_MASS + SPHERE_MASS);
            let b2Velx = (2 * balls[current].velocity.x * SPHERE_MASS) / (SPHERE_MASS + SPHERE_MASS);
            let b2Vely = (2 * balls[current].velocity.y * SPHERE_MASS) / (SPHERE_MASS + SPHERE_MASS);
            let b2Velz = (2 * balls[current].velocity.z * SPHERE_MASS) / (SPHERE_MASS + SPHERE_MASS);
            balls[current].velocity.x = bVelx;
            balls[current].velocity.y = bVely;
            balls[current].velocity.z = bVelz;
            balls[i].velocity.x = b2Velx;
            balls[i].velocity.y = b2Vely;
            balls[i].velocity.z = b2Velz;
        }
    }
};

let changeBallsCount = () => {
    let countBalls = balls.length;
    for(let i = 0; i < countBalls; i++) {
        balls[i].visible = true;
    }
    for(let i = 0; i < countBalls - amountOfSpheres; i++) {
        balls[i].visible = false;
    }
};

let changeCandysCount = () => {
    let countBalls = eyeCandies.length;
    for(let i = 0; i < countBalls; i++) {
        eyeCandies[i].visible = true;
    }
    for(let i = 0; i < countBalls - amountOfEyeCandies; i++) {
        eyeCandies[i].visible = false;
    }
};

//Look for any collisions between sphere and big sphere and if there is apply elastic collision
let checkCandySphereCollision = (current) => {
    for(let i = 0; i < eyeCandies.length; i++) {
        if(intersects(balls[current], eyeCandies[i])) {
            //Used elastic collision formula
            //v1 = (v1*(m1-m2))/(m1+m2) + (2*v2*m2)/(m1+m2)
            //v2 = (2*v1*m1)/(m1+m2) - (v2*(m1-m2))/(m1+m2)
            let bVelx = (balls[current].velocity.x * (SPHERE_MASS - EYE_CANDY_MASS)) / (EYE_CANDY_MASS + SPHERE_MASS) + (2 * EYE_CANDY_MASS * eyeCandies[i].velocity.x) / (SPHERE_MASS + EYE_CANDY_MASS);
            let bVely = (balls[current].velocity.y * (SPHERE_MASS - EYE_CANDY_MASS)) / (EYE_CANDY_MASS + SPHERE_MASS) + (2 * EYE_CANDY_MASS * eyeCandies[i].velocity.y) / (SPHERE_MASS + EYE_CANDY_MASS);
            let bVelz = (balls[current].velocity.z * (SPHERE_MASS - EYE_CANDY_MASS)) / (EYE_CANDY_MASS + SPHERE_MASS) + (2 * EYE_CANDY_MASS * eyeCandies[i].velocity.z) / (SPHERE_MASS + EYE_CANDY_MASS);
            let cVelx = (2 * balls[current].velocity.x * SPHERE_MASS) / (EYE_CANDY_MASS + SPHERE_MASS) - (eyeCandies[i].velocity.x * (SPHERE_MASS - EYE_CANDY_MASS)) / (SPHERE_MASS + EYE_CANDY_MASS);
            let cVely = (2 * balls[current].velocity.y * SPHERE_MASS) / (EYE_CANDY_MASS + SPHERE_MASS) - (eyeCandies[i].velocity.y * (SPHERE_MASS - EYE_CANDY_MASS)) / (SPHERE_MASS + EYE_CANDY_MASS);
            let cVelz = (2 * balls[current].velocity.z * SPHERE_MASS) / (EYE_CANDY_MASS + SPHERE_MASS) - (eyeCandies[i].velocity.z * (SPHERE_MASS - EYE_CANDY_MASS)) / (SPHERE_MASS + EYE_CANDY_MASS);
            balls[current].velocity.x = bVelx;
            balls[current].velocity.y = bVely;
            balls[current].velocity.z = bVelz;
            eyeCandies[i].velocity.x = cVelx;
            eyeCandies[i].velocity.y = cVely;
            eyeCandies[i].velocity.z = cVelz;
        }
    }
};

//Displays a GUI with controls to toggle the visibility and color of the spheres
let displayGUI = () => {
    GUI = new dat.GUI();
    let param = {
        keys: function() {
            alert("H: Hides the controller" + "\n" + "Z: Enables and disables zoom" + "\n" + "P: Enables and disables pan" + "\n" + "R: Enables and disables rotation" + "\n" + "M: Enables FullScreen");
        },
        dimensions: DIMENSIONS,
        candyVisible: true,
        candyColor: "#ff0000",
        candyCount: amountOfEyeCandies,

        spheresVisible: true,
        spheresColor: "#0000ff",
        spheresCount: amountOfSpheres,
        animate: true,

        ballsSpeed: ballsSpeed,
        eyesSpeed: eyesSpeed,
    };

    GUI.add(param, 'keys').name("Key Controls");

    //Cube
    let cube = GUI.addFolder("Cube");

    let cubeDimensions = cube.add(param, 'dimensions', 120, 550).name("Count");
    cubeDimensions.onChange(function (value) {
        // scene.add(createCube());
        DIMENSIONS = value;
    });
    //Folder for candy controls
    let candy = GUI.addFolder("Bigger Particle");
    let visibleCandy = candy.add(param, 'candyVisible').name("Visible");
    visibleCandy.onChange(function (value) {
        for(let i = 0; i < eyeCandies.length; i++) {
            eyeCandies[i].visible = value;
        }
    });
    let colorCandy = candy.addColor(param, 'candyColor').name("Color");
    colorCandy.onChange(function (value) {
        for(let i = 0; i < eyeCandies.length; i++) {
            eyeCandies[i].material.color.setHex(value.replace("#", "0x"));
        }
    });

    let candyCount = candy.add(param, 'candyCount', 1, 50).name("Count");
    candyCount.onChange(function (value) {
        amountOfEyeCandies = value;
        changeCandysCount()
    });

    let candySpeedGui = candy.add(param, 'eyesSpeed', 1, 10).name("Speed");
    candySpeedGui.onChange(function (value) {
        eyesSpeed = value;
        for(let i = 0; i < eyeCandies.length; i++) {
            eyeCandies[i].velocity = new THREE.Vector3(eyesSpeed, eyesSpeed, eyesSpeed);;
        }
    });

    candy.open();

    //Folder for balls controls
    let sphere = GUI.addFolder("Smaller Particles");
    let visibleSphere = sphere.add(param, 'spheresVisible').name("Visible");
    visibleSphere.onChange(function (value) {
        for(let i = 0; i < balls.length; i++) {
            balls[i].visible = value;
        }
    });
    let colorSphere = sphere.addColor(param, 'spheresColor').name("Color");
    colorSphere.onChange(function (value) {
        for(let i = 0; i < balls.length; i++) {
            balls[i].material.color.setHex(value.replace("#", "0x"));
        }
    });

    let spheresCount = sphere.add(param, 'spheresCount', 0, 500).name("Count");
    spheresCount.onChange(function (value) {
        amountOfSpheres = value;
        changeBallsCount()
    });

    let ballsSpeedGui = sphere.add(param, 'ballsSpeed', 1, 10).name("Speed");
    ballsSpeedGui.onChange(function (value) {
        ballsSpeed = value;
        for(let i = 0; i < balls.length; i++) {
            balls[i].velocity = new THREE.Vector3((Math.random() * ballsSpeed) - 1, (Math.random() * ballsSpeed) - 1, (Math.random() * ballsSpeed) - 1);;
        }
    });

    let currentAnimation = GUI.addFolder("Animation");

    let motion = currentAnimation.add(param, 'animate').name("Motion")
    motion.onChange(function (value) {
        if (value == true) {
            requestAnimationFrame(animate);
        } else {
            cancelAnimationFrame(animation);
        }
    });

    sphere.open();

    GUI.open()
};

//Add keyboard events
let keyboardEvents = () => {
    if(event.keyCode === 81) //letter Q toggles visibility of smaller spheres
        for(let i = 0; i < balls.length; i++)
            balls[i].visible = !balls[i].visible;

    if(event.keyCode === 87) //letter W toggles visibility of bigger sphere
        for(let k = 0; k < eyeCandies.length; k++)
            eyeCandies[k].visible = !eyeCandies[k].visible;

    if(event.keyCode === 90) //letter Z toggles zoom
        controls.enableZoom = !controls.enableZoom;

    if(event.keyCode === 80) //letter P toggles panning
        controls.enablePan = !controls.enablePan;

    if(event.keyCode === 82) //letter R toggles rotation
        controls.enableRotate = !controls.enableRotate;
};

let animate = () => {
    //goes through every ball and checks for wall boundaries and collision
    for(let i = 0; i < balls.length; i++) {
        balls[i].position.add(balls[i].velocity);
        checkWallBoundaries(balls[i]);
        checkSphereCollision(i);
        checkCandySphereCollision(i);
    }

    //checks to see if the big sphere collided with the wall
    for(let k = 0; k < eyeCandies.length; k++) {
        eyeCandies[k].position.add(eyeCandies[k].velocity);
        checkWallBoundaries(eyeCandies[k]);
    }

    animation = requestAnimationFrame(animate);
    renderer.render(scene, camera);

    controls.update();
    stats.update();
};

let stopAtimate = (id) => {
    // console.log(1);
    cancelAnimationFrame(id);
};

let render = () => {
    renderer.clear();
    renderer.render(scene, camera);
};

function buildGui() {
    gui = new dat.GUI();
    let params = {
        'light color': spotLight.color.getHex(),
        intensity: spotLight.intensity,
        distance: spotLight.distance,
        angle: spotLight.angle,
        penumbra: spotLight.penumbra,
        decay: spotLight.decay
    }
    gui.addColor( params, 'light color' ).onChange( function ( val ) {
        spotLight.color.setHex( val );
        render();
    } );
    gui.add( params, 'intensity', 0, 2 ).onChange( function ( val ) {
        spotLight.intensity = val;
        render();
    } );
    gui.add( params, 'distance', 50, 200 ).onChange( function ( val ) {
        spotLight.distance = val;
        render();
    } );
    gui.add( params, 'angle', 0, Math.PI / 3 ).onChange( function ( val ) {
        spotLight.angle = val;
        render();
    } );
    gui.add( params, 'penumbra', 0, 1 ).onChange( function ( val ) {
        spotLight.penumbra = val;
        render();
    } );
    gui.add( params, 'decay', 1, 2 ).onChange( function ( val ) {
        spotLight.decay = val;
        render();
    } );
    gui.open();
}

if(Detector.webgl) {
    initGraphics();
    animate();
} else {
    let warning = Detector.getWebGLErrorMessage();
    document.getElementById('container').appendChild(warning);
}