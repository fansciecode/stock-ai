import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || 'development_key';

export const DescriptionGeneratorService = {
    generateEventDescription: async (eventData) => {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/generate-description`, eventData, {
                headers: { 'X-API-KEY': AI_SERVICE_API_KEY }
            });
            return response.data;
        } catch (error) {
            console.error('Description generation error:', error);
            return null;
        }
    },
    generateProductDescription: async (productData) => {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/generate-description`, productData, {
                headers: { 'X-API-KEY': AI_SERVICE_API_KEY }
            });
            return response.data;
        } catch (error) {
            console.error('Product description error:', error);
            return null;
        }
    }
};

export const ImageRecognitionService = {
    analyzeImage: async (imageData) => {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/analyze-image`, { image_url: imageData }, {
                headers: { 'X-API-KEY': AI_SERVICE_API_KEY }
            });
            return response.data;
        } catch (error) {
            console.error('Image analysis error:', error);
            return null;
        }
    },
    validateEventImages: async (images) => {
        try {
            const results = await Promise.all(
                images.map(img => ImageRecognitionService.analyzeImage(img))
            );
            return {
                isValid: results.every(r => r && r.contentModeration && r.contentModeration.isAppropriate),
                suggestions: generateImageSuggestions(results),
                optimizationTips: provideOptimizationTips(results)
            };
        } catch (error) {
            console.error('Event image validation error:', error);
            return null;
        }
    }
};

export const VideoProcessorService = {
    analyzeVideo: async (videoData) => {
        try {
            // Process video frames and audio
            const frames = await extractKeyFrames(videoData);
            const audioTranscript = await transcribeAudio(videoData);

            return {
                contentSummary: await generateVideoSummary(frames, audioTranscript),
                keyMoments: identifyKeyMoments(frames),
                transcription: audioTranscript,
                contentWarnings: checkContentWarnings(frames)
            };
        } catch (error) {
            console.error('Video analysis error:', error);
            return null;
        }
    },

    generateThumbnail: async (videoData) => {
        try {
            const keyFrames = await extractKeyFrames(videoData);
            const bestFrame = await selectBestThumbnail(keyFrames);

            return {
                thumbnail: bestFrame,
                alternativeThumbnails: generateAlternatives(keyFrames),
                previewGif: await createPreviewGif(keyFrames)
            };
        } catch (error) {
            console.error('Thumbnail generation error:', error);
            return null;
        }
    }
};
