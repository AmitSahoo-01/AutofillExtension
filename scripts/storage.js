// Storage manager for Chrome extension (Simplified for Record & Playback)
const StorageManager = {
  init: async function() {
    const data = await chrome.storage.local.get(['savedForms']);
    if (!data.savedForms) {
      await chrome.storage.local.set({ savedForms: [] });
    }
  },

  getSavedForms: async function() {
    const data = await chrome.storage.local.get(['savedForms']);
    return data.savedForms || [];
  },

  saveForm: async function(formName, formData) {
    const data = await chrome.storage.local.get(['savedForms']);
    const savedForms = data.savedForms || [];
    
    // Add unique ID and timestamp
    const newForm = {
      id: 'form_' + Date.now(),
      name: formName,
      timestamp: Date.now(),
      url: formData.url,
      domain: formData.domain,
      fields: formData.fields
    };

    // Prepend to list
    savedForms.unshift(newForm);
    await chrome.storage.local.set({ savedForms });
    return newForm;
  },

  deleteForm: async function(id) {
    const data = await chrome.storage.local.get(['savedForms']);
    const savedForms = data.savedForms || [];
    const filtered = savedForms.filter(f => f.id !== id);
    await chrome.storage.local.set({ savedForms: filtered });
  }
};

StorageManager.init();
