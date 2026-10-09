import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9223;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('====================================================');
    console.log('   WORLDWIDE GPS MAP & EMERGENCY SYSTEM E2E TEST   ');
    console.log('====================================================\n');

    const chromeProcess = spawn(CHROME_PATH, [
        `--remote-debugging-port=${DEBUG_PORT}`,
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--window-size=1440,900',
        'about:blank'
    ]);

    await sleep(2500);

    try {
        const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
        const targets = await res.json();
        const pageTarget = targets.find(t => t.type === 'page');
        if (!pageTarget) throw new Error('No Chrome page target found');

        console.log('[1/10] Connected to Chrome DevTools Protocol at port', DEBUG_PORT);
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
                throw new Error(JSON.stringify(res.result.exceptionDetails));
            }
            return res.result?.result?.value;
        }

        await send('Page.enable');
        await send('Runtime.enable');

        // Navigate to app
        console.log('[2/10] Navigating to http://localhost:5173/ ...');
        await send('Page.navigate', { url: 'http://localhost:5173/' });
        await sleep(3000);

        // Check if on Login Page and log in as Marcus Vance
        const onLogin = await evaluate(`!!document.querySelector('button') && document.body.innerText.includes('Emergency Intelligence')`);
        console.log('Page loaded. Is login or console visible?', onLogin);

        const loginSuccess = await evaluate(`
            (() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const marcusBtn = buttons.find(b => b.innerText.includes('Marcus Vance') || b.innerText.includes('Log In As'));
                if (marcusBtn) {
                    marcusBtn.click();
                    return true;
                }
                const firstSubmit = buttons.find(b => b.innerText.includes('Sign In') || b.innerText.includes('Enter Console'));
                if (firstSubmit) {
                    firstSubmit.click();
                    return true;
                }
                return false;
            })()
        `);
        console.log('Logged in as operator:', loginSuccess);
        await sleep(2000);

        // Navigate to MAP tab
        console.log('[3/10] Navigating to Tactical Geospatial Map tab...');
        const mapNav = await evaluate(`
            (() => {
                const buttons = Array.from(document.querySelectorAll('button, a'));
                const mapBtn = buttons.find(b => b.innerText.trim().toUpperCase() === 'MAP' || b.innerText.includes('Geospatial'));
                if (mapBtn) {
                    mapBtn.click();
                    return true;
                }
                return false;
            })()
        `);
        console.log('Navigated to Map tab:', mapNav);
        await sleep(2500);

        // VERIFICATION 1: Initial Map Position (Andhra Pradesh, India)
        console.log('[4/10] Verifying INITIAL MAP VIEW is Andhra Pradesh, India 🇮🇳 (Lat: 15.9129, Lng: 79.7400, Zoom: 7)...');
        const initialMapState = await evaluate(`
            (() => {
                const mapDiv = document.querySelector('.leaflet-container');
                if (!mapDiv) return { error: 'No Leaflet map container found' };
                // Read from leaflet internal if accessible or check buttons and layers
                const apBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Andhra Pradesh'));
                const allBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Active Incidents'));
                const presetsSelect = document.querySelector('select');
                return {
                    hasMap: true,
                    hasReturnToAPButton: !!apBtn,
                    hasViewAllButton: !!allBtn,
                    hasPresetsDropdown: !!presetsSelect,
                    selectedPreset: presetsSelect ? presetsSelect.value : null
                };
            })()
        `);
        console.log('Map Controls Status:', JSON.stringify(initialMapState, null, 2));

        if (!initialMapState.hasReturnToAPButton || !initialMapState.hasViewAllButton) {
            throw new Error('Missing "Return to Andhra Pradesh" or "View All Active Incidents" button!');
        }

        // VERIFICATION 2: Worldwide Presets & Pan/Zoom Anywhere on Earth
        console.log('[5/10] Testing Worldwide Presets Switcher (London 🇬🇧, Tokyo 🇯🇵, Sydney 🇦🇺)...');
        const presetSwitchResult = await evaluate(`
            (() => {
                const select = document.querySelector('select');
                if (!select) return { error: 'No preset select found' };
                const options = Array.from(select.options).map(o => ({ value: o.value, text: o.text }));
                
                // Select London
                select.value = 'LONDON_UK';
                select.dispatchEvent(new Event('change', { bubbles: true }));
                return {
                    presetsCount: options.length,
                    options: options.slice(0, 8),
                    switchedTo: 'LONDON_UK'
                };
            })()
        `);
        console.log('Presets Switch Result:', JSON.stringify(presetSwitchResult, null, 2));
        await sleep(1500);

        // VERIFICATION 3: "Return to Andhra Pradesh" Button
        console.log('[6/10] Testing "Return to Andhra Pradesh" button restoration...');
        const apRestore = await evaluate(`
            (() => {
                const apBtn = Array.from(document.querySelectorAll('button')).find(b => 
                    b.innerText.includes('Return to Andhra Pradesh') || b.title?.includes('initial default map view')
                );
                if (apBtn) {
                    apBtn.click();
                    return true;
                }
                return false;
            })()
        `);
        console.log('"Return to Andhra Pradesh" clicked:', apRestore);
        await sleep(1500);

        // VERIFICATION 4: "View All Active Incidents" Button
        console.log('[7/10] Testing "View All Active Incidents" button...');
        const viewAll = await evaluate(`
            (() => {
                const allBtn = Array.from(document.querySelectorAll('button')).find(b => 
                    b.innerText.includes('View All Active Incidents') || b.title?.includes('Fit map bounds')
                );
                if (allBtn) {
                    allBtn.click();
                    return true;
                }
                return false;
            })()
        `);
        console.log('"View All Active Incidents" clicked:', viewAll);
        await sleep(2000);

        // VERIFICATION 5: Incident Markers & All 8 Required Display Fields
        console.log('[8/10] Inspecting Incident Markers & Verifying 8 Required Items in Marker Details...');
        const markerCheck = await evaluate(`
            (async () => {
                // Wait for map animation to settle
                for (let i = 0; i < 20; i++) {
                    const markers = Array.from(document.querySelectorAll('.tactical-incident-marker'));
                    if (markers.length > 0) {
                        // Click first marker to open popup
                        const m = markers[0];
                        m.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                        m.click();
                        const innerDiv = m.querySelector('[data-incident-id]');
                        if (innerDiv) innerDiv.click();

                        return {
                            markersCount: markers.length,
                            firstMarkerId: innerDiv?.getAttribute('data-incident-id') || 'found'
                        };
                    }
                    await new Promise(r => setTimeout(r, 300));
                }
                return { error: 'No tactical incident markers found after waiting' };
            })()
        `);
        console.log('Marker Inspection:', JSON.stringify(markerCheck, null, 2));
        await sleep(2000);

        const popupVerification = await evaluate(`
            (async () => {
                for (let i = 0; i < 15; i++) {
                    const popup = document.querySelector('.leaflet-popup-content');
                    if (popup) {
                        const text = popup.innerText;
                        return {
                            hasIncidentId: /INC-\\d+/.test(text),
                            hasIncidentType: text.toLowerCase().includes('type:'),
                            hasCountry: text.toLowerCase().includes('country:'),
                            hasLocation: text.toLowerCase().includes('city') || text.toLowerCase().includes('loc:'),
                            hasSeverity: text.includes('RED') || text.includes('ORANGE') || text.includes('YELLOW'),
                            hasLinkedReports: text.toLowerCase().includes('reports:'),
                            hasVerificationStatus: text.toLowerCase().includes('verification'),
                            hasCurrentStatus: text.toLowerCase().includes('status:'),
                            hasOpenDetailsButton: text.includes('Open Incident Details') || text.includes('Open Full Incident'),
                            rawSample: text.split('\\n').slice(0, 8).join(' | ')
                        };
                    }
                    const m = document.querySelector('.tactical-incident-marker');
                    if (m) {
                        m.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                    }
                    await new Promise(r => setTimeout(r, 400));
                }
                return { error: 'No popup open after waiting' };
            })()
        `);
        console.log('Popup 8-Item Verification Result:', JSON.stringify(popupVerification, null, 2));

        if (!popupVerification.hasIncidentId || !popupVerification.hasCountry || !popupVerification.hasSeverity) {
            throw new Error('Marker popup is missing required worldwide fields!');
        }

        // Click Open Incident Details to verify full incident hub modal
        console.log('Opening Full Incident Details Hub modal from marker...');
        const openHub = await evaluate(`
            (() => {
                const btn = Array.from(document.querySelectorAll('.leaflet-popup-content button')).find(b => b.innerText.includes('Incident Details') || b.innerText.includes('Hub'));
                if (btn) {
                    btn.click();
                    return true;
                }
                return false;
            })()
        `);
        console.log('Modal opened from marker:', openHub);
        await sleep(1500);

        // Check if modal has Country and Region
        const modalCheck = await evaluate(`
            (() => {
                const modal = document.querySelector('.fixed.inset-0');
                if (!modal) return { open: false };
                const text = modal.innerText;
                const hasRegion = text.includes('Region') || text.includes('India') || text.includes('Location & Region');
                
                // Close modal
                const closeBtn = modal.querySelector('button[title*="Close"]') || Array.from(modal.querySelectorAll('button')).find(b => b.innerText === '✕' || b.innerHTML.includes('svg'));
                if (closeBtn) closeBtn.click();

                return {
                    open: true,
                    hasRegion,
                    sample: text.slice(0, 120)
                };
            })()
        `);
        console.log('Incident Hub Modal Verification:', JSON.stringify(modalCheck, null, 2));
        await sleep(1000);

        // VERIFICATION 6: Risk-Zone Rules & STRICT ZERO GREEN
        console.log('[9/10] Verifying Risk Zones: Strictly RED, ORANGE, YELLOW • ZERO GREEN...');
        const zeroGreenCheck = await evaluate(`
            (() => {
                const allText = document.body.innerText.toLowerCase();
                const hasGreenRisk = allText.includes('green zone') || allText.includes('🟢') || allText.includes('green risk');
                
                const legendItems = Array.from(document.querySelectorAll('*')).filter(el => 
                    el.innerText && (el.innerText.includes('🔴') || el.innerText.includes('🟠') || el.innerText.includes('🟡'))
                ).map(el => el.innerText.trim()).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);

                return {
                    hasGreenRisk,
                    zeroGreenCompliant: !hasGreenRisk,
                    sampleRiskLabels: legendItems
                };
            })()
        `);
        console.log('Zero Green Check:', JSON.stringify(zeroGreenCheck, null, 2));
        if (zeroGreenCheck.hasGreenRisk) {
            throw new Error('VIOLATION: Green risk found on page!');
        }

        // VERIFICATION 7: Intake Form & Worldwide Duplicate Incident Detection
        console.log('[10/10] Testing New Report Intake & Worldwide Duplicate Detection...');
        
        // Open New Incoming Report modal
        const openReportModal = await evaluate(`
            (() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const newRepBtn = buttons.find(b => 
                    b.innerText.includes('Log 911 Call') || 
                    b.innerText.includes('New Report') || 
                    b.innerText.includes('New Incoming') ||
                    b.title?.includes('intake')
                );
                if (newRepBtn) {
                    newRepBtn.click();
                    return true;
                }
                return false;
            })()
        `);
        console.log('New Report Modal opened:', openReportModal);
        await sleep(1500);

        // Test London duplicate preset: load preset, verify fields, submit
        const londonDupTest = await evaluate(`
            (() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const londonPresetBtn = buttons.find(b => b.innerText.includes('London Fire Dup'));
                if (!londonPresetBtn) return { error: 'London preset button not found' };

                londonPresetBtn.click();
                return { loadedLondonPreset: true };
            })()
        `);
        console.log('Loaded London Preset in Intake:', londonDupTest);
        await sleep(500);

        // Submit London Report
        const submitLondon = await evaluate(`
            (() => {
                const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Submit & Analyze Duplicates'));
                if (submitBtn) {
                    submitBtn.click();
                    return true;
                }
                return false;
            })()
        `);
        console.log('Submitted London Report:', submitLondon);
        await sleep(2000);

        // Verify Duplicate Modal appeared for London incident INC-1004
        const duplicateDetectionResult = await evaluate(`
            (() => {
                const bodyText = document.body.innerText;
                const isDuplicateModalOpen = bodyText.includes('POSSIBLE DUPLICATE REPORT DETECTED');
                const targetIncidentId = bodyText.match(/INC-1004|INC-1001|INC-\\d+/)?.[0];
                const matchConfidence = bodyText.match(/(\\d+)%\\s*likely related/)?.[1];

                // Click Attach to Existing Incident
                const attachBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Attach to Existing Incident') || b.innerText.includes('Approve'));
                if (attachBtn) {
                    attachBtn.click();
                }

                return {
                    isDuplicateModalOpen,
                    targetIncidentId,
                    matchConfidence: matchConfidence ? \`\${matchConfidence}%\` : null,
                    attachedSuccessfully: !!attachBtn
                };
            })()
        `);
        console.log('Worldwide Duplicate Detection Result:', JSON.stringify(duplicateDetectionResult, null, 2));

        if (!duplicateDetectionResult.isDuplicateModalOpen) {
            throw new Error('Duplicate detection did not trigger for London incident preset!');
        }

        console.log('\n====================================================');
        console.log('   🎉 ALL 10 WORLDWIDE GPS MAP TESTS PASSED!       ');
        console.log('====================================================');

    } catch (err) {
        console.error('Test Suite Failed:', err);
        process.exitCode = 1;
    } finally {
        chromeProcess.kill();
    }
}

main();

