from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from bson import ObjectId
from app.database import get_database
from app.models.credential import Credential, CredentialCreate
from app.api.auth import get_current_user
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/companies/{company_id}/credentials", tags=["credentials"])

class CredentialResponse(BaseModel):
    id: str
    name: str
    provider: str
    type: str
    created_at: datetime
    last_used: datetime = None
    is_active: bool
    fields: dict
    environments: List[str]

class EnvironmentAssignment(BaseModel):
    environments: List[str]

@router.post("/", response_model=CredentialResponse)
async def create_credential(
    company_id: str,
    credential_data: CredentialCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Crear una nueva credencial"""
    
    # Verificar que el usuario pertenece a la compañía
    if str(current_user.company_id) != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para acceder a esta compañía"
        )
    
    # Determinar el tipo de credencial basado en el proveedor
    credential_types = {
        'aws': 'Access Key',
        'gcp': 'Service Account',
        'azure': 'Service Principal'
    }
    
    try:
        # Encriptar campos sensibles
        encrypted_fields = Credential.set_encrypted_fields(credential_data.fields)
        
        # Crear documento de credencial
        credential_doc = {
            "name": credential_data.name,
            "provider": credential_data.provider,
            "credential_type": credential_types.get(credential_data.provider, 'Unknown'),
            "encrypted_fields": encrypted_fields,
            "company_id": ObjectId(company_id),
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_used": None,
            "environments": [ObjectId(env_id) for env_id in credential_data.environments]
        }
        
        # Insertar en MongoDB
        result = await db.credentials.insert_one(credential_doc)
        credential_doc["_id"] = result.inserted_id
        
        # Retornar la respuesta con campos enmascarados
        return CredentialResponse(
            id=str(credential_doc["_id"]),
            name=credential_doc["name"],
            provider=credential_doc["provider"],
            type=credential_doc["credential_type"],
            created_at=credential_doc["created_at"],
            last_used=credential_doc["last_used"],
            is_active=credential_doc["is_active"],
            fields=Credential.get_masked_fields(credential_doc["encrypted_fields"]),
            environments=[str(env_id) for env_id in credential_doc["environments"]]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear la credencial: {str(e)}"
        )

@router.get("/", response_model=List[CredentialResponse])
async def get_credentials(
    company_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Obtener todas las credenciales de la compañía"""
    
    if str(current_user.company_id) != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para acceder a esta compañía"
        )
    
    credentials_cursor = db.credentials.find({"company_id": ObjectId(company_id)})
    credentials = []
    
    async for cred_doc in credentials_cursor:
        credentials.append(CredentialResponse(
            id=str(cred_doc["_id"]),
            name=cred_doc["name"],
            provider=cred_doc["provider"],
            type=cred_doc["credential_type"],
            created_at=cred_doc["created_at"],
            last_used=cred_doc.get("last_used"),
            is_active=cred_doc["is_active"],
            fields=Credential.get_masked_fields(cred_doc["encrypted_fields"]),
            environments=[str(env_id) for env_id in cred_doc.get("environments", [])]
        ))
    
    return credentials

@router.put("/{credential_id}/environments")
async def assign_environments(
    company_id: str,
    credential_id: str,
    assignment: EnvironmentAssignment,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Asignar ambientes a una credencial"""
    
    if str(current_user.company_id) != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para acceder a esta compañía"
        )
    
    # Verificar que la credencial existe y pertenece a la compañía
    credential = await db.credentials.find_one({
        "_id": ObjectId(credential_id),
        "company_id": ObjectId(company_id)
    })
    
    if not credential:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credencial no encontrada"
        )
    
    # Actualizar los ambientes
    await db.credentials.update_one(
        {"_id": ObjectId(credential_id)},
        {
            "$set": {
                "environments": [ObjectId(env_id) for env_id in assignment.environments],
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Ambientes asignados correctamente"}

@router.delete("/{credential_id}")
async def delete_credential(
    company_id: str,
    credential_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Eliminar una credencial"""
    
    if str(current_user.company_id) != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para acceder a esta compañía"
        )
    
    result = await db.credentials.delete_one({
        "_id": ObjectId(credential_id),
        "company_id": ObjectId(company_id)
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credencial no encontrada"
        )
    
    return {"message": "Credencial eliminada correctamente"}
