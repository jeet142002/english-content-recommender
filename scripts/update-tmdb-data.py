#!/usr/bin/env python3
"""
Automated TMDB data update script for production deployment.
Run this script periodically (e.g., weekly) to keep the catalog fresh.
"""

import os
import sys
import logging
from datetime import datetime
from pathlib import Path

# Add the recommender_api directory to Python path
sys.path.append(str(Path(__file__).parent.parent / "apps" / "recommender_api"))

from ingest_tmdb_catalog import main as ingest_main

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('tmdb-updates.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def main():
    """Main update function with error handling and logging."""
    start_time = datetime.now()
    logger.info("=" * 50)
    logger.info(f"Starting TMDB data update at {start_time}")
    
    try:
        # The ingester accepts either TMDB's v3 API key or v4 read token.
        if not (os.getenv('TMDB_API_KEY') or os.getenv('TMDB_API_TOKEN')):
            logger.error("TMDB_API_KEY or TMDB_API_TOKEN is required")
            sys.exit(1)
        
        # Run the ingestion process
        logger.info("Starting TMDB data ingestion...")
        ingest_main()
        
        # Calculate duration
        duration = datetime.now() - start_time
        logger.info(f"✅ TMDB data update completed successfully in {duration}")
        
        # Update timestamp file
        with open('.last_update', 'w') as f:
            f.write(str(datetime.now()))
            
        return 0
        
    except Exception as e:
        logger.error(f"❌ TMDB data update failed: {str(e)}")
        logger.error(f"Error occurred after {datetime.now() - start_time}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
