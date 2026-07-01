/* ---------- Scroll reveal ---------- */
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.querySelectorAll(
    ".step, .teaser-card, .opp-card, .detail-col, .split-col, .stat, .bridge-divider"
).forEach((el) => el.classList.add("reveal"));

if (prefersReducedMotion) {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in-view"));
} else if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("in-view");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
} else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in-view"));
}

/* ---------- Animated stat counters ---------- */
function animateStat(el) {
    const raw = el.textContent.trim();
    const match = raw.match(/^([^\d]*)([\d,.]+)([^\d]*)$/);
    if (!match) return;

    const [, prefix, numberPart, suffix] = match;
    const hasDecimal = numberPart.includes(".");
    const target = parseFloat(numberPart.replace(/,/g, ""));
    if (Number.isNaN(target)) return;

    const duration = 1000;
    const start = performance.now();

    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;
        const formatted = hasDecimal
            ? current.toFixed(1)
            : Math.round(current).toLocaleString();
        el.textContent = `${prefix}${formatted}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}

const statNumbers = document.querySelectorAll(".stat-number");

if (statNumbers.length) {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
        // Leave static values as-is; nothing to animate.
    } else {
        const statObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animateStat(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );
        statNumbers.forEach((el) => statObserver.observe(el));
    }
}

/* ---------- Theme toggle ---------- */
const themeToggle = document.getElementById("theme-toggle");

if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
}

themeToggle?.addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
});

/* ---------- Mobile nav ---------- */
const navToggle = document.getElementById("nav-toggle");
const navLinks = document.getElementById("nav-links");

navToggle?.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle?.setAttribute("aria-expanded", "false");
    });
});

/* ---------- Auth modal ---------- */
const modalOverlay = document.getElementById("modal-overlay");
const modalClose = document.getElementById("modal-close");
const modalTitle = document.getElementById("modal-title");
const modalTabs = document.querySelectorAll(".modal-tab");
const authForm = document.getElementById("auth-form");
const submitBtn = document.getElementById("submit-btn");
const switchPrompt = document.getElementById("switch-prompt");
const switchBtn = document.getElementById("switch-btn");
const formError = document.getElementById("form-error");
const roleOptions = document.querySelectorAll(".role-option");

let currentMode = "login";
let selectedRole = null;

function setMode(mode) {
    currentMode = mode;
    document.body.classList.toggle("mode-signup", mode === "signup");

    modalTabs.forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.tab === mode);
    });

    if (mode === "login") {
        modalTitle.textContent = "Welcome back";
        submitBtn.textContent = "Log in";
        switchPrompt.textContent = "Don't have an account?";
        switchBtn.textContent = "Sign up";
        document.getElementById("full-name").removeAttribute("required");
    } else {
        modalTitle.textContent = "Create your account";
        submitBtn.textContent = "Sign up";
        switchPrompt.textContent = "Already have an account?";
        switchBtn.textContent = "Log in";
        document.getElementById("full-name").setAttribute("required", "true");
        document.getElementById("password").setAttribute("autocomplete", "new-password");
    }

    formError.hidden = true;
    formError.textContent = "";
}

function openModal(mode, role) {
    setMode(mode || "login");
    if (role) {
        selectedRole = role;
        roleOptions.forEach((btn) => btn.classList.toggle("selected", btn.dataset.roleOption === role));
    }
    modalOverlay.classList.add("open");
    document.body.classList.add("modal-open");
    setTimeout(() => document.getElementById("email")?.focus(), 50);
}

function closeModal() {
    modalOverlay.classList.remove("open");
    document.body.classList.remove("modal-open");
    authForm.reset();
    formError.hidden = true;
    roleOptions.forEach((btn) => btn.classList.remove("selected"));
    selectedRole = null;
}

document.querySelectorAll("[data-modal]").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
        e.preventDefault();
        openModal(trigger.dataset.modal, trigger.dataset.role);
    });
});

modalClose?.addEventListener("click", closeModal);

modalOverlay?.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay?.classList.contains("open")) closeModal();
});

modalTabs.forEach((tab) => {
    tab.addEventListener("click", () => setMode(tab.dataset.tab));
});

switchBtn?.addEventListener("click", () => setMode(currentMode === "login" ? "signup" : "login"));

roleOptions.forEach((btn) => {
    btn.addEventListener("click", () => {
        selectedRole = btn.dataset.roleOption;
        roleOptions.forEach((b) => b.classList.toggle("selected", b === btn));
    });
});

authForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const fullName = document.getElementById("full-name").value.trim();

    if (currentMode === "signup" && !fullName) {
        return showError("Enter your full name to sign up.");
    }
    if (currentMode === "signup" && !selectedRole) {
        return showError("Choose whether you're a club or a sponsor.");
    }
    if (!email || !password) {
        return showError("Fill in both email and password.");
    }
    if (password.length < 8) {
        return showError("Password must be at least 8 characters.");
    }

    // No backend is wired up yet — this simulates a successful auth action.
    submitBtn.disabled = true;
    submitBtn.textContent = currentMode === "login" ? "Logging in..." : "Creating account...";

    setTimeout(() => {
        submitBtn.disabled = false;
        closeModal();
        alert(
            currentMode === "login"
                ? `Welcome back! (demo — no account system connected yet)`
                : `Account created as a ${selectedRole || "user"}! (demo — no account system connected yet)`
        );
    }, 600);
});

function showError(message) {
    formError.textContent = message;
    formError.hidden = false;
}

/* ---------- Opportunities filter (only present on opportunities.html) ---------- */
const filterChips = document.querySelectorAll(".filter-chip");
const oppCards = document.querySelectorAll(".opp-card");
const emptyState = document.getElementById("empty-state");

filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
        filterChips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");

        const filter = chip.dataset.filter;
        let visibleCount = 0;

        oppCards.forEach((card) => {
            const match = filter === "all" || card.dataset.category === filter;
            card.style.display = match ? "" : "none";
            if (match) visibleCount++;
        });

        if (emptyState) emptyState.hidden = visibleCount !== 0;
    });
});
