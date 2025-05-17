const PROJECTS = [
    {
        "id": 1,
        "name": "Advanced RAG System",
        "description": "A comprehensive retrieval-augmented generation system designed for knowledge management applications and advanced RAG research",
        "techs": ["Python", "OpenAI", "Streamlit", "FAISS", "LangChain", "HuggingFace Transformers", "Sentence-Transformers", "NumPy", "BM25"],
        "repoUrl": "https://github.com/Arshnoor-Singh-Sohi/advanced-rag-system",
        "image": "/public/assets/images/Advanced_RAG_System.png"
    },
    {
        "id": 2,
        "name": "Jotion",
        "description": "A powerful Notion-inspired workspace that combines document editing, organization, and real-time collaboration in one seamless application",
        "techs": ["Next.js", "Convex", "TailwindCSS", "Clerk", "TypeScript", "React", "Shadcn UI", "Zustand", "BlockNote", "EdgeStore", "React Dropzone", "Radix UI", "Next Themes"],
        "repoUrl": "https://github.com/Arshnoor-Singh-Sohi/Jotion",
        "image": "/public/assets/images/notion.gif"
    },
    {
        "id": 3,
        "name": "Reddit Clone",
        "description": "A full-featured Reddit clone built with Flutter and Firebase offering cross-platform support, real-time updates, and comprehensive social features",
        "techs": ["Flutter", "Firebase", "Dart", "Riverpod", "FirebaseAuth", "Cloud Firestore", "Firebase Storage", "Google Sign-In", "Routemaster", "CupertinoTabBar", "SharedPreferences", "MVC Architecture"],
        "repoUrl": "https://github.com/Arshnoor-Singh-Sohi/Reddit",
        "image": "/public/assets/images/reddit.gif"
    },
    {
        "id": 4,
        "name": "TickFit",
        "description": "A comprehensive platform for smartwatch data analysis, comparison, and recommendations using web scraping, NLP, and data visualization",
        "techs": ["Java", "Selenium", "JSoup", "Apache POI", "Swing", "HTML", "CSS", "JavaScript", "Java Swing", "JUnit", "Maven", "TreeMap", "PriorityQueue", "Dynamic Programming", "Trie", "AVL Tree", "Web Scraping", "Web Crawling"],
        "repoUrl": "https://github.com/Arshnoor-Singh-Sohi/TickFit",
        "image": "/public/assets/images/tickfit.gif"
    },
    {
        "id": 5,
        "name": "Railway Management System",
        "description": "A comprehensive Python-Tkinter application for managing railway operations, including user registration, authentication, train scheduling, and ticket booking",
        "techs": ["Python", "Tkinter", "Oracle Database", "cx_Oracle", "PIL/Pillow", "MVC Pattern"],
        "repoUrl": "https://github.com/Arshnoor-Singh-Sohi/railway-management-tkinter",
        "image": "/public/assets/images/railway.gif"
    },
    {
        "id": 6,
        "name": "Currency Converter",
        "description": "A comprehensive Flutter application that converts USD to INR with both Material Design (Android) and Cupertino Design (iOS) implementations",
        "techs": ["Flutter", "Dart", "Material Design", "Cupertino Design", "StatefulWidget", "TextEditingController"],
        "repoUrl": "https://github.com/Arshnoor-Singh-Sohi/Currency-Converter",
        "image": "/public/assets/images/currency.gif"
    },
    {
        "id": 7,
        "name": "Shop-App",
        "description": "A sleek, modern e-commerce mobile application built with Flutter that offers a streamlined shopping experience with features like product browsing, category filtering, and cart management",
        "techs": ["Flutter", "Dart", "Provider", "Material Design", "Responsive UI", "ChangeNotifier", "Navigator", "GridView", "ListView"],
        "repoUrl": "https://github.com/Arshnoor-Singh-Sohi/Shop-App",
        "image": "/public/assets/images/shoes.gif"
    },
    {
        "id": 8,
        "name": "E-Mart",
        "description": "A comprehensive Java-based e-commerce platform with features like user roles, product catalog, shopping cart, and admin dashboard for managing products and categories",
        "techs": ["Java EE", "Servlets", "Hibernate", "MySQL", "JSP", "HTML", "CSS", "JavaScript", "Maven", "Apache Tomcat", "MVC Pattern", "DAO Pattern", "Singleton Pattern", "SessionFactory", "Java Servlet"],
        "repoUrl": "https://github.com/Arshnoor-Singh-Sohi/emart",
        "image": "/public/assets/images/emart.gif"
    },
    {
        "id": 9,
        "name": "MovieMania",
        "description": "A comprehensive Java Swing desktop application that enables users to discover, explore, and manage their favorite movies and TV shows with TMDB API integration",
        "techs": ["Java", "Java Swing", "MySQL", "JDBC", "TMDB API", "Unirest", "JSON.simple", "ImageIO", "BufferedImage", "NetBeans IDE"],
        "repoUrl": "https://github.com/Arshnoor-Singh-Sohi/MovieMania",
        "image": "/public/assets/images/moviemania.gif"
    },
    {
        "id": 10,
        "name": "Boston House Pricing Prediction",
        "description": "A machine learning project that implements linear regression to predict housing prices in Boston based on the famous Boston Housing Dataset",
        "techs": ["Python", "NumPy", "Pandas", "scikit-learn", "Matplotlib", "Seaborn", "Jupyter", "Pickle", "Linear Regression"],
        "repoUrl": "https://github.com/Arshnoor-Singh-Sohi/bostonhousepricing",
        "image": "/public/assets/images/housing.gif"
    },
    {
        "id": 11,
        "name": "aExpress",
        "description": "A full-featured e-commerce Android application that provides users with a seamless online shopping experience with features like product browsing, cart management, and secure checkout",
        "techs": ["Java", "Android SDK", "Firebase Authentication", "Firebase Firestore", "Volley", "Glide", "Material Components", "TinyCart", "MaterialSearchBar", "WhyNotImageCarousel", "RoundedImageView", "AdvancedWebView", "SharedPreferences"],
        "repoUrl": "https://github.com/Arshnoor-Singh-Sohi/aExpress",
        "image": "/public/assets/images/aexpress.gif"
    },
    {
        "id": 12,
        "name": "Movie Recommendation System",
        "description": "A content-based filtering application that suggests movies similar to a selected movie based on content features like genres, keywords, cast, and plot, with an interactive Streamlit interface",
        "techs": ["Python", "Pandas", "NumPy", "NLTK", "Scikit-learn", "Streamlit", "Requests", "Pickle", "TMDB API", "Content-based Filtering", "Cosine Similarity", "CountVectorizer", "PorterStemmer"],
        "repoUrl": "https://github.com/Arshnoor-Singh-Sohi/Movie-Recommendation-System",
        "image": "/public/assets/images/movie.gif"
    },
    {
        "id": 13,
        "name": "Forest Fire Prediction System",
        "description": "A comprehensive machine learning application designed to predict the likelihood of forest fires based on meteorological data, with both classification and regression capabilities",
        "techs": ["Python", "Flask", "Scikit-learn", "Pandas", "NumPy", "MongoDB Atlas", "HTML/CSS", "JavaScript", "Bootstrap", "Random Forest", "XGBoost", "Pickle", "Render"],
        "repoUrl": "https://github.com/Arshnoor-Singh-Sohi/Forest-Fire-Prediction",
        "image": "/public/assets/images/forest.gif"
    },
    {
        "id": 14,
        "name": "IMDb Movie Database Project",
        "description": "A web application that provides insights into movie data using the IMDb Non-Commercial Dataset, featuring comprehensive movie database, web interface, and data visualization of movie statistics",
        "techs": ["Python", "Flask", "SQLite", "HTML/CSS", "Pandas", "Data Visualization"],
        "repoUrl": "https://github.com/Arshnoor-Singh-Sohi/MovieMatrix",
        "image": "/public/assets/images/imbd.gif"
    },
    {
        "id": 15,
        "name": "Diabetes Prediction System",
        "description": "A web application that uses machine learning to predict the likelihood of diabetes in patients based on various health parameters, providing binary classification to assist in early diagnosis",
        "techs": ["Python", "Flask", "scikit-learn", "Pandas", "NumPy", "Pickle", "HTML/CSS", "Logistic Regression", "StandardScaler", "Jupyter Notebook", "Matplotlib", "Seaborn", "GridSearchCV"],
        "repoUrl": "https://github.com/Arshnoor-Singh-Sohi/Diabetes-Prediction",
        "image": "/public/assets/images/diabetes.gif"
    },
    {
        "id": 16,
        "name": "RAG Advanced Knowledge Management System",
        "description": "A sophisticated document processing and question-answering platform that leverages Retrieval-Augmented Generation (RAG) technology to upload documents, process them into semantic chunks, and answer questions based on the knowledge base",
        "techs": ["Flask", "Python", "LangChain", "OpenAI API", "ChromaDB", "AWS S3", "boto3", "HTML", "CSS", "JavaScript", "PyPDFLoader", "TextLoader", "Unstructured", "Vector Embeddings", "ConversationalRetrievalChain"],
        "repoUrl": "https://github.com/Arshnoor-Singh-Sohi/RAG-Advanced-Knowledge-Management-System",
        "image": "/public/assets/images/knowledge.gif"
    },
    {
        "id": 17,
        "name": "Advanced RAG System",
        "description": "A comprehensive Retrieval-Augmented Generation (RAG) system designed for knowledge management applications and research, featuring modular architecture, advanced document chunking, and multiple retrieval methods",
        "techs": ["Python", "OpenAI", "Streamlit", "FAISS", "LangChain", "Sentence-Transformers", "HuggingFace Transformers", "BM25", "Cross-encoder", "Pandas", "NumPy", "Query Transformation", "HyDE"],
        "repoUrl": "https://github.com/Arshnoor-Singh-Sohi/Advanced-RAG-System",
        "image": "/public/assets/images/Advanced_RAG_System.png"
    },
    {
        "id": 18,
        "name": "Distributed File System",
        "description": "A client-server based distributed file system that implements transparent file distribution across specialized servers based on file types, featuring concurrent client handling and comprehensive file operations",
        "techs": ["C", "Socket Programming", "TCP/IP", "Unix/Linux", "Process Concurrency", "GCC", "File System Operations", "Inter-Process Communication"],
        "repoUrl": "https://github.com/Arshnoor-Singh-Sohi/Distributed-File-System",
        "image": "/public/assets/images/distributed.gif"
    },
    {
        "id": 19,
        "name": "Linux Backup Automation System",
        "description": "A comprehensive bash-based backup solution that automates the creation and management of multiple backup types (full, incremental, differential, and size-based) for specified file types in a Linux environment",
        "techs": ["Bash", "Linux", "Shell Scripting", "tar", "Cron", "File Operations", "Process Management", "Log Management"],
        "repoUrl": "https://github.com/Arshnoor-Singh-Sohi/Linux-Backup-Automation-System",
        "image": "/public/assets/images/backup.gif"
    },
    {
        "id": 20,
        "name": "Custom Shell Implementation (w25shell)",
        "description": "A custom Unix/Linux shell implementation in C that provides a command-line interface with support for command execution, piping, reverse piping, file operations, I/O redirection, and sequential/conditional execution",
        "techs": ["C", "Linux", "Unix System Calls", "Process Management", "Inter-Process Communication", "File I/O", "Signal Handling", "GCC"],
        "repoUrl": "https://github.com/Arshnoor-Singh-Sohi/Custom-Shell-Implementation",
        "image": "/public/assets/images/shell.gif"
    },
    {
        "id": 21,
        "name": "Process Tree Explorer",
        "description": "A Linux command-line utility designed to navigate, analyze, and manipulate process hierarchies through parent-child relationships, with features for identifying defunct processes and performing process management operations",
        "techs": ["C", "Linux", "/proc filesystem", "Signal Handling", "Process Management", "System Programming", "Unix/Linux API", "GCC"],
        "repoUrl": "https://github.com/Arshnoor-Singh-Sohi/Process-Tree-Explorer",
        "image": "/public/assets/images/tree.gif"
    }
];

export default PROJECTS;