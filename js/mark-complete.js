// Mark Complete Functionality for Resource Pages
// This script handles marking topics as complete in the Skill Constellation

(async function() {
    // Wait for Supabase client to be ready
    if (!window.supabase) {
        console.error('Supabase client not found');
        return;
    }

    const nodeId = document.body.dataset.nodeId;
    if (!nodeId) {
        console.error('No node ID specified');
        return;
    }

    const button = document.getElementById('mark-complete-btn');
    if (!button) return;

    // Check if user is logged in
    const { data: { user } } = await window.supabase.auth.getUser();
    
    if (!user) {
        button.innerHTML = '🔒 Sign in to track progress';
        button.onclick = () => window.location.href = '/auth.html';
        return;
    }

    // Check if already completed
    const { data: progress } = await window.supabase
        .from('user_progress')
        .select('status')
        .eq('user_id', user.id)
        .eq('node_id', nodeId)
        .single();

    if (progress?.status === 'completed') {
        button.innerHTML = '✅ Completed';
        button.disabled = true;
        button.style.opacity = '0.6';
        button.style.cursor = 'not-allowed';
        return;
    }

    // Mark as complete handler
    button.onclick = async function() {
        try {
            button.disabled = true;
            button.innerHTML = '⏳ Saving...';

            // Save to database
            const { error } = await window.supabase
                .from('user_progress')
                .upsert({
                    user_id: user.id,
                    node_id: nodeId,
                    status: 'completed',
                    completion_date: new Date().toISOString()
                }, {
                    onConflict: 'user_id,node_id'
                });

            if (error) throw error;

            // Success!
            button.innerHTML = '✅ Completed!';
            button.style.opacity = '0.6';
            button.style.cursor = 'not-allowed';

            // Show success message
            showNotification(`🎉 ${nodeId} completed! Check your Knowledge Galaxy!`);

            // Notify parent window to refresh galaxy
            if (window.parent) {
                window.parent.postMessage({ type: 'PROGRESS_UPDATED' }, '*');
            }

        } catch (error) {
            console.error('Error marking complete:', error);
            button.disabled = false;
            button.innerHTML = '❌ Error - Try again';
            setTimeout(() => {
                button.innerHTML = '✅ Mark as Complete';
            }, 3000);
        }
    };

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(90deg, #4c8bf5, #d367c1);
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(76, 139, 245, 0.5);
            z-index: 10000;
            font-size: 16px;
            font-weight: bold;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Add animation styles
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
})();
