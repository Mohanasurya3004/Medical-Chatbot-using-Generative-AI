// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = 'en-US';

let isListening = false;
let currentChatId = Date.now();
let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
let isSidebarCollapsed = false;

// Speech Recognition Handlers
recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    document.getElementById('user-input').value = transcript;
    toggleVoiceInput();
    sendMessage();
};

recognition.onerror = function(event) {
    console.error('Speech recognition error:', event.error);
    toggleVoiceInput();
};

// Voice Input Toggle
function toggleVoiceInput() {
    const voiceButton = document.getElementById('voice-input-btn');
    if (!isListening) {
        recognition.start();
        isListening = true;
        voiceButton.classList.add('listening');
        voiceButton.querySelector('i').classList.remove('fa-microphone');
        voiceButton.querySelector('i').classList.add('fa-stop');
    } else {
        recognition.stop();
        isListening = false;
        voiceButton.classList.remove('listening');
        voiceButton.querySelector('i').classList.remove('fa-stop');
        voiceButton.querySelector('i').classList.add('fa-microphone');
    }
}

// Text-to-Speech
const synth = window.speechSynthesis;

function speak(text) {
    if (synth.speaking) {
        synth.cancel();
        return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    synth.speak(utterance);
}

// Scroll Handling
function scrollToBottom(immediate = false) {
    const chatBox = document.querySelector('.chat-box');
    if (!chatBox) return;

    try {
        chatBox.scrollTo({
            top: chatBox.scrollHeight,
            behavior: immediate ? 'auto' : 'smooth'
        });
    } catch (e) {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Message Handling
function appendMessage(type, content, withSpeakButton = false) {
    const messageDiv = $(`
        <div class="chat-message ${type}">
            <div class="message">
                ${content}
                ${withSpeakButton ? `
                    <button class="speak-button" onclick="speak(this.parentElement.textContent)">
                        <i class="fas fa-volume-up"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `);

    $('#chat-box').append(messageDiv);
    requestAnimationFrame(() => scrollToBottom());
    return messageDiv;
}

function sendMessage() {
    const userInput = $('#user-input').val().trim();
    if (!userInput) return false;

    appendMessage('user', userInput);
    $('#user-input').val('');

    const loadingDiv = appendMessage('bot', '<div class="loading">Thinking...</div>');

    $.ajax({
        url: '/get',
        type: 'POST',
        data: {msg: userInput},
        success: function(response) {
            loadingDiv.remove();
            appendMessage('bot', response, true);
            saveCurrentChat();
        }
    });

    return false;
}

// Chat History Management
function updateChatHistory() {
    const historyContainer = document.getElementById('chat-history');
    historyContainer.innerHTML = '';
    
    chatHistory.forEach((chat, index) => {
        const chatElement = document.createElement('div');
        chatElement.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
        chatElement.onclick = () => loadChat(chat.id);
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-comment';
        
        const title = document.createElement('span');
        title.textContent = chat.title || 'New Chat';
        
        chatElement.appendChild(icon);
        chatElement.appendChild(title);
        
        historyContainer.appendChild(chatElement);
    });
}

function saveCurrentChat() {
    const chatBox = document.getElementById('chat-box');
    const messages = chatBox.innerHTML;
    const firstUserMessage = chatBox.querySelector('.user .message');
    const title = firstUserMessage ? 
        firstUserMessage.textContent.slice(0, 30) + '...' : 
        'New Chat';
    
    const existingChatIndex = chatHistory.findIndex(chat => chat.id === currentChatId);
    const chatData = {
        id: currentChatId,
        title: title,
        messages: messages,
        timestamp: Date.now()
    };
    
    if (existingChatIndex !== -1) {
        chatHistory[existingChatIndex] = chatData;
    } else {
        chatHistory.unshift(chatData);
    }
    
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    updateChatHistory();
}

function loadChat(chatId) {
    saveCurrentChat();
    currentChatId = chatId;
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
        const chatBox = document.getElementById('chat-box');
        chatBox.innerHTML = chat.messages;
        scrollToBottom(true);
    }
    updateChatHistory();
}

function startNewChat() {
    saveCurrentChat();
    currentChatId = Date.now();
    document.getElementById('chat-box').innerHTML = '';
    appendMessage('bot', "Hello! I'm your medical assistant. How can I help you today?", true);
    updateChatHistory();
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all chat history?')) {
        chatHistory = [];
        localStorage.removeItem('chatHistory');
        startNewChat();
    }
}

// Theme Toggle
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle.querySelector('i');
    
    if (body.classList.contains('light-theme')) {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('theme', 'light');
    }
}

// Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    isSidebarCollapsed = !isSidebarCollapsed;
    
    if (isSidebarCollapsed) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
    } else {
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('expanded');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set initial theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.classList.add(`${savedTheme}-theme`);
    
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle.querySelector('i');
    icon.classList.add(savedTheme === 'light' ? 'fa-moon' : 'fa-sun');

    // Initialize chat history
    updateChatHistory();

    // Set up scroll observer
    const chatBox = document.querySelector('.chat-box');
    if (chatBox) {
        const observer = new MutationObserver(() => scrollToBottom());
        observer.observe(chatBox, { childList: true, subtree: true });
    }

    // Initial scroll
    scrollToBottom(true);
});

