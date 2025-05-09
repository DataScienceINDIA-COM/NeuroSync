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
from tools.trigger import Trigger


def get_file_content_summary(path: str, memory: Memory) -> Dict:
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
    
    try:
        if path.endswith((".py", ".js", ".ts", ".tsx")):
            try:
                tree = ast.parse(content)
                summary = {
                    "functions": [
                        node.name
                        for node in ast.walk(tree)
                        if isinstance(node, ast.FunctionDef)
                    ],
                    "classes": [
                        node.name
                        for node in ast.walk(tree)
                        if isinstance(node, ast.ClassDef)
                    ],
                    "imports": [
                        node.module if isinstance(node, ast.ImportFrom) else node.names[0].name
                        for node in ast.walk(tree)
                        if isinstance(node, (ast.Import, ast.ImportFrom))
                    ],
                }
            except Exception as e:
                error_msg = f"Error parsing file as AST: {path}, Error: {e}"
                logging.error(error_msg)
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
                "text_summary": content[:200] + "..." if len(content) > 200 else content
            }
        else:
            summary = {"unknown_type": content[:200] + "..." if len(content) > 200 else content}

        return {"path": path, "summary": summary, "status": "success"}
    
    except FileNotFoundError:
        return {"error": f"File not found: {path}"}
    except Exception as e:
        return {"error": f"Error processing file: {e}"}


def find_code_usage(query: str, path: Optional[str] = None, logger: Logger = None) -> Dict:
    """


    Searches for the usage of a specific code element within the project.

    Args:
        query: The code element to search for (e.g., function name, class name).
        path: An optional path to a specific file to search within. If None, searches the entire project.

    Returns:
        A dictionary containing the search results.
    """


    results = {"query": query, "usages": []}
    
    def search_in_file(filepath: str):
        try:
            with open(filepath, "r") as file:
                for line_number, line in enumerate(file):
                    if query in line and ("def " + query in line or "class " + query in line or query + "(" in line or "const " + query in line):
                        results["usages"].append(
                            {
                                "file": filepath,
                                "line": line_number + 1,
                                "content": line.strip(),
                            }
                        )
                    elif query in line and ("def " + query not in line and "class " + query not in line and query + "(" not in line and "const " + query not in line):
                         results["usages"].append(
                            {
                                "file": filepath,
                                "line": line_number + 1,
                                "content": line.strip() + " (Used but not defined)",
                            }
                        )
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

    Returns:
        A dictionary indicating the success or failure of the operation.
    """
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
                    return {"error": f"Error modifying files: {path} or {to_path}, Error: {e}"}
                
                with open(path, "w") as f:
                    f.writelines(from_file_content)

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
        memory = Memory()
        self.assertEqual(get_file_content_summary("test_dir/file1.py", memory)["status"], "success")
        self.assertEqual(get_file_content_summary("test_dir/file2.txt", memory)["status"], "success")
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
        self.assertTrue(len(find_code_usage("test_function2", logger=logger)["usages"]) > 0)
        self.assertTrue(len(find_code_usage("print", logger=logger)["usages"]) > 0)
        self.assertTrue(len(find_code_usage("test_function5", logger=logger)["usages"]) > 0)
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

if __name__ == "__main__":
    unittest.main()
