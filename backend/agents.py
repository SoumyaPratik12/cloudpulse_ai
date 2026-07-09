"""LangGraph-based AI agents for infrastructure analysis."""
import json
import logging
from typing import Dict, Any
from langchain.llms import OpenAI, Anthropic
from langchain.agents import Tool, initialize_agent, AgentType
from langchain.memory import ConversationBufferMemory

logger = logging.getLogger(__name__)


class CostOptimizationAgent:
    """Agent for analyzing and recommending cost optimizations."""

    def __init__(self, api_key: str, model: str = "gpt-4"):
        self.llm = OpenAI(api_key=api_key, model_name=model, temperature=0)
        self.memory = ConversationBufferMemory(memory_key="chat_history")

    def analyze_resources(self, resources: list, cost_data: dict) -> Dict[str, Any]:
        """Analyze resources and generate cost optimization recommendations."""
        prompt = f"""
        Analyze the following AWS resources and cost data to identify optimization opportunities:
        
        Resources: {json.dumps(resources, indent=2)}
        Cost Data: {json.dumps(cost_data, indent=2)}
        
        Provide specific, actionable recommendations for:
        1. Underutilized instances that can be terminated or downsized
        2. Reserved Instance opportunities
        3. Spot Instance opportunities
        4. Storage optimization
        5. Database optimization
        
        Format your response as JSON with the following structure:
        {{
            "recommendations": [
                {{
                    "type": "rightsizing|termination|reserved_instance|spot_instance|storage|database",
                    "resource_id": "resource-id",
                    "title": "Recommendation title",
                    "description": "Detailed description",
                    "estimated_monthly_savings": 0.00,
                    "priority": "critical|high|medium|low"
                }}
            ],
            "total_potential_savings": 0.00
        }}
        """

        try:
            response = self.llm.predict(prompt)
            recommendations = json.loads(response)
            return recommendations
        except Exception as e:
            logger.error(f"Error analyzing resources: {str(e)}")
            return {"recommendations": [], "total_potential_savings": 0}


class PerformanceAgent:
    """Agent for analyzing performance and resource utilization."""

    def __init__(self, api_key: str, model: str = "gpt-4"):
        self.llm = OpenAI(api_key=api_key, model_name=model, temperature=0)

    def analyze_utilization(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze resource utilization metrics and provide recommendations."""
        prompt = f"""
        Analyze the following resource utilization metrics:
        
        {json.dumps(metrics, indent=2)}
        
        Identify:
        1. Underutilized resources (CPU < 10%, Memory < 20%)
        2. Overutilized resources (CPU > 80%, Memory > 85%)
        3. Sizing mismatches
        4. Performance optimization opportunities
        
        Return recommendations as JSON.
        """

        try:
            response = self.llm.predict(prompt)
            recommendations = json.loads(response)
            return recommendations
        except Exception as e:
            logger.error(f"Error analyzing utilization: {str(e)}")
            return {"recommendations": []}


class SecurityAgent:
    """Agent for identifying security issues and misconfigurations."""

    def __init__(self, api_key: str, model: str = "gpt-4"):
        self.llm = OpenAI(api_key=api_key, model_name=model, temperature=0)

    def analyze_security(self, configurations: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze security configurations and identify risks."""
        prompt = f"""
        Analyze the following AWS configurations for security issues:
        
        {json.dumps(configurations, indent=2)}
        
        Identify:
        1. Publicly accessible resources
        2. Overly permissive IAM policies
        3. Unencrypted data stores
        4. Missing backup configurations
        5. Compliance violations
        
        Return findings as JSON with severity levels.
        """

        try:
            response = self.llm.predict(prompt)
            findings = json.loads(response)
            return findings
        except Exception as e:
            logger.error(f"Error analyzing security: {str(e)}")
            return {"findings": []}


class RCAAgent:
    """Root Cause Analysis agent for debugging infrastructure issues."""

    def __init__(self, api_key: str, model: str = "gpt-4"):
        self.llm = OpenAI(api_key=api_key, model_name=model, temperature=0.5)
        self.memory = ConversationBufferMemory(memory_key="chat_history")

    def analyze_incident(self, incident_data: Dict[str, Any], logs: str) -> Dict[str, Any]:
        """Analyze an incident and provide root cause analysis."""
        prompt = f"""
        Analyze the following incident and logs to determine root cause:
        
        Incident Data: {json.dumps(incident_data, indent=2)}
        
        Logs:
        {logs}
        
        Provide:
        1. Root cause analysis
        2. Timeline of events
        3. Contributing factors
        4. Remediation steps
        5. Prevention measures
        
        Format as detailed JSON response.
        """

        try:
            response = self.llm.predict(prompt)
            analysis = json.loads(response)
            return analysis
        except Exception as e:
            logger.error(f"Error analyzing incident: {str(e)}")
            return {"root_cause": "Unknown", "remediation_steps": []}


# Agent factory
def get_cost_agent(api_key: str) -> CostOptimizationAgent:
    """Get cost optimization agent."""
    return CostOptimizationAgent(api_key)


def get_performance_agent(api_key: str) -> PerformanceAgent:
    """Get performance analysis agent."""
    return PerformanceAgent(api_key)


def get_security_agent(api_key: str) -> SecurityAgent:
    """Get security analysis agent."""
    return SecurityAgent(api_key)


def get_rca_agent(api_key: str) -> RCAAgent:
    """Get RCA agent."""
    return RCAAgent(api_key)
