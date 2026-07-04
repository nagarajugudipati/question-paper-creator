// js/onboarding.js

window.ONBOARDING_STORAGE_KEY = 'school_exam_creator_onboarding_progress_v5.5';

window.onboardingSteps = [
    {
        id: 1,
        title: "1. Orientation & Introduction",
        desc: "Introduction to sample projects and tasks during the first office visit.",
        visit: "1st Office Visit",
        pay: "Included in base"
    },
    {
        id: 2,
        title: "2. Take Project Ownership (Phase 1)",
        desc: "Develop prototype from zero to Phase 1 launch (minimum required for customer deployment). Ready for school demo.",
        visit: "Remote",
        pay: "₹100 (Ownership Bonus)"
    },
    {
        id: 3,
        title: "3. Deployment & Customer Training",
        desc: "Second office visit to school computer lab. Deploy the app, train teachers/students/staff, and observe feedback.",
        visit: "2nd Office Visit (Paid Travel)",
        pay: "₹100 (Ownership Bonus)"
    },
    {
        id: 4,
        title: "4. Create Phase 2 GitHub Issues",
        desc: "File detailed feature requests, bug reports, and roadmap items in GitHub for the Phase 2 launch.",
        visit: "Remote",
        pay: "Task-based pay"
    },
    {
        id: 5,
        title: "5. Offer Letter Issuance",
        desc: "Receive the official company internship / employment offer letter upon completing Phase 1.",
        visit: "HR Review",
        pay: "Contracts finalized"
    },
    {
        id: 6,
        title: "6. Collect Ownership Bonus (₹100)",
        desc: "Earn ₹100 bonus for ownership, deployment, customer training, and requirement gathering.",
        visit: "Finance Sync",
        pay: "₹100 Bonus"
    },
    {
        id: 7,
        title: "7. Task-Based Pay Activation",
        desc: "Task-based payments commence immediately after the offer letter is officially issued.",
        visit: "Payroll",
        pay: "₹ Variable starts"
    },
    {
        id: 8,
        title: "8. Register on Company Payroll",
        desc: "Add account details to the Razorpay payroll system. (https://payroll.razorpay.com)",
        visit: "Razorpay Link",
        pay: "Payroll active"
    },
    {
        id: 9,
        title: "9. Register on Company Attendance",
        desc: "Get enrolled in the internal attendance and login tracker system.",
        visit: "Portal Setup",
        pay: "Standard track"
    },
    {
        id: 10,
        title: "10. Phase 2 Remote Development",
        desc: "Develop advanced features remotely under task-based milestone pay structure.",
        visit: "Remote",
        pay: "₹ Task-based"
    },
    {
        id: 11,
        title: "11. Third Office Visit (₹150)",
        desc: "Earn ₹150 (with ₹50 increments) for ownership, deployment, and requirement gathering in the 3rd visit.",
        visit: "3rd Office Visit",
        pay: "₹150 Increment"
    },
    {
        id: 12,
        title: "12. Capstone Project Discussion",
        desc: "Discuss and present the final Capstone Project scope after completing 5 office visits.",
        visit: "5th Office Visit",
        pay: "Final review"
    }
];

window.onboardingProgress = {};

window.loadOnboardingState = function() {
    const saved = localStorage.getItem(window.ONBOARDING_STORAGE_KEY);
    if (saved) {
        try {
            window.onboardingProgress = JSON.parse(saved);
        } catch (e) {
            window.onboardingProgress = {};
        }
    } else {
        // Default: Step 1 and 2 completed because we are taking ownership and doing orientation right now!
        window.onboardingProgress = { 1: true, 2: true };
    }
};

window.saveOnboardingState = function() {
    localStorage.setItem(window.ONBOARDING_STORAGE_KEY, JSON.stringify(window.onboardingProgress));
};

window.toggleOnboardingPanel = function() {
    const panel = document.getElementById('onboardingPanel');
    if (panel) {
        panel.classList.toggle('open');
        window.renderOnboardingSteps();
    }
};

window.toggleStepCompletion = function(stepId) {
    window.onboardingProgress[stepId] = !window.onboardingProgress[stepId];
    window.saveOnboardingState();
    window.renderOnboardingSteps();
    
    const count = window.onboardingSteps.filter(s => window.onboardingProgress[s.id]).length;
    window.toast(`📋 Onboarding Progress: ${count} of 12 steps`);
};

window.renderOnboardingSteps = function() {
    const container = document.getElementById('onboardingStepsList');
    if (!container) return;

    let html = '';
    let completedCount = 0;

    window.onboardingSteps.forEach(step => {
        const isCompleted = !!window.onboardingProgress[step.id];
        if (isCompleted) completedCount++;

        html += `
            <div class="onboarding-step-item ${isCompleted ? 'completed' : ''}" onclick="window.toggleStepCompletion(${step.id})">
                <div class="onboarding-checkbox"></div>
                <div class="onboarding-step-content">
                    <span class="onboarding-step-title">${step.title}</span>
                    <span class="onboarding-step-desc">${step.desc}</span>
                    <div class="onboarding-step-badge-row">
                        <span class="onboarding-step-visit">📍 ${step.visit}</span>
                        <span class="onboarding-step-pay">💰 ${step.pay}</span>
                        ${isCompleted ? '<span class="onboarding-step-completed-badge">✓ Completed</span>' : ''}
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Update progress numbers
    const pct = Math.round((completedCount / window.onboardingSteps.length) * 100);
    const completionText = document.getElementById('onboardingCompletionText');
    const fill = document.getElementById('onboardingProgressBarFill');

    if (completionText) {
        completionText.textContent = `${completedCount} / 12 (${pct}%)`;
    }
    if (fill) {
        fill.style.width = `${pct}%`;
    }
};

window.markAttendance = function() {
    const today = new Date().toLocaleDateString();
    localStorage.setItem('onboarding_attendance_last_marked', today);
    window.toast("📅 Attendance marked and synchronized!");
    
    // Automatically complete Step 9 if attendance is marked
    if (!window.onboardingProgress[9]) {
        window.onboardingProgress[9] = true;
        window.saveOnboardingState();
        window.renderOnboardingSteps();
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.loadOnboardingState();
    window.renderOnboardingSteps();
});
