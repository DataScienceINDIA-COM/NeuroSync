class Message:
    def __init__(self, sender: str, receiver: str, type: str, content: dict):
        self.sender = sender
        self.receiver = receiver
        self.type = type
        self.content = content

    def __str__(self):
        return f"Message(sender='{self.sender}', receiver='{self.receiver}', type='{self.type}', content={self.content})"


REQUEST_INFORMATION = "REQUEST_INFORMATION"
SUGGESTION = "SUGGESTION"
OBSERVATION = "OBSERVATION"
ALERT = "ALERT"


def create_request_information_message(sender: str, receiver: str, content: dict) -> Message:
    return Message(sender, receiver, REQUEST_INFORMATION, content)


def create_suggestion_message(sender: str, receiver: str, content: dict) -> Message:
    return Message(sender, receiver, SUGGESTION, content)


def create_observation_message(sender: str, receiver: str, content: dict) -> Message:
    return Message(sender, receiver, OBSERVATION, content)


def create_alert_message(sender: str, receiver: str, content: dict) -> Message:
    return Message(sender, receiver, ALERT, content)