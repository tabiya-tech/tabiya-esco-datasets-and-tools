#!/bin/bash
# Path to the SQLite binary
SQLITE_BIN=./bin/sqlite3

# Path to SQLite database file
DATABASE="datasets/tabiya/esco-v1.1.1/sql/database.db"

# Path to directory containing CSV files
CSV_DIRECTORY="../../datasets/tabiya/esco-v1.1.1/csv"

# Create the SQLite database file if it doesn't exist
if [[ ! -e $DATABASE ]]; then
    "$SQLITE_BIN" $DATABASE ""
fi

# Loop through CSV files in the directory
for file in $CSV_DIRECTORY/*.csv; do
    echo "Processing file: $file"
    # Get the table name from the filename (without the extension)
    table=$(basename "$file" .csv)

    # Import CSV file into SQLite table
    echo "Importing $file into table $table..."
    "$SQLITE_BIN" -separator ',' "$DATABASE" ".mode csv" ".import $file $table"

    # Check the exit status of the SQLite import command
    status=$?
    if [[ $status -ne 0 ]]; then
        echo "Error importing $file into table $table. Exiting."
        exit 1
    fi
done

echo "CSV files imported into SQLite successfully."
