"""
NLP Preprocessing Module
Handles: tokenization, normalization, punctuation removal, keyword/entity detection
"""
import re
import string

STOPWORDS = {"the", "a", "an", "is", "are", "was", "were", "of", "in", "on", "at", "to", "for", "with", "by", "from", "and", "or", "but", "not", "all", "me", "my", "i", "we", "you", "it", "this", "that", "those", "these", "who", "which", "where", "what", "how", "get", "give", "show", "list", "find", "display", "fetch"}

NUMBER_WORDS = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10}

class NLPreprocessor:
    def preprocess(self, text: str) -> dict:
        """Full preprocessing pipeline. Returns structured info."""
        normalized = self.normalize(text)
        tokens = self.tokenize(normalized)
        keywords = self.extract_keywords(tokens)
        numbers = self.extract_numbers(text)
        intent = self.detect_intent(text)
        return {
            "original": text,
            "normalized": normalized,
            "tokens": tokens,
            "keywords": keywords,
            "numbers": numbers,
            "intent": intent
        }

    def normalize(self, text: str) -> str:
        text = text.lower().strip()
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text

    def tokenize(self, text: str) -> list:
        return text.split()

    def extract_keywords(self, tokens: list) -> list:
        return [t for t in tokens if t not in STOPWORDS and len(t) > 1]

    def extract_numbers(self, text: str) -> list:
        nums = re.findall(r'\b\d+\.?\d*\b', text)
        result = [float(n) if '.' in n else int(n) for n in nums]
        for word, val in NUMBER_WORDS.items():
            if word in text.lower():
                result.append(val)
        return result

    def detect_intent(self, text: str) -> str:
        text_lower = text.lower()
        if any(w in text_lower for w in ["count", "how many", "total number"]):
            return "COUNT"
        if any(w in text_lower for w in ["average", "avg", "mean"]):
            return "AVERAGE"
        if any(w in text_lower for w in ["top", "highest", "best", "maximum", "max"]):
            return "TOP_N"
        if any(w in text_lower for w in ["bottom", "lowest", "worst", "minimum", "min"]):
            return "BOTTOM_N"
        if any(w in text_lower for w in ["below", "less than", "under", "low"]):
            return "FILTER_LT"
        if any(w in text_lower for w in ["above", "greater than", "over", "high", "more than"]):
            return "FILTER_GT"
        return "SELECT"
