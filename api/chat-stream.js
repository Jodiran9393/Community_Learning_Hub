/**
 * Vercel Serverless API - Streaming Chat Endpoint
 * Uses Server-Sent Events (SSE) to stream responses and avoid timeouts
 */

export const config = {
    maxDuration: 60 // Allow up to 60 seconds on Pro, 10 on Hobby
};

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { provider, prompt, model, imageData } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        switch (provider) {
            case 'openai':
                await streamOpenAI(res, prompt, model, imageData);
                break;
            case 'anthropic':
                await streamAnthropic(res, prompt, model, imageData);
                break;
            default:
                res.write(`data: ${JSON.stringify({ error: `Unknown provider: ${provider}` })}\n\n`);
        }
    } catch (error) {
        console.error('Streaming error:', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
}

async function streamOpenAI(res, prompt, model = 'gpt-4o-mini', imageData = null) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
    }

    let content;
    if (imageData) {
        content = [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageData } }
        ];
    } else {
        content = prompt;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content }],
            max_tokens: 4000,
            temperature: 0.7,
            stream: true
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API error');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                        res.write(`data: ${JSON.stringify({ content })}\n\n`);
                    }
                } catch (e) {
                    // Skip unparseable chunks
                }
            }
        }
    }
}

async function streamAnthropic(res, prompt, model = 'claude-3-haiku-20240307', imageData = null) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not configured');
    }

    let content;
    if (imageData) {
        const match = imageData.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
            content = [
                {
                    type: 'image',
                    source: {
                        type: 'base64',
                        media_type: match[1],
                        data: match[2]
                    }
                },
                { type: 'text', text: prompt }
            ];
        } else {
            content = [{ type: 'text', text: prompt }];
        }
    } else {
        content = [{ type: 'text', text: prompt }];
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: model,
            max_tokens: 4000,
            messages: [{ role: 'user', content }],
            stream: true
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Anthropic API error');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                        res.write(`data: ${JSON.stringify({ content: parsed.delta.text })}\n\n`);
                    }
                } catch (e) {
                    // Skip unparseable chunks
                }
            }
        }
    }
}
