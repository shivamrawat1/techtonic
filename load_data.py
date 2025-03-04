#!/usr/bin/env python
"""
Script to load data from a JSON dump into the PostgreSQL database on Railway.
"""
import os
import sys
import logging
import django
from django.core.management import call_command

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('data_migration.log')
    ]
)
logger = logging.getLogger(__name__)

def main():
    """Load data from JSON dump into the database."""
    try:
        logger.info("Starting data migration process")
        
        # Check if the data dump file exists
        if not os.path.exists('data_dump.json'):
            logger.error("data_dump.json file not found")
            return False
        
        # Set up Django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'capstone_django.settings')
        django.setup()
        
        # Load data from the JSON dump
        logger.info("Loading data from data_dump.json")
        call_command('loaddata', 'data_dump.json')
        
        logger.info("Data migration completed successfully")
        return True
    except Exception as e:
        logger.error(f"Error during data migration: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 