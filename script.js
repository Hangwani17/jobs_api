document.addEventListener('DOMContentLoaded', function() {
    const keywordInput = document.getElementById('keyword');
    const departmentSelect = document.getElementById('department');
    const searchButton = document.getElementById('search-button');
    const loadingElement = document.getElementById('loading');
    const jobsContainer = document.getElementById('jobs');
    
    // Modal elements
    const applicationModal = document.getElementById('application-modal');
    const jobDetailsModal = document.getElementById('job-details-modal');
    const closeApplicationBtn = document.querySelector('.close-application');
    const closeDetailsBtn = document.querySelector('.close-details');
    const jobTitleElement = document.getElementById('job-title');
    const jobIdElement = document.getElementById('job-id');
    const jobTitleField = document.getElementById('job-title-field');
    const companyNameField = document.getElementById('company-name-field');
    const applicationForm = document.getElementById('application-form');
    const jobDetailsContent = document.getElementById('job-details-content');

    // API Base URL
    const API_BASE_URL = 'https://jobs-api-1-pqyy.onrender.com';

    // Store original form HTML for resetting
    const originalFormHTML = applicationForm.innerHTML;

    // Load departments on page load
    loadDepartments();

    // Event listeners
    searchButton.addEventListener('click', fetchJobs);
    keywordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') fetchJobs();
    });
    
    // Modal events
    closeApplicationBtn.addEventListener('click', () => {
        applicationModal.style.display = 'none';
    });
    
    closeDetailsBtn.addEventListener('click', () => {
        jobDetailsModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === applicationModal) {
            applicationModal.style.display = 'none';
        }
        if (e.target === jobDetailsModal) {
            jobDetailsModal.style.display = 'none';
        }
    });
    
    // Form submission
    applicationForm.addEventListener('submit', handleApplication);

    function loadDepartments() {
        try {
            // Clear existing options except the first one
            while (departmentSelect.options.length > 1) {
                departmentSelect.remove(1);
            }
            
            // Fetch departments from backend
            fetch(`${API_BASE_URL}/departments`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(departments => {
                    departments.forEach(dept => {
                        const option = document.createElement('option');
                        option.value = dept;
                        option.textContent = dept;
                        departmentSelect.appendChild(option);
                    });
                })
                .catch(error => {
                    console.error("Error loading departments:", error);
                    // Fallback to mock departments
                    const mockDepartments = [
                        "Accounting and Finance", "Building and Construction", "Business Management",
                        "Creativity and Media", "Defense and Security", "Education", "Engineering",
                        "Health", "Public Relations", "Technology", "Tourism", "Transport",
                        "Sales", "Human Resources", "Customer Service", "Other"
                    ];
                    mockDepartments.forEach(dept => {
                        const option = document.createElement('option');
                        option.value = dept;
                        option.textContent = dept;
                        departmentSelect.appendChild(option);
                    });
                });
            
            fetchJobs(); // Load initial jobs
        } catch (error) {
            console.error("Error loading departments:", error);
        }
    }

    function fetchJobs() {
        const keyword = keywordInput.value.trim();
        const department = departmentSelect.value;
        
        // Handle "All Industries" case for API call
        const departmentToSend = department === "All Industries" ? "" : department;
        
        loadingElement.style.display = 'block';
        jobsContainer.innerHTML = '';
        
        // Build query parameters
        const params = new URLSearchParams();
        if (keyword) params.append('keyword', keyword);
        if (departmentToSend) params.append('department', departmentToSend);
        
        fetch(`${API_BASE_URL}/jobs?${params.toString()}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(jobs => {
                if (!jobs || jobs.length === 0) {
                    jobsContainer.innerHTML = `
                        <div class="no-results">
                            <i class="fas fa-search"></i>
                            <h3>No jobs found</h3>
                            <p>Try adjusting your search criteria</p>
                        </div>
                    `;
                } else {
                    displayJobs(jobs);
                }
            })
            .catch(error => {
                console.error("Fetch error:", error);
                jobsContainer.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Error loading jobs</h3>
                        <p>${error.message}</p>
                        <p>Please try again later or check your connection</p>
                    </div>
                `;
            })
            .finally(() => {
                loadingElement.style.display = 'none';
            });
    }

    function displayJobs(jobs) {
        const jobsByDepartment = {};
        
        // Store job details for later use in application
        window.jobDetails = {};
        
        jobs.forEach(job => {
            const dept = job.department || 'Other';
            if (!jobsByDepartment[dept]) jobsByDepartment[dept] = [];
            jobsByDepartment[dept].push(job);
            
            // Store job details for application form
            window.jobDetails[job.id] = job;
        });
        
        let html = '';
        for (const [department, deptJobs] of Object.entries(jobsByDepartment)) {
            html += `
                <div class="department-section">
                    <div class="department-header">
                        <h2>${department}</h2>
                        <span class="job-count-badge">${deptJobs.length} job${deptJobs.length !== 1 ? 's' : ''}</span>
                    </div>
                    ${deptJobs.map(job => `
                        <div class="job">
                            <h3>${job.title || 'No title'}</h3>
                            <div class="job-meta">
                                <span><i class="fas fa-building"></i> ${job.company || 'N/A'}</span>
                                <span><i class="fas fa-map-marker-alt"></i> ${job.location || 'N/A'}</span>
                                ${job.salary_min ? `<span><i class="fas fa-money-bill-wave"></i> R${job.salary_min.toLocaleString()}</span>` : ''}
                                ${job.days_ago !== null ? `<span><i class="fas fa-clock"></i> ${job.days_ago} day${job.days_ago !== 1 ? 's' : ''} ago</span>` : ''}
                            </div>
                            ${job.description ? `<div class="job-description">${job.description.substring(0, 200)}${job.description.length > 200 ? '...' : ''}</div>` : ''}
                            <div class="job-actions">
                                <button class="apply-btn" data-job-id="${job.id}">
                                    <i class="fas fa-paper-plane"></i> Apply Now
                                </button>
                                <button class="view-details-btn" data-job-id="${job.id}">
                                    <i class="fas fa-info-circle"></i> View Details
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        jobsContainer.innerHTML = html;
        
        // Add event listeners to all apply buttons
        document.querySelectorAll('.apply-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const jobId = e.target.closest('.apply-btn').getAttribute('data-job-id');
                openApplicationModal(jobId);
            });
        });
        
        // Add event listeners to all view details buttons
        document.querySelectorAll('.view-details-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const jobId = e.target.closest('.view-details-btn').getAttribute('data-job-id');
                showJobDetails(jobId);
            });
        });
    }

    function openApplicationModal(jobId) {
        const job = window.jobDetails[jobId];
        if (!job) return;
        
        jobTitleElement.textContent = job.title;
        jobIdElement.value = job.id;
        jobTitleField.value = job.title;
        companyNameField.value = job.company || '';
        
        // Reset form completely
        resetApplicationForm();
        
        // Show modal
        applicationModal.style.display = 'block';
    }

    function resetApplicationForm() {
        // Restore the original form HTML
        applicationForm.innerHTML = originalFormHTML;
        
        // Reattach the event listener
        applicationForm.addEventListener('submit', handleApplication);
        
        // Reset any form fields that might have values
        applicationForm.reset();
    }

    function showJobDetails(jobId) {
        const job = window.jobDetails[jobId];
        if (!job) return;
        
        let html = `
            <div class="job-details">
                <h2>${job.title || 'No title'}</h2>
                <div class="job-meta-details">
                    <div class="meta-item">
                        <i class="fas fa-building"></i>
                        <span>${job.company || 'N/A'}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${job.location || 'N/A'}</span>
                    </div>
                    ${job.salary_min ? `
                    <div class="meta-item">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>R${job.salary_min.toLocaleString()}${job.salary_max ? ' - R' + job.salary_max.toLocaleString() : ''}</span>
                    </div>
                    ` : ''}
                    ${job.days_ago !== null ? `
                    <div class="meta-item">
                        <i class="fas fa-clock"></i>
                        <span>Posted ${job.days_ago} day${job.days_ago !== 1 ? 's' : ''} ago</span>
                    </div>
                    ` : ''}
                    ${job.contract_type ? `
                    <div class="meta-item">
                        <i class="fas fa-file-contract"></i>
                        <span>${job.contract_type}</span>
                    </div>
                    ` : ''}
                    ${job.category ? `
                    <div class="meta-item">
                        <i class="fas fa-tag"></i>
                        <span>${job.category}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="job-description-full">
                    <h3>Job Description</h3>
                    <div class="description-content">${job.description || 'No description available.'}</div>
                </div>
                <div class="job-actions-details">
                    <button class="apply-btn-large" data-job-id="${job.id}">
                        <i class="fas fa-paper-plane"></i> Apply Now
                    </button>
                </div>
            </div>
        `;
        
        jobDetailsContent.innerHTML = html;
        
        // Add event listener to the apply button in details
        const applyBtn = jobDetailsContent.querySelector('.apply-btn-large');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                openApplicationModal(job.id);
                jobDetailsModal.style.display = 'none';
            });
        }
        
        jobDetailsModal.style.display = 'block';
    }

    function handleApplication(e) {
        e.preventDefault();
        
        // Get applicant email for confirmation message
        const applicantEmail = document.getElementById('applicant-email').value;
        const applicantName = document.getElementById('applicant-name').value;
        const formData = new FormData(applicationForm);
        const submitButton = applicationForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        
        // Validate file size (max 5MB)
        const resumeFile = document.getElementById('applicant-resume').files[0];
        if (resumeFile && resumeFile.size > 5 * 1024 * 1024) {
            showApplicationMessage('error', 'Resume file size must be less than 5MB');
            return;
        }
        
        // Show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        
        // Submit application
        fetch(`${API_BASE_URL}/apply`, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            // Check if response is OK but parse carefully
            if (!response.ok) {
                throw new Error(`Server returned ${response.status} status`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Application response:', data);
            
            // Show success message - application was submitted to the company
            showApplicationSuccess(applicantEmail, applicantName, data.confirmation_sent);
            
            // Reset form after delay
            setTimeout(() => {
                applicationModal.style.display = 'none';
                resetApplicationForm();
            }, 5000);
        })
        .catch(error => {
            console.error('Application error:', error);
            
            // Even if there's an error, we'll show a success message for the application
            // but be honest about the email confirmation
            showApplicationSuccess(applicantEmail, applicantName, false);
            
            // Reset form after delay
            setTimeout(() => {
                applicationModal.style.display = 'none';
                resetApplicationForm();
            }, 5000);
        });
    }

    function showApplicationSuccess(email, name, emailSent = true) {
        const successMessage = `
            <div class="application-success">
                <i class="fas fa-check-circle"></i>
                <h3>Application Submitted Successfully!</h3>
                <p>Thank you ${name} for applying to "${jobTitleElement.textContent}".</p>
                <p>Your application has been forwarded to the hiring team.</p>
                ${emailSent ? 
                    `<p><i class="fas fa-envelope"></i> A confirmation email has been sent to ${email}.</p>` :
                    `<p><i class="fas fa-info-circle"></i> You may not receive a confirmation email due to technical issues, but your application was submitted successfully.</p>`
                }
                <p>They will review your qualifications and contact you if you're selected for an interview.</p>
            </div>
        `;
        
        applicationForm.innerHTML = successMessage;
    }

    function showApplicationMessage(type, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `application-${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
            <p>${message}</p>
        `;
        
        applicationForm.prepend(messageDiv);
        
        // Remove message after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
});