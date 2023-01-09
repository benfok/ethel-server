
module.exports = {
    formatDate(unix) {
        const date = new Date(unix);
        return date.toISOString();
    }
}