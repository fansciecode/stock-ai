const aiErrorHandler = (err, req, res, next) => {
    if (err.name === 'OpenAIError') {
        return res.status(500).json({
            success: false,
            message: 'AI Service temporarily unavailable',
            fallback: true
        });
    }
    next(err);
};

// Usage in routes
router.use(aiErrorHandler);
