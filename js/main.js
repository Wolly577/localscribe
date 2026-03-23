/**
 * Stripe Checkout - Redirects to Stripe payment page
 */
const _lang = document.documentElement.lang === 'en' ? 'en' : 'de';
const _i18n = {
    de: {
        loading:       'Wird geladen…',
        btnDefault:    'Jetzt für 39 € sichern',
        errorAlert:    'Der Checkout konnte gerade nicht gestartet werden. Es wurde keine Bestellung abgeschlossen. Bitte versuchen Sie es erneut oder schreiben Sie an support@localscribe.de.',
        consentMissing:'Bitte bestätigen Sie zuerst den Widerrufsverzicht.',
        menuOpen:      'Menü öffnen',
    },
    en: {
        loading:       'Loading…',
        btnDefault:    'Get LocalScribe for €39',
        errorAlert:    'Checkout could not be started. No order has been placed. Please try again or contact support@localscribe.de.',
        consentMissing:'Please confirm the cancellation waiver first.',
        menuOpen:      'Open menu',
    }
};
const _t = _i18n[_lang];

async function startCheckout() {
    const checkbox = document.getElementById('widerruf-checkbox');
    const button = document.getElementById('checkout-button');

    // Hard-validate consent — never trust only the visual state
    if (!checkbox || !checkbox.checked) {
        alert(_t.consentMissing);
        return;
    }

    if (button) {
        button.textContent = _t.loading;
        button.style.pointerEvents = 'none';
    }

    try {
        const response = await fetch('https://lokalskribe-licenses.martin-schmid5.workers.dev/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                widerruf_consent: true,
                widerruf_consent_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error('Checkout fehlgeschlagen');
        }
        const data = await response.json();
        if (!data.url) {
            throw new Error('No checkout URL received');
        }
        const redirectUrl = new URL(data.url);
        if (redirectUrl.hostname !== 'checkout.stripe.com') {
            throw new Error('Ungültige Weiterleitungs-URL');
        }
        window.location.href = redirectUrl.href;
    } catch (error) {
        console.error('Checkout error:', error);
        if (button) {
            button.textContent = _t.btnDefault;
            button.style.pointerEvents = '';
        }
        alert(_t.errorAlert);
    }
}

/**
 * main.js - Core functionality for LocalScribe Website
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Mobile Hamburger Menu ---
    const setupMobileMenu = () => {
        const navbar = document.querySelector('.navbar .container');
        if (!navbar) return;

        // Check if hamburger already exists (avoid duplicates)
        if (!document.querySelector('.hamburger')) {
            const hamburger = document.createElement('button');
            hamburger.className = 'hamburger';
            hamburger.setAttribute('aria-label', _t.menuOpen);
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.setAttribute('aria-controls', 'nav-menu');
            hamburger.innerHTML = `
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
            `;

            // Insert before the nav-links
            const navLinks = document.querySelector('.nav-links');
            if (navLinks && !navLinks.id) navLinks.id = 'nav-menu';
            navbar.insertBefore(hamburger, navLinks);

            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                const isOpen = navLinks.classList.toggle('active');
                document.body.classList.toggle('menu-open', isOpen);
                hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });

            // Close menu when clicking a link
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('active');
                    document.body.classList.remove('menu-open');
                });
            });
        }
    };

    // --- Scroll Reveal Animations ---
    const setupScrollReveal = () => {
        const elementsToReveal = document.querySelectorAll('.feature-card, .pricing-card, .faq-item, .section-header, .trust-badge, .table-container');
        elementsToReveal.forEach((el, index) => {
            el.classList.add('reveal');
            if (el.classList.contains('feature-card')) {
                const delayIndex = (index % 4) + 1;
                el.classList.add(`delay-${delayIndex}00`);
            }
        });

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    };

    // --- Smooth Scrolling for Anchor Links ---
    const setupSmoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    const headerOffset = 80;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: prefersReducedMotion ? 'auto' : 'smooth'
                    });
                }
            });
        });
    };

    // --- FAQ Collapsible ---
    const setupFaqToggle = () => {
        document.querySelectorAll('.faq-question').forEach(button => {
            button.addEventListener('click', () => {
                const faqItem = button.closest('.faq-item');
                const answer = faqItem.querySelector('.faq-answer');
                const isOpen = faqItem.classList.contains('faq-open');

                // Close all other FAQ items
                document.querySelectorAll('.faq-item.faq-open').forEach(item => {
                    if (item !== faqItem) {
                        item.classList.remove('faq-open');
                        item.querySelector('.faq-answer').style.maxHeight = null;
                        item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                    }
                });

                // Toggle current item
                if (isOpen) {
                    faqItem.classList.remove('faq-open');
                    answer.style.maxHeight = null;
                    button.setAttribute('aria-expanded', 'false');
                } else {
                    faqItem.classList.add('faq-open');
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                    button.setAttribute('aria-expanded', 'true');
                }
            });
        });
    };

    // --- Widerruf Checkbox → Kauf-Button Aktivierung ---
    const setupWiderrufCheckbox = () => {
        const checkbox = document.getElementById('widerruf-checkbox');
        const button = document.getElementById('checkout-button');
        if (!checkbox || !button) return;

        const wrapper = document.getElementById('checkout-wrapper');
        const hint = document.getElementById('checkout-hint');

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                button.style.opacity = '1';
                button.style.pointerEvents = '';
                if (hint) hint.classList.remove('visible');
            } else {
                button.style.opacity = '0.5';
                button.style.pointerEvents = 'none';
            }
        });

        if (wrapper && hint) {
            wrapper.addEventListener('click', () => {
                if (!checkbox.checked) {
                    hint.classList.add('visible');
                    clearTimeout(wrapper._hintTimeout);
                    wrapper._hintTimeout = setTimeout(() => hint.classList.remove('visible'), 3000);
                }
            });
            wrapper.addEventListener('mouseenter', () => {
                if (!checkbox.checked) hint.classList.add('visible');
            });
            wrapper.addEventListener('mouseleave', () => {
                if (!checkbox.checked) hint.classList.remove('visible');
            });
        }
    };

    // --- "Ich bin..." Berufsgruppen-Chips ---
    const setupIchBin = () => {
        const roleTexts = {
            therapeut:  'Sitzungsnotizen in Minuten statt Stunden. Patientendaten verlassen Ihren Rechner nie. § 203 StGB konform.',
            anwalt:     'Mandantengespräche sicher dokumentieren – ohne AVV, ohne Cloud. Ihre anwaltliche Schweigepflicht ist geschützt.',
            student:    'Vorlesungen und Interviews automatisch transkribieren – kein Abo, einmal zahlen, immer nutzen.',
            journalist: 'Interviews in Minuten transkribieren. Quellenschutz durch 100 % Offline-Betrieb – keine Daten in der Cloud.',
            arzt:           'Arztbriefe, Befunde und Diktate – alles lokal verarbeitet. Kein Datentransfer, keine DSGVO-Risiken.',
            'remote-worker':  'Als Remote-Worker brauchen Sie verlässliche Meeting-Protokolle. LocalScribe transkribiert Ihre Zoom- und Teams-Aufnahmen vollständig offline — Ihre Gesprächsinhalte bleiben vertraulich.',
            'content-creator':'Als Content Creator können Sie Podcasts, YouTube-Videos und Interviews transkribieren — für Untertitel, Blogposts oder Show Notes. Einmal zahlen, unbegrenzt nutzen.',
            datenschutz:      'Sie legen Wert auf Datenschutz und wollen Ihre Gespräche nicht in die Cloud schicken. LocalScribe verarbeitet alles lokal auf Ihrem PC — ohne Datenübertragung an externe Server.'
        };

        const chips = document.querySelectorAll('.ich-bin-chip');
        const panel = document.getElementById('ich-bin-panel');
        const textEl = document.getElementById('ich-bin-text');
        if (!chips.length || !panel || !textEl) return;

        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                const role = chip.dataset.role;
                if (chip.classList.contains('active')) {
                    chip.classList.remove('active');
                    panel.hidden = true;
                    return;
                }
                chips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                textEl.textContent = roleTexts[role] || '';
                panel.hidden = false;
                const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                panel.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
            });
        });
    };

    // --- Checkout Button Event Listener ---
    const checkoutBtn = document.getElementById('checkout-button');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', startCheckout);
    }

    // Initialize all modules
    setupMobileMenu();
    setupScrollReveal();
    setupSmoothScroll();
    setupFaqToggle();
    setupWiderrufCheckbox();
    setupIchBin();
});

// --- Professional Benachrichtigungs-Formular ---
function handleNotifySubmit(event) {
    event.preventDefault();
    const emailInput = document.getElementById('notify-email');
    const email = emailInput ? emailInput.value.trim() : '';
    if (!email) return;

    const form = document.getElementById('notify-form');

    // Honeypot Spam-Schutz
    const hpNotify = document.getElementById('hp-field-notify');
    if (hpNotify && hpNotify.value) {
        // Stille Erfolgsantwort — Bot soll denken es hat geklappt
        if (form) {
            const successMsg = _lang === 'en'
                ? '✓ Email saved! We\'ll notify you when the Professional Edition is available.'
                : '✓ E-Mail gespeichert! Wir benachrichtigen Sie, sobald die Professional Edition verfügbar ist.';
            form.innerHTML = `<p style="color: #4ade80; font-size: 0.9rem; font-weight: 600; background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.25); border-radius: 8px; padding: 10px 14px;">${successMsg}</p>`;
        }
        return;
    }

    fetch('https://lokalskribe-licenses.martin-schmid5.workers.dev/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'professional_waitlist' })
    }).then(res => {
        if (!res.ok) {
            const errorMsg = _lang === 'en'
                ? 'An error occurred. Please try again later.'
                : 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
            if (form) {
                form.innerHTML = `<p style="color: #f87171; font-size: 0.9rem; font-weight: 600; background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.25); border-radius: 8px; padding: 10px 14px;">${errorMsg}</p>`;
            }
            return;
        }
        const successMsg2 = _lang === 'en'
            ? '✓ Email saved! We\'ll notify you when the Professional Edition is available.'
            : '✓ E-Mail gespeichert! Wir benachrichtigen Sie, sobald die Professional Edition verfügbar ist.';
        if (form) {
            form.innerHTML = `<p style="color: #4ade80; font-size: 0.9rem; font-weight: 600; background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.25); border-radius: 8px; padding: 10px 14px;">${successMsg2}</p>`;
        }
    }).catch(() => {
        const errorMsg = _lang === 'en'
            ? 'An error occurred. Please try again later.'
            : 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
        if (form) {
            form.innerHTML = `<p style="color: #f87171; font-size: 0.9rem; font-weight: 600; background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.25); border-radius: 8px; padding: 10px 14px;">${errorMsg}</p>`;
        }
    });
}

// --- Newsletter-Formular (Footer) ---
function handleNewsletterSubmit(event) {
    event.preventDefault();
    const emailInput = document.getElementById('newsletter-email');
    const email = emailInput ? emailInput.value.trim() : '';
    if (!email) return;

    // Honeypot Spam-Schutz
    const hpNewsletter = document.getElementById('hp-field');
    if (hpNewsletter && hpNewsletter.value) {
        // Stille Erfolgsantwort — Bot soll denken es hat geklappt
        const form = document.getElementById('newsletter-form');
        if (form) {
            form.innerHTML = '<p style="color: #4ade80; font-size: 0.875rem; font-weight: 600; background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.25); border-radius: 8px; padding: 10px 14px;">✓ Angemeldet! Sie erhalten Updates zu LocalScribe.</p>';
        }
        return;
    }

    const form = document.getElementById('newsletter-form');
    fetch('https://lokalskribe-licenses.martin-schmid5.workers.dev/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'newsletter' })
    }).then(res => {
        if (!res.ok) {
            const errorMsg = _lang === 'en'
                ? 'An error occurred. Please try again later.'
                : 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
            if (form) {
                form.innerHTML = `<p style="color: #f87171; font-size: 0.875rem; font-weight: 600; background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.25); border-radius: 8px; padding: 10px 14px;">${errorMsg}</p>`;
            }
            return;
        }
        const successMsg = _lang === 'en'
            ? '✓ Subscribed! You\'ll receive updates about LocalScribe.'
            : '✓ Angemeldet! Sie erhalten Updates zu LocalScribe.';
        if (form) {
            form.innerHTML = `<p style="color: #4ade80; font-size: 0.875rem; font-weight: 600; background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.25); border-radius: 8px; padding: 10px 14px;">${successMsg}</p>`;
        }
    }).catch(() => {
        const errorMsg = _lang === 'en'
            ? 'An error occurred. Please try again later.'
            : 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
        if (form) {
            form.innerHTML = `<p style="color: #f87171; font-size: 0.875rem; font-weight: 600; background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.25); border-radius: 8px; padding: 10px 14px;">${errorMsg}</p>`;
        }
    });
}
