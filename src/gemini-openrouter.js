/**
 * Gemini OpenRouter API Wrapper
 * Provides a unified interface to interact with Gemini models through OpenRouter API
 */

class GeminiOpenRouter {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('OpenRouter API key is required');
    }
    this.apiKey = apiKey;
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.model = 'google/gemini-pro';
    this.messages = [];
  }

  /**
   * Initialize the chat session
   * @param {string} systemPrompt - System prompt for the conversation
   */
  initializeChat(systemPrompt = '') {
    this.messages = [];
    if (systemPrompt) {
      this.messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
  }

  /**
   * Send a message and get a response
   * @param {string} message - User message
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - AI response
   */
  async sendMessage(message, options = {}) {
    if (!message) {
      throw new Error('Message cannot be empty');
    }

    this.messages.push({
      role: 'user',
      content: message
    });

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://iswar-tea.vercel.app',
          'X-Title': 'Iswar-Tea'
        },
        body: JSON.stringify({
          model: options.model || this.model,
          messages: this.messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000,
          top_p: options.topP || 1,
          frequency_penalty: options.frequencyPenalty || 0,
          presence_penalty: options.presencePenalty || 0
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenRouter API Error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      this.messages.push({
        role: 'assistant',
        content: assistantMessage
      });

      return assistantMessage;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  /**
   * Stream a response (Server-Sent Events)
   * @param {string} message - User message
   * @param {Function} onChunk - Callback for each chunk
   * @param {Object} options - Additional options
   */
  async streamMessage(message, onChunk, options = {}) {
    if (!message) {
      throw new Error('Message cannot be empty');
    }

    this.messages.push({
      role: 'user',
      content: message
    });

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://iswar-tea.vercel.app',
          'X-Title': 'Iswar-Tea'
        },
        body: JSON.stringify({
          model: options.model || this.model,
          messages: this.messages,
          stream: true,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API Error: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0].delta.content || '';
              fullMessage += content;
              onChunk(content);
            } catch (e) {
              // Skip parsing errors
            }
          }
        }
      }

      this.messages.push({
        role: 'assistant',
        content: fullMessage
      });

      return fullMessage;
    } catch (error) {
      console.error('Error in streamMessage:', error);
      throw error;
    }
  }

  /**
   * Set the model to use
   * @param {string} model - Model name (e.g., 'google/gemini-pro', 'google/gemini-pro-vision')
   */
  setModel(model) {
    this.model = model;
  }

  /**
   * Get conversation history
   * @returns {Array} - Message history
   */
  getHistory() {
    return this.messages;
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.messages = [];
  }

  /**
   * Count tokens in a message (approximation)
   * @param {string} text - Text to count
   * @returns {number} - Approximate token count
   */
  countTokens(text) {
    // Rough approximation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Generate embeddings for text
   * @param {string} text - Text to embed
   * @returns {Promise<Array>} - Embedding vector
   */
  async generateEmbeddings(text) {
    try {
      const response = await fetch(`${this.baseURL}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openrouter/auto',
          input: text
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter Embeddings Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Error in generateEmbeddings:', error);
      throw error;
    }
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeminiOpenRouter;
}