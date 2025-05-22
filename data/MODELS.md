# Obtaining a Llama Model for Legal Chatbot

This application requires a Llama model in GGUF format to function. Follow these steps to download and set up a model:

## Recommended Models

For this legal chatbot, we recommend using one of the following models:

1. **Llama-2-7B-Chat-GGUF** - Good balance between performance and resource usage
2. **Llama-3-8B-Instruct-GGUF** - Better performance but requires more resources

## Download Instructions

1. Visit one of these sources:
   - [HuggingFace - TheBloke's Llama-2-7B-Chat-GGUF](https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF)
   - [HuggingFace - TheBloke's Llama-3-8B-Instruct-GGUF](https://huggingface.co/TheBloke/Llama-3-8B-Instruct-GGUF)

2. Choose a quantized version based on your hardware:
   - For computers with limited RAM (8-16GB): Use `llama-2-7b-chat.Q4_K_M.gguf` (~4GB file size)
   - For better performance: Use `llama-2-7b-chat.Q5_K_M.gguf` or `llama-2-7b-chat.Q8_0.gguf`

3. Download the chosen model file.

4. Place the downloaded model in this directory (`legal-chatbot/data/`).

5. Update the `MODEL_PATH` in the server's `.env` file or in `server/index.js` to point to your model file.

## Example:

If you downloaded `llama-2-7b-chat.Q4_K_M.gguf`, your `.env` file should contain:

```
MODEL_PATH=../data/llama-2-7b-chat.Q4_K_M.gguf
```

## Note on Hardware Requirements

- The Q4 model requires approximately 8GB of RAM
- The Q5 model requires approximately 10GB of RAM
- The Q8 model requires approximately 16GB of RAM

Choose a model that fits your available hardware resources. 