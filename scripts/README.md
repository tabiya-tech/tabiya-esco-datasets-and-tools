# Scripts

## [esco-to-tabiya](esco-to-tabiya)

Contains the scripts used to transform the ESCO classification system to the tabiya open taxonomy platform.

To run the script you need to have [nodejs](https://nodejs.org/en/) installed.

Also make sure to run `npm install` in the root project folder to install the required dependencies.

This is a `one use` script to generate the first version. 
It generates unique UUIDs for every entity (model, skill, occupation, etc.) and creates new CSV files with the tabiya open taxonomy platform format. 
To manage existing models, you need to use the [tabiya open taxonomy platform](https://github.com/tabiya-tech/taxonomy-model-application/).

## [sqlite](sqlite)

Contains the scripts used to import and export the ESCO classification system to and from a sqlite database.

To run the scripts you need to have [sqlite](https://www.sqlite.org/index.html) installed.

> When generating a new version of the tabiya dataset for relase, make sure to run both the esco-to-tabiya [transform](esco-to-tabiya/transform.js) script and the sqlite ([import](sqlite/import-sqlite.sh)/[export](sqlite/export-sql.sh)) scripts.
> This is important to ensure that the data is consistent across all formats.

## [denormalized-occupation-skills](denormalized-occupation-skills)

Generate a denormalized occupations-to-skills relations file.
Read more [here](denormalized-occupation-skills).
