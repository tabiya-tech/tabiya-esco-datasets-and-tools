# Denormalize Occupations to Skills relations

Generate a denormalized occupations-to-skills relations file.

The script requires an _Input file_, an _ESCO Occupations file_, _ESCO Skills file and_ an _ESCO Occupations-Skills file_.

- **Input file**:
  A csv file containing the esco occupations for which the skills will be added. The file must have the columns `ESCO_occ_1`, `ESCO_occ_2`, `ESCO_occ_3` that contain the ESCO occupation codes (can be left empty). The skills will be appended as extras columns at the end of each row. The file can contain any number of additional columns and rows. An example of an input file is the [sample-input.csv](test-cases/sample-input.csv) file.

- **ESCO Occupations file**: A csv file containing the ESCO occupations (e.g. [/datasets/tabiya/esco-v1.1.1/csv/occupations.csv](../../datasets/tabiya/esco-v1.1.1/csv/occupations.csv) ).

- **ESCO Skills file**: A csv file containing the ESCO skills (e.g [/datasets/tabiya/esco-v1.1.1/csv/skills.csv](../../datasets/tabiya/esco-v1.1.1/csv/skills.csv)).

- **ESCO Occupations-Skills file**: A csv  file containing the ESCO occupation to skills relations (e.g. [/datasets/tabiya/esco-v1.1.1/csv/occupation_skill_relations.csv](../../datasets/tabiya/esco-v1.1.1/csv/occupation_skill_relations.csv)).

# Running the script 
The script is distributed as a node.js script. To run the script you need to have [Node.js ^16.0](https://nodejs.org/dist/latest-v16.x/) installed on your machine. See  [Generating a ready to use bundle](#Generate-a-ready-to-use-bundle) for more information on how to create the distribution bundle.

## Run the script
From the `dist` folder run the following command after replacing the placeholder `[]` with the correct values of the arguments:

```
node ./denormalize-occupation-skills.js --inputFilePath [/path/to/input/file.csv] --maxSkills [number] --pathToEscoFiles [/path/to/esco/files]

```
Run the script without providing any arguments to see the help message.

# Developing the script

To develop the script follow the instructions below.

## Requirements

To run the script you need to have the following:
- [Node.js ^16.0](https://nodejs.org/dist/latest-v16.x/)
- [Yarn ^1.22](https://classic.yarnpkg.com/en/)

## Install dependencies

```
yarn install
```

# Generate a ready to use bundle

Run the following command to generate a ready to use bundle in the `dist` folder:

```
yarn build:denormalized-occupation-skills
```