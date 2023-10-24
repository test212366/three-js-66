import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader' 
import GUI from 'lil-gui'
import gsap from 'gsap'
import fragmentShader from './shaders/fragment.glsl'
import vertexShader from './shaders/vertex.glsl'
import fragmentShaderS from './shaders/fragment copy.glsl'
import fragmentShaderS2 from './shaders/fragment copy 2.glsl'

import vertexShaderS from './shaders/vertex copy.glsl'
import vecPart from './shaders/vertexParticles.glsl'
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass'
import {GlitchPass} from 'three/examples/jsm/postprocessing/GlitchPass'
export default class Sketch {
	constructor(options) {
		
		this.scene = new THREE.Scene()
		
		this.container = options.dom
		
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		
		
		// // for renderer { antialias: true }
		this.renderer = new THREE.WebGLRenderer({ antialias: true })
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height)
		this.renderer.setSize(this.width ,this.height )
		this.renderer.setClearColor(0xeeeeee, 1)
		this.renderer.useLegacyLights = true
		this.renderer.outputEncoding = THREE.sRGBEncoding
 

		 
		this.renderer.setSize( window.innerWidth, window.innerHeight )

		this.container.appendChild(this.renderer.domElement)
 


		this.camera = new THREE.PerspectiveCamera( 70,
			 this.width / this.height,
			 0.01,
			 1000
		)
		this.count = 40
		this.camera.position.set(0, 0, 2) 
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.time = 0
		this.raycaster = new THREE.Raycaster()
		this.mouse= {x: 0, y: 0}

		this.dracoLoader = new DRACOLoader()
		this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
		this.gltf = new GLTFLoader()
		this.gltf.setDRACOLoader(this.dracoLoader)

		this.isPlaying = true

		this.addObjects()		 
		this.addSquares()
		this.resize()
		this.render()
		this.setupResize()
		this.mousemove()
 
		this.addlines()
		this.addpoints()
 
	}
	addpoints() {
		this.materialPoints = new THREE.ShaderMaterial({
			extensions: {
				derivatives: '#extension GL_OES_standard_derivatives : enable'
			},
			side: THREE.DoubleSide,
			uniforms: {
				time: {value: 0},
				mouse: {value: new THREE.Vector3() },
				resolution: {value: new THREE.Vector4()}
			},
			vertexShader: vecPart,
			transparent: true,
			fragmentShader: fragmentShaderS2
		})
		this.pointsGeo = new THREE.BufferGeometry()

		let vertices = []

		for (let i = -this.count/ 2; i < this.count / 2; i++) {
			for (let j = -this.count/ 2; j < this.count/ 2; j++) {
				vertices.push(i/10 + 0.05, j/10 + 0.05, 0)	
			}
			
		}

		this.pointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
		this.particles = new THREE.Points(this.pointsGeo, this.materialPoints)
		this.scene.add(this.particles)
		this.particles.position.z = 0.08

	}
	addlines() {
		let material = new THREE.LineBasicMaterial({
			color: 0xffffff,
			transparent: true, 
			opacity: .1
		})
		let geometry = new THREE.BufferGeometry()
		const points = []
 

		for (let i = -this.count / 2; i < this.count / 2; i++) {
			points.push(new THREE.Vector3(-5 , i/ 10  + 0.05, 0),
			new THREE.Vector3(5 , i/ 10  + 0.05, 0) )
			geometry.setFromPoints(points)
			
		}

		for (let i = -this.count / 2; i < this.count / 2; i++) {
			points.push(new THREE.Vector3(i/ 10 + 0.05, -5 , 0),
			new THREE.Vector3(i/ 10 + 0.05, 5 , 0) )
			geometry.setFromPoints(points)
			
		}

 

	 
		this.lines = new THREE.LineSegments(geometry, material)

		this.scene.add(this.lines)
		this.lines.position.z = 0.009

	}
	mousemove() {
		this.textPlane = new THREE.Mesh(new THREE.PlaneGeometry(5,5), 
			new THREE.MeshBasicMaterial()
		)

		window.addEventListener('mousemove', (e) => {
			this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
			this.mouse.y = - (e.clientY / window.innerHeight) * 2 + 1

			this.raycaster.setFromCamera(this.mouse, this.camera)

			const intersects = this.raycaster.intersectObjects([this.textPlane])
			if(intersects.length > 0) {
				this.materialSquares.uniforms.mouse.value = intersects[0].point
			}
		}, false)
	}
	addSquares() {
		this.materialSquares = new THREE.ShaderMaterial({
			extensions: {
				derivatives: '#extension GL_OES_standard_derivatives : enable'
			},
			side: THREE.DoubleSide,
			uniforms: {
				time: {value: 0},
				mouse: {value: new THREE.Vector3() },
				resolution: {value: new THREE.Vector4()}
			},
			vertexShader: vertexShaderS,
			transparent: true,
			fragmentShader: fragmentShaderS
		})
		this.geometrySquares = new THREE.PlaneGeometry(0.1,.1)
		this.squares = new THREE.InstancedMesh(this.geometrySquares, this.materialSquares, this.count ** 2)
		let dummy = new THREE.Object3D()
		let counter = 0
		for (let i = -this.count/ 2; i < this.count / 2; i++) {
			for (let j = -this.count/ 2; j < this.count/ 2; j++) {
				dummy.position.set(i/10, j/ 10, 0)
				dummy.updateMatrix()
				this.squares.setMatrixAt(counter++, dummy.matrix)
				
			}
			
		}



		this.scene.add(this.squares)
		this.squares.position.z = 0.01

	}
	settings() {
		let that = this
		this.settings = {
			progress: 0
		}
		this.gui = new GUI()
		this.gui.add(this.settings, 'progress', 0, 1, 0.01)
	}

	setupResize() {
		window.addEventListener('resize', this.resize.bind(this))
	}

	resize() {
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		this.renderer.setSize(this.width, this.height)
		this.camera.aspect = this.width / this.height


		this.imageAspect = 480/848
		let a1, a2
		if(this.height / this.width > this.imageAspect) {
			a1 = (this.width / this.height) * this.imageAspect
			a2 = 1
		} else {
			a1 = 1
			a2 = (this.height / this.width) / this.imageAspect
		} 


		const dist = this.camera.position.z
		const height = .8
		this.camera.fov =  2* (180 / Math.PI) * Math.atan(height / (2 * dist))

		if(this.width / this.height > 1) {
			this.plane.scale.x = this.camera.aspect
		} else {
			this.plane.scale.y = 1/ this.camera.aspect
		}
		this.camera.updateProjectionMatrix()


		this.material.uniforms.resolution.value.x = this.width
		this.material.uniforms.resolution.value.y = this.height
		this.material.uniforms.resolution.value.z = a1
		this.material.uniforms.resolution.value.w = a2

		this.camera.updateProjectionMatrix()



	}


	addObjects() {

		let video = document.getElementById('video')

		let texture = new THREE.VideoTexture(video)
		texture.minFilter = THREE.LinearFilter
		texture.magFilter = THREE.LinearFilter
		texture.format = THREE.RGBAFormat
		video.play()



		let that = this
		this.material = new THREE.ShaderMaterial({
			extensions: {
				derivatives: '#extension GL_OES_standard_derivatives : enable'
			},
			side: THREE.DoubleSide,
			uniforms: {
				time: {value: 0},
				texturesf: {value: texture},
				resolution: {value: new THREE.Vector4()}
			},
			vertexShader,
			fragmentShader
		})
		
		this.geometry = new THREE.PlaneGeometry(1,1,1,1)
		this.plane = new THREE.Mesh(this.geometry, this.material)
 
		this.scene.add(this.plane)
 
	}



	addLights() {
		const light1 = new THREE.AmbientLight(0xeeeeee, 0.5)
		this.scene.add(light1)
	
	
		const light2 = new THREE.DirectionalLight(0xeeeeee, 0.5)
		light2.position.set(0.5,0,0.866)
		this.scene.add(light2)
	}

	stop() {
		this.isPlaying = false
	}

	play() {
		if(!this.isPlaying) {
			this.isPlaying = true
			this.render()
		}
	}

	render() {
		if(!this.isPlaying) return
		this.time += 0.05

		this.scene.rotation.x = -this.mouse.y/ 10
		this.scene.rotation.y = this.mouse.x/ 10

		this.material.uniforms.time.value = this.time
		this.materialSquares.uniforms.time.value = this.time
 
 
 
		if(this.materialPoints) {
			this.materialPoints.uniforms.time.value = this.time
		}
 
		 
		//this.renderer.setRenderTarget(this.renderTarget)
		this.renderer.render(this.scene, this.camera)
		//this.renderer.setRenderTarget(null)
 
		requestAnimationFrame(this.render.bind(this))
	}
 
}
new Sketch({
	dom: document.getElementById('container')
})
 