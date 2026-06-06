document.addEventListener('DOMContentLoaded', async () => {
    const results = await Promise.all([
        fetchJikan('tv'),
        fetchJikan('movie'),
        fetchJikan('ova')
    ]);
    renderItems(results.flat());
});