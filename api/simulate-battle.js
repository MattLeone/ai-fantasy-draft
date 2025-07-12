import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000, // Increased for detailed storytelling format
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    
    res.status(200).json({ responseText });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to simulate battle' });
  }
}