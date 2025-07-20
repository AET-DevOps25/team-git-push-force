package de.tum.aet.devops25.conceptsvc;

import de.tum.aet.devops25.api.generated.model.Speaker;

public class SpeakerMapper {

    // DTO → Entity
    public static SpeakerEntity toEntity(Speaker dto) {
        if (dto == null) {
            return null;
        }
        
        SpeakerEntity entity = new SpeakerEntity();
        
        // Only set ID if it's provided in the DTO
        // If ID is null, JPA will generate a new UUID automatically
        if (dto.getId() != null) {
            entity.setId(dto.getId());
        }
        
        entity.setName(dto.getName());
        entity.setExpertise(dto.getExpertise());
        entity.setSuggestedTopic(dto.getSuggestedTopic());
        entity.setBio(dto.getBio());
        entity.setConfirmed(dto.getConfirmed());
        
        // Note: concept reference is set by parent ConceptMapper, not here
        return entity;
    }

    // Entity → DTO
    public static Speaker toDto(SpeakerEntity entity) {
        if (entity == null) {
            return null;
        }
        
        Speaker dto = new Speaker();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setExpertise(entity.getExpertise());
        dto.setSuggestedTopic(entity.getSuggestedTopic());
        dto.setBio(entity.getBio());
        dto.setConfirmed(entity.getConfirmed());
        
        // Note: concept reference not mapped to avoid circular dependency
        return dto;
    }
} 