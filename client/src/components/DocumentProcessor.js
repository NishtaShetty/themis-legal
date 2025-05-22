import React, { useState, useRef } from 'react';
import axios from 'axios';

const DocumentProcessor = () => {
    const [file, setFile] = useState(null);
    const [text, setText] = useState('');
    const [summary, setSummary] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [targetLanguage, setTargetLanguage] = useState('hi'); // Default to Hindi
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Only allow .txt files for now
        if (!file.name.endsWith('.txt')) {
            setError('Only .txt files are supported for now.');
            setFile(null);
            setText('');
            setSummary('');
            setTranslatedText('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        
        setFile(file);
        setError('');
        setSummary('');
        setTranslatedText('');

        // First read the file content
        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result;
            console.log('File content loaded:', content);
            if (!content || content.trim() === '') {
                setError('The uploaded file is empty.');
                setText('');
                return;
            }
            setText(content);

            // Then upload the file
            const formData = new FormData();
            formData.append('file', file);

            try {
                setLoading(true);
                const response = await axios.post('http://localhost:5001/api/document/upload', formData);
                console.log('File uploaded:', response.data);
            } catch (error) {
                console.error('Upload error:', error);
                setError(error.response?.data?.error || 'Failed to upload file');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                setFile(null);
            } finally {
                setLoading(false);
            }
        };

        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            setError('Error reading file content');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setFile(null);
        };

        reader.readAsText(file);
    };

    const handleSummarize = async () => {
        console.log('Current text state:', text);
        
        if (!text || text.trim() === '') {
            setError('Please upload a file or enter text first');
            return;
        }

        try {
            setLoading(true);
            setError('');
            console.log('Sending text for summarization:', text);
            
            const response = await axios.post('http://localhost:5001/api/document/summarize', { 
                text: text.trim() 
            });
            
            console.log('Summarization response:', response.data);
            
            if (response.data && response.data.summary) {
                setSummary(response.data.summary);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Summarization error:', error);
            setError(error.response?.data?.error || 'Failed to summarize text');
        } finally {
            setLoading(false);
        }
    };

    const handleTranslate = async () => {
        if (!text || text.trim() === '') {
            setError('Please upload a file or enter text first');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const response = await axios.post('http://localhost:5001/api/document/translate', {
                text: text.trim(),
                targetLanguage
            });
            if (response.data && response.data.translatedText) {
                setTranslatedText(response.data.translatedText);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Translation error:', error);
            setError(error.response?.data?.error || 'Failed to translate text');
        } finally {
            setLoading(false);
        }
    };

    const handleClearFile = () => {
        setFile(null);
        setText('');
        setSummary('');
        setTranslatedText('');
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Document Processor</h2>
            
            {/* File Upload */}
            <div className="mb-6">
                <label className="block mb-2">Upload Document:</label>
                <div className="flex items-center gap-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileUpload}
                        className="border p-2 rounded"
                        accept=".txt,.pdf,.doc,.docx"
                        key={file ? file.name : 'file-input'}
                    />
                    {file && (
                        <button
                            onClick={handleClearFile}
                            className="text-red-500 hover:text-red-700"
                        >
                            Clear File
                        </button>
                    )}
                </div>
                {file && (
                    <div className="mt-2">
                        <p className="text-sm text-gray-600">Selected file: {file.name}</p>
                        <p className="text-sm text-gray-600">File size: {(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                )}
            </div>

            {/* Text Input */}
            <div className="mb-6">
                <label className="block mb-2">Text Content:</label>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full h-40 border p-2 rounded"
                    placeholder="Enter or paste text here..."
                />
                {text && (
                    <p className="mt-2 text-sm text-gray-600">
                        Text length: {text.length} characters
                    </p>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={handleSummarize}
                    disabled={!text || text.trim() === '' || loading}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {loading ? 'Processing...' : 'Summarize'}
                </button>

                <div className="flex items-center gap-2">
                    <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="border p-2 rounded"
                    >
                        <option value="hi">Hindi</option>
                        <option value="bn">Bengali</option>
                        <option value="ta">Tamil</option>
                        <option value="te">Telugu</option>
                        <option value="mr">Marathi</option>
                    </select>
                    <button
                        onClick={handleTranslate}
                        disabled={!text || text.trim() === '' || loading}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
                    >
                        {loading ? 'Processing...' : 'Translate'}
                    </button>
                </div>
            </div>

            {/* Results */}
            {loading && <div className="text-center mb-4">Processing...</div>}
            
            {summary && (
                <div className="mb-6">
                    <h3 className="font-bold mb-2">Summary:</h3>
                    <div className="border p-4 rounded bg-gray-50">
                        {summary}
                    </div>
                </div>
            )}

            {translatedText && (
                <div className="mb-6">
                    <h3 className="font-bold mb-2">Translation:</h3>
                    <div className="border p-4 rounded bg-gray-50">
                        {translatedText}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentProcessor; 