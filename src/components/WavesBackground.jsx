import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const WavesBackground = ({ darkMode }) => {
    const containerRef = useRef(null);
    const rendererRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const waveRef = useRef(null);
    const frameRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Set up renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0); // Transparent background
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Set up camera
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 50;
        cameraRef.current = camera;

        // Create mesh
        const geometry = new THREE.PlaneGeometry(100, 100, 40, 40);

        // Choose material color based on dark mode
        const color = darkMode ? 0x5738b5 : 0x6366f1; // Indigo color

        const material = new THREE.MeshPhongMaterial({
            color: color,
            wireframe: true,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6,
        });

        const wave = new THREE.Mesh(geometry, material);
        wave.rotation.x = Math.PI / 3; // Tilt the wave
        scene.add(wave);
        waveRef.current = wave;

        // Add light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 1, 1);
        scene.add(directionalLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // Handle mouse movement
        const handleMouseMove = (event) => {
            mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };

        window.addEventListener('mousemove', handleMouseMove);

        // Handle window resize
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            renderer.setSize(width, height);
        };

        window.addEventListener('resize', handleResize);

        // Animation loop
        const animate = () => {
            frameRef.current = requestAnimationFrame(animate);

            // Animate vertices
            const positions = wave.geometry.attributes.position;
            const time = Date.now() * 0.001; // Current time in seconds

            for (let i = 0; i < positions.count; i++) {
                const x = positions.getX(i);
                const y = positions.getY(i);

                // Create wave-like motion
                const z = Math.sin(x / 5 + time) * 3 + Math.sin(y / 5 + time) * 3;

                positions.setZ(i, z);
            }

            positions.needsUpdate = true;

            // Rotate slightly based on mouse position
            wave.rotation.z = mouseRef.current.x * 0.1;
            wave.rotation.y = mouseRef.current.y * 0.1;

            renderer.render(scene, camera);
        };

        animate();

        // Cleanup function
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);

            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }

            if (rendererRef.current && containerRef.current) {
                containerRef.current.removeChild(rendererRef.current.domElement);
            }

            if (wave.geometry) {
                wave.geometry.dispose();
            }

            if (wave.material) {
                wave.material.dispose();
            }
        };
    }, [darkMode]);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 -z-10"
            style={{ overflow: 'hidden', pointerEvents: 'none' }}
        />
    );
};

export default WavesBackground;