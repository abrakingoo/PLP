
        // Configuration - REPLACE THESE WITH YOUR ACTUAL KEYS
        const SUPABASE_URL = 'https://dgodyijazcaskdrurwar.supabase.co'; // Replace with your Supabase URL
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnb2R5aWphemNhc2tkcnVyd2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjU2OTQsImV4cCI6MjA3MjM0MTY5NH0.1we05Jjsy4X2I3ijI6zLfXg419fPWlFiILQblGWCWI4'; // Replace with your Supabase anon key
        
        // Free AI API Options (Choose one):
        // Option 1: Google Gemini (Recommended - Get free API key at https://makersuite.google.com/app/apikey)
        const GEMINI_API_KEY = 'AIzaSyBk4TiLVp-2cFi2QQtIasAxjpnMyy7Nixo';
        
        // Option 2: Cohere (Get free API key at https://cohere.ai/)
        const COHERE_API_KEY = 'jZLqxbwsa4FbfgtONNAfyEfupWZrb3PV3FMQWva1';
        

        // Initialize Supabase client
        const { createClient } = supabase;
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
        
        // State Management
        let state = {
            user: null,
            session: null,
            credits: 5,
            questionsAsked: [],
            selectedPlan: null,
            paymentProcessing: false,
            currentConversationId: null
        };

        // Initialize app
        async function initializeApp() {
            // Check for existing session
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                state.session = session;
                state.user = session.user;
                await loadUserData();
            } else {
                // Load from localStorage for non-authenticated users
                const savedCredits = localStorage.getItem('juaKatibaCredits');
                if (savedCredits) {
                    state.credits = savedCredits === 'Unlimited' ? 'Unlimited' : parseInt(savedCredits);
                }
            }
            
            // Load quick questions from database
            await loadQuickQuestions();
        }

        // Load user data from Supabase
// Load user data from Supabase
async function loadUserData() {
    if (!state.user) return;
    
    // Get user profile
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', state.user.id)
        .single();
    
    if (profile) {
        state.profile = profile;
    }
    
    // Get user credits
    let { data: credits } = await supabaseClient
        .from('user_credits')
        .select('*')
        .eq('user_id', state.user.id)
        .single();
    
    // If no credits record exists, create one with 5 free credits
    if (!credits) {
        const { data: newCredits } = await supabaseClient
            .from('user_credits')
            .insert({
                user_id: state.user.id,
                free_credits: 5,
                paid_credits: 0
            })
            .select()
            .single();
        
        credits = newCredits;
    }
    
    if (credits) {
        if (credits.unlimited_until && new Date(credits.unlimited_until) > new Date()) {
            state.credits = 'Unlimited';
        } else {
            state.credits = (credits.free_credits || 0) + (credits.paid_credits || 0);
        }
    } else {
        // Fallback if something went wrong
        state.credits = 5;
    }
    
    // Get user stats - create if doesn't exist
    let { data: stats } = await supabaseClient
        .from('user_stats')
        .select('*')
        .eq('user_id', state.user.id)
        .single();
    
    if (!stats) {
        const { data: newStats } = await supabaseClient
            .from('user_stats')
            .insert({
                user_id: state.user.id,
                total_questions: 0,
                total_xp: 0,
                streak_days: 0
            })
            .select()
            .single();
        
        stats = newStats;
    }
    
    if (stats) {
        state.stats = stats;
    }
}

        // Load quick questions from database
        async function loadQuickQuestions() {
            const { data: questions } = await supabaseClient
                .from('quick_questions')
                .select('*')
                .eq('is_active', true)
                .order('priority', { ascending: true });
            
            if (questions && questions.length > 0) {
                // Update the quick questions UI
                const container = document.querySelector('.quick-questions');
                if (container) {
                    container.innerHTML = questions.map(q => `
                        <button class="question-pill" onclick="askAI('${q.question_text}')">
                            ${q.icon} ${q.question_text.split(' ').slice(0, 3).join(' ')}
                        </button>
                    `).join('');
                }
            }
        }

        // AI API Integration
        class AIService {
            constructor() {
                this.selectedAPI = 'gemini'; // Change to 'cohere' or 'huggingface' as needed
            }
            
            async generateResponse(query) {
                const contextPrompt = `You are an expert on the Kenyan Constitution. Answer this question about constitutional rights in Kenya. 
                Provide 5 different aspects as JSON array with the following structure for each:
                {
                    "emoji": "relevant emoji",
                    "title": "aspect title",
                    "article": "relevant constitutional article",
                    "content": "detailed explanation",
                    "example": "real-world example"
                }
                
                Question: ${query}
                
                Respond with only the JSON array, no other text.`;
                
                try {
                    switch(this.selectedAPI) {
                        case 'gemini':
                            return await this.generateWithGemini(contextPrompt);
                        case 'cohere':
                            return await this.generateWithCohere(contextPrompt);
                    
                        default:
                            return generateWithCohere(contextPrompt);
                    }
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
            }]
        })
    });
    
    if (!response.ok) {
        console.error('Gemini API error:', response.status, response.statusText);
        throw new Error(`API responded with ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if the response has the expected structure
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Unexpected response structure:', data);
        throw new Error('Invalid response structure');
    }
    
    const text = data.candidates[0].content.parts[0].text;
    
    // Remove any markdown formatting Gemini might add
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
        return JSON.parse(cleanedText);
    } catch (parseError) {
        console.error('Failed to parse response as JSON:', cleanedText);
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
            
     
              
            }
            
          
      
        const aiService = new AIService();

        // Custom Cursor
        document.addEventListener('mousemove', (e) => {
            const cursor = document.querySelector('.cursor');
            const cursorDot = document.querySelector('.cursor-dot');
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
            cursorDot.style.left = e.clientX + 'px';
            cursorDot.style.top = e.clientY + 'px';
        });

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
        }

        function showDashboard() {
            if (!state.user) {
                showAuth();
                return;
            }
            document.getElementById('landing-page').style.display = 'none';
            document.getElementById('chat-section').classList.remove('active');
            document.getElementById('dashboard-section').classList.add('active');
            updateDashboard();
        }

        function updateDashboard() {
            const dashboardHTML = `
                <div class="dashboard">
                    <div class="dashboard-header">
                        <h1 class="welcome-title">Welcome back, ${state.profile?.full_name || state.user.email}!</h1>
                        <p style="color: var(--text-muted);">
                            ${state.credits === 'Unlimited' ? 'Unlimited access active' : `${state.credits} credits remaining`}
                        </p>
                    </div>

                    <div class="dashboard-grid">
                        <div class="dash-card">
                            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📚</div>
                            <div style="font-size: 2rem; font-weight: bold;">${state.stats?.total_questions || 0}</div>
                            <div style="color: var(--text-muted);">Questions Asked</div>
                        </div>
                        <div class="dash-card">
                            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">💳</div>
                            <div style="font-size: 2rem; font-weight: bold;">${state.credits === 'Unlimited' ? '∞' : state.credits}</div>
                            <div style="color: var(--text-muted);">Credits Available</div>
                        </div>
                        <div class="dash-card">
                            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔥</div>
                            <div style="font-size: 2rem; font-weight: bold;">${state.stats?.streak_days || 0}</div>
                            <div style="color: var(--text-muted);">Day Streak</div>
                        </div>
                        <div class="dash-card">
                            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⚡</div>
                            <div style="font-size: 2rem; font-weight: bold;">${state.stats?.total_xp || 0}</div>
                            <div style="color: var(--text-muted);">XP Points</div>
                        </div>
                    </div>

                    <button class="btn btn-primary" onclick="showChat()">Continue Learning</button>
                </div>
            `;
            
            document.getElementById('dashboard-section').innerHTML = dashboardHTML;
        }

        function scrollToSection(sectionId) {
            document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
        }

        function showAuth() {
            document.getElementById('authModal').classList.add('active');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        // Auth Functions with Supabase
        async function handleAuth() {
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;
            
            if (!email || !password) {
                showToast('Please fill in all fields', 'error');
                return;
            }
            
            try {
                // Try to sign in first
                let { data, error } = await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });
                
                // If sign in fails, try to sign up
                if (error) {
                    ({ data, error } = await supabaseClient.auth.signUp({
                        email,
                        password
                    }));
                    
                    if (!error) {
                        showToast('Account created! Please check your email to verify.', 'success');
                    }
                }
                
                if (error) {
                    showToast(error.message, 'error');
                    return;
                }
                
                if (data.user) {
                    state.user = data.user;
                    state.session = data.session;
                    await loadUserData();
                    closeModal('authModal');
                    showToast('Welcome to Jua Katiba!', 'success');
                    showDashboard();
                }
            } catch (error) {
                showToast('Authentication failed. Please try again.', 'error');
            }
        }

        // Payment Functions
        function showPaymentModal() {
            document.getElementById('paymentModal').classList.add('active');
        }

        function selectPlan(plan) {
            state.selectedPlan = plan;
            
            // Update UI to show selected plan
            document.querySelectorAll('#paymentModal .dash-card').forEach(card => {
                card.style.border = '1px solid rgba(255, 255, 255, 0.05)';
            });
            event.currentTarget.style.border = '2px solid var(--accent)';
            
            // Update button text with price
            const prices = {
                'daily': 'KES 50',
                'weekly': 'KES 200',
                'monthly': 'KES 500'
            };
            document.getElementById('payButton').textContent = `Pay ${prices[plan]} with Flutterwave`;
        }

const FLUTTERWAVE_PAYMENT_LINK = 'https://flutterwave.com/pay/ombzqsfdphwa';
    async function processPayment() {
    if (!state.selectedPlan) {
        showToast('Please select a plan', 'error');
        return;
    }
    
    if (state.paymentProcessing) return;
    state.paymentProcessing = true;
    
    const payButton = document.getElementById('payButton');
    payButton.textContent = 'Redirecting to Flutterwave...';
    payButton.disabled = true;
    
    // Store selected plan for when user returns
    localStorage.setItem('pendingPlan', state.selectedPlan);
    
    // Redirect to Flutterwave payment link
    showToast('Redirecting to Flutterwave for secure payment...', 'info');
    
    setTimeout(() => {
        window.location.href = FLUTTERWAVE_PAYMENT_LINK;
    }, 1500);
}

        async function simulatePaymentSuccess() {
            if (state.user) {
                // Update user subscription in database
                const planDays = {
                    'daily': 1,
                    'weekly': 7,
                    'monthly': 30
                };
                
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + planDays[state.selectedPlan]);
                
                // Update user_credits table
                await supabaseClient
                    .from('user_credits')
                    .update({
                        unlimited_until: expiresAt.toISOString()
                    })
                    .eq('user_id', state.user.id);
                
                // Create subscription record
                const { data: plan } = await supabaseClient
                    .from('subscription_plans')
                    .select('id')
                    .eq('name', `${state.selectedPlan.charAt(0).toUpperCase() + state.selectedPlan.slice(1)} Pass`)
                    .single();
                
                if (plan) {
                    await supabaseClient
                        .from('user_subscriptions')
                        .insert({
                            user_id: state.user.id,
                            plan_id: plan.id,
                            status: 'active',
                            expires_at: expiresAt.toISOString(),
                            payment_reference: `DEMO_${Date.now()}`
                        });
                }
            }
            
            state.credits = 'Unlimited';
            localStorage.setItem('juaKatibaCredits', 'Unlimited');
            
            closeModal('paymentModal');
            showToast('Payment successful! You now have unlimited access.', 'success');
            
            state.paymentProcessing = false;
            document.getElementById('payButton').disabled = false;
            document.getElementById('payButton').textContent = 'Pay with IntaSend';
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
    
    // Check credits
    if (state.user) {
        // For authenticated users, check database credits
        const canProceed = await checkAndDeductCredits();
        if (!canProceed) {
            showToast('You have no credits remaining. Please upgrade to continue.', 'warning');
            showPaymentModal();
            return;
        }
    } else {
        // For non-authenticated users, check local credits
        if (state.credits !== undefined && state.credits !== null && state.credits <= 0) {
            showToast('You have used all 5 free questions. Please sign up and upgrade to continue.', 'warning');
            showAuth();
            return;
        }
        state.credits = (state.credits || 5) - 1;
        localStorage.setItem('juaKatibaCredits', state.credits.toString());
    }
    
    // Add user message
    addUserMessage(message);
    input.value = '';
    
    // Create or get conversation
    if (state.user && !state.currentConversationId) {
        const { data: conversation } = await supabaseClient
            .from('conversations')
            .insert({
                user_id: state.user.id,
                title: message.substring(0, 50),
                topic: detectTopic(message)
            })
            .select()
            .single();
        
        if (conversation) {
            state.currentConversationId = conversation.id;
        }
    }
    
    // Save user message to database
    if (state.user && state.currentConversationId) {
        await supabaseClient
            .from('messages')
            .insert({
                conversation_id: state.currentConversationId,
                user_id: state.user.id,
                role: 'user',
                content: message
            });
    }
    
    // Show typing indicator
    showTyping();
    
    try {
        // Get AI response
        const response = await aiService.generateResponse(message);
        
        hideTyping();
        addAIResponse({ cards: response });
        
        // Save AI response to database
        if (state.user && state.currentConversationId) {
            await supabaseClient
                .from('messages')
                .insert({
                    conversation_id: state.currentConversationId,
                    user_id: state.user.id,
                    role: 'assistant',
                    content: 'AI Response',
                    ai_response: { cards: response }
                });
            
            // Update user stats
            await updateUserStats();
        }
        
        // Check if this was the last free question for non-authenticated users
        if (!state.user && state.credits === 0) {
            setTimeout(() => {
                showToast('That was your last free question. Sign up for more!', 'warning');
                showAuth();
            }, 2000);
        }
        
    } catch (error) {
        hideTyping();
        showToast('Failed to get AI response. Please try again.', 'error');
    }
}
async function checkAndDeductCredits() {
    if (!state.user) return false;
    
    // Get current credits from database FIRST
    const { data: credits } = await supabaseClient
        .from('user_credits')
        .select('*')
        .eq('user_id', state.user.id)
        .single();
    
    if (!credits) {
        // If no credits found, create initial credits
        const { data: newCredits } = await supabaseClient
            .from('user_credits')
            .insert({
                user_id: state.user.id,
                free_credits: 5,
                paid_credits: 0
            })
            .select()
            .single();
        
        if (newCredits) {
            state.credits = 5;
            return true; // Allow first use with new credits
        }
        return false;
    }
    
    // Check if unlimited
    if (credits.unlimited_until && new Date(credits.unlimited_until) > new Date()) {
        state.credits = 'Unlimited';
        return true;
    }
    
    // Check if has credits
    const totalCredits = (credits.free_credits || 0) + (credits.paid_credits || 0);
    if (totalCredits <= 0) {
        state.credits = 0;
        return false;
    }
    
    // Deduct credit
    if (credits.paid_credits > 0) {
        await supabaseClient
            .from('user_credits')
            .update({ paid_credits: credits.paid_credits - 1 })
            .eq('user_id', state.user.id);
    } else if (credits.free_credits > 0) {
        await supabaseClient
            .from('user_credits')
            .update({ free_credits: credits.free_credits - 1 })
            .eq('user_id', state.user.id);
    }
    
    // Update local state
    state.credits = totalCredits - 1;
    return true;
}

        async function updateUserStats() {
            if (!state.user) return;
            
            await supabaseClient
                .from('user_stats')
                .update({
                    total_questions: (state.stats?.total_questions || 0) + 1,
                    total_xp: (state.stats?.total_xp || 0) + 10,
                    last_active_date: new Date().toISOString().split('T')[0]
                })
                .eq('user_id', state.user.id);
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
            ${data.cards.map(card => `
                <div class="response-card">
                    <div class="card-header">
                        <div class="card-emoji">${card.emoji}</div>
                        <div>
                            <div class="card-title">${card.title}</div>
                            <div class="card-article">${card.article}</div>
                        </div>
                    </div>
                    <div class="card-content">${card.content}</div>
                    <div class="card-example">
                        <div class="card-example-title">Real Example:</div>
                        ${card.example}
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
        document.addEventListener('DOMContentLoaded', async () => {
            await initializeApp();
            
            // Add initial message
            const messagesDiv = document.getElementById('chatMessages');
            messagesDiv.innerHTML = `
                <div class="message">
                    <div class="message-content">
                        <strong>Karibu! I'm your AI Constitutional Guide.</strong><br><br>
                        Click any quick question above or type your own question below. 
                        I'll provide you with 5 detailed cards explaining different aspects of your rights with real-world examples.<br><br>
                        <span style="color: var(--accent-light);">🎁 You have ${state.credits === 'Unlimited' ? 'unlimited questions' : state.credits + ' free questions'} available.</span>
                    </div>
                </div>
            `;
            
            // Show credits status
            if (!state.user && state.credits < 5) {
                showToast(`You have ${state.credits} free questions remaining`, 'info');
            }
        });
        
        // Listen for auth state changes
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                state.session = session;
                state.user = session.user;
                await loadUserData();
            } else if (event === 'SIGNED_OUT') {
                state.session = null;
                state.user = null;
                state.credits = 5;
                localStorage.setItem('juaKatibaCredits', '5');
            }
        });
  