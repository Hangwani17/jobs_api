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

    // API Base URL - UPDATED
    const API_BASE_URL = 'https://jobs-api-1-pqyy.onrender.com';

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
            
            // Fetch departments from backend - UPDATED URL
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
        
        // UPDATED URL
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
        
        // Reset form
        applicationForm.reset();
        
        // Show modal
        applicationModal.style.display = 'block';
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
        
        const formData = new FormData(applicationForm);
        const submitButton = applicationForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        
        // Show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        
        // UPDATED URL
        fetch(`${API_BASE_URL}/apply`, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || 'Application failed');
                });
            }
            return response.json();
        })
        .then(data => {
            // Show success message
            let successMessage = `
                <div class="application-success">
                    <i class="fas fa-check-circle" style="font-size: 3rem; color: #48bb78;"></i>
                    <h3>Application Submitted Successfully!</h3>
                    <p>Thank you for applying to "${jobTitleElement.textContent}".</p>
            `;
            
            if (data.confirmation_sent) {
                successMessage += `<p><i class="fas fa-envelope"></i> A confirmation email has been sent to your email address.</p>`;
            }
            
            successMessage += `
                    <p>Your application has been forwarded to the hiring team.</p>
                    <p>They will review your qualifications and contact you if you're selected for an interview.</p>
                </div>
            `;
            
            applicationForm.innerHTML = successMessage;
            
            setTimeout(() => {
                applicationModal.style.display = 'none';
                
                // Reset form for next time
                applicationForm.innerHTML = document.getElementById('application-form').innerHTML;
                
                // Reattach event listeners
                applicationForm.addEventListener('submit', handleApplication);
            }, 5000);
        })
        .catch(error => {
            console.error('Application error:', error);
            alert('Error submitting application: ' + error.message);
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        });
    }
});