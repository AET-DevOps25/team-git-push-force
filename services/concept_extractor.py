    def _extract_json_from_text(self, text: str) -> dict:
        """Extract JSON object from text"""
        print("Extracting JSON from response text")
        # Look for JSON pattern in the text
        json_pattern = r'```json\s*(.*?)\s*```'
        json_match = re.search(json_pattern, text, re.DOTALL)

        if not json_match:
            # Try alternative pattern without the json tag
            json_pattern = r'```\s*(\{.*?\})\s*```'
            json_match = re.search(json_pattern, text, re.DOTALL)
            if json_match:
                print("Found JSON in code block without json tag")

        if not json_match:
            # Try to find JSON without code blocks
            # This pattern doesn't have a capturing group, so we need to handle it differently
            json_pattern = r'\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}'
            json_match = re.search(json_pattern, text, re.DOTALL)
            if json_match:
                print("Found JSON without code blocks")

        if json_match:
            try:
                # Parse the JSON
                if len(json_match.groups()) > 0:
                    # For patterns with capturing groups (first two patterns)
                    json_str = json_match.group(1)
                else:
                    # For pattern without capturing group (third pattern)
                    json_str = json_match.group(0)

                # Debug the extracted JSON string
                print(f"Extracted JSON string: {json_str[:100]}...")

                # Clean the JSON string - remove any trailing commas which can cause parsing errors
                json_str = re.sub(r',\s*([}\]])', r'\1', json_str)

                return json.loads(json_str)
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON: {e}")
                # Try to clean up the JSON string and try again
                try:
                    # Remove any trailing commas before closing braces or brackets
                    json_str = re.sub(r',\s*}', '}', json_str)
                    json_str = re.sub(r',\s*]', ']', json_str)
                    # Fix property names that aren't in quotes
                    json_str = re.sub(r'([{,])\s*([a-zA-Z0-9_]+)\s*:', r'\1"\2":', json_str)
                    print(f"Attempting to parse cleaned JSON: {json_str[:100]}...")
                    return json.loads(json_str)
                except Exception as cleanup_err:
                    print(f"Failed to parse JSON even after cleanup: {cleanup_err}")
                    # Try even more aggressive cleanup - extract key parts
                    try:
                        # Just get title and notes as minimum requirement
                        title_match = re.search(r'"title"\s*:\s*"([^"]+)"', json_str)
                        notes_match = re.search(r'"notes"\s*:\s*"([^"]+)"', json_str)

                        minimal_json = {
                            "title": title_match.group(1) if title_match else "Untitled Event",
                            "notes": notes_match.group(1) if notes_match else "Extracted from partial JSON"
                        }
                        print("Created minimal JSON from regex matches")
                        return minimal_json
                    except Exception:
                        print("All JSON extraction methods failed")
                        return {}
            except Exception as e:
                print(f"Unexpected error parsing JSON: {e}")
                return {}

        print("No JSON pattern found in response")
        return {}
