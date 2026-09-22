import os
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from pymongo import MongoClient, DESCENDING
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("cloud_resource_ai.db")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/cloud_resource_ai")
DB_NAME = "cloud_resource_ai"

# In-memory storage fallback if MongoDB is unreachable
class InMemoryStore:
    def __init__(self):
        self.metrics: List[Dict[str, Any]] = []
        self.predictions: List[Dict[str, Any]] = []
        self.alerts: List[Dict[str, Any]] = []
        self.users: Dict[str, Dict[str, Any]] = {
            "admin@cloudai.io": {
                "name": "Cloud Admin",
                "email": "admin@cloudai.io",
                "password_hash": "dbbbcbbe56bc1aaa743bb1d95feafc437bb1c7cad475b9bb3cfa57c3a76e92ec",
                "role": "DevOps & Cloud Lead",
                "created_at": datetime.now().isoformat()
            },
            "evaluator@university.edu": {
                "name": "Viva Evaluator",
                "email": "evaluator@university.edu",
                "password_hash": "360ef5714dba2f13c0c98322d0c3c6305527be59002a4d73467f0b8c013cd47f",
                "role": "Viva / Project Evaluator",
                "created_at": datetime.now().isoformat()
            },
            "devops@cloudai.io": {
                "name": "Cloud Engineer",
                "email": "devops@cloudai.io",
                "password_hash": "360ef5714dba2f13c0c98322d0c3c6305527be59002a4d73467f0b8c013cd47f",
                "role": "Cloud Engineer",
                "created_at": datetime.now().isoformat()
            }
        }

    def insert_user(self, user: Dict[str, Any]):
        self.users[user["email"].lower().strip()] = user.copy()

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        return self.users.get(email.lower().strip())

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        for u in self.users.values():
            if u.get("token") == token:
                return u.copy()
        return None

    def insert_metric(self, doc: Dict[str, Any]):
        self.metrics.append(doc.copy())
        if len(self.metrics) > 2000:
            self.metrics = self.metrics[-2000:]

    def get_latest_metric(self) -> Optional[Dict[str, Any]]:
        return self.metrics[-1].copy() if self.metrics else None

    def get_metric_history(self, limit: int = 288) -> List[Dict[str, Any]]:
        return [m.copy() for m in self.metrics[-limit:]]

    def insert_prediction(self, doc: Dict[str, Any]):
        self.predictions.append(doc.copy())
        if len(self.predictions) > 1000:
            self.predictions = self.predictions[-1000:]

    def get_latest_prediction(self) -> Optional[Dict[str, Any]]:
        return self.predictions[-1].copy() if self.predictions else None

    def insert_alert(self, doc: Dict[str, Any]):
        entry = doc.copy()
        if "status" not in entry:
            entry["status"] = "ACTIVE"
        self.alerts.append(entry)
        if len(self.alerts) > 500:
            self.alerts = self.alerts[-500:]

    def resolve_alert(self, timestamp: Optional[str] = None, alert_type: Optional[str] = None, status: str = "RESOLVED", resolved_by: str = "Site Reliability Engineer"):
        resolved_count = 0
        from datetime import datetime
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for a in self.alerts:
            match = True
            if timestamp and a.get("timestamp") != timestamp:
                match = False
            if alert_type and a.get("type") != alert_type:
                match = False
            if match:
                a["status"] = status
                a["resolved_at"] = now_str if status == "RESOLVED" else None
                a["resolved_by"] = resolved_by if status == "RESOLVED" else None
                resolved_count += 1
        return resolved_count

    def resolve_all_alerts(self, resolved_by: str = "Site Reliability Engineer"):
        from datetime import datetime
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        count = 0
        for a in self.alerts:
            if a.get("status") != "RESOLVED":
                a["status"] = "RESOLVED"
                a["resolved_at"] = now_str
                a["resolved_by"] = resolved_by
                count += 1
        return count

    def clear_alerts(self):
        self.alerts = []

    def get_recent_alerts(self, limit: int = 20) -> List[Dict[str, Any]]:
        return [a.copy() for a in reversed(self.alerts[-limit:])]

memory_store = InMemoryStore()

class DatabaseManager:
    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.db = None
        self.is_connected = False
        self._init_connection()

    def _init_connection(self):
        try:
            logger.info(f"Connecting to MongoDB at: {MONGO_URI}...")
            # Use short timeout so backend never hangs if MongoDB is offline
            self.client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=1200)
            # Trigger server ping
            self.client.admin.command('ping')
            self.db = self.client[DB_NAME]
            self.is_connected = True
            logger.info(f"Connected to MongoDB database: {DB_NAME}")

            # Ensure indexes on collections
            self.db.metrics.create_index([("timestamp", DESCENDING)])
            self.db.predictions.create_index([("timestamp", DESCENDING)])
            self.db.alerts.create_index([("timestamp", DESCENDING)])
        except (ServerSelectionTimeoutError, PyMongoError, Exception) as e:
            self.is_connected = False
            self.client = None
            self.db = None
            logger.warning(f"MongoDB not reachable ({e}). Operating in resilient In-Memory persistence mode.")

    def get_status(self) -> Dict[str, Any]:
        return {
            "mode": "mongodb" if self.is_connected else "in_memory_fallback",
            "connected": self.is_connected,
            "database": DB_NAME,
            "uri": MONGO_URI.split("@")[-1] if "@" in MONGO_URI else MONGO_URI
        }

    def insert_metric(self, metric: Dict[str, Any]):
        # Keep copy in memory for fast retrieval
        memory_store.insert_metric(metric)
        if self.is_connected and self.db is not None:
            try:
                record = metric.copy()
                self.db.metrics.insert_one(record)
            except Exception as e:
                logger.error(f"Failed to insert metric to MongoDB: {e}")

    def get_latest_metric(self) -> Optional[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            try:
                doc = self.db.metrics.find_one(sort=[("timestamp", DESCENDING)])
                if doc:
                    doc.pop("_id", None)
                    return doc
            except Exception as e:
                logger.error(f"Error fetching latest metric from MongoDB: {e}")
        return memory_store.get_latest_metric()

    def get_metric_history(self, limit: int = 288) -> List[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            try:
                cursor = self.db.metrics.find().sort("timestamp", DESCENDING).limit(limit)
                docs = list(cursor)
                for d in docs:
                    d.pop("_id", None)
                # Return chronologically ascending for charts
                return list(reversed(docs))
            except Exception as e:
                logger.error(f"Error fetching metric history from MongoDB: {e}")
        return memory_store.get_metric_history(limit)

    def insert_prediction(self, prediction: Dict[str, Any]):
        memory_store.insert_prediction(prediction)
        if self.is_connected and self.db is not None:
            try:
                record = prediction.copy()
                self.db.predictions.insert_one(record)
            except Exception as e:
                logger.error(f"Failed to insert prediction to MongoDB: {e}")

    def get_latest_prediction(self) -> Optional[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            try:
                doc = self.db.predictions.find_one(sort=[("timestamp", DESCENDING)])
                if doc:
                    doc.pop("_id", None)
                    return doc
            except Exception as e:
                logger.error(f"Error fetching latest prediction: {e}")
        return memory_store.get_latest_prediction()

    def insert_alert(self, alert: Dict[str, Any]):
        memory_store.insert_alert(alert)
        if self.is_connected and self.db is not None:
            try:
                record = alert.copy()
                self.db.alerts.insert_one(record)
            except Exception as e:
                logger.error(f"Failed to insert alert: {e}")

    def get_recent_alerts(self, limit: int = 20) -> List[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            try:
                cursor = self.db.alerts.find().sort("timestamp", DESCENDING).limit(limit)
                docs = list(cursor)
                for d in docs:
                    d.pop("_id", None)
                return docs
            except Exception as e:
                logger.error(f"Error fetching alerts: {e}")
        return memory_store.get_recent_alerts(limit)

    def resolve_alert(self, timestamp: Optional[str] = None, alert_type: Optional[str] = None, status: str = "RESOLVED", resolved_by: str = "Site Reliability Engineer"):
        count = memory_store.resolve_alert(timestamp=timestamp, alert_type=alert_type, status=status, resolved_by=resolved_by)
        if self.is_connected and self.db is not None:
            try:
                from datetime import datetime
                query = {}
                if timestamp:
                    query["timestamp"] = timestamp
                if alert_type:
                    query["type"] = alert_type
                update_fields = {"status": status}
                if status == "RESOLVED":
                    update_fields["resolved_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    update_fields["resolved_by"] = resolved_by
                self.db.alerts.update_many(query, {"$set": update_fields})
            except Exception as e:
                logger.error(f"Error resolving alerts in MongoDB: {e}")
        return count

    def resolve_all_alerts(self, resolved_by: str = "Site Reliability Engineer"):
        count = memory_store.resolve_all_alerts(resolved_by=resolved_by)
        if self.is_connected and self.db is not None:
            try:
                from datetime import datetime
                now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                self.db.alerts.update_many(
                    {"status": {"$ne": "RESOLVED"}},
                    {"$set": {"status": "RESOLVED", "resolved_at": now_str, "resolved_by": resolved_by}}
                )
            except Exception as e:
                logger.error(f"Error resolving all alerts in MongoDB: {e}")
        return count

    def clear_alerts(self):
        memory_store.clear_alerts()
        if self.is_connected and self.db is not None:
            try:
                self.db.alerts.delete_many({})
            except Exception as e:
                logger.error(f"Error clearing alerts from MongoDB: {e}")


    def insert_user(self, user: Dict[str, Any]):
        memory_store.insert_user(user)
        if self.is_connected and self.db is not None:
            try:
                record = user.copy()
                self.db.users.update_one(
                    {"email": user["email"].lower().strip()},
                    {"$set": record},
                    upsert=True
                )
            except Exception as e:
                logger.error(f"Failed to insert user in MongoDB: {e}")

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            try:
                doc = self.db.users.find_one({"email": email.lower().strip()})
                if doc:
                    doc.pop("_id", None)
                    return doc
            except Exception as e:
                logger.error(f"Error fetching user from MongoDB: {e}")
        return memory_store.get_user_by_email(email)

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            try:
                doc = self.db.users.find_one({"token": token})
                if doc:
                    doc.pop("_id", None)
                    return doc
            except Exception as e:
                logger.error(f"Error fetching user by token from MongoDB: {e}")
        return memory_store.get_user_by_token(token)

# Global singleton database manager instance
db_manager = DatabaseManager()
