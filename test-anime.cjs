const fs = require('fs');

async function testAnime() {
    const API_BASE = 'http://127.0.0.1:4173';
    
    // Test the same logic AnimeStreamService uses
    try {
        console.log("Searching...");
        const searchRes = await fetch(`${API_BASE}/search?q=bleach&provider=gogoanime`);
        const searchData = await searchRes.json();
        console.log("Search result:", searchData[0].id);

        const epsRes = await fetch(`${API_BASE}/content?mediaId=${searchData[0].id}&provider=gogoanime`);
        const epsData = await epsRes.json();
        console.log("Episode 1 ID:", epsData[0].id);

        const streamRes = await fetch(`${API_BASE}/stream?unitId=${encodeURIComponent(epsData[0].id)}&provider=gogoanime`);
        const streamData = await streamRes.json();
        console.log("Stream Data:", Object.keys(streamData), streamData.streams.length, "streams");
        console.log("Stream 0 URL:", streamData.streams[0].url || streamData.streams[0].sourceUrl);

        const url = streamData.streams[0].url || streamData.streams[0].sourceUrl;

        console.log("Validating URL...", url);
        
        const isHLS = url.includes('.m3u8') || url.includes('/proxy?');
        const options = isHLS ? { method: 'HEAD' } : { method: 'GET', headers: { 'Range': 'bytes=0-1000' } };
        
        console.log("Doing HEAD fetch...", options);
        const headRes = await fetch(url, options);
        console.log("HEAD Status:", headRes.status);
        console.log("HEAD Content-Type:", headRes.headers.get('content-type'));

        if (!headRes.ok && isHLS) {
            console.log("Falling back to GET for HLS...");
            const getRes = await fetch(url, { method: 'GET' });
            console.log("GET Status:", getRes.status);
            console.log("GET Content-Type:", getRes.headers.get('content-type'));
            // Get the first few bytes
            const text = await getRes.text();
            console.log("GET Body snippet:", text.substring(0, 100));
        }

    } catch (err) {
        console.error(err);
    }
}

testAnime();
