class Memory:
    def __init__(self):
        self.data = {}

    def add_data(self, key, value):
        self.data[key] = value

    def get_data(self, key):
        return self.data.get(key)

    def delete_data(self, key):
        if key in self.data:
            del self.data[key]