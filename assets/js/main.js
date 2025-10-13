// QHub - Islamic Learning Hub JavaScript

class QHubApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupSmoothScrolling();
        this.setupSearchFunctionality();
        this.setupProgressTracking();
        this.setupMobileMenu();
        this.setupLazyLoading();
        this.trackUserActivity();
    }

    // Smooth scrolling for navigation links
    setupSmoothScrolling() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
    }

    // Search functionality
    setupSearchFunctionality() {
        // Create search box
        const searchHTML = `
            <div class="search-container" style="margin: 20px 0; text-align: center;">
                <input type="text" id="search-input" placeholder="🔍 Search resources..." 
                       style="padding: 12px 20px; font-size: 16px; border: 2px solid #ddd; border-radius: 25px; width: 300px; max-width: 100%;">
                <div id="search-results" style="margin-top: 10px;"></div>
            </div>
        `;
        
        const hero = document.querySelector('.hero .container');
        if (hero) {
            hero.insertAdjacentHTML('beforeend', searchHTML);
        }

        // Search functionality
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                if (query.length < 2) {
                    searchResults.innerHTML = '';
                    return;
                }

                const results = this.searchResources(query);
                this.displaySearchResults(results, searchResults);
            });
        }
    }

    searchResources(query) {
        const results = [];
        const links = document.querySelectorAll('.resource-link');
        
        links.forEach(link => {
            const text = link.textContent.toLowerCase();
            const href = link.getAttribute('href');
            
            if (text.includes(query) || href.toLowerCase().includes(query)) {
                results.push({
                    text: link.textContent,
                    href: href,
                    category: this.getCategoryFromHref(href)
                });
            }
        });

        return results;
    }

    getCategoryFromHref(href) {
        if (href.includes('Arabic/')) return 'Arabic';
        if (href.includes('Quran/')) return 'Qur\'an';
        if (href.includes('Hadith/')) return 'Hadith';
        if (href.includes('Dua/')) return 'Duas';
        if (href.includes('Sirat/')) return 'Sirat';
        return 'Others';
    }

    displaySearchResults(results, container) {
        if (results.length === 0) {
            container.innerHTML = '<p style="color: #666;">No results found</p>';
            return;
        }

        const html = results.slice(0, 5).map(result => `
            <div style="background: white; margin: 5px 0; padding: 10px; border-radius: 5px; border-left: 3px solid #3498db;">
                <a href="${result.href}" style="text-decoration: none; color: #2c3e50;">
                    <span style="font-weight: bold;">${result.text}</span>
                    <small style="color: #666; display: block;">📁 ${result.category}</small>
                </a>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    // Progress tracking for learning
    setupProgressTracking() {
        // Track visited resources
        document.querySelectorAll('.resource-link').forEach(link => {
            link.addEventListener('click', () => {
                this.markAsVisited(link);
                this.saveProgress(link.getAttribute('href'));
            });
        });

        // Load and display previous progress
        this.loadProgress();
    }

    markAsVisited(link) {
        link.style.borderLeft = '4px solid #27ae60';
        link.insertAdjacentHTML('afterbegin', '✅ ');
    }

    saveProgress(href) {
        let visited = JSON.parse(localStorage.getItem('qhub-visited') || '[]');
        if (!visited.includes(href)) {
            visited.push(href);
            localStorage.setItem('qhub-visited', JSON.stringify(visited));
        }
    }

    loadProgress() {
        const visited = JSON.parse(localStorage.getItem('qhub-visited') || '[]');
        visited.forEach(href => {
            const link = document.querySelector(`[href="${href}"]`);
            if (link) {
                this.markAsVisited(link);
            }
        });
    }

    // Mobile menu functionality
    setupMobileMenu() {
        // Add mobile menu toggle
        const nav = document.querySelector('.main-nav .container');
        if (nav && window.innerWidth <= 768) {
            nav.insertAdjacentHTML('afterbegin', `
                <button class="mobile-menu-toggle" style="display: none; background: none; border: none; font-size: 1.5rem; cursor: pointer;">
                    ☰
                </button>
            `);

            const toggle = nav.querySelector('.mobile-menu-toggle');
            const navList = nav.querySelector('.nav-list');

            if (toggle && navList) {
                toggle.style.display = 'block';
                navList.style.display = 'none';

                toggle.addEventListener('click', () => {
                    navList.style.display = navList.style.display === 'none' ? 'flex' : 'none';
                });
            }
        }
    }

    // Lazy loading for better performance
    setupLazyLoading() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('loaded');
                }
            });
        });

        document.querySelectorAll('.resource-card').forEach(card => {
            observer.observe(card);
        });
    }

    // Track user activity for analytics
    trackUserActivity() {
        // Track page views
        const pageData = {
            page: 'index',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };

        // Store in local storage for now (could be sent to analytics service)
        let analytics = JSON.parse(localStorage.getItem('qhub-analytics') || '[]');
        analytics.push(pageData);
        
        // Keep only last 100 entries
        if (analytics.length > 100) {
            analytics = analytics.slice(-100);
        }
        
        localStorage.setItem('qhub-analytics', JSON.stringify(analytics));
    }

    // Utility method to show notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div style="background: ${type === 'success' ? '#27ae60' : '#3498db'}; color: white; padding: 15px; border-radius: 5px; margin: 10px; position: fixed; top: 20px; right: 20px; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                ${message}
                <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; float: right; cursor: pointer; font-size: 18px; margin-left: 10px;">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Utility functions for PDF and image handling
class MediaHandler {
    static openInViewer(href, type = 'auto') {
        const fileExt = href.split('.').pop().toLowerCase();
        
        if (type === 'auto') {
            if (fileExt === 'pdf') type = 'pdf';
            else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) type = 'image';
            else type = 'download';
        }

        switch(type) {
            case 'pdf':
            case 'image':
                window.open(`viewer.html?file=${encodeURIComponent(href)}`, '_blank');
                break;
            case 'download':
                this.downloadFile(href);
                break;
            default:
                window.open(href, '_blank');
        }
    }

    static downloadFile(href) {
        const link = document.createElement('a');
        link.href = href;
        link.download = href.split('/').pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    static previewImage(src, title = '') {
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; justify-content: center; align-items: center; cursor: pointer;" onclick="this.remove()">
                <div style="max-width: 90%; max-height: 90%; position: relative;">
                    <img src="${src}" alt="${title}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                    <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.8); border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 20px;">×</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new QHubApp();
    
    // Add click handlers for PDF and image links
    document.querySelectorAll('.pdf-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            MediaHandler.openInViewer(link.getAttribute('href'), 'pdf');
        });
    });

    document.querySelectorAll('.image-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href.endsWith('.webp') || href.endsWith('.jpg') || href.endsWith('.png')) {
                MediaHandler.previewImage(href, link.textContent);
            } else {
                MediaHandler.openInViewer(href, 'image');
            }
        });
    });

    // Show welcome message
    setTimeout(() => {
        app.showNotification('🌟 Welcome to QHub! Use the search box to find resources quickly.', 'success');
    }, 1000);
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QHubApp, MediaHandler };
}