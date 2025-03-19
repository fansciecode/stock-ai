import logger from '../utils/logger.js';

// In your controller functions
export const exampleController = async (req, res) => {
  const timer = logger.startTimer();
  
  try {
    logger.info('Processing request', { 
      path: req.path,
      method: req.method,
      query: req.query
    });

    // Your controller logic here
    const result = await someOperation();

    logger.info('Operation successful', { 
      userId: req.user?.id,
      resultId: result.id 
    });

    timer.end('Request completed');
    res.json(result);

  } catch (error) {
    logger.error('Error in exampleController', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      userId: req.user?.id
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}; 