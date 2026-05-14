"""
SQL Generation Module
Maps NLP intent + schema match → SQL query using templates.
Avoids hardcoded SQL — uses dynamic template construction.
"""
import re
from backend.utils.schema_meta import SCHEMA_META

class SQLGenerator:
    def generate(self, query: str, preprocessed: dict, schema_match: dict) -> dict:
        intent = preprocessed["intent"]
        numbers = preprocessed["numbers"]
        table = schema_match["matched_table"]
        columns = [col for col, _ in schema_match["matched_columns"]]
        query_lower = query.lower()

        sql = ""
        explanation = {}

        if intent == "COUNT":
            sql = f"SELECT COUNT(*) as total FROM {table}"
            explanation = {"intent": "COUNT", "table": table}

        elif intent == "AVERAGE":
            # Find numeric column to average
            numeric_cols = self._get_numeric_columns(table)
            avg_col = self._best_match(columns, numeric_cols) or numeric_cols[0]
            sql = f"SELECT AVG({avg_col}) as average_{avg_col} FROM {table}"
            explanation = {"intent": "AVERAGE", "table": table, "column": avg_col}

        elif intent == "TOP_N":
            n = int(numbers[0]) if numbers else 5
            order_col = self._get_order_column(columns, table, "DESC")
            sql = f"SELECT * FROM {table} ORDER BY {order_col} DESC LIMIT {n}"
            explanation = {"intent": "TOP_N", "table": table, "order_by": order_col, "limit": n}

        elif intent == "BOTTOM_N":
            n = int(numbers[0]) if numbers else 5
            order_col = self._get_order_column(columns, table, "ASC")
            sql = f"SELECT * FROM {table} ORDER BY {order_col} ASC LIMIT {n}"
            explanation = {"intent": "BOTTOM_N", "table": table, "order_by": order_col, "limit": n}

        elif intent == "FILTER_LT":
            filter_col, threshold = self._get_filter_params(query_lower, columns, table, numbers)
            sql = f"SELECT * FROM {table} WHERE {filter_col} < {threshold}"
            explanation = {"intent": "FILTER_LT", "table": table, "condition": f"{filter_col} < {threshold}"}

        elif intent == "FILTER_GT":
            filter_col, threshold = self._get_filter_params(query_lower, columns, table, numbers)
            sql = f"SELECT * FROM {table} WHERE {filter_col} > {threshold}"
            explanation = {"intent": "FILTER_GT", "table": table, "condition": f"{filter_col} > {threshold}"}

        else:  # SELECT
            dept_match = re.search(r'\b(cse|ece|me|civil|it|eee)\b', query_lower)
            if dept_match:
                dept = dept_match.group(1).upper()
                sql = f"SELECT * FROM {table} WHERE department = '{dept}'"
                explanation = {"intent": "SELECT_FILTER", "table": table, "condition": f"department = '{dept}'"}
            else:
                sql = f"SELECT * FROM {table} LIMIT 20"
                explanation = {"intent": "SELECT_ALL", "table": table}

        return {"sql": sql, "explanation": explanation}

    def _get_numeric_columns(self, table: str) -> list:
        numeric_map = {
            "students": ["cgpa", "attendance", "semester"],
            "marks": ["marks", "semester"],
            "courses": ["credits"]
        }
        return numeric_map.get(table, ["id"])

    def _best_match(self, candidates: list, pool: list) -> str:
        for c in candidates:
            if c in pool:
                return c
        return None

    def _get_order_column(self, columns: list, table: str, direction: str) -> str:
        numeric = self._get_numeric_columns(table)
        match = self._best_match(columns, numeric)
        return match if match else numeric[0]

    def _get_filter_params(self, query_lower: str, columns: list, table: str, numbers: list) -> tuple:
        numeric = self._get_numeric_columns(table)
        filter_col = self._best_match(columns, numeric) or numeric[0]
        threshold = numbers[0] if numbers else (75 if filter_col == "attendance" else 8.0 if filter_col == "cgpa" else 50)
        return filter_col, threshold
