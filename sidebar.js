document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const unreadList = document.getElementById('unread-list');
  const readList = document.getElementById('read-list');
  const emptyState = document.getElementById('empty-state');
  const noResults = document.getElementById('no-results');
  const addCurrentTabBtn = document.getElementById('add-current-tab');
  const addNoteBtn = document.getElementById('add-note-to-selected');
  const toggleSidebarBtn = document.getElementById('toggle-sidebar');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');

  // State
  let readingList = { unread: [], read: [] };
  let currentTab = 'unread';
  let draggedItem = null;
  let selectedItem = null;
  let miniMode = false;

  // Load reading list from storage
  loadReadingList();
  
  // Check if sidebar should be in mini mode
  chrome.storage.local.get('miniMode', (data) => {
    if (data.miniMode) {
      enableMiniMode();
    }
  });

  // Event Listeners
  addCurrentTabBtn.addEventListener('click', addCurrentTab);
  addNoteBtn.addEventListener('click', addNoteToSelected);
  toggleSidebarBtn.addEventListener('click', toggleSidebar);
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentTab = button.dataset.tab;
      
      document.querySelectorAll('.reading-list').forEach(list => {
        list.classList.remove('active');
      });
      document.getElementById(`${currentTab}-list`).classList.add('active');
      
      renderReadingList();
    });
  });

  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
      searchClear.classList.remove('hidden');
    } else {
      searchClear.classList.add('hidden');
    }
    filterReadingList(searchTerm);
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.classList.add('hidden');
    filterReadingList('');
  });

  // Add a mini toggle button
  const miniToggleBtn = document.createElement('button');
  miniToggleBtn.className = 'mini-toggle-btn';
  miniToggleBtn.innerHTML = '⇦';
  miniToggleBtn.title = 'Expand sidebar';
  miniToggleBtn.addEventListener('click', toggleSidebar);
  document.body.appendChild(miniToggleBtn);

  // Functions
  function loadReadingList() {
    chrome.storage.local.get('readingList', (data) => {
      if (data.readingList) {
        readingList = data.readingList;
      }
      renderReadingList();
    });
  }

  function saveReadingList() {
    chrome.storage.local.set({ readingList });
  }

  function renderReadingList() {
    unreadList.innerHTML = '';
    readList.innerHTML = '';
    
    const filteredList = searchInput.value.trim() 
      ? filterBySearchTerm(readingList, searchInput.value.trim())
      : readingList;
    
    const allEmpty = filteredList.unread.length === 0 && filteredList.read.length === 0;
    
    if (allEmpty && searchInput.value.trim()) {
      noResults.classList.remove('hidden');
      emptyState.classList.add('hidden');
    } else if (allEmpty) {
      emptyState.classList.remove('hidden');
      noResults.classList.add('hidden');
    } else {
      emptyState.classList.add('hidden');
      noResults.classList.add('hidden');
    }
    
    filteredList.unread.forEach((item, index) => {
      unreadList.appendChild(createListItem(item, index, 'unread'));
    });
    
    filteredList.read.forEach((item, index) => {
      readList.appendChild(createListItem(item, index, 'read'));
    });
    
    // Add drag and drop handlers to list items
    setupDragAndDrop();
  }

  function createListItem(item, index, listType) {
    const listItem = document.createElement('div');
    listItem.className = 'list-item';
    if (item.completed) {
      listItem.classList.add('completed');
    }
    listItem.dataset.index = index;
    listItem.dataset.type = listType;
    listItem.dataset.id = item.id || `item_${Date.now()}_${index}`;
    
    let noteHtml = '';
    if (item.note) {
      noteHtml = `<div class="item-note">${item.note}</div>`;
    }
    
    listItem.innerHTML = `
      <div class="drag-handle">≡</div>
      <img class="item-favicon" src="${item.favIconUrl || 'images/default-favicon.png'}" alt="">
      <div class="item-content">
        <div class="item-title">${item.title}</div>
        <div class="item-url">${item.url}</div>
        ${noteHtml}
      </div>
      <div class="item-actions">
        <button class="action-btn complete-btn" title="${item.completed ? 'Mark as incomplete' : 'Mark as complete'}">
          ${item.completed ? '↻' : '✓'}
        </button>
        <button class="action-btn mark-btn" title="${listType === 'unread' ? 'Mark as read' : 'Mark as unread'}">
          ${listType === 'unread' ? '⚪' : '◯'}
        </button>
        <button class="action-btn remove-btn" title="Remove">×</button>
      </div>
    `;
    
    // Open link when clicking on the title or URL
    listItem.querySelector('.item-title').addEventListener('click', () => {
      chrome.tabs.create({ url: item.url });
    });
    
    listItem.querySelector('.item-url').addEventListener('click', () => {
      chrome.tabs.create({ url: item.url });
    });
    
    // Select this item when clicking on the content area (but not on title/url)
    listItem.addEventListener('click', (e) => {
      // Don't select when clicking on interactive elements
      if (e.target.classList.contains('item-title') || 
          e.target.classList.contains('item-url') || 
          e.target.classList.contains('action-btn') ||
          e.target.classList.contains('drag-handle')) {
        return;
      }
      
      // Deselect previously selected item
      const previouslySelected = document.querySelector('.list-item.selected');
      if (previouslySelected) {
        previouslySelected.classList.remove('selected');
      }
      
      // Select this item
      listItem.classList.add('selected');
      selectedItem = {
        element: listItem,
        index: parseInt(listItem.dataset.index),
        type: listItem.dataset.type,
        id: listItem.dataset.id
      };
    });
    
    // Toggle complete state
    listItem.querySelector('.complete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const itemIndex = parseInt(listItem.dataset.index);
      readingList[listType][itemIndex].completed = !readingList[listType][itemIndex].completed;
      saveReadingList();
      renderReadingList();
    });
    
    // Mark as read/unread
    listItem.querySelector('.mark-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const itemIndex = parseInt(listItem.dataset.index);
      if (listType === 'unread') {
        const movedItem = readingList.unread.splice(itemIndex, 1)[0];
        readingList.read.unshift(movedItem);
      } else {
        const movedItem = readingList.read.splice(itemIndex, 1)[0];
        readingList.unread.unshift(movedItem);
      }
      saveReadingList();
      renderReadingList();
    });
    
    // Remove item
    listItem.querySelector('.remove-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const itemIndex = parseInt(listItem.dataset.index);
      readingList[listType].splice(itemIndex, 1);
      saveReadingList();
      renderReadingList();
      
      // Clear selection if the removed item was selected
      if (selectedItem && selectedItem.id === listItem.dataset.id) {
        selectedItem = null;
      }
    });
    
    return listItem;
  }

  function addCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      const newItem = {
        id: `item_${Date.now()}`,
        title: currentTab.title,
        url: currentTab.url,
        favIconUrl: currentTab.favIconUrl,
        addedAt: new Date().toISOString(),
        note: '',
        completed: false
      };
      
      // Check if this URL already exists in either list
      const alreadyInUnread = readingList.unread.some(item => item.url === newItem.url);
      const alreadyInRead = readingList.read.some(item => item.url === newItem.url);
      
      if (!alreadyInUnread && !alreadyInRead) {
        readingList.unread.unshift(newItem);
        saveReadingList();
        renderReadingList();
      }
    });
  }

  function addNoteToSelected() {
    if (!selectedItem) {
      alert('Please select an item first');
      return;
    }
    
    const item = readingList[selectedItem.type][selectedItem.index];
    const currentNote = item.note || '';
    
    const newNote = prompt('Add or edit note:', currentNote);
    
    if (newNote !== null) {  // not cancelled
      item.note = newNote;
      saveReadingList();
      renderReadingList();
    }
  }
  
  function toggleSidebar() {
    if (miniMode) {
      // Switch to full mode
      document.body.classList.remove('mini-mode');
      miniMode = false;
    } else {
      // Switch to mini mode
      enableMiniMode();
    }
    
    // Save state
    chrome.storage.local.set({ miniMode });
  }
  
  function enableMiniMode() {
    document.body.classList.add('mini-mode');
    miniMode = true;
  }

  function filterBySearchTerm(list, term) {
    const lowerTerm = term.toLowerCase();
    return {
      unread: list.unread.filter(item => 
        item.title.toLowerCase().includes(lowerTerm) || 
        item.url.toLowerCase().includes(lowerTerm) ||
        (item.note && item.note.toLowerCase().includes(lowerTerm))
      ),
      read: list.read.filter(item => 
        item.title.toLowerCase().includes(lowerTerm) || 
        item.url.toLowerCase().includes(lowerTerm) ||
        (item.note && item.note.toLowerCase().includes(lowerTerm))
      )
    };
  }

  function filterReadingList(term) {
    renderReadingList();
  }

  function setupDragAndDrop() {
    const listItems = document.querySelectorAll('.list-item');
    
    listItems.forEach(item => {
      const dragHandle = item.querySelector('.drag-handle');
      
      dragHandle.addEventListener('mousedown', (e) => {
        if (miniMode) return; // Disable drag and drop in mini mode
        
        e.preventDefault();
        draggedItem = item;
        draggedItem.classList.add('dragging');
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    });
    
    function onMouseMove(e) {
      if (!draggedItem) return;
      
      const list = document.getElementById(`${draggedItem.dataset.type}-list`);
      const listItems = Array.from(list.querySelectorAll('.list-item:not(.dragging)'));
      
      let nextItem = null;
      
      for (const item of listItems) {
        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        
        if (e.clientY < midY) {
          nextItem = item;
          break;
        }
      }
      
      if (nextItem) {
        list.insertBefore(draggedItem, nextItem);
      } else {
        list.appendChild(draggedItem);
      }
    }
    
    function onMouseUp() {
      if (!draggedItem) return;
      
      const type = draggedItem.dataset.type;
      const items = Array.from(document.querySelectorAll(`.list-item[data-type="${type}"]`));
      const newOrder = [];
      
      items.forEach(item => {
        const originalIndex = parseInt(item.dataset.index);
        newOrder.push(readingList[type][originalIndex]);
      });
      
      readingList[type] = newOrder;
      saveReadingList();
      
      draggedItem.classList.remove('dragging');
      draggedItem = null;
      
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      renderReadingList();
    }
  }
});
