#!/usr/bin/env node

const fs = require('fs');
const {parse, stringify} = require("csv/sync");
const path = require('path');

function parseArguments() {
  const argv = require('yargs').argv;
  let hasError = false;
  if (!argv.inputFilePath) {
    hasError = true;
  }

  if (!argv.maxSkills) {
    hasError = true;
  }

  if (!argv.pathToEscoFiles) {
    hasError = true;
  }

  if (hasError) {
    printHelp();
    process.exit(1);
  }

  // setup variables
  const parsedInputFilePath = path.parse(argv.inputFilePath);
  return {
    inputFilePath: argv.inputFilePath,
    maxSkills: argv.maxSkills,
    pathToEscoFiles: argv.pathToEscoFiles,
    outputFilePath: argv.outputFilePath || path.join(parsedInputFilePath.dir, parsedInputFilePath.name + '.output.csv'),
    essentialSkillsOnly: !!argv.essentialSkillsOnly,
    proportionateAllocation: !!argv.proportionateAllocation
  }
}

function printHelp() {
  console.log('Usage: node denormalize-occupation-skills.js --inputFilePath [/path/to/input/file.csv] --maxSkills [number] --pathToEscoFiles [/path/to/esco/files]\n');
  console.log('Mandatory arguments:');
  console.log('   --inputFilePath: Path to the input file.');
  console.log('   --maxSkills: Maximum number of skills to include for each occupation.');
  console.log('   --pathToEscoFiles: The folder with the esco files (occupations.csv, skills.csv, occupation_skill_relations.csv).\n');
  console.log('Optional arguments:');
  console.log('   --proportionateAllocation: Allocate "Skill/Competence" and "Knowledge" proportionally to the their relation to each occupation.');
  console.log('                              When this option is chosen, an additional output file will be generated with the allocation calculations,');
  console.log('                              that can be used to verify that the allocation is correct.');
  console.log('   --outputFilePath: Path to the output file. Default is [inputFilePath].output.csv.');
  console.log('   --essentialSkillsOnly: Specify whether to include only skills with relation type "essential" in the output.');
}

function shuffle(array) {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

function getRecords(file) {
  const data = fs.readFileSync(file, 'utf8');
  return parse(data, {columns: true});
}

function getOccupationId(escoCode) {
  const found = global_allOccupations.find(occupation => occupation['CODE'] === escoCode);
  if (found) {
    return found['ID'];
  }
  return null;
}

function getSkillName(skill) {
  return (skill['SKILLTYPE']?.toLowerCase() === 'knowledge' ? "" : "knowledge of ") + skill['PREFERREDLABEL'];
}

function getSkills(occupationId, maxSkills, essentialSkillsOnly) {
  const skills = Array(maxSkills).fill("");
  if (occupationId === null) {
    return skills;
  }

  const filterFnCallback = (relation) => {
    return relation['OCCUPATIONID'] === occupationId && (relation['RELATIONTYPE'] === 'essential' || !essentialSkillsOnly);
  };
  const skillsIds = shuffle(global_relations.filter(filterFnCallback).map(relation => relation['SKILLID']));

  for (let i = 0; i < skillsIds.length && i < skills.length; i++) {
    const skill = global_allSkills.find(skill => skill['ID'] === skillsIds[i]);
    skills[i] = getSkillName(skill);
  }
  return skills;
}

function round(value) {
  // 2 digit precision rounding
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getProportionallyAllocatedSkills(occupationId, maxSkills, essentialSkillsOnly) {
  const skills = Array(maxSkills).fill("");
  if (occupationId === null) {
    return [skills, null];
  }
  const filterFnCallback = (relation) => {
    return relation['OCCUPATIONID'] === occupationId && (relation['RELATIONTYPE'] === 'essential' || !essentialSkillsOnly);
  };

  const competencies = [];
  const knowledge = [];

  // Get List of skills/competence and list of knowledge
  const skillsIds = global_relations.filter(filterFnCallback).map(relation => relation['SKILLID']);
  for (let i = 0; i < skillsIds.length; i++) {
    const skill = global_allSkills.find(skill => skill['ID'] === skillsIds[i]);
    const skillType = skill['SKILLTYPE']?.toLowerCase();
    if (skillType === 'skill/competence') {
      competencies.push(skill['PREFERREDLABEL']);
    } else if (skillType === 'knowledge') {
      knowledge.push("knowledge of " + skill['PREFERREDLABEL']);
    } else {
      console.log('Unknown skill type: ' + skill['SKILLTYPE']);
    }
  }

  const skillSTotal = competencies.length + knowledge.length;
  const competenciesProportion = competencies.length / skillSTotal;
  const knowledgeProportion = knowledge.length / skillSTotal;


  // chose the one with the highest proportion
  let numberOfKnowledgeToPick = Math.round(maxSkills * knowledgeProportion);
  let numberOfCompetenciesToPick = maxSkills - numberOfKnowledgeToPick

  if (competenciesProportion > knowledgeProportion) {
    numberOfCompetenciesToPick = Math.round(maxSkills * competenciesProportion) //   3
    numberOfKnowledgeToPick = maxSkills - numberOfCompetenciesToPick;
  }

  // shuffle the competencies
  // then pick the first numberOfCompetenciesToPick
  shuffle(competencies);
//  skills.push(...competencies.slice(0, numberOfCompetenciesToPick));
  competencies.slice(0, numberOfCompetenciesToPick).forEach((competency, index) => {
    skills[index] = competency;
  });

  // shuffle the knowledge
  // then pick the first knowledgeToPick
  shuffle(knowledge);
  //skills.push(...knowledge.slice(0, numberOfKnowledgeToPick));
  knowledge.slice(0, numberOfKnowledgeToPick).forEach((knowledge, index) => {
    skills[index + numberOfCompetenciesToPick] = knowledge;
  });

  // Make the stats
  const stats = {
    competenciesCount: competencies.length,
    KnowledgeCount: knowledge.length,
    competenciesProportion: `${round(competenciesProportion * 100)}%`,
    knowledgeProportion: `${round(knowledgeProportion * 100)}%`,
    competenciesPickedCount: numberOfCompetenciesToPick,
    knowledgePickedCount: numberOfKnowledgeToPick,
    competenciesProportionPickedCount: `${round(numberOfCompetenciesToPick / maxSkills * 100)}%`,
    knowledgeProportionPickedCount: `${round(numberOfKnowledgeToPick / maxSkills * 100)}%`,
    competenciesError: `${round((competenciesProportion - (numberOfCompetenciesToPick / maxSkills)) * 100)}%`,
    knowledgeError: `${round((knowledgeProportion - (numberOfKnowledgeToPick / maxSkills)) * 100)}%`,
  };

  return [skills, stats];
}


/**********************
 * Run the script
 **********************/

// Get the arguments
const args = parseArguments();

console.log('Running the script with the following arguments:');
console.log(args);
// Load the esco data
const global_allOccupations = getRecords(args.pathToEscoFiles + '/occupations.csv');
const global_allSkills = getRecords(args.pathToEscoFiles + '/skills.csv');
const global_relations = getRecords(args.pathToEscoFiles + '/occupation_skill_relations.csv');

// Load the input file
const inputRecords = getRecords(args.inputFilePath);

// Process the input file
const ESCO_CODE_KEY_PREFIX = 'ESCO_occ_';
const OCCUPATIONS_COUNT = 3;
const allocationStatsRecords = [];
inputRecords.forEach(record => {
  // Get the occupations for each record
  const allocationStatsPerRecord = {...record}; // shallow copy
  for (let i = 1; i <= OCCUPATIONS_COUNT; i++) {
    const escoCodeKey = ESCO_CODE_KEY_PREFIX + i;
    const escoCode = record[escoCodeKey];
    const occupationId = getOccupationId(escoCode);

    // Get the skills for each occupation
    let skills;
    if (args.proportionateAllocation) {
      const [proportionallyAllocatedSkills, stats] = getProportionallyAllocatedSkills(occupationId, args.maxSkills, args.essentialSkillsOnly);
      allocationStatsPerRecord[escoCodeKey + "_stats"] = stats?JSON.stringify(stats, null, 2):"";
      skills = proportionallyAllocatedSkills;
    } else {
      skills = getSkills(occupationId, args.maxSkills, args.essentialSkillsOnly);
    }

    // Write the skills to the output record
    skills.forEach((skill, index) => {
      const skillKey = escoCodeKey + '_skill_' + (index + 1);
      record[skillKey] = skill;
    });
  }
  if (args.proportionateAllocation) {
    allocationStatsRecords.push(allocationStatsPerRecord);
  }
});



// Write the output file

fs.writeFileSync(args.outputFilePath, stringify(inputRecords, {header: true}));

if (args.proportionateAllocation) {
  // Write the allocation stats to a file
  const allocationStatsCsv = stringify(allocationStatsRecords, {header: true});
  const parsedOutputFilePath = path.parse(args.outputFilePath);
  const allocationStatsFilePath = path.join(parsedOutputFilePath.dir, parsedOutputFilePath.name + '.stats.csv');
  fs.writeFileSync(allocationStatsFilePath, allocationStatsCsv);
}

console.log(inputRecords.length + ' records processed.');

console.log('Successfully wrote the output file to: ' + args.outputFilePath);