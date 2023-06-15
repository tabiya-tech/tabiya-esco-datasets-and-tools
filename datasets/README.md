# ESCO

The data found in this folder where downloaded from the https://esco.ec.europa.eu/en . They are offered here for easier access.


## V1.1.1

### [esco/v1.1.1/classification](esco/v1.1.1/classification)

Contains the ESCO v.1.1.1 classification files compressed and extracted in CSV format.

| File                                                  | MD5 Hash                             |
|-------------------------------------------------------|--------------------------------------|
| ESCO dataset - v1.1.1 - classification - en - csv.zip | bb2f89a9efae25d2216748c86d1cb413     |
| ISCOGroups_en.csv                                     | 23f574db0057f59243f73b181c2159ba     |
| checklist.chk                                         | d41d8cd98f00b204e9800998ecf8427e     |
| conceptSchemes_en.csv                                 | 33a61732408b31ddb405183ff1644ac4     |
| digCompSkillsCollection_en.csv                        | 48ec8eabb9c587bc7eadd023832ce7e4     |
| digitalSkillsCollection_en.csv                        | efb0fb8f80d8ca7c294d98f5f6cfdc88     |
| greenSkillsCollection_en.csv                          | 6fef9e5ac7d5ea28bda947f0333b3afc     |
| languageSkillsCollection_en.csv                       | 7d957a210020a97c100d577e3c81e5bb     |
| occupations_en.csv                                    | f88c2bdcda9ec1340fec7cfdfb250b0f     |
| researchOccupationsCollection_en.csv                  | 3fcf45ab6c76017b4b1ec0e7cfacf43c     |
| researchSkillsCollection_en.csv                       | b5e49b379d26038c15151a4884b7e9b9     |
| skillGroups_en.csv                                    | 29555776867ae0ea103ed207a408beb5     |
| skillsHierarchy_en.csv                                | f4f105c2fb876e0ef2580d131a7105e3     |
| skills_en.csv                                         | 6ad63af02032d0776c637e87b6fe1643     |
| transversalSkillsCollection_en.csv                    | 6f3322e5093648ce4cb3a502d64ab335     |

The actual data where downloaded from the following link:
https://ec.europa.eu/esco/download/ESCO%20dataset%20-%20v1.1.1%20-%20classification%20-%20en%20-%20csv.zip

### [esco/v1.1.1/relations](esco/v1.1.1/relations)

Contains the ESCO v.1.1.1 relations files compressed and extracted in CSV format.

| File                                                | MD5 Hash                          |
|-----------------------------------------------------|-----------------------------------|
| ESCO dataset - v1.1.1 - classification -  - csv.zip | 7b580b5cbf9efde2f8a904cff14c71c0  |
| broaderRelationsOccPillar.csv                       | d28fdf28211d6ab44f3b961343357a3c  |
| broaderRelationsSkillPillar.csv                     | 3a567ab10bd6c94d551079f07b87bcac  |
| occupationSkillRelations.csv                        | 403d5b115d3241eb7b35fd34863338ba  |
| skillSkillRelations.csv                             | 8667fd959d13c5a9d3071d6e3aedbd7b  |


The actual data where downloaded from the following link:
https://ec.europa.eu/esco/download/ESCO%20dataset%20-%20v1.1.1%20-%20classification%20-%20%20-%20csv.zip

## V1.1.0
Contains the ESCO v.1.1.0 classification and relations files compressed.

| File                                                  | MD5 Hash                          |
|-------------------------------------------------------|-----------------------------------|
| ESCO dataset - v1.1.0 - classification - en - csv.zip | 8ffb0742fbe0a077b26946bc313cdf6c  |
| ESCO dataset - v1.1.0 - classification -  - csv.zip   | 25994114327987ddf8eecc35dc7f6fb6  |

The actual data where downloaded from the following links:   
https://ec.europa.eu/esco/download/ESCO%20dataset%20-%20v1.1.0%20-%20classification%20-%20en%20-%20csv.zip

https://ec.europa.eu/esco/download/ESCO%20dataset%20-%20v1.1.0%20-%20classification%20-%20%20-%20csv.zip

# Tabiya

## [tabiya/esco-v1.1.1/csv](tabiya/esco-v1.1.1/csv) 

Contains the ESCO v.1.1.1 model in CSV format transformed so that it can be imported into the tabiya platform.
The files where generated using the [transform.js](../scripts/esco-to-tabiya/transform.js) script.

## [tabiya/esco-v1.1.1/sql](tabiya/esco-v1.1.1/sql)

Contains the ESCO v.1.1.1 transformed model as [sqlite](https://www.sqlite.org/index.html) database.

The [database.db](tabiya/esco-v1.1.1/sql/database.db) was imported using the [import-sqlite.sh](../scripts/sqlite/import-sqlite.sh) script.

The complementary sql and ddl files where generated using the [export-sql.sh](../scripts/sqlite/export-sql.sh) script.

No md5 hashes are provided for the sql files, as they are generated the CSV files from [tabiya/esco-v1.1.1/csv](tabiya/esco-v1.1.1/csv) which are in turn generated from the original ESCO files that can be found in the [esco/v1.1.1](esco/v1.1.1) folder.

## [tabiya/samples/esco-v1.1.1](tabiya/samples/esco-v1.1.1)

Contains an arbitrary subset of the ESCO v.1.1.1 in CSV format that can be imported into the tabiya platform. The purpose of this dataset is to be used as a sample dataset for testing and development purposes.

The files where generated using the  [transform.js](../scripts/esco-to-tabiya/transform.js) script.

## Disclaimer

The data provided in this project is intended to align with the ESCO classification system to the best of our knowledge and intentions. We make every effort to ensure the accuracy and consistency of the data. However, we cannot guarantee that the data is identical to the official ESCO data. We are not liable for any damages, inconsistencies, or errors that may arise from the use of this data.
