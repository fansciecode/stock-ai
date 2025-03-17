import { ImageAnnotatorClient } from '@google-cloud/vision';
import { createWorker } from 'tesseract.js';

export class OCRService {
    constructor() {
        // Initialize Google Cloud Vision client
        this.visionClient = new ImageAnnotatorClient({
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        });
        
        // Initialize Tesseract worker for fallback
        this.worker = null;
        this.initializeTesseract();
    }

    async initializeTesseract() {
        try {
            this.worker = await createWorker();
            // In v4, we use load() instead of loadLanguage() and initialize()
            await this.worker.load();
            await this.worker.setParameters({
                tessedit_ocr_engine_mode: 1, // Use LSTM OCR Engine
                tessedit_pageseg_mode: 1,    // Automatic page segmentation with OSD
                preserve_interword_spaces: 1  // Preserve whitespace
            });
            console.log('Tesseract initialized successfully');
        } catch (error) {
            console.error('Error initializing Tesseract:', error);
            throw error;
        }
    }

    async extractText(documents) {
        try {
            // Try Google Cloud Vision first
            try {
                const results = await Promise.all(
                    documents.map(doc => this.extractWithGoogleVision(doc))
                );
                return this.processResults(results);
            } catch (error) {
                console.warn('Google Vision failed, falling back to Tesseract:', error);
                
                // Fallback to Tesseract
                const results = await Promise.all(
                    documents.map(doc => this.extractWithTesseract(doc))
                );
                return this.processResults(results);
            }
        } catch (error) {
            console.error('OCR extraction error:', error);
            throw error;
        }
    }

    async extractWithGoogleVision(document) {
        try {
            const [result] = await this.visionClient.documentTextDetection(document.path);
            const fullTextAnnotation = result.fullTextAnnotation;

            return {
                text: fullTextAnnotation.text,
                confidence: this.calculateConfidence(fullTextAnnotation),
                blocks: this.extractTextBlocks(fullTextAnnotation),
                language: this.detectLanguage(fullTextAnnotation)
            };
        } catch (error) {
            console.error('Google Vision extraction error:', error);
            throw error;
        }
    }

    async extractWithTesseract(document) {
        try {
            if (!this.worker) {
                throw new Error('Tesseract worker not initialized');
            }
            const { data } = await this.worker.recognize(document.path);
            
            return {
                text: data.text,
                confidence: data.confidence / 100,
                blocks: this.parseTesseractBlocks(data),
                language: 'eng'
            };
        } catch (error) {
            console.error('Tesseract extraction error:', error);
            throw error;
        }
    }

    calculateConfidence(annotation) {
        if (!annotation.pages || annotation.pages.length === 0) {
            return 0;
        }

        let totalConfidence = 0;
        let totalWords = 0;

        annotation.pages.forEach(page => {
            page.blocks.forEach(block => {
                block.paragraphs.forEach(paragraph => {
                    paragraph.words.forEach(word => {
                        totalConfidence += word.confidence;
                        totalWords++;
                    });
                });
            });
        });

        return totalWords > 0 ? totalConfidence / totalWords : 0;
    }

    extractTextBlocks(annotation) {
        return annotation.pages.map(page => {
            return page.blocks.map(block => {
                return {
                    text: block.paragraphs
                        .map(p => p.words
                            .map(w => w.symbols
                                .map(s => s.text)
                                .join('')
                            )
                            .join(' ')
                        )
                        .join('\n'),
                    confidence: block.confidence,
                    boundingBox: block.boundingBox
                };
            });
        }).flat();
    }

    parseTesseractBlocks(data) {
        return data.blocks.map(block => ({
            text: block.text,
            confidence: block.confidence / 100,
            boundingBox: {
                x: block.bbox.x0,
                y: block.bbox.y0,
                width: block.bbox.x1 - block.bbox.x0,
                height: block.bbox.y1 - block.bbox.y0
            }
        }));
    }

    detectLanguage(annotation) {
        // Implement language detection based on Google Vision results
        return annotation.pages[0]?.property?.detectedLanguages[0]?.languageCode || 'und';
    }

    processResults(results) {
        return {
            text: results.map(r => r.text).join('\n'),
            confidence: results.reduce((acc, r) => acc + r.confidence, 0) / results.length,
            blocks: results.flatMap(r => r.blocks),
            languages: [...new Set(results.map(r => r.language))]
        };
    }

    async cleanup() {
        if (this.worker) {
            await this.worker.terminate();
        }
    }
}

export default new OCRService(); 