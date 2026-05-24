import json
import os
import math
from server.telemetry import get_retention_stats
from server.catalog import CONTENT_LIBRARY

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'xgboost_model.json')

class DecisionTreeRegressorNode:
    def __init__(self, depth=0, max_depth=3):
        self.depth = depth
        self.max_depth = max_depth
        self.feature = None
        self.split_value = None
        self.left = None
        self.right = None
        self.leaf_value = None
        self.node_id = -1
        
    def fit(self, data):
        # data is a list of (features_dict, target_value)
        if not data:
            self.leaf_value = 0.0
            return
            
        avg_target = sum(y for _, y in data) / len(data)
        
        if self.depth >= self.max_depth or len(data) < 2:
            self.leaf_value = avg_target
            return
            
        best_feature = None
        best_split = None
        best_variance_reduction = -1
        
        features = list(data[0][0].keys())
        
        # Calculate current variance
        current_variance = sum((y - avg_target) ** 2 for _, y in data) / len(data)
        
        for feature in features:
            values = sorted(list(set(x[feature] for x, _ in data)))
            for i in range(len(values) - 1):
                split = (values[i] + values[i+1]) / 2.0
                left_data = [(x, y) for x, y in data if x[feature] < split]
                right_data = [(x, y) for x, y in data if x[feature] >= split]
                
                if not left_data or not right_data:
                    continue
                    
                left_avg = sum(y for _, y in left_data) / len(left_data)
                right_avg = sum(y for _, y in right_data) / len(right_data)
                
                left_var = sum((y - left_avg) ** 2 for _, y in left_data)
                right_var = sum((y - right_avg) ** 2 for _, y in right_data)
                
                variance_reduction = current_variance - ((left_var + right_var) / len(data))
                
                if variance_reduction > best_variance_reduction:
                    best_variance_reduction = variance_reduction
                    best_feature = feature
                    best_split = split
                    
        if best_feature is None or best_variance_reduction < 1e-4:
            self.leaf_value = avg_target
            return
            
        self.feature = best_feature
        self.split_value = best_split
        
        left_data = [(x, y) for x, y in data if x[self.feature] < self.split_value]
        right_data = [(x, y) for x, y in data if x[self.feature] >= self.split_value]
        
        self.left = DecisionTreeRegressorNode(self.depth + 1, self.max_depth)
        self.left.fit(left_data)
        
        self.right = DecisionTreeRegressorNode(self.depth + 1, self.max_depth)
        self.right.fit(right_data)

    def to_dict(self, id_counter=[0]):
        node_dict = {"node_id": id_counter[0]}
        self.node_id = id_counter[0]
        id_counter[0] += 1
        
        if self.leaf_value is not None:
            node_dict["leaf_value"] = round(self.leaf_value, 3)
        else:
            node_dict["feature"] = self.feature
            node_dict["split_value"] = round(self.split_value, 3)
            
            left_dict = self.left.to_dict(id_counter)
            right_dict = self.right.to_dict(id_counter)
            
            node_dict["left"] = left_dict["node_id"]
            node_dict["right"] = right_dict["node_id"]
            
            # Flattens the tree into a list of nodes for XGBoost format
            return [node_dict] + (left_dict if isinstance(left_dict, list) else [left_dict]) + (right_dict if isinstance(right_dict, list) else [right_dict])
            
        return [node_dict]

def extract_features(asset):
    # Simulated feature extraction for training
    emb = asset.get('embedding', [0]*8)
    return {
        "embedding_similarity": sum(emb)/len(emb), # Rough proxy
        "genre_fatigue": 0.2 if asset.get('genre') == 'Action' else 0.5,
        "demographic_alignment": 0.8 if asset.get('target_demo') == 'All' else 0.4,
        "time_slot_fit": 0.6,
        "seasonality_fit": 0.7
    }

def retrain_model():
    print("[SYSTEM] Starting Native Python AI Retraining...")
    stats = get_retention_stats()
    if len(stats) < 2:
        return {"status": "error", "message": "Not enough telemetry data to retrain."}
        
    training_data = []
    for row in stats:
        asset_id = row['asset_id']
        retention = row['avg_retention']
        
        asset = next((a for a in CONTENT_LIBRARY if a['id'] == asset_id), None)
        if asset:
            features = extract_features(asset)
            # Convert retention (0-1) to roughly Z score scale (-3 to 3)
            # High retention -> High Z
            z = math.log((retention + 0.01) / (1.01 - retention))
            training_data.append((features, z))
            
    print(f"Training on {len(training_data)} telemetry records...")
    
    # Build 3 small decision trees to create an ensemble
    trees_json = []
    for i in range(3):
        # Bootstrap sampling (simulating ensemble)
        import random
        sample_data = random.choices(training_data, k=len(training_data))
        
        tree = DecisionTreeRegressorNode(max_depth=2)
        tree.fit(sample_data)
        
        nodes_list = tree.to_dict([0])
        trees_json.append({
            "tree_id": i,
            "nodes": nodes_list
        })
        
    model_json = {
        "model_type": "xgboost_mock_retrained",
        "version": "2.0",
        "trees": trees_json
    }
    
    with open(MODEL_PATH, 'w') as f:
        json.dump(model_json, f, indent=2)
        
    print("[SUCCESS] Model retrained and saved to xgboost_model.json")
    return {"status": "success", "message": "Model retrained autonomously using Real-World SQLite Data!"}

if __name__ == "__main__":
    retrain_model()
