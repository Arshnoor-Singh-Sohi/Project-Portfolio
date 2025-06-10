// Create a new component: src/components/FloatingGeometry.jsx
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Icosahedron, Octahedron, Box } from '@react-three/drei';
import * as THREE from 'three';

const FloatingGeometry = ({ count = 20 }) => {
    const meshRef = useRef();

    // Generate random positions and properties for geometric shapes
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            temp.push({
                position: [
                    (Math.random() - 0.5) * 20, // x position
                    (Math.random() - 0.5) * 20, // y position  
                    (Math.random() - 0.5) * 20  // z position
                ],
                scale: Math.random() * 0.5 + 0.1, // Random scale between 0.1 and 0.6
                speed: Math.random() * 0.02 + 0.005, // Random animation speed
                rotationAxis: new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize(),
                shape: Math.floor(Math.random() * 3) // 0, 1, or 2 for different shapes
            });
        }
        return temp;
    }, [count]);

    // Animate the floating geometries
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.children.forEach((child, index) => {
                const particle = particles[index];

                // Gentle floating motion
                child.position.y += Math.sin(state.clock.elapsedTime * particle.speed + index) * 0.01;
                child.position.x += Math.cos(state.clock.elapsedTime * particle.speed * 0.5 + index) * 0.005;

                // Slow rotation around random axis
                child.rotateOnAxis(particle.rotationAxis, particle.speed);

                // Gentle scale pulsing
                const pulseFactor = 1 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.1;
                child.scale.setScalar(particle.scale * pulseFactor);
            });
        }
    });

    return (
        <group ref={meshRef}>
            {particles.map((particle, index) => {
                // Choose geometry type based on particle.shape
                const GeometryComponent = [Icosahedron, Octahedron, Box][particle.shape];

                return (
                    <GeometryComponent
                        key={index}
                        position={particle.position}
                        args={[0.3]} // Base size for all geometries
                    >
                        <meshStandardMaterial
                            color={`hsl(${240 + index * 10}, 70%, 60%)`} // Subtle color variation
                            transparent
                            opacity={0.6}
                            roughness={0.1}
                            metalness={0.8}
                        />
                    </GeometryComponent>
                );
            })}
        </group>
    );
};

export default FloatingGeometry;