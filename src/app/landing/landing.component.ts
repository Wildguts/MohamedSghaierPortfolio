import { Component, AfterViewInit, ElementRef, Renderer2, ViewChild, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import * as THREE from 'three';
import * as dat from 'lil-gui';
import gsap from 'gsap';
import { DOCUMENT, isPlatformBrowser ,CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { trigger, state, style, animate, transition, keyframes, query } from '@angular/animations';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  animations: [
    trigger('fadeInOut', [
      state(
        'void',
        style({
          opacity: 0,
          transform: 'scale(0.5) ',
        }),
      ),
      transition('void => *', animate('250ms ease-out')),
      transition('* => void', animate('250ms ease-in')),
    ]),
    trigger('fadeInOut1s', [
      state(
        'void',
        style({
          opacity: 0,
          transform: 'scale(0.5) ',
        }),
      ),
      transition('void => *', animate('1000ms ease-out')),
      transition('* => void', animate('1000ms ease-in')),
    ]),
    trigger('fadeInOut2s', [
      state(
        'void',
        style({
          opacity: 0,
          transform: 'scale(0.5) ',
        }),
      ),
      transition('void => *', animate('1500ms ease-out')),
      transition('* => void', animate('1500ms ease-in')),
    ]),
    trigger('fadeInOutExtended', [
      state(
        'void',
        style({
          opacity: 0,
          transform: 'scale(0.5)',
        }),
      ),
      transition('void => *', animate('700ms ease-out')),
      transition('* => void', animate('700ms ease-in')),
    ]),
    trigger('fadeInOutExtended2', [
      state(
        'void',
        style({
          opacity: 0,
          transform: 'scale(0.65)',
        }),
      ),
      transition('void => *', animate('1000ms ease-out')),
    ]),]
})
export class LandingComponent {
  title = 'mohamedSghaierCV';
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  canvas: HTMLCanvasElement | null = null;
  backgroundMove: boolean = false;
  timestamp: number = Date.now();
  isBlackOverlayVisible = true;
  elapsedTime = 0;
  
  constructor(
    private renderer2: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.isBlackOverlayVisible = false;
    }, 2000); // 2 seconds

    // Ensure the code runs only in the browser
    if (isPlatformBrowser(this.platformId)) {
      this.canvas = this.document.getElementById('canvas') as HTMLCanvasElement;
      console.log('this.canvas ',this.canvas)
      this.initThreeJs();
      this.setupScrollSnap()
      this.addGlobalClickListener();

    }
  }

  initThreeJs() {
    if (!this.canvas) return;

    const scene = new THREE.Scene();
    const textureLoader = new THREE.TextureLoader();

    const gradientTexture = textureLoader.load('textures/gradients/6.jpg');
    const sphereTexture = textureLoader.load('textures/gradients/moon12.jpg');
    const displacementMap = textureLoader.load('textures/gradients/moon13.jpg');
    const saturnTexture = textureLoader.load('textures/gradients/11.jpg');

    gradientTexture.magFilter = THREE.NearestFilter;

    const createPlanet = (options: any) => {
      const planetProto = {
        sphere: (size: number) => new THREE.SphereGeometry(size, 32, 32),
        material: (options: any) => new THREE.MeshPhongMaterial(options),
        texture: (material: any, property: string, uri: string) => {
          textureLoader.load(uri, (texture) => {
            material[property] = texture;
            material.needsUpdate = true;
          });
        },
      };

      const surfaceGeometry = planetProto.sphere(options.surface.size);
      const surfaceMaterial = planetProto.material(options.surface.material);
      const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);

      // Load textures
      for (const [property, uri] of Object.entries(options.surface.textures)) {
        planetProto.texture(surfaceMaterial, property, uri as string);
      }

      return surface;
    };

    const material = new THREE.MeshStandardMaterial({
      color: '#fff', // Adjusted color for better visibility
      map: gradientTexture,
    });
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


    const SaturnMaterial = new THREE.MeshPhongMaterial({
      map: saturnTexture ,
      displacementScale: 0.06,
      bumpMap: textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/earthbump1k.jpg'),
      bumpScale: 0.04
    });
    const objectsDistance = 4;

    const createEarth = () => {
      const earthGroup = new THREE.Group();

      // Earth's Surface
      const surfaceMaterial = new THREE.MeshPhongMaterial({
        map: textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/earthmap1k.jpg'),
        bumpMap: textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/earthbump1k.jpg'),
        bumpScale: 0.05,
        specularMap: textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/earthspec1k.jpg'),
        shininess: 10,
      });
      const surface = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), surfaceMaterial);

      // Clouds Layer
      const cloudsMaterial = new THREE.MeshPhongMaterial({
        map: textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/earthcloudmap.jpg'),
        alphaMap: textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/earthcloudmaptrans.jpg'),
        transparent: true,
        depthWrite: false,
      });
      const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.01, 32, 32), cloudsMaterial);

      // Atmospheric Glow
      const atmosphereMaterial = new THREE.ShaderMaterial({
        uniforms: {
          c: { value: 0.7 },
          p: { value: 7 },
          glowColor: { value: new THREE.Color(0x93cfef) },
          viewVector: { value: new THREE.Vector3(0, 0, 1) },
        },
        vertexShader: `
          uniform vec3 viewVector;
          uniform float c;
          uniform float p;
          varying float intensity;
          void main() {
            vec3 vNormal = normalize(normalMatrix * normal);
            vec3 vNormel = normalize(normalMatrix * viewVector);
            intensity = pow(c - dot(vNormal, vNormel), p);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 glowColor;
          varying float intensity;
          void main() {
            vec3 glow = glowColor * intensity;
            gl_FragColor = vec4(glow, 1.0);
          }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
      });
      const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), atmosphereMaterial);

      // Add all layers to the Earth group
      earthGroup.add(surface, clouds, atmosphere);

      return earthGroup;
    };

    // Create Earth
    const earth = createEarth();


    const mesh2 = new THREE.Mesh(new THREE.SphereGeometry(1, 60, 60), SaturnMaterial);
    const mesh3 = new THREE.Mesh(new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16), material);
    const mesh4 = new THREE.Mesh(new THREE.SphereGeometry(1, 60, 60), Spherematerial);

    mesh2.position.x = 2
    earth.position.x = -2
    mesh4.position.x = - 2


    mesh2.position.y = -objectsDistance * 2;
    earth.position.y = -objectsDistance * 1;
    mesh4.position.y = -objectsDistance * 3;


    const sectionMeshes = [mesh4 ,mesh2, earth ];
    scene.add( earth,mesh2,  mesh4);
    // light
    const directionalLight = new THREE.DirectionalLight('#ffffff', 1.5)
    directionalLight.position.set(-10, 10, 50)
    scene.add(directionalLight);

    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.1 );
          hemiLight.color.setHSL( 0.6, 1, 0.6 );
          hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
          hemiLight.position.set( 0, 0, 0 );
          scene.add( hemiLight );

    // Particles
    const particlesCount = 3000;
    const positions = new Float32Array(particlesCount * 8);
    for (let i = 0; i < particlesCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = objectsDistance * 0.5 - Math.random() * objectsDistance * (sectionMeshes.length + 5);
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 4] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 6] = 0;


    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color: '#ffffff',
      sizeAttenuation: true,
      size: 0.03,
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
    const cameraGroup = new THREE.Group();
    camera.position.z = 6;
    cameraGroup.add(camera);
    scene.add(cameraGroup);

    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    let scrollY = window.scrollY;
    let currentSection = 0;

    const clock = new THREE.Clock();
    window.addEventListener('scroll', () => {
      scrollY = window.scrollY;
      const newSection = Math.round(scrollY / window.innerHeight);

      if (newSection !== currentSection) {
        currentSection = newSection;

        // Trigger fast rotation with smooth transition
        gsap.to(sectionMeshes[currentSection].rotation, {
          duration: 1.5,
          ease: 'power2.inOut',
          x: '+=6',
          y: '+=3',
          z: '+=1.5',
        });

        // Change background color on scroll
        gsap.to('body', { backgroundColor: `hsl(${currentSection * 60}, 89%, 60%)`, duration: 1 });

        // Slow down the rotation after 5 seconds
        setTimeout(() => {
          gsap.to(sectionMeshes[currentSection].rotation, {
            duration: 3,
            ease: 'power1.out',
            x: 0,
            y: 0,
            z: 0,
          });
        }, 5000);
      }
    });

/*     const cubeTextureLoader = new THREE.CubeTextureLoader();
    const path = 'textures/cubemap/';
    const format = '.jpg';
    const urls = [
      'textures/gradients/px.png', "textures/gradients/nx.png",
      'textures/gradients/py.png',  'textures/gradients/ny.png',
      'textures/gradients/pz.png', 'textures/gradients/nz.png'
    ];

    const skybox = cubeTextureLoader.load(urls);
    scene.background = skybox; */
    const cursor: { x: number; y: number } = { x: 0, y: 0 };

    window.addEventListener('resize', () => {
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;

      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();

      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    window.addEventListener('mousemove', (event) => {
      cursor.x = event.clientX / sizes.width  - 0.2;
      cursor.y = event.clientY / sizes.height  - 0.2;
    });


    window.addEventListener('scroll', (event) => {
      cursor.y = window.scrollY / sizes.height * 0.1  ;


    });

    let previousTime = 0;
    const tick = () => {
      const elapsedTime = clock.getElapsedTime();
      const deltaTime = elapsedTime - previousTime;
      previousTime = elapsedTime;

      camera.position.y = -scrollY / sizes.height * objectsDistance;

      const parallaxX = cursor.x * 0.5;
      const parallaxY = -cursor.y * 0.5;
      cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 5 * deltaTime;
      cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 5 * deltaTime;

      // Continuous rotation with dynamic speed
      sectionMeshes.forEach((mesh) => {
        const baseRotationSpeed = 0.001; // Slower base speed
        mesh.rotation.x += baseRotationSpeed;
        mesh.rotation.y += baseRotationSpeed;
      });

      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    };
    tick();
  }

setupScrollSnap() {
  const sections = this.document.querySelectorAll('.section');
  let isScrolling = false;

  const scrollToSection = (index: number) => {
    const section = sections[index];
    if (section) {
      isScrolling = true;
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => (isScrolling = false), 1000); // Prevent further scroll during animation
    }
  };

  let currentSection = 0;

  window.addEventListener('wheel', (event) => {
    if (isScrolling) return;

    if (event.deltaY > 0 && currentSection < sections.length - 1) {
      // Scrolling down
      currentSection++;
      scrollToSection(currentSection);
    } else if (event.deltaY < 0 && currentSection > 0) {
      // Scrolling up
      currentSection--;
      scrollToSection(currentSection);
    }
  });


}
addGlobalClickListener(): void {
/*   this.renderer2.listen('document', 'click', () => {
    this.toggleBackground();
  }); */
}
toggleBackground(): void {
  this.backgroundMove = !this.backgroundMove;
  this.timestamp = new Date().getTime(); // Update timestamp to avoid caching
}


}
