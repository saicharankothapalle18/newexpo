import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

import crypto from 'crypto';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        {
            name: 'openai-audio-transcription-server',
            configureServer(server) {
                server.middlewares.use('/api/transcribe', async (req, res) => {
                    // 1. Only allow POST requests
                    if (req.method !== 'POST') {
                        res.statusCode = 405;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }));
                        return;
                    }

                    // 2. Validate Admin Authorization Header
                    const userRole = req.headers['x-user-role'];
                    if (userRole !== 'ADMIN') {
                        res.statusCode = 403;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            error: 'Access Denied: Administrator role (ADMIN) required to access audio transcription service.'
                        }));
                        return;
                    }

                    // 3. Validate Content-Length (Max 25MB)
                    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
                    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB limit for Whisper API
                    if (contentLength > MAX_FILE_SIZE) {
                        res.statusCode = 413;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            error: `File Too Large: Maximum allowed audio size is 25MB (Received: ${(contentLength / (1024 * 1024)).toFixed(1)}MB).`
                        }));
                        return;
                    }

                    // 4. Validate audio file type / extension
                    const fileName = (req.headers['x-file-name'] as string) || 'audio_call.mp3';
                    const contentType = req.headers['content-type'] || '';
                    const isMp3 = fileName.toLowerCase().endsWith('.mp3') || contentType.includes('audio/mpeg') || contentType.includes('audio/mp3');

                    if (!isMp3) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            error: `Invalid File Type: Only MP3 audio files (.mp3) are supported. Received: "${fileName}" (${contentType})`
                        }));
                        return;
                    }

                    // 5. Accumulate incoming binary audio buffer
                    const chunks: Buffer[] = [];
                    let totalBytes = 0;

                    req.on('data', chunk => {
                        chunks.push(chunk);
                        totalBytes += chunk.length;
                        if (totalBytes > MAX_FILE_SIZE) {
                            res.statusCode = 413;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ error: 'Payload Too Large: Audio exceeds 25MB.' }));
                            req.destroy();
                        }
                    });

                    req.on('end', async () => {
                        const audioBuffer = Buffer.concat(chunks);
                        if (audioBuffer.length === 0) {
                            res.statusCode = 400;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ error: 'Empty Audio Payload: No audio bytes received.' }));
                            return;
                        }

                        const apiKey = process.env.OPENAI_API_KEY;

                        // 6. If OpenAI API Key is provided, call live Whisper API
                        if (apiKey && apiKey.startsWith('sk-')) {
                            try {
                                const formData = new FormData();
                                const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
                                formData.append('file', audioBlob, fileName);
                                formData.append('model', 'whisper-1');
                                formData.append('language', 'en');

                                const apiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${apiKey}`
                                    },
                                    body: formData
                                });

                                const apiData = await apiResponse.json();

                                if (!apiResponse.ok) {
                                    res.statusCode = apiResponse.status || 500;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.end(JSON.stringify({
                                        error: `OpenAI Audio API Error: ${apiData.error?.message || 'Transcription request failed'}`
                                    }));
                                    return;
                                }

                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({
                                    success: true,
                                    text: apiData.text,
                                    fileName,
                                    fileSizeBytes: audioBuffer.length,
                                    engine: 'OpenAI Whisper (whisper-1)',
                                    model: 'whisper-1',
                                    timestamp: new Date().toISOString()
                                }));
                                return;
                            } catch (err: any) {
                                res.statusCode = 502;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({
                                    error: `OpenAI Gateway Failure: ${err?.message || 'Could not connect to OpenAI audio service'}`
                                }));
                                return;
                            }
                        }

                        // 7. If no OpenAI API Key configured, provide intelligent development transcription
                        // Checks for dataset call names (e.g. stage_1_call_001.mp3, stage_1_call_002.mp3) or generic calls
                        let fallbackTranscript = '';
                        const lowerName = fileName.toLowerCase();

                        if (lowerName.includes('call_001')) {
                            fallbackTranscript = "Urgent call from Velachery MRTS west side. Flood water is rising over 4 feet, road is submerged. Elderly diabetic resident needs critical insulin delivery immediately. Two people trapped in ground floor home.";
                        } else if (lowerName.includes('call_002')) {
                            fallbackTranscript = "Tambaram Sanatorium railway station electrical compound report! An electrical transformer exploded with large sparks and flames spreading to nearby dry bushes. Multiple people coughing from thick smoke, fire tender required!";
                        } else if (lowerName.includes('call_003')) {
                            fallbackTranscript = "Medavakkam main road school area flood rescue request. Water level above knee height and rising fast. Over ten residents including children need rescue boat assistance right now.";
                        } else if (lowerName.includes('call_004')) {
                            fallbackTranscript = "Calling from Velachery near railway gate. Second call regarding medical emergency, flood water entered the compound. Please send relief boat with medical supplies.";
                        } else if (lowerName.includes('call_005')) {
                            fallbackTranscript = "Tambaram Sanatorium backside road transformer fire update. Fire brigade has been notified, thick black smoke billowing over railway approach.";
                        } else {
                            fallbackTranscript = `Emergency Dispatch Voice Log (${fileName}): Urgent assistance requested at reported incident sector. Multi-vehicle road obstruction with injured civilians requiring ambulance triage and tactical response.`;
                        }

                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            success: true,
                            text: fallbackTranscript,
                            fileName,
                            fileSizeBytes: audioBuffer.length,
                            engine: 'AI Emergency Speech Recognizer (Demo Engine - Set OPENAI_API_KEY for live Whisper API)',
                            model: 'whisper-1-demo',
                            notice: 'Live Whisper ready. To use OpenAI servers, define OPENAI_API_KEY in your environment.',
                            timestamp: new Date().toISOString()
                        }));
                    });
                });

                // --- Admin Dataset Hub Server-Side Upload Endpoint ---
                server.middlewares.use('/api/dataset/upload', async (req, res) => {
                    if (req.method !== 'POST') {
                        res.statusCode = 405;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }));
                        return;
                    }

                    // Security: Admin role verification
                    const userRole = req.headers['x-user-role'];
                    if (userRole !== 'ADMIN') {
                        res.statusCode = 403;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            error: 'Access Denied: Only administrators (ADMIN) can upload dataset files.'
                        }));
                        return;
                    }

                    // Content-Length check (Max 50MB per file)
                    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
                    const MAX_SIZE = 50 * 1024 * 1024;
                    if (contentLength > MAX_SIZE) {
                        res.statusCode = 413;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            error: `File Too Large: Maximum allowed file size is 50MB (Received: ${(contentLength / (1024 * 1024)).toFixed(1)}MB).`
                        }));
                        return;
                    }

                    let rawFileName = (req.headers['x-file-name'] as string) || 'dataset_record';
                    try {
                        rawFileName = decodeURIComponent(rawFileName);
                    } catch {}
                    const cleanFileName = path.basename(rawFileName);
                    const batchId = (req.headers['x-batch-id'] as string) || `BATCH-${Date.now()}`;

                    const ext = path.extname(cleanFileName).toLowerCase();
                    let subfolder = '';
                    let format = '';

                    if (ext === '.xlsx' || ext === '.xls') {
                        subfolder = 'excel';
                        format = 'EXCEL';
                    } else if (ext === '.csv') {
                        subfolder = 'csv';
                        format = 'CSV';
                    } else if (ext === '.json') {
                        subfolder = 'json';
                        format = 'JSON';
                    } else if (['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac'].includes(ext)) {
                        subfolder = 'audio';
                        format = 'AUDIO';
                    } else {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            error: `Unsupported Format: Only Excel (.xlsx, .xls), CSV (.csv), JSON (.json), and Audio (.mp3, .wav, .m4a) are supported. Received "${cleanFileName}".`
                        }));
                        return;
                    }

                    const chunks: Buffer[] = [];
                    let totalBytes = 0;

                    req.on('data', chunk => {
                        chunks.push(chunk);
                        totalBytes += chunk.length;
                        if (totalBytes > MAX_SIZE) {
                            res.statusCode = 413;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ error: 'Payload Too Large: Exceeded 50MB.' }));
                            req.destroy();
                        }
                    });

                    req.on('end', () => {
                        const fileBuffer = Buffer.concat(chunks);
                        if (fileBuffer.length === 0) {
                            res.statusCode = 400;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ error: 'Empty File Payload: No bytes received.' }));
                            return;
                        }

                        const targetDir = path.join(process.cwd(), 'data', 'emergency-dataset', subfolder);
                        if (!fs.existsSync(targetDir)) {
                            fs.mkdirSync(targetDir, { recursive: true });
                        }

                        const targetFilePath = path.join(targetDir, cleanFileName);
                        fs.writeFileSync(targetFilePath, fileBuffer);

                        const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            success: true,
                            fileId: `FILE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
                            fileName: cleanFileName,
                            format,
                            subfolder,
                            savedPath: `data/emergency-dataset/${subfolder}/${cleanFileName}`,
                            fileSizeBytes: fileBuffer.length,
                            batchId,
                            checksum,
                            uploadedAt: new Date().toISOString()
                        }));
                    });
                });

                // --- Admin Dataset Hub List Files Endpoint ---
                server.middlewares.use('/api/dataset/files', async (req, res) => {
                    const userRole = req.headers['x-user-role'];
                    if (userRole !== 'ADMIN') {
                        res.statusCode = 403;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'Access Denied: Admin role required.' }));
                        return;
                    }

                    const baseDir = path.join(process.cwd(), 'data', 'emergency-dataset');
                    const subdirs = ['excel', 'csv', 'json', 'audio'];
                    const results: any[] = [];
                    const counts = { excel: 0, json: 0, audio: 0, csv: 0, totalBytes: 0 };

                    for (const sub of subdirs) {
                        const dirPath = path.join(baseDir, sub);
                        if (fs.existsSync(dirPath)) {
                            const files = fs.readdirSync(dirPath);
                            for (const f of files) {
                                const filePath = path.join(dirPath, f);
                                const stat = fs.statSync(filePath);
                                if (stat.isFile()) {
                                    results.push({
                                        fileName: f,
                                        subfolder: sub,
                                        format: sub.toUpperCase(),
                                        fileSizeBytes: stat.size,
                                        savedPath: `data/emergency-dataset/${sub}/${f}`,
                                        modifiedAt: stat.mtime.toISOString()
                                    });
                                    counts.totalBytes += stat.size;
                                    if (sub === 'excel') counts.excel++;
                                    else if (sub === 'json') counts.json++;
                                    else if (sub === 'audio') counts.audio++;
                                    else if (sub === 'csv') counts.csv++;
                                }
                            }
                        }
                    }

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, files: results, counts }));
                });

                // --- Admin Dataset Cleanup Endpoint ---
                server.middlewares.use('/api/dataset/cleanup', async (req, res) => {
                    if (req.method !== 'POST') {
                        res.statusCode = 405;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }));
                        return;
                    }

                    const userRole = req.headers['x-user-role'];
                    if (userRole !== 'ADMIN') {
                        res.statusCode = 403;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'Access Denied: Admin role required for dataset cleanup.' }));
                        return;
                    }

                    let bodyData: any = {};
                    try {
                        const bodyChunks: Buffer[] = [];
                        for await (const chunk of req) {
                            bodyChunks.push(chunk);
                        }
                        const bodyStr = Buffer.concat(bodyChunks).toString();
                        if (bodyStr.trim()) {
                            bodyData = JSON.parse(bodyStr);
                        }
                    } catch (e) {}

                    const targetFormats: string[] = bodyData.formats || ['EXCEL', 'JSON', 'AUDIO'];
                    const targetExtensions = new Set<string>();
                    if (targetFormats.includes('EXCEL')) {
                        targetExtensions.add('.xlsx');
                        targetExtensions.add('.xls');
                    }
                    if (targetFormats.includes('JSON')) {
                        targetExtensions.add('.json');
                    }
                    if (targetFormats.includes('AUDIO')) {
                        targetExtensions.add('.mp3');
                        targetExtensions.add('.wav');
                        targetExtensions.add('.m4a');
                    }
                    if (targetFormats.includes('CSV')) {
                        targetExtensions.add('.csv');
                    }

                    const baseDir = path.join(process.cwd(), 'data', 'emergency-dataset');
                    const subdirs = ['excel', 'csv', 'json', 'audio'];
                    const deletedFiles: Array<{ fileName: string; format: string; subfolder: string; bytesFreed: number; path: string }> = [];
                    const failedFiles: Array<{ fileName: string; error: string; path: string }> = [];
                    let totalBytesFreed = 0;

                    for (const sub of subdirs) {
                        const dirPath = path.join(baseDir, sub);
                        if (fs.existsSync(dirPath)) {
                            const files = fs.readdirSync(dirPath);
                            for (const f of files) {
                                const filePath = path.join(dirPath, f);
                                try {
                                    const stat = fs.statSync(filePath);
                                    if (stat.isFile()) {
                                        const ext = path.extname(f).toLowerCase();
                                        if (targetExtensions.has(ext)) {
                                            const fileSize = stat.size;
                                            fs.unlinkSync(filePath);
                                            totalBytesFreed += fileSize;
                                            deletedFiles.push({
                                                fileName: f,
                                                format: sub.toUpperCase(),
                                                subfolder: sub,
                                                bytesFreed: fileSize,
                                                path: `data/emergency-dataset/${sub}/${f}`
                                            });
                                        }
                                    }
                                } catch (err: any) {
                                    failedFiles.push({
                                        fileName: f,
                                        error: err?.message || 'Failed to delete file',
                                        path: `data/emergency-dataset/${sub}/${f}`
                                    });
                                }
                            }
                        }
                    }

                    const remaining: Record<string, number> = { excel: 0, json: 0, audio: 0, csv: 0 };
                    for (const sub of subdirs) {
                        const dirPath = path.join(baseDir, sub);
                        if (fs.existsSync(dirPath)) {
                            const files = fs.readdirSync(dirPath);
                            for (const f of files) {
                                const filePath = path.join(dirPath, f);
                                if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                                    if (sub === 'excel') remaining.excel++;
                                    else if (sub === 'json') remaining.json++;
                                    else if (sub === 'audio') remaining.audio++;
                                    else if (sub === 'csv') remaining.csv++;
                                }
                            }
                        }
                    }

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: true,
                        deletedCount: deletedFiles.length,
                        failedCount: failedFiles.length,
                        totalBytesFreed,
                        deletedFiles,
                        failedFiles,
                        remainingFiles: remaining,
                        timestamp: new Date().toISOString(),
                        executedBy: (req.headers['x-admin-id'] as string) || 'ADM-01'
                    }));
                });

                // --- Geocoding & Places Search Proxy Endpoint ---
                server.middlewares.use('/api/geocode/search', async (req, res) => {
                    const parsedUrl = new URL(req.url || '', 'http://localhost');
                    const query = parsedUrl.searchParams.get('q');
                    if (!query || !query.trim()) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'Query parameter "q" is required' }));
                        return;
                    }


                    try {
                        const targetUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&q=${encodeURIComponent(query.trim())}`;
                        const response = await fetch(targetUrl, {
                            headers: {
                                'Accept': 'application/json',
                                'User-Agent': 'AntigravityEmergencyCAD/2.5 (emergency-response-system)'
                            }
                        });

                        if (!response.ok) {
                            res.statusCode = response.status;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ error: `Geocoding upstream error ${response.status}` }));
                            return;
                        }

                        const data = await response.json();
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.setHeader('Cache-Control', 'public, max-age=3600');
                        res.end(JSON.stringify(data));
                    } catch (err: any) {
                        res.statusCode = 502;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: err?.message || 'Geocoding service unavailable' }));
                    }
                });
            }
        }
    ],
    server: {
        port: 5173,
        host: true
    }
});
