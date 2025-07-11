package de.tum.aet.devops25.conceptsvc;

import de.tum.aet.devops25.api.generated.model.Pricing;

public class PricingMapper {

    // DTO → Entity
    public static PricingEntity toEntity(Pricing dto) {
        if (dto == null) {
            return null;
        }
        
        PricingEntity entity = new PricingEntity();
        entity.setCurrency(dto.getCurrency());
        entity.setEarlyBird(dto.getEarlyBird());
        entity.setRegular(dto.getRegular());
        entity.setVip(dto.getVip());
        entity.setStudent(dto.getStudent());
        entity.setGroup(dto.getGroup());
        return entity;
    }

    // Entity → DTO
    public static Pricing toDto(PricingEntity entity) {
        if (entity == null) {
            return null;
        }
        
        Pricing dto = new Pricing();
        dto.setCurrency(entity.getCurrency());
        dto.setEarlyBird(entity.getEarlyBird());
        dto.setRegular(entity.getRegular());
        dto.setVip(entity.getVip());
        dto.setStudent(entity.getStudent());
        dto.setGroup(entity.getGroup());
        return dto;
    }
} 