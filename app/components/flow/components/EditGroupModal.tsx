import React from 'react';

interface EditingGroupInfo {
  id: string;
  label: string;
}

interface EditGroupModalProps {
  editingGroup: EditingGroupInfo | null;
  onSaveGroupName: (name: string) => void;
  onClose: () => void;
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({
  editingGroup,
  onSaveGroupName,
  onClose,
}) => {
  if (!editingGroup) return null;

  const handleSave = (inputElement: HTMLInputElement | null) => {
    if (inputElement) {
      onSaveGroupName(inputElement.value);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          width: '300px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px' }}>
          Edit Group Name
        </h3>
        <input
          type="text"
          defaultValue={editingGroup.label}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            marginBottom: '16px',
          }}
          autoFocus
          onKeyDown={e => {
            if (e.key === 'Enter') {
              handleSave(e.target as HTMLInputElement);
            }
            if (e.key === 'Escape') {
              onClose();
            }
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f5f5f5',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={e => handleSave(e.currentTarget.parentElement?.parentElement?.querySelector('input') || null)}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#0088ff',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
