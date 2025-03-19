import { franc } from 'franc';
import langs from 'langs';
import { Translate } from '@google-cloud/translate/build/src/v2/index.js';

export class LanguageDetector {
    constructor() {
        this.translate = new Translate({
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        });
    }

    async detectLanguage(text) {
        try {
            // Try Google Translate API first
            try {
                const [detection] = await this.translate.detect(text);
                return {
                    primary: detection.language,
                    confidence: detection.confidence,
                    name: this.getLanguageName(detection.language)
                };
            } catch (error) {
                console.warn('Google Translate detection failed, falling back to franc:', error);
                
                // Fallback to franc for offline detection
                const langCode = franc(text);
                const language = langs.where('3', langCode);
                
                return {
                    primary: language ? language['1'] : 'unknown',
                    confidence: 0.6, // franc doesn't provide confidence scores
                    name: language ? language.name : 'Unknown'
                };
            }
        } catch (error) {
            console.error('Language detection error:', error);
            throw error;
        }
    }

    async detectMultipleLanguages(text) {
        try {
            const segments = this.splitIntoSegments(text);
            const detections = await Promise.all(
                segments.map(segment => this.detectLanguage(segment))
            );

            return {
                segments: detections,
                primary: this.findPrimaryLanguage(detections),
                languages: this.summarizeLanguages(detections)
            };
        } catch (error) {
            console.error('Multiple language detection error:', error);
            throw error;
        }
    }

    getLanguageName(code) {
        const language = langs.where('1', code);
        return language ? language.name : 'Unknown';
    }

    splitIntoSegments(text, minLength = 20) {
        // Split text into sentences or meaningful segments
        return text
            .split(/[.!?]+/)
            .map(segment => segment.trim())
            .filter(segment => segment.length >= minLength);
    }

    findPrimaryLanguage(detections) {
        const languageCounts = detections.reduce((acc, detection) => {
            acc[detection.primary] = (acc[detection.primary] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(languageCounts)
            .sort(([, a], [, b]) => b - a)[0][0];
    }

    summarizeLanguages(detections) {
        const languages = {};
        
        detections.forEach(detection => {
            if (!languages[detection.primary]) {
                languages[detection.primary] = {
                    code: detection.primary,
                    name: this.getLanguageName(detection.primary),
                    confidence: detection.confidence,
                    count: 1
                };
            } else {
                languages[detection.primary].count++;
                languages[detection.primary].confidence = 
                    (languages[detection.primary].confidence + detection.confidence) / 2;
            }
        });

        return Object.values(languages)
            .sort((a, b) => b.count - a.count);
    }
}

export default new LanguageDetector(); 