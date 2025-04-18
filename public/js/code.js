document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    const lucide = window.lucide;
    lucide.createIcons();
    
    // DOM elements
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');
    const languageSelect = document.getElementById('language-select');
    const errorContainer = document.getElementById('error-container');
    const errorDetails = document.getElementById('error-details');
    const imageUpload = document.getElementById('image-upload');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const clearChatButton = document.getElementById('clear-chat');
    const welcomeMessage = document.getElementById('welcome-message');
    
    // State
    let messages = [];
    let isLoading = false;
    let currentImage = null;
    
    // Load messages from local storage
    loadMessages();
    
    // Update placeholder based on selected language
    languageSelect.addEventListener('change', updatePlaceholder);
    
    // Handle image upload
    imageUpload.addEventListener('change', handleImageUpload);
    
    // Handle clear chat
    clearChatButton.addEventListener('click', clearChat);
    
    function updatePlaceholder() {
      const language = languageSelect.value;
      
      if (language === 'darija') {
        chatInput.placeholder = 'Kteb message dyalek hna...';
      } else if (language === 'french') {
        chatInput.placeholder = 'Écrivez votre message ici...';
      } else if (language === 'msa') {
        chatInput.placeholder = 'اكتب رسالتك هنا...';
      }
    }
    
    // Handle form submission
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const userInput = chatInput.value.trim();
      if ((!userInput && !currentImage) || isLoading) return;
      
      // Add user message to chat
      addMessage('user', userInput, currentImage);
      chatInput.value = '';
      
      // Clear image preview
      clearImagePreview();
      
      // Show loading indicator
      isLoading = true;
      updateUI();
      showThinking();
      
      try {
        await sendMessage(userInput);
        hideError();
      } catch (error) {
        showError(error.message || 'Failed to get a response');
        console.error('Error sending message:', error);
      } finally {
        isLoading = false;
        hideThinking();
        updateUI();
      }
    });
    
    // Handle image upload
    function handleImageUpload(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = function(event) {
        currentImage = {
          data: event.target.result,
          type: file.type,
          name: file.name
        };
        
        displayImagePreview(currentImage);
      };
      reader.readAsDataURL(file);
    }
    
    // Display image preview
    function displayImagePreview(image) {
      imagePreviewContainer.innerHTML = '';
      
      const previewWrapper = document.createElement('div');
      previewWrapper.className = 'image-preview-wrapper';
      
      const preview = document.createElement('img');
      preview.className = 'image-preview';
      preview.src = image.data;
      preview.alt = 'Image preview';
      
      const removeButton = document.createElement('div');
      removeButton.className = 'remove-image';
      removeButton.innerHTML = '×';
      removeButton.addEventListener('click', clearImagePreview);
      
      previewWrapper.appendChild(preview);
      previewWrapper.appendChild(removeButton);
      imagePreviewContainer.appendChild(previewWrapper);
    }
    
    // Clear image preview
    function clearImagePreview() {
      imagePreviewContainer.innerHTML = '';
      currentImage = null;
      imageUpload.value = '';
    }
    
    // Add a message to the chat
    function addMessage(role, content, image = null) {
      const messageId = Date.now().toString();
      const message = { 
        id: messageId, 
        role, 
        content, 
        image,
        timestamp: new Date().toISOString()
      };
      
      messages.push(message);
      
      // Save messages to local storage
      saveMessages();
      
      // If this is the first message, clear the welcome message
      if (welcomeMessage && welcomeMessage.parentNode === chatMessages) {
        chatMessages.removeChild(welcomeMessage);
      }
      
      // Create message element
      const messageEl = document.createElement('div');
      messageEl.className = `message ${role}`;
      
      // Add avatar for the appropriate side
      if (role === 'assistant') {
        const avatarEl = document.createElement('div');
        avatarEl.className = 'avatar';
        
        const avatarFallback = document.createElement('div');
        avatarFallback.className = 'avatar-fallback';
        avatarFallback.textContent = '🇲🇦';
        
        avatarEl.appendChild(avatarFallback);
        messageEl.appendChild(avatarEl);
      }
      
      // Add message content
      const contentEl = document.createElement('div');
      contentEl.className = 'message-content';
      
      if (content) {
        contentEl.textContent = content;
      }
      
      // Add image if present
      if (image) {
        const imageEl = document.createElement('img');
        imageEl.className = 'message-image';
        imageEl.src = image.data;
        imageEl.alt = image.name || 'Uploaded image';
        contentEl.appendChild(imageEl);
      }
      
      messageEl.appendChild(contentEl);
      
      // Add user avatar if it's a user message
      if (role === 'user') {
        const avatarEl = document.createElement('div');
        avatarEl.className = 'avatar';
        
        const avatarFallback = document.createElement('div');
        avatarFallback.className = 'avatar-fallback';
        avatarFallback.textContent = '👤';
        
        avatarEl.appendChild(avatarFallback);
        messageEl.appendChild(avatarEl);
      }
      
      // Add the message to the chat
      chatMessages.appendChild(messageEl);
      
      // Scroll to the bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Show thinking indicator
    function showThinking() {
      const thinkingEl = document.createElement('div');
      thinkingEl.id = 'thinking-indicator';
      thinkingEl.className = 'message assistant';
      
      const avatarEl = document.createElement('div');
      avatarEl.className = 'avatar';
      
      const avatarFallback = document.createElement('div');
      avatarFallback.className = 'avatar-fallback';
      avatarFallback.textContent = '🇲🇦';
      
      avatarEl.appendChild(avatarFallback);
      thinkingEl.appendChild(avatarEl);
      
      const contentEl = document.createElement('div');
      contentEl.className = 'message-content thinking';
      
      for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'thinking-dot';
        contentEl.appendChild(dot);
      }
      
      thinkingEl.appendChild(contentEl);
      chatMessages.appendChild(thinkingEl);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Hide thinking indicator
    function hideThinking() {
      const thinkingEl = document.getElementById('thinking-indicator');
      if (thinkingEl) {
        thinkingEl.remove();
      }
    }
    
    // Show error message
    function showError(message) {
      errorContainer.classList.remove('hidden');
      errorDetails.textContent = message;
    }
    
    // Hide error message
    function hideError() {
      errorContainer.classList.add('hidden');
      errorDetails.textContent = '';
    }
    
    // Update UI based on state
    function updateUI() {
      sendButton.disabled = isLoading || (chatInput.value.trim() === '' && !currentImage);
      chatInput.disabled = isLoading;
      
      if (isLoading) {
        sendButton.innerHTML = '<div class="loader"></div>';
      } else {
        sendButton.innerHTML = '<i data-lucide="send"></i><span class="sr-only">Send</span>';
        lucide.createIcons();
      }
    }
    
    // Send message to the API
    async function sendMessage(userInput) {
      // Replace this URL with your actual API endpoint
      const apiUrl = '/api/chat';
      
      // Prepare the request body
      const requestBody = {
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          image: msg.image ? {
            data: msg.image.data,
            type: msg.image.type
          } : null
        })),
        language: languageSelect.value
      };
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to get a response');
      }
      
      const data = await response.json();
      addMessage('assistant', data.content);
      
      return data;
    }
    
    // Save messages to local storage
    function saveMessages() {
      // Only save the last 50 messages to prevent exceeding storage limits
      const messagesToSave = messages.slice(-50);
      localStorage.setItem('darijaChat', JSON.stringify(messagesToSave));
    }
    
    // Load messages from local storage
    function loadMessages() {
      const savedMessages = localStorage.getItem('darijaChat');
      if (savedMessages) {
        messages = JSON.parse(savedMessages);
        
        // Display saved messages
        if (messages.length > 0) {
          // Remove welcome message
          if (welcomeMessage && welcomeMessage.parentNode === chatMessages) {
            chatMessages.removeChild(welcomeMessage);
          }
          
          // Display messages
          messages.forEach(msg => {
            addMessage(msg.role, msg.content, msg.image);
          });
        }
      }
    }
    
    // Clear chat history
    function clearChat() {
      if (confirm('Are you sure you want to clear the chat history?')) {
        messages = [];
        localStorage.removeItem('darijaChat');
        chatMessages.innerHTML = '';
        
        // Add welcome message back
        chatMessages.appendChild(welcomeMessage);
      }
    }
    
    // Initialize
    updatePlaceholder();
    updateUI();
  });