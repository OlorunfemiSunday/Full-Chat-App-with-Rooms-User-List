const socket = io(
  location.hostname === 'localhost'
    ? undefined
    : 'https://full-chat-app-with-rooms-user-list.onrender.com/'
);

// DOM elements
const joinContainer = document.getElementById('join-container');
const joinForm = document.getElementById('join-form');
const usernameInput = document.getElementById('username');
const roomSelect = document.getElementById('room');

let currentUser = '';
let currentRoom = '';
let chatApp = null;

// Create chat interface dynamically
function createChatInterface() {
    // Create main chat app container
    chatApp = document.createElement('div');
    chatApp.className = 'chat-app active';
    chatApp.id = 'chat-app';

    // Create sidebar
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';

    // Create room info section
    const roomInfo = document.createElement('div');
    roomInfo.className = 'room-info';
    const roomName = document.createElement('h3');
    roomName.id = 'room-name';
    roomName.textContent = currentRoom;
    const userName = document.createElement('p');
    userName.id = 'user-name';
    userName.textContent = currentUser;
    roomInfo.appendChild(roomName);
    roomInfo.appendChild(userName);

    // Create users section
    const usersSection = document.createElement('div');
    usersSection.className = 'users-section';
    const usersTitle = document.createElement('h4');
    usersTitle.textContent = 'Online Users';
    const userList = document.createElement('ul');
    userList.className = 'user-list';
    userList.id = 'user-list';
    usersSection.appendChild(usersTitle);
    usersSection.appendChild(userList);

    // Create leave button
    const leaveBtn = document.createElement('button');
    leaveBtn.className = 'leave-btn';
    leaveBtn.id = 'leave-btn';
    leaveBtn.textContent = 'Leave Room';

    // Assemble sidebar
    sidebar.appendChild(roomInfo);
    sidebar.appendChild(usersSection);
    sidebar.appendChild(leaveBtn);

    // Create main chat container
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';

    // Create chat header
    const chatHeader = document.createElement('div');
    chatHeader.className = 'chat-header';
    const chatTitle = document.createElement('h1');
    chatTitle.id = 'chat-title';
    chatTitle.textContent = `💬 ${currentRoom} Room`;
    chatHeader.appendChild(chatTitle);

    // Create messages container
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'messages-container';
    const messages = document.createElement('ul');
    messages.id = 'messages';
    messagesContainer.appendChild(messages);

    // Create chat form
    const form = document.createElement('form');
    form.id = 'form';
    form.action = '';
    const input = document.createElement('input');
    input.id = 'input';
    input.autocomplete = 'off';
    input.placeholder = 'Type a message...';
    const button = document.createElement('button');
    button.id = 'button';
    button.type = 'submit';
    button.textContent = 'Send';
    form.appendChild(input);
    form.appendChild(button);

    // Assemble chat container
    chatContainer.appendChild(chatHeader);
    chatContainer.appendChild(messagesContainer);
    chatContainer.appendChild(form);

    // Assemble main chat app
    chatApp.appendChild(sidebar);
    chatApp.appendChild(chatContainer);

    // Add to body
    document.body.appendChild(chatApp);

    // Add event listeners
    setupChatEventListeners();
}

// Setup event listeners for chat interface
function setupChatEventListeners() {
    const form = document.getElementById('form');
    const input = document.getElementById('input');
    const leaveBtn = document.getElementById('leave-btn');

    // Chat form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (input.value.trim()) {
            socket.emit('chat message', {
                text: input.value,
                username: currentUser,
                room: currentRoom
            });
            input.value = '';
        }
    });

    // Leave room
    leaveBtn.addEventListener('click', () => {
        socket.emit('leave room', { username: currentUser, room: currentRoom });
        
        // Remove chat interface
        if (chatApp) {
            document.body.removeChild(chatApp);
            chatApp = null;
        }
        
        // Show join form
        joinContainer.style.display = 'flex';
        
        // Reset form
        usernameInput.value = '';
        roomSelect.value = '';
        
        currentUser = '';
        currentRoom = '';
    });
}

// Join room form submission
joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const room = roomSelect.value;
    
    if (username && room) {
        currentUser = username;
        currentRoom = room;
        
        // Join the room
        socket.emit('join room', { username, room });
        
        // Hide join form
        joinContainer.style.display = 'none';
        
        // Create and show chat interface
        createChatInterface();
        
        // Focus on message input
        const input = document.getElementById('input');
        if (input) {
            input.focus();
        }
    }
});

// Listen for chat messages
socket.on('chat message', (data) => {
    const messages = document.getElementById('messages');
    if (!messages) return;

    const item = document.createElement('li');
    
    // Create message content
    const messageContent = document.createElement('div');
    const usernameSpan = document.createElement('div');
    usernameSpan.className = 'message-username';
    usernameSpan.textContent = data.username;
    
    const textDiv = document.createElement('div');
    textDiv.textContent = data.text;
    
    messageContent.appendChild(usernameSpan);
    messageContent.appendChild(textDiv);
    item.appendChild(messageContent);
    
    // Style based on sender
    if (data.username === currentUser) {
        item.classList.add('sent-message');
    } else {
        item.classList.add('received-message');
    }
    
    messages.appendChild(item);
    scrollToBottom();
});

// Listen for room users update
socket.on('room users', (users) => {
    const userList = document.getElementById('user-list');
    if (!userList) return;

    userList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        if (user === currentUser) {
            li.classList.add('current-user');
        }
        userList.appendChild(li);
    });
});

// Listen for status messages
socket.on('status message', (message) => {
    const messages = document.getElementById('messages');
    if (!messages) return;

    const item = document.createElement('li');
    item.textContent = message;
    item.classList.add('status-message');
    messages.appendChild(item);
    scrollToBottom();
});

// Auto-scroll function
function scrollToBottom() {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Handle connection events
socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});
