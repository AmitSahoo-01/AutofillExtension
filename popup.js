document.addEventListener('DOMContentLoaded', async () => {
  // === Theme Handling ===
  const themeToggle = document.getElementById('themeToggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  let currentTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
  document.body.setAttribute('data-theme', currentTheme);
  
  themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
  });

  // === State ===
  let currentFormOnPage = null;

  // === UI Elements ===
  const statusIndicator = document.getElementById('active-form-status');
  const inputFormName = document.getElementById('form-name-input');
  const btnSaveForm = document.getElementById('btn-save-form');
  const savedFormsList = document.getElementById('saved-forms-list');

  // === Initial Load ===
  await StorageManager.init();
  scanCurrentPage();
  renderSavedForms();

  // === Scan Page ===
  async function scanCurrentPage() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
      statusIndicator.textContent = 'Cannot scan internal browser pages.';
      return;
    }

    try {
      chrome.tabs.sendMessage(tab.id, { action: 'GET_PAGE_FORMS' }, (response) => {
        if (chrome.runtime.lastError || !response || !response.forms || response.forms.length === 0) {
          statusIndicator.textContent = 'No forms detected on this page.';
          inputFormName.disabled = true;
          btnSaveForm.disabled = true;
        } else {
          currentFormOnPage = response.forms[0];
          statusIndicator.textContent = `Form detected! Ready to save.`;
          statusIndicator.classList.add('success');
          
          inputFormName.disabled = false;
          btnSaveForm.disabled = false;
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  // === Save Form ===
  btnSaveForm.addEventListener('click', async () => {
    if (!currentFormOnPage) return;
    
    const name = inputFormName.value.trim();
    if (!name) {
      alert("Please enter a name for this form.");
      return;
    }

    btnSaveForm.textContent = "Saving...";
    btnSaveForm.disabled = true;

    // Save the exact current state of the form
    await StorageManager.saveForm(name, currentFormOnPage);
    
    inputFormName.value = '';
    btnSaveForm.textContent = "Save Form";
    btnSaveForm.disabled = false;
    
    renderSavedForms();
  });

  // === Render List ===
  async function renderSavedForms() {
    const forms = await StorageManager.getSavedForms();
    
    if (forms.length === 0) {
      savedFormsList.innerHTML = `<p class="desc" style="text-align: center; margin-top: 20px;">No forms saved yet. Fill a form and save it above!</p>`;
      return;
    }

    savedFormsList.innerHTML = forms.map(f => `
      <li class="saved-item">
        <div class="item-info">
          <span class="item-name">${f.name}</span>
          <span class="item-meta">${f.fields.length} fields • ${f.domain}</span>
        </div>
        <div class="item-actions">
          <button class="btn-fill" data-id="${f.id}">Fill</button>
          <button class="btn-delete" data-id="${f.id}">✖</button>
        </div>
      </li>
    `).join('');

    // Attach listeners
    savedFormsList.querySelectorAll('.btn-fill').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        const formToFill = forms.find(f => f.id === id);
        if (formToFill) await fillFormOnPage(formToFill);
      });
    });

    savedFormsList.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        await StorageManager.deleteForm(id);
        renderSavedForms();
      });
    });
  }

  // === Trigger Autofill ===
  async function fillFormOnPage(savedForm) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    // Send the saved form as the "profile" to the content script
    // The content script and matcher will treat it like a profile and map it back
    const profile = {
      profileName: savedForm.name,
      fields: savedForm.fields
    };

    chrome.tabs.sendMessage(tab.id, {
      action: 'AUTOFILL',
      payload: { profile: profile }
    }, (response) => {
      if (response && response.success) {
        const oldText = statusIndicator.textContent;
        statusIndicator.textContent = `Autofilled ${response.filledCount} fields!`;
        statusIndicator.classList.add('success');
        setTimeout(() => {
          statusIndicator.textContent = oldText;
        }, 3000);
      }
    });
  }
});
