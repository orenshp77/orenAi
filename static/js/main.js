/**
 * OREN AI Chat - JavaScript
 * Created by Maor Shpiezer
 */

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const welcomeSection = document.getElementById('welcomeSection');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');
const themeBtn = document.getElementById('themeBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const particles = document.getElementById('particles');
const srAnnouncements = document.getElementById('srAnnouncements');

// Announce to screen readers
function announceToSR(message) {
    if (srAnnouncements) {
        srAnnouncements.textContent = message;
        // Clear after announcement
        setTimeout(() => {
            srAnnouncements.textContent = '';
        }, 1000);
    }
}

// State
let sessionId = generateSessionId();
let isProcessing = false;
let currentSlide = 0;
let isLandscapeTheme = true; // Default to landscape
// Removed cooldown timer - no longer needed

// Generate unique session ID
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Initialize background slideshow - changes every 30 seconds
function initSlideshow() {
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;

    // Set first slide as active
    slides[0].classList.add('active');

    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 30000); // 30 seconds
}

// Toggle between purple gradient and landscape themes
function toggleTheme() {
    isLandscapeTheme = !isLandscapeTheme;

    if (isLandscapeTheme) {
        document.body.classList.add('theme-landscape');
        themeBtn.classList.add('theme-active');
        themeBtn.title = 'הצג רקע סגול';
        themeBtn.setAttribute('aria-checked', 'true');
        themeBtn.setAttribute('aria-label', 'רקע נופים פעיל - לחץ להחלפה לרקע סגול');
        // Change icon to moon/landscape
        themeBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
            </svg>
        `;
    } else {
        document.body.classList.remove('theme-landscape');
        themeBtn.classList.remove('theme-active');
        themeBtn.title = 'הצג נופים';
        themeBtn.setAttribute('aria-checked', 'false');
        themeBtn.setAttribute('aria-label', 'רקע סגול פעיל - לחץ להחלפה לרקע נופים');
        // Change icon back to sun
        themeBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
        `;
    }

    // Save preference to localStorage
    localStorage.setItem('orenTheme', isLandscapeTheme ? 'landscape' : 'purple');
}

// Load saved theme preference (default is landscape)
function loadThemePreference() {
    const savedTheme = localStorage.getItem('orenTheme');
    // Default to landscape, only switch if explicitly saved as purple
    if (savedTheme === 'purple') {
        isLandscapeTheme = true; // Will be toggled to false
        toggleTheme();
    } else {
        // Apply landscape theme by default
        document.body.classList.add('theme-landscape');
        themeBtn.classList.add('theme-active');
        themeBtn.title = 'הצג רקע סגול';
        themeBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
            </svg>
        `;
    }
}

// Initialize particles
function initParticles() {
    const particleCount = window.innerWidth < 768 ? 30 : 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        particle.style.width = (2 + Math.random() * 4) + 'px';
        particle.style.height = particle.style.width;
        particles.appendChild(particle);
    }
}

// Auto-resize textarea (ChatGPT style)
function autoResize() {
    userInput.style.height = 'auto';
    const maxHeight = 200;
    const newHeight = Math.min(userInput.scrollHeight, maxHeight);
    userInput.style.height = newHeight + 'px';

    // Show scrollbar only when content exceeds max height
    if (userInput.scrollHeight > maxHeight) {
        userInput.style.overflowY = 'auto';
    } else {
        userInput.style.overflowY = 'hidden';
    }
}

// Update send button state
function updateSendButton() {
    const isDisabled = userInput.value.trim() === '' || isProcessing;
    sendBtn.disabled = isDisabled;
    sendBtn.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
}

// Hide welcome section
function hideWelcome() {
    const welcome = document.getElementById('welcomeSection');
    if (welcome) {
        welcome.style.opacity = '0';
        welcome.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            welcome.style.display = 'none';
        }, 300);
    }
}

// Show welcome section
function showWelcome() {
    const welcome = document.getElementById('welcomeSection');
    if (welcome) {
        welcome.style.display = 'flex';
        setTimeout(() => {
            welcome.style.opacity = '1';
            welcome.style.transform = 'translateY(0)';
        }, 10);
    }
}

// Add message to chat
function addMessage(content, isUser = false, isTyping = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
    messageDiv.setAttribute('role', 'article');
    messageDiv.setAttribute('aria-label', isUser ? 'הודעה שלך' : 'תשובת אורן');

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    if (isUser) {
        avatar.textContent = '\uD83D\uDC64';
    } else {
        avatar.innerHTML = `
            <div class="mini-oren-logo">
                <div class="mini-orbit-ring">
                    <div class="mini-particle"></div>
                    <div class="mini-particle"></div>
                    <div class="mini-particle"></div>
                </div>
                <span class="mini-center">O</span>
            </div>
        `;
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (isTyping) {
        contentDiv.innerHTML = `
            <div class="typing-indicator" role="status" aria-label="אורן מקליד">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        messageDiv.id = 'typingMessage';
        messageDiv.setAttribute('aria-busy', 'true');
    } else {
        contentDiv.innerHTML = formatMessage(content);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // For user messages - scroll to bottom, for AI responses - scroll to message top
    if (isUser || isTyping) {
        scrollToBottom();
    } else {
        // AI response - scroll to show the beginning of the message
        scrollToMessageTop(messageDiv);
    }

    return messageDiv;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingMessage = document.getElementById('typingMessage');
    if (typingMessage) {
        typingMessage.remove();
    }
}

// Format message with markdown-like support
function formatMessage(text) {
    if (!text) return '<p></p>';

    // Escape HTML
    text = text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');

    // Code blocks
    text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');

    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Line breaks
    text = text.replace(/\n/g, '<br>');

    // Wrap in paragraph
    return `<p>${text}</p>`;
}

// Scroll chat to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add quota error message (payment plan required)
function addQuotaErrorMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    messageDiv.setAttribute('role', 'article');
    messageDiv.setAttribute('aria-label', 'תשובת אורן');

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.innerHTML = `
        <div class="mini-oren-logo">
            <div class="mini-orbit-ring">
                <div class="mini-particle"></div>
                <div class="mini-particle"></div>
                <div class="mini-particle"></div>
            </div>
            <span class="mini-center">O</span>
        </div>
    `;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    contentDiv.innerHTML = `<p>כדי להמשיך לתת מענה לשאלות, תשנה למסלול תשלום...!</p>`;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    scrollToMessageTop(messageDiv);
}

// Scroll to show both question and answer (for AI responses)
function scrollToMessageTop(messageElement) {
    if (messageElement) {
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
            // Find the previous message (user's question)
            const previousMessage = messageElement.previousElementSibling;

            // If there's a previous message (the question), scroll to it
            // This way both question and answer will be visible
            if (previousMessage && previousMessage.classList.contains('message')) {
                previousMessage.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            } else {
                // Fallback to scrolling to the AI message itself
                messageElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 100);
    }
}

// Send message - using non-streaming endpoint for reliability
async function sendMessage() {
    const message = userInput.value.trim();

    if (!message || isProcessing) return;

    // Hide welcome and add user message
    hideWelcome();
    addMessage(message, true);

    // Clear input
    userInput.value = '';
    autoResize();
    updateSendButton();

    // Show typing indicator
    isProcessing = true;
    addMessage('', false, true);
    announceToSR('אורן מעבד את הבקשה שלך');

    try {
        // Use regular endpoint (more reliable)
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                session_id: sessionId
            })
        });

        const data = await response.json();

        // Remove typing indicator
        removeTypingIndicator();

        if (data.status === 'success' && data.response) {
            addMessage(data.response, false);
            announceToSR('אורן ענה לשאלה שלך');
        } else if (data.error) {
            // Check if it's a quota/rate limit error
            if (data.error === 'quota_exceeded') {
                addQuotaErrorMessage();
            } else {
                // Other errors - show generic message
                console.error('API Error:', data.error);
                addMessage('אופס! משהו השתבש. נסה שוב בבקשה.', false);
            }
            announceToSR('אירעה שגיאה');
        } else {
            addMessage('מצטער, לא קיבלתי תשובה. נסה שוב.', false);
            announceToSR('לא התקבלה תשובה');
        }

    } catch (error) {
        console.error('Error:', error);
        removeTypingIndicator();
        addMessage('מצטער, אירעה שגיאה בחיבור. אנא נסה שוב.', false);
        announceToSR('אירעה שגיאה בחיבור');
    } finally {
        isProcessing = false;
        updateSendButton();
    }
}

// New chat
async function newChat() {
    // Clear UI
    chatMessages.innerHTML = '';

    // Show welcome
    const welcomeHTML = `
        <div class="welcome-section" id="welcomeSection" role="region" aria-labelledby="welcomeTitle">
            <div class="oren-logo-container" aria-hidden="true">
                <div class="oren-orbit-ring">
                    <div class="oren-particle"></div>
                    <div class="oren-particle"></div>
                    <div class="oren-particle"></div>
                </div>
                <div class="oren-center">O</div>
            </div>
            <h2 class="welcome-title" id="welcomeTitle">
                <span class="greeting-text">נעים מאוד!</span>
                <span class="name-text">קוראים לי <span class="highlight">אורן שפייזר</span></span>
            </h2>
            <p class="welcome-subtitle">איך אוכל לעזור לך היום?</p>
        </div>
    `;

    chatMessages.innerHTML = welcomeHTML;
    announceToSR('שיחה חדשה נפתחה');

    // Clear server-side session
    try {
        await fetch('/api/clear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ session_id: sessionId })
        });
    } catch (error) {
        console.error('Error clearing session:', error);
    }

    // Generate new session ID
    sessionId = generateSessionId();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize slideshow
    initSlideshow();

    // Initialize particles
    initParticles();

    // Load saved theme preference
    loadThemePreference();

    // Input events
    userInput.addEventListener('input', () => {
        autoResize();
        updateSendButton();
    });

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Button events
    sendBtn.addEventListener('click', sendMessage);
    newChatBtn.addEventListener('click', newChat);
    themeBtn.addEventListener('click', toggleTheme);

    // Focus input
    userInput.focus();
});

// Add some visual effects on scroll
let lastScrollTop = 0;
chatMessages.addEventListener('scroll', () => {
    const scrollTop = chatMessages.scrollTop;
    const header = document.querySelector('.header');

    if (scrollTop > lastScrollTop && scrollTop > 50) {
        header.style.transform = 'translateY(-100%)';
    } else {
        header.style.transform = 'translateY(0)';
    }

    lastScrollTop = scrollTop;
});

// Visibility change - reconnect if needed
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Could implement reconnection logic here
    }
});

// Handle window resize for particles
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        particles.innerHTML = '';
        initParticles();
    }, 250);
});

console.log('OREN AI Chat initialized successfully!');
