import * as THREE from 'three'
import "./style.css"
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';

// Canvas
const canvas = document.querySelector('canvas.webgl')


// Scene
const scene = new THREE.Scene()

//Object
const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshBasicMaterial({ color: 0xff0000,
    //  wireframe: true 
    })
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)



// // House container
// const house = new THREE.Group()
// scene.add(house)


// // Walls
// const walls = new THREE.Mesh(
//     new THREE.BoxGeometry(4, 2.5, 4),
//     new THREE.MeshStandardMaterial({ color: '#ac8e82' })
// )
// walls.position.y = 1.25
// house.add(walls)


// floor

const floor = new THREE.Mesh(
	new THREE.PlaneGeometry(20,20),
	new THREE.MeshStandardMaterial({color:'#a9c388'})
)
floor.rotation.x = - Math.PI * 0.5
floor.position.y = 0

scene.add(floor) 


// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('dblclick', () =>
{
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement

    if(!fullscreenElement)
    {
        if(canvas.requestFullscreen)
        {
            canvas.requestFullscreen()
        }
        else if(canvas.webkitRequestFullscreen)
        {
            canvas.webkitRequestFullscreen()
        }
    }
    else
    {
        if(document.exitFullscreen)
        {
            document.exitFullscreen()
        }
        else if(document.webkitExitFullscreen)
        {
            document.webkitExitFullscreen()
        }
    }
})

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})
// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
camera.position.set(0, 2, 5);
camera.lookAt(new THREE.Vector3(0, 0, 0))
scene.add(camera);


// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.xr.enabled = true;
renderer.render(scene, camera)
renderer.setAnimationLoop( function () {

	renderer.render( scene, camera );

} );
document.body.appendChild( VRButton.createButton( renderer ) );

// // Three.js - WebXR - Look to Select
// // from https://threejs.org/manual/examples/webxr-look-to-select.html


// import * as THREE from 'three';
// import { VRButton } from 'three/addons/webxr/VRButton.js';

// function main() {

// 	const canvas = document.querySelector('canvas.webgl')
// 	const renderer = new THREE.WebGLRenderer( { antialias: true, canvas } );
// 	renderer.xr.enabled = true;
// 	document.body.appendChild( VRButton.createButton( renderer ) );

// 	const fov = 75;
// 	const aspect = 2; // the canvas default
// 	const near = 0.1;
// 	const far = 50;
// 	const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
// 	camera.position.set( 0, 1.6, 0 );

// 	const scene = new THREE.Scene();
// 	{

// 		const loader = new THREE.CubeTextureLoader();
// 		const texture = loader.load( [
// 			'resources/images/grid-1024.png',
// 			'resources/images/grid-1024.png',
// 			'resources/images/grid-1024.png',
// 			'resources/images/grid-1024.png',
// 			'resources/images/grid-1024.png',
// 			'resources/images/grid-1024.png',
// 		] );
// 		scene.background = texture;

// 	}

// 	{

// 		const color = 0xFFFFFF;
// 		const intensity = 3;
// 		const light = new THREE.DirectionalLight( color, intensity );
// 		light.position.set( - 1, 2, 4 );
// 		scene.add( light );

// 	}

// 	const boxWidth = 1;
// 	const boxHeight = 1;
// 	const boxDepth = 1;
// 	const geometry = new THREE.BoxGeometry( boxWidth, boxHeight, boxDepth );

// 	function makeInstance( geometry, color, x ) {

// 		const material = new THREE.MeshPhongMaterial( { color } );

// 		const cube = new THREE.Mesh( geometry, material );
// 		scene.add( cube );

// 		cube.position.x = x;
// 		cube.position.y = 1.6;
// 		cube.position.z = - 2;

// 		return cube;

// 	}

// 	const cubes = [
// 		makeInstance( geometry, 0x44aa88, 0 ),
// 		makeInstance( geometry, 0x8844aa, - 2 ),
// 		makeInstance( geometry, 0xaa8844, 2 ),
// 	];

// 	class PickHelper {

// 		constructor() {

// 			this.raycaster = new THREE.Raycaster();
// 			this.pickedObject = null;
// 			this.pickedObjectSavedColor = 0;

// 		}
// 		pick( normalizedPosition, scene, camera, time ) {

// 			// restore the color if there is a picked object
// 			if ( this.pickedObject ) {

// 				this.pickedObject.material.emissive.setHex( this.pickedObjectSavedColor );
// 				this.pickedObject = undefined;

// 			}

// 			// cast a ray through the frustum
// 			this.raycaster.setFromCamera( normalizedPosition, camera );
// 			// get the list of objects the ray intersected
// 			const intersectedObjects = this.raycaster.intersectObjects( scene.children );
// 			if ( intersectedObjects.length ) {

// 				// pick the first object. It's the closest one
// 				this.pickedObject = intersectedObjects[ 0 ].object;
// 				// save its color
// 				this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
// 				// set its emissive color to flashing red/yellow
// 				this.pickedObject.material.emissive.setHex( ( time * 8 ) % 2 > 1 ? 0xFFFF00 : 0xFF0000 );

// 			}

// 		}

// 	}

// 	const pickHelper = new PickHelper();

// 	function resizeRendererToDisplaySize( renderer ) {

// 		const canvas = renderer.domElement;
// 		const width = canvas.clientWidth;
// 		const height = canvas.clientHeight;
// 		const needResize = canvas.width !== width || canvas.height !== height;
// 		if ( needResize ) {

// 			renderer.setSize( width, height, false );

// 		}

// 		return needResize;

// 	}

// 	function render( time ) {

// 		time *= 0.001;

// 		if ( resizeRendererToDisplaySize( renderer ) ) {

// 			const canvas = renderer.domElement;
// 			camera.aspect = canvas.clientWidth / canvas.clientHeight;
// 			camera.updateProjectionMatrix();

// 		}

// 		cubes.forEach( ( cube, ndx ) => {

// 			const speed = 1 + ndx * .1;
// 			const rot = time * speed;
// 			cube.rotation.x = rot;
// 			cube.rotation.y = rot;

// 		} );

// 		// 0, 0 is the center of the view in normalized coordinates.
// 		pickHelper.pick( { x: 0, y: 0 }, scene, camera, time );

// 		renderer.render( scene, camera );

// 	}

// 	renderer.setAnimationLoop( render );

// }

// main();



// import * as THREE from 'three';
// // import { ARButton } from 'three/examples/jsm/webxr/ARButton'
// import { VRButton } from 'three/addons/webxr/VRButton.js';
// const scene = new THREE.Scene()
// const sizes = {
//     width: window.innerWidth,
//     height: window.innerHeight
// }

// const light = new THREE.AmbientLight(0xffffff, 1.0)
// scene.add(light)

// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshStandardMaterial({ color: 0xffffff * Math.random() });
// const cube = new THREE.Mesh(geometry, material);
// cube.position.set(0, 0, -2)
// scene.add(cube)

// const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
// camera.position.set(0, 2, 5);
// camera.lookAt(new THREE.Vector3(0, 0, 0))
// scene.add(camera);

// const renderer = new THREE.WebGLRenderer({
//     antialias: true,
//     alpha: true

// });

// renderer.setSize(sizes.width, sizes.height);
// renderer.setPixelRatio(window.devicePixelRatio);
// renderer.xr.enabled = true

// document.body.appendChild(renderer.domElement);
// // document.body.appendChild(ARButton.createButton(renderer));
// document.body.appendChild( VRButton.createButton( renderer ) );

// renderer.setAnimationLoop(render)

// function render() {
//     cube.rotation.y += 0.01;
//     renderer.render(scene, camera)
// }

// window.addEventListener('resize', () => {
//     sizes.width = window.innerWidth;
//     sizes.height = window.innerHeight;

//     camera.aspect = sizes.width / sizes.height;
//     camera.updateProjectionMatrix();

//     renderer.setSize(sizes.width, sizes.height);
//     renderer.setPixelRatio(window.devicePixelRatio)

// })