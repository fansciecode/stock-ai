# IBCM-ai module initialization
# This package contains all AI functionality for the IBCM platform

import logging
import os
from ..config import LOG_LEVEL

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Create models directory if it doesn't exist
os.makedirs(os.path.join(os.path.dirname(os.path.dirname(__file__)), "models"), exist_ok=True)

# Import submodules to make them available when importing the ai package
from . import text_generation
from . import recommend
from . import search
from . import sentiment
from . import user_analytics
from . import business_analytics 