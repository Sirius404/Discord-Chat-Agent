const request = require('request-promise-native');
require('dotenv').config();

class CustomEmbeddingFunction {
    constructor(config = {}) {
        this.apiKey = config.apiKey || process.env.AI_API_KEY;
        this.baseURL =  process.env.AI_BASE_URL || 'https://api.gpt.ge/v1';
        this.model = config.model || 'text-embedding-3-large';
    }

    async generate(texts) {
        if (!Array.isArray(texts)) {
            texts = [texts];
        }

        const embeddings = [];
        
        for (const text of texts) {
            try {
                const options = {
                    method: 'POST',
                    url: `${this.baseURL}/embeddings`,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.model,
                        input: text
                    })
                };

                const response = await request(options);
                const result = JSON.parse(response);
                
                if (result.data && result.data[0] && result.data[0].embedding) {
                    embeddings.push(result.data[0].embedding);
                } else {
                    console.error('Invalid embedding response format:', result);
                    throw new Error('Invalid embedding response format');
                }
            } catch (error) {
                console.error('Error generating embedding:', error);
                throw error;
            }
        }

        return embeddings;
    }
}

module.exports = CustomEmbeddingFunction;
