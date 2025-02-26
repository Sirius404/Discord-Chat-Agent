const fs = require('fs').promises;
const path = require('path');
const { ChromaClient } = require('chromadb');
const axios = require('axios');
require('dotenv').config();

class KnowledgeBase {
    constructor() {
        this.client = new ChromaClient();
        this.apiKey = process.env.AI_API_KEY;
        this.baseURL = process.env.AI_BASE_URL || 'https://api.gpt.ge/v1';
        this.collections = new Map();
        this.knowledgeDir = path.join(__dirname, '../../knowledge');
    }

    async generateEmbedding(text) {
        try {
            const response = await axios({
                method: 'POST',
                url: `${this.baseURL}/embeddings`,
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    model: 'text-embedding-3-large',
                    input: text
                }
            });
            return response.data.data[0].embedding;
        } catch (error) {
            console.error('Error generating embedding:', error.response?.data || error.message);
            throw error;
        }
    }

    async initialize() {
        try {
            console.log("Initializing Knowledge Base...");
            await fs.mkdir(this.knowledgeDir, { recursive: true });
            
            const collectionTypes = [
                'general',
                'personality',
                'interests',
                'memories'
            ];

            for (const type of collectionTypes) {
                const collection = {
                    name: type,
                    data: [],
                    async add(texts, metadata = []) {
                        for (let i = 0; i < texts.length; i++) {
                            const embedding = await this.parent.generateEmbedding(texts[i]);
                            this.data.push({
                                id: `${type}_${Date.now()}_${i}`,
                                text: texts[i],
                                embedding: embedding,
                                metadata: metadata[i] || {}
                            });
                        }
                        // 保持最新的100条记录
                        if (this.data.length > 100) {
                            this.data = this.data.slice(-100);
                        }
                    },
                    async search(query, limit = 5) {
                        const queryEmbedding = await this.parent.generateEmbedding(query);
                        
                        // 计算余弦相似度
                        const results = this.data.map(item => {
                            const similarity = this.cosineSimilarity(queryEmbedding, item.embedding);
                            return { ...item, similarity };
                        });
                        
                        // 按相似度排序并返回前N条
                        return results
                            .sort((a, b) => b.similarity - a.similarity)
                            .slice(0, limit)
                            .map(item => item.text);
                    },
                    cosineSimilarity(a, b) {
                        const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
                        const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
                        const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
                        return dotProduct / (normA * normB);
                    },
                    parent: this
                };
                
                this.collections.set(type, collection);
                console.log(`Collection ${type} is ready`);
            }

            // 加载知识库文件
            await this.loadKnowledgeFiles();
            console.log("Knowledge Base initialization completed");
        } catch (error) {
            console.error("Error initializing Knowledge Base:", error);
            throw error;
        }
    }

    async loadKnowledgeFiles() {
        try {
            const files = await fs.readdir(this.knowledgeDir);
            
            for (const file of files) {
                const filePath = path.join(this.knowledgeDir, file);
                const type = file.split('.')[0];
                const collection = this.collections.get(type);
                
                if (!collection) {
                    console.warn(`No collection found for type: ${type}`);
                    continue;
                }

                const content = await fs.readFile(filePath, 'utf-8');
                const items = content.split('\n').filter(line => line.trim());
                
                await collection.add(items);
                console.log(`Loaded ${items.length} items from ${file}`);
            }
        } catch (error) {
            console.error("Error loading knowledge files:", error);
        }
    }

    async addKnowledge(type, content) {
        try {
            const collection = this.collections.get(type);
            if (!collection) {
                throw new Error(`Invalid knowledge type: ${type}`);
            }

            await collection.add([content]);

            const filePath = path.join(this.knowledgeDir, `${type}.txt`);
            await fs.appendFile(filePath, content + '\n');

            return true;
        } catch (error) {
            console.error(`Error adding knowledge to ${type}:`, error);
            return false;
        }
    }

    async searchKnowledge(type, query, limit = 5) {
        try {
            const collection = this.collections.get(type);
            if (!collection) {
                throw new Error(`Invalid knowledge type: ${type}`);
            }

            return await collection.search(query, limit);
        } catch (error) {
            console.error(`Error searching knowledge in ${type}:`, error);
            return [];
        }
    }

    async searchAllKnowledge(query, limit = 3) {
        const allResults = [];
        
        for (const [type, collection] of this.collections.entries()) {
            try {
                const results = await collection.search(query, Math.max(1, Math.floor(limit / 2)));
                allResults.push(...results.map(text => ({
                    type,
                    content: text
                })));
            } catch (error) {
                console.error(`Error searching ${type} knowledge:`, error);
            }
        }

        // 按相关性排序并限制返回数量
        return allResults.slice(0, limit);
    }
}

module.exports = KnowledgeBase;
