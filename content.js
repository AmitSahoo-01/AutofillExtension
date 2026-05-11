// Content script injected into all pages
// Relies on matcher.js and autofill.js being injected before it via manifest.json

class FormDetector {
  constructor() {
    this.forms = [];
    this.initObserver();
    this.scanPage();
  }

  // Scan the entire page for forms or groups of inputs
  scanPage() {
    const newForms = [];
    
    // First, look for actual <form> elements
    const formElements = document.querySelectorAll('form');
    formElements.forEach((form, index) => {
      const parsedForm = this.parseForm(form, `form_${index}`);
      if (parsedForm && parsedForm.fields.length > 0) {
        newForms.push(parsedForm);
      }
    });

    // If no forms, look for loose inputs that might be a form
    if (formElements.length === 0) {
      const looseInputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
      if (looseInputs.length >= 2) { // Only consider it a form if there are at least 2 fields
        const parsedForm = this.parseLooseInputs(looseInputs);
        if (parsedForm) newForms.push(parsedForm);
      }
    }

    if (newForms.length > 0) {
      this.forms = newForms;
      this.notifyBackground();
    }
  }

  // Parse a specific form element
  parseForm(formElement, formId) {
    const inputs = formElement.querySelectorAll('input:not([type="hidden"]), select, textarea');
    if (inputs.length === 0) return null;

    const fields = Array.from(inputs).map((input, idx) => this.parseField(input, `f_${formId}_${idx}`));

    return {
      id: formId,
      domain: window.location.hostname,
      url: window.location.href,
      fields: fields.filter(f => f !== null) // Filter out ignored fields
    };
  }

  // Parse loose inputs when no <form> tag exists
  parseLooseInputs(inputsNodeList) {
    const fields = Array.from(inputsNodeList).map((input, idx) => this.parseField(input, `loose_${idx}`));
    return {
      id: 'loose_form',
      domain: window.location.hostname,
      url: window.location.href,
      fields: fields.filter(f => f !== null)
    };
  }

  // Extract metadata from an input field
  parseField(element, uniqueIndex) {
    // Ignore certain types like submit, button, reset
    const type = element.type ? element.type.toLowerCase() : '';
    if (['submit', 'button', 'reset', 'image', 'file'].includes(type)) {
      return null;
    }

    // Attempt to find a label
    let labelText = '';
    
    // 1. Check aria-label
    if (element.hasAttribute('aria-label')) {
      labelText = element.getAttribute('aria-label');
    }
    
    // 2. Check associated <label> by id
    if (!labelText && element.id) {
      const labelEl = document.querySelector(`label[for="${element.id}"]`);
      if (labelEl) labelText = labelEl.innerText.trim();
    }

    // 3. Check if input is wrapped in a <label>
    if (!labelText) {
      const parentLabel = element.closest('label');
      if (parentLabel) {
        // Clone the label, remove the input to get just the text
        const clone = parentLabel.cloneNode(true);
        const childInput = clone.querySelector('input, select, textarea');
        if (childInput) childInput.remove();
        labelText = clone.innerText.trim();
      }
    }

    element.setAttribute('data-autofill-index', uniqueIndex);

    return {
      index: uniqueIndex,
      id: element.id || '',
      name: element.name || '',
      type: type || element.tagName.toLowerCase(),
      placeholder: element.placeholder || '',
      label: labelText,
      ariaLabel: element.getAttribute('aria-label') || '',
      value: element.value || '',
      checked: element.checked || false
    };
  }

  // Setup MutationObserver to catch dynamically loaded forms (React/SPA)
  initObserver() {
    let timeout;
    const observer = new MutationObserver((mutations) => {
      // Debounce the scan
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        // Only rescan if we see added nodes that could be forms/inputs
        const hasRelevantAdditions = mutations.some(m => 
          Array.from(m.addedNodes).some(node => 
            node.nodeType === 1 && (
              node.tagName === 'FORM' || 
              node.tagName === 'INPUT' ||
              node.querySelector && node.querySelector('form, input, select, textarea')
            )
          )
        );

        if (hasRelevantAdditions) {
          this.scanPage();
        }
      }, 500);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Send detected forms to background script
  notifyBackground() {
    chrome.runtime.sendMessage({
      action: 'FORMS_DETECTED',
      payload: {
        forms: this.forms,
        domain: window.location.hostname
      }
    });
  }
}

// Initialize detector
const detector = new FormDetector();

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'GET_PAGE_FORMS') {
    // Force a rescan and return current forms
    detector.scanPage();
    sendResponse({ forms: detector.forms });
  } else if (message.action === 'AUTOFILL') {
    const profile = message.payload.profile;
    
    // Check if we have forms on the page
    if (detector.forms.length === 0) {
      detector.scanPage();
    }
    
    if (detector.forms.length > 0) {
      // For now, we autofill the first form detected. Could be enhanced to let user pick.
      const formToFill = detector.forms[0];
      
      // Match the profile fields to the form fields
      const mapping = Matcher.matchProfileToForm(formToFill.fields, profile);
      
      // Execute the fill
      const filledCount = AutoFiller.execute(mapping);
      
      sendResponse({ success: true, filledCount: filledCount });
    } else {
      sendResponse({ success: false, error: 'No forms detected on page' });
    }
  } else if (message.action === 'GET_CURRENT_FORM_DATA') {
    // Capture the current state of the page's inputs to save as a custom profile
    detector.scanPage();
    if (detector.forms.length > 0) {
      sendResponse({ form: detector.forms[0] });
    } else {
      sendResponse({ error: 'No form found' });
    }
  }
  return true; // Keep message channel open for async response
});
