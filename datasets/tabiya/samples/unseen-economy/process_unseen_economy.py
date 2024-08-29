import csv
import json
import os
import uuid
from thefuzz import fuzz
from collections import defaultdict

is_map_set = False
skills_ids_map = {}


def get_skill_id(input_path: str):
    global is_map_set
    global skills_ids_map

    if not is_map_set:
        with open("./skills.csv") as skills_files:
            lines = csv.DictReader(skills_files,
                                   fieldnames=["ORIGINURI", "ID", "UUIDHISTORY", "SKILLTYPE", "REUSELEVEL",
                                               "PREFERREDLABEL", "ALTLABELS", "DESCRIPTION", "DEFINITION", "SCOPENOTE"])
            for line in lines:
                skills_ids_map[line["PREFERREDLABEL"].lower()] = line["ID"]
        is_map_set = True

    if input_path.lower() in skills_ids_map.keys():
        return skills_ids_map[input_path.lower()]

    # do fuzzy search
    for key in skills_ids_map.keys():
        if fuzz.ratio(key, input_path) > 90:
            return skills_ids_map[key]

    # if it is one word, print it
    if len(input_path.split(" ")) == 1:
        print(input_path)

    # do fuzzy search
    for key in skills_ids_map.keys():
        if fuzz.partial_ratio(key, input_path) > 90:
            return skills_ids_map[key]

    print("SKILL_NOT_FOUND:" + input_path)

    return None


def write_to_file(file_name: str, records, fieldnames: list[str]):
    # if file exists delete it.
    if os.path.exists(file_name):
        os.remove(file_name)

    with open(file_name, mode='w') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        for record in records:
            writer.writerow(record)


def main():
    """
    I have a file named `unseen_economy.csv`,
    with header: ICATUS 1,ICATUS 2,ICATUS 3,Skills,Signalling_Value

    ICATUS 1 is the first level of the ICATUS hierarchy.
    ICATUS 2 is the second level of the ICATUS hierarchy.
    ICATUS 3 is the occupation,
    Skills are the skills required for the occupation.
    Signalling value Scores are the scores for the skills.

    I want it in a format like:
    [
        {
            name: ICATUS 1,
            sub_categories: [
                name: ICATUS 2,
                occupations: [
                    {
                        name: ICATUS 3,
                        skills: [
                            {
                                name: Skills,
                                score: Signalling_Value
                            }
                        ]
                    }
                ]
            ]

        }
    ]
    :return:
    """

    data = []
    icatus_hierarchy = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

    with open("./unseen_economy.csv") as file:
        reader = csv.DictReader(file, fieldnames=["ICATUS 1", "ICATUS 2", "ICATUS 3", "Skills", "Signalling_Value", "Signalling_Value_Label"])
        for row in reader:
            icatus_1 = row["ICATUS 1"]
            icatus_2 = row["ICATUS 2"]
            icatus_3 = row["ICATUS 3"]
            skill = row["Skills"]
            signalling_value = row["Signalling_Value"]
            signalling_value_label = row["Signalling_Value_Label"]

            if signalling_value == "0":
                continue

            if signalling_value_label not in ["medium", "high", "low"]:
                continue

            # Append skill and its signalling value to the appropriate ICATUS 3 occupation
            icatus_hierarchy[icatus_1][icatus_2][icatus_3].append({
                "name": skill,
                "score": signalling_value,
                "label": signalling_value_label
            })

    # Convert the nested defaultdict structure into the desired list of dictionaries
    for icatus_1, icatus_2_dict in icatus_hierarchy.items():
        sub_categories = []
        for icatus_2, icatus_3_dict in icatus_2_dict.items():
            occupations = []
            for icatus_3, skills_list in icatus_3_dict.items():
                occupations.append({
                    "name": icatus_3,
                    "skills": skills_list
                })
            sub_categories.append({
                "name": icatus_2,
                "occupations": occupations
            })
        data.append({
            "name": icatus_1,
            "sub_categories": sub_categories
        })

    issues_counter = 0
    occupation_groups = []
    occupations = []
    occupation_hierarcy = []
    occupation_to_skill_relations = []

    occupation_groups_counter = 1
    occupations_counter = 0
    for icatus_1_index, item in enumerate(data):
        parent_occupation_group_id = f"key_i{occupation_groups_counter}"
        occupation_groups.append({
            "ORIGINURI": "",
            "ID": parent_occupation_group_id,
            "UUIDHISTORY": str(uuid.uuid4()),
            "CODE": f"I{icatus_1_index}",
            "PREFERREDLABEL": item["name"],
            "ALTLABELS": item["name"],
            "DESCRIPTION": "",
        })

        occupation_groups_counter += 1
        for icatus_2_index_counter, sub_category in enumerate(item["sub_categories"]):
            icatus_2_index = icatus_2_index_counter+1
            child_occupation_group_id = f"key_i{occupation_groups_counter}"
            occupation_groups.append({
                "ORIGINURI": "",
                "ID": child_occupation_group_id,
                "UUIDHISTORY": str(uuid.uuid4()),
                "CODE": f"I{icatus_1_index}{icatus_2_index}",
                "PREFERREDLABEL": sub_category["name"],
                "ALTLABELS": sub_category["name"],
                "DESCRIPTION": "",
            })

            occupation_hierarcy.append({
                "PARENTOBJECTTYPE": "iscogroup",
                "PARENTID": parent_occupation_group_id,
                "CHILDID": child_occupation_group_id,
                "CHILDOBJECTTYPE": "iscogroup"
            })

            occupation_groups_counter += 1

            for icatus_3_index, occupation in enumerate(sub_category["occupations"]):
                occupation_id = f"key_i{icatus_1_index}{icatus_2_index}{occupations_counter}"
                occupations.append({
                    "ORIGINURI": "",
                    "ID": occupation_id,
                    "UUIDHISTORY": str(uuid.uuid4()),
                    "ISCOGROUPCODE": f"I{icatus_1_index}{icatus_2_index}",
                    "CODE": f"I{icatus_1_index}{icatus_2_index}_{icatus_3_index + 1}",
                    "PREFERREDLABEL": occupation["name"],
                    "ALTLABELS": occupation["name"],
                    "DESCRIPTION": "",
                    "DEFINITION": "",
                    "SCOPENOTE": "",
                    "REGULATEDPROFESSIONNOTE": "",
                    "OCCUPATIONTYPE": "localoccupation",
                    "ISLOCALIZED": "false"
                })

                occupation_hierarcy.append({
                    "PARENTOBJECTTYPE": "iscogroup",
                    "PARENTID": child_occupation_group_id,
                    "CHILDID": occupation_id,
                    "CHILDOBJECTTYPE": "localoccupation"
                })

                occupations_counter += 1

                for skill_index, skill in enumerate(occupation["skills"]):
                    skill_id = get_skill_id(skill["name"])
                    save_it = True
                    # find if there is a duplicate for occupation_id and skill_id and print them
                    for relation in occupation_to_skill_relations:
                        is_duplicated = relation["OCCUPATIONID"] == occupation_id and relation["SKILLID"] == skill_id
                        if is_duplicated:
                            save_it = False
                            old_score = int(relation["SIGNALLINGVALUE"])
                            new_score = int(skill["score"])
                            if old_score < new_score:
                                relation["SIGNALLINGVALUE"] = new_score

                    if save_it:
                        occupation_to_skill_relations.append({
                            "OCCUPATIONTYPE": "localoccupation",
                            "OCCUPATIONID": occupation_id,
                            "RELATIONTYPE": "",
                            "SKILLID": skill_id,
                            "SIGNALLINGVALUELABEL": skill["label"],
                            "SIGNALLINGVALUE": skill["score"]
                        })

    write_to_file("./occupations.csv", fieldnames=["ORIGINURI", "ID", "UUIDHISTORY", "ISCOGROUPCODE", "CODE", "PREFERREDLABEL", "ALTLABELS", "DESCRIPTION", "DEFINITION", "SCOPENOTE", "REGULATEDPROFESSIONNOTE", "OCCUPATIONTYPE", "ISLOCALIZED"], records=occupations)
    write_to_file("./occupation_groups.csv", fieldnames=["ORIGINURI", "ID", "UUIDHISTORY", "CODE", "PREFERREDLABEL", "ALTLABELS", "DESCRIPTION"], records=occupation_groups)
    write_to_file("./occupation_hierarchy.csv", fieldnames=["PARENTOBJECTTYPE", "PARENTID", "CHILDID", "CHILDOBJECTTYPE"], records=occupation_hierarcy)
    write_to_file("./occupation_to_skill_relations.csv", fieldnames=["OCCUPATIONTYPE", "OCCUPATIONID", "RELATIONTYPE", "SKILLID", "SIGNALLINGVALUELABEL", "SIGNALLINGVALUE"], records=occupation_to_skill_relations)


if __name__ == "__main__":
    main()
