#!/bin/bash

# Export the database
mysqldump -u root -p fullstack_app > database_backup.sql

echo "Database exported to database_backup.sql" 