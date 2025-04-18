document.addEventListener('DOMContentLoaded', () => {
  const lucide = window.lucide;
  lucide.createIcons();

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
  const chatHistoryMessages = document.getElementById('chat-history-messages');

  let messages = [];
  let isLoading = false;
  let currentImage = null;

  loadMessages();

  languageSelect.addEventListener('change', updatePlaceholder);
  imageUpload.addEventListener('change', handleImageUpload);
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

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userInput = chatInput.value.trim();
    if ((!userInput && !currentImage) || isLoading) return;
    addMessage('user', userInput, currentImage);
    chatInput.value = '';
    clearImagePreview();
    isLoading = true;
    updateUI();
    showThinking();
    try {
      await sendMessage();
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

  function clearImagePreview() {
    imagePreviewContainer.innerHTML = '';
    currentImage = null;
    imageUpload.value = '';
  }

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
    saveMessages();
    if (welcomeMessage && welcomeMessage.parentNode === chatMessages) {
      chatMessages.removeChild(welcomeMessage);
    }
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;
    if (role === 'assistant') {
      const avatarEl = document.createElement('div');
      avatarEl.className = 'avatar';
      const avatarFallback = document.createElement('div');
      avatarFallback.className = 'avatar-fallback';
      avatarFallback.textContent = '🤖';
      avatarEl.appendChild(avatarFallback);
      messageEl.appendChild(avatarEl);
    }
    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    if (content) {
      contentEl.textContent = content;
    }
    if (image) {
      const imageEl = document.createElement('img');
      imageEl.className = 'message-image';
      imageEl.src = image.data;
      imageEl.alt = image.name || 'Uploaded image';
      contentEl.appendChild(imageEl);
    }
    messageEl.appendChild(contentEl);
    if (role === 'user') {
      const avatarEl = document.createElement('div');
      avatarEl.className = 'avatar';
      try {
        const avatarImg = document.createElement('img');
        avatarImg.className = 'avatar-img';
        avatarImg.src = './img/user.png';
        avatarImg.alt = 'User';
        avatarImg.onerror = function() {
          this.onerror = null;
          avatarEl.removeChild(this);
          const avatarFallback = document.createElement('img');
          avatarFallback.className = 'avatar-fallback';
          avatarFallback.src = './img/me.png';
          avatarFallback.alt = 'User';
          avatarEl.appendChild(avatarFallback);
        };
        avatarEl.appendChild(avatarImg);
      } catch (e) {
        const avatarFallback = document.createElement('img');
        avatarFallback.className = 'avatar-fallback';
        avatarFallback.src = './img/me.png';
        avatarFallback.alt = 'User';
        avatarEl.appendChild(avatarFallback);
      }
      messageEl.appendChild(avatarEl);
    }
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    updateChatHistory();
  }

  function updateChatHistory() {
    if (!chatHistoryMessages) return;
    chatHistoryMessages.innerHTML = '';
    const conversations = [];
    let currentConversation = [];
    messages.forEach((msg, index) => {
      currentConversation.push(msg);
      if (index % 2 === 1 || index === messages.length - 1) {
        if (currentConversation.length > 0) {
          conversations.push([...currentConversation]);
          currentConversation = [];
        }
      }
    });
    conversations.slice(-10).forEach((conversation) => {
      const userMsg = conversation.find(msg => msg.role === 'user');
      if (!userMsg) return;
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      const date = new Date(userMsg.timestamp);
      const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
      const truncatedContent = userMsg.content.length > 30 
        ? userMsg.content.substring(0, 30) + '...' 
        : userMsg.content;
      historyItem.innerHTML = `
          <div class="history-title">${truncatedContent || 'Image message'}</div>
          <div class="history-date">${formattedDate}</div>
        `;
      historyItem.addEventListener('click', () => {
        const msgElement = document.querySelector(`[data-message-id="${userMsg.id}"]`);
        if (msgElement) {
          msgElement.scrollIntoView({ behavior: 'smooth' });
        }
      });
      chatHistoryMessages.appendChild(historyItem);
    });
  }

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

  function hideThinking() {
    const thinkingEl = document.getElementById('thinking-indicator');
    if (thinkingEl) {
      thinkingEl.remove();
    }
  }

  function showError(message) {
    errorContainer.classList.remove('hidden');
    errorDetails.textContent = message;
  }

  function hideError() {
    errorContainer.classList.add('hidden');
    errorDetails.textContent = '';
  }

  function updateUI() {
    if (isLoading) {
      sendButton.innerHTML = '<div class="loader"></div>';
    } else {
      sendButton.innerHTML = '<i data-lucide="send"></i><span class="sr-only">Send</span>';
      lucide.createIcons();
    }
  }

  async function sendMessage() {
    const apiUrl = '/api/chat';
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

  function saveMessages() {
    const messagesToSave = messages.slice(-50);
    localStorage.setItem('darijaChat', JSON.stringify(messagesToSave));
  }

  function loadMessages() {
    const savedMessages = localStorage.getItem('darijaChat');
    if (savedMessages) {
      messages = JSON.parse(savedMessages);
      if (messages.length > 0) {
        if (welcomeMessage && welcomeMessage.parentNode === chatMessages) {
          chatMessages.removeChild(welcomeMessage);
        }
        messages.forEach(msg => {
          addMessage(msg.role, msg.content, msg.image);
        });
      }
    }
  }

  function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
      messages = [];
      localStorage.removeItem('darijaChat');
      chatMessages.innerHTML = '';
      chatMessages.appendChild(welcomeMessage);
      if (chatHistoryMessages) {
        chatHistoryMessages.innerHTML = '';
      }
    }
  }

  function addLoaderStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .loader {
        width: 18px;
        height: 18px;
        border: 2px solid #ffffff;
        border-bottom-color: transparent;
        border-radius: 50%;
        display: inline-block;
        box-sizing: border-box;
        animation: rotation 1s linear infinite;
      }
      @keyframes rotation {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `;
    document.head.appendChild(style);
  }

  addLoaderStyles();
  updatePlaceholder();
  updateUI();
  updateChatHistory();

  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }
});
