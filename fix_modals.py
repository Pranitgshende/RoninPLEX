import os

modals = [
    'src/components/modals/ApiKeyModal.tsx',
    'src/components/modals/PreferencesModal.tsx',
    'src/components/modals/OnboardingModal.tsx'
]

for p in modals:
    with open(p, 'r', encoding='utf-8') as f:
        c = f.read()

    # Add hook import
    if 'useMotionPresence' not in c:
        c = "import { useMotionPresence } from '../../animation/hooks/useMotionPresence';\n" + c

    # Find where the open state is checked
    # e.g., if (!isModalOpen) return null; or if (!isOnboardingOpen) return null;
    if 'if (!isModalOpen) return null;' in c:
        c = c.replace('if (!isModalOpen) return null;', 'const { ref, shouldRender } = useMotionPresence(isModalOpen, \'slideUp\');\n  if (!shouldRender) return null;')
    elif 'if (!isOnboardingOpen) return null;' in c:
        c = c.replace('if (!isOnboardingOpen) return null;', 'const { ref, shouldRender } = useMotionPresence(isOnboardingOpen, \'slideUp\');\n  if (!shouldRender) return null;')
    
    # Replace first div with ref={ref}
    c = c.replace('<div\n        className="fixed inset-0', '<div ref={ref}\n        className="fixed inset-0')
    
    # Remove tailwind animate classes
    c = c.replace('animate-fade-in', '')
    c = c.replace('animate-slide-up', '')
    
    with open(p, 'w', encoding='utf-8') as f:
        f.write(c)
