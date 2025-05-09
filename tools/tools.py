import ast
import os
import re
import unittest
import logging
import shutil
from typing import Dict, List, Optional
from tools.message import Message, MessageType, create_message
from tools.memory import Memory
from tools.logger import Logger, logger
from tools.agent import Agent
from tools.devtools import get_console_logs, get_network_requests, get_dom_structure, run_terminal_command as simulate_run_terminal_command
from tools.trigger import Trigger
import uuid

# Dictionary to store simulated approval responses (keyed by request ID)
# In a real application, this would be managed by a UI and a backend system.
simulated_approval_responses = {}

def get_file_content_summary(path: str) -> Dict:
    """
    Generates a concise summary of the content of a file.
    
    Args:
        path: The path to the file.

    Returns:
        A dictionary containing a summary of the file.
    """
    try:
        with open(path, "r") as file:
            content = file.read()
    except FileNotFoundError:
        error_msg = f"File not found: {path}"
        logging.error(error_msg)
        return {"error": error_msg}
    except Exception as e:
        error_msg = f"Error reading file: {path}, Error: {e}"
        logging.error(error_msg)
        return {"error": error_msg}
    
    summary = {"path": path}
    try:
        if path.endswith((".py", ".js", ".ts", ".tsx")):
            try:
                tree = ast.parse(content)
                summary = {
                    "type": "code",
                    "functions": [],
                    "classes": [],
                    "imports": [],
                }
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef):
                        summary["functions"].append({
                            "name": node.name,
                            "parameters": [arg.arg for arg in node.args.args],
                            "returns": ast.get_source_segment(content, node.returns) if node.returns else None,
                            "docstring": ast.get_docstring(node),
                        })
                    elif isinstance(node, ast.ClassDef):
                        summary["classes"].append({
                            "name": node.name,
                            "bases": [ast.get_source_segment(content, base) for base in node.bases],
                            "docstring": ast.get_docstring(node),
                        })
                    elif isinstance(node, (ast.Import, ast.ImportFrom)):
                        if isinstance(node, ast.ImportFrom):
                             summary["imports"].append({"module": node.module, "names": [n.name for n in node.names]})
                        else:
                             summary["imports"].append({"module": None, "names": [n.name for n in node.names]})

            except Exception as e:
                error_msg = f"Error parsing file as AST: {path}, Error: {e}"
                logging.error(error_msg)
                summary["type"] = "unknown_code"
                if isinstance(e, SyntaxError):
                    if "decorator" in str(e):
                        summary = {
                            "text_summary": content[:200] + "..." if len(content) > 200 else content
                        }
                    else:
                        return {"error": error_msg}
                else:
                    return {"error": error_msg}
        elif path.endswith((".txt", ".md")):
            summary = {
                "type": "text",
                "text_summary": content[:200] + "..." if len(content) > 200 else content
            }
        else:
            summary = {
                "type": "unknown",
                "content_preview": content[:200] + "..." if len(content) > 200 else content
            }
        return {"path": path, "summary": summary, "status": "success"}
    
    except FileNotFoundError:
        return {"error": f"File not found: {path}"}
    except Exception as e:
        return {"error": f"Error processing file: {e}"}


def natural_language_write_file(path: str, prompt: str) -> Dict:
    """
    Writes content to a file based on a natural language prompt.
    Args:
        path: The path to the file to write.
        prompt: The natural language instructions for the content to write.
    Returns:
        A dictionary indicating the status of the operation (staged, approval_required, or error).
        If staged or approval is required, includes the proposed content.
    """
    # TODO: Implement real write permission checks here.
    import time
    # For now, we'll simulate needing approval for certain paths.
    # TODO: Implement real Git integration here to stage changes.
    # TODO: Implement real write permission checks here.
    # For now, we'll simulate needing approval for certain paths.
    requires_approval = False
    # Define a standard data structure for approval requests
    approval_request = {
        "request_id": str(uuid.uuid4()),
        "action_type": "write_file",
        "details": {"path": path, "prompt": prompt},
    }
    if "sensitive" in path or "config" in path:  # Example: require approval for files with 'sensitive' or 'config' in their path
        requires_approval = True

    proposed_content = f"// Content based on prompt: {prompt}\n// AI-generated content goes here." # This would be generated by an LLM in a real scenario

    # Simulate sending approval request to UI and waiting for response
    if requires_approval:
        print(f"Approval request for writing to {path}: {approval_request}") # Simulate sending to UI
        # Simulate waiting for approval response
        while approval_request["request_id"] not in simulated_approval_responses:
            time.sleep(1) # Simulate waiting

        response = simulated_approval_responses.pop(approval_request["request_id"])

        if not response.get("approved", False):
            return {"status": "denied", "message": "User denied write access."}
        # If approved, proceed with simulated staging
        return {
            "status": "staged",
            "message": f"Changes for {path} staged for review. Requires prior approval.",
            "proposed_content": proposed_content,
            "approval_request": approval_request,
        }

    # Simulate staging changes in version control
    return {"status": "staged", "message": f"Changes for {path} staged for review.", "proposed_content": proposed_content}

def run_terminal_command(command: str, require_approval: bool = True) -> Dict:
    import time

    """
    Writes content to a file based on a natural language prompt.
    Args:
        path: The path to the file to write.
        prompt: The natural language instructions for the content to write.
    Returns:
        A dictionary indicating the status of the operation (staged, approval_required, or error).
        If staged or approval is required, includes the proposed content.
    # TODO: Implement real write permission checks here.
    # Define a standard data structure for approval requests
    approval_request = {
        "request_id": str(uuid.uuid4()),
        "action_type": "run_terminal_command",
        "details": {"command": command},
    }
    # Implement permission check: Only allow a restricted set of commands initially.
    allowed_commands = ['ls', 'pwd', 'git status']
    is_allowed = any(command.startswith(allowed_cmd) for allowed_cmd in allowed_commands)

    # Check if approval is required based on flag or command type
    if require_approval or not is_allowed:
        requires_approval = True

    if requires_approval:
        print(f"Approval request for command '{command}': {approval_request}") # Simulate sending to UI
        # Simulate waiting for approval response
        while approval_request["request_id"] not in simulated_approval_responses:
            time.sleep(1) # Simulate waiting

        response = simulated_approval_responses.pop(approval_request["request_id"])

        if not response.get("approved", False):
            return {"status": "denied", "message": "User denied command execution."}
        # If approved, proceed with command execution
        try:
            output = simulate_run_terminal_command(command)
            return {"status": "success", "output": output}
        except Exception as e:
            return {
            "status": "error",
            "error": str(e),
            "command": command,
            "message": f"Error executing command '{command}' after approval."
            "approval_request": approval_request,
        }

    # Simulate running the command (replace with actual subprocess execution in a real environment)
    try:
        # In a real scenario, you would use subprocess.run() here
        output = simulate_run_terminal_command(command) # Using the simulated function for now
        return {"status": "success", "output": output}
    except Exception as e:
        return {"status": "error", "error": str(e)}

def run_static_analysis(file_path: str) -> Dict:
 """
    Simulates running a static code analysis tool on the specified file.
    
 Args:
 file_path: The path to the file to analyze.

 Returns:
 A dictionary containing a list of simulated issues found.
 """
 # This is a simulation of a static analysis tool.
 # In a real implementation, you would integrate with tools like Pylint, ESLint, etc.

    simulated_issues = []
    if "example_error" in file_path:
        simulated_issues.append({
 "type": "error",
 "message": "Simulated syntax error found.",
 "line": 10
 })
    if "example_warning" in file_path:
        simulated_issues.append({
 "type": "warning",
 "message": "Simulated unused variable.",
 "line": 5
 })

    return {
 "status": "success",
 "file_path": file_path,
 "issues": simulated_issues
    }


def get_dependencies(file_path: str) -> Dict:
    """
    Simulates analyzing the specified file and identifying its dependencies.

    Args:
 file_path: The path to the file to analyze.

 Returns:
 A dictionary listing the simulated dependencies.
 """
 # This is a simulation of dependency tracking.
 # In a real implementation, you would use static analysis or language-specific tools.

    simulated_deps = []
    if "file1.py" in file_path:
        simulated_deps.append("os")
    if "file3.py" in file_path:
        simulated_deps.append("mood_log_function")

    return {
 "status": "success",
 "file_path": file_path,
 "dependencies": simulated_deps
    }

def receive_approval_response(request_id: str, approved: bool) -> Dict:
    """
    Simulates receiving an approval response from an external UI.

    Args:
        request_id: The ID of the approval request.
        approved: A boolean indicating whether the request was approved.

    Returns:
        A dictionary indicating the status of receiving the response.
    """
    # Simulate the UI sending the response
    simulated_approval_responses[request_id] = {"approved": approved}
    return {"status": "success", "message": f"Received approval response for request ID: {request_id}"}

def read_file(path: str) -> Dict:
 # TODO: Add more complex permission logic here later. For now, assume all project files are readable.
    try:
        return {"content": open(path, "r").read(), "status": "success"}
    except FileNotFoundError: return {"error": f"File not found: {path}"}

def simulate_ui_approval(request_id: str, approved: bool) -> Dict:
    """
    Simulates an external UI sending an approval response.
    This tool is called by agents to simulate user interaction with the UI.

    Args:
        request_id: The ID of the approval request.
        approved: A boolean indicating whether the request was approved.

    Returns:
        A dictionary indicating the status of simulating the response.
    """
    return receive_approval_response(request_id, approved)

def find_code_usage(query: str, path: Optional[str] = None, logger: Logger = None) -> Dict:
    """

    Searches for the usage of a specific code element within the project.

    Args:
        query: The code element to search for (e.g., function name, class name).
        path: An optional path to a specific file to search within. If None, searches the entire project.
        logger: An optional Logger object for logging.

    Returns:
        A dictionary containing the search results with context around each usage.
    """


    results = {"query": query, "usages": []}
    
    def search_in_file(filepath: str):
        try:
            lines = []
            with open(filepath, "r") as file:
                lines = file.readlines()

            for line_number, line in enumerate(lines):
                if query in line:
                    # Include a few lines of context
                    context_lines = []
                    for i in range(max(0, line_number - 2), min(len(lines), line_number + 3)):
                        context_lines.append(f"{i + 1}: {lines[i].rstrip()}")
                    results["usages"].append({
                        "file": filepath,
                        "line": line_number + 1,
                        "context": "\n".join(context_lines),
                    })
        except Exception as e:
            results["usages"].append(
                {"file": filepath, "error": f"Error processing file: {e}"}
            )

    if path :
        search_in_file(path)
    else:
        for root, _, files in os.walk("."):
            for file in files:
                if file.endswith((".py", ".ts", ".js", ".tsx")):
                    filepath = os.path.join(root, file)
                    search_in_file(filepath)

    return results

    
def modify_code_structure(path: str, prompt: str, logger:Logger = None) -> Dict:
    """
    Modifies the code structure in a file based on a prompt.

    Args:
        path: The path to the file to modify.
        prompt: The instructions for how to modify the code structure.
        logger: An optional Logger object for logging.

    Returns:
        A dictionary indicating the status of the operation (staged, approval_required, denied, or error).
        If staged or approval is required, includes the proposed changes.
    """
    # Define a standard data structure for approval requests
    approval_request = {
        "request_id": str(uuid.uuid4()),
    Args:
        path: The path to the file to modify.
        prompt: The instructions for how to modify the code structure.

    Returns:
        A dictionary indicating the success or failure of the operation.
    """
        "action_type": "modify_code_structure",
    try:
        with open(path, "r") as file:
            content = file.readlines()

        if "move function" in prompt.lower():            
            match = re.search(
                r"move function\s+(\w+)\s+from\s+([\w/.-]+)\s+to\s+([\w/.-]+)", prompt, re.IGNORECASE
            )

            if match:
                func_name, from_path, to_path = match.groups()
                if not os.path.exists(os.path.dirname(to_path)):
                    os.makedirs(os.path.dirname(to_path))
                if not os.path.exists(from_path):
                    return {"error": f"File not found: {from_path}"}
                if not os.path.exists(to_path):
                    return {"error": f"File not found: {to_path}"}


                from_file_content:List[str] = []
                try:
                    with open(from_path, "r") as f:
                        from_file_content = f.readlines()
                except Exception as e:
                    logging.error(f"Error reading file: {from_path}, Error: {e}")
                    return {"error": f"Error reading file: {from_path}, Error: {e}"}

                func_content = []
                in_function = False
                try:
                    for line in from_file_content:
                        if f"def {func_name}" in line or f"function {func_name}" in line or f"const {func_name}" in line:
                            in_function = True
                            func_content.append(line)
                        elif in_function and (line.startswith("def ") or line.startswith("function ") or line.startswith("const ")):
                            in_function = False
                            break
                        elif in_function:
                            func_content.append(line)
                except Exception as e:
                    logging.error(f"Error processing functions in the file: {from_path}, Error: {e}")
                    return {"error": f"Error processing functions in the file: {from_path}, Error: {e}"}

                if not func_content:
                    return {"error": f"Function {func_name} not found in {from_path}"}
                try:
                    with open(to_path, "a") as f:
                        f.writelines(func_content)
                    new_from_file_content=[]
                    for line in from_file_content[:]:
                        if line not in func_content:
                            new_from_file_content.append(line)
                    with open(from_path, "w") as f:
                        f.writelines(new_from_file_content)
                    
                    # Simulate needing approval for structural changes
                    requires_approval = True
                    if requires_approval:
                        proposed_changes = {
                            "type": "move_function",
                            "details": {
                                "function_name": func_name,
                                "from_path": from_path,
                                "to_path": to_path
                            }
                        }
                        print(f"Approval request for modifying code structure: {approval_request}") # Simulate sending to UI
                        while approval_request["request_id"] not in simulated_approval_responses:
                            time.sleep(1) # Simulate waiting

                        response = simulated_approval_responses.pop(approval_request["request_id"])
                        if not response.get("approved", False):
                            return {"status": "denied", "message": "User denied code structure modification."}
                    return {
                        "status": "success",
                        "message": f"Moved function '{func_name}' from '{from_path}' to '{to_path}'",
                    }
                except Exception as e:
                    logging.error(f"Error modifying files: {from_path} or {to_path}, Error: {e}")
                    return {"error": f"Error modifying files: {from_path} or {to_path}, Error: {e}"}
            else:
                return {"error": "Invalid move function prompt format."}
        elif "create a new file" in prompt.lower() and "move" in prompt.lower():            
            match = re.search(r"create a new file named\s+([\w/.-]+)\s+and move all functions related to\s+(.+)\s+there", prompt, re.IGNORECASE)
            if match:
                to_path, function_concept = match.groups()                
                
                if not os.path.exists(path):
                    return {"error": f"File not found: {path}"}

                
                try:
                    from_file_content:List[str] = []
                    with open(path, "r") as f:
                        from_file_content = f.readlines()
                except Exception as e:
                    logging.error(f"Error reading file: {path}, Error: {e}")
                    return {"error": f"Error reading file: {path}, Error: {e}"}
                
                functions_to_move = []
                try:
                    tree = ast.parse("".join(from_file_content))
                    for node in ast.walk(tree):
                        if isinstance(node, ast.FunctionDef):
                            if function_concept.lower() in node.name.lower():
                                functions_to_move.append(node.name)                    
                except Exception as e:
                    logging.error(f"Error parsing functions in file: {path}, Error: {e}")
                    return {"error": f"Error parsing functions in file: {path}, Error: {e}"}
                
                if not os.path.exists(os.path.dirname(to_path)):
                    os.makedirs(os.path.dirname(to_path))
                
                try:
                    with open(to_path, "w") as f:
                        pass

                    for func_name in functions_to_move:
                        func_content = []
                        in_function = False
                        for line in from_file_content:
                            if f"def {func_name}" in line or f"function {func_name}" in line or f"const {func_name}" in line:
                                in_function = True
                                func_content.append(line)
                            elif in_function and (line.startswith("def ") or line.startswith("function ") or line.startswith("const ")):
                                in_function = False
                                break
                            elif in_function:
                                func_content.append(line)
                        if not func_content:
                            return {"error": f"Function {func_name} not found in {path}"}
                        
                        with open(to_path, "a") as f:
                            f.writelines(func_content)
                        from_file_content = [line for line in from_file_content if line not in func_content]
                except Exception as e:
                    logging.error(f"Error modifying files: {path} or {to_path}, Error: {e}")
                    return {"status": "error", "error": f"Error modifying files: {path} or {to_path}, Error: {e}"}
                
                with open(path, "w") as f:
                    f.writelines(from_file_content)
                
                # Simulate needing approval for structural changes
                requires_approval = True
                if requires_approval:
                    proposed_changes = {
                        "type": "create_file_and_move_functions",
                        "details": {
                            "from_path": path,
                            "to_path": to_path,
                            "functions_moved": functions_to_move
                        }
                    }
                    print(f"Approval request for modifying code structure: {approval_request}") # Simulate sending to UI
                    while approval_request["request_id"] not in simulated_approval_responses:
                        time.sleep(1) # Simulate waiting

                return {
                    "status": "success",
                    "message": f"Moved functions related to '{function_concept}' from '{path}' to '{to_path}'",
                }
            else:           
                return {"error": "Invalid move function prompt format."}
        else:
            return {"error": "Unsupported code modification prompt."}
    except FileNotFoundError:
        return {"error": f"File not found: {path}"}    
    except Exception as e:
        return {"error": f"Error modifying code: {e}"}

def use_llm(prompt: str, logger: Logger = None) -> Dict:
    return {"response": f"Response for: {prompt}"}


def observe_application(target: str) -> Dict:
    """
    Observes the running application using simulated DevTools.

    Args:
        target: The specific aspect to observe ('console', 'network', 'dom').

    Returns:
        A dictionary containing the observation data or an error message.
    """
    if target == 'console':
        return get_console_logs()
    elif target == 'network':
        return get_network_requests()
    elif target == 'dom':
        return get_dom_structure()
    else:
        return {"error": f"Unknown observation target: {target}"}




class TestTools(unittest.TestCase):
    def setUp(self):
        # Create dummy files for testing
        os.makedirs("test_dir", exist_ok=True)
        with open("test_dir/file1.py", "w") as f:
            f.write("def test_function():\n    print('Hello')\n\nclass MyClass:\n    pass\nimport os")

        with open("test_dir/file2.txt", "w") as f:
            f.write("This is a test text file.")

        with open("test_dir/file4.ts", "w") as f:
            f.write("const test_function4 = () => {\n    console.log('Hello4')\n}")

        with open("test_dir/file3.py", "w") as f:
            f.write("def test_function2():\n    print('Hello2')\n\ndef mood_log_function():\n   print('Mood log')\n\ndef process_mood_log():\n   print('Processing mood log')")

        with open("test_dir/file5.js", "w") as f:
            f.write("function test_function5(){\n    console.log('Hello5')\n}")
        with open("test_dir/file6.py", "w") as f:
            f.write("@test_decorator\ndef test_function6():\n    print('Hello6')\n")

    def tearDown(self):
        # Clean up dummy files (optional)
        shutil.rmtree("test_dir")
        if os.path.exists("test_dir/mood"):
             shutil.rmtree("test_dir/mood")
        if os.path.exists("test_dir/file2.txt"):
            with open("test_dir/file2.txt", "w") as f:
                f.write("This is a test text file.")
    def test_agent(self):
        memory = Memory()
        agent = Agent("Test Agent", memory, logger, [])
        message = Message("Test Sender", "Test Agent", MessageType.OBSERVATION, {"content": "Test message"})
        response = agent.receive_message(message)
        self.assertEqual(response, {"message": "Message received and procesed", "status": "success"})
        self.assertIsNotNone(agent.use_llm("Test prompt"))
        trigger = Trigger("test_trigger", "test_trigger", [], "new_message")
        agent.add_trigger(trigger)
        agent.execute_trigger("new_message")
        

    def test_get_file_content_summary(self):
        self.assertEqual(get_file_content_summary("test_dir/file1.py")["status"], "success")
        self.assertEqual(get_file_content_summary("test_dir/file2.txt")["status"], "success")
        self.assertIn("error", get_file_content_summary("test_dir/nonexistent.txt", memory))
        self.assertEqual(get_file_content_summary("test_dir/file4.ts", memory)["status"], "success")
        self.assertEqual(get_file_content_summary("test_dir/file6.py", memory)["status"], "success")
        self.assertIn("text_summary", get_file_content_summary("test_dir/file6.py", memory)["summary"])

    def test_get_file_content_summary_errors(self):
        memory = Memory()
        result = get_file_content_summary("test_dir/nonexistent.txt", memory)
        self.assertIn("error", result)
        self.assertIn("File not found", result["error"])
        

    def test_find_code_usage(self):
        logger = Logger()
        self.assertEqual(find_code_usage("test_function", "test_dir/file1.py", logger)["query"], "test_function")
        result = find_code_usage("test_function2", logger=logger)
        self.assertTrue(len(result["usages"]) > 0)
        self.assertTrue(len(find_code_usage("print", logger=logger)["usages"]) > 0)
        self.assertTrue(len(find_code_usage("test_function5", path="test_dir/file5.js", logger=logger)["usages"]) > 0)
        self.assertEqual(len(find_code_usage("nonexistent", logger=logger)["usages"]), 0)

    def test_modify_code_structure(self):
        logger = Logger()
        self.assertEqual(
            modify_code_structure(
                "test_dir/file1.py",
                "move function test_function from test_dir/file1.py to test_dir/file2.txt",
                logger=logger
            )["status"], "success"            
        )
        self.assertEqual(
            modify_code_structure(
                "test_dir/file3.py",
                "create a new file named test_dir/mood/mood.py and move all functions related to mood log there",
            )["status"], "success"
        )
        self.assertIn("error", modify_code_structure("test_dir/file3.py", "move function test_function from test_dir/file1.py to nonexistent.txt", logger=logger))
        self.assertIn("error", modify_code_structure("test_dir/file3.py", "invalid move prompt", logger=logger))
        self.assertIn("error", modify_code_structure("nonexistent.py", "move function test_function from test_dir/file1.py to test_dir/file2.txt", logger=logger))

    def test_observe_application(self):
        self.assertEqual(observe_application("console")["status"], "success")
        self.assertTrue(len(observe_application("console")["logs"]) > 0)
        self.assertEqual(observe_application("network")["status"], "success")
        self.assertTrue(len(observe_application("network")["requests"]) > 0)
        self.assertEqual(observe_application("dom")["status"], "success")
        self.assertIn("tag", observe_application("dom")["dom"])

    def test_observe_application_errors(self):
        result = observe_application("invalid_target", memory=Memory()) # Added memory for consistency
        self.assertIn("error", result)
        self.assertIn("Unknown observation target", result["error"])
    
    def test_natural_language_write_file(self): # Removed memory argument
        # Test writing to a non-sensitive file (should succeed)
        result_success = natural_language_write_file("test_dir/new_file.txt", "Write some text here.")
        self.assertEqual(result_success["status"], "success")

    def test_get_dependencies(self):
        # Test a file with simulated dependencies
        result = get_dependencies("test_dir/file1.py")
        self.assertEqual(result["status"], "success")
        self.assertTrue(len(result["dependencies"]) > 0)
        self.assertIn("os", result["dependencies"])

    def test_run_static_analysis(self):
        # Test a file with a simulated error
        result_error = run_static_analysis("example_error.py")
        self.assertEqual(result_error["status"], "success")
        self.assertTrue(len(result_error["issues"]) > 0)

        # Test a file with no simulated issues
        result_no_issues = run_static_analysis("clean_file.py")
        self.assertEqual(result_no_issues["status"], "success")
        # Test writing to a sensitive file (should require approval)
        result_approval = natural_language_write_file("test_dir/sensitive_config.txt", "Update configuration.")
        self.assertEqual(result_approval["status"], "approval_required")

    def test_run_terminal_command(self):
        # Test a command that should require approval
        result_approval = run_terminal_command("rm -rf /")
        self.assertEqual(result_approval["status"], "pending_approval")

        # Test an allowed command that doesn't require explicit approval
        result_success = run_terminal_command("ls", require_approval=False)
        self.assertEqual(result_success["status"], "success")

if __name__ == "__main__":
    unittest.main()
