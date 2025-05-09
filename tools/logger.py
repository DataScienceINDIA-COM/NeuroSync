class Logger:
    def __init__(self):
        self.messages = []

    def add_message(self, message):
        self.messages.append(message)

    def get_all_messages(self):
        return self.messages