
        // Configuration - REPLACE THESE WITH YOUR ACTUAL KEYS
        const SUPABASE_URL = 'https://dgodyijazcaskdrurwar.supabase.co'; // Replace with your Supabase URL
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnb2R5aWphemNhc2tkcnVyd2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjU2OTQsImV4cCI6MjA3MjM0MTY5NH0.1we05Jjsy4X2I3ijI6zLfXg419fPWlFiILQblGWCWI4'; // Replace with your Supabase anon key
        
        // Free AI API Options (Choose one):
        // Option 1: Google Gemini (Recommended - Get free API key at https://makersuite.google.com/app/apikey)
        const GEMINI_API_KEY = 'AIzaSyBk4TiLVp-2cFi2QQtIasAxjpnMyy7Nixo';
        
        // Option 2: Cohere (Get free API key at https://cohere.ai/)
        const COHERE_API_KEY = 'jZLqxbwsa4FbfgtONNAfyEfupWZrb3PV3FMQWva1';
        

        // Initialize Supabase client with proper options
        const { createClient } = supabase;
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                flowType: 'pkce'
            }
        });
        
        // State Management - All data stored locally
        let state = {
            user: null,
            session: null,
            credits: 'Unlimited', // Always unlimited
            questionsAsked: [],
            selectedPlan: null,
            paymentProcessing: false,
            currentConversationId: null,
            localStats: {
                totalQuestions: 0,
                totalXP: 0,
                streakDays: 0,
                lastActiveDate: null,
                joinDate: null
            }
        };

        // Initialize app
        async function initializeApp() {
            // Load all data from localStorage
            loadLocalData();

            // Initialize user if first time
            if (!state.localStats.joinDate) {
                state.localStats.joinDate = new Date().toISOString();
                saveLocalData();
            }

            // Load quick questions (now just static)
            loadQuickQuestions();
        }

        // Load data from localStorage
        function loadLocalData() {
            const savedData = localStorage.getItem('juaKatibaData');
            if (savedData) {
                try {
                    const data = JSON.parse(savedData);
                    state.localStats = data.stats || state.localStats;
                    state.questionsAsked = data.questionsAsked || [];

                    // Check streak
                    updateStreak();
                } catch (e) {
                    console.error('Error loading local data:', e);
                }
            }
        }

        // Save data to localStorage
        function saveLocalData() {
            const dataToSave = {
                stats: state.localStats,
                questionsAsked: state.questionsAsked
            };
            localStorage.setItem('juaKatibaData', JSON.stringify(dataToSave));
        }

        // Update streak days
        function updateStreak() {
            const today = new Date().toDateString();
            const lastActive = state.localStats.lastActiveDate ? new Date(state.localStats.lastActiveDate).toDateString() : null;

            if (lastActive !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                if (lastActive === yesterday.toDateString()) {
                    // Continue streak
                    state.localStats.streakDays++;
                } else if (lastActive !== today) {
                    // Reset streak
                    state.localStats.streakDays = 1;
                }

                state.localStats.lastActiveDate = new Date().toISOString();
                saveLocalData();
            }
        }

        // Load quick questions (static)
        function loadQuickQuestions() {
            const staticQuestions = [
                { icon: "👮", question_text: "What are my rights if arrested?" },
                { icon: "🗳️", question_text: "How does voting work in Kenya?" },
                { icon: "🏛️", question_text: "What are the arms of government?" },
                { icon: "📚", question_text: "What does the constitution say about education?" },
                { icon: "🏥", question_text: "What are my healthcare rights?" },
                { icon: "🏘️", question_text: "What about land and property rights?" },
                { icon: "⚖️", question_text: "How does the court system work?" },
                { icon: "🏪", question_text: "What are my business rights?" },
                { icon: "👶", question_text: "What are children's rights?" },
                { icon: "♿", question_text: "What rights do disabled persons have?" }
            ];

            // Update the quick questions UI
            const container = document.querySelector('.quick-questions');
            if (container) {
                container.innerHTML = staticQuestions.map(q => `
                    <button class="question-pill" onclick="askAI('${q.question_text}')">
                        ${q.icon} ${q.question_text}
                    </button>
                `).join('');

                // Force check scroll buttons after questions are loaded
                requestAnimationFrame(() => {
                    checkScrollButtons();
                });
            }
        }

        // Scroll suggestions left or right
        function scrollSuggestions(direction) {
            const container = document.getElementById('quickQuestions');
            const scrollAmount = 200;

            if (direction === 'left') {
                container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }

            setTimeout(checkScrollButtons, 300);
        }

        // Check if scroll buttons should be enabled/disabled
        function checkScrollButtons() {
            const container = document.getElementById('quickQuestions');
            const leftButton = document.getElementById('navLeft');
            const rightButton = document.getElementById('navRight');

            if (!container || !leftButton || !rightButton) return;

            // Remove disabled class first to reset state
            leftButton.classList.remove('disabled');
            rightButton.classList.remove('disabled');

            // Only disable if actually at the limits
            const scrollLeft = container.scrollLeft;
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;

            // Check if content is scrollable
            if (scrollWidth <= clientWidth) {
                // Content fits, no need for scroll buttons
                leftButton.classList.add('disabled');
                rightButton.classList.add('disabled');
                return;
            }

            // Check if scrolled to start (with small tolerance)
            if (scrollLeft <= 1) {
                leftButton.classList.add('disabled');
            }

            // Check if scrolled to end (with small tolerance)
            const maxScroll = scrollWidth - clientWidth;
            if (scrollLeft >= maxScroll - 1) {
                rightButton.classList.add('disabled');
            }
        }

        // Make functions global
        window.scrollSuggestions = scrollSuggestions;
        window.checkScrollButtons = checkScrollButtons;

        // AI API Integration
        class AIService {
            constructor() {
                this.selectedAPI = 'gemini'; // Change to 'cohere' or 'huggingface' as needed
            }
            
            async generateResponse(query) {
                // First, validate if the question is about Kenyan constitution
                const lowerQuery = query.toLowerCase();
                const constitutionKeywords = ['constitution', 'kenya', 'law', 'right', 'article', 'chapter', 'freedom',
                                             'democracy', 'citizen', 'government', 'parliament', 'president', 'court',
                                             'justice', 'legal', 'bill of rights', 'devolution', 'county', 'election',
                                             'iebc', 'land', 'property', 'education', 'health', 'police', 'arrest'];

                const isRelevant = constitutionKeywords.some(keyword => lowerQuery.includes(keyword));

                // Enhanced, more specific prompt
                const contextPrompt = `You are an AI assistant specializing ONLY in the Constitution of Kenya 2010.

                IMPORTANT INSTRUCTIONS:
                1. ONLY answer questions related to the Kenyan Constitution
                2. If the question is NOT about the Kenyan Constitution, respond with an error
                3. Base your answers ONLY on the actual Constitution of Kenya 2010
                4. Cite specific Articles and Chapters from the Constitution
                5. Provide accurate, factual information - DO NOT make up articles or provisions

                User Question: "${query}"

                ${!isRelevant ? 'NOTE: This question may not be related to the Kenyan Constitution.' : ''}

                If this IS about the Kenyan Constitution, provide EXACTLY 5 different aspects as a JSON array.
                Each aspect should focus on a different angle or article of the constitution.

                Format each aspect as:
                {
                    "emoji": "relevant emoji",
                    "title": "specific aspect title (be precise)",
                    "article": "Article [number] or Chapter [number] of the Constitution",
                    "content": "detailed explanation based on the actual constitutional text",
                    "example": "practical real-world example of how this applies in Kenya"
                }

                If the question is NOT about the Kenyan Constitution, respond with:
                [{"emoji": "❌", "title": "Not Constitution Related", "article": "N/A", "content": "Please ask a question about the Kenyan Constitution.", "example": "Try asking about rights, freedoms, or government structure in Kenya."}]

                RESPOND WITH ONLY THE JSON ARRAY, no other text, no markdown formatting.`;

                try {
                    let response;
                    switch(this.selectedAPI) {
                        case 'gemini':
                            response = await this.generateWithGemini(contextPrompt);
                            break;
                        case 'cohere':
                            response = await this.generateWithCohere(contextPrompt);
                            break;
                        default:
                            response = await this.generateWithGemini(contextPrompt);
                    }

                    // Validate the response
                    if (!response || !Array.isArray(response) || response.length === 0) {
                        console.error('Invalid response format:', response);
                        return this.generateFallbackResponse(query);
                    }

                    // Ensure we have exactly 5 aspects
                    if (response.length < 5) {
                        // Pad with additional context if needed
                        while (response.length < 5) {
                            response.push({
                                emoji: "📖",
                                title: "Additional Context",
                                article: "Constitution of Kenya 2010",
                                content: "For more detailed information, please consult the full Constitution of Kenya 2010.",
                                example: "The Constitution is available at Kenya Law website."
                            });
                        }
                    } else if (response.length > 5) {
                        response = response.slice(0, 5);
                    }

                    return response;
                } catch (error) {
                    console.error('AI API Error:', error);
                    return this.generateFallbackResponse(query);
                }
            }
            
            async generateWithGemini(prompt) {
    // CORRECT MODEL NAME: gemini-1.5-flash or gemini-1.0-pro
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        })
    });

    if (!response.ok) {
        console.error('Gemini API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        throw new Error(`API responded with ${response.status}`);
    }

    const data = await response.json();

    // Check if the response has the expected structure
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Unexpected response structure:', data);
        throw new Error('Invalid response structure');
    }

    const text = data.candidates[0].content.parts[0].text;

    // Clean up the response more thoroughly
    let cleanedText = text;

    // Remove markdown code blocks
    cleanedText = cleanedText.replace(/```json\s*/gi, '');
    cleanedText = cleanedText.replace(/```\s*/gi, '');

    // Remove any leading/trailing whitespace
    cleanedText = cleanedText.trim();

    // Find JSON array in the response (in case there's extra text)
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
        cleanedText = jsonMatch[0];
    }

    try {
        const parsed = JSON.parse(cleanedText);

        // Validate that it's an array with proper structure
        if (!Array.isArray(parsed)) {
            throw new Error('Response is not an array');
        }

        // Validate each item has required fields
        const validatedResponse = parsed.map((item, index) => {
            if (!item.emoji || !item.title || !item.article || !item.content || !item.example) {
                console.warn(`Item ${index} missing required fields, using defaults`);
                return {
                    emoji: item.emoji || "📜",
                    title: item.title || "Constitutional Provision",
                    article: item.article || "Constitution of Kenya",
                    content: item.content || "Please refer to the Constitution of Kenya for details.",
                    example: item.example || "Consult legal experts for specific applications."
                };
            }
            return item;
        });

        return validatedResponse;
    } catch (parseError) {
        console.error('Failed to parse response as JSON:', cleanedText);
        console.error('Parse error:', parseError);
        throw new Error('Could not parse AI response');
    }
}
            
            async generateWithCohere(prompt) {
                const response = await fetch('https://api.cohere.ai/v1/generate', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${COHERE_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'command',
                        prompt: prompt,
                        max_tokens: 1000,
                        temperature: 0.7
                    })
                });

                const data = await response.json();
                return JSON.parse(data.generations[0].text);
            }

            generateFallbackResponse(query) {
                // Intelligent fallback based on query analysis
                const lowerQuery = query.toLowerCase();

                // Detect topic and provide relevant constitutional information
                if (lowerQuery.includes('arrest') || lowerQuery.includes('police')) {
                    return [
                        {
                            emoji: "👮",
                            title: "Rights During Arrest",
                            article: "Article 49 - Rights of arrested persons",
                            content: "Every arrested person has the right to be informed promptly of the reason for arrest, to remain silent, to communicate with an advocate, and to be held separately from convicted persons.",
                            example: "If police arrest you, they must tell you why and allow you to call a lawyer immediately."
                        },
                        {
                            emoji: "⚖️",
                            title: "Habeas Corpus",
                            article: "Article 50 - Fair hearing",
                            content: "Every person has the right to have any dispute decided in a fair and public hearing before a court.",
                            example: "You must be brought before a court within 24 hours of arrest."
                        },
                        {
                            emoji: "🔒",
                            title: "Freedom from Torture",
                            article: "Article 29 - Freedom and security",
                            content: "Every person has the right not to be subjected to torture or cruel, inhuman or degrading treatment.",
                            example: "Police cannot use excessive force or torture during interrogation."
                        },
                        {
                            emoji: "📞",
                            title: "Right to Legal Representation",
                            article: "Article 50(2)(h)",
                            content: "Every accused person has the right to have an advocate assigned by the State if substantial injustice would result.",
                            example: "If you cannot afford a lawyer, the state must provide one for serious charges."
                        },
                        {
                            emoji: "⏰",
                            title: "Bail Rights",
                            article: "Article 49(1)(h)",
                            content: "An arrested person has the right to be released on bond or bail on reasonable conditions.",
                            example: "You can apply for bail unless charged with serious crimes like murder or treason."
                        }
                    ];
                } else if (lowerQuery.includes('education') || lowerQuery.includes('school')) {
                    return [
                        {
                            emoji: "📚",
                            title: "Right to Education",
                            article: "Article 43(1)(f)",
                            content: "Every person has the right to education. The State shall provide free and compulsory basic education.",
                            example: "All children must receive free primary education in public schools."
                        },
                        {
                            emoji: "🎓",
                            title: "Higher Education Access",
                            article: "Article 43(1)(f)",
                            content: "The State shall make reasonable provision for access to higher education.",
                            example: "Government provides HELB loans and scholarships for university students."
                        },
                        {
                            emoji: "♿",
                            title: "Special Needs Education",
                            article: "Article 54",
                            content: "Persons with disabilities are entitled to access educational institutions integrated into society.",
                            example: "Schools must accommodate students with disabilities with appropriate facilities."
                        },
                        {
                            emoji: "🌍",
                            title: "Language Rights",
                            article: "Article 7",
                            content: "The national language is Kiswahili, official languages are English and Kiswahili.",
                            example: "Students can receive education in either English or Kiswahili."
                        },
                        {
                            emoji: "👶",
                            title: "Children's Rights",
                            article: "Article 53",
                            content: "Every child has the right to free and compulsory basic education.",
                            example: "Parents can be prosecuted for not sending children to school."
                        }
                    ];
                } else if (lowerQuery.includes('land') || lowerQuery.includes('property')) {
                    return [
                        {
                            emoji: "🏞️",
                            title: "Land Ownership Rights",
                            article: "Article 60 - Principles of land policy",
                            content: "Land in Kenya shall be held, used and managed equitably, efficiently, productively and sustainably.",
                            example: "Both men and women have equal rights to inherit and own land."
                        },
                        {
                            emoji: "📜",
                            title: "Property Protection",
                            article: "Article 40",
                            content: "Every person has the right to acquire and own property of any description in any part of Kenya.",
                            example: "Your property cannot be taken without compensation."
                        },
                        {
                            emoji: "🏛️",
                            title: "Public Land",
                            article: "Article 62",
                            content: "Public land includes government offices, national parks, and minerals.",
                            example: "National parks like Maasai Mara are public land held in trust."
                        },
                        {
                            emoji: "🏘️",
                            title: "Community Land",
                            article: "Article 63",
                            content: "Community land shall vest in and be held by communities based on ethnicity, culture or similar interest.",
                            example: "Maasai community lands are protected under the constitution."
                        },
                        {
                            emoji: "⚖️",
                            title: "Land Disputes",
                            article: "Article 67 - National Land Commission",
                            content: "The National Land Commission manages public land and resolves land disputes.",
                            example: "Land disputes can be resolved through the Environment and Land Court."
                        }
                    ];
                } else {
                    // Generic constitutional rights response
                    return [
                        {
                            emoji: "📜",
                            title: "Bill of Rights",
                            article: "Chapter 4",
                            content: "The Bill of Rights is an integral part of Kenya's democratic state and framework for social, economic and cultural policies.",
                            example: "All government actions must respect the rights in the Bill of Rights."
                        },
                        {
                            emoji: "🏛️",
                            title: "Sovereignty",
                            article: "Article 1",
                            content: "All sovereign power belongs to the people of Kenya and shall be exercised in accordance with the Constitution.",
                            example: "Citizens elect their leaders through democratic elections."
                        },
                        {
                            emoji: "⚖️",
                            title: "Equality",
                            article: "Article 27",
                            content: "Every person is equal before the law and has the right to equal protection and benefit of the law.",
                            example: "Discrimination based on race, sex, pregnancy, marital status, ethnic origin, colour, age, disability, religion is prohibited."
                        },
                        {
                            emoji: "🗣️",
                            title: "Freedom of Expression",
                            article: "Article 33",
                            content: "Every person has the right to freedom of expression, media freedom, and access to information.",
                            example: "You can express your opinions freely but cannot incite violence or hate speech."
                        },
                        {
                            emoji: "🤝",
                            title: "Access to Justice",
                            article: "Article 48",
                            content: "The State shall ensure access to justice for all persons and reasonable fees shall not impede access.",
                            example: "Court fees should not prevent anyone from seeking justice."
                        }
                    ];
                }
            }



            }



        const aiService = new AIService();

        // Mobile Menu Functions (global for HTML onclick)
        window.toggleMobileMenu = function() {
            const navMenu = document.getElementById('navMenu');
            navMenu.classList.toggle('active');
        }

        window.closeMobileMenu = function() {
            const navMenu = document.getElementById('navMenu');
            navMenu.classList.remove('active');
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            const navMenu = document.getElementById('navMenu');
            const menuToggle = document.querySelector('.menu-toggle');

            if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                closeMobileMenu();
            }
        });

        // Custom Cursor (only on desktop)
        if (window.innerWidth > 768) {
            document.addEventListener('mousemove', (e) => {
                const cursor = document.querySelector('.cursor');
                const cursorDot = document.querySelector('.cursor-dot');
                if (cursor && cursorDot) {
                    cursor.style.left = e.clientX + 'px';
                    cursor.style.top = e.clientY + 'px';
                    cursorDot.style.left = e.clientX + 'px';
                    cursorDot.style.top = e.clientY + 'px';
                }
            });
        }

        // Scroll Effects
        window.addEventListener('scroll', () => {
            const nav = document.getElementById('nav');
            if (window.scrollY > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }

            // Reveal animations
            const reveals = document.querySelectorAll('.about-content, .feature-card');
            reveals.forEach(element => {
                const rect = element.getBoundingClientRect();
                if (rect.top < window.innerHeight - 100) {
                    element.classList.add('visible');
                }
            });
        });

        // Navigation
        function showHome() {
            document.getElementById('landing-page').style.display = 'block';
            document.getElementById('chat-section').classList.remove('active');
            document.getElementById('dashboard-section').classList.remove('active');
            window.scrollTo(0, 0);
        }

        function showChat() {
            document.getElementById('landing-page').style.display = 'none';
            document.getElementById('chat-section').classList.add('active');
            document.getElementById('dashboard-section').classList.remove('active');

            // Initialize scroll buttons when showing chat
            setTimeout(() => {
                checkScrollButtons();
            }, 50);
        }

        function showDashboard() {
            // No auth required - always show dashboard
            document.getElementById('landing-page').style.display = 'none';
            document.getElementById('chat-section').classList.remove('active');
            document.getElementById('dashboard-section').classList.add('active');
            updateDashboard();
        }

        function updateDashboard() {
            const userName = localStorage.getItem('juaKatibaUserName') || 'Learner';
            const joinDate = state.localStats.joinDate ? new Date(state.localStats.joinDate).toLocaleDateString() : 'Today';

            const dashboardHTML = `
                <div class="dashboard">
                    <div class="dashboard-header">
                        <h1 class="welcome-title">Welcome back, ${userName}!</h1>
                        <p style="color: var(--text-muted);">
                            Learning since ${joinDate} • Unlimited access
                        </p>
                    </div>

                    <div class="dashboard-grid">
                        <div class="dash-card">
                            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📚</div>
                            <div style="font-size: 2rem; font-weight: bold;">${state.localStats.totalQuestions}</div>
                            <div style="color: var(--text-muted);">Questions Asked</div>
                        </div>
                        <div class="dash-card">
                            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">♾️</div>
                            <div style="font-size: 2rem; font-weight: bold;">∞</div>
                            <div style="color: var(--text-muted);">Unlimited Access</div>
                        </div>
                        <div class="dash-card">
                            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔥</div>
                            <div style="font-size: 2rem; font-weight: bold;">${state.localStats.streakDays}</div>
                            <div style="color: var(--text-muted);">Day Streak</div>
                        </div>
                        <div class="dash-card">
                            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⚡</div>
                            <div style="font-size: 2rem; font-weight: bold;">${state.localStats.totalXP}</div>
                            <div style="color: var(--text-muted);">XP Points</div>
                        </div>
                    </div>

                    <div style="margin-top: 2rem;">
                        <input type="text" id="userName" placeholder="Enter your name" value="${userName !== 'Learner' ? userName : ''}"
                               style="padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
                                      background: rgba(255,255,255,0.05); color: white; margin-right: 1rem;">
                        <button class="btn btn-secondary" onclick="updateUserName()">Update Name</button>
                    </div>

                    <button class="btn btn-primary" onclick="showChat()" style="margin-top: 2rem;">Continue Learning</button>
                </div>
            `;

            document.getElementById('dashboard-section').innerHTML = dashboardHTML;
        }

        // Update user name
        function updateUserName() {
            const nameInput = document.getElementById('userName');
            if (nameInput && nameInput.value.trim()) {
                localStorage.setItem('juaKatibaUserName', nameInput.value.trim());
                updateDashboard();
                showToast('Name updated successfully!', 'success');
            }
        }

        function scrollToSection(sectionId) {
            document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
        }

        function closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('active');
            }
        }

        // AI Chat Functions
     async function askAI(question) {
    document.getElementById('chatInput').value = question;
    
    // Collapse questions on mobile after selection
    if (window.innerWidth <= 768) {
        const wrapper = document.querySelector('.quick-questions-wrapper');
        wrapper.classList.add('collapsed');
    }
    
    sendMessage();
}
   async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    // Validate if question is about Kenyan Constitution
    const lowerMessage = message.toLowerCase();
    const constitutionKeywords = ['constitution', 'kenya', 'kenyan', 'law', 'right', 'article', 'chapter',
                                  'freedom', 'democracy', 'citizen', 'government', 'parliament', 'president',
                                  'court', 'justice', 'legal', 'bill of rights', 'devolution', 'county',
                                  'election', 'iebc', 'land', 'property', 'education', 'health', 'police',
                                  'arrest', 'vote', 'tax', 'public', 'service'];

    const isRelevant = constitutionKeywords.some(keyword => lowerMessage.includes(keyword));

    if (!isRelevant) {
        // Give user a warning but still process (Gemini will handle it)
        addUserMessage(message);
        input.value = '';
        showTyping();

        setTimeout(() => {
            hideTyping();
            addAIResponse({
                cards: [{
                    emoji: "❓",
                    title: "Please Ask About the Kenyan Constitution",
                    article: "Constitution of Kenya 2010",
                    content: "I'm specialized in answering questions about the Kenyan Constitution. Your question doesn't seem to be related to constitutional matters.",
                    example: "Try asking: 'What are my rights if arrested?', 'How does devolution work?', or 'What does the constitution say about education?'"
                }]
            });
            showToast('Please ask questions related to the Kenyan Constitution', 'info');
        }, 1000);
        return;
    }

    // No credit check needed - unlimited access for all users!

    // Add user message
    addUserMessage(message);
    input.value = '';

    // Save question to local history
    state.questionsAsked.push({
        question: message,
        timestamp: new Date().toISOString(),
        topic: detectTopic(message)
    });

    // Update stats
    state.localStats.totalQuestions++;
    state.localStats.totalXP += 10;
    updateStreak();
    saveLocalData();

    // Show typing indicator
    showTyping();

    try {
        // Get AI response
        const response = await aiService.generateResponse(message);

        hideTyping();

        // Validate response before displaying
        if (response && Array.isArray(response) && response.length > 0) {
            addAIResponse({ cards: response });
        } else {
            throw new Error('Invalid response format');
        }

        // Award bonus XP for completing a question
        state.localStats.totalXP += 5;
        saveLocalData();

    } catch (error) {
        console.error('Error getting AI response:', error);
        hideTyping();

        // Use fallback response if AI fails
        const fallbackResponse = aiService.generateFallbackResponse(message);
        if (fallbackResponse) {
            addAIResponse({ cards: fallbackResponse });
            showToast('Using cached constitutional information.', 'info');
        } else {
            showToast('Failed to get AI response. Please try again.', 'error');
        }
    }
}

        function detectTopic(message) {
            const topics = {
                'legal': ['arrest', 'police', 'court', 'lawyer'],
                'civic': ['vote', 'election', 'IEBC', 'democracy'],
                'property': ['land', 'property', 'ownership', 'inheritance'],
                'business': ['business', 'company', 'registration', 'tax'],
                'education': ['school', 'education', 'university', 'learning']
            };
            
            const lowerMessage = message.toLowerCase();
            for (const [topic, keywords] of Object.entries(topics)) {
                if (keywords.some(keyword => lowerMessage.includes(keyword))) {
                    return topic;
                }
            }
            return 'general';
        }

        function addUserMessage(message) {
            const messagesDiv = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message user';
            messageDiv.innerHTML = `
                <div class="message-content">${message}</div>
            `;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

function addAIResponse(data) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai new-message';
    messageDiv.id = `message-${Date.now()}`; // Add unique ID

    messageDiv.innerHTML = `
        <div class="response-cards">
            ${data.cards.map((card, index) => `
                <div class="response-card" style="animation-delay: ${index * 0.1}s">
                    <div class="card-header">
                        <div class="card-emoji">${card.emoji}</div>
                        <div>
                            <div class="card-title">${card.title}</div>
                            <div class="card-article">${card.article}</div>
                        </div>
                    </div>
                    <div class="card-content">${card.content}</div>
                    <div class="card-example">
                        <div class="card-example-title">Real-World Example</div>
                        <div class="card-example-text">${card.example}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    messagesDiv.appendChild(messageDiv);

    // Smooth scroll to the new message
    setTimeout(() => {
        messageDiv.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        });

        // Remove new-message class after animation
        setTimeout(() => {
            messageDiv.classList.remove('new-message');
        }, 1000);
    }, 100);
}


        function showTyping() {
            const messagesDiv = document.getElementById('chatMessages');
            const typingDiv = document.createElement('div');
            typingDiv.id = 'typing';
            typingDiv.className = 'typing-indicator';
            typingDiv.innerHTML = `
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            `;
            messagesDiv.appendChild(typingDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function hideTyping() {
            const typing = document.getElementById('typing');
            if (typing) typing.remove();
        }

        function handleEnter(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }

        // Toast Notifications
        function showToast(message, type = 'success') {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            
            container.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 10);
            
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        // Initialize on load
        document.addEventListener('DOMContentLoaded', () => {
            initializeApp();

            // Add initial message
            const messagesDiv = document.getElementById('chatMessages');
            if (messagesDiv) {
                messagesDiv.innerHTML = `
                    <div class="message">
                        <div class="message-content">
                            <strong>Karibu! I'm your AI Constitutional Guide.</strong><br><br>
                            Click any quick question below or type your own question.
                            I'll provide you with 5 detailed cards explaining different aspects of your rights with real-world examples.<br><br>
                            <span style="color: var(--accent-light);">🎁 You have unlimited access to learn about your constitutional rights!</span>
                        </div>
                    </div>
                `;
            }

            // Initialize scroll buttons after a short delay to ensure DOM is ready
            setTimeout(() => {
                checkScrollButtons();
                // Also add event listener for window resize
                window.addEventListener('resize', checkScrollButtons);
            }, 200);
        });
  