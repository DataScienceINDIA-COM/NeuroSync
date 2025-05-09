class Trigger:
    def __init__(self):
        self.triggers = {}

    def create_trigger(self, trigger_id: str, name: str, event: str):
        if trigger_id in self.triggers:
            raise ValueError(f"Trigger with id '{trigger_id}' already exists.")
        self.triggers[trigger_id] = {
            "name": name,
            "event": event,
            "actions": []
        }

    def add_action(self, trigger_id: str, action):
        if trigger_id not in self.triggers:
            raise ValueError(f"Trigger with id '{trigger_id}' not found.")
        if not callable(action):
            raise ValueError("Action must be a callable function.")
        self.triggers[trigger_id]["actions"].append(action)

    def execute_trigger(self, event: str, data: dict = None):
        for trigger_id, trigger_data in self.triggers.items():
            if trigger_data["event"] == event:
                for action in trigger_data["actions"]:
                    if data is None:
                        action()
                    else:
                        action(data)