def get_console_logs() -> dict:
    """
    Simulates retrieving console log entries from a running application.

    Returns:
        dict: A dictionary containing a list of simulated console log entries.
              Each entry has a 'type' and a 'message'.
    """
    simulated_logs = [
        {"type": "log", "message": "Application started successfully."},
        {"type": "warn", "message": "API endpoint /data is deprecated."},
        {"type": "error", "message": "Failed to fetch user data: Network Error"},
        {"type": "log", "message": "User clicked on the 'Submit' button."},
    ]
    return {"console_logs": simulated_logs}

def get_network_requests() -> dict:
    """
    Simulates retrieving network request information from a running application.

    Returns:
        dict: A dictionary containing a list of simulated network requests.
              Each request has url, method, status, and duration.
    """
    simulated_requests = [
        {"url": "/api/user/123", "method": "GET", "status": 200, "duration": 150},
        {"url": "/api/data", "method": "GET", "status": 404, "duration": 50},
        {"url": "/api/submit", "method": "POST", "status": 201, "duration": 300},
    ]
    return {"network_requests": simulated_requests}

def get_dom_structure() -> dict:
    """
    Simulates retrieving a simplified DOM structure.

    Returns:
        dict: A dictionary representing a simplified DOM structure.
    """
    simulated_dom = {
        "tag": "body",
        "children": [
            {
                "tag": "div",
                "id": "app-container",
                "classes": ["container", "main"],
                "children": [
                    {"tag": "header", "classes": ["app-header"]},
                    {
                        "tag": "main",
                        "children": [{"tag": "p", "id": "welcome-message"}]
                    },
                    {"tag": "footer", "classes": ["app-footer"]}
                ]
            }
        ]
    }
    return {"dom_structure": simulated_dom}

if __name__ == '__main__':
    # Example usage:
    logs = get_console_logs()
    import json
    print(json.dumps(logs, indent=2))