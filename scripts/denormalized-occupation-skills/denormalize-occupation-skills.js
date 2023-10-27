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
    essentialSkillsOnly: !!argv.essentialSkillsOnly
  }
}

function printHelp() {
  console.log('Usage: node denormalize-occupation-skills.js --inputFilePath [/path/to/input/file.csv] --maxSkills [number] --pathToEscoFiles [/path/to/esco/files]\n');
  console.log('Mandatory arguments:');
  console.log('   --inputFilePath: Path to the input file.');
  console.log('   --maxSkills: Maximum number of skills to include for each occupation.');
  console.log('   --pathToEscoFiles: The folder with the esco files (occupations.csv, skills.csv, occupation_skill_relations.csv).\n');
  console.log('Optional arguments:');
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
    skills[i] = skill['PREFERREDLABEL'];
  }
  return skills;
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
inputRecords.forEach(record => {
  // Get the occupations for each record
  for (let i = 1; i <= OCCUPATIONS_COUNT; i++) {
    const escoCodeKey = ESCO_CODE_KEY_PREFIX + i;
    const escoCode = record[escoCodeKey];
    const occupationId = getOccupationId(escoCode);
    // Get the skills for each occupation
    const skills = getSkills(occupationId, args.maxSkills, args.essentialSkillsOnly);
    // Write the skills to the output record
    skills.forEach((skill, index) => {
      const skillKey = escoCodeKey + '_skill_' + (index + 1);
      record[skillKey] = skill;
    });
  }
});

// Write the output file

fs.writeFileSync(args.outputFilePath, stringify(inputRecords, {header: true}));

console.log('Successfully wrote the output file to: ' + args.outputFilePath);