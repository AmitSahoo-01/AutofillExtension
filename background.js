// background.js - Service Worker for the extension

// Listen for keyboard shortcut commands
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'autofill_active_form') {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    try {
      const url = new URL(tab.url);
      const domain = url.hostname;

      // Get saved forms
      const data = await chrome.storage.local.get(['savedForms']);
      const savedForms = data.savedForms || [];

      if (savedForms.length === 0) return;

      // Try to find a form saved for this exact domain first
      let formToUse = savedForms.find(f => f.domain === domain);
      
      // Fallback to the most recently saved form overall if no domain match
      if (!formToUse) {
        formToUse = savedForms[0];
      }

      const profile = {
        profileName: formToUse.name,
        fields: formToUse.fields
      };

      // Send autofill message to content script
      chrome.tabs.sendMessage(tab.id, {
        action: 'AUTOFILL',
        payload: { profile: profile }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
        } else {
          console.log('Autofill completed via shortcut', response);
        }
      });
      
    } catch (e) {
      console.error('Error executing shortcut autofill:', e);
    }
  }
});
