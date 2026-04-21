  // ——— Chat Injection Engine ———
  async function sendChatMessage(message) {
    console.log(`${COPILOT_PREFIX} Attempting to send chat message:`, message);
    
    try {
      // 1. Ensure chat panel is open
      const chatButton = document.querySelector('button[aria-label*="Chat with everyone"]');
      let chatInput = document.querySelector('textarea[aria-label="Chat text input"]') || 
                      document.querySelector('textarea[name="chatTextInput"]');
      
      if (!chatInput && chatButton) {
        chatButton.click(); // Open chat panel
        // Wait for the DOM to render the chat panel
        await new Promise(r => setTimeout(r, 800));
        chatInput = document.querySelector('textarea[aria-label="Chat text input"]') || 
                    document.querySelector('textarea[name="chatTextInput"]');
      }

      if (!chatInput) {
        console.error(`${COPILOT_PREFIX} Could not find chat input box`);
        return false;
      }

      // 2. Set the text value and trigger input events so React/Meet registers it
      // Google Meet requires specific event dispatching to recognize text
      chatInput.value = message;
      
      const inputEvent = new Event('input', { bubbles: true, cancelable: true });
      const changeEvent = new Event('change', { bubbles: true, cancelable: true });
      
      chatInput.dispatchEvent(inputEvent);
      chatInput.dispatchEvent(changeEvent);
      
      // Wait a tiny bit for the UI state to update
      await new Promise(r => setTimeout(r, 300));

      // 3. Find and click the send button (or simulate Enter key)
      const sendButton = document.querySelector('button[aria-label="Send message"]') ||
                         document.querySelector('button[data-tooltip="Send message"]');
      
      if (sendButton && !sendButton.disabled && sendButton.getAttribute('aria-disabled') !== 'true') {
        sendButton.click();
      } else {
        // Fallback: Trigger Enter key
        chatInput.dispatchEvent(new KeyboardEvent('keydown', { 
          key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true 
        }));
      }
      
      console.log(`${COPILOT_PREFIX} Chat message sent successfully.`);
      return true;
    } catch (e) {
      console.error(`${COPILOT_PREFIX} Error sending chat message:`, e);
      return false;
    }
  }

  // ——— Listen for messages from background ———
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SHOW_BRIEF') {
      showBriefOverlay(message.briefContent, message.targetName);
      sendResponse({ success: true });
    }
    // Listen for the command to send a chat
    if (message.type === 'SEND_CHAT_MESSAGE') {
      sendChatMessage(message.text).then(success => sendResponse({ success }));
      return true; // Keep message channel open for async response
    }
    return true;
  });
