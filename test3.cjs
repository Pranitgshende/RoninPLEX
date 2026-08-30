const fetch = require('node-fetch');
(async () => {
    const start = Date.now();
    console.log('Fetching...');
    const url = 'http://127.0.0.1:4173/api/anime/meta/stream?provider=anilist&id=anilist:21&episode=1&contentProvider=gogoanime&language=sub';
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log('Time:', Date.now() - start, 'ms');
        console.log(data);
    } catch(e) {
        console.error(e);
    }
})();
