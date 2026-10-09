import { spawn } from 'child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9225;

async function run() {
    const p = spawn(CHROME_PATH, [
        `--remote-debugging-port=${DEBUG_PORT}`,
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        'http://localhost:5173/'
    ]);

    await new Promise(r => setTimeout(r, 2500));

    try {
        const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
        const targets = await res.json();
        const pt = targets.find(t => t.type === 'page');
        const ws = new WebSocket(pt.webSocketDebuggerUrl);

        let id = 1;
        const send = (m, params = {}) => new Promise(r => {
            const myId = id++;
            const fn = (e) => {
                const d = JSON.parse(e.data);
                if (d.id === myId) {
                    ws.removeEventListener('message', fn);
                    r(d.result);
                }
            };
            ws.addEventListener('message', fn);
            ws.send(JSON.stringify({ id: myId, method: m, params }));
        });

        await new Promise(r => ws.onopen = r);
        await send('Runtime.enable');
        await new Promise(r => setTimeout(r, 2000));

        // Click Map tab
        await send('Runtime.evaluate', {
            expression: '(() => { const b = Array.from(document.querySelectorAll("button")).find(el => el.innerText.trim().toUpperCase() === "MAP"); if (b) b.click(); })()'
        });
        await new Promise(r => setTimeout(r, 2000));

        const evalRes = await send('Runtime.evaluate', {
            expression: `(() => {
                return {
                    markersCount: document.querySelectorAll('.leaflet-marker-icon').length,
                    tacticalMarkersCount: document.querySelectorAll('.tactical-incident-marker').length,
                    dataAttrCount: document.querySelectorAll('[data-incident-id]').length,
                    paneHTML: document.querySelector('.leaflet-pane.leaflet-marker-pane')?.innerHTML?.slice(0, 500)
                };
            })()`,
            returnByValue: true
        });

        console.log('Marker Inspect Result:', JSON.stringify(evalRes.result.value, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        p.kill();
        process.exit();
    }
}

run();

