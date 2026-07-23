import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

try:
    from routes import users
    print("SUCCESS: Imported routes.users without any errors!")
except Exception as e:
    import traceback
    traceback.print_exc()
    print("\n--- Diagnostic Details ---")
    print(f"Exception Type: {type(e).__name__}")
    print(f"Exception Message: {e}")
    # Inspect internal attributes of PydanticUndefinedAnnotation if it matches
    if e.__class__.__name__ == "PydanticUndefinedAnnotation":
        print(f"Undefined Name: {getattr(e, 'name', 'N/A')}")
