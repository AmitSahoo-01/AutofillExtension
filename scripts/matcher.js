// Matcher logic for matching form fields to saved profile fields (Record & Playback)
const Matcher = {
  // Normalize a string for comparison (lowercase, remove special chars, trim)
  normalize: function(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  },

  // Calculate similarity between a newly detected form field and a saved profile field
  calculateSimilarity: function(formField, profileField) {
    let score = 0;
    
    // Exact identifier matches (highest priority)
    if (formField.id && profileField.id && formField.id === profileField.id) score += 100;
    if (formField.name && profileField.name && formField.name === profileField.name) score += 100;
    
    // Index match (fallback if ids/names are missing or dynamic, but positions are same)
    if (formField.index && profileField.index && formField.index === profileField.index) {
      score += 50;
    }

    // Label & Placeholder similarity
    const formTexts = [formField.label, formField.placeholder, formField.ariaLabel].filter(Boolean).map(this.normalize);
    const profileTexts = [profileField.label, profileField.placeholder, profileField.ariaLabel].filter(Boolean).map(this.normalize);

    for (const fText of formTexts) {
      for (const pText of profileTexts) {
        if (fText === pText && fText.length > 0) {
          score += 40;
        }
      }
    }

    // Type matching provides a slight bonus
    if (formField.type === profileField.type) {
      score += 10;
    }

    return score;
  },

  // Given a list of currently detected form fields and a saved profile, return a mapping
  // Map structure: { formFieldIndex: savedFieldValue }
  matchProfileToForm: function(formFields, profile) {
    const mapping = {};
    const usedProfileFields = new Set();

    // Iterate through current form fields and find the best matching saved field
    for (const formField of formFields) {
      let bestScore = 0;
      let bestMatch = null;

      for (const profileField of profile.fields) {
        // Skip if this profile field is already mapped
        if (usedProfileFields.has(profileField.index)) continue;

        const score = this.calculateSimilarity(formField, profileField);
        
        // Lower threshold since it's just trying to reconstruct a saved form
        if (score > bestScore && score >= 40) { 
          bestScore = score;
          bestMatch = profileField;
        }
      }

      // Pass an object with value and checked state
      if (bestMatch && (bestMatch.value !== undefined || bestMatch.checked !== undefined)) {
        mapping[formField.index] = { 
          value: bestMatch.value, 
          checked: bestMatch.checked 
        };
        usedProfileFields.add(bestMatch.index);
      }
    }

    return mapping;
  }
};
