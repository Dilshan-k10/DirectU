import random
import pandas as pd

cs_templates = [
    "Mathematics stream student with experience in Python, algorithms, and machine learning projects.",
    "A/L Maths student who built AI and data science projects using Python and C++.",
    "Strong background in problem solving, algorithms, and system modeling."
]

se_templates = [
    "Developed web applications using Java and React. Experience in teamwork and software lifecycle.",
    "Worked on backend APIs and version control systems. Interested in scalable systems.",
    "Passionate about building maintainable and reliable applications."
]

bis_templates = [
    "Commerce stream student with ERP and business process knowledge.",
    "Understands stakeholder analysis and business system integration.",
    "Worked on business process automation projects."
]

bda_templates = [
    "Worked on data analysis using Python and visualization tools.",
    "Interested in predictive modeling and business intelligence.",
    "Performed data cleaning and statistical analysis projects."
]

data = []

for _ in range(100):
    data.append([random.choice(cs_templates), "computer_science"])
    data.append([random.choice(se_templates), "software_engineering"])
    data.append([random.choice(bis_templates), "business_information_systems"])
    data.append([random.choice(bda_templates), "business_data_analytics"])

df = pd.DataFrame(data, columns=["resume_text", "degree_label"])
df.to_csv("cv_dataset.csv", index=False)

print("Dataset generated successfully.")
