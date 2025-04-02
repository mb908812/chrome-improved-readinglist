Enhanced Reading List - Chrome Extension
A sidebar reading list extension for Chrome that allows you to save, organize, and manage web pages with notes and status indicators.

Features
Persistent Sidebar: Always visible on the right side of your browser window
Toggle Visibility: Easily collapse to a mini mode or hide completely
Add Current Tab: Quickly save the page you're viewing
Notes: Add personal notes to any saved link
Completion Status: Mark items as completed with a strikethrough effect
Read/Unread Status: Organize links by read/unread status
Drag and Drop: Reorder your links however you prefer
Search: Find saved links by title, URL, or note content
Keyboard Shortcut: Toggle the panel with Ctrl+Shift+R (Cmd+Shift+R on Mac)
Installation
From Source Code
Download or clone this repository to your local machine
Create an images folder and add icons (16px, 48px, 128px sizes)
Open Chrome and navigate to chrome://extensions/
Enable "Developer mode" (toggle in the upper right)
Click "Load unpacked" and select the folder containing the extension files
The extension icon will appear in your Chrome toolbar
How to Use
Basic Usage
Open the Panel: Click the extension icon in your toolbar or use Ctrl+Shift+R (Cmd+Shift+R on Mac)
Add the Current Page: Click the "+" button in the header
Toggle Mini Mode: Click the arrow (⇨) button to collapse to mini mode
Expand from Mini Mode: Click the arrow (⇦) button to expand back to full mode
Managing Links
View Categories:
Click "Unread" to see newly added links
Click "Read" to see links you've marked as read
Item Interactions:
Open a Link: Click on the title or URL
Select an Item: Click anywhere else on the item (needed for adding notes)
Mark as Read/Unread: Click the circle icon (⚪/◯)
Mark as Complete: Click the checkmark icon (✓) to add a strikethrough
Reorder: Drag items using the handle (≡) on the left
Delete: Click the × button
Adding Notes:
Select an item by clicking on it (not on the title/URL)
Click the "Add Note" button in the header
Enter your note in the prompt and click OK
Searching:
Type in the search box to filter links by title, URL, or note content
Click the × in the search box to clear the search
File Structure
manifest.json - Extension configuration
background.js - Controls the sidebar panel behavior
sidebar.html - Main UI structure
sidebar.css - Styling for the sidebar
sidebar.js - Core functionality
images/ - Contains icon files (16px, 48px, 128px)
Keyboard Shortcuts
Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac) - Toggle the sidebar panel
Permissions Explanation
This extension requires the following permissions:

storage - To save your reading list
tabs and activeTab - To access the current tab information
sidePanel - To display as a sidebar panel
Notes
The extension will remember your links between browser sessions
The panel state (open/closed) and mode (full/mini) will be saved
The extension works only in Chrome and other Chromium-based browsers
