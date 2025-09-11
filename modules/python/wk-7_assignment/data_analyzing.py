# Import libraries
import pandas as pd
import matplotlib.pyplot as plt

# Task 1: Load and Explore the Dataset
# ------------------------------------
# Load Iris dataset from seaborn for simplicity (or replace with your CSV path)
import seaborn as sns
df = sns.load_dataset('iris')

# Display first few rows
print("First 5 rows:")
print(df.head())

# Check data types and missing values
print("\nData Info:")
print(df.info())

print("\nMissing values per column:")
print(df.isnull().sum())

# No missing values in this dataset, but if there were:
# df = df.dropna()  # or df.fillna(value)

# Task 2: Basic Data Analysis
# ----------------------------
# Summary statistics for numerical columns
print("\nSummary Statistics:")
print(df.describe())

# Group by species and calculate mean sepal length
grouped = df.groupby('species')['sepal_length'].mean()
print("\nMean Sepal Length by Species:")
print(grouped)

# Observations:
# For example, Setosa species tends to have smaller sepal length on average

# Task 3: Data Visualization
# ----------------------------

# 1. Line Chart: Show sepal length trend over sample index (just for example)
plt.figure(figsize=(8,5))
plt.plot(df.index, df['sepal_length'], label='Sepal Length')
plt.title('Sepal Length over Sample Index')
plt.xlabel('Sample Index')
plt.ylabel('Sepal Length (cm)')
plt.legend()
plt.show()

# 2. Bar Chart: Average petal length per species
plt.figure(figsize=(8,5))
grouped_petal_length = df.groupby('species')['petal_length'].mean()
grouped_petal_length.plot(kind='bar', color='skyblue')
plt.title('Average Petal Length by Species')
plt.xlabel('Species')
plt.ylabel('Average Petal Length (cm)')
plt.show()

# 3. Histogram: Distribution of sepal width
plt.figure(figsize=(8,5))
plt.hist(df['sepal_width'], bins=20, color='lightgreen', edgecolor='black')
plt.title('Distribution of Sepal Width')
plt.xlabel('Sepal Width (cm)')
plt.ylabel('Frequency')
plt.show()

# 4. Scatter Plot: Sepal length vs Petal length colored by species
plt.figure(figsize=(8,5))
for species in df['species'].unique():
    subset = df[df['species'] == species]
    plt.scatter(subset['sepal_length'], subset['petal_length'], label=species)
plt.title('Sepal Length vs Petal Length by Species')
plt.xlabel('Sepal Length (cm)')
plt.ylabel('Petal Length (cm)')
plt.legend()
plt.show()
