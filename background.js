// Track side panel state
let isPanelOpen = false;

// Initialize side panel state
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('isPanelOpen', (data) => {
    isPanelOpen = !!data.isPanelOpen;
    
    // If the panel should be open on startup, open it
    if (isPanelOpen) {
      chrome.sidePanel.open();
    }
  });
});

// Toggle side panel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  // Get current state
  const panelState = await chrome.sidePanel.getOptions({});
  const isPanelCurrentlyOpen = panelState.enabled !== false;

  if (isPanelCurrentlyOpen) {
    // Close the panel
    await chrome.sidePanel.setOptions({ enabled: false });
    isPanelOpen = false;
  } else {
    // Open the panel
    await chrome.sidePanel.open();
    await chrome.sidePanel.setOptions({ enabled: true });
    isPanelOpen = true;
  }
  
  // Save state
  chrome.storage.local.set({ isPanelOpen });
});

// Also listen for messages from the sidebar to control visibility
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleSidebar') {
    chrome.sidePanel.getOptions({}).then(async (panelState) => {
      const isPanelCurrentlyOpen = panelState.enabled !== false;
      
      if (isPanelCurrentlyOpen) {
        await chrome.sidePanel.setOptions({ enabled: false });
        isPanelOpen = false;
      } else {
        await chrome.sidePanel.open();
        await chrome.sidePanel.setOptions({ enabled: true });
        isPanelOpen = true;
      }
      
      chrome.storage.local.set({ isPanelOpen });
      sendResponse({ success: true, isOpen: isPanelOpen });
    });
    return true; // Required for async response
  }
  
  if (message.action === 'getPanelState') {
    sendResponse({ isOpen: isPanelOpen });
    return true;
  }
});
