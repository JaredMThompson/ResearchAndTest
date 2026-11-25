import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient, DESCENDING

app = Flask(__name__)

# Allows requests from GitHub Pages and localhost.
# Once live, lock this down to: CORS(app, origins=["https://yourusername.github.io"])
CORS(app)

# Read the MongoDB connection string from an environment variable (never hardcode passwords)
MONGO_URI = os.environ.get("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI environment variable is not set.")

client = MongoClient(MONGO_URI)
db = client["forgers_canvas"]          # Database name (created automatically on first write)
scores_col = db["leaderboard"]         # Collection name (like a table in SQL)
MAX_ENTRIES = 10


def serialize_entries(docs):
    """Strip MongoDB's non-JSON-serializable ObjectId before sending to the browser."""
    return [{"name": doc["name"], "score": doc["score"]} for doc in docs]


@app.route("/api/leaderboard", methods=["GET"])
def fetch_leaderboard():
    top_docs = list(scores_col.find().sort("score", DESCENDING).limit(MAX_ENTRIES))
    return jsonify({"leaderboard": serialize_entries(top_docs)})


@app.route("/api/leaderboard", methods=["POST"])
def submit_score():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()

    try:
        score = float(data.get("score"))
    except (TypeError, ValueError):
        return jsonify({"error": "Score must be a valid number."}), 400

    if not name or len(name) > 25:
        return jsonify({"error": "Name must be between 1 and 25 characters."}), 400

    # 1. Insert the new score (MongoDB automatically assigns a unique "_id")
    result = scores_col.insert_one({
        "name": name,
        "score": round(score, 2)
    })
    inserted_id = result.inserted_id

    # 2. Fetch all scores sorted highest-first
    all_docs = list(scores_col.find().sort("score", DESCENDING))
    top_ten = all_docs[:MAX_ENTRIES]
    overflow = all_docs[MAX_ENTRIES:]

    # 3. Delete anything past #10 to keep storage minimal
    if overflow:
        overflow_ids = [doc["_id"] for doc in overflow]
        scores_col.delete_many({"_id": {"$in": overflow_ids}})

    # 4. Find the submitted player's rank (1-10, or "?" if cut)
    rank = "?"
    for index, doc in enumerate(top_ten):
        if doc["_id"] == inserted_id:
            rank = index + 1
            break

    return jsonify({
        "rank": rank,
        "made_top_ten": rank != "?",
        "leaderboard": serialize_entries(top_ten)
    }), 201


if __name__ == "__main__":
    app.run(debug=True, port=5000)