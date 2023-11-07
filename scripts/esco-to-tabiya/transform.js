#!/usr/bin/env node

//--------------------------------------------------------------------------
const fs = require('fs');
const {transform} = require("csv/sync");
const {parse} = require('csv/sync');
const {stringify} = require('csv/sync');
const conceptUriToUUIDMapper = new Map()

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
    ESCOURI: record['conceptUri'],
    ID: addConceptUriToMap(record['conceptUri']),
    UUID: "",
    ORIGINUUID: "",
    CODE: record['code'],
    PREFERREDLABEL: record['preferredLabel'],
    ALTLABELS: record['altLabels'],
    DESCRIPTION: record['description'],
  }
}

function SkillGroupsRecordTransformer(record) {
  return {
    ESCOURI: record['conceptUri'],
    ID: addConceptUriToMap(record['conceptUri']),
    UUID: "",
    ORIGINUUID: "",
    CODE: record['code'],
    PREFERREDLABEL: record['preferredLabel'],
    ALTLABELS: record['altLabels'],
    DESCRIPTION: record['description'],
    SCOPENOTE: record['scopeNote'],
  }
}

function SkillsRecordTransformer(record) {
  return {
    ESCOURI: record['conceptUri'],
    ID: addConceptUriToMap(record['conceptUri']),
    UUID: "",
    ORIGINUUID: "",
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
    ESCOURI: record['conceptUri'],
    ID: addConceptUriToMap(record['conceptUri']),
    UUID: "",
    ORIGINUUID: "",
    ISCOGROUPCODE: record['iscoGroup'],
    CODE: record['code'],
    PREFERREDLABEL: record['preferredLabel'],
    ALTLABELS: record['altLabels'],
    DESCRIPTION: record['description'],
    DEFINITION: record['definition'],
    SCOPENOTE: record['scopeNote'],
    REGULATEDPROFESSIONNOTE: record['regulatedProfessionNote'],
    OCCUPATIONTYPE: "ESCO"
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
  const occupationType = record['occupationType'] || "esco";

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
      source_classification_folder + 'ISCOGroups_en.csv',
      target_folder + 'ISCOGroups.csv',
      ISCOGroupsRecordTransformer
  );

  stats.SkillGroups = processData(
      source_classification_folder + 'skillGroups_en.csv',
      target_folder + 'skillGroups.csv',
      SkillGroupsRecordTransformer
  );

  stats.Skills = processData(
      source_classification_folder + 'skills_en.csv',
      target_folder + 'skills.csv',
      SkillsRecordTransformer
  );

  stats.Occupations = processData(
      source_classification_folder + 'occupations_en.csv',
      target_folder + 'occupations.csv',
      OccupationsRecordTransformer
  );

  stats.OccupationsHierarchy = processData(
      source_relations_folder + 'broaderRelationsOccPillar.csv',
      target_folder + 'occupations_hierarchy.csv',
      OccupationsHierarchyRecordTransformer
  );

  stats.SkillsHierarchy = processData(
      source_relations_folder + 'broaderRelationsSkillPillar.csv',
      target_folder + 'skills_hierarchy.csv',
      SkillsHierarchyRecordTransformer
  );

  stats.OccupationSkillRelations = processData(
      source_relations_folder + 'occupationSkillRelations.csv',
      target_folder + 'occupation_skill_relations.csv',
      OccupationsSkillsRelationsRecordTransformer
  );

  stats.SkillSkillRelations = processData(
      source_relations_folder + 'skillSkillRelations.csv',
      target_folder + 'skill_skill_relations.csv',
      SkillsSkillsRelationsRecordTransformer
  );
}

function exportSampleData(source_classification_folder, source_relations_folder, target_folder, stats) {
  stats.ISCOGroups = processData(
      source_classification_folder + 'ISCOGroups_en.csv',
      target_folder + 'ISCOGroups.csv',
      ISCOGroupsRecordTransformer
  );

  stats.SkillGroups = processData(
      source_classification_folder + 'skillGroups_en.csv',
      target_folder + 'skillGroups.csv',
      SkillGroupsRecordTransformer
  );

  stats.Skills = processData(
      source_classification_folder + 'skills_en.csv',
      target_folder + 'skills.csv',
      SkillsRecordTransformer, 1000
  );

  stats.Occupations = processData(
      source_classification_folder + 'occupations_en.csv',
      target_folder + 'occupations.csv',
      OccupationsRecordTransformer
  );

  stats.OccupationsHierarchy = processData(
      source_relations_folder + 'broaderRelationsOccPillar.csv',
      target_folder + 'occupations_hierarchy.csv',
      OccupationsHierarchyRecordTransformer
  );

  stats.SkillsHierarchy = processData(
      source_relations_folder + 'broaderRelationsSkillPillar.csv',
      target_folder + 'skills_hierarchy.csv',
      SkillsHierarchyRecordTransformer
  );
  stats.OccupationSkillRelations = processData(
      source_relations_folder + 'occupationSkillRelations.csv',
      target_folder + 'occupation_skill_relations.csv',
      OccupationsSkillsRelationsRecordTransformer
  );

  stats.SkillSkillRelations = processData(
      source_relations_folder + 'skillSkillRelations.csv',
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
let log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
//let log_stdout = process.stdout;

const error_stats = {
  warnings: 0,
  errors: 0,
}

console.warn = function(d) { //
  log_file.write(util.format(d) + '\n');
  error_stats.warnings++;
  //log_stdout.write(util.format(d) + '\n');
};

console.error = function(d) { //
  log_file.write(util.format(d) + '\n');
  error_stats.errors++;
  //log_stdout.write(util.format(d) + '\n');
};

console.debug = function(d) { //
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

exportCompleteData(
    'datasets/esco/v1.1.1/classification/en/csv/',
    'datasets/esco/v1.1.1/relations/csv/',
    'datasets/tabiya/esco-v1.1.1/csv/', stats);
console.info("Transformed data: " + 'datasets/tabiya/esco-v1.1.1/csv/' + "\n" + JSON.stringify({...stats, ...error_stats}, null, 2));


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
    'datasets/esco/v1.1.1/classification/en/csv/',
    'datasets/esco/v1.1.1/relations/csv/',
    'datasets/tabiya/samples/esco-v1.1.1/',
    stats
);

console.info("Transformed data: " + 'datasets/tabiya/samples/esco-v1.1.1/' + "\n" + JSON.stringify({...stats, ...error_stats}, null, 2));