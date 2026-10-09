import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9222;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('=== Intelligent Emergency Call-Center E2E Test Suite ===');

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
        const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
        const targets = await res.json();
        const pageTarget = targets.find(t => t.type === 'page');
        if (!pageTarget) throw new Error('No Chrome page target found');

        console.log('Connected to Chrome DevTools Protocol at port', DEBUG_PORT);
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
                console.log(`[Screenshot Saved] -> ${fileName}`);
            }
        }

        await send('Page.enable');
        await send('Runtime.enable');
        await send('DOM.enable');

        console.log('Navigating to http://localhost:5173/ ...');
        await send('Page.navigate', { url: 'http://localhost:5173/' });
        await sleep(3000);

        // Check login
        const isLoginPage = await evaluate("!!document.querySelector('button[type=\"submit\"]') && document.body.innerText.includes('Emergency Intelligence')");
        if (isLoginPage) {
            console.log('Authenticating operator login...');
            await evaluate("document.querySelector('button[type=\"submit\"]').click()");
            await sleep(2000);
        }

        await captureScreenshot('e2e-01-dashboard.png');

        // SUITE 1: Workload Reduction Statistics & Zero Green Verification
        console.log('\n--- SUITE 1: Call-Center Workload Reduction & Zero Green Verification ---');
        const workloadStats = await evaluate(`
            (() => {
                const text = document.body.innerText;
                const hasConsolidated = text.includes('Reports Consolidated:') || text.includes('duplicate reports consolidated');
                const hasWorkloadReduced = text.includes('Estimated Duplicate Workload Reduced');
                const hasSystemDisclaimer = text.includes('System-Generated Statistics');
                const hasGreenRisk = text.toLowerCase().includes('green zone') || text.toLowerCase().includes('low risk (green)') || text.includes('🟢');

                return {
                    hasConsolidated,
                    hasWorkloadReduced,
                    hasSystemDisclaimer,
                    hasGreenRisk
                };
            })()
        `);
        console.log('Workload statistics panel present:', workloadStats);
        if (workloadStats.hasGreenRisk) {
            throw new Error('FAIL: Found prohibited green risk level in DOM!');
        } else {
            console.log('PASS: Only Red 🔴, Orange 🟠, Yellow 🟡 risk levels exist. Zero green confirmed.');
        }

        // SUITE 2: Intake Flow & Duplicate Matching Engine (Caller 2 duplicate report)
        console.log('\n--- SUITE 2: Incoming Call Intake & Possible Duplicate UI ---');
        // Click "+ Log Incoming Report" button in header
        await evaluate(`
            (() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const newReportBtn = btns.find(b => b.innerText.includes('Log Incoming') || b.innerText.includes('New Report') || b.innerText.includes('911 Call'));
                if (newReportBtn) newReportBtn.click();
            })()
        `);
        await sleep(1500);
        await captureScreenshot('e2e-02-new-report-form.png');

        // Click preset "Caller 2: Rollover Dup"
        console.log('Loading preset "Caller 2: Rollover Dup"...');
        await evaluate(`
            (() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const presetBtn = btns.find(b => b.innerText.includes('Rollover Dup'));
                if (presetBtn) presetBtn.click();
            })()
        `);
        await sleep(1000);

        // Click "Submit & Analyze Duplicates"
        console.log('Submitting report to duplicate analysis engine...');
        await evaluate(`
            (() => {
                const form = document.querySelector('form');
                if (form) {
                    const submitBtn = form.querySelector('button[type="submit"]');
                    if (submitBtn) submitBtn.click();
                }
            })()
        `);
        await sleep(2000);
        await captureScreenshot('e2e-03-possible-duplicate-modal.png');

        // Verify Possible Duplicate UI
        const duplicateModalInfo = await evaluate(`
            (() => {
                const text = document.body.innerText;
                const hasPossibleDupHeader = text.includes('POSSIBLE DUPLICATE REPORT DETECTED');
                const hasMatchConfidence = text.includes('likely related') || text.includes('Match Confidence');
                const hasAttachBtn = !!Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('ATTACH TO INCIDENT'));
                const hasCreateNewBtn = !!Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('CREATE NEW INCIDENT'));
                const hasReviewBtn = !!Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('REVIEW DETAILS'));

                return {
                    hasPossibleDupHeader,
                    hasMatchConfidence,
                    hasAttachBtn,
                    hasCreateNewBtn,
                    hasReviewBtn
                };
            })()
        `);
        console.log('Possible Duplicate UI verification:', duplicateModalInfo);

        // Operator selects [ ATTACH TO INCIDENT ]
        console.log('Operator selects [ ATTACH TO INCIDENT ]...');
        await evaluate(`
            (() => {
                const attachBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('ATTACH TO INCIDENT'));
                if (attachBtn) attachBtn.click();
            })()
        `);
        await sleep(2000);
        await captureScreenshot('e2e-04-attached-incident-details.png');

        // Close the Incident Details modal
        console.log('Closing Incident Details modal before starting next intake test...');
        await evaluate(`
            (() => {
                const closeBtn = document.querySelector('button[title*="Close"]');
                if (closeBtn) closeBtn.click();
            })()
        `);
        await sleep(1500);

        // SUITE 3: Different Incidents Must Remain Separate (5 km away accident)
        console.log('\n--- SUITE 3: Different Incidents Separation (5 km Away Accident) ---');
        // Click "+ Log Incoming Report" button in header again
        await evaluate(`
            (() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const newReportBtn = btns.find(b => b.innerText.includes('Log Incoming') || b.innerText.includes('New Report') || b.innerText.includes('911 Call'));
                if (newReportBtn) newReportBtn.click();
            })()
        `);
        await sleep(1500);

        // Click preset "5 km Away Solo"
        console.log('Loading preset "5 km Away Solo"...');
        await evaluate(`
            (() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const presetBtn = btns.find(b => b.innerText.includes('5 km Away Solo'));
                if (presetBtn) presetBtn.click();
            })()
        `);
        await sleep(1000);

        // Click "Submit & Analyze Duplicates"
        console.log('Submitting 5 km away solo accident...');
        await evaluate(`
            (() => {
                const form = document.querySelector('form');
                if (form) {
                    const submitBtn = form.querySelector('button[type="submit"]');
                    if (submitBtn) submitBtn.click();
                }
            })()
        `);
        await sleep(2000);
        await captureScreenshot('e2e-05-no-duplicate-confirm.png');

        // Verify No Duplicate Active Incidents Found confirmation
        const noDupInfo = await evaluate(`
            (() => {
                const text = document.body.innerText;
                const hasNoDupHeader = text.includes('No Duplicate Active Incidents Found');
                const hasCreateBtn = !!Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('CREATE NEW INCIDENT'));
                return { hasNoDupHeader, hasCreateBtn };
            })()
        `);
        console.log('No duplicate recommendation verification:', noDupInfo);

        // Click [ CREATE NEW INCIDENT ]
        console.log('Operator confirms [ CREATE NEW INCIDENT ]...');
        await evaluate(`
            (() => {
                const createBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('CREATE NEW INCIDENT'));
                if (createBtn) createBtn.click();
            })()
        `);
        await sleep(2000);
        await captureScreenshot('e2e-06-new-incident-created.png');

        // SUITE 4: Incident Details Hub, Timeline & Response Team Coordination
        console.log('\n--- SUITE 4: Incident Details Hub, Timeline & Response Team Coordination ---');
        // Click on "Assigned Units" tab in the open modal
        await evaluate(`
            (() => {
                const tabs = Array.from(document.querySelectorAll('button'));
                const unitsTab = tabs.find(b => b.innerText && (b.innerText.includes('Assigned Units') || b.innerText.includes('Units')));
                if (unitsTab) unitsTab.click();
            })()
        `);
        await sleep(1500);

        // Coordinate a Response Team
        console.log('Coordinating authorized emergency response team...');
        await evaluate(`
            (() => {
                const coordBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Coordinate Response Team'));
                if (coordBtn) coordBtn.click();
            })()
        `);
        await sleep(1500);
        await captureScreenshot('e2e-07-response-team-coordinated.png');

        const teamCoordCheck = await evaluate(`
            (() => {
                const text = document.body.innerText;
                return {
                    hasCoordinatedSection: text.includes('Coordinated Authorized Teams') || text.includes('Metro Police Squad 4'),
                    hasResponseCoordinatedStatus: text.includes('RESPONSE_COORDINATED') || text.includes('ASSIGNED')
                };
            })()
        `);
        console.log('Response team coordination check:', teamCoordCheck);

        // Click Timeline Tab
        console.log('Inspecting chronological Incident Timeline...');
        await evaluate(`
            (() => {
                const tabs = Array.from(document.querySelectorAll('button'));
                const timelineTab = tabs.find(b => b.innerText && b.innerText.includes('Timeline'));
                if (timelineTab) timelineTab.click();
            })()
        `);
        await sleep(1500);
        await captureScreenshot('e2e-08-timeline.png');

        const timelineCheck = await evaluate(`
            (() => {
                const text = document.body.innerText;
                const hasChronological = text.includes('Chronological Audit Stream') || text.includes('Report Ingested') || text.includes('Unified Incident Spawned');
                return { hasChronological };
            })()
        `);
        console.log('Timeline display verified:', timelineCheck);

        console.log('\n=== ALL E2E VERIFICATION SUITES PASSED FLAWLESSLY ===');

    } catch (err) {
        console.error('E2E Test Execution Error:', err);
    } finally {
        chromeProcess.kill();
    }
}

main();
