// src/components/BackgroundMusic.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const BackgroundMusic = ({ darkMode }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    // Load user preference from localStorage on initial render
    useEffect(() => {
        const musicPreference = localStorage.getItem('musicEnabled');
        if (musicPreference === 'true') {
            setIsPlaying(true);
        }
    }, []);

    // Update audio playback and localStorage when isPlaying changes
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(error => {
                    // Auto-play was prevented by the browser
                    console.log("Auto-play prevented:", error);
                    setIsPlaying(false);
                });
            } else {
                audioRef.current.pause();
            }
            
            // Save preference to localStorage
            localStorage.setItem('musicEnabled', isPlaying.toString());
        }
    }, [isPlaying]);

    const toggleMusic = () => {
        setIsPlaying(!isPlaying);
    };

    return (
        <>
            {/* Hidden audio element */}
            <audio 
                ref={audioRef} 
                loop 
                preload="auto"
                src="/music/background-melody.mp4" // Replace with your music file path
            />
            
            {/* Toggle button */}
            <motion.button
                onClick={toggleMusic}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    darkMode 
                        ? 'bg-gray-700 text-gray-200' 
                        : 'bg-gray-200 text-gray-800'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title={isPlaying ? "Mute music" : "Play music"}
            >
                {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeDasharray="2 2" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                )}
            </motion.button>
        </>
    );
};

export default BackgroundMusic;