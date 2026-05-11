// Autofill logic that runs in the context of the page
const AutoFiller = {
  // Helper to trigger events so React/Vue/Angular pick up the change
  triggerEvents: function(element) {
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));
    
    // Specifically for React
    let tracker = element._valueTracker;
    if (tracker) {
      tracker.setValue(element.value);
    }
  },

  // Fill a specific field based on its type
  fillField: function(element, data) {
    if (!element || !data) return;

    const tagName = element.tagName.toLowerCase();
    const type = element.type ? element.type.toLowerCase() : '';

    if (tagName === 'input' || tagName === 'textarea') {
      if (type === 'checkbox' || type === 'radio') {
        const shouldCheck = data.checked === true || data.value === 'true' || data.value === element.value;
        if (element.checked !== shouldCheck) {
          element.click(); 
          element.checked = shouldCheck;
          this.triggerEvents(element);
        }
      } else {
        if (data.value !== undefined && data.value !== '') {
          element.value = data.value;
          this.triggerEvents(element);
        }
      }
    } else if (tagName === 'select') {
      let matched = false;
      for (let i = 0; i < element.options.length; i++) {
        const option = element.options[i];
        if (data.value && (option.value === data.value || option.text.toLowerCase().includes(data.value.toLowerCase()))) {
          element.selectedIndex = i;
          matched = true;
          break;
        }
      }
      if (matched) {
        this.triggerEvents(element);
      }
    }
  },

  // Execute autofill for a given mapping
  // mapping format: { fieldIdentifier: valueToFill }
  execute: function(mapping) {
    let filledCount = 0;
    
    // Iterate over all inputs, selects, textareas
    const formElements = document.querySelectorAll('input, select, textarea');
    
    formElements.forEach(element => {
      // Skip hidden fields or submit buttons
      if (element.type === 'hidden' || element.type === 'submit' || element.type === 'button') {
        return;
      }

      // Try to find a match in the mapping based on data-autofill-index
      const fieldIndex = element.getAttribute('data-autofill-index');
      
      let mappedData = null;
      if (fieldIndex && mapping[fieldIndex] !== undefined) {
        mappedData = mapping[fieldIndex];
      }

      if (mappedData !== null) {
        this.fillField(element, mappedData);
        
        // Add a visual indicator
        const originalBg = element.style.backgroundColor;
        element.style.backgroundColor = '#e8f0fe'; // Light blue
        element.style.transition = 'background-color 0.5s';
        
        setTimeout(() => {
          element.style.backgroundColor = originalBg;
        }, 1500);

        filledCount++;
      }
    });
    
    return filledCount;
  }
};
