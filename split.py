import json
import math
import os
from num import NUM


try:
    # Read the original JSON file
    with open('merge.json', 'r', encoding='utf-8') as file:
        data = json.load(file)

    # Number of folders
    num_folders = NUM
    
    # Calculate items per file
    total_items = len(data)
    items_per_file = math.ceil(total_items / num_folders)

    # Distribute data into existing folders
    for folder_num in range(1, num_folders + 1):
        folder_path = str(folder_num)
        
        # Calculate data slice indices
        start_idx = (folder_num - 1) * items_per_file
        end_idx = min(start_idx + items_per_file, total_items)
        
        # Get data slice for this file
        file_data = []
        if start_idx < total_items:
            file_data = data[start_idx:end_idx]
        
        # Save to JSON file - each folder gets only its matching numbered file
        output_filename = os.path.join(folder_path, f"{folder_num}.json")
        with open(output_filename, 'w', encoding='utf-8') as outfile:
            json.dump(file_data, outfile, indent=2, ensure_ascii=False)
        
        print(f"Created/Updated {output_filename} with {len(file_data)} records")

    print(f"\nSuccessfully created JSON files: each folder has its matching numbered file!")

except Exception as e:
    print(f"An error occurred: {str(e)}") 