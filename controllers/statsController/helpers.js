/**
 * Human-ish relative time string for the activity feed (English, same logic as before).
 */
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - new Date(date);

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
        return `${diffMinutes} minutes ago`;
    }
    if (diffHours < 24) {
        return `${diffHours} hours ago`;
    }
    return `${diffDays} days ago`;
}

module.exports = {
    getTimeAgo,
};
