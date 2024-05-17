import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { CCDIKSolver, CCDIKHelper } from 'three/examples/jsm/animation/CCDIKSolver.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { XRButton } from 'three/addons/webxr/XRButton.js';
import gsap from 'gsap';
import Room from "./Room.js"
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
let scene, camera, renderer, orbitControls, transformControls, room;
let mirrorSphereCamera;
let controller1, controller2;
let controllerGrip1, controllerGrip2, ambientLight;

let raycaster, gltf, group, switchMaterial, switchMesh;

const intersected = [];

const OOI = {};
let IKSolver;
const ROOM_WIDTH = 40;
const ROOM_HEIGHT = 20;
const ROOM_LENGTH = 30;
let stats, gui, conf;
const v0 = new THREE.Vector3();

init(animate);
async function init(animate) {


    scene = new THREE.Scene();
    // scene.fog = new THREE.FogExp2(0x808080, .17);
    // scene.background = new THREE.Color(0xffffff);
    scene.background = new THREE.Color('#c8f0f9')
    console.log(scene, 'dddd')
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.001, 5000);
    camera.position.set(10, 4, 40);
    // camera.position.set(5.21, 1.6, 3.97);
    // scene.rotation.x = 0
    // scene.rotation.y = 1.56
    // scene.rotation.z = 0

    camera.lookAt(scene.position);

    ambientLight = new THREE.AmbientLight(0xffffff, 5); // soft white light
    // scene.add(ambientLight)

    room = new Room(ROOM_LENGTH, ROOM_HEIGHT, ROOM_WIDTH);
    scene.add(room.object);
    const sunLight = new THREE.DirectionalLight(0xc8f0f9, 1.96)
    sunLight.position.set(-69, 44, 14)
    scene.add(sunLight)
    renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // stats = new Stats();
    // document.body.appendChild(stats.dom);

    orbitControls = new OrbitControls(camera, renderer.domElement);
    // orbitControls.minDistance = 0.2;
    orbitControls.maxDistance = 100;
    orbitControls.enableDamping = true;

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    // const gltf = await gltfLoader.loadAsync('/models/kira.glb' );
    const gltff = await gltfLoader.loadAsync('/models/output.glb');

    console.log(gltff, 'gltff')
    group = new THREE.Group();
    scene.add(group);


    var loader1 = new THREE.TextureLoader();

    // Load an image file into a custom material
    var material1 = new THREE.MeshLambertMaterial({
        map: loader1.load('/models/image.jpeg')
    });

    // create a plane geometry for the image with a width of 10
    // and a height that preserves the image's aspect ratio
    var geometry1 = new THREE.PlaneGeometry(1.5, 2.5);

    // combine our image geometry and material into a mesh
    var mesh1 = new THREE.Mesh(geometry1, material1);

    // set the position of the image mesh in the x,y,z dimensions
    mesh1.position.set(-18, 3, 3)
    mesh1.rotation.y = 2
    // add the image to the scene
    scene.add(mesh1);



    const geometries = [
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        new THREE.ConeGeometry(0.2, 0.2, 64),
        new THREE.CylinderGeometry(0.2, 0.2, 0.2, 64),
        new THREE.IcosahedronGeometry(0.2, 8),
        new THREE.TorusGeometry(0.2, 0.04, 64, 32),
    ];

    for (let i = 0; i < geometries.length; i++) {

        const geometry = geometries[i];
        const material = new THREE.MeshStandardMaterial({
            color: Math.random() * 0xffffff,
            roughness: 0.7,
            metalness: 0.0
        });

        const object = new THREE.Mesh(geometry, material);

        object.position.x = Math.random() * 4 - 2;
        object.position.y = Math.random() * 2;
        object.position.z = Math.random() * 4 - 2;

        object.rotation.x = Math.random() * 2 * Math.PI;
        object.rotation.y = Math.random() * 2 * Math.PI;
        object.rotation.z = Math.random() * 2 * Math.PI;

        object.scale.setScalar(Math.random() + 0.5);

        object.castShadow = true;
        object.receiveShadow = true;

        group.add(object);

    }
    // gltf.scene.traverse(n => {

    //     if (n.name === 'head') OOI.head = n;
    //     if (n.name === 'lowerarm_l') OOI.lowerarm_l = n;
    //     if (n.name === 'Upperarm_l') OOI.Upperarm_l = n;
    //     if (n.name === 'hand_l') OOI.hand_l = n;
    //     if (n.name === 'target_hand_l') OOI.target_hand_l = n;

    //     if (n.name === 'boule') OOI.sphere = n;
    //     if (n.name === 'Kira_Shirt_left') OOI.kira = n;

    // });
    scene.add(gltff.scene);
    // console.log(gltff,'kk')
    // for(let i = 0; i<gltff.scene.children.length; i++){
    //     if(i == 24){

    //         group.add(gltff.scene.children[i]); 
    //     }
    // }


    const loaderf = new FontLoader();
    loaderf.load('fonts/gentilis_bold.typeface.json', function (font) {

        const wall_material_text = new TextGeometry('techindo systems pvt ltd', {
            font: font,
            size: .9,
            depth: 0.2,

        });
        const material = new THREE.MeshStandardMaterial({
            color: 0x0097DD0,
            roughness: 0.7,
            metalness: 0.0
        });

        const object = new THREE.Mesh(wall_material_text, material);
        object.position.set(-8, 4.7, 16)
        // object.rotation.x = 0
        // object.rotation.y = 4.7
        // object.rotation.z = 0

        scene.add(object)
    });




    const switchGeometry = new THREE.BoxGeometry(1, 1, 0.5);
    switchMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    switchMesh = new THREE.Mesh(switchGeometry, switchMaterial);
    switchMesh.position.x = 19;
    switchMesh.position.y = 3;
    switchMesh.position.z = 15;
    switchMesh.name = 'lightSwitch'
    group.add(switchMesh);
    const s = switchMesh.clone()
    s.position.x = -0;
    s.position.y = 2;
    s.position.z = -2.5;
    s.name = 'lightSwitch'
    group.add(s);

    const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.2), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    c1.position.x = -3;
    c1.position.y = 2;
    c1.position.z = -2.5;
    c1.name = 'c1'
    group.add(c1);


    const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.2), new THREE.MeshBasicMaterial({ color: 0x0000ff }));
    c2.position.x = -3;
    c2.position.y = 1;
    c2.position.z = -2.8;
    c2.name = 'c2'
    group.add(c2);



    // Toggle switch state


    const mouse = new THREE.Vector2();


    window.addEventListener('click', (event) => {
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);

        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(scene.children);

        // Check if the switch was clicked
        console.log(intersects[0].object, 'intersects[0].object')
        if (intersects.length > 0 && intersects[0].object.name === "lightSwitch") {
            toggleSwitch();
        }



        if (intersects.length > 0 && intersects[0].object.name === "c1") {
            goToCabin1()
        }
        if (intersects.length > 0 && intersects[0].object.name === "c2") {
            goToCabin2()
        }
    });


    // orbitControls.target.copy(OOI.sphere.position); // orbit controls lookAt the sphere
    // OOI.hand_l.attach(OOI.sphere);

    // mirror sphere cube-camera
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(1024);
    mirrorSphereCamera = new THREE.CubeCamera(0.05, 50, cubeRenderTarget);
    scene.add(mirrorSphereCamera);
    // const mirrorSphereMaterial = new THREE.MeshBasicMaterial({ envMap: cubeRenderTarget.texture });
    // OOI.sphere.material = mirrorSphereMaterial;

    // transformControls = new TransformControls(camera, renderer.domElement);
    // transformControls.size = 0.75;
    // transformControls.showX = false;
    // transformControls.space = 'world';
    // transformControls.attach(OOI.target_hand_l);
    // scene.add(transformControls);

    // disable orbitControls while using transformControls
    // transformControls.addEventListener('mouseDown', () => orbitControls.enabled = false);
    // transformControls.addEventListener('mouseUp', () => orbitControls.enabled = true); 


    // OOI.kira.add(OOI.kira.skeleton.bones[0]);
    const iks = [
        {
            target: 22, // "target_hand_l"
            effector: 6, // "hand_l"
            links: [
                {
                    index: 5, // "lowerarm_l"
                    rotationMin: new THREE.Vector3(1.2, - 1.8, - .4),
                    rotationMax: new THREE.Vector3(1.7, - 1.1, .3)
                },
                {
                    index: 4, // "Upperarm_l"
                    rotationMin: new THREE.Vector3(0.1, - 0.7, - 1.8),
                    rotationMax: new THREE.Vector3(1.1, 0, - 1.4)
                },
            ],
        }
    ];
    // IKSolver = new CCDIKSolver(OOI.kira, iks);  

    // Setup XR controllers
    controller1 = renderer.xr.getController(0);
    controller1.addEventListener('selectstart', onSelectStart);
    controller1.addEventListener('selectend', onSelectEnd);
    controller1.addEventListener('select', selectHandler);
    //  controller1.addEventListener( 'squeezeend', onSelectEnd1 );
    scene.add(controller1);

    controller2 = renderer.xr.getController(1);
    controller2.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('selectend', onSelectEnd);
    controller2.addEventListener('select', selectHandler);
    //  controller2.addEventListener( 'squeezeend', onSelectEnd1 );
    scene.add(controller2);

    const controllerModelFactory = new XRControllerModelFactory();

    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);

    controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip2);

    //

    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, - 1)]);

    const line = new THREE.Line(geometry);
    line.name = 'line';
    line.scale.z = 5;

    controller1.add(line.clone());
    controller2.add(line.clone());

    raycaster = new THREE.Raycaster();



    window.addEventListener('resize', onWindowResize, false);
    animate()
}

function updateIK() {

    if (IKSolver) IKSolver.update();

    scene.traverse(function (object) {

        if (object.isSkinnedMesh) object.computeBoundingSphere();

    });

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}
renderer.xr.enabled = true;


// document.body.appendChild( VRButton.createButton( renderer ) );
document.body.appendChild(XRButton.createButton(renderer, { 'optionalFeatures': ['depth-sensing'] }));




function onSelectStart(event) {
    // scene.add(ambientLight);

    const controller = event.target;
    console.log(controller, 'ffffevenrt')
    const intersections = getIntersections(controller);

    if (intersections.length > 0) {

        const intersection = intersections[0];

        const object = intersection.object;
        if (object == switchMesh) {
            return
        }
        object.material.emissive.b = 1;
        controller.attach(object);
        controller.userData.selected = object;

    }

    controller.userData.targetRayMode = event.data.targetRayMode;

}

let isSwitchOn = false;
function toggleSwitch() {

    isSwitchOn = !isSwitchOn;
    if (isSwitchOn) {
        scene.add(ambientLight);
        gsap.to(camera.position, {
            x: 0,
            y: 2,
            z: 6,
            duration: 3,
            ease: "power1.inOut",
            onUpdate: function () {
                camera.lookAt(new THREE.Vector3(0, 0, 0))
            },
            //showcasing 1st view
        })
    } else {
        scene.remove(ambientLight);
        gsap.to(camera.position, {
            x: 10,
            y: 4,
            z: 40,
            duration: 3,
            ease: "power1.inOut",
            onUpdate: function () {
                camera.lookAt(new THREE.Vector3(0, 0, 0))
            },
            //showcasing 1st view
        })
    }
    switchMaterial.color.set(!isSwitchOn ? 0x00ff00 : 0xff0000); // Green if on, red if off
}


function goToCabin1() {
    gsap.to(camera.position, {
        x: -4.27,
        y: 2.41,
        z: -6.185,
        duration: 3,
        ease: "power1.inOut",
        onUpdate: function () {
            camera.lookAt(new THREE.Vector3(0, 0, 0))
        },
        //showcasing 1st view
    })
}
function goToCabin2() {
    gsap.to(camera.position, {
        x: 8.15,
        y: 5.45,
        z: 10.47,
        duration: 3,
        ease: "power1.inOut",
        onUpdate: function () {
        //     // scene.rotation.x = 1.23
        //     scene.rotation.y = -1.43
        //     // scene.rotation.z = 3
        camera.lookAt(new THREE.Vector3(0, 0, 0))
        },
        //showcasing 1st view
    })
}
function selectHandler(event) {

    // console.log('her',  camera.position.set(10, 4, 40))
    const controller = event.target;
    console.log(controller, 'ffffevenrt')
    const intersections = getIntersections(controller);

    if (intersections.length > 0) {

        const intersection = intersections[0];
        if (intersection.object.name == "lightSwitch") {
            toggleSwitch()
        }
        if (intersection.object.name == "c1") {
            goToCabin1()
        }
        if (intersection.object.name == "c2") {
            goToCabin2()
        }

    }

}

function onSelectEnd1(event) {
    scene.remove(ambientLight);


}



function onSelectEnd(event) {
    // scene.remove(ambientLight);

    const controller = event.target;

    if (controller.userData.selected !== undefined) {

        const object = controller.userData.selected;
        if (object == switchMesh) {
            return
        }
        object.material.emissive.b = 0;
        group.attach(object);

        controller.userData.selected = undefined;

    }

}

function getIntersections(controller) {

    controller.updateMatrixWorld();

    raycaster.setFromXRController(controller);

    return raycaster.intersectObjects(group.children, false);

}

function intersectObjects(controller) {

    // Do not highlight in mobile-ar

    if (controller.userData.targetRayMode === 'screen') return;

    // Do not highlight when already selected

    if (controller.userData.selected !== undefined) return;

    const line = controller.getObjectByName('line');
    const intersections = getIntersections(controller);

    if (intersections.length > 0) {

        const intersection = intersections[0];

        const object = intersection.object;
        object.material.emissive.r = 1;
        intersected.push(object);

        line.scale.z = intersection.distance;

    } else {

        line.scale.z = 5;

    }

}

function cleanIntersected() {

    while (intersected.length) {

        const object = intersected.pop();
        object.material.emissive.r = 0;

    }

}



function animate() {
    renderer.setAnimationLoop(function () {
        // console.log(camera.position)
        // animate()
        // cleanIntersected();

        // intersectObjects( controller1 );
        // intersectObjects( controller2 );
        // if (OOI.sphere && mirrorSphereCamera) {

        //     OOI.sphere.visible = false;
        //     OOI.sphere.getWorldPosition(mirrorSphereCamera.position);
        //     mirrorSphereCamera.update(renderer, scene);
        //     OOI.sphere.visible = true;

        // }

        // if (OOI.sphere && conf.followSphere) {

        //     // orbitControls follows the sphere
        //     OOI.sphere.getWorldPosition(v0);
        //     orbitControls.target.lerp(v0, 0.1);

        // }

        // if (OOI.head && OOI.sphere && conf.turnHead) {

        //     // turn head
        //     OOI.sphere.getWorldPosition(v0);
        //     OOI.head.lookAt(v0); 

        //     OOI.head.rotation.set(OOI.head.rotation.x, OOI.head.rotation.y + Math.PI, OOI.head.rotation.z);

        // }

        // if (conf.ik_solver) {

        //     updateIK();

        // }

        // orbitControls.update();
        renderer.render(scene, camera);

    });
}