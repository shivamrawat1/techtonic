import json
import os
import logging
from openai import OpenAI

# Set up logging
logger = logging.getLogger(__name__)

class InterviewAnalyzer:
    def __init__(self):
        try:
            self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            if not os.getenv("OPENAI_API_KEY"):
                logger.error("OPENAI_API_KEY environment variable not set")
        except Exception as e:
            logger.error(f"Error initializing OpenAI client: {str(e)}")
            raise

    def analyze_interview(self, conversation, assessment_type):
        try:
            if assessment_type == 'technical':
                return self._analyze_technical(conversation)
            else:
                return self._analyze_behavioral(conversation)
        except Exception as e:
            logger.error(f"Error analyzing {assessment_type} interview: {str(e)}")
            raise

    def _analyze_technical(self, conversation):
        prompt = {
            "role": "system",
            "content": """Analyze this technical interview using the UMPIRE method with the following rubric:

                U - Understanding: How well did they understand the problem?
                Rubric:
                - 0-20: Failed to grasp the problem, asked no clarifying questions, made incorrect assumptions
                - 21-40: Partial understanding with significant gaps, few clarifying questions
                - 41-60: Basic understanding, asked some relevant questions but missed key constraints
                - 61-80: Good understanding, asked appropriate clarifying questions, identified constraints
                - 81-100: Excellent understanding, thorough clarification, identified edge cases and constraints

                M - Match: Did they identify similar patterns/problems?
                Rubric:
                - 0-20: Failed to recognize any patterns or relate to known problems
                - 21-40: Recognized basic patterns but couldn't apply them effectively
                - 41-60: Identified some relevant patterns/problems but missed key connections
                - 61-80: Good pattern recognition, connected to appropriate known problems
                - 81-100: Excellent pattern matching, leveraged optimal known solutions, demonstrated deep knowledge

                P - Plan: How well did they plan their approach?
                Rubric:
                - 0-20: No coherent plan, random approach
                - 21-40: Vague plan with major logical flaws
                - 41-60: Reasonable plan but inefficient or incomplete
                - 61-80: Clear, structured plan with good approach
                - 81-100: Comprehensive plan with optimal approach, considered alternatives

                I - Implement: How was their implementation?
                Rubric:
                - 0-20: Failed to implement or completely incorrect implementation
                - 21-40: Significant bugs or syntax errors, poor code quality
                - 41-60: Working implementation with minor bugs, average code quality
                - 61-80: Correct implementation, good code quality, readable
                - 81-100: Elegant implementation, excellent code quality, optimized, well-documented

                R - Review: Did they review their solution?
                Rubric:
                - 0-20: No review attempted
                - 21-40: Superficial review, missed obvious issues
                - 41-60: Basic review, caught some issues but missed others
                - 61-80: Thorough review, identified and fixed most issues
                - 81-100: Comprehensive review, tested with multiple cases, verified correctness

                E - Evaluate: Did they analyze complexity and optimization?
                Rubric:
                - 0-20: No complexity analysis or optimization consideration
                - 21-40: Incorrect complexity analysis, poor optimization understanding
                - 41-60: Basic complexity analysis, some optimization awareness
                - 61-80: Accurate complexity analysis, good optimization suggestions
                - 81-100: Detailed complexity analysis for time and space, excellent optimization insights

                For each component, provide:
                1. Score (0-100) based strictly on the rubric above
                2. Detailed feedback with specific examples from the interview
                3. Key observations that influenced the score
                
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
            "content": """Analyze this behavioral interview using the STAR method with the following rubric:

                S - Situation: How well did they describe the context?
                Rubric:
                - 0-20: Failed to provide any meaningful context or background
                - 21-40: Vague or confusing context with significant missing details
                - 41-60: Basic context provided but lacking specificity or relevance
                - 61-80: Clear, relevant context with good detail and setting
                - 81-100: Exceptional context description, concise yet comprehensive, perfectly framed the scenario

                T - Task: How clearly did they explain their challenge?
                Rubric:
                - 0-20: Failed to articulate any clear challenge or responsibility
                - 21-40: Poorly defined task with unclear objectives or stakes
                - 41-60: Basic explanation of the task but lacking clarity on importance or difficulty
                - 61-80: Well-defined task with clear objectives and personal responsibility
                - 81-100: Excellent task description with precise objectives, stakes, and personal role clearly defined

                A - Action: How well did they describe their actions?
                Rubric:
                - 0-20: Failed to describe specific actions taken or extremely vague
                - 21-40: Limited description of actions, lacking logical sequence or detail
                - 41-60: Adequate description of actions but missing key details or reasoning
                - 61-80: Good description of actions with clear sequence, reasoning, and personal contribution
                - 81-100: Exceptional description of actions, highlighting initiative, problem-solving, and leadership

                R - Result: How effectively did they present outcomes?
                Rubric:
                - 0-20: Failed to mention any results or outcomes
                - 21-40: Vague results without measurable impact or reflection
                - 41-60: Basic results mentioned but lacking quantification or significance
                - 61-80: Clear results with measurable impact and good reflection
                - 81-100: Outstanding results presentation with quantified impact, lessons learned, and growth demonstrated

                For each component, provide:
                1. Score (0-100) based strictly on the rubric above
                2. Detailed feedback with specific examples from the interview
                3. Key observations that influenced the score
                
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
        try:
            messages = [
                prompt,
                {"role": "user", "content": json.dumps(conversation)}
            ]

            response = self.client.chat.completions.create(
                model="gpt-4-turbo",
                messages=messages,
                temperature=0.2,
            )

            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error getting analysis from OpenAI: {str(e)}")
            raise 