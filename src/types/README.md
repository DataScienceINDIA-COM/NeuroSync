from typing import List

# Placeholder for demonstration purposes.
# In a real application, this would interact with a database or other storage.
_users = []

class User:
    def __init__(self, user_id: str, name: str, email: str):
        self.user_id = user_id
        self.name = name
        self.email = email

def create_user(user_id: str, name: str, email: str) -> User:
    """Creates a new user."""
    user = User(user_id, name, email)
    _users.append(user)
    return user

def get_user(user_id: str) -> User | None:
    """Retrieves a user by their ID."""
    for user in _users:
        if user.user_id == user_id:
            return user
    return None

def update_user(user_id: str, name: str | None = None, email: str | None = None) -> User | None:
    """Updates an existing user's information."""
    user = get_user(user_id)
    if user:
        if name:
            user.name = name
        if email:
            user.email = email
        return user
    return None

def delete_user(user_id: str) -> bool:
    """Deletes a user by their ID."""
    initial_count = len(_users)
    global _users
    _users = [user for user in _users if user.user_id != user_id]
    return len(_users) < initial_count

def list_users() -> List[User]:
    """Lists all users."""
    return _users

if __name__ == '__main__':
    # Example usage:
    user1 = create_user("1", "Alice", "alice@example.com")
    user2 = create_user("2", "Bob", "bob@example.com")

    print("All users:")
    for user in list_users():
        print(f"ID: {user.user_id}, Name: {user.name}, Email: {user.email}")

    retrieved_user = get_user("1")
    if retrieved_user:
        print(f"\nRetrieved user: ID: {retrieved_user.user_id}, Name: {retrieved_user.name}")

    updated_user = update_user("2", name="Robert")
    if updated_user:
        print(f"\nUpdated user: ID: {updated_user.user_id}, Name: {updated_user.name}")

    delete_user("1")
    print("\nUsers after deletion:")
    for user in list_users():
        print(f"ID: {user.user_id}, Name: {user.name}, Email: {user.email}")