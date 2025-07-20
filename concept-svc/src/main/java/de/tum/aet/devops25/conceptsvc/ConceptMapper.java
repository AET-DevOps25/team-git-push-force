package de.tum.aet.devops25.conceptsvc;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import de.tum.aet.devops25.api.generated.model.Concept;
import de.tum.aet.devops25.api.generated.model.UpdateConceptRequest;

public class ConceptMapper {

    // DTO → Entity (full mapping for creation/retrieval)
    public static ConceptEntity toEntity(Concept dto) {
        if (dto == null) {
            return null;
        }
        
        ConceptEntity entity = new ConceptEntity();
        entity.setId(dto.getId());
        entity.setTitle(dto.getTitle());
        entity.setDescription(dto.getDescription());
        
        // Enum conversion: API DTO enum → Entity enum
        if (dto.getStatus() != null) {
            entity.setStatus(ConceptStatus.valueOf(dto.getStatus().getValue()));
        }
        
        entity.setUserId(dto.getUserId());
        entity.setNotes(dto.getNotes());
        entity.setVersion(dto.getVersion());
        entity.setCreatedAt(dto.getCreatedAt());
        entity.setUpdatedAt(dto.getUpdatedAt());
        entity.setLastModifiedBy(dto.getLastModifiedBy());
        
        // Simple collection - defensive copy
        entity.setTags(dto.getTags() != null ? new ArrayList<>(dto.getTags()) : new ArrayList<>());
        
        // Embedded entities
        entity.setEventDetails(EventDetailsMapper.toEntity(dto.getEventDetails()));
        entity.setPricing(PricingMapper.toEntity(dto.getPricing()));
        
        // Child collections with bidirectional relationship handling
        if (dto.getAgenda() != null) {
            List<AgendaItemEntity> agendaEntities = dto.getAgenda().stream()
                .map(AgendaItemMapper::toEntity)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
            // Set parent reference for bidirectional relationship
            agendaEntities.forEach(item -> item.setConcept(entity));
            entity.setAgenda(agendaEntities);
        } else {
            entity.setAgenda(new ArrayList<>());
        }
        
        if (dto.getSpeakers() != null) {
            List<SpeakerEntity> speakerEntities = dto.getSpeakers().stream()
                .map(SpeakerMapper::toEntity)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
            // Set parent reference for bidirectional relationship
            speakerEntities.forEach(speaker -> speaker.setConcept(entity));
            entity.setSpeakers(speakerEntities);
        } else {
            entity.setSpeakers(new ArrayList<>());
        }
        
        return entity;
    }

    // Entity → DTO (full mapping for responses)
    public static Concept toDto(ConceptEntity entity) {
        if (entity == null) {
            return null;
        }
        
        Concept dto = new Concept();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        
        // Enum conversion: Entity enum → API DTO enum
        if (entity.getStatus() != null) {
            dto.setStatus(Concept.StatusEnum.fromValue(entity.getStatus().name()));
        }
        
        dto.setUserId(entity.getUserId());
        dto.setNotes(entity.getNotes());
        dto.setVersion(entity.getVersion());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setLastModifiedBy(entity.getLastModifiedBy());
        
        // Simple collection - defensive copy
        dto.setTags(entity.getTags() != null ? new ArrayList<>(entity.getTags()) : new ArrayList<>());
        
        // Embedded entities
        dto.setEventDetails(EventDetailsMapper.toDto(entity.getEventDetails()));
        dto.setPricing(PricingMapper.toDto(entity.getPricing()));
        
        // Child collections (no concept reference to avoid circular dependency)
        if (entity.getAgenda() != null) {
            List<de.tum.aet.devops25.api.generated.model.AgendaItem> agendaDtos = entity.getAgenda().stream()
                .map(AgendaItemMapper::toDto)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
            dto.setAgenda(agendaDtos);
        } else {
            dto.setAgenda(new ArrayList<>());
        }
        
        if (entity.getSpeakers() != null) {
            List<de.tum.aet.devops25.api.generated.model.Speaker> speakerDtos = entity.getSpeakers().stream()
                .map(SpeakerMapper::toDto)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
            dto.setSpeakers(speakerDtos);
        } else {
            dto.setSpeakers(new ArrayList<>());
        }
        
        return dto;
    }

    // Partial update for PUT operations - only map non-null fields
    public static void updateEntityFromRequest(ConceptEntity entity, UpdateConceptRequest request) {
        if (entity == null || request == null) {
            return;
        }
        
        if (request.getTitle() != null) {
            entity.setTitle(request.getTitle());
        }
        
        if (request.getDescription() != null) {
            entity.setDescription(request.getDescription());
        }
        
        if (request.getStatus() != null) {
            entity.setStatus(ConceptStatus.valueOf(request.getStatus().getValue()));
        }
        
        if (request.getNotes() != null) {
            entity.setNotes(request.getNotes());
        }
        
        if (request.getTags() != null) {
            entity.setTags(new ArrayList<>(request.getTags()));
        }
        
        // Update embedded entities if provided
        if (request.getEventDetails() != null) {
            entity.setEventDetails(EventDetailsMapper.toEntity(request.getEventDetails()));
        }
        
        if (request.getPricing() != null) {
            entity.setPricing(PricingMapper.toEntity(request.getPricing()));
        }
        
        // Update child collections if provided
        if (request.getAgenda() != null) {
            // Clear existing and add new
            entity.getAgenda().clear();
            List<AgendaItemEntity> agendaEntities = request.getAgenda().stream()
                .map(AgendaItemMapper::toEntity)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
            agendaEntities.forEach(item -> item.setConcept(entity));
            entity.getAgenda().addAll(agendaEntities);
        }
        
        if (request.getSpeakers() != null) {
            // Clear existing and add new
            entity.getSpeakers().clear();
            List<SpeakerEntity> speakerEntities = request.getSpeakers().stream()
                .map(SpeakerMapper::toEntity)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
            speakerEntities.forEach(speaker -> speaker.setConcept(entity));
            entity.getSpeakers().addAll(speakerEntities);
        }
    }
} 