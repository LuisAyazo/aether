from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId
from cryptography.fernet import Fernet
import os
import json
from app.models.user import PyObjectId

class CredentialBase(BaseModel):
    name: str
    provider: str  # aws, gcp, azure
    credential_type: str  # access_key, service_account, etc.
    encrypted_fields: str  # JSON encriptado con los campos sensibles
    is_active: bool = True

class CredentialCreate(BaseModel):
    name: str
    provider: str
    fields: Dict[str, str]  # Campos sin encriptar que serán procesados
    environments: List[str] = []

class CredentialUpdate(BaseModel):
    name: Optional[str] = None
    provider: Optional[str] = None
    credential_type: Optional[str] = None
    encrypted_fields: Optional[str] = None
    is_active: Optional[bool] = None

class CredentialInDB(CredentialBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    company_id: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_used: Optional[datetime] = None
    environments: List[PyObjectId] = []  # Lista de ObjectIds de ambientes
    
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: lambda v: str(v),
            PyObjectId: lambda v: str(v),
            datetime: lambda v: v.isoformat()
        }

class Credential(BaseModel):
    id: str
    company_id: str
    name: str
    provider: str
    credential_type: str
    encrypted_fields: Dict[str, Any] = {}  # For API responses
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    last_used: Optional[datetime] = None
    environments: List[str] = []  # Lista de ObjectIds como strings
    
    class Config:
        from_attributes = True

class CredentialResponse(BaseModel):
    id: str
    company_id: str
    name: str
    provider: str
    credential_type: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_used: Optional[datetime] = None
    environments: List[str] = []
    
    class Config:
        from_attributes = True

# Encryption utility class
class CredentialEncryption:
    def __init__(self):
        self.encryption_key = os.getenv('CREDENTIAL_ENCRYPTION_KEY')
        if not self.encryption_key:
            raise ValueError("CREDENTIAL_ENCRYPTION_KEY not set in environment")
        
    def encrypt_fields(self, fields: dict) -> str:
        """Encrypt sensitive fields"""
        fernet = Fernet(self.encryption_key.encode())
        encrypted_data = fernet.encrypt(json.dumps(fields).encode())
        return encrypted_data.decode()
    
    def decrypt_fields(self, encrypted_fields: str) -> dict:
        """Decrypt sensitive fields"""
        fernet = Fernet(self.encryption_key.encode())
        decrypted_data = fernet.decrypt(encrypted_fields.encode())
        return json.loads(decrypted_data.decode())

# Global encryption instance
credential_encryption = CredentialEncryption()
