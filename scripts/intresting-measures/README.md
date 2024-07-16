# Interesting Measures

This script calculates interesting measures for skills and occupations such as degree centrality and inter-occupation transferability. These measures help in understanding the importance and transferability of skills across different occupations.

## Description

The script reads data from CSV files, processes it to compute the following metrics for each skill:
- **Degree Centrality (Formal Economy)**: The number of formal (high signaling value or essential) relations a skill has.
- **Degree Centrality (All Occupations)**: The total number of relations a skill has.
- **Inter-Occupation Transferability (Formal Economy)**: The ratio of formal relations a skill has to the total number of occupations.
- **Inter-Occupation Transferability (All Occupations)**: The ratio of all relations a skill has to the total number of occupations.

The results are saved back to a CSV file, updating the original skills data with these new measures.

## Usage

1. You need to first have the downloaded ESCO model data in the following format:
    ```
    <path_to_esco_model_directory>
    ├── occupations.csv
    ├── skills.csv
    ├── occupation_to_skill_relations.csv
    ```
2. Update a `paths.json` file with the following content:
    ```json
    {
        "path_to_model": "<path_to_input_directory>"
    }
    ```
3. Run the script:
    ```bash
    python main.py
    ```

## How It Works

1. **Get Total Occupations**: The `get_total_occupations` function reads the `occupations.csv` file and counts the total number of occupations.

2. **Count Relations by Skill ID**: The `count_relations_by_skill_id` function reads the `occupation_to_skill_relations.csv` file and creates a map of skill IDs to the number of their relations, distinguishing between formal and all relations.

3. **Calculate Interesting Measures**: The `occupations_interesting_measures` function:
    - Gets the total number of occupations.
    - Deletes any existing `skills_with_intresting_measures.csv` file.
    - Reads the `skills.csv` file and calculates the degree centrality and inter-occupation transferability for each skill.
    - Writes these measures to a new `skills_with_intresting_measures.csv` file.
    - Creates a new file name `skills_with_intresting_measures.csv` with the updated skills data (including intresting measures).

4. **Execution**: When run as the main module, the script reads the configuration from `paths.json`, calculates the interesting measures, and prints the duration of the process.

