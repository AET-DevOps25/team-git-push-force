package de.tum.aet.devops25.conceptsvc;

import java.util.ArrayList;
import java.util.List;

import de.tum.aet.devops25.api.generated.model.EventDetails;

public class EventDetailsMapper {

    // DTO → Entity
    public static EventDetailsEntity toEntity(EventDetails dto) {
        if (dto == null) {
            return null;
        }
        
        EventDetailsEntity entity = new EventDetailsEntity();
        entity.setTheme(dto.getTheme());
        
        // Enum conversion: API DTO enum → Entity enum
        if (dto.getFormat() != null) {
            entity.setFormat(EventFormat.valueOf(dto.getFormat().getValue()));
        }
        
        entity.setCapacity(dto.getCapacity());
        entity.setDuration(dto.getDuration());
        entity.setStartDate(dto.getStartDate());
        entity.setEndDate(dto.getEndDate());
        entity.setTargetAudience(dto.getTargetAudience());
        entity.setLocation(dto.getLocation());
        
        // Collection mapping with null safety
        entity.setObjectives(dto.getObjectives() != null ? new ArrayList<>(dto.getObjectives()) : new ArrayList<>());
        
        return entity;
    }

    // Entity → DTO
    public static EventDetails toDto(EventDetailsEntity entity) {
        if (entity == null) {
            return null;
        }
        
        EventDetails dto = new EventDetails();
        dto.setTheme(entity.getTheme());
        
        // Enum conversion: Entity enum → API DTO enum
        if (entity.getFormat() != null) {
            dto.setFormat(EventDetails.FormatEnum.fromValue(entity.getFormat().name()));
        }
        
        dto.setCapacity(entity.getCapacity());
        dto.setDuration(entity.getDuration());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setTargetAudience(entity.getTargetAudience());
        dto.setLocation(entity.getLocation());
        
        // Collection mapping with null safety
        dto.setObjectives(entity.getObjectives() != null ? new ArrayList<>(entity.getObjectives()) : new ArrayList<>());
        
        return dto;
    }
} 