#!/bin/bash

# Path to the SQLite binary
SQLITE_BIN=./bin/sqlite3

# Path to SQLite database file
DATABASE="datasets/tabiya/esco-v1.1.1/sql/database.db"

# Output directory for SQL script files
OUTPUT_DIRECTORY="datasets/tabiya/esco-v1.1.1/sql/"

# Create the output directory if it doesn't exist
mkdir -p "$OUTPUT_DIRECTORY"

# Get list of tables in the SQLite database
tables=$("$SQLITE_BIN" -separator ' ' "$DATABASE" "SELECT name FROM sqlite_master WHERE type='table';")

# Loop through tables
for table in $tables; do
    # Generate SQL script file name
    script_file="$OUTPUT_DIRECTORY/$table.sql"

    # Export data from SQLite table into SQL script file
    echo "Exporting data from table $table to $script_file..."
    "$SQLITE_BIN" -separator ' ' "$DATABASE" ".headers on" ".mode insert $table" ".output $script_file" "SELECT * FROM $table;"

    # Check the exit status of the SQLite export command
    status=$?
    if [[ $status -ne 0 ]]; then
        echo "Error exporting data from table $table. Exiting."
        exit 1
    fi

    # Export DDL create table statement into SQL script file
    ddl_script_file="$OUTPUT_DIRECTORY/${table}_ddl.sql"
    echo "Exporting DDL create table statement for $table to $ddl_script_file..."
    "$SQLITE_BIN" -separator ' ' "$DATABASE" ".schema $table" > "$ddl_script_file"

    # Check the exit status of the SQLite export commands
    status=$?
    if [[ $status -ne 0 ]]; then
        echo "Error exporting data or DDL for table $table. Exiting."
        exit 1
    fi
done

echo "Data exported from SQLite to SQL script files successfully."
