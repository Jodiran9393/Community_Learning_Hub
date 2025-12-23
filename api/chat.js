/**
 * Vercel Serverless API Proxy for LLM Requests
 * Securely handles API keys server-side
 */

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // CORS headers for your domain
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { provider, prompt, model, imageData } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        let response;

        switch (provider) {
            case 'openai':
                response = await callOpenAI(prompt, model, imageData);
                break;
            case 'anthropic':
                response = await callAnthropic(prompt, model, imageData);
                break;
            default:
                return res.status(400).json({ error: `Unknown provider: ${provider}` });
        }

        return res.status(200).json({ response });
    } catch (error) {
        console.error('LLM API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt, model = 'gpt-4o-mini', imageData = null) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
    }

    // Build messages array
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
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * Call Anthropic API
 */
async function callAnthropic(prompt, model = 'claude-3-haiku-20240307', imageData = null) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Build content array
    let content;
    if (imageData) {
        // Extract base64 and media type
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
            messages: [{ role: 'user', content }]
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Anthropic API error');
    }

    const data = await response.json();
    return data.content[0].text;
}
