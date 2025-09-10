import { useState, useEffect, useRef } from 'react';

// Define the Particles component within the same file to avoid import issues
const Particles = ({ threeJsLoaded }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    // Only run this effect if three.js has been successfully loaded
    if (!threeJsLoaded || typeof THREE === 'undefined') {
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });

    // Set the renderer size and camera aspect ratio to match the container
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Add ambient and directional light for better particle visibility
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);

    // Create a particle geometry and material
    const particleCount = 1000;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const color = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
      // Position particles randomly in a sphere
      const x = (Math.random() - 0.5) * 50;
      const y = (Math.random() - 0.5) * 50;
      const z = (Math.random() - 0.5) * 50;
      positions.push(x, y, z);

      // Assign random colors based on the desired theme
      color.setRGB(Math.random(), Math.random(), Math.random());
      colors.push(color.r, color.g, color.b);
    }

    particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });

    const particleMesh = new THREE.Points(particlesGeometry, particleMaterial);
    scene.add(particleMesh);

    camera.position.z = 5;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate particles for a dynamic effect
      particleMesh.rotation.x += 0.0005;
      particleMesh.rotation.y += 0.0005;

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [threeJsLoaded]); // Re-run effect when threeJsLoaded changes

  return <div ref={mountRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -20 }} />;
};

// Component to render LaTeX math notation using KaTeX
const MathJax = ({ text }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Check if KaTeX has been loaded and the container exists
    if (window.katex && containerRef.current) {
      try {
        // Find and replace all instances of $...$ with KaTeX-rendered content
        containerRef.current.innerHTML = text.replace(/\$(.*?)\$/g, (match, formula) => {
          return window.katex.renderToString(formula, { throwOnError: false });
        });
      } catch (e) {
        console.error("KaTeX rendering error:", e);
        containerRef.current.innerHTML = text; // Fallback to original text on error
      }
    }
  }, [text]);

  return <span ref={containerRef} />;
};


// Define reusable sections/pages
const Home = ({ onNavigate }) => (
  <>
    {/* Hero Section */}
    <section className="hero-section">
      <div className="hero-card">
        <h1 className="hero-title header-margin">
          <span role="img" aria-label="Earth">🌍</span> Carbon Analyzer
        </h1>
        <p className="hero-subtitle">
          Track, analyze, and reduce your carbon footprint with{" "}
          <span className="hero-highlight">real-time insights</span>.
        </p>
        <div className="button-group">
          <button className="cta-button primary" onClick={() => onNavigate('getStarted')}>Get Started</button>
          <button className="cta-button secondary" onClick={() => onNavigate('learnMore')}>Learn More</button>
        </div>
      </div>
    </section>

    {/* Feature Section */}
    <section className="feature-section">
      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <span>🌿</span>
          </div>
          <h3 className="feature-title header-margin">
            <button className="feature-button" onClick={() => onNavigate('ecoTracking')}>Eco Tracking</button>
          </h3>
          <p className="feature-description">
            Monitor your daily activities and measure your carbon emissions instantly.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <span>📈</span>
          </div>
          <h3 className="feature-title">
            <button className="feature-button" onClick={() => onNavigate('smartComparisons')}>Smart Comparisons</button>
          </h3>
          <p className="feature-description">
            Compare your footprint with peers, communities, and global averages.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <span>💡</span>
          </div>
          <h3 className="feature-title">
            <button className="feature-button" onClick={() => onNavigate('sustainabilityTips')}>Sustainability Tips</button>
          </h3>
          <p className="feature-description">
            Get actionable advice to reduce your carbon footprint and live greener.
          </p>
        </div>
      </div>
    </section>
  </>
);

const EcoTracking = ({ onNavigate }) => {
  const [transportationMiles, setTransportationMiles] = useState(0);
  const [energyKwh, setEnergyKwh] = useState(0);
  const [diet, setDiet] = useState('average');
  const [carbonFootprint, setCarbonFootprint] = useState(null);

  // This is a simplified calculation. Real values would be much more complex.
  const calculateFootprint = () => {
    // Conversion factors (very rough estimates for demonstration)
    const transportationFactor = 0.40; // kg CO2 per mile (average car)
    const energyFactor = 0.5; // kg CO2 per kWh (US average)
    const dietFactors = {
      'meat': 10,  // kg CO2 per day
      'vegetarian': 4,
      'vegan': 2,
      'average': 7,
    };

    const totalFootprint =
      (parseFloat(transportationMiles) * transportationFactor) +
      (parseFloat(energyKwh) * energyFactor) +
      dietFactors[diet];

    setCarbonFootprint(totalFootprint.toFixed(2));
  };

  return (
    <section className="hero-section text-center">
      <div className="hero-card">
        <button className="back-button" onClick={() => onNavigate('home')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
        <h2 className="text-3xl font-bold mb-4">Eco Tracking</h2>
        <p className="mb-8 text-gray-700">
          Enter your daily activities to calculate your carbon footprint and start making a difference.
        </p>

        <div className="space-y-6">
          {/* Transportation */}
          <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
            <label className="block text-left text-lg font-semibold text-emerald-700 mb-2">
              Transportation
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={transportationMiles}
                onChange={(e) => setTransportationMiles(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition duration-300"
                min="0"
              />
              <span className="text-gray-600">miles/day</span>
            </div>
          </div>

          {/* Energy */}
          <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
            <label className="block text-left text-lg font-semibold text-emerald-700 mb-2">
              Home Energy
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={energyKwh}
                onChange={(e) => setEnergyKwh(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition duration-300"
                min="0"
              />
              <span className="text-gray-600">kWh/day</span>
            </div>
          </div>

          {/* Diet */}
          <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
            <label className="block text-left text-lg font-semibold text-emerald-700 mb-2">
              Dietary Habits
            </label>
            <select
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition duration-300"
            >
              <option value="average">Average</option>
              <option value="meat">Meat-Heavy</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
            </select>
          </div>
        </div>

        <button
          onClick={calculateFootprint}
          className="w-full mt-8 py-3 px-6 rounded-full text-white font-bold bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          Calculate Footprint
        </button>

        {carbonFootprint !== null && (
          <div className="mt-6 p-6 bg-emerald-700 rounded-lg shadow-lg text-white">
            <h3 className="text-xl font-semibold mb-2">Your Daily Carbon Footprint</h3>
            <p className="text-5xl font-extrabold mb-2">{carbonFootprint}</p>
            <p className="text-lg">
              kg of <MathJax text="$CO_2e$" /> per day
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

const GetStarted = ({ onNavigate }) => {
  const [userName, setUserName] = useState('');
  const [goal, setGoal] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userName && goal) {
      console.log('User Name:', userName);
      console.log('User Goal:', goal);
      setStatus('Thanks for sharing your goals! You can now proceed to Eco Tracking.');
      setTimeout(() => {
        setStatus('');
        onNavigate('ecoTracking');
      }, 2000);
    } else {
      setStatus('Please fill out all the fields.');
    }
  };

  return (
    <section className="hero-section text-center">
      <div className="hero-card">
        <button className="back-button" onClick={() => onNavigate('home')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
        <h2 className="text-3xl font-bold mb-4">Get Started</h2>
        <p className="text-gray-700 mb-6">
          The climate crisis is one of the most pressing challenges of our time. While it can feel overwhelming, individual action is a powerful and necessary part of the solution. Our mission is to make climate action "simple and accessible". With modern technology and data, it's now "feasible" to give every person the tools they need to understand their personal impact and make meaningful change.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
         <div className="relative w-full">
           <div className="relative w-full">
              <input
                type="text"
                id="username"
                placeholder=" "
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-5 py-3 rounded-xl border border-transparent bg-white/20 backdrop-blur-md text-gray-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 shadow-md transition duration-300"
              />
              <label
                htmlFor="username"
                className="absolute left-5 top-3 text-gray-400 text-sm transition-all duration-300 pointer-events-none"
              >
                Your Name
              </label>
            </div>


          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 rounded-full text-white font-bold bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            Submit and Start Tracking
          </button>
        </form>
        {status && <p className="mt-4 text-sm text-gray-600">{status}</p>}
      </div>
    </section>
  );
};

const LearnMore = ({ onNavigate }) => {
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    if (feedback) {
      console.log('User Feedback:', feedback);
      setStatus('Thanks for your feedback! We appreciate you taking the time to help us improve.');
      setFeedback(''); 
    } else {
      setStatus('Please enter your feedback before submitting.');
    }
    setTimeout(() => setStatus(''), 2000);
  };

  return (
    <section className="hero-section text-center">
      <div className="hero-card">
        <button className="back-button" onClick={() => onNavigate('home')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
        <h2 className="text-3xl font-bold mb-4">Learn More</h2>
        <div className="text-left space-y-6">
          <p className="text-gray-700">
            Carbon emissions are a **major concern** because they are the primary driver of the greenhouse effect, which is causing global temperatures to rise. This leads to more frequent and intense weather events, rising sea levels, and a host of other environmental and social challenges.
          </p>
          <p className="text-gray-700">
            While industrial emissions are the largest contributor, our individual footprints are also significant. The carbon released from our transportation, diet, and home energy consumption adds up. Understanding and reducing your personal footprint is a powerful way to contribute to the global effort. This app gives you a tangible way to see the impact of your choices and empowers you to make a difference.
          </p>
          <p className="text-gray-700">
            We've built this app to give you the tools and insights you need to get started on your own journey to sustainability. We've used simple models and technology like the **Gemini API** to provide you with actionable advice, moving beyond a simple calculator. 
          </p>
        </div>
        <div className="mt-8 text-center p-6 bg-gray-50 rounded-lg shadow-inner">
          {status && <p className="mt-4 text-sm text-gray-600">{status}</p>}
        </div>
      </div>
    </section>
  );
};

const SmartComparisons = ({ onNavigate }) => {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadStatus('');
  };

  const handleUpload = () => {
    if (file) {
      setUploadStatus(`Simulating upload of file: ${file.name}. This feature will be fully implemented soon!`);
    
      console.log('Simulating upload of file:', file.name);
    } else {
      setUploadStatus('Please select a file to upload.');
    }
  };

  return (
    <section className="hero-section text-center">
      <div className="hero-card">
        <button className="back-button" onClick={() => onNavigate('home')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
        <h2 className="text-3xl font-bold mb-4">Smart Comparisons</h2>
        <p className="mb-8 text-gray-700">
          See how your carbon footprint compares to others and the global average.
        </p>

        {/* Global Average Section */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-inner border border-gray-200">
          <h3 className="text-xl font-semibold text-emerald-700 mb-4">Global Carbon Footprint Average</h3>
          <p className="text-gray-700 mb-4">
            Want to see detailed statistics and graphs about the global average?
          </p>
          <button
            onClick={() => onNavigate('globalAverageDetails')}
            className="py-2 px-6 rounded-full text-white font-bold bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            View Details
          </button>
        </div>
        {/* Peer Comparison Section */}
        <div className="p-6 bg-gray-50 rounded-lg shadow-inner border border-gray-200">
          <h3 className="text-xl font-semibold text-emerald-700 mb-4">Compare with Your Peers</h3>
          <p className="text-gray-700 mb-4">
            Upload a file with your carbon footprint data to see how you stack up against your friends and community.
          </p>
          <div className="flex flex-col items-center gap-4">
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-emerald-50 file:text-emerald-700
                hover:file:bg-emerald-100 transition-all duration-300
              "
            />
            <button
              onClick={handleUpload}
              disabled={!file}
              className="py-2 px-6 rounded-full text-white font-bold bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Upload Data
            </button>
            {uploadStatus && (
              <p className="mt-2 text-sm text-gray-600">{uploadStatus}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
const GlobalAverageDetails = ({ onNavigate }) => {
  const [isGraphVisible, setIsGraphVisible] = useState(false);

  return (
    <section className="hero-section text-center">
      <div className="hero-card">
        <button className="back-button" onClick={() => onNavigate('smartComparisons')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
        <h2 className="text-3xl font-bold mb-4">Global Carbon Footprint Average</h2>
        <p className="mb-8 text-gray-700">
          Here you can find detailed data and statistics about the global average.
        </p>
        {/* New Key Metric Card */}
        <div className="mb-8 p-6 bg-emerald-700 rounded-lg shadow-lg text-white">
          <h3 className="text-xl font-semibold mb-2">Estimated Global Average</h3>
          <p className="text-5xl font-extrabold mb-2">4.8</p>
          <p className="text-lg">
            metric tons of carbon dioxide emission <MathJax text="$CO_2e$" /> per year
          </p>
          <p className="text-sm italic mt-2 opacity-80">This figure can vary significantly based on location, lifestyle, and consumption habits.</p>
        </div>

        <div className="p-6 bg-gray-50 rounded-lg shadow-inner border border-gray-200 text-left">
          <h3 className="text-lg font-semibold text-emerald-700 mt-6 mb-2">Visual Data:</h3>
          <p className="text-gray-700 mb-4">
            Click the button below to see a detailed graph of annual emissions.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => setIsGraphVisible(!isGraphVisible)}
              className="py-2 px-6 rounded-full text-white font-bold bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              {isGraphVisible ? 'Hide Emissions Graph' : 'Show Emissions Graph'}
            </button>
          </div>

          {isGraphVisible && (
            <div className="w-full flex justify-center p-4 rounded-lg shadow-md border border-gray-200 mt-4">
              <svg viewBox="0 0 1200 600" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#F3F4F6" />
                <text x="50%" y="50%" textAnchor="middle" alignmentBaseline="middle" fontSize="30" fontWeight="bold" fill="#6B7280">Annual CO2 Emissions Graph</text>
                <path d="M100 500 L1100 500" stroke="#D1D5DB" strokeWidth="2" />
                <path d="M100 500 L100 100" stroke="#D1D5DB" strokeWidth="2" />
                <path d="M100 450 L1100 450" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="5,5" />
                <path d="M100 400 L1100 400" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="5,5" />
                <path d="M100 350 L1100 350" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="5,5" />
                <path d="M100 300 L1100 300" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="5,5" />
                <path d="M100 250 L1100 250" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="5,5" />
                <path d="M100 200 L1100 200" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="5,5" />
                <path d="M100 150 L1100 150" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="5,5" />
                <polyline points="150,450 300,350 450,400 600,250 750,300 900,150 1050,200" fill="none" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
                <text x="100" y="520" textAnchor="middle" fontSize="16" fill="#6B7280">2018</text>
                <text x="300" y="520" textAnchor="middle" fontSize="16" fill="#6B7280">2019</text>
                <text x="500" y="520" textAnchor="middle" fontSize="16" fill="#6B7280">2020</text>
                <text x="700" y="520" textAnchor="middle" fontSize="16" fill="#6B7280">2021</text>
                <text x="900" y="520" textAnchor="middle" fontSize="16" fill="#6B7280">2022</text>
                <text x="1100" y="520" textAnchor="middle" fontSize="16" fill="#6B7280">2023</text>
                <text x="50" y="500" textAnchor="end" fontSize="16" fill="#6B7280">0</text>
                <text x="50" y="100" textAnchor="end" fontSize="16" fill="#6B7280">10</text>
                <text x="600" y="580" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#4B5563">Year</text>
                <text x="20" y="300" transform="rotate(-90 20 300)" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#4B5563">Emissions (tons)</text>
              </svg>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const SustainabilityTips = ({ onNavigate }) => {
  const [userHabits, setUserHabits] = useState('');
  const [tips, setTips] = useState('Enter your habits above to get personalized tips!');
  const [loading, setLoading] = useState(false);

  // The API key is handled automatically by the environment
  const apiKey = '';

  // Helper function for exponential backoff retry logic
  const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) { // Too Many Requests
        throw new Error('Rate limit exceeded');
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (retries > 0) {
        console.warn(`Fetch failed. Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      } else {
        throw error;
      }
    }
  };


  const generateTips = async () => {
    setLoading(true);
    setTips('');
    const systemPrompt = "You are a world-class sustainability expert. Provide concise, actionable, and encouraging tips to help a person reduce their carbon footprint. Focus on the habits they describe. Use an encouraging and friendly tone. Start your response with a short, positive greeting.";
    const userQuery = `My daily habits and lifestyle are as follows: ${userHabits}`;

    if (!apiKey) {
      setLoading(false);
      setTips("There seems to be an issue connecting to the AI. Please try refreshing the page or contact support if the problem persists.");
      console.error("API Key not available.");
      return;
    }

    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

      const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
      };

      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate tips right now. Please try again.";
      setTips(generatedText);

    } catch (error) {
      console.error('Error generating tips:', error);
      setTips('Sorry, something went wrong. Please check your network connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="hero-section text-center">
      <div className="hero-card">
        <button className="back-button" onClick={() => onNavigate('home')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
        <h2 className="text-3xl font-bold mb-4">Sustainability Tips</h2>
        <p className="mb-4 text-gray-700">Describe your daily habits below, and I'll generate some personalized tips for you.</p>

        <textarea
          className="w-full h-32 p-4 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition duration-300 resize-none"
          placeholder="e.g., 'I drive to work every day, I eat a lot of meat, and I want to reduce my electricity bill.'"
          value={userHabits}
          onChange={(e) => setUserHabits(e.target.value)}
        />

        <button
          className="w-full py-3 px-6 rounded-full text-white font-bold bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed mt-4"
          onClick={generateTips}
          disabled={loading || !userHabits.trim()}
        >
          {loading ? 'Generating...' : 'Get My Tips ✨'}
        </button>

        {loading && (
          <div className="mt-4 flex items-center justify-center">
            <div className="w-6 h-6 border-4 border-emerald-300 border-t-emerald-500 rounded-full animate-spin"></div>
            <span className="ml-2 text-gray-500">Thinking...</span>
          </div>
        )}

        {!loading && tips && (
          <div className="mt-6 text-left p-4 bg-gray-50 rounded-lg shadow-inner border border-gray-200">
            <h3 className="text-lg font-semibold text-emerald-700 mb-2">Your Tips:</h3>
            <p className="text-gray-700 whitespace-pre-line">{tips}</p>
          </div>
        )}

      </div>
    </section>
  );
};

const JoinNow = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  const handleCreateAccount = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setStatus('Please enter both email and password.');
      return;
    }
    // Simulate API call or form submission
    setStatus('Creating account...');
    setTimeout(() => {
      setStatus('Account created successfully! Redirecting to home...');
      setEmail('');
      setPassword('');
      setTimeout(() => onNavigate('home'), 1500); // Redirect after a delay
    }, 2000);
  };

  return (
    <section className="hero-section text-center">
      <div className="hero-card">
        <button className="back-button" onClick={() => onNavigate('home')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
        <h2 className="text-3xl font-bold mb-4 text-emerald-700">Join the Movement!</h2>
        <p className="text-gray-700 mb-6">
          Sign up to start your journey towards a greener future.
        </p>
        <form className="space-y-4" onSubmit={handleCreateAccount}>
          <input
            type="email"
            placeholder="Email Address"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition duration-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition duration-300"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="w-full py-3 px-6 rounded-full text-white font-bold bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            Create Account
          </button>
        </form>
        {status && <p className="mt-4 text-sm text-gray-600">{status}</p>}
      </div>
    </section>
  );
};


// Main App component
function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isHovered, setIsHovered] = useState(false);
  const [threeJsLoaded, setThreeJsLoaded] = useState(false);
  const [katexLoaded, setKatexLoaded] = useState(false);

  useEffect(() => {
    // Dynamically load external libraries in a single, organized effect
    const loadScript = (src, onLoadCallback) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = onLoadCallback;
      script.onerror = () => {
        console.error(`Failed to load script: ${src}`);
      };
      document.head.appendChild(script);
      return script;
    };

    const threeJsScript = loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js", () => setThreeJsLoaded(true));
    const katexCss = document.createElement('link');
    katexCss.rel = "stylesheet";
    katexCss.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
    document.head.appendChild(katexCss);
    const katexScript = loadScript("https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js", () => setKatexLoaded(true));


    return () => {
      // Clean up scripts and styles
      document.head.removeChild(threeJsScript);
      document.head.removeChild(katexScript);
      document.head.removeChild(katexCss);
    };
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'ecoTracking':
        return <EcoTracking onNavigate={setCurrentPage} />;
      case 'getStarted':
        return <GetStarted onNavigate={setCurrentPage} />;
      case 'learnMore':
        return <LearnMore onNavigate={setCurrentPage} />;
      case 'smartComparisons':
        return <SmartComparisons onNavigate={setCurrentPage} />;
      case 'globalAverageDetails':
        return <GlobalAverageDetails onNavigate={setCurrentPage} />;
      case 'sustainabilityTips':
        return <SustainabilityTips onNavigate={setCurrentPage} />;
      case 'joinNow':
        return <JoinNow onNavigate={setCurrentPage} />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="relative min-h-screen font-[Inter] bg-gradient-to-tr from-emerald-100 via-white to-cyan-100 text-gray-800 overflow-hidden">
      {threeJsLoaded && <Particles threeJsLoaded={threeJsLoaded} />}
    <style>
        {`
          :root {
            --green-700: #15803d;
            --green-600: #16a34a;
            --green-400: #4ade80;
            --gray-100: #f3f4f6;
            --gray-600: #141414ff;
            --white: #ffffff;
            --blue-600: #2563eb;
          }

          /* Layout */
          .main-container {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }
          .main-content {
            flex-grow: 1;
          }
          .header-margin {
            margin-bottom: 20px;
          }

          /* Hero */
          .hero-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 70vh;
            padding: 0 1.5rem;
            gap: 1rem;
          }
          .hero-card {
            position: relative;
            background: rgba(22, 163, 74, 0.1);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border-radius: 1rem;
            padding: 2.5rem;
            text-align: center;
            max-width: 32rem;
            width: 100%;
            min-height: 500px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .hero-title {
            font-size: 3.75rem;
            line-height: 1;
            font-weight: 800;
            color: var(--green-700);
            text-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
          }
          @media (min-width: 768px) {
            .hero-title { font-size: 4.5rem; }
          }
          .hero-subtitle {
            font-size: 1.125rem;
            line-height: 1.75rem;
            color: var(--gray-100);
            margin-bottom: 2rem;
          }
          @media (min-width: 768px) {
            .hero-subtitle { font-size: 1.25rem; }
          }
          .hero-highlight {
            color: var(--green-400);
            font-weight: 600;
          }
          .button-group {
            display: flex;
            gap: 1rem;
            justify-content: center;
          }

          /* Buttons */
          .cta-button {
            padding: 0.75rem 1.75rem;
            color: var(--white);
            border-radius: 0.75rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            backdrop-filter: blur(4px);
            border: none;
          }
          .cta-button.primary { background: rgba(50, 139, 50, 0.8); }
          .cta-button.primary:hover { background: var(--green-700); }
          .cta-button.secondary {
            background: transparent;
            color: var(--green-400);
            border: 1px solid var(--green-400);
          }
          .cta-button.secondary:hover {
            background: var(--green-400);
            color: var(--white);
          }
          .back-button {
            position: absolute;
            top: 1rem;
            left: 1rem;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 9999px;
            padding: 0.5rem;
            color: var(--white);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
          }
          .back-button:hover {
            background: rgba(255, 255, 255, 0.4);
          }
          /* Features */
          .feature-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 5rem 1.5rem;
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(8px);
          }
          .feature-grid {
            max-width: 72rem;
            margin: 0 auto;
            padding: 0 1.5rem;
            display: grid;
            grid-template-columns: 1fr;
            gap: 2rem;
            text-align: center;
          }
          @media (min-width: 768px) {
            .feature-grid { grid-template-columns: repeat(3, 1fr); }
          }
          .feature-card {
            padding: 2.5rem;
            border-radius: 0.75rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            transition: box-shadow 0.3s ease;
            background: #f1f1f1ff;
          }
          .feature-card:hover {
            box-shadow: 0 10px 15px rgba(0,0,0,0.1);
          }
          .feature-icon {
            font-size: 2.5rem;
            color: var(--green-600);
            margin: 1.5rem auto;
          }
          .feature-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }
          .feature-description { color: var(--gray-600); }
          .feature-button {
            background: rgba(22, 163, 74, 0.7);
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            border: none;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
            cursor: pointer;
            white-space: nowrap; /* Prevents text from wrapping */
          }
          .feature-button:hover {
            background: var(--green-700);
          }

          /* CTA Section */
          .cta-section {
            max-width: 72rem;
            margin: 0 auto;
            padding: 4rem 1.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            color: var(--gray-600);
            text-align: center;
            z-index: 10;
          }
          @media (min-width: 768px) {
            .cta-section { flex-direction: row; text-align: left; }
          }
          .cta-heading {
            font-size: 1.875rem;
            font-weight: 700;
            margin-bottom: 1rem;
          }
          .cta-heading-button {
            background: rgba(255,255,255,0.2);
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            border: none;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            cursor: pointer;
            white-space: nowrap; /* Prevents text from wrapping */
          }
          .cta-heading-button:hover {
            background: rgba(22, 163, 74, 0.8);
            color: var(--white);
          }
          .cta-description {
            margin: 0 auto 2rem;
            max-width: 27rem;
          }
          .join-button {
            padding: 0.75rem 2rem;
            background: var(--white);
            color: var(--green-700);
            font-weight: 600;
            border-radius: 0.75rem;
            border: none;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: background 0.3s ease;
          }
          .join-button:hover { background: var(--green-600); }
          /* Footer */
          .footer-section {
            width: 100%;
            background: rgba(245, 245, 245, 0.32);
            backdrop-filter: blur(8px);
            box-shadow: inset 0 2px 4px rgba(133, 36, 76, 0.06);
            margin-top: 3rem;
          }
          .footer-content {
            max-width: 70rem;
            margin: 0 auto;
            padding: 4rem 1.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            color: var(--gray-600);
          }
          @media (min-width: 768px) {
            .footer-content { flex-direction: row; justify-content: space-between; }
          }
          .footer-copyright {
            font-size: 0.875rem;
          }
          .footer-links {
            display: flex;
            gap: 1.75rem;
            margin-top: 1rem;
          }
          @media (min-width: 768px) {
            .footer-links { margin-top: 0; }
          }
          .footer-link {
            color: var(--gray-600);
            text-decoration: none;
            transition: color 0.3s ease;
          }
          .footer-link:hover { color: var(--green-600); }
        `}
      </style>

      <div className="main-container">
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
      {currentPage === 'home' && (
        <section className="cta-section">
          <h2 className="cta-heading">
            <button
              className="cta-heading-button"
              onClick={() => setCurrentPage('joinNow')}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {isHovered ? 'Join Now' : 'Ready to make an impact?'}
            </button>
          </h2>
          <p className="cta-description">
            Start tracking your carbon footprint today and join the movement for a sustainable future.
          </p>
        </section>
      )}
      {/* Footer */}
      <footer className="footer-section">
        <div className="footer-content">
          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} Carbon Analyzer. All rights reserved.
          </p>
          <div className="footer-links">
            <a href="#" className="footer-link" onClick={() => setCurrentPage('learnMore')}>About</a>
            <a href="#" className="footer-link" onClick={() => setCurrentPage('getStarted')}>Services</a>
            <a href="#" className="footer-link" onClick={() => setCurrentPage('joinNow')}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
