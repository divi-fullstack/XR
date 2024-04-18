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
let scene, camera, renderer, orbitControls, transformControls;
let mirrorSphereCamera;

const OOI = {};
let IKSolver;

let stats,gui, conf;
const v0 = new THREE.Vector3();

init();

async function init() {

    conf = {
        followSphere: false,
        turnHead: true,
        ik_solver: true,
        update: updateIK
    };

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xffffff, .17);
    scene.background = new THREE.Color(0xffffff);

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.001, 5000);
    camera.position.set(0, 1.6, 0);
    camera.lookAt(scene.position);

    const ambientLight = new THREE.AmbientLight(0xffffff, 8); // soft white light
    scene.add(ambientLight);

    renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    stats = new Stats();
    // document.body.appendChild(stats.dom);

    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.minDistance = 0.2;
    orbitControls.maxDistance = 1.5;
    orbitControls.enableDamping = true;

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/static/draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    const gltf = await gltfLoader.loadAsync('/static/models/kira.glb');
    gltf.scene.traverse(n => {
 
        if (n.name === 'head') OOI.head = n;
        if (n.name === 'lowerarm_l') OOI.lowerarm_l = n;
        if (n.name === 'Upperarm_l') OOI.Upperarm_l = n;
        if (n.name === 'hand_l') OOI.hand_l = n;
        if (n.name === 'target_hand_l') OOI.target_hand_l = n;

        if (n.name === 'boule') OOI.sphere = n;
        if (n.name === 'Kira_Shirt_left') OOI.kira = n;

    });
    scene.add(gltf.scene);

    orbitControls.target.copy(OOI.sphere.position); // orbit controls lookAt the sphere
    OOI.hand_l.attach(OOI.sphere);

    // mirror sphere cube-camera
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(1024);
    mirrorSphereCamera = new THREE.CubeCamera(0.05, 50, cubeRenderTarget);
    scene.add(mirrorSphereCamera);
    const mirrorSphereMaterial = new THREE.MeshBasicMaterial({ envMap: cubeRenderTarget.texture });
    OOI.sphere.material = mirrorSphereMaterial;

    transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.size = 0.75;
    transformControls.showX = false;
    transformControls.space = 'world';
    transformControls.attach(OOI.target_hand_l);
    scene.add(transformControls);

    // disable orbitControls while using transformControls
    transformControls.addEventListener('mouseDown', () => orbitControls.enabled = false);
    transformControls.addEventListener('mouseUp', () => orbitControls.enabled = true); 


    OOI.kira.add(OOI.kira.skeleton.bones[0]);
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
    IKSolver = new CCDIKSolver(OOI.kira, iks);  

     // Setup XR controllers
     const controllerModelFactory = new XRControllerModelFactory();

     const controller1 = renderer.xr.getController(0);
     controller1.add(controllerModelFactory.createControllerModel(controller1));
     scene.add(controller1);
 
     const controller2 = renderer.xr.getController(1);
     controller2.add(controllerModelFactory.createControllerModel(controller2));
     scene.add(controller2);
 
 
      
 
     // Event listeners for XR input
     controller1.addEventListener('selectstart', onSelectStart);
     controller1.addEventListener('selectend', onSelectEnd);
 
     controller2.addEventListener('selectstart', onSelectStart);
     controller2.addEventListener('selectend', onSelectEnd);
 

     

    window.addEventListener('resize', onWindowResize, false);

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
document.body.appendChild( XRButton.createButton( renderer ) );

renderer.setAnimationLoop( function () {

    // animate()
    if (OOI.sphere && mirrorSphereCamera) {

        OOI.sphere.visible = false;
        OOI.sphere.getWorldPosition(mirrorSphereCamera.position);
        mirrorSphereCamera.update(renderer, scene);
        OOI.sphere.visible = true;

    }

    if (OOI.sphere && conf.followSphere) {

        // orbitControls follows the sphere
        OOI.sphere.getWorldPosition(v0);
        orbitControls.target.lerp(v0, 0.1);

    }

    if (OOI.head && OOI.sphere && conf.turnHead) {

        // turn head
        OOI.sphere.getWorldPosition(v0);
        OOI.head.lookAt(v0); 

        OOI.head.rotation.set(OOI.head.rotation.x, OOI.head.rotation.y + Math.PI, OOI.head.rotation.z);

    }

    if (conf.ik_solver) {

        updateIK();

    }

    orbitControls.update();
    renderer.render(scene, camera); 

} );


function onSelectStart(event) {
    orbitControls.enabled = true
    const controller = event.target;
    const intersections = getIntersections(controller); 
    console.log(event,'ff', intersections)
    if (intersections.length > 0) {
        const intersection = intersections[0];
        const object = intersection.object;

        transformControls.attach(object);
    }
    // OOI.kira.add(OOI.kira.skeleton.bones[0]);
    orbitControls.update();
    // renderer.render(scene, camera); 
}

function onSelectEnd(event) {
    orbitControls.enabled = false
    // console.log('end')
    // const controller = event.target;
    // if (transformControls.isTransforming) {
    //     transformControls.detach();
    // }
    orbitControls.update();
    // renderer.render(scene, camera); 
}

function getIntersections(controller) {
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);

    const raycaster = new THREE.Raycaster();
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    return raycaster.intersectObjects(scene.children, true);
}