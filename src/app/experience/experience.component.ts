import { Component, OnInit, AfterViewInit, Renderer2, ElementRef, Inject, PLATFORM_ID, ViewChild, HostListener } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import * as dat from 'lil-gui';
import { Router } from '@angular/router';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.scss'
})
export class ExperienceComponent {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  PATH = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/122460/'
  DEFAULT = 'default'
  IMAGE_SD = 'sd'
  IMAGE_HD = 'hd'
  COLOR_WHITE = 0xffffff
  COLOR_BLACK = 0x000000;
  showScrollUp = false;
  zoomThreshold = 1;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private hasRedirected = false;
  private clock = new THREE.Clock();
  private objects: THREE.Object3D[] = [];
  private scrollListener: (() => void) | null = null;
  private gui!: dat.GUI;
   paramsDefault = function() {
    return {
      imgDef: 'IMAGE_HD',  // Replace with actual image URL if needed
      imgDefPrevious: undefined,
      sunLight: {
        visible: true,
        color: 0xffffff,  // White color for sun light
        intensity: 1.3,
        position: {
          x: -380,
          y: 240,
          z: -1000,
        },
      },
      sunLensFlare: {
        textures: {
          sun: 'ASSETS_PATH/lens_flare_sun_1024x1024.jpg',
          circle: 'ASSETS_PATH/lens_flare_circle_64x64.jpg',
          hexagon: 'ASSETS_PATH/lens_flare_hexagon_256x256.jpg',
        },
        flareCircleSizeMax: 70,
        lensFlares: [
          { size: 1400, opacity: 1, distance: 0 },
          { size: 20, opacity: 0.4, distance: 0.63 },
          { size: 40, opacity: 0.3, distance: 0.64 },
          { size: 70, opacity: 0.8, distance: 0.7 },
          { size: 110, opacity: 0.7, distance: 0.8 },
          { size: 60, opacity: 0.4, distance: 0.85 },
          { size: 30, opacity: 0.4, distance: 0.86 },
          { size: 120, opacity: 0.3, distance: 0.9 },
          { size: 260, opacity: 0.4, distance: 1 },
        ],
      },
    };
  };
  private scrollThreshold: number = 100;

  constructor(
    private renderer2: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initScene();
      setTimeout(() => {
        this.showScrollUp = true;
      }, 2000);
    }

  }
  private redirectToHomePage(): void {
    // Navigate to the "/" page
    this.router.navigate(['/experience']);
  }
  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initRenderer();
      this.addObjects();
      this.addSun();
      this.addSkybox();
      this.animate();

    }
  }
  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: Event): void {
    const scrollOffset = window.scrollY || document.documentElement.scrollTop;
    this.showScrollUp = scrollOffset < 100; // Hide instruction if scrolled down
  }
  private initScene(): void {
    this.scene = new THREE.Scene();

    // Add Lights
/*     const directionalLight = new THREE.DirectionalLight('#ffffff', 1.5);
    directionalLight.position.set(-10, 10, 50);
    this.scene.add(directionalLight); */

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.01);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 0, 0);
    this.scene.add(hemiLight);

    // Camera Setup
    this.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.z = -40;
    this.camera.position.y = 0;
    this.camera.position.x = 7;

    this.scene.add(this.camera);

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.document.body);
    this.controls.enableDamping = true;
    this.controls.enableZoom = true;

  }

  private initRenderer(): void {
    const canvas = this.canvasRef.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Handle Resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private addObjects(): void {
    const textureLoader = new THREE.TextureLoader();
    const saturnTexture = textureLoader.load('textures/gradients/11.jpg');

    // Create Earth with Atmosphere
    const earthGroup = new THREE.Group();

    const surfaceMaterial = new THREE.MeshPhongMaterial({
      map: textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/earthmap1k.jpg'),
      bumpMap: textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/earthbump1k.jpg'),
      bumpScale: 0.05,
      specularMap: textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/earthspec1k.jpg'),
      shininess: 10,
    });
    const surface = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), surfaceMaterial);

    const cloudsMaterial = new THREE.MeshPhongMaterial({
      map: textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/earthcloudmap.jpg'),
      alphaMap: textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/earthcloudmaptrans.jpg'),
      transparent: true,
      depthWrite: false,
    });
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.01, 32, 32), cloudsMaterial);

    earthGroup.add(surface, clouds);
    earthGroup.position.x = -0.5;
    earthGroup.position.z = 2;

    // Add Saturn-like Object
    const saturnMaterial = new THREE.MeshPhongMaterial({
      map: textureLoader.load('textures/gradients/11.jpg'),
      displacementMap: textureLoader.load('textures/gradients/moon13.jpg'),
      bumpMap: textureLoader.load('textures/gradients/moon13.jpg'),
      bumpScale: 0.04,
    });
    const saturn = new THREE.Mesh(new THREE.SphereGeometry(1, 60, 60), saturnMaterial);
    saturn.position.x = -2;
    saturn.position.y = -4;

    const displacementMap = textureLoader.load('textures/gradients/moon13.jpg');


    const SaturnMaterial = new THREE.MeshPhongMaterial({
      map: saturnTexture ,
      displacementScale: 0.06,
      bumpMap: textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/earthbump1k.jpg'),
      bumpScale: 0.04
    });
    const sphereTexture = textureLoader.load('textures/gradients/moon12.jpg');
    const Spherematerial = new THREE.MeshPhongMaterial({
      color: 0xffffff ,
      map: sphereTexture ,
      displacementMap: displacementMap,
      displacementScale: 0.06,
      bumpMap: displacementMap,
      bumpScale: 0.04,
      reflectivity:0,
      shininess :0
    });
    const mesh2 = new THREE.Mesh(new THREE.SphereGeometry(1, 60, 40), SaturnMaterial);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(0.7, 60, 60), Spherematerial);
    moon.position.x = -3
    moon.position.z = 2;
    mesh2.position.x = 3
    mesh2.position.z = 2

    this.scene.add(moon);
    this.scene.add(mesh2);

    this.scene.add(earthGroup,mesh2);
    this.objects.push(earthGroup, saturn,mesh2);
  }


  private addSun(): void {
    const params = this.paramsDefault();
    const textureLoader = new THREE.TextureLoader();

    // 1. Sunlight (DirectionalLight) Setup
    const sunLight = new THREE.DirectionalLight(0xffffff, 12); // Brighter intensity
    sunLight.position.set(1, 10, 5); // Adjust position closer to the camera
    sunLight.castShadow = true;  // Enable shadows for more realism
    sunLight.visible = true; // Ensure light is visible

    // Add SunLight to the scene
    this.scene.add(sunLight);

    // 2. Create Lens Flare
    this.createLensFlare(sunLight, textureLoader);

    // 3. Add rotating Sun sphere for visual effect
    const sunMaterial = new THREE.MeshStandardMaterial({
      emissive: new THREE.Color(0xffcc00), // Glowing yellow color
      emissiveIntensity: 1.5,
      blending: THREE.AdditiveBlending,

    });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), sunMaterial);


    // Add rotating sun to objects for animation
    this.objects.push(sun);

    // Debugging logs for sun position
    console.log('Sun position:', sun.position);
    console.log('SunLight position:', sunLight.position);
  }

  private createLensFlare(sunLight: THREE.DirectionalLight, textureLoader: THREE.TextureLoader): void {
    // Load lens flare textures
    const sunTexture = textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/122460/lens_flare_sun_1024x1024.jpg');
    const circleTexture = textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/122460/lens_flare_circle_64x64.jpg');
    const hexagonTexture = textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/122460/lens_flare_hexagon_256x256.jpg');

    // Create lens flare
    const lensFlare = new Lensflare();

    // Add flare elements with proper color
    lensFlare.addElement(new LensflareElement(sunTexture, 1000, 0, new THREE.Color(0xffffff)));  // White color for the sun flare
    lensFlare.addElement(new LensflareElement(circleTexture, 50, 0.6, new THREE.Color(0xffffff)));  // White color for the circle flare
    lensFlare.addElement(new LensflareElement(hexagonTexture, 100, 0.9, new THREE.Color(0xffffff)));  // White color for the hexagon flare

    // Add lens flare to the sunLight
    sunLight.add(lensFlare);
  }




  private addSkybox(): void {
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    const urls = [
      'textures/gradients/px.png', "textures/gradients/nx.png",
      'textures/gradients/py.png',  'textures/gradients/ny.png',
      'textures/gradients/pz.png', 'textures/gradients/nz.png'
    ];
    const skybox = cubeTextureLoader.load(urls);
    skybox.colorSpace = THREE.SRGBColorSpace
    this.scene.environment = skybox;
    this.scene.background = skybox;
  }



  private animate(): void {
    const delta = this.clock.getDelta();

    this.objects.forEach((object) => {
      object.rotation.y += delta * 0.1;
    });

  // For OrthographicCamera
  if (this.camera.type === 'OrthographicCamera') {
    if (this.camera.zoom >= this.zoomThreshold || this.camera.zoom < - this.zoomThreshold ) {
      this.redirectToHomePage(); // Your redirection function
    }
  }

  // For PerspectiveCamera
  if (this.camera.type === 'PerspectiveCamera') {
    const distance = this.camera.position.length(); // Distance from the origin
    if (distance <= this.zoomThreshold || distance < - this.zoomThreshold ) {
      this.redirectToHomePage(); // Your redirection function
    }
  }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    requestAnimationFrame(() => this.animate());
  }
  private handleWindowScroll(event: Event): void {
    const scrollOffset = window.scrollY || document.documentElement.scrollTop;
    console.log('Scroll Offset:', scrollOffset);

    if (scrollOffset > 30 && !this.hasRedirected) {
      this.hasRedirected = true;

      setTimeout(() => {
        this.redirectToHomePage();
      }, 100);
    }
  }

}
