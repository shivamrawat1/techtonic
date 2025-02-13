import json
import os
from openai import OpenAI
from django.conf import settings

class InterviewAnalyzer:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def analyze_interview(self, conversation, assessment_type):
        if assessment_type == 'technical':
            return self._analyze_technical(conversation)
        else:
            return self._analyze_behavioral(conversation)

    def _analyze_technical(self, conversation):
        prompt = {
            "role": "system",
            "content": """Analyze this technical interview using the UMPIRE method:
                U - Understanding: How well did they understand the problem?
                M - Match: Did they identify similar patterns/problems?
                P - Plan: How well did they plan their approach?
                I - Implement: How was their implementation?
                R - Review: Did they review their solution?
                E - Evaluate: Did they analyze complexity and optimization?

                For each component, provide:
                1. Score (0-100)
                2. Detailed feedback
                3. Key observations
                
                Format as JSON with structure:
                {
                    "components": {
                        "understanding": {"score": X, "feedback": "...", "observations": []},
                        "match": {"score": X, "feedback": "...", "observations": []},
                        "plan": {"score": X, "feedback": "...", "observations": []},
                        "implement": {"score": X, "feedback": "...", "observations": []},
                        "review": {"score": X, "feedback": "...", "observations": []},
                        "evaluate": {"score": X, "feedback": "...", "observations": []}
                    },
                    "overall_score": X,
                    "summary": "..."
                }"""
        }

        return self._get_analysis(prompt, conversation)

    def _analyze_behavioral(self, conversation):
        prompt = {
            "role": "system",
            "content": """Analyze this behavioral interview using the STAR method:
                S - Situation: How well did they describe the context?
                T - Task: How clearly did they explain their challenge?
                A - Action: How well did they describe their actions?
                R - Result: How effectively did they present outcomes?

                For each component, provide:
                1. Score (0-100)
                2. Detailed feedback
                3. Key observations
                
                Format as JSON with structure:
                {
                    "components": {
                        "situation": {"score": X, "feedback": "...", "observations": []},
                        "task": {"score": X, "feedback": "...", "observations": []},
                        "action": {"score": X, "feedback": "...", "observations": []},
                        "result": {"score": X, "feedback": "...", "observations": []}
                    },
                    "overall_score": X,
                    "summary": "..."
                }"""
        }

        return self._get_analysis(prompt, conversation)

    def _get_analysis(self, prompt, conversation):
        messages = [
            prompt,
            {"role": "user", "content": json.dumps(conversation)}
        ]

        response = self.client.chat.completions.create(
            model="gpt-4-turbo",
            messages=messages,
            temperature=0.7,
        )

        return json.loads(response.choices[0].message.content) 