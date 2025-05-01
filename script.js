const GROQ_API_KEY = "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"; // 🔐 Don't expose in production!
const MISTRAL_API_KEY = "1GuJlqIezdFqsHgaECFWttUVcaykkDag"; // 🔐 Don't expose in production!
const OLLAMA_BASE_URL = "http://localhost:11434"; // Using local Ollama instance

// Track conversation history for both LLMs
let conversationHistory = [];
let currentModel = "groq-llama3-70b"; // Default model

// Update theme variables at the top of the file
let themeMode = localStorage.getItem('theme') || 'light';
// Updated theme options array with new themes
const themeOptions = ['light', 'dark', 'blue', 'purple', 'green', 'amber', 'crimson', 'midnight', 'sunset', 'forest']; 
let currentThemeIndex = themeOptions.indexOf(themeMode);
if (currentThemeIndex === -1) currentThemeIndex = 0; // Default to light if invalid

const suggestionPrompts = [
  "What can you help me with?",
  "How do different AI models compare?",
  "Tell me a fun fact about AI",
  "Explain how large language models work",
  "Write a short poem about technology",
  "What's the weather like today?",
  "Translate 'hello' to French",
  "Generate a simple JavaScript function"
];

// Add this variable to track if user is manually scrolling
let userIsScrolling = false;
let lastScrollTop = 0;

// Load conversation from localStorage
function loadConversationFromStorage() {
  try {
    const savedModel = localStorage.getItem('currentModel');
    const savedHistory = localStorage.getItem('conversationHistory');
    
    if (savedModel) {
      currentModel = savedModel;
    }
    
    if (savedHistory) {
      conversationHistory = JSON.parse(savedHistory);
      return true;
    }
  } catch (error) {
    console.error("Error loading from localStorage:", error);
  }
  return false;
}

// Save conversation to localStorage
function saveConversationToStorage() {
  try {
    localStorage.setItem('currentModel', currentModel);
    localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

// Fix the DOM structure issues in the DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function() {
  // Restructure the HTML layout
  const chatContainer = document.querySelector('.chat-container');
  
  // Create app header with title and controls - update the theme button
  const appHeader = document.createElement('div');
  appHeader.className = 'app-header';
  appHeader.innerHTML = `
    <div class="app-title">
      <span class="app-title-icon">🧠</span>
      AI Assistant
    </div>
    <div class="app-controls">
      <button class="btn-theme" title="Change theme (Light → Dark → Blue → Purple → Green)">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>
        </svg>
      </button>
      <button class="btn-clear">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5Zm-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5ZM4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Zm6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528ZM8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5Z"/>
        </svg>
        <span class="btn-text">Clear</span>
      </button>
    </div>
  `;
  
  // Create model selector container
  const modelSelectorContainer = document.createElement('div');
  modelSelectorContainer.className = 'model-selector-container';
  modelSelectorContainer.innerHTML = `
    <div class="model-selector">
      <label for="ai-model" class="model-label">Model:</label>
      <select id="ai-model" class="ai-model-dropdown">
        <option value="groq-llama3-70b">Groq (llama3-70b)</option>
        <option value="mistral-medium">Mistral (Medium)</option>
        <option value="ollama-deepseek">Ollama (deepseek-r1:1.5b)</option>
        <option value="ollama-llama3">Ollama (llama3)</option>
      </select>
    </div>
    <div class="model-info">
      <div id="model-icon" class="model-icon">🧠</div>
      <div id="model-status" class="model-status">Ready</div>
    </div>
  `;
  
  // Create chat area with chat box and input
  const chatArea = document.createElement('div');
  chatArea.className = 'chat-area';
  
  // Create or get chat box
  let chatBox = document.getElementById('chat-box');
  if (!chatBox) {
    chatBox = document.createElement('div');
    chatBox.id = 'chat-box';
  }
  
  // Create or get input area
  let inputArea = document.querySelector('.input-area');
  if (!inputArea) {
    inputArea = document.createElement('div');
    inputArea.className = 'input-area';
  }
  
  // Update input area with new design for a more professional look
  inputArea.innerHTML = `
    <div class="chat-input-container">
      <input type="text" id="user-input" placeholder="Send a message..." onkeypress="if(event.key === 'Enter') sendMessage()">
    </div>
    <button onclick="sendMessage()">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"/>
      </svg>
    </button>
  `;
  
  // Empty and rebuild the chat container
  chatContainer.innerHTML = '';
  chatContainer.appendChild(appHeader);
  chatContainer.appendChild(modelSelectorContainer);
  chatContainer.appendChild(chatArea);
  
  // Build chat area structure
  chatArea.appendChild(chatBox);
  chatArea.appendChild(inputArea);
  
  // Apply theme
  document.body.setAttribute('data-theme', themeMode);
  
  // Add event listeners
  document.querySelector('.btn-theme').addEventListener('click', toggleTheme);
  document.querySelector('.btn-clear').addEventListener('click', clearConversation);
  
  // Add scroll event listener to chatbox
  if (chatBox) {
    chatBox.addEventListener('scroll', function() {
      // If user scrolls up away from bottom, mark as manually scrolling
      if (chatBox.scrollTop < chatBox.scrollHeight - chatBox.clientHeight - 100) {
        userIsScrolling = true;
      } else {
        // If user scrolls back to bottom, resume auto-scroll
        userIsScrolling = false;
      }
      lastScrollTop = chatBox.scrollTop;
    });
  }
  
  // Load saved conversation if available
  const hasHistory = loadConversationFromStorage();
  
  // Add welcome message or restore conversation
  if (hasHistory) {
    restoreConversationUI();
  } else {
    // Fix the corrupted welcome message - Simplify for more professional look
    chatBox.innerHTML = `
      <div class="system-message">
        <div class="message-content">
          Welcome to the AI Assistant. Switch between different AI models using the dropdown above.
        </div>
      </div>
    `;
  }
  
  // Set the dropdown to match the saved model
  const modelSelector = document.getElementById('ai-model');
  if (modelSelector.querySelector(`option[value="${currentModel}"]`)) {
    modelSelector.value = currentModel;
  }
  
  // Update status when model changes
  modelSelector.addEventListener('change', function() {
    const newModel = this.value;
    currentModel = newModel;
    
    // Update the model status display when model changes
    updateModelStatus(newModel);
    
    // Clear conversation history when switching models
    conversationHistory = [];
    saveConversationToStorage();
    
    if (newModel.startsWith('ollama')) {
      const modelName = newModel === 'ollama-deepseek' ? 'deepseek-r1:1.5b' : 'llama3';
      checkOllamaModelAvailability(modelName)
        .then(available => {
          if (!available) {
            chatBox.innerHTML += `<div class="system-message warning"><div class="message-content">
              ⚠️ Ollama model might not be available. If you encounter errors, run this command in your terminal:
              <pre>ollama pull ${modelName}</pre>
            </div></div>`;
            safeScrollToBottom(chatBox);
          }
        });
    }
    
    // Add a system message about switching models
    let modelDisplayName = '';
    if (newModel.includes('groq')) {
      modelDisplayName = 'Groq (llama3-70b)';
    } else if (newModel.includes('mistral')) {
      modelDisplayName = 'Mistral (Medium)';
    } else if (newModel.includes('deepseek')) {
      modelDisplayName = 'Ollama (deepseek-r1:1.5b)';
    } else {
      modelDisplayName = 'Ollama (llama3)';
    }
    
    chatBox.innerHTML += `<div class="system-message"><div class="message-content">Switched to ${modelDisplayName} model. Conversation has been reset.</div></div>`;
    safeScrollToBottom(chatBox);
    console.log("Model switched to:", newModel);
  });
  
  // Initial status update
  updateModelStatus(modelSelector.value);
  currentModel = modelSelector.value;

  // After setting up all components
  if (window.innerWidth <= 600) {
    document.body.classList.add('mobile-view');
  }
  
  // Add resize listener to detect mobile/desktop transitions
  window.addEventListener('resize', function() {
    if (window.innerWidth <= 600) {
      document.body.classList.add('mobile-view');
    } else {
      document.body.classList.remove('mobile-view');
    }
  });
  
  // Mobile navigation toggle handler
  const navToggle = document.getElementById('mobile-nav-toggle');
  if (navToggle) {
    navToggle.addEventListener('click', function() {
      document.body.classList.toggle('nav-hidden');
      this.textContent = document.body.classList.contains('nav-hidden') ? '↓' : '↑';
    });
  }

  // Set focus on the input field when page loads
  setTimeout(() => {
    const inputField = document.getElementById("user-input");
    if (inputField) inputField.focus();
  }, 500); // Small delay to ensure UI is fully loaded
});

// Fix the clearConversation function definition
function clearConversation() {
  const chatBox = document.getElementById('chat-box');
  // Reset conversation history
  conversationHistory = [];
  // Clear localStorage
  localStorage.removeItem('conversationHistory');
  // Keep current model selection but clear its history
  localStorage.setItem('currentModel', currentModel);
  // Clear chat box but keep welcome message
  chatBox.innerHTML = `
    <div class="system-message">
      <div class="message-content">
        Conversation cleared. Ask me anything!
      </div>
    </div>
  `;

  // Set focus back to input
  setTimeout(() => {
    const inputField = document.getElementById("user-input");
    if (inputField) inputField.focus();
  }, 100);
}

// Update the toggleTheme function to handle the new themes
function toggleTheme() {
  currentThemeIndex = (currentThemeIndex + 1) % themeOptions.length;
  themeMode = themeOptions[currentThemeIndex];
  document.body.setAttribute('data-theme', themeMode);
  localStorage.setItem('theme', themeMode);
  
  // Add animation to theme change
  document.body.classList.add('theme-transition');
  setTimeout(() => {
    document.body.classList.remove('theme-transition');
  }, 1000);
  
  // Update theme button icon based on current theme
  const themeButtonIcon = document.querySelector('.btn-theme svg');
  if (themeButtonIcon) {
    // Update SVG icon based on theme
    switch(themeMode) {
      case 'dark':
        themeButtonIcon.innerHTML = `<path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>`;
        break;
      case 'blue':
        themeButtonIcon.innerHTML = `<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>`;
        break;
      case 'purple':
        themeButtonIcon.innerHTML = `<path d="M8 0c-.69 0-1.843.265-2.928.56-1.11.3-2.229.655-2.887.87a1.54 1.54 0 0 0-1.044 1.262c-.596 4.477.787 7.795 2.465 9.99a11.777 11.777 0 0 0 2.517 2.453c.386.273.744.482 1.048.625.28.132.581.24.829.24s.548-.108.829-.24a7.159 7.159 0 0 0 1.048-.625 11.775 11.775 0 0 0 2.517-2.453c1.678-2.195 3.061-5.513 2.465-9.99a1.541 1.541 0 0 0-1.044-1.263 62.467 62.467 0 0 0-2.887-.87C9.843.266 8.69 0 8 0zm0 5a1.5 1.5 0 0 1 .5 2.915l.385 1.99a.5.5 0 0 1-.491.595h-.788a.5.5 0 0 1-.49-.595l.384-1.99A1.5 1.5 0 0 1 8 5z"/>`;
        break;
      case 'green':
        themeButtonIcon.innerHTML = `<path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 13V2a6 6 0 1 1 0 12z"/>`;
        break;
      case 'amber':
        themeButtonIcon.innerHTML = `<path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z"/>`;
        break;
      case 'crimson':
        themeButtonIcon.innerHTML = `<path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/>`;
        break;
      case 'midnight':
        themeButtonIcon.innerHTML = `<path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>`;
        break;
      case 'sunset':
        themeButtonIcon.innerHTML = `<path d="M8 3a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 3zm8 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zm-13.5.5a.5.5 0 0 0 0-1h-2a.5.5 0 0 0 0 1h2zm11.157-6.157a.5.5 0 0 1 0 .707l-1.414 1.414a.5.5 0 1 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm-9.9 2.121a.5.5 0 0 0 .707-.707L3.05 5.343a.5.5 0 1 0-.707.707l1.414 1.414zM8 7a4 4 0 0 0-4 4 .5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5 4 4 0 0 0-4-4z"/>`;
        break;
      case 'forest':
        themeButtonIcon.innerHTML = `<path d="M8 16a.5.5 0 0 1-.5-.5V3.707L5.354 5.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 3.707V15.5a.5.5 0 0 1-.5.5z"/><path d="M11.5 2.707l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 0 0 .708.708L8 1.707V5.5a.5.5 0 0 0 1 0V1.707l2.646 2.647a.5.5 0 0 0 .708-.708z"/>`;
        break;
      default: // light theme or any other
        themeButtonIcon.innerHTML = `<path d="M12 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>`;
    }
  }
}

// Animate text with typing effect
function animateText() {
  const elements = document.querySelectorAll('.animated-text');
  elements.forEach(element => {
    // Store original content and clear it
    const originalContent = element.innerHTML;
    const textOnly = element.textContent;
    element.innerHTML = '';
    let i = 0;
    // Don't animate if it's a restored conversation
    if (loadConversationFromStorage()) return;
    const typeWriter = () => {
      if (i < textOnly.length) {
        element.innerHTML += textOnly.charAt(i);
        i++;
        setTimeout(typeWriter, 20);
      } else {
        // When typing is done, replace with original content to restore HTML structure
        element.innerHTML = originalContent;
      }
    };
    typeWriter();
  });
}

// Restore the conversation UI from saved history
function restoreConversationUI() {
  const chatBox = document.getElementById('chat-box');
  // Clear chat box
  chatBox.innerHTML = `
    <div class="system-message">
      <div class="message-content">
        Welcome back! Your conversation has been restored.
      </div>
    </div>
  `;
  // Recreate all messages from history
  for (let i = 0; i < conversationHistory.length; i++) {
    const message = conversationHistory[i];
    if (message.role === 'user') {
      chatBox.innerHTML += `
        <div class="message user-message">
          <span class="message-avatar">👤</span>
          <div class="message-content">${message.content}</div>
        </div>
      `;
    } else if (message.role === 'assistant') {
      let modelBadgeClass = 'groq';
      let modelDisplayName = 'Groq';
      if (currentModel.startsWith('ollama')) {
        modelBadgeClass = 'ollama';
        modelDisplayName = currentModel.includes('deepseek') ? 'Deepseek' : 'Llama3';
      } else if (currentModel.startsWith('mistral')) {
        modelBadgeClass = 'mistral';
        modelDisplayName = 'Mistral';
      }
      // Render AI response
      chatBox.innerHTML += `
        <div class="message ai-message">
          <span class="message-avatar">🤖</span>
          <div class="message-content">${formatResponse(message.content)}</div>
          <span class="model-badge ${modelBadgeClass}">${modelDisplayName}</span>
        </div>
      `;
    }
  }
  // Safe scrolling
  safeScrollToBottom(chatBox);

  // Focus input field
  setTimeout(() => {
    const inputField = document.getElementById("user-input");
    if (inputField) inputField.focus();
  }, 100);
}

// Update the model status display
function updateModelStatus(modelValue) {
  const statusElement = document.getElementById('model-status');
  const iconElement = document.getElementById('model-icon');
  
  if (modelValue.startsWith('groq')) {
    statusElement.textContent = 'Connected to Cloud';
    statusElement.className = 'model-status online';
    iconElement.textContent = '☁️';
  } else if (modelValue.startsWith('mistral')) {
    statusElement.textContent = 'Connected to Cloud';
    statusElement.className = 'model-status online mistral';
    iconElement.textContent = '☁️';
  } else if (modelValue.startsWith('ollama')) {
    statusElement.textContent = 'Running Locally';
    statusElement.className = 'model-status local';
    iconElement.textContent = '💻';
  }
}

// Check if the Ollama model is available
async function checkOllamaModelAvailability(modelName = 'deepseek-r1:1.5b') {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) return false;
    const data = await response.json();
    const models = data.models || [];
    // Check if the requested model exists
    return models.some(model => model.name && (
      model.name === modelName || 
      model.name.includes(modelName.split(':')[0]) // Check for model family
    ));
  } catch (error) {
    console.error("Failed to check Ollama models:", error);
    return false;
  }
}

// Function to call Groq API
async function callGroqAPI() {
  console.log("Calling Groq API with history:", conversationHistory);
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: conversationHistory
    })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Error calling Groq API");
  }
  return data.choices?.[0]?.message?.content || "No response 😕";
}

// Function to call Mistral API
async function callMistralAPI() {
  console.log("Calling Mistral API with history:", conversationHistory);
  
  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: "mistral-medium",
        messages: conversationHistory,
        temperature: 0.7
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Mistral API error (${response.status})`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response from Mistral 😕";
  } catch (error) {
    if (error.message.includes("Failed to fetch")) {
      throw new Error("Cannot connect to Mistral API. Please check your internet connection.");
    }
    throw error;
  }
}

// Function to call Ollama API
async function callOllamaAPI() {
  console.log("Calling Ollama API with history:", conversationHistory);
  
  try {
    // Set default model based on selection
    let ollamaModel = currentModel === 'ollama-deepseek' ? "deepseek-coder" : "llama3"; // Try different model names
    
    try {
      const tagsResponse = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      if (tagsResponse.ok) {
        const tagsData = tagsResponse.json();
        const availableModels = tagsData.models || [];
        console.log("Available Ollama models:", availableModels.map(m => m.name));
        
        // First try for exact deepseek model matches
        if (currentModel === 'ollama-deepseek') {
          const deepseekModels = availableModels
            .filter(model => model.name && (
              model.name.includes('deepseek') || 
              model.name.includes('deep-seeker') ||
              model.name.includes('deep')
            ))
            .map(model => model.name);
          console.log("Available deepseek models:", deepseekModels);
          if (deepseekModels.length > 0) {
            // Prioritize certain variants
            const preferredModels = [
              "deepseek-coder",
              "deepseek",
              "deepseek-r1:1.5b",
              "deepseek-r1",
              "deepseek-llm"
            ];
            for (const preferred of preferredModels) {
              const match = deepseekModels.find(name => name.includes(preferred));
              if (match) {
                ollamaModel = match;
                break;
              }
            }
            // If no preferred match found, use the first available deepseek model
            if (!preferredModels.some(p => ollamaModel.includes(p))) {
              ollamaModel = deepseekModels[0];
            }
          }
        }
        // Handle llama3 model selection
        else if (currentModel === 'ollama-llama3') {
          const llamaModels = availableModels
            .filter(model => model.name && model.name.includes('llama3'))
            .map(model => model.name);
            
          if (llamaModels.length > 0) {
            ollamaModel = llamaModels[0];
          }
        }
        // Fallback to any available model if the specified one isn't found
        if (!availableModels.some(model => model.name === ollamaModel || model.name.includes(ollamaModel.split(':')[0]))) {
          if (availableModels.length > 0) {
            // Prefer smaller models if available (likely faster)
            const smallModels = availableModels.filter(model => 
              model.name.includes('small') || 
              model.name.includes('tiny') || 
              model.name.includes('7b') ||
              model.name.includes('1.5b')
            );
            ollamaModel = smallModels.length > 0 ? smallModels[0].name : availableModels[0].name;
            console.log(`Preferred model not found, using ${ollamaModel} instead`);
          }
        }
      }
    } catch (error) {
      console.warn("Failed to get available Ollama models:", error);
      // Continue with default model
    }
    console.log(`Using Ollama model: ${ollamaModel}`);
    // Adjust the API request for better compatibility
    let apiEndpoint = `${OLLAMA_BASE_URL}/api/chat`;
    let payload = {
      model: ollamaModel,
      messages: conversationHistory,
      stream: false
    };
    
    // For older versions of Ollama or certain models that might not support the chat API
    let fallbackToGeneration = false;
    
    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Ollama API error (${response.status}):`, errorText);
        
        // Handle specific errors
        if (errorText.includes("not found") || errorText.includes("try pulling it first")) {
          throw new Error(`Ollama model "${ollamaModel}" not found. Please run: ollama pull ${ollamaModel}`);
        }
        
        // Try fallback to generation API if chat fails
        if (response.status === 404 || errorText.includes("not implemented")) {
          console.log("Falling back to generation API");
          fallbackToGeneration = true;
        } else {
          throw new Error(`Ollama API error (${response.status}): ${errorText}`);
        }
      } else {
        const data = await response.json();
        let content = data.message?.content || "No response from Ollama 😕";
        // More detailed debugging for Deepseek
        if (currentModel === 'ollama-deepseek') {
          console.log("Raw Deepseek response:", JSON.stringify(content));
          // Check first few character codes
          console.log("First characters (raw):");
          for (let i = 0; i < Math.min(10, content.length); i++) {
            console.log(`Char at ${i}: ${content.charCodeAt(i)} (${content[i]})`);
          }
        }
        // Clean up any prefixes like "Assistant:" that might appear in responses
        content = cleanOllamaResponse(content);
        
        // For debugging: log the cleaned response
        if (currentModel === 'ollama-deepseek') { 
          console.log("Cleaned Deepseek response:", JSON.stringify(content));
        }
         
        return content;
      }
    } catch (error) {
      if (error.message.includes("Failed to fetch")) {
        throw new Error("Cannot connect to Ollama. Is it running locally? Start it with 'ollama serve'");
      }
      if (!fallbackToGeneration) {
        throw error;
      }
    }
    
    // Fallback to the /api/generate endpoint if /api/chat fails
    if (fallbackToGeneration) {
      console.log("Using fallback generation API");
      
      // Format the conversation history as a prompt
      const prompt = conversationHistory.map(msg => {
        if (msg.role === "user") {
          return `User: ${msg.content}\n`;
        } else if (msg.role === "assistant") {
          return `Assistant: ${msg.content}\n`;
        }
        return "";
      }).join("") + "Assistant:";
      const generateResponse = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: prompt,
          stream: false
        })
      });
      
      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        throw new Error(`Ollama generate API error (${generateResponse.status}): ${errorText}`);
      }
      
      const generateData = await generateResponse.json();
      let content = generateData.response || "No response from Ollama generation API 😕";
      // Clean up any prefixes in the generation response
      content = cleanOllamaResponse(content);
      
      console.log("Cleaned fallback response:", content); // Debug log to check the cleaning
      return content;
    }
  } catch (error) {
    console.error("Ollama API error:", error);
    throw error;
  }
}

// Safe scrolling function that respects user's manual scrolling
function safeScrollToBottom(element) {
  if (!userIsScrolling) {
    element.scrollTop = element.scrollHeight;
  }
}

// Format response with code blocks and markdown-like syntax
function formatResponse(text) {
  if (!text) return "";
  // First trim any leading/trailing whitespace - be aggressive about it
  text = text.trim();
  if (currentModel === 'ollama-deepseek') {
    // Extra processing for Deepseek responses
    // Remove any non-visible characters at the start
    while (text.length > 0 && (text.charCodeAt(0) < 32 || text.charCodeAt(0) === 160)) {
      text = text.substring(1);
    }
  }
  // Fix multi-line code block detection to better handle extra spaces
  text = text.replace(/```([a-z]*)\s*\n([\s\S]*?)```/g, function(match, lang, code) {
    return `<pre class="code-block ${lang}"><code>${escapeHtml(code.trim())}</code></pre>`;
  });
  // Handle code blocks without language specification
  text = text.replace(/```\s*([\s\S]*?)```/g, function(match, code) {
    return `<pre class="code-block"><code>${escapeHtml(code.trim())}</code></pre>`;
  });
  // Replace inline code with styled HTML
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Replace line breaks with <br> but avoid adding breaks inside pre tags
  const segments = text.split(/<\/?pre[^>]*>/);
  for (let i = 0; i < segments.length; i += 2) {
    segments[i] = segments[i].replace(/\n/g, '<br>');
  }
  text = segments.join('');
  return text;
}

// Helper function to escape HTML in code blocks
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Helper function to clean Ollama responses
function cleanOllamaResponse(text) {
  if (!text) return "";
  // Remove common prefixes that might appear in Ollama responses
  const prefixesToRemove = [
    "Assistant:", "Assistant: ", 
    "AI:", "AI: ", 
    "Response:", "Response: ",
    "Ollama:", "Ollama: "
  ];
  let cleanedText = text;
  // Check for and remove prefixes at the beginning of the response
  for (const prefix of prefixesToRemove) {
    if (cleanedText.trim().startsWith(prefix)) {
      cleanedText = cleanedText.trim().substring(prefix.length).trim();
      console.log(`Removed prefix "${prefix}" from Ollama response`);
      break; // Only remove one prefix
    }
  }
  // More aggressive cleanup specifically for Deepseek models
  if (currentModel === 'ollama-deepseek') {
    // Super aggressive trimming to completely eliminate leading spaces and newlines
    cleanedText = cleanedText.trimStart();
    
    // Remove large blocks of spaces/newlines at beginning
    const match = cleanedText.match(/^[\s\n\r]{2,}/);
    if (match && match[0]) {
      cleanedText = cleanedText.substring(match[0].length);
      console.log("Removed initial block of whitespace");
    }
    
    // Replace multiple spaces with single spaces
    cleanedText = cleanedText.replace(/ {2,}/g, ' ');
    
    // Replace instances of 3+ newlines with just 2 (proper paragraph break)
    cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');
    
    // Add explicit logging to really see what's happening
    console.log("Deepseek cleanup - Characters in first 20 positions:");
    for (let i = 0; i < Math.min(20, cleanedText.length); i++) {
      const char = cleanedText.charCodeAt(i);
      console.log(`Position ${i}: "${cleanedText[i]}" (code: ${char})`);
    }
  } else {
    // Standard cleanup for other models
    cleanedText = cleanedText.replace(/^\s+/, '');
    cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');
    cleanedText = cleanedText.replace(/^[\n\r]+/, '');
  }
  return cleanedText;
}

// Enhance the sendMessage function for a smoother experience
async function sendMessage() {
  const userInput = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const message = userInput.value.trim();
  const selectedModel = document.getElementById("ai-model").value;
  
  // Update current model if it has changed
  if (currentModel !== selectedModel) {
    currentModel = selectedModel;
    saveConversationToStorage();
  }

  if (!message) return;

  let modelBadgeClass = 'groq';
  let modelDisplayName = 'Groq';
  if (currentModel.startsWith('ollama')) {
    modelBadgeClass = 'ollama';
    modelDisplayName = currentModel.includes('deepseek') ? 'Deepseek' : 'Llama3';
  } else if (currentModel.startsWith('mistral')) {
    modelBadgeClass = 'mistral';
    modelDisplayName = 'Mistral';
  }

  // Show user message with improved classes
  chatBox.innerHTML += `
    <div class="message user-message">
      <span class="message-avatar">👤</span>
      <div class="message-content">${message}</div>
    </div>
  `;
  userInput.value = "";

  // Add user message to history
  conversationHistory.push({ role: "user", content: message });
  saveConversationToStorage();

  // Improve loading indicator
  const loadingId = `loading-${Date.now()}`;
  chatBox.innerHTML += `<div id="${loadingId}" class="message ai-message loading">
    <span class="message-avatar">💭</span>
    <div class="message-content">
      <div class="typing-indicator"><span></span><span></span><span></span></div>
    </div>
    <span class="model-badge ${modelBadgeClass}">${modelDisplayName}</span>
  </div>`;
  safeScrollToBottom(chatBox);

  try {
    let reply;
    console.log("Sending message using model:", currentModel);
    if (currentModel.startsWith('ollama')) {
      // Call Ollama API
      reply = await callOllamaAPI();
    } else if (currentModel.startsWith('mistral')) {
      // Call Mistral API
      reply = await callMistralAPI();
    } else {
      // Call Groq API
      reply = await callGroqAPI();
    }

    // Extra sanitizing specific to Deepseek
    if (currentModel.startsWith('ollama-deepseek') && reply) {
      reply = reply.trimStart();
    }

    // Remove loading indicator
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) loadingElement.remove();

    // Add AI response to history
    conversationHistory.push({ role: "assistant", content: reply });
    saveConversationToStorage();

    // Improve the response element
    const responseElement = document.createElement('div');
    responseElement.className = 'message ai-message';
    responseElement.innerHTML = `
      <span class="message-avatar">🤖</span>
      <div class="message-content animated-response"></div>
      <span class="model-badge ${modelBadgeClass}">${modelDisplayName}</span>`;
    chatBox.appendChild(responseElement);
    
    // Animate the response
    const responseContent = responseElement.querySelector('.animated-response');
    const formattedReply = formatResponse(reply);
    let i = 0;

    function animateResponse() {
      if (i < formattedReply.length) {
        const char = formattedReply.charAt(i);
        responseContent.innerHTML += char;
        i++;

        // Only auto-scroll if user isn't manually scrolling
        if (!userIsScrolling) {
          chatBox.scrollTop = chatBox.scrollHeight;
        }
        
        // Animation speed based on character type
        const speed = char === '.' || char === '?' || char === '!' ? 300 : 10;
        setTimeout(animateResponse, speed);
      } else {
        // After animation is complete, focus the input field first before triggering reload
        const inputField = document.getElementById("user-input");
        if (inputField) {
          inputField.focus();
        }
        
        // After animation is complete, reload immediately without countdown
        const reloadingMessage = document.createElement('div');
        reloadingMessage.className = 'system-message';
        reloadingMessage.innerHTML = `
          <div class="message-content countdown-message">
            Reloading now...
          </div>
        `;
        chatBox.appendChild(reloadingMessage);

        // Only auto-scroll if user isn't manually scrolling
        if (!userIsScrolling) {
          chatBox.scrollTop = chatBox.scrollHeight;
        }
        
        // Add the style for the message
        const style = document.createElement('style');
        style.textContent = `
          .countdown-message {
            font-weight: bold !important;
            background-color: var(--system-message-bg) !important;
            animation: pulse 0.5s infinite alternate;
          }
          @keyframes pulse {
            from { opacity: 0.8; }
            to { opacity: 1; }
          }
        `;
        document.head.appendChild(style);

        // Add a minimal delay (10ms) to ensure UI updates before reload
        setTimeout(() => {
          window.location.reload();
        }, 10);
      }
    }
    animateResponse();

  } catch (error) {
    // Remove loading indicator and show error
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) loadingElement.remove();
    
    chatBox.innerHTML += `
      <div class="message error-message">
        <span class="message-avatar">⚠️</span>
        <div class="message-content">Error: ${error.message}</div>
      </div>
    `;
    safeScrollToBottom(chatBox);

    // Focus the input field after error is shown
    setTimeout(() => {
      const inputField = document.getElementById("user-input");
      if (inputField) inputField.focus();
    }, 100);
  }
}
