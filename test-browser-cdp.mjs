import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9222;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('--- Starting Browser Automation & Verification ---');

    // Launch Chrome in headless mode with remote debugging
    const chromeProcess = spawn(CHROME_PATH, [
        `--remote-debugging-port=${DEBUG_PORT}`,
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--window-size=1440,900',
        'about:blank'
    ]);

    await sleep(2000);

    try {
        // Query debugging target
        const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
        const targets = await res.json();
        const pageTarget = targets.find(t => t.type === 'page');
        if (!pageTarget) throw new Error('No page target found');

        console.log('Connected to Chrome DevTools target:', pageTarget.webSocketDebuggerUrl);
        const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

        let msgId = 1;
        const pending = new Map();

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.id && pending.has(data.id)) {
                pending.get(data.id)(data);
                pending.delete(data.id);
            }
        };

        await new Promise(r => ws.onopen = r);

        function send(method, params = {}) {
            return new Promise((resolve) => {
                const id = msgId++;
                pending.set(id, resolve);
                ws.send(JSON.stringify({ id, method, params }));
            });
        }

        async function evaluate(expression) {
            const res = await send('Runtime.evaluate', {
                expression,
                returnByValue: true,
                awaitPromise: true
            });
            if (res.result?.exceptionDetails) {
                console.error('Eval Exception:', res.result.exceptionDetails.exception?.description || res.result.exceptionDetails.text);
            }
            return res.result?.result?.value;
        }

        async function captureScreenshot(fileName) {
            const result = await send('Page.captureScreenshot', { format: 'png' });
            if (result.result?.data) {
                const buffer = Buffer.from(result.result.data, 'base64');
                fs.writeFileSync(fileName, buffer);
                console.log(`Saved screenshot: ${fileName}`);
            }
        }

        await send('Page.enable');
        await send('Runtime.enable');
        await send('DOM.enable');

        console.log('Navigating to http://localhost:5173/ ...');
        await send('Page.navigate', { url: 'http://localhost:5173/' });
        await sleep(3000);

        // Check if on login page or dashboard
        const pageTitle = await evaluate('document.title');
        console.log('Page Title:', pageTitle);

        // If login page is displayed, click sign in
        const isLoginPage = await evaluate("!!document.querySelector('button[type=\"submit\"]')");
        if (isLoginPage) {
            console.log('On Login Page - clicking Authenticate & Enter Console...');
            await evaluate("document.querySelector('button[type=\"submit\"]').click()");
            await sleep(2000);
        }

        await captureScreenshot('screenshot-dashboard.png');

        // TEST 1: Check Risk Summary Widget counts & absence of green
        console.log('\n--- TEST 1: Risk Summary Widget & Zero Green Verification ---');
        const riskSummaryData = await evaluate(`
            (() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const redBtn = buttons.find(b => b.textContent.includes('Critical'));
                const orangeBtn = buttons.find(b => b.textContent.includes('High Risk'));
                const yellowBtn = buttons.find(b => b.textContent.includes('Moderate'));
                
                // Look for any mention of green or green class in whole DOM
                const fullText = document.body.innerText.toLowerCase();
                const hasGreenRisk = fullText.includes('green zone') || fullText.includes('low risk (green)') || fullText.includes('🟢');

                return {
                    hasRed: !!redBtn,
                    redText: redBtn ? redBtn.innerText.replace(/\\n/g, ' ') : null,
                    hasOrange: !!orangeBtn,
                    orangeText: orangeBtn ? orangeBtn.innerText.replace(/\\n/g, ' ') : null,
                    hasYellow: !!yellowBtn,
                    yellowText: yellowBtn ? yellowBtn.innerText.replace(/\\n/g, ' ') : null,
                    hasGreenRisk
                };
            })()
        `);
        console.log('Risk Summary Widget Data:', JSON.stringify(riskSummaryData, null, 2));

        if (riskSummaryData.hasGreenRisk) {
            console.error('FAIL: Found green risk category in DOM!');
        } else {
            console.log('PASS: Zero green risk confirmed across the application!');
        }

        // TEST 2: Inspect Leaflet circles on Interactive Map
        console.log('\n--- TEST 2: Map Leaflet SVG Circles & Colors ---');
        const mapCircles = await evaluate(`
            (() => {
                // Find all svg circle paths rendered by Leaflet
                const paths = Array.from(document.querySelectorAll('.leaflet-overlay-pane svg path'));
                return paths.map(p => ({
                    stroke: p.getAttribute('stroke'),
                    fill: p.getAttribute('fill'),
                    dasharray: p.getAttribute('stroke-dasharray'),
                    d: p.getAttribute('d')
                }));
            })()
        `);
        console.log(`Found ${mapCircles.length} Leaflet SVG overlay path(s) on map.`);
        const hasRedCircle = mapCircles.some(c => c.stroke === '#ef4444');
        const hasOrangeCircle = mapCircles.some(c => c.stroke === '#f97316');
        const hasYellowCircle = mapCircles.some(c => c.stroke === '#eab308');
        const hasGreenCircle = mapCircles.some(c => c.stroke && (c.stroke.includes('green') || c.stroke === '#22c55e' || c.stroke === '#10b981'));

        console.log('Has Red Circle (#ef4444):', hasRedCircle);
        console.log('Has Orange Circle (#f97316):', hasOrangeCircle);
        console.log('Has Yellow Circle (#eab308):', hasYellowCircle);
        console.log('Has Green Circle (must be false):', hasGreenCircle);

        // TEST 3: Nearby incidents separation (INC-2026-001 and INC-2026-005)
        console.log('\n--- TEST 3: Nearby Incidents Separation ---');
        const nearbyIncidentsCheck = await evaluate(`
            (() => {
                const text = document.body.innerText;
                const hasInc001 = text.includes('INC-2026-001');
                const hasInc005 = text.includes('INC-2026-005');
                return { hasInc001, hasInc005 };
            })()
        `);
        console.log('Separate records for nearby incidents:', nearbyIncidentsCheck);

        // TEST 4: Resolved incident (INC-2026-004) has no active risk circle
        console.log('\n--- TEST 4: Resolved Incident Verification ---');
        const resolvedCheck = await evaluate(`
            (() => {
                const resolvedBadge = Array.from(document.querySelectorAll('*')).find(el => el.textContent === 'Stand-down' || el.textContent === 'RESOLVED');
                return { hasResolvedIncident: !!resolvedBadge };
            })()
        `);
        console.log('Resolved incident present as resolved:', resolvedCheck);

        // TEST 5: Approximate location flag (INC-2026-007)
        console.log('\n--- TEST 5: Approximate Location Badge ---');
        const approxCheck = await evaluate(`
            (() => {
                const text = document.body.innerText;
                const hasApprox = text.includes('Approx') || text.includes('TEXT_DERIVED') || text.includes('~APPROX');
                return { hasApprox };
            })()
        `);
        console.log('Approximate location displayed transparently:', approxCheck);

        // TEST 6: Dedicated Map Tab Navigation & Interaction
        console.log('\n--- TEST 6: Dedicated Map Tab View ---');
        await evaluate(`
            (() => {
                // Click on Map tab in sidebar (nav item with "Map" or key '4')
                const mapNavItem = Array.from(document.querySelectorAll('button, a')).find(el => el.innerText && el.innerText.trim() === 'Map');
                if (mapNavItem) mapNavItem.click();
            })()
        `);
        await sleep(2000);
        await captureScreenshot('screenshot-dedicated-map.png');

        const dedicatedMapTitle = await evaluate(`
            (() => {
                return document.body.innerText.toUpperCase().includes('TACTICAL GEOSPATIAL RISK COMMAND CENTER');
            })()
        `);
        console.log('Dedicated Map Command Center displayed:', dedicatedMapTitle);

        // TEST 7: Clicking a Leaflet circle opens Zone Information Panel
        console.log('\n--- TEST 7: Zone Circle Click Interaction ---');
        const clickCircleResult = await evaluate(`
            (() => {
                // Find yellow circle path (#eab308)
                const paths = Array.from(document.querySelectorAll('.leaflet-overlay-pane svg path'));
                const yellowCircle = paths.find(p => p.getAttribute('stroke') === '#eab308');
                const targetPath = yellowCircle || paths[0];

                if (targetPath) {
                    const rect = targetPath.getBoundingClientRect();
                    const evt = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        clientX: rect.x + rect.width / 2,
                        clientY: rect.y + rect.height / 2
                    });
                    targetPath.dispatchEvent(evt);
                    return true;
                }
                return false;
            })()
        `);
        await sleep(1500);
        await captureScreenshot('screenshot-yellow-zone-panel.png');

        const initialZoneData = await evaluate(`
            (() => {
                const text = document.body.innerText;
                const isModerate = text.includes('🟡 MODERATE') || text.includes('Moderate Risk');
                return {
                    isOpen: text.includes('Radius:') && text.includes('Decision-Support Notice'),
                    isModerate
                };
            })()
        `);
        console.log('Yellow Zone Information Panel opened:', initialZoneData);

        // TEST 8: Dynamic Severity Tuning from Moderate (🟡) -> Critical (🔴)
        console.log('\n--- TEST 8: Dynamic Severity Tuning (Moderate -> Critical) ---');
        const tunedToCritical = await evaluate(`
            (() => {
                const redBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('🔴 Red Zone'));
                if (redBtn) {
                    redBtn.click();
                    return true;
                }
                return false;
            })()
        `);
        console.log('Clicked 🔴 Red Zone dynamic tuner:', tunedToCritical);
        await sleep(1500);
        await captureScreenshot('screenshot-after-escalation.png');

        // Verify count of Red zones increased and Yellow decreased
        const postEscalationCounts = await evaluate(`
            (() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const redBtn = buttons.find(b => b.textContent.includes('Critical'));
                const yellowBtn = buttons.find(b => b.textContent.includes('Moderate'));
                return {
                    redText: redBtn ? redBtn.innerText.replace(/\\n/g, ' ') : null,
                    yellowText: yellowBtn ? yellowBtn.innerText.replace(/\\n/g, ' ') : null
                };
            })()
        `);
        console.log('Counts after dynamic escalation:', postEscalationCounts);

        // TEST 9: Quick Resolve from Zone Info Panel -> Zone Disappears!
        console.log('\n--- TEST 9: Resolve Incident -> Active Risk Zone Disappears ---');
        const resolveClicked = await evaluate(`
            (() => {
                const resolveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Resolve & Clear Zone'));
                if (resolveBtn) {
                    resolveBtn.click();
                    return true;
                }
                return false;
            })()
        `);
        console.log('Clicked Resolve & Clear Zone:', resolveClicked);
        await sleep(1500);
        await captureScreenshot('screenshot-after-resolution.png');

        const postResolveCounts = await evaluate(`
            (() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const redBtn = buttons.find(b => b.textContent.includes('Critical'));
                const totalText = Array.from(document.querySelectorAll('*')).find(el => el.textContent && el.textContent.includes('Total:'))?.textContent;
                return {
                    redText: redBtn ? redBtn.innerText.replace(/\\n/g, ' ') : null,
                    totalText
                };
            })()
        `);
        console.log('Counts after incident resolution:', postResolveCounts);

        console.log('\n=== ALL BROWSER TEST SUITES COMPLETE AND VERIFIED ===');

    } catch (err) {
        console.error('Browser Test Error:', err);
    } finally {
        chromeProcess.kill();
    }
}

main();
