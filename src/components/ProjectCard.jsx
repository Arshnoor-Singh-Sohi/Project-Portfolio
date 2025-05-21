// src/components/ProjectCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { CardContainer, CardBody, CardItem } from '../components/ui/3d-card';// Make sure path is correct

const ProjectCard = ({ project, index, selectedTechs, handleTechSelect }) => {
    // Function for displaying tech tags with staggered animations
    const renderTechTags = () => {
        return project.techs.map((tech, idx) => (
            <motion.span
                key={tech}
                className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${selectedTechs && selectedTechs.includes(tech)
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                onClick={() => handleTechSelect && handleTechSelect(tech)}
                whileHover={{ y: -2, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                    delay: 0.2 + idx * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 10
                }}
            >
                {tech}
            </motion.span>
        ));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: 0.1 + index * 0.05,
                duration: 0.5
            }}
            className="h-full w-full"
        >
            <CardContainer
                containerClassName="w-full h-full"
                className="w-full h-full"
                style={{ perspective: "800px" }} // Smaller value = more dramatic perspective
            >
                <CardBody className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 h-full flex flex-col group transform-style-3d">
                    {/* Project Image with Enhanced 3D Effect */}
                    <div className="relative h-56 overflow-hidden transform-style-3d">
                        {/* This wrapper gives us more control over the 3D transforms */}
                        <div className="w-full h-full transform-style-3d relative">
                            {/* Increased translateZ dramatically to make image pop out more */}
                            <CardItem
                                translateZ={100}
                                className="w-full h-full relative"
                                style={{
                                    transformOrigin: "center center",
                                }}
                            >
                                {/* Adding a subtle shadow behind the image for more depth */}
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg transform -translate-z-12 blur-md"></div>

                                {/* The actual image with enhanced transitions */}
                                <img
                                    src={project.image.replace('/public', '')}
                                    alt={project.name}
                                    className="w-full h-full object-cover rounded-t-lg transform transition-all duration-500 ease-out"
                                    style={{
                                        willChange: "transform",
                                    }}
                                />
                            </CardItem>
                        </div>

                        {/* Overlay with even higher translateZ for buttons */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 transform-style-3d">
                            <CardItem translateZ={130}>
                                <motion.a
                                    href={project.repoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium flex items-center gap-2 shadow-lg"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                    </svg>
                                    View Code
                                </motion.a>
                            </CardItem>

                            {/* Live project button - only shown when isLive is true */}
                            {project.isLive && (
                                <CardItem translateZ={130}>
                                    <motion.a
                                        href={project.liveUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium flex items-center gap-2 shadow-lg"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                        </svg>
                                        Live Demo
                                    </motion.a>
                                </CardItem>
                            )}
                        </div>
                    </div>

                    {/* Project Content */}
                    <div className="p-6 flex flex-col flex-grow transform-style-3d">
                        {/* Project title */}
                        <CardItem translateZ={60} className="mb-3">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                {project.name}
                                {project.isLive && (
                                    <span className="ml-2 text-xs inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                        <span className="w-2 h-2 mr-1 bg-green-500 rounded-full animate-pulse"></span>
                                        Live
                                    </span>
                                )}
                            </h3>
                        </CardItem>

                        <CardItem translateZ={50} className="mb-4 flex-grow">
                            <p className="text-gray-700 dark:text-gray-300">
                                {project.description}
                            </p>
                        </CardItem>

                        <CardItem translateZ={70} className="mb-4">
                            <div className="flex flex-wrap gap-2">
                                {renderTechTags()}
                            </div>
                        </CardItem>

                        <CardItem translateZ={80} className="mt-auto">
                            <div className="flex flex-col sm:flex-row gap-2 w-full">
                                <motion.a
                                    href={project.repoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg font-medium shadow-md"
                                    whileHover={{
                                        scale: 1.03,
                                        boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.3)"
                                    }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                    </svg>
                                    <span>View on GitHub</span>
                                </motion.a>

                                {/* Live project button in the footer - only shown when isLive is true */}
                                {project.isLive && (
                                    <motion.a
                                        href={project.liveUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-medium shadow-md"
                                        whileHover={{
                                            scale: 1.03,
                                            boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.3)"
                                        }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                        </svg>
                                        <span>View Live Demo</span>
                                    </motion.a>
                                )}
                            </div>
                        </CardItem>
                    </div>
                </CardBody>
            </CardContainer>
        </motion.div>
    );
};

export default ProjectCard;