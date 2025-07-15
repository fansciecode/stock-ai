import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import { SpeechClient } from '@google-cloud/speech';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { LanguageDetector } from '../../utils/languageDetector.js';
import { AudioModel } from '../../../models/audioModel.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || 'development_key';

const speechClient = new SpeechClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

export class VoiceProcessor {
    // 1. Voice Command Processing
    async processVoiceCommand(audioData) {
        try {
            // First enhance the audio
            const enhancedAudio = await this.enhanceAudio(audioData);
            // Then transcribe it
            const transcription = await this.transcribeAudio(enhancedAudio);
            // Finally analyze the intent
            const intent = await this.analyzeIntent(transcription);
            return {
                text: {
                    raw: transcription.text,
                    normalized: this.normalizeText(transcription.text),
                    language: transcription.language
                },
                intent: {
                    primary: intent.mainIntent,
                    secondary: intent.subIntents,
                    confidence: intent.confidence
                },
                action: {
                    type: this.determineActionType(intent),
                    parameters: this.extractActionParameters(intent),
                    context: this.identifyContext(intent)
                },
                metadata: {
                    duration: audioData.duration,
                    quality: this.assessAudioQuality(enhancedAudio),
                    confidence: this.calculateOverallConfidence(transcription, intent)
                }
            };
        } catch (error) {
            console.error('Voice command processing error:', error);
            throw error;
        }
    }

    // 2. Audio Transcription
    async transcribeAudio(audioData) {
        try {
            // Try IBCM-ai microservice first
            try {
                const response = await axios.post(`${AI_SERVICE_URL}/transcribe-audio`, {
                    audio_path: audioData.path
                }, {
                    headers: { 'X-API-KEY': AI_SERVICE_API_KEY }
                });
                return response.data;
            } catch (aiError) {
                console.warn('IBCM-ai transcription failed, falling back to Google Speech:', aiError);
                // Fallback to Google Speech-to-Text
                const audioContent = readFileSync(audioData.path);
                const audio = {
                    content: audioContent.toString('base64')
                };
                const config = {
                    encoding: 'LINEAR16',
                    sampleRateHertz: 16000,
                    languageCode: 'en-US',
                    enableAutomaticPunctuation: true,
                    model: 'latest_long'
                };
                const request = {
                    audio: audio,
                    config: config
                };
                const [response] = await speechClient.recognize(request);
                const transcription = response.results
                    .map(result => result.alternatives[0].transcript)
                    .join('\n');
                return {
                    text: transcription,
                    language: 'en-US',
                    confidence: response.results[0]?.alternatives[0]?.confidence || 0.8
                };
            }
        } catch (error) {
            console.error('Audio transcription error:', error);
            throw error;
        }
    }

    // 3. Audio Enhancement
    async enhanceAudio(audioData) {
        return new Promise((resolve, reject) => {
            const outputPath = path.join(process.cwd(), 'tmp', `enhanced-${Date.now()}.wav`);
            
            ffmpeg(audioData.path)
                .audioFilter('highpass=f=200, lowpass=f=3000')
                .audioFilter('volume=1.5')
                .audioFilter('anlmdn') // Noise reduction
                .audioFilter('acompressor') // Compression for better clarity
                .toFormat('wav')
                .on('end', () => {
                    resolve({
                        path: outputPath,
                        format: 'wav',
                        enhanced: true,
                        duration: audioData.duration
                    });
                })
                .on('error', (err) => reject(err))
                .save(outputPath);
        });
    }

    // 4. Intent Analysis
    async analyzeIntent(transcription) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/analyze-intent`, {
                text: transcription.text
            }, {
                headers: { 'X-API-KEY': AI_SERVICE_API_KEY }
            });
            const analysis = response.data;
            
            return {
                mainIntent: this.extractMainIntent(analysis),
                subIntents: this.extractSubIntents(analysis),
                confidence: this.calculateIntentConfidence(analysis),
                parameters: this.extractParameters(analysis)
            };
        } catch (error) {
            console.error('Intent analysis error:', error);
            throw error;
        }
    }

    // Helper methods
    normalizeText(text) {
        return text
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');
    }

    assessAudioQuality(audioData) {
        // Implement basic audio quality assessment
        return {
            quality: 'high',
            score: 0.9,
            enhanced: audioData.enhanced || false
        };
    }

    calculateOverallConfidence(transcription, intent) {
        return (transcription.confidence + intent.confidence) / 2;
    }

    extractMainIntent(analysis) {
        try {
            const intentMatch = analysis.match(/Intent: (.*?)(\n|$)/);
            return intentMatch ? intentMatch[1] : 'unknown';
        } catch (error) {
            console.error('Error extracting main intent:', error);
            return 'unknown';
        }
    }

    extractSubIntents(analysis) {
        try {
            const subIntentsMatch = analysis.match(/Sub-intents: (.*?)(\n|$)/);
            return subIntentsMatch ? 
                subIntentsMatch[1].split(',').map(i => i.trim()) : 
                [];
        } catch (error) {
            console.error('Error extracting sub-intents:', error);
            return [];
        }
    }

    extractParameters(analysis) {
        try {
            const paramsMatch = analysis.match(/Parameters: ({.*?})/);
            return paramsMatch ? 
                JSON.parse(paramsMatch[1]) : 
                {};
        } catch (error) {
            console.error('Error extracting parameters:', error);
            return {};
        }
    }

    calculateIntentConfidence(analysis) {
        try {
            const confidenceMatch = analysis.match(/Confidence: (0\.\d+)/);
            return confidenceMatch ? 
                parseFloat(confidenceMatch[1]) : 
                0.8;
        } catch (error) {
            console.error('Error calculating intent confidence:', error);
            return 0.8;
        }
    }

    determineActionType(intent) {
        // Map intent to action type
        const actionMap = {
            search: 'SEARCH',
            create: 'CREATE',
            update: 'UPDATE',
            delete: 'DELETE',
            query: 'QUERY',
            navigate: 'NAVIGATE'
        };

        return actionMap[intent.mainIntent.toLowerCase()] || 'UNKNOWN';
    }

    extractActionParameters(intent) {
        return intent.parameters || {};
    }

    identifyContext(intent) {
        return {
            domain: this.extractDomain(intent),
            entities: this.extractEntities(intent),
            timeframe: this.extractTimeframe(intent)
        };
    }

    extractDomain(intent) {
        // Implementation
        return 'general';
    }

    extractEntities(intent) {
        // Implementation
        return [];
    }

    extractTimeframe(intent) {
        // Implementation
        return 'present';
    }

    // 5. Voice Response Generation
    async generateVoiceResponse(responseData) {
        try {
            const synthesizedSpeech = await synthesizeSpeech({
                text: responseData.text,
                language: responseData.language || 'en-US',
                voice: responseData.voice || 'neutral'
            });

            return {
                audio: {
                    data: synthesizedSpeech.audioData,
                    format: synthesizedSpeech.format,
                    duration: synthesizedSpeech.duration
                },
                text: {
                    original: responseData.text,
                    ssml: generateSSML(responseData),
                    phonetics: generatePhonetics(responseData)
                },
                metadata: {
                    voice: synthesizedSpeech.voice,
                    emotions: analyzeEmotions(responseData),
                    emphasis: identifyEmphasis(responseData)
                }
            };
        } catch (error) {
            console.error('Voice response generation error:', error);
            throw error;
        }
    }

    // 6. Voice Authentication
    async authenticateVoice(voiceSample, userId) {
        try {
            const voiceprint = await extractVoiceprint(voiceSample);
            const storedVoiceprint = await retrieveStoredVoiceprint(userId);

            return {
                authentication: {
                    match: compareVoiceprints(voiceprint, storedVoiceprint),
                    confidence: calculateMatchConfidence(voiceprint, storedVoiceprint),
                    factors: analyzeMatchingFactors(voiceprint, storedVoiceprint)
                },
                security: {
                    livenessScore: detectLiveness(voiceSample),
                    spoofingCheck: checkForSpoofing(voiceSample),
                    riskFactors: assessSecurityRisks(voiceSample)
                },
                recommendations: {
                    updateRequired: shouldUpdateVoiceprint(voiceprint, storedVoiceprint),
                    additionalSteps: suggestSecurityMeasures(voiceprint),
                    improvements: recommendVoiceprintImprovements(voiceprint)
                }
            };
        } catch (error) {
            console.error('Voice authentication error:', error);
            throw error;
        }
    }

    // 7. Voice Enhancement
    async enhanceVoice(audioData, options = {}) {
        try {
            const enhanced = await enhanceAudio(audioData, options);

            return {
                audio: {
                    enhanced: enhanced.data,
                    original: audioData,
                    improvement: calculateImprovement(audioData, enhanced)
                },
                adjustments: {
                    noise: enhanced.noiseReduction,
                    clarity: enhanced.clarityEnhancement,
                    volume: enhanced.volumeNormalization
                },
                quality: {
                    before: assessAudioQuality(audioData),
                    after: assessAudioQuality(enhanced.data),
                    metrics: calculateQualityMetrics(enhanced)
                }
            };
        } catch (error) {
            console.error('Voice enhancement error:', error);
            throw error;
        }
    }

    // 8. Multi-language Voice Processing
    async processMultiLanguage(audioData) {
        try {
            const language = await detectLanguage(audioData);
            const processed = await processVoiceByLanguage(audioData, language);

            return {
                detection: {
                    primary: language.primary,
                    confidence: language.confidence,
                    alternatives: language.alternatives
                },
                processing: {
                    text: processed.transcription,
                    translation: await translateContent(processed.transcription),
                    localizedResponse: generateLocalizedResponse(processed)
                },
                analysis: {
                    accent: detectAccent(audioData),
                    dialect: identifyDialect(audioData),
                    fluency: assessFluency(audioData)
                }
            };
        } catch (error) {
            console.error('Multi-language processing error:', error);
            throw error;
        }
    }
}
