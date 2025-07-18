import time
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta


class Message:
    """Simple message class for conversation history"""
    
    def __init__(self, role: str, content: str, timestamp: datetime = None):
        """
        Initialize a message
        
        Args:
            role: The role of the message sender (user or assistant)
            content: The content of the message
            timestamp: The timestamp of the message (default: current time)
        """
        if role not in ["user", "assistant"]:
            raise ValueError(f"Invalid role: {role}. Must be 'user' or 'assistant'")
            
        self.role = role
        self.content = content
        self.timestamp = timestamp or datetime.now()


class ConversationHistoryService:
    """Service for storing and retrieving conversation history"""

    def __init__(self, ttl_hours: int = 24):
        """
        Initialize the conversation history service
        
        Args:
            ttl_hours: Time-to-live for conversation history in hours (default: 24)
        """
        # Dictionary to store conversation history: {conversation_id: (last_access_time, messages)}
        self._conversations: Dict[str, Tuple[float, List[Message]]] = {}
        self.ttl_seconds = ttl_hours * 3600  # Convert hours to seconds
    
    def add_message(self, conversation_id: str, role: str, content: str) -> None:
        """
        Add a message to the conversation history
        
        Args:
            conversation_id: The ID of the conversation
            role: The role of the message sender (user or assistant)
            content: The content of the message
        """
        # Create message object
        message = Message(
            role=role,
            content=content,
            timestamp=datetime.now()
        )
        
        # Get existing messages or create new list
        current_time = time.time()
        if conversation_id in self._conversations:
            _, messages = self._conversations[conversation_id]
        else:
            messages = []
        
        # Add message to list
        messages.append(message)
        
        # Update conversation with new message list and current time
        self._conversations[conversation_id] = (current_time, messages)
        
        # Clean up old conversations
        self._cleanup_old_conversations()
    
    def get_messages(self, conversation_id: str) -> List[Message]:
        """
        Get all messages for a conversation
        
        Args:
            conversation_id: The ID of the conversation
            
        Returns:
            List of messages in the conversation, or empty list if conversation not found
        """
        # Update access time and return messages if conversation exists
        if conversation_id in self._conversations:
            _, messages = self._conversations[conversation_id]
            self._conversations[conversation_id] = (time.time(), messages)
            return messages
        
        # Return empty list if conversation not found
        return []
    
    def get_formatted_history(self, conversation_id: str) -> Tuple[str, List[Tuple[str, str]]]:
        """
        Get formatted conversation history for use in LLM service
        
        Args:
            conversation_id: The ID of the conversation
            
        Returns:
            Tuple containing:
            - String representation of conversation history
            - List of tuples (user_message, assistant_response) for LangChain
        """
        messages = self.get_messages(conversation_id)
        
        # Format as string
        chat_history_lines = []
        
        # Format as tuples for LangChain
        chat_history_tuples = []
        
        # Group messages by role for proper conversation flow
        current_user_message = ""
        current_assistant_message = ""
        
        for msg in messages:
            if msg.role == "user":
                # If we have a complete pair, add it to tuples
                if current_user_message and current_assistant_message:
                    chat_history_tuples.append((current_user_message, current_assistant_message))
                    current_user_message = ""
                    current_assistant_message = ""
                
                # Set the current user message
                current_user_message = msg.content
                chat_history_lines.append(f"User: {msg.content}")
            elif msg.role == "assistant":
                current_assistant_message = msg.content
                chat_history_lines.append(f"Assistant: {msg.content}")
        
        # Add the last pair if we have both parts
        if current_user_message and current_assistant_message:
            chat_history_tuples.append((current_user_message, current_assistant_message))
        
        chat_history_str = "\n".join(chat_history_lines)
        
        return chat_history_str, chat_history_tuples
    
    def _cleanup_old_conversations(self) -> None:
        """Remove conversations that haven't been accessed for longer than TTL"""
        current_time = time.time()
        conversation_ids_to_remove = []
        
        # Find conversations to remove
        for conversation_id, (last_access_time, _) in self._conversations.items():
            if current_time - last_access_time > self.ttl_seconds:
                conversation_ids_to_remove.append(conversation_id)
        
        # Remove conversations
        for conversation_id in conversation_ids_to_remove:
            del self._conversations[conversation_id]
            print(f"Removed conversation {conversation_id} due to TTL expiration")
    
    def clear_conversation(self, conversation_id: str) -> bool:
        """
        Clear the history for a specific conversation
        
        Args:
            conversation_id: The ID of the conversation to clear
            
        Returns:
            True if conversation was found and cleared, False otherwise
        """
        if conversation_id in self._conversations:
            del self._conversations[conversation_id]
            return True
        return False
    
    def get_conversation_count(self) -> int:
        """Get the number of active conversations"""
        return len(self._conversations)


# Create a singleton instance
conversation_history_service = ConversationHistoryService()