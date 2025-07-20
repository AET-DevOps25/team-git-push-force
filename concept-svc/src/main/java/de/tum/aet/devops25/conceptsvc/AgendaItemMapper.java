package de.tum.aet.devops25.conceptsvc;

import de.tum.aet.devops25.api.generated.model.AgendaItem;

public class AgendaItemMapper {

    // DTO → Entity
    public static AgendaItemEntity toEntity(AgendaItem dto) {
        if (dto == null) {
            return null;
        }
        
        AgendaItemEntity entity = new AgendaItemEntity();
        
        // Only set ID if it's provided in the DTO
        // If ID is null, JPA will generate a new UUID automatically
        if (dto.getId() != null) {
            entity.setId(dto.getId());
        }
        
        entity.setTime(dto.getTime());
        entity.setTitle(dto.getTitle());
        entity.setDescription(dto.getDescription());
        
        // Enum conversion: API DTO enum → Entity enum
        if (dto.getType() != null) {
            entity.setType(AgendaItemType.valueOf(dto.getType().getValue()));
        }
        
        entity.setSpeaker(dto.getSpeaker());
        entity.setDuration(dto.getDuration());
        
        // Note: concept reference is set by parent ConceptMapper, not here
        return entity;
    }

    // Entity → DTO
    public static AgendaItem toDto(AgendaItemEntity entity) {
        if (entity == null) {
            return null;
        }
        
        AgendaItem dto = new AgendaItem();
        dto.setId(entity.getId());
        dto.setTime(entity.getTime());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        
        // Enum conversion: Entity enum → API DTO enum
        if (entity.getType() != null) {
            dto.setType(AgendaItem.TypeEnum.fromValue(entity.getType().name()));
        }
        
        dto.setSpeaker(entity.getSpeaker());
        dto.setDuration(entity.getDuration());
        
        // Note: concept reference not mapped to avoid circular dependency
        return dto;
    }
} 