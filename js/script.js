/**
 * HADI TELEGRAM MONITORING
 * JavaScript for interactive elements, 3D tilt effects, language switching, and config display
 */

(function() {
    'use strict';

    // ============================================================
    // 0. LANGUAGE STATE
    // ============================================================
    let currentLang = 'en'; // 'en' or 'fa'

    // ============================================================
    // 1. DOM READY
    // ============================================================
    document.addEventListener('DOMContentLoaded', function() {

        // -------- 1.0 Language Toggle --------
        const langToggle = document.getElementById('langToggle');
        const langLabel = langToggle ? langToggle.querySelector('.lang-label') : null;

        // Set initial language (default: English)
        setLanguage('en');

        if (langToggle) {
            langToggle.addEventListener('click', function() {
                const newLang = currentLang === 'en' ? 'fa' : 'en';
                setLanguage(newLang);
                // Update button label
                if (langLabel) {
                    langLabel.textContent = newLang === 'en' ? 'English' : 'فارسی';
                }
                // Update HTML dir and lang attributes
                document.documentElement.lang = newLang === 'en' ? 'en' : 'fa';
                document.documentElement.dir = newLang === 'en' ? 'ltr' : 'rtl';
                
                // Show toast notification
                const msg = newLang === 'en' ? '✅ Language switched to English' : '✅ زبان به فارسی تغییر کرد';
                showToast(msg);
            });
        }

        // -------- 1.1 3D Tilt Effect for Cards and Feature Items --------
        const tiltElements = document.querySelectorAll('.card, .feature-item, .hero');
        
        tiltElements.forEach(el => {
            el.addEventListener('mousemove', function(e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // Calculate rotation (max ±8 degrees for cards, ±5 for hero)
                const maxRotate = this.classList.contains('hero') ? 3 : 8;
                const rotateX = ((y - centerY) / centerY) * maxRotate;
                const rotateY = ((x - centerX) / centerX) * -maxRotate;
                
                // Set CSS custom properties for tilt
                this.style.setProperty('--tilt-x', rotateX + 'deg');
                this.style.setProperty('--tilt-y', rotateY + 'deg');
                
                // For spotlight effect on cards
                if (this.classList.contains('card')) {
                    const spotX = (x / rect.width) * 100;
                    const spotY = (y / rect.height) * 100;
                    this.style.setProperty('--mouse-x', spotX + '%');
                    this.style.setProperty('--mouse-y', spotY + '%');
                }
            });
            
            el.addEventListener('mouseleave', function() {
                this.style.setProperty('--tilt-x', '0deg');
                this.style.setProperty('--tilt-y', '0deg');
                if (this.classList.contains('card')) {
                    this.style.setProperty('--mouse-x', '50%');
                    this.style.setProperty('--mouse-y', '50%');
                }
                this.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                setTimeout(() => {
                    this.style.transition = '';
                }, 400);
            });
        });

        // -------- 1.2 Enhanced 3D Feature Items (with perspective) --------
        const featureItems = document.querySelectorAll('.feature-item');
        featureItems.forEach(item => {
            item.addEventListener('mousemove', function(e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * 6;
                const rotateY = ((x - centerX) / centerX) * -6;
                
                this.style.transform = 
                    `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
                this.style.transition = 'transform 0.05s ease';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.transform = 'perspective(600px) rotateX(0) rotateY(0) scale(1)';
                this.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            });
        });

        // -------- 1.3 Hero Enhanced 3D Glow --------
        const hero = document.querySelector('.hero');
        if (hero) {
            const glow = hero.querySelector('.hero-glow');
            if (glow) {
                hero.addEventListener('mousemove', function(e) {
                    const rect = this.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    glow.style.background = 
                        `radial-gradient(ellipse at ${x}% ${y}%, rgba(108, 140, 255, 0.2), rgba(108, 140, 255, 0.05) 50%, transparent 80%)`;
                });
                hero.addEventListener('mouseleave', function() {
                    glow.style.background = 
                        'radial-gradient(ellipse at 50% 30%, rgba(108, 140, 255, 0.08), transparent 70%)';
                    glow.style.transition = 'background 0.6s ease';
                    setTimeout(() => {
                        glow.style.transition = '';
                    }, 600);
                });
            }
        }

        // -------- 1.4 Scroll-triggered animations (Intersection Observer) --------
        const animatedElements = document.querySelectorAll('.card, .feature-item, .step');
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    // Add a staggered delay based on index
                    const delay = (index % 3) * 0.1;
                    el.style.opacity = '0';
                    el.style.transform = 'translateY(30px) scale(0.95)';
                    el.style.transition = `opacity 0.6s ease ${delay}s, transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s`;
                    
                    requestAnimationFrame(() => {
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0) scale(1)';
                    });
                    
                    observer.unobserve(el);
                }
            });
        }, observerOptions);

        animatedElements.forEach(el => observer.observe(el));

        // -------- 1.5 Smooth scroll for internal links (enhanced) --------
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // -------- 1.6 Interactive badge hover effect (enhanced) --------
        const badges = document.querySelectorAll('.badge');
        badges.forEach(badge => {
            badge.addEventListener('mouseenter', function() {
                this.style.transition = 'transform 0.2s ease, box-shadow 0.3s ease';
                this.style.transform = 'translateY(-5px) scale(1.08) rotateX(5deg)';
            });
            badge.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1) rotateX(0)';
                this.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            });
        });

        // -------- 1.7 Copy command to clipboard (enhanced) --------
        document.querySelectorAll('.cmd, code').forEach(el => {
            if (el.closest('.step') || el.closest('.tip-box') || el.closest('.prereq-list')) {
                el.style.cursor = 'pointer';
                el.title = currentLang === 'en' ? 'Click to copy' : 'کلیک کنید تا کپی شود';
                el.addEventListener('click', function(e) {
                    const text = this.textContent.trim();
                    // Visual feedback
                    this.style.transition = 'transform 0.1s ease';
                    this.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        this.style.transform = 'scale(1)';
                    }, 100);
                    
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(text).then(() => {
                            showToast((currentLang === 'en' ? '✅ Copied: ' : '✅ کپی شد: ') + text);
                        }).catch(() => {
                            fallbackCopy(text);
                        });
                    } else {
                        fallbackCopy(text);
                    }
                });
            }
        });

        // -------- 1.8 Config items expand on click --------
        const configItems = document.querySelectorAll('.config-item');
        configItems.forEach(item => {
            const desc = item.querySelector('.desc');
            if (desc) {
                const fullText = desc.textContent.trim();
                if (fullText.length > 80) {
                    const shortText = fullText.substring(0, 80) + '…';
                    desc.textContent = shortText;
                    desc.style.cursor = 'pointer';
                    desc.title = currentLang === 'en' ? 'Click to expand' : 'برای مشاهده کامل کلیک کنید';
                    let expanded = false;
                    desc.addEventListener('click', function(e) {
                        e.stopPropagation();
                        if (expanded) {
                            this.textContent = shortText;
                            expanded = false;
                        } else {
                            this.textContent = fullText;
                            expanded = true;
                        }
                    });
                }
            }
        });

        // -------- 1.9 Add last updated timestamp --------
        const footer = document.querySelector('.footer .small');
        if (footer) {
            const now = new Date();
            const dateStr = now.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const prefix = currentLang === 'en' ? ' — Last updated: ' : ' — آخرین بروزرسانی: ';
            footer.textContent += prefix + dateStr;
        }

        // -------- 1.10 Enhanced table row effects --------
        const tableRows = document.querySelectorAll('.commands-table tbody tr');
        tableRows.forEach(row => {
            row.addEventListener('mouseenter', function() {
                this.style.backgroundColor = 'rgba(108, 140, 255, 0.06)';
                this.style.transition = 'background-color 0.2s ease, transform 0.2s ease';
                this.style.transform = 'scale(1.01)';
            });
            row.addEventListener('mouseleave', function() {
                this.style.backgroundColor = 'transparent';
                this.style.transform = 'scale(1)';
            });
        });

        // -------- 1.11 Spotlight effect on card hover (using JS) --------
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.addEventListener('mousemove', function(e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const spotX = (x / rect.width) * 100;
                const spotY = (y / rect.height) * 100;
                this.style.setProperty('--mouse-x', spotX + '%');
                this.style.setProperty('--mouse-y', spotY + '%');
            });
        });

        // -------- 1.12 Console greeting --------
        console.log('%c HADI TELEGRAM MONITORING ',
            'background:#0b0d15; color:#6c8cff; font-size:16px; font-weight:bold; padding:6px 12px; border-radius:4px;'
        );
        console.log('%c Documentation v1.0 — Easy Docker Management with Telegram', 'color:#94a3b8; font-size:13px;');
        console.log('%c ✨ 3D Effects & Interactive Animations Enabled', 'color:#6c8cff; font-size:12px;');
        console.log('%c 🌐 Bilingual support: English / فارسی', 'color:#a78bfa; font-size:12px;');

    }); // end DOMContentLoaded

    // ============================================================
    // 2. LANGUAGE SWITCHING FUNCTION
    // ============================================================
    /**
     * Set the page language and update all bilingual elements
     * @param {string} lang - 'en' or 'fa'
     */
    function setLanguage(lang) {
        currentLang = lang;
        
        // Update all elements with data-en and data-fa attributes
        const elements = document.querySelectorAll('[data-en][data-fa]');
        elements.forEach(el => {
            const text = el.getAttribute('data-' + lang);
            if (text) {
                // Preserve inner HTML if it contains tags
                if (el.innerHTML.includes('<')) {
                    el.innerHTML = text;
                } else {
                    el.textContent = text;
                }
            }
        });

        // Update elements with data-en/data-fa that are used as attributes (e.g., title, placeholder)
        const attrElements = document.querySelectorAll('[data-en-title][data-fa-title]');
        attrElements.forEach(el => {
            const title = el.getAttribute('data-' + lang + '-title');
            if (title) {
                el.title = title;
            }
        });

        // Update the language toggle button label
        const langToggle = document.getElementById('langToggle');
        const langLabel = langToggle ? langToggle.querySelector('.lang-label') : null;
        if (langLabel) {
            langLabel.textContent = lang === 'en' ? 'English' : 'فارسی';
        }

        // Update direction for RTL/LTR
        document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
        document.documentElement.lang = lang === 'en' ? 'en' : 'fa';
        
        // Update body direction if needed
        document.body.style.direction = lang === 'en' ? 'ltr' : 'rtl';
        document.body.style.textAlign = lang === 'en' ? 'left' : 'right';
    }

    // ============================================================
    // 3. HELPER FUNCTIONS
    // ============================================================

    /**
     * Fallback copy using a hidden textarea (for older browsers)
     * @param {string} text - Text to copy
     */
    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            const success = document.execCommand('copy');
            if (success) {
                showToast((currentLang === 'en' ? '✅ Copied: ' : '✅ کپی شد: ') + text);
            } else {
                showToast(currentLang === 'en' ? '❌ Copy failed, please copy manually' : '❌ کپی نشد، لطفاً دستی کپی کنید');
            }
        } catch (err) {
            showToast(currentLang === 'en' ? '❌ Error copying' : '❌ خطا در کپی');
        }
        document.body.removeChild(textarea);
    }

    /**
     * Show a temporary toast message at the bottom of the screen
     * @param {string} msg - Message to display
     */
    function showToast(msg) {
        const oldToast = document.querySelector('.toast-message');
        if (oldToast) oldToast.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = msg;
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#131722',
            color: '#e8edf5',
            padding: '12px 24px',
            borderRadius: '12px',
            border: '1px solid #2a2f42',
            boxShadow: '0 10px 40px rgba(0,0,0,0.7)',
            fontFamily: 'Vazir, sans-serif',
            fontSize: '0.95rem',
            zIndex: '9999',
            opacity: '0',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            backdropFilter: 'blur(8px)',
            background: 'rgba(19, 23, 34, 0.92)',
            maxWidth: '90%',
            textAlign: 'center',
            direction: currentLang === 'en' ? 'ltr' : 'rtl'
        });
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 400);
        }, 3500);
    }

    // ============================================================
    // 4. KEYBOARD SHORTCUTS
    // ============================================================
    document.addEventListener('keydown', function(e) {
        // Ctrl+Shift+C : copy all commands
        if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
            e.preventDefault();
            const allCmds = document.querySelectorAll('.cmd');
            const texts = Array.from(allCmds).map(el => el.textContent.trim());
            const combined = texts.join('\n');
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(combined).then(() => {
                    const msg = currentLang === 'en' 
                        ? '✅ All commands copied (' + texts.length + ' items)'
                        : '✅ همه دستورات کپی شد (' + texts.length + ' مورد)';
                    showToast(msg);
                }).catch(() => {
                    fallbackCopy(combined);
                });
            } else {
                fallbackCopy(combined);
            }
        }

        // Ctrl+Shift+L : toggle language
        if (e.ctrlKey && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
            e.preventDefault();
            const newLang = currentLang === 'en' ? 'fa' : 'en';
            setLanguage(newLang);
            const langLabel = document.querySelector('.lang-toggle .lang-label');
            if (langLabel) {
                langLabel.textContent = newLang === 'en' ? 'English' : 'فارسی';
            }
            document.documentElement.lang = newLang === 'en' ? 'en' : 'fa';
            document.documentElement.dir = newLang === 'en' ? 'ltr' : 'rtl';
            const msg = newLang === 'en' ? '✅ Language switched to English' : '✅ زبان به فارسی تغییر کرد';
            showToast(msg);
        }

        // Escape key: dismiss toast
        if (e.key === 'Escape') {
            const toast = document.querySelector('.toast-message');
            if (toast) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(-50%) translateY(20px)';
                setTimeout(() => {
                    if (toast.parentNode) toast.remove();
                }, 400);
            }
        }
    });

})();