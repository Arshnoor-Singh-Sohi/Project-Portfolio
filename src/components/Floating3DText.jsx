// Create: src/components/Floating3DText.jsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text3D, Center } from '@react-three/drei';

const Floating3DText = ({ darkMode }) => {
    const textRef = useRef();

    useFrame((state) => {
        if (textRef.current) {
            // Gentle floating motion
            textRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5;
            textRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
        }
    });

    return (
        <group ref={textRef} position={[8, 2, -5]}>
            <Center>
                <Text3D
                    font="/fonts/helvetiker_regular.typeface.json" // You'll need to add this font file
                    size={0.5}
                    height={0.1}
                    curveSegments={12}
                    bevelEnabled
                    bevelThickness={0.02}
                    bevelSize={0.02}
                    bevelOffset={0}
                    bevelSegments={5}
                >
                    PORTFOLIO
                    <meshStandardMaterial
                        color={darkMode ? "#8b5cf6" : "#4f46e5"}
                        roughness={0.1}
                        metalness={0.9}
                    />
                </Text3D>
            </Center>
        </group>
    );
};

export default Floating3DText;