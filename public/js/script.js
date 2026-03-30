// FRONTEND JAVASCRIPT
// Auto-hide alerts after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
    // Auto-hide alerts
    setTimeout(function() {
        const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
        alerts.forEach(function(alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);
    
    // Confirm delete actions
    const deleteForms = document.querySelectorAll('form[onsubmit*="confirm"]');
    deleteForms.forEach(function(form) {
        form.addEventListener('submit', function(e) {
            if (!confirm('Are you sure you want to delete this item?')) {
                e.preventDefault();
            }
        });
    });
    
    // Format dates
    const dateElements = document.querySelectorAll('.format-date');
    dateElements.forEach(function(el) {
        const date = new Date(el.textContent);
        el.textContent = date.toLocaleDateString();
    });
});

// Search form validation
function validateSearch(form) {
    const searchInput = form.querySelector('input[name="q"]');
    if (searchInput.value.trim() === '') {
        alert('Please enter a search term');
        return false;
    }
    return true;
}

// Borrow book confirmation
function confirmBorrow(bookTitle) {
    return confirm(`Are you sure you want to borrow "${bookTitle}"?`);
}

// Return book confirmation
function confirmReturn(bookTitle) {
    return confirm(`Are you sure you want to return "${bookTitle}"?`);
}

// Password strength indicator
function checkPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]+/)) strength++;
    if (password.match(/[A-Z]+/)) strength++;
    if (password.match(/[0-9]+/)) strength++;
    if (password.match(/[$@#&!]+/)) strength++;
    
    return strength;
}

// Update password strength indicator
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const strength = checkPasswordStrength(this.value);
            const indicator = document.getElementById('password-strength');
            
            if (indicator) {
                let text = 'Weak';
                let color = 'danger';
                
                if (strength >= 4) {
                    text = 'Strong';
                    color = 'success';
                } else if (strength >= 2) {
                    text = 'Medium';
                    color = 'warning';
                }
                
                indicator.innerHTML = `<span class="badge bg-${color}">${text}</span>`;
            }
        });
    }
});