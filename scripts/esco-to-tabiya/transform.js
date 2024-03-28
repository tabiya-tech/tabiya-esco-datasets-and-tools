#!/usr/bin/env node

/*
  This is a script to transform the ESCO data into the Tabiya format to generate the first
  version of the tabiya esco csv files. It is only intended for one time use,
  as once the base data is generated, the UUIDs should not change. If you need to regenerate
  the data (for example, in order to update the structure), you should use a different script
  that will not recreate the UUIDs, and instead mutates the csv files in place.
 */
//--------------------------------------------------------------------------
const fs = require('fs');
const {transform} = require("csv/sync");
const {parse} = require('csv/sync');
const {stringify} = require('csv/sync');
const {randomUUID} = require('crypto');
const matchAndAppendUUIDs = require('./mapUUIDS');

const conceptUriToUUIDMapper = new Map()


const BASE_PATH_IN = '../../datasets/esco/v1.1.2'
const BASE_PATH_OUT = '../../datasets/tabiya/esco-v1.1.2(fr)'
const BASE_PATH_SAMPLES = '../../datasets/tabiya/samples/esco-v1.1.2(fr)/'
const LANGUAGE_CODE = 'fr'

const TabiyaObjectType = {
  ISCOGroup: "ISCOGroup",
  ESCOOccupation: "ESCOOccupation",
  SkillGroup: "SkillGroup",
  Skill: "Skill",
}


function processData(escoFileName, tabiyaFileName, transformer, limit) {
  const escoData = fs.readFileSync(escoFileName, 'utf8');
  let escoRecords = parse(escoData, {columns: true});
  if (limit !== undefined) {
    escoRecords = escoRecords.slice(0, limit);
  }
  const tabiyaRecords = transform(escoRecords, transformer)
  const tabiyaData = stringify(tabiyaRecords, {header: true, eof: false});
  fs.writeFileSync(tabiyaFileName, tabiyaData, {encoding: 'utf8'});
  return tabiyaRecords.length
}

let _id = 0;

function addConceptUriToMap(conceptUri) {
  const _conceptUri = conceptUri.toLowerCase().trim();
  if (conceptUriToUUIDMapper.has(_conceptUri)) {
    throw new Error("Duplicate conceptUri: " + _conceptUri)
  }
  const key = `key_${++_id}`;
  conceptUriToUUIDMapper.set(_conceptUri, key);
  return key;
}

function getUUIDFromConceptUri(conceptUri) {
  const _conceptUri = conceptUri.toLowerCase().trim();
  /*if (!conceptUriToUUIDMapper.has(_conceptUri)) {
    console.warn("Unknown conceptUri: " + _conceptUri)
  }*/
  return conceptUriToUUIDMapper.get(_conceptUri);
}

function ISCOGroupsRecordTransformer(record) {
  return {
    ORIGINURI: record['conceptUri'],
    ID: addConceptUriToMap(record['conceptUri']),
    UUIDHISTORY: randomUUID(),
    CODE: record['code'],
    PREFERREDLABEL: record['preferredLabel'],
    ALTLABELS: record['altLabels'],
    DESCRIPTION: record['description'],
  }
}

function SkillGroupsRecordTransformer(record) {
  return {
    ORIGINURI: record['conceptUri'],
    ID: addConceptUriToMap(record['conceptUri']),
    UUIDHISTORY: randomUUID(),
    CODE: record['code'],
    PREFERREDLABEL: record['preferredLabel'],
    ALTLABELS: record['altLabels'],
    DESCRIPTION: record['description'],
    SCOPENOTE: record['scopeNote'],
  }
}

function SkillsRecordTransformer(record) {
  return {
    ORIGINURI: record['conceptUri'],
    ID: addConceptUriToMap(record['conceptUri']),
    UUIDHISTORY: randomUUID(),
    SKILLTYPE: record['skillType'],
    REUSELEVEL: record['reuseLevel'],
    PREFERREDLABEL: record['preferredLabel'],
    ALTLABELS: record['altLabels'],
    DESCRIPTION: record['description'],
    DEFINITION: record['definition'],
    SCOPENOTE: record['scopeNote'],
  }
}

function OccupationsRecordTransformer(record) {
  return {
    ORIGINURI: record['conceptUri'],
    ID: addConceptUriToMap(record['conceptUri']),
    UUIDHISTORY: randomUUID(),
    ISCOGROUPCODE: record['iscoGroup'],
    CODE: record['code'],
    PREFERREDLABEL: record['preferredLabel'],
    ALTLABELS: record['altLabels'],
    DESCRIPTION: record['description'],
    DEFINITION: record['definition'],
    SCOPENOTE: record['scopeNote'],
    REGULATEDPROFESSIONNOTE: record['regulatedProfessionNote'],
    OCCUPATIONTYPE: "escooccupation",
    ISLOCALIZED: "false",
  }
}

function OccupationsHierarchyRecordTransformer(record) {
  let parent_object_type = ""
  if (record['broaderType'] === "ISCOGroup") {
    parent_object_type = TabiyaObjectType.ISCOGroup
  } else if (record['broaderType'] === "Occupation") {
    parent_object_type = TabiyaObjectType.ESCOOccupation
  } else {
    throw new Error("Unknown broader concept type: " + record['broaderType'])
  }

  let child_object_type = ""
  if (record['conceptType'] === "ISCOGroup") {
    child_object_type = TabiyaObjectType.ISCOGroup
  } else if (record['conceptType'] === "Occupation") {
    child_object_type = TabiyaObjectType.ESCOOccupation
  } else {
    throw new Error("Unknown concept type: " + record['conceptType'])
  }
  const parentID = getUUIDFromConceptUri(record['broaderUri'])
  const childID = getUUIDFromConceptUri(record['conceptUri'])

  if (!parentID) {
    console.warn("Occupations Hierarchy: BroaderUri is not known: " + JSON.stringify(record))
    return undefined;
  }

  if (!childID) {
    console.warn("Occupations Hierarchy: ConceptUri is not known: " + JSON.stringify(record))
    return undefined;
  }

  if (parentID === childID) {
    console.warn("Occupations Hierarchy: BroaderUri and ConceptUri are the same: " + JSON.stringify(record))
    return undefined
  }
  return {
    //
    PARENTOBJECTTYPE: parent_object_type,
    PARENTID: parentID,
    CHILDID: childID,
    CHILDOBJECTTYPE: child_object_type,
  }
}

function SkillsHierarchyRecordTransformer(record) {
  let parent_object_type = ""
  if (record['broaderType'] === "SkillGroup") {
    parent_object_type = TabiyaObjectType.SkillGroup
  } else if (record['broaderType'] === "KnowledgeSkillCompetence") {
    parent_object_type = TabiyaObjectType.Skill
  } else {
    throw new Error("Unknown broader concept type: " + record['broaderType'])
  }

  let child_object_type = ""
  if (record['conceptType'] === "SkillGroup") {
    child_object_type = TabiyaObjectType.SkillGroup
  } else if (record['conceptType'] === "KnowledgeSkillCompetence") {
    child_object_type = TabiyaObjectType.Skill
  } else {
    throw new Error("SkillsHierarchy: Unknown concept type: " + record['conceptType'])
  }

  const parentID = getUUIDFromConceptUri(record['broaderUri'])
  const childID = getUUIDFromConceptUri(record['conceptUri'])

  if (!parentID) {
    console.warn("Skills Hierarchy: BroaderUri is not known: " + JSON.stringify(record))
    return undefined;
  }

  if (!childID) {
    console.warn("Skills Hierarchy: ConceptUri is not known: " + JSON.stringify(record))
    return undefined;
  }

  if (parentID === childID) {
    console.warn("Skill Hierarchy: BroaderUri and ConceptUri are the same: " + JSON.stringify(record))
    return undefined
  }

  return {
    //
    PARENTOBJECTTYPE: parent_object_type,
    PARENTID: parentID,
    CHILDID: childID,
    CHILDOBJECTTYPE: child_object_type,
  }
}

function OccupationsSkillsRelationsRecordTransformer(record) {
  const occupationID = getUUIDFromConceptUri(record['occupationUri'])
  const skillID = getUUIDFromConceptUri(record['skillUri'])
  const occupationType = record['occupationType'] || "escooccupation";

  if (!occupationID) {
    console.warn("Occupation-To-Skill Relations: OccupationUri is not known: " + JSON.stringify(record))
    return undefined;
  }

  if (!skillID) {
    console.warn("Occupation-To-Skill Relations: SkillUri is not known: " + JSON.stringify(record))
    return undefined;
  }

  if (occupationID === skillID) {
    console.warn("Occupation-To-Skill Relations: OccupationUri and SkillUri are the same: " + JSON.stringify(record))
    return undefined
  }

  return {
    OCCUPATIONTYPE: occupationType,
    OCCUPATIONID: occupationID,
    RELATIONTYPE: record['relationType'],
    SKILLID: skillID
  }
}

function SkillsSkillsRelationsRecordTransformer(record) {
  const requiringID = getUUIDFromConceptUri(record['originalSkillUri'])
  const requiredID = getUUIDFromConceptUri(record['relatedSkillUri'])

  if (!requiringID) {
    console.warn("Skill-To-Skill Relations: OriginalSkillUri is not known: " + JSON.stringify(record))
    return undefined;
  }

  if (!requiredID) {
    console.warn("Skill-To-Skill Relations: RelatedSkillUri is not known: " + JSON.stringify(record))
    return undefined;
  }

  if (requiringID === requiredID) {
    console.warn("Skill-To-Skill Relations: OriginalSkillUri and RelatedSkillUri are the same: " + JSON.stringify(record))
    return undefined
  }

  return {
    REQUIRINGID: requiringID,
    RELATIONTYPE: record['relationType'],
    REQUIREDID: requiredID
  }
}

function exportCompleteData(source_classification_folder, source_relations_folder, target_folder, stats) {

  stats.ISCOGroups = processData(
    source_classification_folder + `ISCOGroups_${LANGUAGE_CODE}.csv`,
    target_folder + 'isco_groups.csv',
    ISCOGroupsRecordTransformer
  );

  stats.SkillGroups = processData(
    source_classification_folder + `skillGroups_${LANGUAGE_CODE}.csv`,
    target_folder + 'skill_groups.csv',
    SkillGroupsRecordTransformer
  );

  stats.Skills = processData(
    source_classification_folder + `skills_${LANGUAGE_CODE}.csv`,
    target_folder + 'skills.csv',
    SkillsRecordTransformer
  );

  stats.Occupations = processData(
    source_classification_folder + `occupations_${LANGUAGE_CODE}.csv`,
    target_folder + 'occupations.csv',
    OccupationsRecordTransformer
  );

  stats.OccupationsHierarchy = processData(
    source_relations_folder + `broaderRelationsOccPillar_fr.csv`,
    target_folder + 'occupations_hierarchy.csv',
    OccupationsHierarchyRecordTransformer
  );

  stats.SkillsHierarchy = processData(
    source_relations_folder + 'broaderRelationsSkillPillar_fr.csv',
    target_folder + 'skills_hierarchy.csv',
    SkillsHierarchyRecordTransformer
  );

  stats.OccupationSkillRelations = processData(
    source_relations_folder + 'occupationSkillRelations_fr.csv',
    target_folder + 'occupation_skill_relations.csv',
    OccupationsSkillsRelationsRecordTransformer
  );

  stats.SkillSkillRelations = processData(
    source_relations_folder + 'skillSkillRelations_fr.csv',
    target_folder + 'skill_skill_relations.csv',
    SkillsSkillsRelationsRecordTransformer
  );
}

function exportSampleData(source_classification_folder, source_relations_folder, target_folder, stats) {
  stats.ISCOGroups = processData(
    source_classification_folder + `ISCOGroups_${LANGUAGE_CODE}.csv`,
    target_folder + 'isco_groups.csv',
    ISCOGroupsRecordTransformer
  );

  stats.SkillGroups = processData(
    source_classification_folder + `skillGroups_${LANGUAGE_CODE}.csv`,
    target_folder + 'skill_groups.csv',
    SkillGroupsRecordTransformer
  );

  stats.Skills = processData(
    source_classification_folder + `skills_${LANGUAGE_CODE}.csv`,
    target_folder + 'skills.csv',
    SkillsRecordTransformer, 1000
  );

  stats.Occupations = processData(
    source_classification_folder + `occupations_${LANGUAGE_CODE}.csv`,
    target_folder + 'occupations.csv',
    OccupationsRecordTransformer
  );

  stats.OccupationsHierarchy = processData(
    source_relations_folder + 'broaderRelationsOccPillar_fr.csv',
    target_folder + 'occupations_hierarchy.csv',
    OccupationsHierarchyRecordTransformer
  );

  stats.SkillsHierarchy = processData(
    source_relations_folder + 'broaderRelationsSkillPillar_fr.csv',
    target_folder + 'skills_hierarchy.csv',
    SkillsHierarchyRecordTransformer
  );
  stats.OccupationSkillRelations = processData(
    source_relations_folder + 'occupationSkillRelations_fr.csv',
    target_folder + 'occupation_skill_relations.csv',
    OccupationsSkillsRelationsRecordTransformer
  );

  stats.SkillSkillRelations = processData(
    source_relations_folder + 'skillSkillRelations_fr.csv',
    target_folder + 'skill_skill_relations.csv',
    SkillsSkillsRelationsRecordTransformer
  );
}

//--------------------------------------------------------------------------

/**
 * Start the export process
 */

// send console output to file
let util = require('util');
let log_file = fs.createWriteStream(__dirname + '/debug.log', {flags: 'w'});
//let log_stdout = process.stdout;

const error_stats = {
  warnings: 0,
  errors: 0,
}

console.warn = function (d) { //
  log_file.write(util.format(d) + '\n');
  error_stats.warnings++;
  //log_stdout.write(util.format(d) + '\n');
};

console.error = function (d) { //
  log_file.write(util.format(d) + '\n');
  error_stats.errors++;
  //log_stdout.write(util.format(d) + '\n');
};

console.debug = function (d) { //
  log_file.write(util.format(d) + '\n');
  //log_stdout.write(util.format(d) + '\n');
};


let stats = {
  ISCOGroups: 0,
  SkillGroups: 0,
  Skills: 0,
  Occupations: 0,
  OccupationsHierarchy: 0,
  SkillsHierarchy: 0,
  OccupationSkillRelations: 0,
  SkillSkillRelations: 0,
}

const matchOldUUIDS = (basePath, targetPath) => {
  // add the existing uuids from the esco v1.1.1 to the new tabiya isco groups
    matchAndAppendUUIDs(
         basePath + 'isco_groups.csv',
        targetPath + 'isco_groups.csv',
        'CODE', targetPath + 'isco_groups.csv'
    );
  // add the existing uuids from the esco v1.1.1 to the new tabiya occupations
  matchAndAppendUUIDs(
      basePath + 'occupations.csv',
      targetPath + 'occupations.csv',
      'CODE', targetPath + 'occupations.csv'
  );
  // add the existing uuids from the esco v1.1.1 to the new tabiya skills
    matchAndAppendUUIDs(
        basePath + 'skills.csv',
        targetPath + 'skills.csv',
        'ORIGINURI', targetPath + 'skills.csv'
    );
    // add the existing uuids from the esco v1.1.1 to the new tabiya skill groups
    matchAndAppendUUIDs(
        basePath + 'skill_groups.csv',
        targetPath + 'skill_groups.csv',
        'ORIGINURI', targetPath + 'skill_groups.csv'
    );
}

exportCompleteData(
    BASE_PATH_IN + `/classification/${LANGUAGE_CODE}/csv/`,
    BASE_PATH_IN + `/relations/${LANGUAGE_CODE}/csv/`,
    BASE_PATH_OUT + '/csv/', stats);

console.info("Transformed data: " + `${BASE_PATH_OUT}/csv/` + "\n" + JSON.stringify({...stats, ...error_stats}, null, 2));

// add the existing uuids from the esco v1.1.1 to the new tabiya data
// remove this line if you want to generate a file with no ancestry
matchOldUUIDS('../../datasets/tabiya/esco-v1.1.2/csv/', BASE_PATH_OUT + '/csv/');

// Clear the mapping between conceptUri and UUID for the next run
conceptUriToUUIDMapper.clear();

error_stats.warnings = 0;
error_stats.errors = 0;

stats = {
  ISCOGroups: 0,
  SkillGroups: 0,
  Skills: 0,
  Occupations: 0,
  OccupationsHierarchy: 0,
  SkillsHierarchy: 0,
  OccupationSkillRelations: 0,
  SkillSkillRelations: 0,
}

exportSampleData(
  BASE_PATH_IN + `/classification/${LANGUAGE_CODE}/csv/`,
  BASE_PATH_IN + `/relations/${LANGUAGE_CODE}/csv/`,
  BASE_PATH_SAMPLES,
  stats
);

console.info("Transformed data: " + BASE_PATH_SAMPLES + "\n" + JSON.stringify({...stats, ...error_stats}, null, 2));
// add the existing uuids from the esco v1.1.1 to the new tabiya data
// remove this line if you want to generate a file with no ancestry
matchOldUUIDS('../../datasets/tabiya/samples/esco-v1.1.2/', BASE_PATH_SAMPLES);