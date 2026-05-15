"""
t-SNE Embedding Visualization — NL2SQL
Shows how semantically similar queries cluster together in vector space.
Run: python visualize_embeddings.py
Output: embedding_tsne.png
"""

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from sentence_transformers import SentenceTransformer
from sklearn.manifold import TSNE

# ── Query dataset grouped by intent ─────────────────────────
QUERIES = {
    "Retrieve Students": [
        "Show all students",
        "List all student names",
        "Get all student records",
        "Display students in the database",
        "Who are the students?",
    ],
    "Score / Marks": [
        "Show students who scored above 85",
        "Which students have high marks?",
        "Get students with score greater than 90",
        "Find top scoring students",
        "Who passed with distinction?",
    ],
    "Course Info": [
        "List all courses",
        "What courses are available?",
        "Show all course names",
        "Display available subjects",
        "Which courses exist in the database?",
    ],
    "Aggregations": [
        "What is the average score?",
        "Find the highest mark",
        "Calculate average marks per course",
        "Which course has the highest average?",
        "Show minimum and maximum scores",
    ],
    "Count Queries": [
        "How many students are there?",
        "Count total number of students",
        "How many courses are available?",
        "What is the total number of records?",
        "Count students per course",
    ],
}

COLORS = ["#00C7BE", "#7C6AF7", "#F59E0B", "#34D399", "#F87171"]

def main():
    print("Loading model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    all_queries = []
    labels = []
    colors = []

    for idx, (category, queries) in enumerate(QUERIES.items()):
        for q in queries:
            all_queries.append(q)
            labels.append(category)
            colors.append(COLORS[idx])

    print(f"Encoding {len(all_queries)} queries...")
    embeddings = model.encode(all_queries, show_progress_bar=False)
    print(f"Embedding shape: {embeddings.shape}")  # (25, 384)

    print("Running t-SNE...")
    tsne = TSNE(n_components=2, perplexity=8, random_state=42, max_iter=1000)
    reduced = tsne.fit_transform(embeddings)

    # ── Plot ──────────────────────────────────────────────────
    fig, ax = plt.subplots(figsize=(10, 7))
    fig.patch.set_facecolor("#0F1117")
    ax.set_facecolor("#1A1D2E")

    # Scatter points
    for i, (x, y) in enumerate(reduced):
        ax.scatter(x, y, color=colors[i], s=120, zorder=3, edgecolors="#0F1117", linewidths=0.8)
        ax.annotate(
            all_queries[i],
            (x, y),
            fontsize=6.5,
            color="#D0D3E8",
            xytext=(5, 4),
            textcoords="offset points",
            zorder=4,
        )

    # Legend
    legend_patches = [
        mpatches.Patch(color=COLORS[i], label=cat)
        for i, cat in enumerate(QUERIES.keys())
    ]
    legend = ax.legend(
        handles=legend_patches,
        loc="lower right",
        framealpha=0.3,
        facecolor="#1A1D2E",
        edgecolor="#3A3D4E",
        labelcolor="#F0F2F8",
        fontsize=9,
        title="Query Intent",
        title_fontsize=9,
    )
    legend.get_title().set_color("#00C7BE")

    # Labels and title
    ax.set_title(
        "t-SNE Visualization of NL Query Embeddings (all-MiniLM-L6-v2)",
        fontsize=13, color="#F0F2F8", pad=14, fontweight="bold"
    )
    ax.set_xlabel("t-SNE Dimension 1", color="#8B90A8", fontsize=9)
    ax.set_ylabel("t-SNE Dimension 2", color="#8B90A8", fontsize=9)
    ax.tick_params(colors="#8B90A8", labelsize=8)
    for spine in ax.spines.values():
        spine.set_edgecolor("#3A3D4E")

    ax.grid(True, color="#3A3D4E", linewidth=0.4, linestyle="--", alpha=0.6)

    plt.tight_layout()
    out = "embedding_tsne.png"
    plt.savefig(out, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    print(f"Saved → {out}")

if __name__ == "__main__":
    main()
