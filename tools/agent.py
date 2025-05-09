import unittest
from tools.memory import Memory
from tools.logger import Logger
from tools.trigger import Trigger
from tools.message import Message
import vertexai
from vertexai.language_models import TextGenerationModel

class Agent:
    def __init__(self, name: str, memory: Memory, logger: Logger):
        self.name = name
        self.memory = memory
        self.logger = logger
        self.triggers = []
        vertexai.init(project="gen-ai-app-408923", location="us-central1")
        self.parameters = {
            "candidate_count": 1,
            "max_output_tokens": 1024,
            "temperature": 0.2,
            "top_p": 0.8,
            "top_k": 40
        }
        self.model = TextGenerationModel.from_pretrained("text-bison@001")

    def receive_message(self, message: Message):
        pass

    def send_message(self, message: Message):
        self.logger.add_message(message)

    def add_trigger(self, trigger: Trigger):
        self.triggers.append(trigger)

    def execute_trigger(self, event: str):
        for trigger in self.triggers:
            if trigger.event == event:
                trigger.execute()

    def use_llm(self, prompt: str) -> str:
        response = self.model.predict(prompt, **self.parameters)
        return response.text
    
class TestAgent(unittest.TestCase):
    def setUp(self):
        self.memory = Memory()
        self.logger = Logger()
        self.agent = Agent("TestAgent", self.memory, self.logger)

    def test_send_message(self):
        message = Message("TestAgent", "OtherAgent", "OBSERVATION", {"content": "Test message"})
        self.agent.send_message(message)
        self.assertEqual(len(self.logger.messages), 1)
        self.assertEqual(self.logger.messages[0].content, message.content)

    def test_add_trigger(self):
        trigger = Trigger("test_trigger", "Test Trigger", "test_event")
        self.agent.add_trigger(trigger)
        self.assertEqual(len(self.agent.triggers), 1)
        self.assertEqual(self.agent.triggers[0].name, "Test Trigger")

    def test_execute_trigger(self):
        executed = False
        def test_action():
            nonlocal executed
            executed = True
        trigger = Trigger("test_trigger", "Test Trigger", "test_event")
        trigger.add_action(test_action)
        self.agent.add_trigger(trigger)
        self.agent.execute_trigger("test_event")
        self.assertTrue(executed)

    def test_use_llm(self):
        response = self.agent.use_llm("What is the capital of France?")
        self.assertIsNotNone(response)
        self.assertIsInstance(response, str)