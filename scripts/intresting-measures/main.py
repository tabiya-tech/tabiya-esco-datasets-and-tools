import json
import csv
import os
import time


def get_total_occupations(input_path: str):
    """
    This function will return the total number of occupations in the occupations.csv file.
    :param input_path:  path of the input folder of the esco model folder
    :return:
    """
    with open(input_path + "/occupations.csv") as occupations_files:
        lines = csv.reader(occupations_files, delimiter=',')
        return len(list(lines)) - 1


def count_relations_by_skill_id(input_path: str):
    """
    This function will count the number of relations for each skill id.
    :param input_path: path of the input folder.
    :return: a dictionary with skill id as key and value as a dictionary with two keys.
    """
    edges_map = {}
    with open(input_path + "/occupation_to_skill_relations.csv") as skill_relations_file:
        # read the file
        relations = csv.DictReader(skill_relations_file, delimiter=',')

        for relation in relations:
            is_formal = relation["SIGNALLINGVALUELABEL"] == "high" or relation["RELATIONTYPE"] == "essential"

            if edges_map.get(relation["SKILLID"]):
                # if the skill id is already in the map then increment the count.
                edges_map[relation["SKILLID"]]["all_edges"] += 1
                if is_formal:
                    edges_map[relation["SKILLID"]]["formal_economy"] += 1
            else:
                # if the skill id is not in the map then add it to the map.
                edges_map[relation["SKILLID"]] = {"all_edges": 1, "formal_economy": 0}
                if is_formal:
                    edges_map[relation["SKILLID"]]["formal_economy"] = 1

    return edges_map


def occupations_interesting_measures(input_path: str):
    """
    This function will calculate skill interesting measures for occupations.
    those are.
    1. degree centrality.
    2. inter-occupation transferability.

    :param input_path: path of the input folder.
    :return:
    """

    total_occupations = get_total_occupations(input_path)

    print("total occupations = ", total_occupations)

    # delete skills_with_intresting_measures
    if os.path.exists(input_path + "/skills_with_intresting_measures.csv"):
        os.remove(input_path + "/skills_with_intresting_measures.csv")

    with (open(input_path + "/skills.csv") as skills_files,
          open(input_path + "/skills_with_intresting_measures.csv", "w+") as skills_with_intresting_measures_files):
        skills_reader = csv.DictReader(skills_files, delimiter=',')

        field_names = skills_reader.fieldnames

        field_names.append("DEGREECENTRALITY-FORMAL_ECONOMY")
        field_names.append("DEGREECENTRALITY-ALL_OCCUPATIONS")
        field_names.append("INTEROCCUPATIONTRANSFERABILITY-FORMAL_ECONOMY")
        field_names.append("INTEROCCUPATIONTRANSFERABILITY-ALL_OCCUPATIONS")

        skills_writer = csv.DictWriter(skills_with_intresting_measures_files, delimiter=',',
                                       fieldnames=field_names)

        skill_counter = 0

        edges_map = count_relations_by_skill_id(input_path)

        skills_writer.writeheader()
        for skill in skills_reader:
            skill_counter += 1

            skill_edges = edges_map.get(skill["ID"])

            if(skill_edges is None):
                skill_edges = {"all_edges": 0, "formal_economy": 0}

            skill["DEGREECENTRALITY-FORMAL_ECONOMY"] = skill_edges["formal_economy"]
            skill["DEGREECENTRALITY-ALL_OCCUPATIONS"] = skill_edges["all_edges"]

            skill["INTEROCCUPATIONTRANSFERABILITY-FORMAL_ECONOMY"] = skill_edges["formal_economy"] / total_occupations
            skill["INTEROCCUPATIONTRANSFERABILITY-ALL_OCCUPATIONS"] = skill_edges["all_edges"] / total_occupations
            skills_writer.writerow(skill)

    # clean-ups
    # rename the file to skills.csv
    # commented for now, we don't want to mix the files.
    # os.remove(input_path + "/skills.csv")
    # os.rename(input_path + "/skills_with_intresting_measures.csv", input_path + "/skills.csv")


if __name__ == '__main__':
    print("calculating interesting measures for skills and occupations")
    with open('paths.json') as f:
        config = json.load(f)
        print("using config", config)
        print("""
[STEP 1]:-
starting to calculate interesting measures for skills and occupations
which are.
1. degree centrality (formal and all).
2. inter-occupation transferability (formal and all).
        """)
        print("calculating, wait a moment ..... ")
        start_time = time.time()

        occupations_interesting_measures(config["path_to_model"])

        print("done in ", time.time() - start_time, " seconds")
