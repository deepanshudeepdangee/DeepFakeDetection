// Enhanced interactive features for the deepfake detection app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupDragAndDrop();
    setupFileUpload();
    setupAnimations();
    setupScrollEffects();
    setupInteractiveElements();
    setupLoadingStates();
}

// Enhanced drag and drop functionality
function setupDragAndDrop() {
    const dropZones = document.querySelectorAll('.upload-zone, [data-drop-zone]');
    
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('dragover');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelect({ target: { files } });
            }
        });
    });
}

// Enhanced file upload handling
function setupFileUpload() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        input.addEventListener('change', handleFileSelect);
    });
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please upload an image file (JPG, PNG, or JPEG)', 'error');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('File size should be less than 5MB', 'error');
        return;
    }

    // Show preview with animation
    showImagePreview(file);
    
    // Upload and analyze
    uploadAndAnalyze(file);
}

function showImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('imagePreview');
        const resultPreview = document.getElementById('resultImagePreview');
        const placeholder = document.getElementById('uploadPlaceholder');
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        
        if (preview && resultPreview) {
            preview.src = e.target.result;
            resultPreview.src = e.target.result;
            preview.classList.remove('hidden');
            placeholder.classList.add('hidden');
            
            // Animate preview appearance
            preview.style.animation = 'fadeIn 0.5s ease-out';
        }
        
        if (fileInfo) {
            fileInfo.classList.remove('hidden');
            fileInfo.style.animation = 'slideIn 0.5s ease-out';
            
            if (fileName) fileName.textContent = file.name;
            if (fileSize) fileSize.textContent = formatFileSize(file.size);
        }
    };
    reader.readAsDataURL(file);
}

async function uploadAndAnalyze(file) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultDiv = document.getElementById('result');
    
    if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
        loadingIndicator.style.animation = 'fadeIn 0.3s ease-out';
    }
    
    if (resultDiv) {
        resultDiv.classList.add('hidden');
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        
        if (loadingIndicator) {
            loadingIndicator.classList.add('hidden');
        }
        
        if (resultDiv) {
            resultDiv.classList.remove('hidden');
            resultDiv.style.animation = 'slideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        
        displayResults(data);
        
    } catch (error) {
        console.error('Error:', error);
        if (loadingIndicator) {
            loadingIndicator.classList.add('hidden');
        }
        showNotification('An error occurred while processing the image. Please try again.', 'error');
    }
}

function displayResults(data) {
    const statusSpan = document.getElementById('status');
    const statusIcon = document.getElementById('statusIcon');
    const statusBadge = document.getElementById('statusBadge');
    const confidenceSpan = document.getElementById('confidence');
    const confidenceBar = document.getElementById('confidenceBar');
    const detailsP = document.getElementById('details');
    
    if (data.is_fake) {
        statusSpan.textContent = 'Fake';
        statusSpan.className = 'text-error text-3xl font-bold';
        if (statusBadge) {
            statusBadge.textContent = 'FAKE DETECTED';
            statusBadge.className = 'status-badge fake';
        }
        statusIcon.innerHTML = `
            <svg class="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
        `;
        detailsP.textContent = 'This image shows signs of AI manipulation or deepfake generation. The analysis indicates a high probability of digital alteration.';
    } else {
        statusSpan.textContent = 'Real';
        statusSpan.className = 'text-success text-3xl font-bold';
        if (statusBadge) {
            statusBadge.textContent = 'AUTHENTIC';
            statusBadge.className = 'status-badge real';
        }
        statusIcon.innerHTML = `
            <svg class="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
        `;
        detailsP.textContent = 'This image appears to be authentic with no signs of AI manipulation. The analysis indicates a high probability of being a genuine photograph.';
    }
    
    const confidencePercent = (data.confidence * 100).toFixed(2);
    confidenceSpan.textContent = `${confidencePercent}%`;
    
    // Animate confidence bar
    setTimeout(() => {
        if (confidenceBar) {
            confidenceBar.style.width = `${confidencePercent}%`;
            confidenceBar.style.background = data.is_fake 
                ? 'linear-gradient(90deg, var(--error), #dc2626)' 
                : 'linear-gradient(90deg, var(--success), #059669)';
        }
    }, 300);
    
    // Show success notification
    showNotification(`Analysis complete! Image is ${data.is_fake ? 'fake' : 'real'} with ${confidencePercent}% confidence.`, 'success');
}

// Enhanced animations
function setupAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease-out';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.card, .feature-card, .tech-card, .team-card');
    animatedElements.forEach(el => observer.observe(el));
}

// Scroll effects
function setupScrollEffects() {
    // Parallax effect for floating elements
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const floatingElements = document.querySelectorAll('.floating-element, .floating-shape');
        
        floatingElements.forEach((element, index) => {
            const speed = 0.3 + (index * 0.1);
            element.style.transform = `translateY(${scrolled * speed}px) rotate(${scrolled * 0.1}deg)`;
        });
    });
}

// Interactive elements
function setupInteractiveElements() {
    // Add click handlers to interactive cards
    const interactiveCards = document.querySelectorAll('.feature-card, .tech-card, .team-card, .achievement-card');
    interactiveCards.forEach(card => {
        card.addEventListener('click', () => {
            card.style.animation = 'bounce 0.6s ease-in-out';
            setTimeout(() => {
                card.style.animation = '';
            }, 600);
        });
    });
    
    // Setup analyze again button
    const analyzeAgainBtn = document.getElementById('analyzeAgain');
    if (analyzeAgainBtn) {
        analyzeAgainBtn.addEventListener('click', () => {
            resetForm();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // Setup download report button
    const downloadReportBtn = document.getElementById('downloadReport');
    if (downloadReportBtn) {
        downloadReportBtn.addEventListener('click', downloadReport);
    }
}

function resetForm() {
    const uploadForm = document.getElementById('uploadForm');
    const imagePreview = document.getElementById('imagePreview');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const fileInfo = document.getElementById('fileInfo');
    const result = document.getElementById('result');
    
    if (uploadForm) uploadForm.reset();
    if (imagePreview) imagePreview.classList.add('hidden');
    if (uploadPlaceholder) uploadPlaceholder.classList.remove('hidden');
    if (fileInfo) fileInfo.classList.add('hidden');
    if (result) result.classList.add('hidden');
}

function downloadReport() {
    const status = document.getElementById('status')?.textContent || 'Unknown';
    const confidence = document.getElementById('confidence')?.textContent || '0%';
    const details = document.getElementById('details')?.textContent || 'No details available';
    
    const report = `Deepfake Detection Report\n\nStatus: ${status}\nConfidence: ${confidence}\nDetails: ${details}\n\nGenerated on: ${new Date().toLocaleString()}`;
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deepfake-detection-report.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Report downloaded successfully!', 'success');
}

// Loading states
function setupLoadingStates() {
    // Show loading overlay for long operations
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        // Hide loading overlay after page load
        setTimeout(() => {
            loadingOverlay.classList.remove('active');
        }, 1000);
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 ${
        type === 'error' ? 'bg-red-500 text-white' :
        type === 'success' ? 'bg-green-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 hover:opacity-75">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(full)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Stats animation for home page
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            stat.textContent = Math.floor(current);
        }, 16);
    });
}

// Initialize stats animation when stats section is visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateStats();
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

// Observe stats section if it exists
document.addEventListener('DOMContentLoaded', () => {
    const statsSection = document.querySelector('.stats-container');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }
});

// Export functions for global use
window.showNotification = showNotification;
window.animateStats = animateStats; 