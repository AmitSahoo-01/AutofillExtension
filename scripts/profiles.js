// Predefined profiles
const defaultBuiltInProfiles = [
  {
    id: 'profile_college',
    type: 'builtin',
    profileName: 'College Profile',
    domain: '*',
    fields: [
      { label: 'Full Name', name: 'fullName', type: 'text', value: 'John Doe' },
      { label: 'Email', name: 'email', type: 'email', value: 'john.doe@college.edu' },
      { label: 'Student ID', name: 'studentId', type: 'text', value: '123456789' },
      { label: 'Major', name: 'major', type: 'text', value: 'Computer Science' },
      { label: 'Graduation Year', name: 'gradYear', type: 'text', value: '2026' }
    ]
  },
  {
    id: 'profile_job',
    type: 'builtin',
    profileName: 'Job Profile',
    domain: '*',
    fields: [
      { label: 'Full Name', name: 'fullName', type: 'text', value: 'John Doe' },
      { label: 'Email', name: 'email', type: 'email', value: 'john.doe@gmail.com' },
      { label: 'Phone', name: 'phone', type: 'text', value: '+1-555-123-4567' },
      { label: 'LinkedIn', name: 'linkedin', type: 'text', value: 'https://linkedin.com/in/johndoe' },
      { label: 'GitHub', name: 'github', type: 'text', value: 'https://github.com/johndoe' },
      { label: 'Portfolio', name: 'portfolio', type: 'text', value: 'https://johndoe.dev' },
      { label: 'Resume Link', name: 'resume', type: 'text', value: 'https://johndoe.dev/resume.pdf' }
    ]
  },
  {
    id: 'profile_freelance',
    type: 'builtin',
    profileName: 'Freelance Profile',
    domain: '*',
    fields: [
      { label: 'Full Name', name: 'fullName', type: 'text', value: 'John Doe' },
      { label: 'Email', name: 'email', type: 'email', value: 'contact@johndoe.dev' },
      { label: 'Hourly Rate', name: 'hourlyRate', type: 'text', value: '$50/hr' },
      { label: 'Website', name: 'website', type: 'text', value: 'https://johndoe.dev' },
      { label: 'Company Name', name: 'companyName', type: 'text', value: 'Doe Tech LLC' }
    ]
  }
];
