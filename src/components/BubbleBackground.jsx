import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const BubbleBackground = ({ darkMode }) => {
    // Generate random positions and sizes that will remain consistent
    const [bubbles, setBubbles] = useState([]);

    useEffect(() => {
        // Generate bubbles once on component mount to prevent re-rendering issues
        const newBubbles = Array.from({ length: 7 }, (_, i) => ({
            id: i,
            width: 150 + Math.random() * 300,
            height: 150 + Math.random() * 300,
            left: Math.random() * 100,
            top: Math.random() * 100,
            // Generate colors based on dark mode
            color: darkMode
                ? {
                    r: Math.floor(Math.random() * 50 + 80),  // Darker indigo/purple hues
                    g: Math.floor(Math.random() * 50 + 50),
                    b: Math.floor(Math.random() * 100 + 155) // Higher blue values for dark mode
                }
                : {
                    r: Math.floor(Math.random() * 70 + 80),  // Indigo/purple hues
                    g: Math.floor(Math.random() * 50 + 80),
                    b: Math.floor(Math.random() * 100 + 155) // Higher blue values
                },
            opacity: 0.15 + Math.random() * 0.1,
            // Random animation durations and delays
            duration: 15 + Math.random() * 20,
            delay: Math.random() * 5
        }));

        setBubbles(newBubbles);
    }, [darkMode]); // Regenerate when dark mode changes to adjust colors

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {bubbles.map((bubble) => (
                <motion.div
                    key={bubble.id}
                    className="absolute rounded-full blur-3xl"
                    style={{
                        width: `${bubble.width}px`,
                        height: `${bubble.height}px`,
                        left: `${bubble.left}%`,
                        top: `${bubble.top}%`,
                        background: `rgba(${bubble.color.r}, ${bubble.color.g}, ${bubble.color.b}, ${bubble.opacity})`,
                        // Adding a subtle border to enhance the effect
                        boxShadow: darkMode
                            ? `0 0 80px 20px rgba(${bubble.color.r}, ${bubble.color.g}, ${bubble.color.b}, 0.05)`
                            : 'none',
                    }}
                    animate={{
                        x: [0, 40, -40, 0],
                        y: [0, -40, 40, 0],
                        scale: [1, 1.05, 0.95, 1],
                    }}
                    transition={{
                        duration: bubble.duration,
                        delay: bubble.delay,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    );
};

export default BubbleBackground;